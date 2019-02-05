import WebComponent, { ParseCSS, ParseHTML } from '../web-component.js'

export default class MyButton extends WebComponent<typeof MyButton['observedAttributes']> {
  static observedAttributes = {
    clickCount: {
      defaultValue: 23,
      type: Number
      // required: true
    }
  }

  static get elementsById() {
    return {
      foo: HTMLDivElement
    }
  }

  static get publicEvents() {
    return {}
  }

  styles(css: ParseCSS) {
    return css`
      :host {
        font-family: sans-serif;
      }
      span {
        color: red;
      }
    `
  }

  onafterupdate() {
    console.log(this.tagName, 'update ran')
  }

  clickHandler = (event: MouseEvent) => {
    console.log('hello', this, event)
    // this.observedAttributes.disabled = true
  }

  template(html: ParseHTML) {
    // const { clickCount } = this.observedAttributes
    return html`
      My Button goes here! <span @click=${this.clickHandler}>Click me!</span>
      <div id="testing">Clicked ${this.observedAttributes.clickCount} times.</div>
      <slot></slot>
    `
  }
}

MyButton.register()
