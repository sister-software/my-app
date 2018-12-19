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
  beforeElementInserted: (this: typeof MyElement) => void
  /**
   * Callback executed after an element is inserted in the document.
   */
  afterElementInserted: (this: typeof MyElement) => void
  /**
   * Callback executed before an element is removed from the document.
   */
  beforeElementRemoved: (this: typeof MyElement) => void
  /**
   * Callback executed after an element is removed from the document.
   */
  afterElementRemoved: (this: typeof MyElement) => void
}

const defaultLifeCycleHandlers: MyElementLifeCycle = {
  beforeElementInserted: createNoop(),
  afterElementInserted: createNoop(),
  beforeElementRemoved: createNoop(),
  afterElementRemoved: createNoop()
}

interface CustomElement {
  styles?: (css: ParseCSS) => string
  template(html: ParseHTML): TemplateResult
}

export interface CreateMyElementOptions {
  attributes?: string | MyElementAttribute
  styles?: CustomElement['styles']
  template: CustomElement['template']
  lifecycle?: Partial<MyElementLifeCycle>
  shadowRoot?: ShadowRootInit
}

// A round-about way of making custom classes with a dynamic constructor name
function createElementClass<T>(name: string, BaseClass: Function, prototype: T): T {
  const Klass = new Function(
    'name',
    'BaseClass',
    `
    return class ${name} extends BaseClass {}
  `
  )(kebabToPascal(name), BaseClass)

  Klass.prototype = prototype

  return Klass
}

/**
 *
 * @param elementName A unique name with dashes-between-words, or camelCased.
 * @param options Options describing your element's behavior.
 */
function createElement<A>(elementName: string, options: CreateMyElementOptions): CustomElement {
  elementName = camelToKebab(elementName)

  if (elementName.indexOf('-') === -1) {
    throw new Error(
      `${elementName}: Custom elements must have a dash (-) in their name to avoid overlap with pre-existing elements.`
    )
  }

  if (options.attributes) {
    options.attributes
  }

  const CustomElement = createElementClass<CustomElement>(elementName, MyElement, {
    template: options.template
  })

  return CustomElement
}

export default createElement
