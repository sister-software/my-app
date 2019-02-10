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
