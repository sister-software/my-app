import { AttributeDefinitions } from './attributes.js'
import WebComponent from '../web-component.js'

export enum LifeCycleEvents {
  beforeInsert = 'beforeinsert',
  afterInsert = 'afterinsert',
  beforeRemove = 'beforeremove',
  afterRemove = 'afterremove',
  beforeUpdate = 'beforeupdate',
  afterUpdate = 'afterupdate'
}

export type LifeCycleHandler<A extends AttributeDefinitions> = ((this: WebComponent<A>, event: Event) => void) | null

export interface WebComponentLifecycle<A extends AttributeDefinitions> {
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
