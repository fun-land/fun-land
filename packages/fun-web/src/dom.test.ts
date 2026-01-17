import {
  h,
  hx,
  text,
  attr,
  attrs,
  append,
  bindProperty,
  bindView,
  addClass,
  toggleClass,
  removeClass,
  on,
  enhance,
  querySelectorAll,
  renderWhen,
} from "./dom";
import { funState, mapRead, derive } from "@fun-land/fun-state";

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

describe("hx()", () => {
  it("should apply props and attrs", () => {
    const controller = new AbortController();
    const el = hx("div", {
      signal: controller.signal,
      props: { id: "test", className: "foo" },
      attrs: { "data-test": "value", role: "button" },
    });

    expect(el.id).toBe("test");
    expect(el.className).toBe("foo");
    expect(el.getAttribute("data-test")).toBe("value");
    expect(el.getAttribute("role")).toBe("button");
  });

  it("should append children", () => {
    const child = h("span", null, "child");
    const controller = new AbortController();
    const el = hx("div", { signal: controller.signal }, child);

    expect(el.children.length).toBe(1);
    expect(el.textContent).toBe("child");
  });

  it("should bind properties and events with signal", () => {
    const controller = new AbortController();
    const state = funState("hello");
    const handler = jest.fn();

    const el = hx("input", {
      signal: controller.signal,
      bind: { value: state },
      on: { input: handler },
    });

    expect(el.value).toBe("hello");

    state.set("world");
    expect(el.value).toBe("world");

    el.dispatchEvent(new Event("input"));
    expect(handler).toHaveBeenCalledTimes(1);

    controller.abort();
    state.set("after");
    el.dispatchEvent(new Event("input"));
    expect(el.value).toBe("world");
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should require signal", () => {
    expect(() => (hx as unknown as (tag: string) => Element)("div")).toThrow(
      "hx: signal is required"
    );
  });

  it("should accept FunRead from mapRead in bind", () => {
    const controller = new AbortController();
    const num = funState(5);
    const doubled = mapRead(num, (n) => String(n * 2));

    const el = hx("div", {
      signal: controller.signal,
      bind: { textContent: doubled },
    });

    expect(el.textContent).toBe("10");

    num.set(3);
    expect(el.textContent).toBe("6");

    controller.abort();
  });

  it("should accept FunRead from derive in bind", () => {
    const controller = new AbortController();
    const a = funState(2);
    const b = funState(3);
    const sum = derive(a, b, (x, y) => x + y);

    const el = hx("input", {
      signal: controller.signal,
      props: { type: "number" },
      bind: { valueAsNumber: sum },
    });

    expect(el.valueAsNumber).toBe(5);

    a.set(10);
    expect(el.valueAsNumber).toBe(13);

    controller.abort();
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

  it("should bind FunRead from mapRead", () => {
    const el = h("div");
    const controller = new AbortController();

    const num = funState(5);
    const doubled = mapRead(num, (n) => String(n * 2));
    enhance(el, bindProperty("textContent", doubled, controller.signal));

    expect(el.textContent).toBe("10");

    num.set(7);
    expect(el.textContent).toBe("14");

    controller.abort();
  });

  it("should bind FunRead from derive", () => {
    const el = h("div");
    const controller = new AbortController();

    const first = funState("John");
    const last = funState("Doe");
    const full = derive(first, last, (f, l) => `${f} ${l}`);
    enhance(el, bindProperty("textContent", full, controller.signal));

    expect(el.textContent).toBe("John Doe");

    first.set("Jane");
    expect(el.textContent).toBe("Jane Doe");

    last.set("Smith");
    expect(el.textContent).toBe("Jane Smith");

    controller.abort();
  });

  it("should compose mapRead over derive", () => {
    const el = h("span");
    const controller = new AbortController();

    const price = funState(42);
    const quantity = funState(3);
    const total = derive(price, quantity, (p, q) => p * q);
    const formatted = mapRead(total, (n) => `$${n.toFixed(2)}`);
    enhance(el, bindProperty("textContent", formatted, controller.signal));

    expect(el.textContent).toBe("$126.00");

    price.set(50);
    expect(el.textContent).toBe("$150.00");

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

describe("bindView()", () => {
  it("should default to a div container", () => {
    const controller = new AbortController();
    const state = funState(0);

    const container = bindView(controller.signal, state, (_signal, value) =>
      h("div", null, String(value))
    ) as HTMLElement;

    state.set(1);

    expect(container.tagName).toBe("DIV");
    expect(container.textContent).toBe("1");

    controller.abort();
  });

  it("should render into the provided container tag", () => {
    const controller = new AbortController();
    const state = funState(0);

    const container = bindView(
      controller.signal,
      state,
      (_signal, value) => h("div", null, String(value)),
      { tagName: "section" }
    ) as HTMLElement;

    state.set(1);

    expect(container.tagName).toBe("SECTION");
    expect(container.children.length).toBe(1);
    expect(container.textContent).toBe("1");

    controller.abort();
  });

  it("should abort previous render on state changes", () => {
    const controller = new AbortController();
    const state = funState(0);
    let abortCount = 0;
    let renderCount = 0;

    const container = bindView(
      controller.signal,
      state,
      (signal, value) => {
        renderCount += 1;
        signal.addEventListener("abort", () => {
          abortCount += 1;
        });
        return h("div", null, String(value));
      },
      { tagName: "div" }
    );

    state.set(1);
    expect(renderCount).toBe(1);
    expect(abortCount).toBe(0);

    state.set(2);
    expect(renderCount).toBe(2);
    expect(abortCount).toBe(1);
    expect(container.textContent).toBe("2");

    controller.abort();
    expect(abortCount).toBe(2);
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

describe("querySelectorAll()", () => {
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

    const results = querySelectorAll(".item");
    expect(results).toHaveLength(3);
    expect(results[0]).toBe(div1);
    expect(results[1]).toBe(div2);
    expect(results[2]).toBe(div3);
  });

  test("should return empty array if no matches", () => {
    const results = querySelectorAll(".nonexistent");
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

    const results = querySelectorAll<HTMLSpanElement>("#container .item");
    expect(results).toHaveLength(2);
    expect(results[0]).toBe(item1);
    expect(results[1]).toBe(item2);
  });

  test("should return true array, not NodeList", () => {
    const div1 = h("div", { className: "item" });
    document.body.appendChild(div1);

    const results = querySelectorAll(".item");
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
      signal: controller.signal,
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
      signal: controller.signal,
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
      signal: controller.signal,
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
      signal: controller.signal,
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
      signal: controller.signal,
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
      signal: controller.signal,
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
      signal: controller.signal,
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
      signal: controller.signal,
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
      signal: controller.signal,
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
      return h("div", null, `${props.text}: ${props.count}`);
    };

    const container = renderWhen({
      state: showState,
      component: PropsComponent,
      props: { text: "Count", count: 42 },
      signal: controller.signal,
    });

    expect(container.children[0].textContent).toBe("Count: 42");

    controller.abort();
  });

  test("should work with predicate function", () => {
    const controller = new AbortController();
    enum Status {
      Loading,
      Success,
      Error,
    }
    const statusState = funState(Status.Loading);

    const container = renderWhen({
      state: statusState,
      predicate: (status) => status === Status.Success,
      component: TestComponent,
      props: { text: "Success!" },
      signal: controller.signal,
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