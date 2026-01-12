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
  var all = () => ({
    query: (xs) => xs,
    mod: (transform) => (xs) => xs.map(transform)
  });
  var filter = (pred) => ({
    query: (xs) => xs.filter(pred),
    mod: (transform) => (s) => s.map((x) => pred(x) ? transform(x) : x)
  });
  var set = (acc) => flow(K, acc.mod);
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

  // src/state.ts
  var pureState = (engine) => {
    const { getState, modState, subscribe } = engine;
    const setState = (v) => {
      modState(() => v);
    };
    const focus = (acc) => subState(engine, acc);
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
  var subState = (engine, accessor) => {
    const { getState, modState, subscribe } = engine;
    const props = prop();
    const _get = () => accessor.query(getState())[0];
    const _mod = flow(accessor.mod, modState);
    const focus = (acc) => subState(
      { getState: _get, modState: _mod, subscribe: createFocusedSubscribe() },
      acc
    );
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
    fs.subscribe(signal, (v) => {
      el[key] = v;
    });
    return el;
  }
  var on = (el, type, handler, signal) => {
    el.addEventListener(type, handler, { signal });
    return el;
  };
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
          const el = renderRow(ctrl.signal, itemState);
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
    list.subscribe(signal, reconcile);
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
      },
    };
  };

  // examples/todo-app/Todo.ts
  var Todo = (signal, { state, removeItem }) => {
    const prioritySelect = h("select", {}, [
      h("option", { value: "0" }, "High"),
      h("option", { value: "1" }, "Low"),
    ]);
    prioritySelect.value = String(state.get().priority);
    state.prop("priority").subscribe(signal, (priority) => {
      prioritySelect.value = String(priority);
    });
    prioritySelect.addEventListener(
      "change",
      (e) => {
        state.prop("priority").set(+e.currentTarget.value);
      },
      { signal }
    );
    const checkbox = h("input", { type: "checkbox" });
    bindProperty(checkbox, "checked", state.prop("checked"), signal);
    on(
      checkbox,
      "change",
      (e) => {
        state.prop("checked").set(e.currentTarget.checked);
      },
      signal
    );
    const labelInput = on(
      bindProperty(
        h("input", {
          type: "text",
        }),
        "value",
        state.prop("label"),
        signal
      ),
      "input",
      (e) => {
        state.prop("label").set(e.currentTarget.value);
      },
      signal
    );
    return h("li", {}, [
      checkbox,
      prioritySelect,
      labelInput,
      // you can even inline to go tacit
      on(h("button", { textContent: "X" }), "click", removeItem, signal),
    ]);
  };

  // examples/todo-app/todo-app.ts
  var stateFoci = Acc();
  var addItem = (state) =>
    stateFoci.prop("items").mod(
      prepend({
        checked: false,
        label: state.value,
        priority: 1,
        key: crypto.randomUUID(),
      })
    )(state);
  var clearValue = stateFoci.prop("value").set("");
  var markAllDone = stateFoci.prop("items").all().prop("checked").set(true);
  var removeByKey = (key) =>
    stateFoci.prop("items").mod((xs) => xs.filter((t) => t.key !== key));
  var initialState = {
    value: "",
    items: [
      { checked: false, label: "Learn fun-web", priority: 0, key: "asdf" },
      {
        checked: true,
        label: "Build something cool",
        priority: 1,
        key: "fdas",
      },
    ],
  };
  var TodoApp = (signal) => {
    const state = funState(initialState);
    const input = bindProperty(
      h("input", {
        type: "text",
        value: state.get().value,
        placeholder: "Add a todo...",
      }),
      "value",
      state.prop("value"),
      signal
    );
    on(
      input,
      "input",
      (e) => {
        state.prop("value").set(e.currentTarget.value);
      },
      signal
    );
    const addBtn = h("button", { type: "submit", textContent: "Add" });
    const form = on(
      h("form", {}, [input, addBtn]),
      "submit",
      (e) => {
        e.preventDefault();
        if (state.get().value.trim()) {
          state.mod(flow(addItem, clearValue));
        }
      },
      signal
    );
    const markAllBtn = on(
      h("button", { textContent: "Mark All Done" }),
      "click",
      () => {
        state.mod(markAllDone);
      },
      signal
    );
    const allDoneText = h("span", { textContent: "" });
    const todoList = h("ul", {});
    keyedChildren(
      todoList,
      signal,
      state.prop("items"),
      (rowSignal, todoState) =>
        Todo(rowSignal, {
          removeItem: () => state.mod(removeByKey(todoState.prop("key").get())),
          state: todoState,
        })
    );
    return h("div", { className: "todo-app" }, [
      h("h1", { textContent: "Todo App" }),
      form,
      h("div", {}, [markAllBtn, allDoneText]),
      todoList,
    ]);
  };
  var app = document.getElementById("app");
  if (app) {
    mount(TodoApp, {}, app);
  }
})();
