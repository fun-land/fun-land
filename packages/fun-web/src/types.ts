/** Core types for fun-web */

export type Component<Props = {}, El extends Element = Element> = (
  signal: AbortSignal,
  props: Props
) => El;

export type ElementChild = string | number | Element | null | undefined;
