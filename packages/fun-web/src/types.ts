/** Core types for fun-web */

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Component<Props = {}> = (
  signal: AbortSignal,
  props: Props
) => Element

export type ElementChild = string | number | Element | null | undefined
