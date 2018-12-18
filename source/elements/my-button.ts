import MyElement, { ParseCSS, ParseHTML } from './my-element.js'

export default class MyButton extends MyElement {
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
        color: red;
      }
    `
  }

  template(html: ParseHTML) {
    return html`
      <div>
        My Button goes here. <span @click=${this.clickHandler}>Click me!</span>
        <div>Clicked ${(this as any).clickCount} times.</div>
      </div>
    `
  }

  clickHandler = (event: MouseEvent) => {
    console.log('hello', this, event)
  }
}

MyButton.register()
