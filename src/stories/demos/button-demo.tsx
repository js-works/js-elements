import { defineElement, html, prop } from '../../main/index'

defineElement('demo-button', {
  props: {
    text: prop.str.opt(''),
    onButtonAction: prop.func.opt()
  },

  styles: `
    .demo-button {
      border: none;
      color: white;
      background-color: black;
      padding: 5px 8px;
      outline: none;
    }

    .demo-button:hover {
      background-color: #444;
    }

    .demo-button:active {
      background-color: #555;
    }
  `,

  init(c, props) {
    const onClick = () => {
      if (props.onButtonAction) {
        props.onButtonAction(new CustomEvent('buttonaction'))
      }
    }

    return () => html`
      <button className="demo-button" onClick=${onClick}>${props.text}</button>
    `
  }
})

defineElement('button-demo', () => {
  const onButtonAction = (e: any) => alert(e.type) // TODO

  return html`
    <div>
      <h3>Button demo</h3>
      <demo-button @buttonAction="${onButtonAction}" text="Click me" />
    </div>
  `
})
