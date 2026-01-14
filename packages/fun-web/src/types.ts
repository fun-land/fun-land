/** Core types for fun-web */

export type Component<Props = {}> = (signal: AbortSignal, props: Props) => Element;

export type ElementChild = string | number | Element | null | undefined;
