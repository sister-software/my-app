import MyElement from './elements/my-element.js'
import createNoop from './helpers/noop.js'

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

export interface CreateMyElementOptions {
  attributes?: string | MyElementAttribute
  // styles?: css
  lifecycle?: Partial<MyElementLifeCycle>
}

function createElement(elementName: string, options: CreateMyElementOptions = {}): MyElement {}

export default createElement
