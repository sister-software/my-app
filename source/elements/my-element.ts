import { html, render, TemplateResult } from '../../node_modules/lit-html/lit-html.js'
import css from '../helpers/parse-css.js'
import camelToKebab from '../helpers/camel-to-kebab.js'

// Reexport for developer convenience.
export { css }
export { html }
export type ParseHTML = typeof html
export type ParseCSS = typeof css

export interface MyElementOptions {
  shadowRoot: ShadowRootInit
}

// export type PropertyDescriptorConstructor = typeof Number | typeof String | typeof Boolean

type DefaultValueGetter = () => any

export interface PropertyDescriptorSpec {
  required?: boolean
  // type: PropertyDescriptorConstructor
  defaultValue?: number | string | boolean | DefaultValueGetter
  attributeName?: string
}

export class PropertyDescriptor {
  propertyName: string
  required: boolean
  // type: PropertyDescriptorConstructor
  defaultValue?: number | string | boolean | DefaultValueGetter
  attributeName: string
  constructor(propertyName: string, spec: PropertyDescriptorSpec = {}) {
    this.propertyName = propertyName
    this.required = !!spec.required
    // this.type = spec.type
    this.defaultValue = spec.defaultValue
    this.attributeName = camelToKebab(propertyName)
  }
}

export interface PropertyDescriptorInit {
  [propertyName: string]: PropertyDescriptorSpec
}

interface DataAccessor {
  assignedIn: null | 'setter' | 'attribute'
  value: any
}

export interface MyElementData {
  [index: string]: DataAccessor
}

interface MyElement {
  styles?(css: ParseCSS): string
  properties: string[] | PropertyDescriptorInit
}

abstract class MyElement extends HTMLElement {
  // [index: string]: any

  styleElement = document.createElement('style')
  contentElement = document.createElement('content-container')

  static get options(): MyElementOptions {
    return {
      shadowRoot: { mode: 'closed' }
    }
  }

  static get defaultStyles() {
    return css`
      /* Default styles BEGIN */
      :host {
        display: block;
        position: relative;
      }

      :host([hidden]) {
        display: none;
      }

      content-container {
        display: block;
      }
      /* Default styles END */
    `
  }

  static get properties(): PropertyDescriptorInit {
    return {}
  }

  static get propertyDescriptors() {
    const { properties } = this
    const propertyDescriptors: { [propertyName: string]: PropertyDescriptor } = {}

    if (Array.isArray(properties)) {
      properties.forEach(propertyName => {
        propertyDescriptors[propertyName] = new PropertyDescriptor(propertyName)
      })
    } else {
      for (let propertyName in properties) {
        let propertyDescriptorSpec = properties[propertyName]

        propertyDescriptors[propertyName] = new PropertyDescriptor(propertyName, propertyDescriptorSpec)
      }
    }

    return propertyDescriptors
  }

  abstract template(html: ParseHTML): TemplateResult

  static get elementName() {
    // Fallback to class name.
    let { name } = this

    if (document.currentScript) {
      const providedElementName = document.currentScript.getAttribute('element-name')

      if (providedElementName) {
        name = providedElementName
      }
    }

    return camelToKebab(name)
  }

  static register() {
    this.setupObservedAttributes()
    customElements.define(this.elementName, this)
  }

  private _hasInserted = false
  beforeInsertion = () => {}
  beforeRemoval = () => {}
  afterInsertion = () => {}
  afterRemoval = () => {}

  private _data: MyElementData = {}

  // Hack to fix TypeScript's lack of constructor inference.
  private get _constructor() {
    return this.constructor as typeof MyElement
  }

  constructor() {
    super()
    this.setupDataAccessors()
    const shadowRoot = this.attachShadow(this._constructor.options.shadowRoot)

    shadowRoot.appendChild(this.styleElement)
    shadowRoot.appendChild(this.contentElement)
    this.updateStyles()
  }

  // TODO: reference property descriptor directly.
  private trackedAttributeToProperty: { [index: string]: string } = {}
  private trackedPropertyToAttribute: { [index: string]: string } = {}

  static setupObservedAttributes() {
    const { propertyDescriptors } = this
    const observedAttributes = Object.keys(propertyDescriptors).map(
      propertyName => propertyDescriptors[propertyName].attributeName
    )

    Object.defineProperty(this, 'observedAttributes', {
      enumerable: true,
      get() {
        return observedAttributes
      }
    })
  }

  setupDataAccessors() {
    const { propertyDescriptors } = this._constructor

    for (let propertyName in propertyDescriptors) {
      const propertyDescriptor = propertyDescriptors[propertyName]
      const { required, defaultValue, attributeName } = propertyDescriptor

      this.trackedAttributeToProperty[attributeName] = propertyName
      this.trackedPropertyToAttribute[propertyName] = attributeName

      this._data[propertyName] = {
        value: undefined,
        assignedIn: null
      }

      Object.defineProperty(this, propertyName, {
        enumerable: true,
        get(): DataAccessor['value'] {
          const self: MyElement = this // Fix TS's incomplete type inference.
          const accessor = self._data[propertyName]
          return accessor.value
        },
        set(value: any) {
          const attributeName = this.trackedPropertyToAttribute[propertyName]
          const self: MyElement = this // Fix TS's incomplete type inference.

          return self.setAttribute(attributeName, value)
        }
      })

      let value: any = super.getAttribute(attributeName)

      if (typeof value === 'undefined' || value === null) {
        switch (typeof defaultValue) {
          case 'undefined':
            if (required) {
              throw new Error(`${this._constructor.elementName}: property ${propertyDescriptor} is not defined.`)
            }
            break
          case 'function':
            value = defaultValue()
            break
          default:
            value = defaultValue
        }
      }

      if (typeof value !== 'undefined' && value !== null) {
        ;(this as any)[propertyName] = value
      }
    }
  }

  setAttribute(attributeName: string, value: any) {
    const propertyName = this.trackedAttributeToProperty[attributeName]
    const { propertyDescriptors } = this._constructor
    const propertyDescriptor = propertyDescriptors[propertyName]

    // Attribute is tracked.
    if (propertyDescriptor) {
      const accessor = this._data[propertyName]
      accessor.value = value

      // Inform attributeChangedCallback assignment has already complete.
      accessor.assignedIn = 'attribute'
    }

    super.setAttribute(attributeName, JSON.stringify(value))

    window.requestAnimationFrame(this.updateTemplate)
    return value
  }

  getAttribute(attributeName: string): any {
    const { propertyDescriptors } = this._constructor
    const propertyName = this.trackedAttributeToProperty[attributeName]

    // Attribute is not tracked.
    if (!propertyName) {
      return super.getAttribute(attributeName)
    }

    return this._data[propertyName].value
  }

  attributeChangedCallback(attributeName: string, previousValue: string, currentValue: string) {
    console.log(attributeName, previousValue, currentValue)

    const { propertyDescriptors } = this._constructor
    const propertyName = this.trackedAttributeToProperty[attributeName]
    const propertyDescriptor = propertyDescriptors[propertyName]

    // Attribute is tracked.
    if (propertyDescriptor) {
      const accessor = this._data[propertyName]

      if (accessor.assignedIn === 'attribute') {
        // Attribute assignment lifecycle has completed.
        accessor.assignedIn = null
      } else {
        let parsedValue: any

        try {
          parsedValue = JSON.parse(currentValue)
        } catch (error) {
          parsedValue = currentValue
        }

        this.setAttribute(attributeName, parsedValue)
        return
      }
    }

    // const assignedValue = (this._data[propertyName] = propertyDescriptor.type(currentValue))
    // this._data[propertyName] = JSON.parse(currentValue)

    // debugger
    // switch (typeof assignedValue) {
    //   case 'boolean':
    //     if (assignedValue) self.setAttribute(attributeName, '')
    //     else self.removeAttribute(attributeName)
    //     break
    //   default:
    //     self.setAttribute(attributeName, String(assignedValue))
    //     break
    // }
    // const propertyName = this.trackedAttributeToProperty[attributeName]
    // if (!propertyName) return

    // debugger
    // ;(this as any)[propertyName] = currentValue
  }

  connectedCallback() {
    this.updateTemplate()
  }

  private updateStyles() {
    if (typeof this.styles !== 'function') return

    this.styleElement.innerHTML = [
      // TODO: Consider allowing adjustable default styles.
      this._constructor.defaultStyles,
      this.styles(css)
    ].join('\n')
  }

  private updateTemplate = () => {
    if (!this._hasInserted) {
      this.beforeInsertion()
    }

    render(this.template(html), this.contentElement)

    if (!this._hasInserted) {
      this._hasInserted = true
      this.afterInsertion()
    }
  }
}

export default MyElement
