import { ReadyEvent } from './web-component'

const globalStyles = document.createElement('style')

globalStyles.id = 'web-component-global-styles'
globalStyles.innerHTML = `
  web-component {
    display: none !important;
  }

  observed-attribute {
    display: none !important;
  }
`

document.head.appendChild(globalStyles)

export class ObservedAttribute extends HTMLElement {
  static observedAttributes() {
    return ['name', 'type', 'required']
  }

  get name() {
    return this.getAttribute('name')
  }

  get type() {
    return this.getAttribute('type')
  }

  get required() {
    return !!this.getAttribute('required')
  }

  defaultValue() {
    return this.innerHTML
  }

  get attributeDefinition() {
    return {
      type: this.type,
      required: this.required,
      defaultValue: this.defaultValue
    }
  }
}

window.customElements.define('observed-attribute', ObservedAttribute)

let WebComponent: ReadyEvent['detail']['WebComponent'] | null = null
const componentQueue: Element[] = []

function parseElement(element: Element) {
  element.remove()

  if (WebComponent === null) {
    componentQueue.push(element)
    return
  }

  const src = element.getAttribute('src')

  if (src) {
    WebComponent.defineFromSrc(src)
  } else {
    WebComponent.defineFromElement(element)
  }
}

function observeWebComponents(target = document) {
  const DOMObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type !== 'childList') return

      Array.from(mutation.addedNodes).forEach(addedNode => {
        if (addedNode.nodeName !== 'WEB-COMPONENT') return

        parseElement(addedNode as Element)
      })
    })
  })

  DOMObserver.observe(target, {
    childList: true,
    subtree: true,
    attributes: false
  })

  return DOMObserver
}

function initializeWebComponents() {
  document.addEventListener('WebComponentsReady', event => {
    WebComponent = (event as ReadyEvent).detail.WebComponent

    let queuedElement: Element | undefined
    while ((queuedElement = componentQueue.pop())) {
      parseElement(queuedElement)
    }
  })

  return observeWebComponents()
}
