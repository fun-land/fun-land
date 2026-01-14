import {
  h,
  text,
  attr,
  attrs,
  append,
  bindProperty,
  addClass,
  toggleClass,
  removeClass,
  on,
  enhance,
  $,
  $$,
  renderWhen,
} from "./dom";
import { FunState, funState } from "./state";

describe("h()", () => {
  it("should create an element", () => {
    const el = h("div");
    expect(el.tagName).toBe("DIV");
  });

  it("should set properties", () => {
    const el = h("div", { id: "test", className: "foo" });
    expect(el.id).toBe("test");
    expect(el.className).toBe("foo");
  });

  it("should set attributes with dashes", () => {
    const el = h("div", { "data-test": "value", "aria-label": "test" });
    expect(el.getAttribute("data-test")).toBe("value");
    expect(el.getAttribute("aria-label")).toBe("test");
  });

  it("should set textContent", () => {
    const el = h("div", { textContent: "Hello" });
    expect(el.textContent).toBe("Hello");
  });

  it("should append string children", () => {
    const el = h("div", null, "Hello");
    expect(el.textContent).toBe("Hello");
  });

  it("should append number children", () => {
    const el = h("div", null, 42);
    expect(el.textContent).toBe("42");
  });

  it("should append element children", () => {
    const child = h("span", null, "child");
    const el = h("div", null, child);
    expect(el.children.length).toBe(1);
    expect(el.children[0]).toBe(child);
  });

  it("should append array of children", () => {
    const el = h("div", null, [h("span", null, "one"), h("span", null, "two")]);
    expect(el.children.length).toBe(2);
    expect(el.textContent).toBe("onetwo");
  });

  it("should flatten nested arrays", () => {
    const el = h("div", null, [
      h("span", null, "one"),
      [h("span", null, "two"), h("span", null, "three")] as any,
    ]);
    expect(el.children.length).toBe(3);
  });

  it("should skip null and undefined children", () => {
    const el = h("div", null, [
      h("span", null, "one"),
      null,
      undefined,
      h("span", null, "two"),
    ]);
    expect(el.children.length).toBe(2);
  });

  it("should attach event listeners", () => {
    const handler = jest.fn();
    const el = h("button", { onclick: handler });
    el.click();
    expect(handler).toHaveBeenCalled();
  });

  it("should handle multiple event types", () => {
    const clickHandler = jest.fn();
    const mouseoverHandler = jest.fn();
    const el = h("button", {
      onclick: clickHandler,
      onmouseover: mouseoverHandler,
    });

    el.click();
    expect(clickHandler).toHaveBeenCalled();

    el.dispatchEvent(new MouseEvent("mouseover"));
    expect(mouseoverHandler).toHaveBeenCalled();
  });

  it("should skip null and undefined attributes", () => {
    const el = h("div", {
      id: "test",
      "data-foo": null,
      "data-bar": undefined,
      className: "valid",
    });
    expect(el.id).toBe("test");
    expect(el.className).toBe("valid");
    expect(el.getAttribute("data-foo")).toBeNull();
    expect(el.getAttribute("data-bar")).toBeNull();
  });
});

describe("text()", () => {
  it("should set text content", () => {
    const el = document.createElement("div");
    text("Hello")(el);
    expect(el.textContent).toBe("Hello");
  });

  it("should return element for chaining", () => {
    const el = document.createElement("div");
    const result = text("Hello")(el);
    expect(result).toBe(el);
  });

  it("should convert numbers to strings", () => {
    const el = document.createElement("div");
    text(42)(el);
    expect(el.textContent).toBe("42");
  });
});

describe("attr()", () => {
  it("should set attribute", () => {
    const el = document.createElement("div");
    attr("data-test", "value")(el);
    expect(el.getAttribute("data-test")).toBe("value");
  });

  it("should return element for chaining", () => {
    const el = document.createElement("div");
    const result = attr("data-test", "value")(el);
    expect(result).toBe(el);
  });
});

describe("attrs()", () => {
  it("should set multiple attributes", () => {
    const el = document.createElement("div");
    attrs({ "data-test": "value", "aria-label": "Test" })(el);
    expect(el.getAttribute("data-test")).toBe("value");
    expect(el.getAttribute("aria-label")).toBe("Test");
  });

  it("should return element for chaining", () => {
    const el = document.createElement("div");
    const result = attrs({ "data-test": "value" })(el);
    expect(result).toBe(el);
  });
});

describe("addClass()", () => {
  it("should add a single class", () => {
    const el = document.createElement("div");
    addClass("foo")(el);
    expect(el.classList.contains("foo")).toBe(true);
  });

  it("should add multiple classes", () => {
    const el = document.createElement("div");
    addClass("foo", "bar")(el);
    expect(el.classList.contains("foo")).toBe(true);
    expect(el.classList.contains("bar")).toBe(true);
  });

  it("should return element for chaining", () => {
    const el = document.createElement("div");
    const result = addClass("foo")(el);
    expect(result).toBe(el);
  });
});

describe("removeClass()", () => {
  it("should remove a class", () => {
    const el = document.createElement("div");
    el.classList.add("foo", "bar");
    removeClass("foo")(el);
    expect(el.classList.contains("foo")).toBe(false);
    expect(el.classList.contains("bar")).toBe(true);
  });

  it("should return element for chaining", () => {
    const el = document.createElement("div");
    const result = removeClass("foo")(el);
    expect(result).toBe(el);
  });
});

describe("toggleClass()", () => {
  it("should toggle a class on", () => {
    const el = document.createElement("div");
    toggleClass("foo")(el);
    expect(el.classList.contains("foo")).toBe(true);
  });

  it("should toggle a class off", () => {
    const el = document.createElement("div");
    el.classList.add("foo");
    toggleClass("foo")(el);
    expect(el.classList.contains("foo")).toBe(false);
  });

  it("should force add with true", () => {
    const el = document.createElement("div");
    toggleClass("foo", true)(el);
    expect(el.classList.contains("foo")).toBe(true);
    toggleClass("foo", true)(el);
    expect(el.classList.contains("foo")).toBe(true);
  });

  it("should force remove with false", () => {
    const el = document.createElement("div");
    el.classList.add("foo");
    toggleClass("foo", false)(el);
    expect(el.classList.contains("foo")).toBe(false);
  });

  it("should return element for chaining", () => {
    const el = document.createElement("div");
    const result = toggleClass("foo")(el);
    expect(result).toBe(el);
  });
});

describe("append()", () => {
  it("should append a single child", () => {
    const parent = document.createElement("div");
    const child = document.createElement("span");
    append(child)(parent);
    expect(parent.children.length).toBe(1);
    expect(parent.children[0]).toBe(child);
  });

  it("should append multiple children", () => {
    const parent = document.createElement("div");
    const child1 = document.createElement("span");
    const child2 = document.createElement("p");
    append(child1, child2)(parent);
    expect(parent.children.length).toBe(2);
    expect(parent.children[0]).toBe(child1);
    expect(parent.children[1]).toBe(child2);
  });

  it("should return element for chaining", () => {
    const parent = document.createElement("div");
    const child = document.createElement("span");
    const result = append(child)(parent);
    expect(result).toBe(parent);
  });
});

describe("bindProperty()", () => {
  it("should set initial property value from state", () => {
    const el = document.createElement("input") as HTMLInputElement;
    const controller = new AbortController();

    const state = funState("hello");
    enhance(el, bindProperty("value", state, controller.signal));

    expect(el.value).toBe("hello");
    controller.abort();
  });

  it("should update property when state changes", () => {
    const el = document.createElement("input") as HTMLInputElement;
    const controller = new AbortController();

    const state = funState("hello");
    enhance(el, bindProperty("value", state, controller.signal));

    expect(el.value).toBe("hello");

    state.set("world");
    expect(el.value).toBe("world");

    controller.abort();
  });

  it("should stop updating after signal aborts", () => {
    const el = h("input");
    const controller = new AbortController();

    const state = funState("hello");
    enhance(el, bindProperty("value", state, controller.signal));

    controller.abort();

    state.set("world");
    expect(el.value).toBe("hello"); // Should not update after abort
  });

  it("should return element for chaining", () => {
    const el = h("input");
    const controller = new AbortController();

    const state = funState("hello");
    const result = enhance(el, bindProperty("value", state, controller.signal));

    expect(result).toBe(el);
    controller.abort();
  });
});

describe("on()", () => {
  it("should attach event listener with signal", () => {
    const el = document.createElement("button");
    const handler = jest.fn();
    const controller = new AbortController();

    on("click", handler, controller.signal)(el);
    el.click();

    expect(handler).toHaveBeenCalled();
  });

  it("should cleanup listener on abort", () => {
    const el = document.createElement("button");
    const handler = jest.fn();
    const controller = new AbortController();

    enhance(el, on("click", handler, controller.signal));
    controller.abort();
    el.click();

    expect(handler).not.toHaveBeenCalled();
  });

  it("should return element for chaining", () => {
    const el = document.createElement("button");
    const controller = new AbortController();
    const result = on("click", () => {}, controller.signal)(el);
    expect(result).toBe(el);
  });
});

describe("pipeEndo()", () => {
  it("should apply functions in order", () => {
    const el = document.createElement("div");
    const result = enhance(
      el,
      text("Hello"),
      addClass("foo", "bar"),
      attr("data-test", "value")
    );

    expect(result).toBe(el);
    expect(el.textContent).toBe("Hello");
    expect(el.classList.contains("foo")).toBe(true);
    expect(el.classList.contains("bar")).toBe(true);
    expect(el.getAttribute("data-test")).toBe("value");
  });
});

type Keyed = { key: string };
type Item = Keyed & { label: string };

function makeAbortSignal(): {
  controller: AbortController;
  signal: AbortSignal;
} {
  const controller = new AbortController();
  return { controller, signal: controller.signal };
}

/**
 * Because the renderRow above can't reliably read the key from itemState in this harness,
 * we’ll make a dedicated renderRow for tests that receives the key by closure from the list.
 *
 * This version doesn't require list.focus, so it's robust.
 */
// function setupKeyedChildrenWithKeyAwareRenderer(
//   parent: Element,
//   signal: AbortSignal,
//   listState: { get: () => Item[]; watch: FunState<Item[]>["watch"] }
// ) {
//   const mountCountByKey = new Map<string, number>();
//   const abortCountByKey = new Map<string, number>();
//   const elByKey = new Map<string, Element>();

//   const api = keyedChildren<Item>(parent, signal, listState as any, (row) => {
//     // In your real impl, itemState.get().key should exist.
//     const item = row.state.get();
//     const k = item.key;

//     const el = document.createElement("li");
//     el.dataset.key = k;
//     el.textContent = item.label;

//     elByKey.set(k, el);
//     mountCountByKey.set(k, (mountCountByKey.get(k) ?? 0) + 1);

//     row.signal.addEventListener("abort", () => {
//       abortCountByKey.set(k, (abortCountByKey.get(k) ?? 0) + 1);
//     });

//     return el;
//   });

//   return { api, mountCountByKey, abortCountByKey, elByKey };
// }

// describe("keyedChildren", () => {
//   test("mounts initial rows in order", () => {
//     const container = document.createElement("ul");
//     const { controller, signal } = makeAbortSignal();

//     const listState = funState<Item[]>([
//       { key: "a", label: "A" },
//       { key: "b", label: "B" },
//     ]);

//     // Use the key-aware renderer; it expects itemState.get()
//     const { elByKey } = setupKeyedChildrenWithKeyAwareRenderer(
//       container,
//       signal,
//       listState
//     );

//     expect(container.children).toHaveLength(2);
//     expect((container.children[0] as HTMLElement).dataset.key).toBe("a");
//     expect((container.children[1] as HTMLElement).dataset.key).toBe("b");
//     expect(elByKey.get("a")?.textContent).toBe("A");
//     expect(elByKey.get("b")?.textContent).toBe("B");

//     controller.abort();
//   });

//   test("does not recreate existing row elements when item contents change", () => {
//     const container = document.createElement("ul");
//     const { controller, signal } = makeAbortSignal();

//     const listState = funState<Item[]>([
//       { key: "a", label: "A" },
//       { key: "b", label: "B" },
//     ]);

//     const { mountCountByKey } = setupKeyedChildrenWithKeyAwareRenderer(
//       container,
//       signal,
//       listState
//     );

//     const firstElA = container.children[0] as Element;
//     const firstElB = container.children[1] as Element;

//     // Update label of "a" (array ref changes)
//     listState.set([
//       { key: "a", label: "A!" },
//       { key: "b", label: "B" },
//     ]);

//     // Elements should be the same instances (not remounted)
//     expect(container.children[0]).toBe(firstElA);
//     expect(container.children[1]).toBe(firstElB);

//     // Mount counts should still be 1 each
//     expect(mountCountByKey.get("a")).toBe(1);
//     expect(mountCountByKey.get("b")).toBe(1);

//     controller.abort();
//   });

//   test("reorders by moving existing nodes, without recreating them", () => {
//     const container = document.createElement("ul");
//     const { controller, signal } = makeAbortSignal();

//     const listeners = new Set<(xs: Item[]) => void>();
//     let items: Item[] = [
//       { key: "a", label: "A" },
//       { key: "b", label: "B" },
//       { key: "c", label: "C" },
//     ];

//     const listState: FunState<Item[]> = {
//       get: () => items,
//       query: () => {
//         throw new Error("not used");
//       },
//       mod: (f: (items: Item[]) => Item[]) => {
//         items = f(items);
//         listeners.forEach((l) => l(items));
//       },
//       set: (v: Item[]) => {
//         items = v;
//         listeners.forEach((l) => l(items));
//       },
//       focus: (acc: any) =>
//         ({
//           get: () => acc.query(items)[0],
//           watch: (_s: AbortSignal, _cb: any) => void 0,
//         }) as any,
//       prop: () => {
//         throw new Error("not used");
//       },
//       watch: (sig: AbortSignal, cb: (items: Item[]) => void) => {
//         listeners.add(cb);
//         sig.addEventListener(
//           "abort",
//           () => {
//             listeners.delete(cb);
//           },
//           { once: true }
//         );
//       },
//       watchAll: (_sig: AbortSignal, _cb: (values: Item[][]) => void) => {
//         throw new Error("watchAll not used in these tests");
//       },
//     };

//     const { mountCountByKey } = setupKeyedChildrenWithKeyAwareRenderer(
//       container,
//       signal,
//       listState
//     );

//     const elA = container.children[0];
//     const elB = container.children[1];
//     const elC = container.children[2];

//     // Reorder
//     listState.set([
//       { key: "c", label: "C" },
//       { key: "a", label: "A" },
//       { key: "b", label: "B" },
//     ]);

//     expect((container.children[0] as HTMLElement).dataset.key).toBe("c");
//     expect((container.children[1] as HTMLElement).dataset.key).toBe("a");
//     expect((container.children[2] as HTMLElement).dataset.key).toBe("b");

//     // Same element identity (moved, not recreated)
//     expect(container.children[1]).toBe(elA);
//     expect(container.children[2]).toBe(elB);
//     expect(container.children[0]).toBe(elC);

//     // Not remounted
//     expect(mountCountByKey.get("a")).toBe(1);
//     expect(mountCountByKey.get("b")).toBe(1);
//     expect(mountCountByKey.get("c")).toBe(1);

//     controller.abort();
//   });

//   test("removes rows when keys disappear and aborts their row controllers", () => {
//     const container = document.createElement("ul");
//     const { controller, signal } = makeAbortSignal();

//     const listeners = new Set<(xs: Item[]) => void>();
//     let items: Item[] = [
//       { key: "a", label: "A" },
//       { key: "b", label: "B" },
//     ];

//     const listState: FunState<Item[]> = {
//       get: () => items,
//       query: () => {
//         throw new Error("not used");
//       },
//       mod: (f: (items: Item[]) => Item[]) => {
//         items = f(items);
//         listeners.forEach((l) => l(items));
//       },
//       set: (v: Item[]) => {
//         items = v;
//         listeners.forEach((l) => l(items));
//       },
//       focus: (acc: any) =>
//         ({
//           get: () => acc.query(items)[0],
//           watch: (_s: AbortSignal, _cb: any) => void 0,
//         }) as any,
//       prop: () => {
//         throw new Error("not used");
//       },
//       watch: (sig: AbortSignal, cb: (items: Item[]) => void) => {
//         listeners.add(cb);
//         sig.addEventListener(
//           "abort",
//           () => {
//             listeners.delete(cb);
//           },
//           { once: true }
//         );
//       },
//       watchAll: (_sig: AbortSignal, _cb: (values: Item[][]) => void) => {
//         throw new Error("watchAll not used in these tests");
//       },
//     };

//     const { abortCountByKey } = setupKeyedChildrenWithKeyAwareRenderer(
//       container,
//       signal,
//       listState
//     );

//     expect(container.children).toHaveLength(2);

//     // Remove "a"
//     listState.set([{ key: "b", label: "B" }]);

//     expect(container.children).toHaveLength(1);
//     expect((container.children[0] as HTMLElement).dataset.key).toBe("b");

//     // "a" row controller should have been aborted once
//     expect(abortCountByKey.get("a")).toBe(1);

//     controller.abort();
//   });

//   test("unsubscribes from list updates on parent abort", () => {
//     const container = document.createElement("ul");
//     const { controller, signal } = makeAbortSignal();

//     const list = funState<Item[]>([{ key: "a", label: "A" }]);

//     // Subscribe and verify callback is called before abort
//     const callback = jest.fn();
//     list.watch(signal, callback);

//     list.set([{ key: "a", label: "A2" }]);
//     // Called with initial value, then with updated value
//     expect(callback).toHaveBeenCalledTimes(2);

//     // After abort, callback should not be called
//     controller.abort();

//     list.set([{ key: "a", label: "A3" }]);
//     expect(callback).toHaveBeenCalledTimes(2); // Still 2, not called again

//     void container;
//   });

//   test("throws error on duplicate keys", () => {
//     const container = document.createElement("ul");
//     const { controller, signal } = makeAbortSignal();

//     const listState = funState<Item[]>([
//       { key: "a", label: "A" },
//       { key: "a", label: "B" }, // duplicate key!
//     ]);

//     expect(() => {
//       keyedChildren(container, signal, listState, () => {
//         return document.createElement("li");
//       });
//     }).toThrow('keyedChildren: duplicate key "a"');

//     controller.abort();
//   });
// });

describe("$ (querySelector)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  test("should return element if found", () => {
    const div = h("div", { id: "test", className: "my-class" });
    document.body.appendChild(div);

    const result = $<HTMLDivElement>("#test");
    expect(result).toBe(div);
    expect(result?.id).toBe("test");
  });

  test("should return undefined if not found", () => {
    const result = $("#nonexistent");
    expect(result).toBeUndefined();
  });

  test("should work with class selectors", () => {
    const div = h("div", { className: "test-class" });
    document.body.appendChild(div);

    const result = $(".test-class");
    expect(result).toBe(div);
  });

  test("should return first matching element", () => {
    const div1 = h("div", { className: "item" });
    const div2 = h("div", { className: "item" });
    document.body.appendChild(div1);
    document.body.appendChild(div2);

    const result = $(".item");
    expect(result).toBe(div1);
  });

  test("should infer element type", () => {
    const input = h("input", { type: "text", id: "myinput" });
    document.body.appendChild(input);

    const result = $<HTMLInputElement>("#myinput");
    expect(result).toBe(input);
    // TypeScript should know this is HTMLInputElement
    expect(result!.value).toBeDefined();
  });
});

describe("$$ (querySelectorAll)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  test("should return array of matching elements", () => {
    const div1 = h("div", { className: "item" });
    const div2 = h("div", { className: "item" });
    const div3 = h("div", { className: "item" });
    document.body.appendChild(div1);
    document.body.appendChild(div2);
    document.body.appendChild(div3);

    const results = $$(".item");
    expect(results).toHaveLength(3);
    expect(results[0]).toBe(div1);
    expect(results[1]).toBe(div2);
    expect(results[2]).toBe(div3);
  });

  test("should return empty array if no matches", () => {
    const results = $$(".nonexistent");
    expect(results).toEqual([]);
    expect(Array.isArray(results)).toBe(true);
  });

  test("should work with complex selectors", () => {
    const container = h("div", { id: "container" });
    const item1 = h("span", { className: "item" });
    const item2 = h("span", { className: "item" });
    container.appendChild(item1);
    container.appendChild(item2);
    document.body.appendChild(container);

    const results = $$<HTMLSpanElement>("#container .item");
    expect(results).toHaveLength(2);
    expect(results[0]).toBe(item1);
    expect(results[1]).toBe(item2);
  });

  test("should return true array, not NodeList", () => {
    const div1 = h("div", { className: "item" });
    document.body.appendChild(div1);

    const results = $$(".item");
    expect(Array.isArray(results)).toBe(true);
    // Should have array methods
    expect(typeof results.map).toBe("function");
    expect(typeof results.filter).toBe("function");
  });
});

describe("renderWhen", () => {
  const TestComponent = (signal: AbortSignal, props: { text: string }) => {
    const el = h("div", { className: "test-component" }, props.text);
    signal.addEventListener("abort", () => {
      el.dataset.aborted = "true";
    });
    return el;
  };

  test("should render component when state is initially true", () => {
    const controller = new AbortController();
    const showState = funState(true);

    const container = renderWhen({
      state: showState,
      component: TestComponent,
      props: { text: "Hello" },
      signal: controller.signal
    });

    expect(container.children.length).toBe(1);
    expect(container.children[0].textContent).toBe("Hello");
    expect(container.children[0].classList.contains("test-component")).toBe(
      true
    );

    controller.abort();
  });

  test("should not render component when state is initially false", () => {
    const controller = new AbortController();
    const showState = funState(false);

    const container = renderWhen({
      state: showState,
      component: TestComponent,
      props: { text: "Hello" },
      signal: controller.signal
    });

    expect(container.children.length).toBe(0);

    controller.abort();
  });

  test("should mount component when state changes from false to true", () => {
    const controller = new AbortController();
    const showState = funState(false);

    const container = renderWhen({
      state: showState,
      component: TestComponent,
      props: { text: "Hello" },
      signal: controller.signal
    });

    expect(container.children.length).toBe(0);

    showState.set(true);

    expect(container.children.length).toBe(1);
    expect(container.children[0].textContent).toBe("Hello");

    controller.abort();
  });

  test("should unmount component when state changes from true to false", () => {
    const controller = new AbortController();
    const showState = funState(true);

    const container = renderWhen({
      state: showState,
      component: TestComponent,
      props: { text: "Hello" },
      signal: controller.signal
    });

    const child = container.children[0] as HTMLElement;
    expect(container.children.length).toBe(1);

    showState.set(false);

    expect(container.children.length).toBe(0);
    expect(child.dataset.aborted).toBe("true");

    controller.abort();
  });

  test("should abort component signal on unmount", () => {
    const controller = new AbortController();
    const showState = funState(true);
    const abortCallback = jest.fn();

    const ComponentWithAbortListener = (
      signal: AbortSignal,
      props: { text: string }
    ) => {
      signal.addEventListener("abort", abortCallback);
      return h("div", null, props.text);
    };

    renderWhen({
      state: showState,
      component: ComponentWithAbortListener,
      props: { text: "Hello" },
      signal: controller.signal
    });

    expect(abortCallback).not.toHaveBeenCalled();

    showState.set(false);

    expect(abortCallback).toHaveBeenCalledTimes(1);

    controller.abort();
  });

  test("should cleanup when parent signal aborts", () => {
    const controller = new AbortController();
    const showState = funState(true);
    const abortCallback = jest.fn();

    const ComponentWithAbortListener = (
      signal: AbortSignal,
      props: { text: string }
    ) => {
      signal.addEventListener("abort", abortCallback);
      return h("div", null, props.text);
    };

    renderWhen({
      state: showState,
      component: ComponentWithAbortListener,
      props: { text: "Hello" },
      signal: controller.signal
    });

    expect(abortCallback).not.toHaveBeenCalled();

    controller.abort();

    expect(abortCallback).toHaveBeenCalledTimes(1);
  });

  test("should toggle component multiple times", () => {
    const controller = new AbortController();
    const showState = funState(false);

    const container = renderWhen({
      state: showState,
      component: TestComponent,
      props: { text: "Hello" },
      signal: controller.signal
    });

    expect(container.children.length).toBe(0);

    showState.set(true);
    expect(container.children.length).toBe(1);

    showState.set(false);
    expect(container.children.length).toBe(0);

    showState.set(true);
    expect(container.children.length).toBe(1);

    showState.set(false);
    expect(container.children.length).toBe(0);

    controller.abort();
  });

  test("should have display: contents to not affect layout", () => {
    const controller = new AbortController();
    const showState = funState(true);

    const container = renderWhen({
      state: showState,
      component: TestComponent,
      props: { text: "Hello" },
      signal: controller.signal
    }) as HTMLElement;

    expect(container.style.display).toBe("contents");

    controller.abort();
  });

  test("should stop reacting to state changes after parent abort", () => {
    const controller = new AbortController();
    const showState = funState(true);

    const container = renderWhen({
      state: showState,
      component: TestComponent,
      props: { text: "Hello" },
      signal: controller.signal
    });

    expect(container.children.length).toBe(1);

    controller.abort();

    // Should not react to state changes after abort
    showState.set(false);
    expect(container.children.length).toBe(1);
  });

  test("should pass props to component", () => {
    const controller = new AbortController();
    const showState = funState(true);

    const PropsComponent = (
      _signal: AbortSignal,
      props: { text: string; count: number }
    ) => {
      return h(
        "div",
        null,
        `${props.text}: ${props.count}`
      );
    };

    const container = renderWhen({
      state: showState,
      component: PropsComponent,
      props: { text: "Count", count: 42 },
      signal: controller.signal
    });

    expect(container.children[0].textContent).toBe("Count: 42");

    controller.abort();
  });

  test("should work with predicate function", () => {
    const controller = new AbortController();
    enum Status { Loading, Success, Error }
    const statusState = funState(Status.Loading);

    const container = renderWhen({
      state: statusState,
      predicate: (status) => status === Status.Success,
      component: TestComponent,
      props: { text: "Success!" },
      signal: controller.signal
    });

    // Should not render initially
    expect(container.children.length).toBe(0);

    // Should render when predicate matches
    statusState.set(Status.Success);
    expect(container.children.length).toBe(1);
    expect(container.children[0].textContent).toBe("Success!");

    // Should unmount when predicate doesn't match
    statusState.set(Status.Error);
    expect(container.children.length).toBe(0);

    // Should mount again when predicate matches
    statusState.set(Status.Success);
    expect(container.children.length).toBe(1);

    controller.abort();
  });
});
