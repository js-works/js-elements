import { html, prop, stateless } from '../../../../main/js-elements'
import '@vaadin/vaadin-button'
import '@vaadin/vaadin-icons'
import TextField from '../form/TextField'

const paginatorMeta = {
  name: 'jsc-paginator',

  prop: {
    pageIndex: prop.num.req(),
    pageSize: prop.num.req(),
    totalItemCount: prop.num.req()
  }
}
export default stateless(paginatorMeta, (props) => {
  return html`
    <div>
      <vaadin-button>
        <iron-icon icon="vaadin:angle-double-left" />
      </vaadin-button>
      <vaadin-button>
        <iron-icon icon="vaadin:angle-left" />
      </vaadin-button>
      Page
      <${TextField} value=${props.pageIndex + 1} />
      of
      <vaadin-button>
        <iron-icon icon="vaadin:angle-right" />
      </vaadin-button>
      <vaadin-button>
        <iron-icon icon="vaadin:angle-double-right" />
      </vaadin-button>
    </div>
  `
})