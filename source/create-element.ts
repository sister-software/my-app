import MyElement, { ParseCSS, ParseHTML } from './elements/my-element.js'
import createNoop from './helpers/noop.js'
import camelToKebab from './helpers/camel-to-kebab.js'
import kebabToPascal from './helpers/kebab-to-pascal.js'
import { TemplateResult } from '../node_modules/lit-html/lit-html.js'

export interface MyElementAttribute {
  name: string
  private: boolean
}

export interface MyElementLifeCycle {
  /**
   * Callback executed before an element is inserted in the document.
   */
  beforeElementInserted: (this: typeof CustomElementBase) => void
  /**
   * Callback executed after an element is inserted in the document.
   */
  afterElementInserted: (this: typeof CustomElementBase) => void
  /**
   * Callback executed before an element is removed from the document.
   */
  beforeElementRemoved: (this: typeof CustomElementBase) => void
  /**
   * Callback executed after an element is removed from the document.
   */
  afterElementRemoved: (this: typeof CustomElementBase) => void
}

const defaultLifeCycleHandlers: MyElementLifeCycle = {
  beforeElementInserted: createNoop(),
  afterElementInserted: createNoop(),
  beforeElementRemoved: createNoop(),
  afterElementRemoved: createNoop()
}

interface CustomElementBase {
  styles?: (css: ParseCSS) => string
  template(html: ParseHTML): TemplateResult
  revokeAttributeCacheProxy: () => void
  lifecycle: MyElementLifeCycle
  attributes: any
}
abstract class CustomElementBase extends HTMLElement implements CustomElementBase {
  connectedCallback() {
    // this.lifecycle.afterElementInserted()
  }
}

export interface CreateMyElementOptions {
  attributes?: string | MyElementAttribute
  styles?: CustomElementBase['styles']
  template: CustomElementBase['template']
  lifecycle?: Partial<MyElementLifeCycle>
  shadowRoot?: ShadowRootInit
}

interface AttributeCacheEntry {
  private?: boolean
  value: any
}

/**
 *
 * @param elementName A unique name with dashes-between-words, or camelCased.
 * @param options Options describing your element's behavior.
 */
function createElement<A extends object = {}>(elementName: string, options: CreateMyElementOptions) {
  elementName = camelToKebab(elementName)

  if (elementName.indexOf('-') === -1) {
    throw new Error(
      `${elementName}: Custom elements must have a dash (-) in their name to avoid overlap with pre-existing elements.`
    )
  }

  type AttributeCache = Record<keyof A, AttributeCacheEntry>

  class CustomElement extends CustomElementBase {
    attributeCache: AttributeCache = {} as AttributeCache
    attributes: Record<keyof A, AttributeCacheEntry>

    constructor() {
      super()

      const { proxy, revoke } = Proxy.revocable<AttributeCache>(this.attributeCache, {
        get(obj, prop: keyof AttributeCache) {
          return obj[prop]
        }
      })

      this.revokeAttributeCacheProxy = revoke
      this.attributes = proxy
    }
  }

  CustomElement.prototype.template = options.template

  return CustomElement
}

interface TestAttributes {
  foo: string
  bar: number
}

const Foo = createElement<TestAttributes>('foo-bar', {
  template(html) {
    return html`
      <div>Hello</div>
    `
  }
})

const instance = new Foo()
instance.attributes.foo.value

export default createElement
