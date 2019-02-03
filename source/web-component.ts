// The <web-component element is

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

class ObservedAttribute extends HTMLElement {
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

abstract class WebComponent extends HTMLElement {
  static get defaultStyles() {
    // TODO: expose attributes as css variables.
    // e.g. var(--attribute-foo-bar)
    return `
      /* Default styles BEGIN */
      :host {
        display: block;
        position: relative;
      }

      :host([hidden]) {
        display: none;
      }

      content-container {
        display: block;
      }

      /* Default styles END */
    `
  }

  updateStyles() {
    // if (typeof this.styles !== 'function') return

    this.styleElement.innerHTML = [
      // TODO: Consider allowing adjustable default styles.
      this._constructor.defaultStyles
      // this.styles(css)
    ].join('\n')
  }

  // static get options(): MyElementOptions {
  static get options() {
    return {
      shadowRoot: { mode: 'closed' }
    }
  }

  // Hack to fix TypeScript's lack of constructor inference.
  // private get _constructor() {
  get _constructor() {
    return this.constructor
  }

  constructor() {
    super()

    const shadowRoot = this.attachShadow(this._constructor.options.shadowRoot)

    this.styleElement = document.createElement('style')
    this.contentElement = document.createElement('content-container')

    shadowRoot.appendChild(this.styleElement)
    shadowRoot.appendChild(this.contentElement)
    this.updateStyles()
  }

  /**
   * Defines a Web Component using a declaration in the DOM. e.g.
   * ```html
<web-component name="human-time">
  <style></style>
  <template></template>
  <script></script>
</web-component>
```
   * Note that the `<script>` tag must always be the last child element.
   */
  static defineFromElement(parentElement: Element) {
    const name = parentElement.getAttribute('name')

    if (!name) {
      throw new Error('Name attribute not provided. e.g. <web-component name="my-element></web-component>')
    }

    const options = {
      template: '',
      styles: '',
      constructorScript: function() {}
    }

    for (let childElement of Array.from(parentElement.children)) {
      const serializer = document.createElement('div')

      switch (childElement.nodeName) {
        case 'TEMPLATE':
          // Serialize the template fragment into HTML
          serializer.appendChild(document.importNode(childElement.content, true))

          options.template = serializer.innerHTML
          break

        case 'STYLE':
          options.styles = childElement.innerHTML
          break

        case 'SCRIPT':
          options.constructorScript = new Function(childElement.innerHTML)
          break
      }
    }

    parentElement.innerHTML = `<!--
      ${parentElement.innerHTML}
    -->`

    parentElement.setAttribute('defined', '')

    const Constructor = class extends WebComponent {
      constructor() {
        super()
        this.template = options.template
        this.styles = options.styles

        options.constructorScript.call(this)
      }
    }

    try {
      window.customElements.define(name, Constructor)
    } catch (error) {
      console.warn(`Could not register web component ${name}, error`)
    }

    try {
      // Reveal constructor on element for debugging purposes.
      parentElement.constructor = Constructor
    } catch (error) {
      console.error(error)
    }

    return Constructor
  }

  static async defineFromSrc(path: string) {
    if (typeof path !== 'string' || !path.endsWith('component.html')) {
      throw new Error('Path must end with `.component.html`')
    }

    // const response = window.fetch(path)
  }

  connectedCallback() {
    // console.log('activated', this)
  }
}

function observeWebComponents(target = document) {
  const DOMObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type !== 'childList') return

      Array.from(mutation.addedNodes).forEach(addedNode => {
        if (addedNode.nodeName !== 'WEB-COMPONENT') return

        const src = (addedNode as Element).getAttribute('src')

        if (src) {
          WebComponent.defineFromSrc(src)
          return
        }

        WebComponent.defineFromElement(addedNode as Element)
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

function initializeWebComponents() {}

observeWebComponents()
