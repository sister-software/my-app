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

export type DataInitConstructorTypes = typeof Number | typeof String | typeof Boolean

type DefaultValueGetter = () => any

export interface DataInitDescriptor {
  required?: boolean
  type: DataInitConstructorTypes
  defaultValue?: number | string | boolean | DefaultValueGetter
}

export interface MyElementDataInit {
  [index: string]: DataInitConstructorTypes | DataInitDescriptor
}

export interface MyElementData {
  [index: string]: number | string | boolean
}

interface MyElement {
  styles?(css: ParseCSS): string
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

  static get data(): MyElementDataInit {
    return {
      foo: Number
    }
  }

  abstract template(html: ParseHTML): TemplateResult

  static get elementName() {
    // Fallback to class name.
    return camelToKebab(this.name)
  }

  static register() {
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
    this.setupData()
    const shadowRoot = this.attachShadow(this._constructor.options.shadowRoot)

    shadowRoot.appendChild(this.styleElement)
    shadowRoot.appendChild(this.contentElement)
    this.updateStyles()
  }

  private trackedAttributeToProperty: { [index: string]: string } = {}
  private trackedPropertyToAttribute: { [index: string]: string } = {}

  setupData() {
    const { data } = this._constructor
    const observedAttributes: string[] = []

    for (let propertyName in data) {
      let propertyDescriptor: DataInitDescriptor

      if (typeof data[propertyName] === 'function') {
        propertyDescriptor = {
          type: data[propertyName] as DataInitConstructorTypes
        }
      } else {
        propertyDescriptor = data[propertyName] as DataInitDescriptor
      }

      const attributeName = camelToKebab(propertyName)
      observedAttributes.push(attributeName)

      this.trackedAttributeToProperty[attributeName] = propertyName
      this.trackedPropertyToAttribute[propertyName] = attributeName

      Object.defineProperty(this, propertyName, {
        enumerable: true,
        get() {
          return this._data[propertyName]
        },
        set(value: any) {
          const self: MyElement = this // Fix TS's incomplete type inference.
          const assignedValue = (self._data[propertyName] = propertyDescriptor.type(value))

          switch (typeof assignedValue) {
            case 'boolean':
              if (assignedValue) self.setAttribute(attributeName, '')
              else self.removeAttribute(attributeName)
              break
            default:
              self.setAttribute(attributeName, String(assignedValue))
              break
          }

          if (this._hasInserted) {
            requestAnimationFrame(this.updateTemplate)
          }

          return value
        }
      })

      const { required, defaultValue } = propertyDescriptor
      let value: any = this.getAttribute(propertyName)

      if (typeof value === 'undefined') {
        switch (typeof defaultValue) {
          case 'undefined':
            if (required) {
              throw new Error(`${this._constructor.elementName}: property ${propertyName} is not defined.`)
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

    // TODO
    Object.defineProperty(this._constructor, 'observedAttributes', {
      enumerable: true,
      get() {
        return observedAttributes
      }
    })
  }

  attributeChangedCallback(attributeName: string, previousValue: string, currentValue: string) {
    console.log(attributeName, previousValue, currentValue)
    // (this as any)[attributeName] = currentValue
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
