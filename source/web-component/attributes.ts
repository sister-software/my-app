export type AttributeValue = number | string | boolean | Array<any> | object | null

/**
 * Configures the attribute's expected type and value.
 */
export interface AttributeDefinition<C = {}> {
  /**
   * A JSON friendly constructor function.
   */
  type: (...args: any[]) => C
  defaultValue?: string | number | boolean | null | (() => any)
  required?: boolean
}

export type AttributeDefinitions = {
  [attributeName: string]: AttributeDefinition
}

export type AttributeOrigin = 'setAttribute' | 'removeAttribute' | 'attributeChangedCallback' | 'propertyAccessor'

export interface AttributeCacheEntry<T = any> {
  attributeName: string
  type: AttributeDefinition<T>['type']
  value: T
  origin: AttributeOrigin
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

type ConstructorType = (...args: any[]) => any
const constructorMap = new Map<ConstructorType, ConstructorParser>()

constructorMap.set(Boolean, (value: string) => Boolean(value))
constructorMap.set(String, (value: string) => String(value))
constructorMap.set(Number, (value: string) => Number(value))
constructorMap.set(Date, (value: string) => new Date(value))
constructorMap.set(Function, (value: string) => eval(value))
// TODO: Use observerable objects.
constructorMap.set(Object, (value: string) => eval(value))
constructorMap.set(Array, (value: string) => eval(value))

export function getConstructorParser<T extends ConstructorType>(
  Constructor: T
): ConstructorParser<ReturnType<T>> | null {
  return constructorMap.get(Constructor) || null
}
