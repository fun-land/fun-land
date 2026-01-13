"use strict";
(() => {
  // ../accessor/dist/esm/util.js
  var flow = (f, g) => (x) => g(f(x));
  var K = (a) => (_b) => a;
  var flatmap = (f) => (xs) => {
    let out = [];
    for (const x of xs) {
      out = out.concat(f(x));
    }
    return out;
  };

  // ../accessor/dist/esm/accessor.js
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
  var get = (acc) => (s) => {
    var _a;
    return (_a = acc.query(s)) === null || _a === void 0 ? void 0 : _a[0];
  };
  var unit = () => ({
    query: (x) => [x],
    mod: (transform) => (x) => transform(x)
  });

  // ../fun-state/dist/esm/src/FunState.js
  var pureState = ({ getState, modState, subscribe }) => mkFunState({ getState, modState, subscribe }, unit());
  function mkFunState(engine, viewAcc) {
    const select = get(viewAcc);
    const _get = () => {
      const v = select(engine.getState());
      return v;
    };
    const _query = (acc) => comp(viewAcc, acc).query(engine.getState());
    const _mod = (f) => engine.modState(viewAcc.mod(f));
    const _set = (val) => engine.modState(set(viewAcc)(val));
    const _focus = (acc) => {
      return mkFunState(engine, comp(viewAcc, acc));
    };
    const _prop = (key) => {
      return _focus(prop()(key));
    };
    const _watch = (signal, callback) => {
      let last = select(engine.getState());
      callback(last);
      const unsubscribe = engine.subscribe((rootState) => {
        const next = select(rootState);
        if (!Object.is(next, last)) {
          last = next;
          callback(next);
        }
      });
      signal.addEventListener("abort", unsubscribe, { once: true });
    };
    const _watchAll = (signal, callback) => {
      let last = viewAcc.query(engine.getState());
      callback(last);
      const unsubscribe = engine.subscribe((rootState) => {
        const next = viewAcc.query(rootState);
        if (last.length !== next.length || next.some((v, i) => !Object.is(v, last[i]))) {
          last = next;
          callback(next);
        }
      });
      signal.addEventListener("abort", unsubscribe, { once: true });
    };
    return {
      get: _get,
      query: _query,
      mod: _mod,
      set: _set,
      focus: _focus,
      prop: _prop,
      watch: _watch,
      watchAll: _watchAll
    };
  }
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

  // src/dom.ts
  var h = (tag, attrs2, children) => {
    const element = document.createElement(tag);
    if (attrs2) {
      for (const [key, value] of Object.entries(attrs2)) {
        if (value == null) continue;
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
    state.prop("count").watch(signal, (count) => {
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
    state.prop("title").watch(signal, (title) => {
      heading.textContent = title;
    });
    const counter = Counter(
      signal,
      // pass same signal - cleanup cascades
      {
        label: "Click Counter",
        onReset: () => state.prop("counterValue").set({ count: 0 }),
        state: state.focus(prop()("counterValue"))
      }
    );
    return h("div", { className: "app" }, [heading, counter]);
  };
  var runExample = () => {
    const container = document.getElementById("app");
    if (!container) throw new Error("No #app element found");
    const mounted = mount(App, {}, container);
    return () => mounted.unmount();
  };
})();
