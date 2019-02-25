import { Observable } from '../helpers/observables.js'

type ConstructorType = new (...args: any[]) => any

export type AttributeValue = number | string | boolean | Array<any> | object | null

export type JSONParsableConstructor<T extends ConstructorType = any> = {
  (...args: any[]): InstanceType<T>
  new (...args: any[]): InstanceType<T>
  toJSON?(): string
  fromJSON?(...args: any[]): InstanceType<T>
}

/**
 * Configures the attribute's expected type and value.
 */
export interface AttributeDefinition<C extends ConstructorType = any> {
  /**
   * A JSON friendly constructor function.
   */
  type: JSONParsableConstructor<C>
  // type: C
  defaultValue?: string | number | boolean | null | (() => any)
  required?: boolean
}

export type AttributeDefinitions = {
  [attributeName: string]: AttributeDefinition
}

export const reservedDOMAttributes = {
  id: true,
  class: true,
  style: true,
  tabIndex: true,
  title: true,
  contentEditable: true,
  lang: true
}

export type AttributeOrigin = 'setAttribute' | 'removeAttribute' | 'attributeChangedCallback' | 'propertyAccessor'

export interface AttributeCacheEntry<T extends ConstructorType = any> {
  attributeName: string
  type: AttributeDefinition<T>['type']
  value: T
  lastParseOrigin: AttributeOrigin
}

export type AttributeCache<A> = { [P in keyof A]: AttributeCacheEntry }

/**
 * This function doesn't really "do anything" at runtime, it's just the identity
 * function. Its only purpose is to defeat TypeScript's type widening when providing
 * attribute definition objects with varying type constructors.
 *
 * @param observedAttributes a set of attribute definitions
 * @returns the same definitions that were passed in
 */
export function createObservedAttributes<T extends AttributeDefinitions>(observedAttributes: T): T {
  return observedAttributes
}

export type WithAttributes<AD extends AttributeDefinitions> = { [P in keyof AD]: ReturnType<AD[P]['type']> }

export type ValueOfAttributes<A> = { [P in keyof A]: P }

export type ConstructorParser<T extends ConstructorType = any> = (value: string) => T

const constructorMap = new Map<ConstructorType, ConstructorParser>()

constructorMap.set(Boolean, (value: string) => Boolean(value))
constructorMap.set(String, (value: string) => String(value))
constructorMap.set(Number, (value: string) => Number(value))
constructorMap.set(Date, (value: string) => new Date(value))
constructorMap.set(Function, (value: string) => eval(value))
// TODO: Use observerable objects.
constructorMap.set(Object, (value: string) => Observable.from(eval(value)))
constructorMap.set(Array, (value: string) => Observable.from(eval(value)))

/**
 * Parses an attribute string value using a given constructor.
 * While it's possible to use a constructor directly, constructor parsers
 * unify common string inputs with a single, predictable interface.
 * @param Constructor A native built-in constructor e.g. `Number`, `String`
 */
export function getConstructorStringParser<T extends ConstructorType>(
  Constructor: T
): ConstructorParser<InstanceType<T>> | null {
  return constructorMap.get(Constructor) || null
}
