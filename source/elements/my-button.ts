import WebComponent, { ParseCSS, ParseHTML } from '../web-component.js'

export default class MyButton extends WebComponent<
  typeof MyButton['observedAttributes'],
  typeof MyButton['elementsById']
> {
  static observedAttributes = {
    testerDate: {
      type: Date
    },
    color: {
      type: String
    },
    clickCount: {
      defaultValue: 23,
      type: Number
      // required: true
    },
    testArray: {
      type: Array
    }
  }

  static elementsById = {
    innerButton: HTMLButtonElement,
    paragraph: HTMLParagraphElement,
    box: MyButton,
    testing: HTMLDivElement
  }

  styles(css: ParseCSS) {
    return css`
      :host {
        font-family: sans-serif;
      }
      span {
        color: var(--observed-attribute-color, red);
      }
    `
  }

  onafterupdate() {
    // console.log(this.tagName, 'update ran')
  }

  clickHandler = (event: MouseEvent) => {
    console.log('hello', this, event)
    this.observedAttributes.clickCount += 1

    console.log(this.elementsById.testing)
    // this.observedAttributes.disabled = true
  }

  template(html: ParseHTML) {
    return html`
      My Button goes here! <span @click=${this.clickHandler}>Click me!</span>
      <div id="testing">Clicked ${this.observedAttributes.clickCount} times.</div>
      <div>
        Array entries: ${this.observedAttributes.testArray && JSON.stringify(this.observedAttributes.testArray)}
      </div>
      <slot></slot>
    `
  }
}

MyButton.register()
