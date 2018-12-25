import createNoop from './helpers/noop.js'
import camelToKebab from './helpers/camel-to-kebab.js'
import kebabToPascal from './helpers/kebab-to-pascal.js'
import { TemplateResult } from '../node_modules/lit-html/lit-html.js'
import generateId from './helpers/generate-id.js'
import CustomElementBase, {
  LifeCycleEvents,
  LifeCycleHandler,
  AttributeValue
} from './create-element/custom-element-base.js'

export interface CreateMyElementOptions {
  styles?: CustomElementBase['styles']
  template: CustomElementBase['template']
  lifecycle?: Partial<{ [key in LifeCycleEvents]: LifeCycleHandler }>
  shadowRoot?: ShadowRootInit
}

/**
 *
 * @param elementName A unique name with dashes-between-words, or camelCased.
 * @param options Options describing your element's behavior.
 */
function defineElement<A extends object = {}>(elementName: string, options: CreateMyElementOptions) {
  elementName = camelToKebab(elementName)

  const prexistingElement: Element | undefined = window.customElements.get(elementName)

  if (prexistingElement) {
    console.error(`${elementName}: An element with the same name was already defined.`, prexistingElement)
  }

  if (elementName.indexOf('-') === -1) {
    throw new Error(
      `${elementName}: Custom elements must have a dash (-) in their name to avoid overlap with pre-existing elements.`
    )
  }
  class CustomElement extends CustomElementBase<A> implements CustomElement {
    // attributeCache: AttributeCache = {} as AttributeCache

    constructor() {
      super()

      this.triggerEvent(LifeCycleEvents.afterInsert, {
        cancelable: false
      })
    }
  }

  CustomElement.prototype.template = options.template

  return CustomElement
}

interface TestAttributes {
  foo: string
  bar: number
}

const Foo = defineElement<TestAttributes>('foo-bar', {
  lifecycle: {
    beforeInsert() {
      console.log(this.attributes.foo)
    }
  },
  template(html) {
    return html`
      <div>Hello</div>
    `
  }
})

const instance = new Foo()
instance.attributes.foo
instance.attributes.length

export default defineElement
