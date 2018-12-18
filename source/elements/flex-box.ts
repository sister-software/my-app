import createElement from '../create-element'

interface FlexBoxAttributes {
  flex?: string
  grow?: number
  wrap?: boolean
  alignItems?:
    | 'normal'
    | 'stretch'
    | 'center'
    | 'start'
    | 'end'
    | 'flex-start'
    | 'flex-end'
    | 'self-start'
    | 'self-end'
    | 'baseline'
    | 'last'
    | 'safe'
    | 'unsafe'
    | 'inherit'
    | 'initial'
    | 'unset'
  shrink?: number
  basis?: string
}

const foo: FlexBoxAttributes = {
  alignItems: 'flex-start'
}

const FlexBox = createElement<FlexBoxAttributes>('flex-box', {
  styles(css) {
    return css`
      :host {
        display: flex;
      }
    `
  },
  template(html) {
    // Hypothetical
    function pluckKeys(): any {}
    const { attributes } = this

    Object.assign(this.shadowRoot.styles, pluckKeys(attributes, 'alignItems', 'etc...'))

    return html`
      <div><slot></slot></div>
    `
  },
  lifecycle: {
    beforeElementInserted() {
      console.log(this.elementName)
    }
  }
})
