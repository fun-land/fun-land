/** Component mounting utilities */
import type { Component } from "./types";

export interface MountedComponent {
  element: Element;
  unmount: () => void;
}

/**
 * Mount a component to the DOM
 * Creates an AbortController to manage component lifecycle
 *
 * @param component - Component function to mount
 * @param props - Props passed to component (including any state)
 * @param container - DOM element to mount into
 * @returns Object with element reference and unmount function
 *
 * @example
 * const mounted = mount(Counter, {label: 'Count', state: counterState}, document.body)
 * // Later:
 * mounted.unmount() // cleanup all subscriptions and listeners
 */
export const mount = <Props>(
  component: Component<Props>,
  props: Props,
  container: Element
): MountedComponent => {
  const controller = new AbortController();
  const element = component(controller.signal, props);
  container.appendChild(element);

  return {
    element,
    unmount: () => {
      controller.abort(); // cleanup all subscriptions and listeners
      element.remove();
    },
  };
};
