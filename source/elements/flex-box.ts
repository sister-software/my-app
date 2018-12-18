import createElement from '../create-element';

interface FlexBoxAttributes {
  flex: string
  grow: number
  wrap: boolean
  alignItems: 'normal' | "stretch" | "center" | "start" | "end" | "flex-start" | "flex-end" | "self-start" | "self-end" | "baseline" | "first baseline" | "last" | "safe" | "unsafe" | "inherit" | "initial" | "unset" | string
  shrink: number
  basis: string
}

const FlexBox = createElement('flex-box', {
  attributes: {
    'flex',
    'grow',
    'basis'
    {}
  ]
  lifecycle: {
    beforeElementInserted() {
      console.log(this.elementName)
    }
  }
})



const {currentScript} = document

if (currentScript) {
  const providedElementName = currentScript.getAttribute('element-name')
}

MyApp.register()
FlexBox.register()
