/** DOM utilities for functional element creation and manipulation */
import { type FunState } from "@fun-land/fun-state";
import type { Component, ElementChild } from "./types";
import { Accessor } from "@fun-land/accessor";

export type Enhancer<El extends Element> = (element: El) => El;

/**
 * Create an HTML element with attributes and children
 *
 * Convention:
 * - Properties with dashes (data-*, aria-*) become attributes
 * - Properties starting with 'on' become event listeners
 * - Everything else becomes element properties
 *
 * @example
 * h('button', {className: 'btn', onclick: handler}, 'Click me')
 * h('div', {id: 'app', 'data-test': 'foo'}, [child1, child2])
 */
export const h = <Tag extends keyof HTMLElementTagNameMap>(
  tag: Tag,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attrs?: Record<string, any> | null,
  children?: ElementChild | ElementChild[]
): HTMLElementTagNameMap[Tag] => {
  const element = document.createElement(tag);

  // Apply attributes/properties/events
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value == null) continue;

      if (key.startsWith("on") && typeof value === "function") {
        // Event listener: onclick, onchange, etc.
        const eventName = key.slice(2).toLowerCase();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        element.addEventListener(eventName, value);
      } else if (key.includes("-") || key === "role") {
        // Attribute: data-*, aria-*, role, etc.
        element.setAttribute(key, String(value));
      } else {
        // Property: className, id, textContent, etc.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (element as any)[key] = value;
      }
    }
  }

  // Append children
  if (children != null) {
    appendChildren(children)(element);
  }

  return element;
};

/**
 * Append children to an element, flattening arrays and converting primitives to text nodes
 * @returns {Enhancer}
 */
const appendChildren =
  (children: ElementChild | ElementChild[]) =>
  <E extends HTMLElement>(parent: E): E => {
    if (Array.isArray(children)) {
      children.forEach((child) => appendChildren(child)(parent));
    } else if (children != null) {
      if (typeof children === "string" || typeof children === "number") {
        parent.appendChild(document.createTextNode(String(children)));
      } else {
        parent.appendChild(children);
      }
    }
    return parent;
  };

/**
 * Set text content of an element (returns element for chaining)
 * @returns {Enhancer}
 */
export const text =
  (content: string | number) =>
  <El extends Element>(el: El): El => {
    el.textContent = String(content);
    return el;
  };

/**
 * Set an attribute on an element (returns element for chaining)
 * @returns {Enhancer}
 */
export const attr =
  (name: string, value: string) =>
  <El extends Element>(el: El): El => {
    el.setAttribute(name, value);
    return el;
  };

/**
 * Set multiple attributes on an element (returns element for chaining)
 */
export const attrs =
  (obj: Record<string, string>) =>
  <El extends Element>(el: El): El => {
    Object.entries(obj).forEach(([name, value]) => {
      el.setAttribute(name, value);
    });
    return el;
  };

/**
 * update property `key` of element when state updates
 * @returns {Enhancer}
 */
export const bindProperty =
  <E extends Element, K extends keyof E & string>(
    key: K,
    state: FunState<E[K]>,
    signal: AbortSignal
  ) =>
  (el: E): E => {
    // initial sync
    el[key] = state.get();

    // reactive sync
    state.watch(signal, (v: E[K]) => {
      el[key] = v;
    });
    return el;
  };

/**
 * Add CSS classes to an element (returns element for chaining)
 * @returns {Enhancer}
 */
export const addClass =
  (...classes: string[]) =>
  <El extends Element>(el: El): El => {
    el.classList.add(...classes);
    return el;
  };

/**
 * Remove CSS classes from an element (returns element for chaining)
 * @returns {Enhancer}
 */
export const removeClass =
  (...classes: string[]) =>
  <El extends Element>(el: El): El => {
    el.classList.remove(...classes);
    return el;
  };

/**
 * Toggle a CSS class on an element (returns element for chaining)
 * @returns {Enhancer}
 */
export const toggleClass =
  (className: string, force?: boolean) =>
  (el: Element): Element => {
    el.classList.toggle(className, force);
    return el;
  };

/**
 * Append children to an element (returns parent for chaining)
 * @returns {Enhancer}
 */
export const append =
  (...children: Element[]) =>
  <El extends Element>(el: El): El => {
    children.forEach((child) => el.appendChild(child));
    return el;
  };

/**
 * Add event listener with required AbortSignal (returns element for chaining)
 * Signal is required to prevent forgetting cleanup
 * @returns {Enhancer}
 */
export const on =
  <E extends Element, K extends keyof GlobalEventHandlersEventMap>(
    type: K,
    handler: (
      ev: GlobalEventHandlersEventMap[K] & { currentTarget: E }
    ) => void,
    signal: AbortSignal
  ) =>
  (el: E): E => {
    el.addEventListener(type, handler as EventListener, { signal });
    return el;
  };

/**
 * Apply enhancers to an HTMLElement.
 */
export const enhance = <El extends Element>(
  x: El,
  ...fns: Array<Enhancer<El>>
) => fns.reduce((acc, fn) => fn(acc), x);

export type KeyedChildren = {
  /** Reconcile DOM children to match current list state */
  reconcile: () => void;
  /** Abort + remove all mounted children */
  dispose: () => void;
};

const keyOf = <T>(keyAcc: Accessor<T, string>, item: T): string => {
  const k = keyAcc.query(item)[0];
  if (k == null)
    throw new Error("bindListChildren: key accessor returned no value");
  return k;
};

const byKey = <T>(
  keyAcc: Accessor<T, string>,
  key: string
): Accessor<T[], T> => ({
  query: (xs) => {
    const hit = xs.find((t) => keyOf(keyAcc, t) === key);
    return hit ? [hit] : [];
  },
  mod: (f) => (xs) => {
    let found = false;
    return xs.map((t) => {
      if (keyOf(keyAcc, t) !== key) return t;
      if (found) throw new Error(`bindListChildren: duplicate key "${key}"`);
      found = true;
      return f(t);
    });
  },
});

type MountedRow = { el: Element; ctrl: AbortController };

/**
 * Keep an element's children in sync with a FunState<T[]> by stable identity.
 * Cleanup is driven by `signal` abort (no handle returned).
 */
export const bindListChildren =
  <T>(options: {
    signal: AbortSignal;
    state: FunState<T[]>;
    key: Accessor<T, string>;
    row: (args: {
      signal: AbortSignal;
      state: FunState<T>;
      remove: () => void;
    }) => Element;
  }) =>
  <El extends Element>(parent: El): El => {
    const { signal, state: list, key: keyAcc, row: renderRow } = options;
    const rows = new Map<string, MountedRow>();

    const dispose = (): void => {
      for (const row of rows.values()) {
        row.ctrl.abort();
        row.el.remove();
      }
      rows.clear();
    };

    const reconcile = (): void => {
      const items = list.get();

      const nextKeys: string[] = [];
      const seen = new Set<string>();
      for (const it of items) {
        const k = keyOf(keyAcc, it);
        if (seen.has(k))
          throw new Error(`bindListChildren: duplicate key "${k}"`);
        seen.add(k);
        nextKeys.push(k);
      }

      // remove missing
      for (const [k, row] of rows) {
        if (!seen.has(k)) {
          row.ctrl.abort();
          row.el.remove();
          rows.delete(k);
        }
      }

      // ensure present
      for (const k of nextKeys) {
        if (!rows.has(k)) {
          const ctrl = new AbortController();
          const itemState = list.focus(byKey(keyAcc, k));
          const el = renderRow({
            signal: ctrl.signal,
            state: itemState,
            remove: () =>
              list.mod((xs) => xs.filter((t) => keyOf(keyAcc, t) !== k)),
          });
          rows.set(k, { el, ctrl });
        }
      }

      // reorder with minimal DOM moves
      const children = parent.children; // live
      for (let i = 0; i < nextKeys.length; i++) {
        const k = nextKeys[i];
        const row = rows.get(k)!;
        const currentAtI = children[i];
        if (currentAtI !== row.el)
          parent.insertBefore(row.el, currentAtI ?? null);
      }
    };

    list.watch(signal, reconcile);
    signal.addEventListener("abort", dispose, { once: true });
    reconcile();

    return parent;
  };

/**
 * Conditionally render a component based on state and an optional predicate.
 * Returns a container element that mounts/unmounts the component as the condition changes.
 *
 * @example
 * // With boolean state
 * const showDetails = funState(false);
 * const detailsEl = renderWhen({
 *   state: showDetails,
 *   component: DetailsComponent,
 *   props: {id: 123},
 *   signal
 * });
 * parent.appendChild(detailsEl);
 *
 * @example
 * // With predicate
 * const rollType = funState(RollType.action);
 * const actionEl = renderWhen({
 *   state: rollType,
 *   predicate: (type) => type === RollType.action,
 *   component: ActionForm,
 *   props: {roll, uid},
 *   signal
 * });
 */
export function renderWhen<State, Props>(options: {
  state: FunState<State>;
  predicate?: (value: State) => boolean;
  component: Component<Props>;
  props: Props;
  signal: AbortSignal;
}): Element {
  const {
    state,
    predicate = (x) => x as unknown as boolean,
    component,
    props,
    signal,
  } = options;

  const container = document.createElement("span");
  container.style.display = "contents";
  let childCtrl: AbortController | null = null;
  let childEl: Element | null = null;

  const reconcile = () => {
    const shouldRender = predicate(state.get());

    if (shouldRender && !childEl) {
      // Mount the component
      childCtrl = new AbortController();
      childEl = component(childCtrl.signal, props);
      container.appendChild(childEl);
    } else if (!shouldRender && childEl) {
      // Unmount the component
      childCtrl?.abort();
      childEl.remove();
      childEl = null;
      childCtrl = null;
    }
  };

  // React to state changes
  state.watch(signal, reconcile);

  // Clean up when parent aborts
  signal.addEventListener(
    "abort",
    () => {
      childCtrl?.abort();
    },
    { once: true }
  );

  // Initial render
  reconcile();

  return container;
}

export const $ = <T extends Element>(selector: string): T | undefined =>
  document.querySelector<T>(selector) ?? undefined;

export const $$ = <T extends Element>(selector: string): T[] =>
  Array.from(document.querySelectorAll(selector));