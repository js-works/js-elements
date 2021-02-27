import { Component, Ctrl, Ref, VNode } from './types'
import { h, renderer } from './vdom'

// @ts-ignore
import { patch } from './superfine'

// === exports =======================================================

export { attr, elem, ref }

// === local data =====================================================

const attrsOptionsByComponentClass = new Map<{ new (): any }, AttrsOptions>()

// === constants =====================================================

const MESSAGE_TYPE_SUFFIX = '$$js-elements$$::'

// === types ==========================================================

type AttrKind =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | DateConstructor

type AttrOptions = {
  kind: AttrKind
}

type AttrsOptions = Map<string, AttrOptions>

type PropConverter<T> = {
  fromPropToString(value: T): string
  fromStringToProp(value: string): T
}

type Notifier = {
  subscribe(subscriber: () => void): void
  notify(): void
}

// === decorators =====================================================

function attr(kind: AttrKind): (proto: object, key: string) => void {
  return (proto: any, key: string) => {
    const componentClass = proto.constructor
    let attrsOptions = attrsOptionsByComponentClass.get(componentClass)

    if (!attrsOptions) {
      attrsOptions = new Map()
      attrsOptionsByComponentClass.set(componentClass, attrsOptions)
    }

    attrsOptions.set(key, { kind })
  }
}

// === pulbic API ====================================================

function ref<T>(value: T | null = null): Ref<T> {
  return { current: value }
}

function elem(tagName: string, main: () => () => VNode): Component<{}>

function elem<P>(
  tagName: string,
  propsClass: { new (): P },
  main: (props: P) => () => VNode
): Component<Partial<P>>

function elem(tagName: string, arg2: any, arg3?: any): any {
  if (process.env.NODE_ENV === ('development' as string)) {
    const argc = arguments.length

    if (typeof tagName !== 'string') {
      throw new TypeError('[component] First argument must be a string')
    }

    if (typeof arg2 !== 'function') {
      throw new TypeError('[component] Expected function as second argument')
    }

    if (argc > 2 && typeof arg3 !== 'function') {
      throw new TypeError('[component] Expected function as third argument')
    }

    if (argc > 3) {
      throw new TypeError('[component] Unexpected fourth argument')
    }
  }

  const propsClass = typeof arg3 === 'function' ? arg2 : null
  const main = propsClass ? arg3 : arg2

  const attrsOptions = propsClass
    ? attrsOptionsByComponentClass.get(propsClass) || null
    : null

  const customElementClass = buildCustomElementClass(
    tagName,
    propsClass,
    attrsOptions,
    main
  )

  const ret = h.bind(tagName)

  Object.defineProperty(ret, 'tagName', {
    value: tagName
  })

  if (customElements.get(tagName)) {
    console.clear()
    location.reload()
  } else {
    customElements.define(tagName, customElementClass)
  }

  return ret
}

// === locals ========================================================

function buildCustomElementClass(
  name: string,
  propsClass: { new (): object } | null,
  attrsOptions: AttrsOptions | null,
  main: (props: any) => () => VNode
): CustomElementConstructor {
  const propNames = propsClass ? Object.keys(new propsClass()) : []

  const attrNameToPropNameMap: Map<string, string> = new Map(
    Array.from(attrsOptions ? attrsOptions.keys() : []).map((propName) => [
      propName.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase(),
      propName
    ])
  )

  const propNameToAttrNameMap: Map<string, string> = new Map(
    Array.from(attrNameToPropNameMap).map(([k, v]) => [v, k])
  )

  const propNameToConverterMap: Map<string, PropConverter<any>> = new Map(
    !attrsOptions
      ? null
      : Array.from(attrsOptions.entries()).map(([propName, attrOptions]) => [
          propName,
          commonPropConverters[attrOptions.kind.name]
        ])
  )

  const customElementClass = class extends HTMLElement {
    static observedAttributes = Array.from(attrNameToPropNameMap.keys())

    connectedCallback() {
      // TODO - this is extremely odd
      this.connectedCallback()
    }

    disconnectedCallback() {
      // TODO - this is extremely odd
      this.disconnectedCallback()
    }

    getAttribute(attrName: string): string | null {
      return this.getAttribute(attrName)
    }

    attributeChangedCallback() {
      this.attributeChangedCallback.apply(this, arguments as any)
    }

    constructor() {
      super()
      const self: any = this
      const data: any = propsClass ? new propsClass() : {}
      const ctrl = createCtrl()

      let isInitialized = false
      let isMounted = false
      let hasUpdated = false
      let hasRequestedRefresh = false

      let afterMountNotifier: Notifier | undefined
      let beforeUpdateNotifier: Notifier | undefined
      let afterUpdateNotifier: Notifier | undefined
      let beforeUnmountNotifier: Notifier | undefined
      let onceBeforeUpdateActions: (() => void)[] | undefined

      let stylesElement: HTMLElement | undefined
      let contentElement: HTMLElement | undefined
      let render: (() => VNode) | undefined

      for (const key of propNames) {
        if (key !== 'ref') {
          Object.defineProperty(self, key, {
            get() {
              return data[key]
            },

            set(value: any) {
              data[key] = value
              ctrl.refresh()
            }
          })
        } else {
          let componentMethods: any = null
          data.ref = {}

          Object.defineProperty(data.ref, 'current', {
            enumerable: true,

            get() {
              return componentMethods
            },

            set(methods: any) {
              if (componentMethods) {
                throw new Error('Methods can only be set once')
              } else if (methods) {
                componentMethods = methods
                Object.assign(self, componentMethods)
              }
            }
          })
        }
      }

      self.connectedCallback = () => {
        self.attachShadow({ mode: 'open' })
        const root = self.shadowRoot!

        stylesElement = document.createElement('span')
        contentElement = document.createElement('span')

        stylesElement.setAttribute('data-role', 'styles')
        contentElement.setAttribute('data-role', 'content')

        root.appendChild(stylesElement)
        root.appendChild(contentElement)

        refresh()
      }

      self.disconnectedCallback = () => {
        beforeUnmountNotifier && beforeUnmountNotifier.notify()
        contentElement!.innerHTML = ''
      }

      self.getAttribute = (attrName: string): string | null => {
        const propName = attrNameToPropNameMap.get(attrName)

        if (propName) {
          return propNameToConverterMap
            .get(propName)!
            .fromPropToString(self[propName])
        }

        return super.getAttribute(attrName)
      }

      self.attributeChangedCallback = (
        attrName: string,
        oldValue: string | null,
        value: string | null
      ) => {
        const propName = attrNameToPropNameMap.get(attrName)

        if (propName && typeof value === 'string') {
          self[propName] = propNameToConverterMap
            .get(propName)!
            .fromStringToProp(value)
        }
      }

      function refresh() {
        if (isMounted) {
          if (onceBeforeUpdateActions && onceBeforeUpdateActions.length) {
            try {
              onceBeforeUpdateActions.forEach((action) => action())
            } finally {
              onceBeforeUpdateActions.length = 0
            }
          }

          beforeUpdateNotifier && beforeUpdateNotifier.notify()
        }

        if (!render) {
          ;(globalThis as any).__currCompCtrl__ = ctrl

          try {
            render = main(data)
          } finally {
            ;(globalThis as any).__currCompCtrl__ = null
          }
        }

        const content = render()

        // TODO
        try {
          renderer(content, contentElement!)
        } catch (e) {
          console.error(`Render error in "${ctrl.getName()}"`)
          throw e
        }

        isInitialized = true

        if (!isMounted) {
          isMounted = true
          afterMountNotifier && afterMountNotifier.notify()
        } else {
          hasUpdated = true
          afterUpdateNotifier && afterUpdateNotifier.notify()
        }
      }

      function createCtrl(): Ctrl {
        return {
          getName: () => name,
          isInitialized: () => isInitialized,
          isMounted: () => isMounted,
          hasUpdated: () => hasUpdated,

          refresh() {
            if (!hasRequestedRefresh) {
              hasRequestedRefresh = true

              requestAnimationFrame(() => {
                hasRequestedRefresh = false
                refresh()
              })
            }
          },

          afterMount(task) {
            afterMountNotifier || (afterMountNotifier = createNotifier())
            afterMountNotifier.subscribe(task)
          },

          onceBeforeUpdate(task) {
            onceBeforeUpdateActions || (onceBeforeUpdateActions = [])
            onceBeforeUpdateActions.push(task)
          },

          beforeUpdate(task) {
            beforeUpdateNotifier || (beforeUpdateNotifier = createNotifier())
            beforeUpdateNotifier.subscribe(task)
          },

          afterUpdate(task) {
            afterUpdateNotifier || (afterUpdateNotifier = createNotifier())
            afterUpdateNotifier.subscribe(task)
          },

          beforeUnmount(task) {
            beforeUnmountNotifier || (beforeUnmountNotifier = createNotifier())
            beforeUnmountNotifier.subscribe(task)
          },

          getHost() {
            return self
          },

          send(msg): void {
            self.dispatchEvent(
              new CustomEvent(MESSAGE_TYPE_SUFFIX + msg.type, {
                bubbles: true,
                composed: true,
                detail: msg
              })
            )
          },

          receive(type, handler) {
            const root = contentElement!

            const listener = (ev: Event) => {
              ev.stopPropagation()
              handler((ev as any).detail)
            }

            const unsubscribe = () => {
              root.removeEventListener(MESSAGE_TYPE_SUFFIX + type, listener)
            }

            root.addEventListener(MESSAGE_TYPE_SUFFIX + type, listener)
            this.beforeUnmount(unsubscribe)

            return unsubscribe
          }
        }
      }
    }
  }

  return customElementClass
}

// === createNotifier ================================================

function createNotifier(): Notifier {
  const subscribers: (() => void)[] = []

  return {
    subscribe(subscriber: () => void) {
      subscribers.push(subscriber)
    },

    notify() {
      subscribers.forEach((subscriber) => subscriber())
    }
  }
}

// === attribute converters ==========================================

const commonPropConverters: Record<string, PropConverter<any>> = {
  String: {
    fromPropToString: (it: string) => it,
    fromStringToProp: (it: string) => it
  },

  Number: {
    fromPropToString: (it: number) => String(it),
    fromStringToProp: (it: string) => Number.parseFloat(it)
  },

  Boolean: {
    fromPropToString: (it: boolean) => (it ? 'true' : 'false'),
    fromStringToProp: (it: string) => (it === 'true' ? true : false)
  },

  Date: {
    fromPropToString: (it: Date) => it.toISOString().substr(0, 10),

    fromStringToProp: (it: string) => {
      ;/^[0-9]{1,4}-[0-9]{1,2}-[0-9]{1,2}$/.test(it)
        ? new Date(Date.parse(it))
        : new Date(NaN)
    }
  }
}
