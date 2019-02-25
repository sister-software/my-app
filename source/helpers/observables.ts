function createSetter(onChange, target, property, value, receiver) {
  const previousValue = target[property]

  // if (value === previousValue) return value

  if (typeof value === 'object') {
    const creator = Array.isArray(value) ? createObservableArray : createObservableObject

    target[property] = creator(value, onChange)
  } else {
    target[property] = value
  }

  if (receiver) {
    onChange(target[property], previousValue)
  }

  return value
}

function createObservableArray(targetArray, onChange = () => {}) {
  const container = []

  for (let index in targetArray) {
    createSetter(onChange, container, index, targetArray[index])
  }

  const mutableMethods = {
    // copyWithin() {
    //   const previousLength = this.length

    //   onChange(this.length, previousLength)
    // },
    // fill() {
    //   const previousLength = this.length

    //   onChange(this.length, previousLength)
    // },
    pop() {
      const previousLength = this.length
      const value = this.pop()

      onChange(this.length, previousLength)

      return value
    },
    reverse() {
      const value = this.reverse()

      onChange(this.length, this.length)

      return value
    },
    shift() {
      const previousLength = this.length
      const value = this.shift()

      onChange(this.length, previousLength)

      return value
    },
    unshift(...values) {
      const previousLength = this.length
      const container = []

      for (let property of values) {
        createSetter(onChange, container, property, values[property])
      }

      const value = this.unshift(...container)

      onChange(this.length, previousLength)

      return value
    },
    sort(...args) {
      const value = this.sort(...args)

      onChange(this.length, this.length)

      return value
    },
    splice(start, deleteCount, ...values) {
      const previousLength = this.length
      const value = this.splice()

      onChange(this.length, previousLength)

      return value
    },
    push(...values) {
      const previousLength = this.length
      const container = []

      for (let property in values) {
        const index = parseInt(property, 10) + previousLength
        createSetter(onChange, this, index, values[property])
      }

      onChange(this.length, previousLength)

      return this.length
    }
  }

  const methodCache = {}

  return new Proxy(container, {
    set: createSetter.bind(null, onChange),
    get(target, property) {
      const value = target[property]

      if (typeof value !== 'function') {
        return value
      }

      if (!(property in mutableMethods)) {
        return target[property]
      }

      if (!(property in methodCache)) {
        methodCache[property] = mutableMethods[property].bind(target)
      }

      return methodCache[property]
    }
  })
}

function createObservableObject(targetObject = {}, onChange = () => {}) {
  const container = {}

  for (let property in targetObject) {
    createSetter(onChange, container, property, targetObject[property])
  }

  return new Proxy(container, {
    set: createSetter.bind(null, onChange)
  })
}

// var proxy = createObservableObject({}, (current, prev) => console.log({current, prev}))
// var arr = createObservableArray([], (current, prev) => console.log({current, prev}))
