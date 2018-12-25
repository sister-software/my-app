import { html, render, TemplateResult } from '../../node_modules/lit-html/lit-html.js'
import css from '../helpers/parse-css.js'
import camelToKebab from '../helpers/camel-to-kebab.js'

// Reexport for developer convenience.
export { css }
export { html }
export type ParseHTML = typeof html
export type ParseCSS = typeof css

export enum LifeCycleEvents {
  beforeInsert = 'beforeInsert',
  afterInsert = 'afterInsert',
  beforeRemove = 'beforeRemove',
  afterRemove = 'afterRemove'
}

export type LifeCycleHandler = ((this: CustomElementBase, event: Event) => void) | null

export type AttributeValue = number | string | boolean | Array<any> | object | null

export interface AttributeCacheEntry {
  // private?: boolean
  attributeName: string
  value: any
  assignedIn: null | 'setter' | 'attribute'
}

interface CustomElementBase {
  styles?: (css: ParseCSS) => string
  template(html: ParseHTML): TemplateResult
  revokeAttributeCacheProxy: () => void
}
abstract class CustomElementBase<A = {}> extends HTMLElement implements CustomElementBase<A> {
  attributeCache: Record<keyof A, AttributeCacheEntry>
  attributes: CustomElementBase<A>['attributeCache'] & NamedNodeMap

  /**
   * Callback executed before an element is inserted in the document.
   */
  onbeforeinsert: LifeCycleHandler = null
  /**
   * Callback executed after an element is inserted in the document.
   */
  onafterinsert: LifeCycleHandler = null
  /**
   * Callback executed before an element is removed from the document.
   */
  onbeforeremove: LifeCycleHandler = null
  /**
   * Callback executed after an element is removed from the document.
   */
  onafterremove: LifeCycleHandler = null

  /**
   * Called every time the element is inserted into the DOM.
   */
  connectedCallback() {
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
    const assignedHandler: LifeCycleHandler = (this as any)[propertyName]

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

  setAttribute(attributeName: string, value: string) {
    const propertyName = camelToKebab(attributeName) as keyof A

    if (!(propertyName in this.attributeCache)) {
      this.attributeCache[propertyName] = {
        attributeName: attributeName,
        assignedIn: null,
        value: undefined
      }
    }

    const attributeCacheEntry = this.attributeCache[propertyName]

    let parsedValue: any

    try {
      parsedValue = JSON.parse(value)
    } catch (e) {
      parsedValue = value
    }

    const parsedValueType = typeof parsedValue

    attributeCacheEntry.value = parsedValue
    attributeCacheEntry.assignedIn = 'attribute'

    // TODO: fix attributeChanged loop.
    if (parsedValueType === 'boolean') {
      if (value) {
        // Much like checkbox input elements,
        // boolean attributes are represented by their presence.
        super.setAttribute(attributeName, '')
      } else {
        super.removeAttribute(attributeName)
      }
    } else if (Array.isArray(parsedValue)) {
      // Serializing
      super.setAttribute(attributeName, '[object Array]')
    } else if (parsedValueType === 'object') {
      super.setAttribute(attributeName, '[object Object]')
    } else {
      super.setAttribute(attributeName, value)
    }

    attributeCacheEntry.value = value
    attributeCacheEntry.assignedIn = 'attribute'

    return value
  }

  getAttribute(attributeName: keyof A & string) {
    if (attributeName in this.attributeCache) {
      return this.attributeCache[attributeName].value
    }

    return super.getAttribute(attributeName)
  }

  removeAttribute(attributeName: string) {
    return super.removeAttribute(attributeName)
  }

  attributeChangedCallback(attributeName: string, previousValue: string, currentValue: string) {
    console.log(attributeName, previousValue, currentValue)
  }

  get outerHTML() {
    // const clonedElement = this.cloneNode(true) as this
    // clonedElement.dataset.premount = generateId()
    // TODO: serialize object attributes

    return super.outerHTML
  }

  // Hack to fix TypeScript's lack of constructor inference.
  private get _constructor() {
    return this.constructor as typeof CustomElementBase
  }

  constructor() {
    super()

    type ProxiedAttributes = CustomElementBase<A>['attributes']

    this.attributeCache = {} as ProxiedAttributes

    const { proxy, revoke } = Proxy.revocable<ProxiedAttributes>(super.attributes as ProxiedAttributes, {
      set: (_, propertyName: keyof A & string, value: any) => {
        Object.defineProperty(this.attributes, propertyName, {
          configurable: true,
          enumerable: true,
          get: () => this.attributeCache[propertyName].value
        })

        this.setAttribute(propertyName, value)

        return true
      },
      deleteProperty: (_, propertyName: keyof A & string) => {
        if (propertyName in this.attributeCache) {
          super.removeAttribute(this.attributeCache[propertyName].attributeName)

          delete this.attributes[propertyName]
        }

        return true
      }
    })

    this.revokeAttributeCacheProxy = revoke
    this.attributes = proxy
  }
}

export default CustomElementBase
