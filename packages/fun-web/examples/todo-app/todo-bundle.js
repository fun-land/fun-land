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
  var prepend = (x) => (xs) => [x, ...xs];

  // ../accessor/dist/esm/accessor.js
  var prop = () => (k) => ({
    query: (obj) => [obj[k]],
    mod: (transform) => (obj) => Object.assign(Object.assign({}, obj), { [k]: transform(obj[k]) })
  });
  var index = (i) => ({
    query: (s) => [s[i]],
    mod: (f) => (xs) => xs.map((x, j) => i === j ? f(x) : x)
  });
  var _comp = (acc1, acc2) => ({
    query: flow(acc1.query, flatmap(acc2.query)),
    mod: flow(acc2.mod, acc1.mod)
  });
  function comp(...accs) {
    return accs.reduce(_comp);
  }
  var viewed = (toView, fromView) => ({
    query: (s) => [toView(s)],
    mod: (f) => (s) => fromView(f(toView(s)))
  });
  var all = () => ({
    query: (xs) => xs,
    mod: (transform) => (xs) => xs.map(transform)
  });
  var filter = (pred) => ({
    query: (xs) => xs.filter(pred),
    mod: (transform) => (s) => s.map((x) => pred(x) ? transform(x) : x)
  });
  var set = (acc) => flow(K, acc.mod);
  var get = (acc) => (s) => {
    var _a;
    return (_a = acc.query(s)) === null || _a === void 0 ? void 0 : _a[0];
  };
  var unit = () => ({
    query: (x) => [x],
    mod: (transform) => (x) => transform(x)
  });
  var optional = () => ({
    mod: (f) => (s) => s !== void 0 ? f(s) : s,
    query: (s) => s !== void 0 ? [s] : []
  });
  function Acc(acc = unit()) {
    return focusedAcc(acc);
  }
  var focusedAcc = (acc) => ({
    query: (struct) => acc.query(struct),
    get: (struct) => {
      var _a;
      return (_a = acc.query(struct)[0]) !== null && _a !== void 0 ? _a : void 0;
    },
    mod: acc.mod,
    set: flow(K, acc.mod),
    focus: (bcc) => focusedAcc(comp(acc, bcc)),
    prop(k) {
      return this.focus(prop()(k));
    },
    at: (idx) => focusedAcc(comp(acc, index(idx))),
    all: () => focusedAcc(comp(acc, all())),
    optional: () => focusedAcc(comp(acc, optional()))
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
  var standaloneEngine = (initialState2) => {
    let state = initialState2;
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
  var funState = (initialState2) => pureState(standaloneEngine(initialState2));

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
  function bindProperty(el, key, fs, signal) {
    el[key] = fs.get();
    fs.watch(signal, (v) => {
      el[key] = v;
    });
    return el;
  }
  var bindPropertyTo = (key, state, signal) => (el) => bindProperty(el, key, state, signal);
  var on = (el, type, handler, signal) => {
    el.addEventListener(type, handler, { signal });
    return el;
  };
  var onTo = (type, handler, signal) => (el) => on(el, type, handler, signal);
  var enhance = (x, ...fns) => fns.reduce((acc, fn) => fn(acc), x);
  function keyedChildren(parent, signal, list, renderRow) {
    const rows = /* @__PURE__ */ new Map();
    const dispose = () => {
      for (const row of rows.values()) {
        row.ctrl.abort();
        row.el.remove();
      }
      rows.clear();
    };
    const reconcile = () => {
      const items = list.get();
      const nextKeys = [];
      const seen = /* @__PURE__ */ new Set();
      for (const it of items) {
        const k = it.key;
        if (seen.has(k)) throw new Error(`keyedChildren: duplicate key "${k}"`);
        seen.add(k);
        nextKeys.push(k);
      }
      for (const [k, row] of rows) {
        if (!seen.has(k)) {
          row.ctrl.abort();
          row.el.remove();
          rows.delete(k);
        }
      }
      for (const k of nextKeys) {
        if (!rows.has(k)) {
          const ctrl = new AbortController();
          const itemState = list.focus(filter((t) => t.key === k));
          const el = renderRow({
            signal: ctrl.signal,
            state: itemState,
            remove: () => list.mod((list2) => list2.filter((t) => t.key !== k))
          });
          rows.set(k, { key: k, el, ctrl });
        }
      }
      const children = parent.children;
      for (let i = 0; i < nextKeys.length; i++) {
        const k = nextKeys[i];
        const row = rows.get(k);
        const currentAtI = children[i];
        if (currentAtI !== row.el) {
          parent.insertBefore(row.el, currentAtI ?? null);
        }
      }
    };
    list.watch(signal, reconcile);
    signal.addEventListener("abort", dispose, { once: true });
    reconcile();
    return { reconcile, dispose };
  }

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

  // examples/todo-app/Todo.ts
  var stringNumberView = viewed(String, Number);
  var Todo = (signal, { state, removeItem }) => {
    const priorityState = state.prop("priority").focus(stringNumberView);
    const prioritySelect = enhance(
      h("select", {}, [
        h("option", { value: "0" }, "High"),
        h("option", { value: "1" }, "Low")
      ]),
      bindPropertyTo("value", priorityState, signal),
      // native event binding works but for easier event binding use `on` helper for better type inferrence and you can't forget to cleanup
      onTo("change", (e) => priorityState.set(e.currentTarget.value), signal)
    );
    const checkedState = state.prop("checked");
    const checkbox = enhance(
      h("input", { type: "checkbox" }),
      // use bindPropertyTo to automatically update a property when the focused state changes
      bindPropertyTo("checked", checkedState, signal),
      // when state.checked updates the checkbox.checked updates
      onTo("change", (e) => checkedState.set(e.currentTarget.checked), signal)
    );
    const labelState = state.prop("label");
    const labelInput = enhance(
      h("input", {
        type: "text"
      }),
      bindPropertyTo("value", labelState, signal),
      onTo("input", (e) => labelState.set(e.currentTarget.value), signal)
    );
    return h("li", {}, [
      checkbox,
      prioritySelect,
      labelInput,
      enhance(
        h("button", { textContent: "X" }),
        onTo("click", removeItem, signal)
      )
    ]);
  };

  // examples/todo-app/todo-app.ts
  var stateFoci = Acc();
  var addItem = (state) => stateFoci.prop("items").mod(
    prepend({
      checked: false,
      label: state.value,
      priority: 1,
      key: crypto.randomUUID()
    })
  )(state);
  var clearValue = stateFoci.prop("value").set("");
  var markAllDone = stateFoci.prop("items").all().prop("checked").set(true);
  var initialState = {
    value: "",
    items: [
      { checked: false, label: "Learn fun-web", priority: 0, key: "asdf" },
      { checked: true, label: "Build something cool", priority: 1, key: "fdas" }
    ]
  };
  var TodoApp = (signal) => {
    const state = funState(initialState);
    const input = enhance(
      h("input", {
        type: "text",
        value: state.get().value,
        placeholder: "Add a todo..."
      }),
      bindPropertyTo("value", state.prop("value"), signal),
      onTo(
        "input",
        (e) => {
          state.prop("value").set(e.currentTarget.value);
        },
        signal
      )
    );
    const addBtn = h("button", { type: "submit", textContent: "Add" });
    const form = enhance(
      h("form", {}, [input, addBtn]),
      onTo(
        "submit",
        (e) => {
          e.preventDefault();
          if (state.get().value.trim()) {
            state.mod(flow(addItem, clearValue));
          }
        },
        signal
      )
    );
    const markAllBtn = enhance(
      h("button", { textContent: "Mark All Done" }),
      onTo(
        "click",
        () => {
          state.mod(markAllDone);
        },
        signal
      )
    );
    const todoList = h("ul", {});
    keyedChildren(
      todoList,
      signal,
      state.prop("items"),
      (row) => Todo(row.signal, {
        removeItem: row.remove,
        state: row.state
      })
    );
    const allDoneText = h("span", { textContent: "" });
    state.focus(Acc().prop("items").all().prop("checked")).watchAll(signal, (checks) => {
      allDoneText.textContent = checks.every(Boolean) ? "All Done!" : "";
    });
    return h("div", { className: "todo-app" }, [
      h("h1", { textContent: "Todo App" }),
      form,
      h("div", {}, [markAllBtn, allDoneText]),
      todoList
    ]);
  };
  var app = document.getElementById("app");
  if (app) {
    mount(TodoApp, {}, app);
  }
})();
