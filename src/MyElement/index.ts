import htm from 'https://unpkg.com/htm?module'

function h(tag: string, props: object, ...children: []) {
  return { tag, props, children };
}


Object.assign(window, {htm: htm.bind(h)})

function camelToKebab(str: string) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')    // get all lowercase letters that are near to uppercase ones
    .replace(/[\s_]+/g, '-')                // replace all spaces and low dash
    .toLowerCase()                          // convert to lower case
}

interface MyElementOptions {
  shadowRoot: ShadowRootInit
}

abstract class MyElement extends HTMLElement {
  static options: MyElementOptions = {
    shadowRoot: {mode: 'open'}
  }
  static extends: string
  abstract render(): string | HTMLElement

  static defaultStyles: string = `
    /* Default styles BEGIN */
    :host { display: block; }

    :host([hidden]) { display: none }

    /* Default styles END */
  `
  styleElement = document.createElement('style')

  static styles?: string

  static register() {
    const defineOptions: ElementDefinitionOptions = {}
    if (typeof this.extends !== 'undefined') {
      defineOptions.extends = this.extends
    }

    customElements.define(camelToKebab(this.name), this)
  }

  constructor () {
    super()
    const baseClass: typeof MyElement = Object.getPrototypeOf(this.constructor)
    const extendedClass = this.constructor as any // TODO: tighten this up with an abstract type.

    const options = {
      ...baseClass.options,
      ...extendedClass.options
    }

    const shadowRoot = this.attachShadow({mode: 'open'})
    this.styleElement.innerHTML = [baseClass.defaultStyles, extendedClass.styles || ''].join('\n')

    shadowRoot.appendChild(this.styleElement)
  }

  connectedCallback() {
    this.updateRender()
  }

  updateRender() {
    const shadowRoot = this.shadowRoot!
    let rendered: Element | string = this.render()

    if (typeof rendered === 'string') {
      const serializer = document.createElement('div')
      serializer.innerHTML = rendered

      rendered = serializer.firstElementChild!
    }

    while (shadowRoot.firstChild && shadowRoot.firstChild !== this.styleElement) {
      shadowRoot.firstChild.remove();
    }

    shadowRoot.appendChild(rendered)
  }
}

export default MyElement

export class MyButton extends MyElement {
  static options: MyElementOptions = {
    shadowRoot: {mode: 'open'}
  }

  test() {
    console.log('hello')
  }

  static styles = `
    :host {
      color: red;
    }
  `

  render() {
    return '<div>My Button goes <span onclick={this.test()}>here</span>!</div>'
  }
}

MyButton.register()
