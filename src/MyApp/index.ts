import MyElement from '../MyElement/index.js';

class MyApp extends MyElement {
  render() {
    return `
      <div class='my-app'>
        My app
        <slot></slot>
      </div>
    `
  }
}
