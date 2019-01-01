import { html, render, TemplateResult } from '../node_modules/lit-html/lit-html.js'
import css from './helpers/parse-css.js'
import camelToKebab from './helpers/camel-to-kebab.js'
import kebabToCamel from './helpers/kebab-to-camel.js'
import deepExtend from './helpers/deep-extend.js'

// Reexport for developer convenience.
export { css }
export { html }
export type ParseHTML = typeof html
export type ParseCSS = typeof css

export enum LifeCycleEvents {
  beforeInsert = 'beforeinsert',
  afterInsert = 'afterinsert',
  beforeRemove = 'beforeremove',
  afterRemove = 'afterremove',
  beforeUpdate = 'beforeupdate',
  afterUpdate = 'afterupdate'
}

export type LifeCycleHandler<A> = ((this: CustomElement<A>, event: Event) => void) | null

export type AttributeValue = number | string | boolean | Array<any> | object | null

export interface AttributeCacheEntry {
  attributeName: string
  value: any
  assignedIn: null | 'setter' | 'attribute'
}

export interface CustomElementOptions {
  shadowRoot: ShadowRootInit
}

type ValueOfAttributes<A> = { [P in keyof A]: P }

interface SetAttributeOptions {
  parsed: boolean
}

interface CustomElement<A> {
  styles?(css: ParseCSS): string
  template(html: ParseHTML): TemplateResult
}
abstract class CustomElement<A> extends HTMLElement implements CustomElement<A> {
  styleElement = document.createElement('style')
  contentElement = document.createElement('content-container')

  attributeCache: Record<keyof A, AttributeCacheEntry>
  attributesProxy: A & NamedNodeMap
  revokeAttributeCacheProxy: () => void

  // -- Styles

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

  private updateStyles() {
    let providedStyles = ''

    if (typeof this.styles === 'function') {
      providedStyles = this.styles(css)
    }

    this.styleElement.innerHTML = [
      // TODO: Consider allowing adjustable default styles.
      this._constructor.defaultStyles,
      providedStyles
    ].join('\n')
  }

  // -- Templating

  private updateTemplate() {
    this.templateAnimationFrame = null

    const defaultPrevented = this.triggerEvent(LifeCycleEvents.beforeUpdate)

    if (defaultPrevented) return

    render(this.template(html), this.contentElement)

    this.triggerEvent(LifeCycleEvents.afterUpdate)
  }

  templateAnimationFrame: Promise<{}> | null = null

  /**
   * Schedules an template update on next animation frame.
   * Note that multiple attribute changes in the same frame will be batched in the same update.
   */
  async requestTemplateUpdate() {
    if (this.templateAnimationFrame) {
      return this.templateAnimationFrame
    }

    this.templateAnimationFrame = new Promise(resolve => {
      requestAnimationFrame(() => {
        this.updateTemplate()

        resolve()
      })
    })
  }

  // -- Events

  /**
   * Public callback executed before an element is inserted in the document.
   */
  onbeforeinsert: LifeCycleHandler<A> = null
  /**
   * Public callback executed after an element is inserted in the document.
   */
  onafterinsert: LifeCycleHandler<A> = null
  /**
   * Public callback executed before an element is removed from the document.
   * Invoking `event.preventDefault()` will prevent element removal.
   */
  onbeforeremove: LifeCycleHandler<A> = null
  /**
   * Public callback executed after an element is removed from the document.
   */
  onafterremove: LifeCycleHandler<A> = null

  /**
   * Public callback executed before an element's template is updated.
   */

  onbeforeupdate: LifeCycleHandler<A> = null

  /**
   * Public callback executed after an element's template is updated.
   */

  onafterupdate: LifeCycleHandler<A> = null

  /**
   * Called every time the element is inserted into the DOM.
   */
  connectedCallback() {
    this.updateStyles()
    this.updateTemplate()

    // TODO: on mount, parse attributes
    this.triggerEvent(LifeCycleEvents.afterInsert)
  }

  /**
   * Called every time the element is removed from the DOM. Useful for running clean up code.
   */
  disconnectedCallback() {
    this.triggerEvent(LifeCycleEvents.afterRemove, {
      cancelable: false
    })
    this.revokeAttributeCacheProxy()
  }

  /**
   * Triggers custom events related to the element.
   * @param eventName Lower case, single word event name.
   * @param options An optional CustomEventInit object describing the event's behavior.
   * @returns A boolean describing if the event was prevented by an event handler.
   */
  triggerEvent(eventName: string, options: CustomEventInit = {}) {
    eventName = eventName.toLowerCase()
    options = {
      cancelable: true,
      bubbles: true,
      ...options
    }

    const event = new CustomEvent(eventName, options)
    const propertyName = 'on' + eventName
    const assignedHandler: LifeCycleHandler<A> = (this as any)[propertyName]

    if (typeof assignedHandler === 'function') {
      assignedHandler.call(this, event)

      return event.defaultPrevented
    }

    return !this.dispatchEvent(event)
  }

  // --- Default HTMLElement overrides.

  remove() {
    const defaultPrevented = this.triggerEvent(LifeCycleEvents.beforeRemove)

    if (!defaultPrevented) {
      super.remove()
    }
  }

  get attributes() {
    return this.attributesProxy
  }

  setAttribute(
    attributeName: string,
    value: ValueOfAttributes<A> | string,
    options: SetAttributeOptions = { parsed: false }
  ) {
    const propertyName = kebabToCamel(attributeName) as keyof A

    // Set initial cache entry.
    if (!(propertyName in this.attributeCache)) {
      this.attributeCache[propertyName] = {
        attributeName: attributeName,
        assignedIn: null,
        value: undefined
      }
    }

    const attributeCacheEntry = this.attributeCache[propertyName]

    let parsedValue: any

    if (options.parsed) {
      parsedValue = value
    } else {
      try {
        parsedValue = JSON.parse(value as string)
      } catch (e) {
        parsedValue = value
      }
    }

    if (attributeCacheEntry.value === parsedValue) {
      return value
    }

    const parsedValueType = typeof parsedValue

    attributeCacheEntry.value = parsedValue
    attributeCacheEntry.assignedIn = 'attribute'

    // TODO: fix attributeChanged loop.
    if (parsedValueType === 'boolean') {
      if (parsedValue) {
        // Much like checkbox input elements,
        // boolean attributes are represented by their presence.
        super.setAttribute(attributeName, '')
      } else {
        super.removeAttribute(attributeName)
      }
    } else if (Array.isArray(parsedValue)) {
      // parsedValue = this.createObservableArray(parsedValue)
      super.setAttribute(attributeName, '[object Array]')
    } else if (parsedValueType === 'object') {
      if (parsedValue) {
        // parsedValue = this.createObservableObject(parsedValue)
        super.setAttribute(attributeName, parsedValue ? '[object Object]' : 'null')
      } else {
        super.setAttribute(attributeName, 'null')
      }
    } else {
      super.setAttribute(attributeName, parsedValue as string)
    }

    attributeCacheEntry.value = parsedValue
    attributeCacheEntry.assignedIn = 'attribute'

    this.requestTemplateUpdate()

    return value
  }

  getAttribute(attributeName: keyof A & string) {
    const propertyName = kebabToCamel(attributeName) as keyof A
    const attributeCacheEntry = this.attributeCache[propertyName]

    if (attributeCacheEntry) {
      return attributeCacheEntry.value
    }

    return super.getAttribute(attributeName)
  }

  removeAttribute(attributeName: string) {
    super.removeAttribute(attributeName)

    const propertyName = kebabToCamel(attributeName) as keyof A
    const attributeCacheEntry = this.attributeCache[propertyName]

    if (attributeCacheEntry) {
      if (typeof attributeCacheEntry.value === 'boolean') {
        this.attributes[propertyName] = false as any
      }
    }
  }

  attributeChangedCallback(attributeName: string, previousValue: string, currentValue: string) {
    console.log('change', attributeName, previousValue, currentValue)
  }

  get outerHTML() {
    // const clonedElement = this.cloneNode(true) as this
    // TODO: serialize object attributes

    return super.outerHTML
  }

  cloneNode(deepOrOptions: boolean | { deep: boolean } = { deep: false }) {
    if (typeof deepOrOptions === 'boolean') {
      deepOrOptions = {
        deep: deepOrOptions
      }
    }

    const clone = super.cloneNode(deepOrOptions.deep) as CustomElement<A>
    clone.attributeCache = deepExtend({}, this.attributeCache) as CustomElement<A>['attributeCache']

    for (let propertyName in clone.attributeCache) {
      clone.defineAttributeGetter(propertyName)
    }

    return clone
  }

  // Hack to fix TypeScript's lack of constructor inference.
  private get _constructor() {
    return this.constructor as typeof CustomElement
  }

  static get options(): Partial<CustomElementOptions> {
    return {}
  }

  static get defaultOptions(): CustomElementOptions {
    return {
      shadowRoot: { mode: 'open' }
    }
  }

  static get optionsWithDefaults(): CustomElementOptions {
    return deepExtend(this.defaultOptions, this.options)
  }

  private defineAttributeGetter(propertyName: keyof A) {
    Object.defineProperty(super.attributes, propertyName, {
      configurable: true,
      enumerable: true,
      get: () => this.attributeCache[propertyName].value
    })
  }

  constructor() {
    super()

    // -- Template lifecycle setup

    const { optionsWithDefaults } = this._constructor
    const shadowRoot = this.attachShadow(optionsWithDefaults.shadowRoot)

    shadowRoot.appendChild(this.styleElement)
    shadowRoot.appendChild(this.contentElement)

    //-- Attribute proxy setup.
    type ProxiedAttributes = CustomElement<A>['attributesProxy']

    this.attributeCache = {} as CustomElement<A>['attributeCache']

    const { proxy, revoke } = Proxy.revocable<ProxiedAttributes>(super.attributes as ProxiedAttributes, {
      set: (_, propertyName: keyof A & keyof NamedNodeMap, value: ValueOfAttributes<A>) => {
        if (!(propertyName in super.attributes)) {
          this.defineAttributeGetter(propertyName)
        }

        const propertyNameType = typeof propertyName

        if (propertyNameType === 'string') {
          this.setAttribute(camelToKebab(propertyName as string), value, { parsed: true })
        } else {
          console.warn(
            `${this.tagName}: attributes can only be set with string properties.`,
            `Got ${propertyNameType} ${propertyName} instead.`
          )
        }

        return true
      },
      // Note that deleting a property through the proxy will be synchronized
      // with the removal of the attribute.
      deleteProperty: (_, propertyName: keyof A & keyof NamedNodeMap) => {
        let deleteReturn: boolean

        if (propertyName in this.attributeCache) {
          this.removeAttribute(this.attributeCache[propertyName].attributeName)
          deleteReturn = true
        } else {
          deleteReturn = delete super.attributes[propertyName]
        }
        return deleteReturn
      }
    })

    this.revokeAttributeCacheProxy = revoke
    this.attributesProxy = proxy
  }

  static get tagName() {
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
    customElements.define(this.tagName, this)
  }
}

export default CustomElement
