import example from './example.mjs'
import {MyButton} from '../../build/MyElement/index.js'


function start() {
  // example()

  const app = new MyButton()
  document.body.appendChild(app)

}

if (document.readyState === 'loading') {
  document.addEventListener(start)
} else {
  start()
}
console.log('foo')
