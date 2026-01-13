"use strict";
(() => {
  // ../fun-state/node_modules/@fun-land/accessor/dist/esm/util.js
  var flow = (f, g) => (x) => g(f(x));
  var K = (a) => (_b) => a;
  var flatmap = (f) => (xs) => {
    let out = [];
    for (const x of xs) {
      out = out.concat(f(x));
    }
    return out;
  };

  // ../fun-state/node_modules/@fun-land/accessor/dist/esm/accessor.js
  var prop = () => (k) => ({
    query: (obj) => [obj[k]],
    mod: (transform) => (obj) => Object.assign(Object.assign({}, obj), { [k]: transform(obj[k]) })
  });
  var _comp = (acc1, acc2) => ({
    query: flow(acc1.query, flatmap(acc2.query)),
    mod: flow(acc2.mod, acc1.mod)
  });
  function comp(...accs) {
    return accs.reduce(_comp);
  }
  var set = (acc) => flow(K, acc.mod);

  // ../fun-state/dist/esm/src/FunState.js
  var pureState = ({ getState, modState, subscribe }) => {
    const setState = (v) => {
      modState(() => v);
    };
    const focus = (acc) => subState({ getState, modState, subscribe }, acc);
    const subscribeToState = (signal, callback) => {
      const unsubscribe = subscribe(callback);
      signal.addEventListener("abort", unsubscribe, { once: true });
    };
    const fs = {
      get: getState,
      query: (acc) => acc.query(getState()),
      mod: modState,
      set: setState,
      focus,
      prop: flow(prop(), focus),
      subscribe: subscribeToState
    };
    return fs;
  };
  var subState = ({ getState, modState, subscribe }, accessor) => {
    const props = prop();
    const _get = () => accessor.query(getState())[0];
    const _mod = flow(accessor.mod, modState);
    function createFocusedSubscribe() {
      return (listener) => {
        let lastValue = _get();
        return subscribe((parentState) => {
          const newValue = accessor.query(parentState)[0];
          if (newValue !== lastValue) {
            lastValue = newValue;
            listener(newValue);
          }
        });
      };
    }
    const focus = (acc) => subState({ getState: _get, modState: _mod, subscribe: createFocusedSubscribe() }, acc);
    const _prop = flow(props, focus);
    const subscribeToState = (signal, callback) => {
      let lastValue = _get();
      const unsubscribe = subscribe((parentState) => {
        const newValue = accessor.query(parentState)[0];
        if (newValue !== lastValue) {
          lastValue = newValue;
          callback(newValue);
        }
      });
      signal.addEventListener("abort", unsubscribe, { once: true });
    };
    return {
      get: _get,
      query: (acc) => comp(accessor, acc).query(getState()),
      mod: _mod,
      set: flow(set(accessor), modState),
      focus,
      prop: _prop,
      subscribe: subscribeToState
    };
  };
  var standaloneEngine = (initialState) => {
    let state = initialState;
    const listeners = /* @__PURE__ */ new Set();
    const getState = () => state;
    const modState = (f) => {
      state = f(getState());
      listeners.forEach((listener) => listener(state));
    };
    const subscribe = (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    };
    return { getState, modState, subscribe };
  };
  var funState = (initialState) => pureState(standaloneEngine(initialState));

  // ../accessor/dist/esm/accessor.js
  var prop2 = () => (k) => ({
    query: (obj) => [obj[k]],
    mod: (transform) => (obj) => Object.assign(Object.assign({}, obj), { [k]: transform(obj[k]) })
  });

  // src/dom.ts
  var h = (tag, attrs2, children) => {
    const element = document.createElement(tag);
    if (attrs2) {
      for (const [key, value] of Object.entries(attrs2)) {
        if (value == null)
          continue;
        if (key.startsWith("on") && typeof value === "function") {
          const eventName = key.slice(2).toLowerCase();
          element.addEventListener(eventName, value);
        } else if (key.includes("-") || key === "role") {
          element.setAttribute(key, String(value));
        } else {
          element[key] = value;
        }
      }
    }
    if (children != null) {
      appendChildren(element, children);
    }
    return element;
  };
  var appendChildren = (parent, children) => {
    if (Array.isArray(children)) {
      children.forEach((child) => appendChildren(parent, child));
    } else if (children != null) {
      if (typeof children === "string" || typeof children === "number") {
        parent.appendChild(document.createTextNode(String(children)));
      } else {
        parent.appendChild(children);
      }
    }
  };

  // src/mount.ts
  var mount = (component, props, container) => {
    const controller = new AbortController();
    const element = component(controller.signal, props);
    container.appendChild(element);
    return {
      element,
      unmount: () => {
        controller.abort();
        element.remove();
      }
    };
  };

  // examples/counter/counter.ts
  var Counter = (signal, { state, onReset, label }) => {
    const display = h(
      "div",
      { className: "count-display" },
      String(state.get().count)
    );
    const incrementBtn = h("button", { textContent: "+" });
    const decrementBtn = h("button", { textContent: "-" });
    const resetBtn = h("button", { textContent: "Reset" });
    state.prop("count").subscribe(signal, (count) => {
      display.textContent = String(count);
    });
    incrementBtn.addEventListener(
      "click",
      () => {
        state.mod((s) => ({ count: s.count + 1 }));
      },
      { signal }
    );
    decrementBtn.addEventListener(
      "click",
      () => {
        state.mod((s) => ({ count: s.count - 1 }));
      },
      { signal }
    );
    resetBtn.addEventListener("click", onReset, { signal });
    return h("div", { className: "counter" }, [
      h("h2", { textContent: label }),
      display,
      h("div", { className: "buttons" }, [incrementBtn, decrementBtn, resetBtn])
    ]);
  };
  var App = (signal) => {
    const state = funState({
      title: "Fun-Web Counter Example",
      counterValue: { count: 0 }
    });
    const heading = h("h1", { textContent: state.get().title });
    state.prop("title").subscribe(signal, (title) => {
      heading.textContent = title;
    });
    const counter = Counter(
      signal,
      // pass same signal - cleanup cascades
      {
        label: "Click Counter",
        onReset: () => state.prop("counterValue").set({ count: 0 }),
        state: state.focus(prop2()("counterValue"))
      }
    );
    return h("div", { className: "app" }, [heading, counter]);
  };
  var runExample = () => {
    const container = document.getElementById("app");
    if (!container)
      throw new Error("No #app element found");
    const mounted = mount(App, {}, container);
    return () => mounted.unmount();
  };
})();
