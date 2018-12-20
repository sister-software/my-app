// import { ParseCSS, ParseHTML } from './my-element.js'
// import createElement from '../create-element.js'

// const MyButton = createElement('my-button', {
//   styles(css: ParseCSS) {
//     return css`
//       :host {
//         color: red;
//       }
//     `
//   },
//   template(html: ParseHTML) {
//     return html`
//       <div>
//         My Button goes here. <span @click=${this.clickHandler}>Click me!</span>
//         <div>Clicked ${(this as any).clickCount} times.</div>
//       </div>
//     `
//   },
//   methods: {
//     clickHandler = (event: MouseEvent) => {
//       console.log('hello', this, event)
//     }
//   }
// })

// MyButton.register()
