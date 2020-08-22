import { html, prop, sfc } from '../../../../main/js-elements'
import { $state } from '../../../../main/js-elements-ext'
import '@vaadin/vaadin-text-field'

export default sfc({
  name: 'jsc-text-field',

  props: {
    label: prop.str.opt()
  }
})((c, props) => {
  return () => html`<vaadin-text-field label=${props.label} />`
})
