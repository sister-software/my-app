import WebComponent, { ParseCSS, ParseHTML } from '../web-component.js'

export default class MyButton extends WebComponent<
  typeof MyButton['observedAttributes'],
  typeof MyButton['elementsById']
> {
  static observedAttributes = {
    testerDate: {
      type: Date
    },
    name: {
      type: String
    },
    clickCount: {
      defaultValue: 23,
      type: Number
      // required: true
    }
  }

  static elementsById = {
    innerButton: HTMLButtonElement,
    paragraph: HTMLParagraphElement,
    box: MyButton
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
    // console.log(this.tagName, 'update ran')
  }

  clickHandler = (event: MouseEvent) => {
    console.log('hello', this, event)
    ;(this.observedAttributes.clickCount as number) += 1
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
