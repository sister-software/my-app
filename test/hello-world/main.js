import example from './example.mjs'
import MyButton from '../../build/elements/my-button.js'

function start() {
  // example()

  const app = new MyButton()
  Object.assign(window, { app })
  document.body.appendChild(app)
}

if (document.readyState === 'loading') {
  document.addEventListener(start)
} else {
  start()
}
