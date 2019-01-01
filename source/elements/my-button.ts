import CustomElement, { ParseCSS, ParseHTML } from '../custom-element.js'

interface MyButtonAttributes {
  clickCount: number
  label: string
  disabled: boolean
}

export default class MyButton extends CustomElement<MyButtonAttributes> {
  static get observedAttributes() {
    return ['foo', 'click-count']
  }
  static get properties() {
    return {
      clickCount: {
        defaultValue: 4
      },
      label: {},
      disabled: {}
    }
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
  clickHandler = (event: MouseEvent) => {
    console.log('hello', this, event)
    this.attributes.disabled = true
  }

  template(html: ParseHTML) {
    return html`
      My Button goes here! <span @click=${this.clickHandler}>Click me!</span>
      <div id="testing">Clicked ${this.attributes.clickCount} times.</div>
      <slot></slot>
    `
  }
}

MyButton.register()
