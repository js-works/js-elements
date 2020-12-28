export type Props = Record<string, any> // TODO
export type VElement<T extends Props = Props> = Record<any, any> // TODO
export type Ref<T> = { current: T | null }
export type Methods = Record<string, (...args: any[]) => any>
export type EventHandler<T> = (ev: T) => void

export type UIEvent<T extends string, D = null> = CustomEvent<D> & { type: T }

export type VNode =
  | null
  | boolean
  | number
  | string
  | VElement
  | Iterable<VNode>

export type Task = () => void
export type Message = { type: string } & Record<string, any>

export type Component<T> = {
  new (): T
  main(self: T): () => VNode
}

export type MethodsOf<C> = Required<C> extends { ref: Ref<infer M> }
  ? M extends Methods
    ? M
    : never
  : never

export type Ctrl = {
  // library agnostic component control functions
  getName(): string
  isInitialized(): boolean
  isMounted(): boolean
  hasUpdated(): boolean
  refresh(): void
  afterMount(task: Task): void
  onceBeforeUpdate(task: Task): void
  beforeUpdate(task: Task): void
  afterUpdate(task: Task): void
  beforeUnmount(task: Task): void
  getRoot(): HTMLElement
  addStyles(styles: string | string[]): void
  send(message: Message): void
  receive(type: string, handler: (message: Message) => void): () => void
}
