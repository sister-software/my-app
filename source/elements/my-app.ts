import MyElement, { ParseHTML } from './my-element.js'

class MyApp extends MyElement {
  template(html: ParseHTML) {
    return html`
      <div class="my-app">
        <h1>My app</h1>
        <slot></slot>
      </div>
    `
  }
}

export default MyApp
