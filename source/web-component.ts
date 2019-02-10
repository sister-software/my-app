import { html, render, TemplateResult } from '../node_modules/lit-html/lit-html.js'
import css from './helpers/parse-css.js'
import camelToKebab from './helpers/camel-to-kebab.js'
import kebabToCamel from './helpers/kebab-to-camel.js'
import deepExtend from './helpers/deep-extend.js'
import {AttributeDefinitions, WithAttributes, AttributeCache, ValueOfAttributes, AttributeOrigin, AttributeCacheEntry} from './web-component/attributes.js';
import {LifeCycleHandler, LifeCycleEvents} from './web-component/lifecycle.js';

// Reexport for developer convenience.
export { css }
export { html }
export type ParseHTML = typeof html
export type ParseCSS = typeof css


interface SetAttributeOptions {
  origin: AttributeOrigin
}

interface WebComponentLifecycle<A extends AttributeDefinitions> {
  /**
   * Public callback executed before an element is inserted in the document.
   */
  onbeforeinsert?: LifeCycleHandler<A>

  /**
   * Public callback executed after an element is inserted in the document.
   */
  onafterinsert?: LifeCycleHandler<A>

  /**
   * Public callback executed before an element is removed from the document.
   * Invoking `event.preventDefault()` will prevent element removal.
   */
  onbeforeremove?: LifeCycleHandler<A>

  /**
   * Public callback executed after an element is removed from the document.
   */
  onafterremove?: LifeCycleHandler<A>

  /**
   * Public callback executed before an element's template is updated.
   */
  onbeforeupdate?: LifeCycleHandler<A>

  /**
   * Public callback executed after an element's template is updated.
   */
  onafterupdate?: LifeCycleHandler<A>
}

export interface CustomElementOptions {
  shadowRoot: ShadowRootInit
}

export type WebComponentConstructorBody<A extends AttributeDefinitions = {}> = (this: WebComponent, attributeDefinitions?: Partial<WithAttributes<A>>) => void

interface WebComponent<A extends AttributeDefinitions> {
  styles?(css: ParseCSS): string
  template(html: ParseHTML): TemplateResult
  getAttribute(attributeName: keyof A & string): any
}
abstract class WebComponent<A extends AttributeDefinitions = {}> extends HTMLElement
  implements WebComponentLifecycle<A> {
  /**
   * A document wide unique dash-between words HTML tag name.
   * e.g. `my-element`, `material-button`, `hero-image`
   * */
  static tagName: string

  styleElement = document.createElement('style')
  contentElement = document.createElement('content-container')

  // styles?(css: ParseCSS): string
  // abstract template(html: ParseHTML): TemplateResult

  /**
   * Changes in observed attributes trigger template changes.
   * JSON serializable values are recommended e.g. number, string, objects, arrays.
   */
  static observedAttributes?: AttributeDefinitions

  /** An object containing each observed attribute.
   * Note that only existing attributes may be changed.
   */
  public observedAttributes = {} as WithAttributes<A>

  /**
   * An internal cache containing attribute values.
   */
  private observedAttributesCache = {} as AttributeCache<A>

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

  onbeforeinsert = null
  onafterinsert = null
  onbeforeremove = null
  onafterremove = null
  onbeforeupdate = null

  /**
   * Called every time the element is inserted into the DOM.
   */
  connectedCallback() {
    const defaultPrevented = this.triggerEvent(LifeCycleEvents.beforeInsert)

    if (defaultPrevented) return

    this.updateStyles()
    this.updateTemplate()

    this.triggerEvent(LifeCycleEvents.afterInsert, {
      cancelable: false
    })
  }

  /**
   * Called every time the element is removed from the DOM. Useful for running clean up code.
   */
  disconnectedCallback() {
    this.triggerEvent(LifeCycleEvents.afterRemove, {
      cancelable: false
    })
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

  setAttribute(
    attributeName: string,
    value: ValueOfAttributes<A> | string,
    options: SetAttributeOptions = {
      'origin': 'setAttribute'
    }
  ) {

    if (!(attributeName in this.observedAttributes)) {
      return super.setAttribute(attributeName, value as string)
    }

    const attributeCacheEntry = this.observedAttributesCache[attributeName]
    const Constructor = attributeCacheEntry.type
    let parsedValue: any
    let cssValue: string = ""

    // TODO: investigate cross-iframe concerns.
    if (value instanceof attributeCacheEntry.type) {
      parsedValue = value
    } else {
      value = value as string

      switch (Constructor.name) {
        case 'Number':
        case 'Number':
          super.setAttribute(attributeName, value)
          break;
        case 'Object':
          parsedValue = eval(value)
          super.setAttribute(attributeName, '[object Object]')
        break;
        case

        default:
        // parsedValue = new Constructor(value)
        super.setAttribute(attributeName, `[object ${Constructor.name}]`)
          break;
      }

    }

    const parsedValueType = typeof parsedValue

    attributeCacheEntry.origin = options.origin
    attributeCacheEntry.value = parsedValue
    this.contentElement.style.setProperty(`--observed-attribute-${attributeName}`, cssValue)

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

    this.requestTemplateUpdate()

    return value
  }

  getAttribute(attributeName: keyof A & string): A[keyof A] | string | null {
    const propertyName = kebabToCamel(attributeName) as keyof A

    if (propertyName in this.observedAttributes) {
      return this.observedAttributes[propertyName]
    }

    return super.getAttribute(attributeName)
  }

  removeAttribute(attributeName: string) {
    super.removeAttribute(attributeName)

    const propertyName = kebabToCamel(attributeName) as keyof A

    if (propertyName in this.observedAttributes) {
      const attributeCacheEntry = this.observedAttributes[propertyName]
      if (typeof attributeCacheEntry.value === 'boolean') {
        this.observedAttributes[propertyName] = false as any
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
    // Normalize to options object.
    if (typeof deepOrOptions === 'boolean') {
      deepOrOptions = {
        deep: deepOrOptions
      }
    }

    const clone = super.cloneNode(deepOrOptions.deep) as WebComponent<A>
    clone.observedAttributesCache = deepExtend({}, this.observedAttributesCache) as WebComponent<
      A
    >['observedAttributesCache']

    // for (let propertyName in clone.observedAttributesCache) {
    //   clone.defineAttributeGetter(propertyName)
    // }

    return clone
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

  private constructObservedAttributes() {
    const attributeDefinitions = this._constructor.observedAttributes || {}

    const defineAttributeGetter = (propertyName: keyof A, attributeName: string) => {
      const propertyDescriptor: PropertyDescriptor = {
        configurable: false,
        get: () => this.observedAttributesCache[propertyName].value,
        set: (value: ValueOfAttributes<A>) => this.setAttribute(propertyName as string, value)
      }

      // Property lookup (AKA camelCase)
      Object.defineProperty(this.observedAttributes, propertyName, {
        ...propertyDescriptor,
        enumerable: true
      })

      // Attribute lookup (AKA dash-case)
      Object.defineProperty(this.observedAttributes, attributeName, {
        ...propertyDescriptor,
        enumerable: false
      })
    }

    for (let propertyName in attributeDefinitions) {
      const attributeDefinition = attributeDefinitions[propertyName]
      const attributeName = camelToKebab(propertyName)

      const attributeCacheEntry: AttributeCacheEntry = {
        origin: 'propertyAccessor',
        type: attributeDefinition.type,
        attributeName,
        value: null
      }

      // Property lookup (AKA camelCase)
      this.observedAttributesCache[propertyName] = attributeCacheEntry

      // Attribute lookup (AKA dash-case)
      this.observedAttributesCache[attributeName] = attributeCacheEntry

      defineAttributeGetter(propertyName, attributeName)

      if (attributeDefinition.hasOwnProperty('defaultValue')) {
        if (typeof attributeDefinition.defaultValue === 'function') {
          this.observedAttributes[propertyName] = attributeDefinition.defaultValue() as any
        } else {
          this.observedAttributes[propertyName] = attributeDefinition.defaultValue as any
        }
      }
    }

    Object.seal(this.observedAttributes)
    Object.seal(this.observedAttributesCache)
  }

  // Hack to fix TypeScript's lack of constructor inference.
  private get _constructor() {
    return this.constructor as typeof WebComponent
  }

  constructor(attributeDefinitions = {} as Partial<WithAttributes<A>>) {
    super()

    // -- Template lifecycle setup

    const { optionsWithDefaults } = this._constructor
    const shadowRoot = this.attachShadow(optionsWithDefaults.shadowRoot)

    shadowRoot.appendChild(this.styleElement)
    shadowRoot.appendChild(this.contentElement)

    this.constructObservedAttributes()
  }

  private static computedTagName() {
    if (document.currentScript) {
      const providedElementName = document.currentScript.getAttribute('element-name')

      if (providedElementName) {
        return providedElementName
      }
    }

    if (this.tagName) {
      return this.tagName
    }

    // Fallback to class function name.
    return camelToKebab(this.name)
  }

  /**
   * Registers custom element class with current document.
   */
  static register(targetWindow = window) {
    const computedTagName = this.computedTagName()

    const originalObservedAttributes = this.observedAttributes
    const hasDefinedObservedAttributes =
      typeof originalObservedAttributes === 'object' && !Array.isArray(originalObservedAttributes)
    // Note the browser expects `observedAttributes` to be an array of during registration.
    // We can temporarily transform the object definition to match that expectation.

    if (hasDefinedObservedAttributes) {
      delete this.observedAttributes

      Object.defineProperty(this, 'observedAttributes', {
        get() {
          return Object.keys(originalObservedAttributes!)
        },
        configurable: true
      })
    }

    try {
      targetWindow.customElements.define(computedTagName, this)
    } catch (error) {
      console.warn(`${computedTagName}: Unable to register element.`, error)
    }

    if (hasDefinedObservedAttributes) {
      delete this.observedAttributes

      Object.defineProperty(this, 'observedAttributes', {
        get() {
          return originalObservedAttributes
        },
        configurable: true
      })
    }
  }

  /**
   * Defines a simple Web Component.
   * Consider extending the `WebComponent` class when in need of fine-grain control.
   * @param tagName Globally unique tag name with at least one dash e.g. `"human-time"`, `"loading-bar"`
   * @param template HTML template
   * @param styles Stylesheet template
   * @param constructorScript Constructor function invoked when the Web Component is inserted in the document
   */
  static define<A extends AttributeDefinitions = {}>(
    tagName: string,
    template: WebComponent<A>['template'],
    styles?: WebComponent<A>['styles'],
    constructorScript?: WebComponentConstructorBody<A>
  ) {
    const Constructor = class extends WebComponent<A> {
      constructor(attributeDefinitions = {} as Partial<WithAttributes<A>>) {
        super(attributeDefinitions)

        this.template = template
        this.styles = styles

        if (constructorScript) {
          constructorScript.call(this, attributeDefinitions)
        }
      }
    }

    Constructor.tagName = tagName

    try {
      Constructor.register()
    } catch (error) {
      console.warn(`Could not register web component ${tagName}, error`)
    }

    return Constructor
  }

  /**
   * Defines a Web Component using a declaration in the DOM. e.g.
   * ```html
<web-component name="human-time">
  <style></style>
  <template></template>
  <script></script>
</web-component>
```
   * Note that the `<script>` tag must always be the last child element.
   */
  static defineFromElement<A extends AttributeDefinitions = any>(parentElement: Element) {
    const tagName = parentElement.getAttribute('tag-name')

    if (!tagName) {
      throw new Error('Name attribute not provided. e.g. <web-component tag-name="my-element"></web-component>')
    }

    let template: WebComponent<A>['template'] = function (html) { return html`` }
    let styles: WebComponent<A>['styles']
    let constructorScript = function() {} as Function

    for (let childElement of Array.from(parentElement.children)) {
      const serializer = document.createElement('div')

      switch (childElement.nodeName) {
        case 'TEMPLATE':
          // Serialize the template fragment into HTML
          serializer.appendChild(document.importNode((childElement as HTMLTemplateElement).content, true))

          template = function template (html) {
            return html`${serializer.innerHTML}`
          }
          break

        case 'STYLE':
          styles = function styles (css) {
            return css`${childElement.innerHTML}`
          }
          break

        case 'SCRIPT':
          constructorScript = new Function(childElement.innerHTML)
          break
      }
    }

    parentElement.setAttribute('defined', '')

    const Constructor = this.define(tagName, template, styles, constructorScript as WebComponentConstructorBody<A>)
    return Constructor
  }

  /**
   * Defines a Web Component from an external source.
   * @param path URL path to web component definition e.g.
   * https://example.com/components/foo-bar.component.html
   */
  static async defineFromSrc<A extends AttributeDefinitions = any>(path: string) {
    if (typeof path !== 'string' || !path.endsWith('component.html')) {
      throw new Error('Path must end with `.component.html`')
    }

    try {
      var response = await window.fetch(path)

      if (!response.ok) {
        const responseText = await response.text()
        throw new Error(`A server error occured during fetch: ${responseText}`)
      }

    } catch (error) {
      console.error('Failed to fetch external Web Component', path, response!)
      throw error
    }

    const body = await response.text()


    const serializer = document.createElement('div')
    serializer.innerHTML = body

  }
}

const readyEvent = new CustomEvent('WebComponentsReady', {
  bubbles: true,
  detail: { WebComponent }
})

export type ReadyEvent = typeof readyEvent

document.dispatchEvent(readyEvent)

export default WebComponent
