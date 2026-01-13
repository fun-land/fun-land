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
  var $ = (selector) => document.querySelector(selector) ?? void 0;

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

  // examples/todo-app/TodoAppState.ts
  var init_TodoAppState = () => ({
    value: "",
    items: [
      { checked: false, label: "Learn fun-web", priority: 0, key: "asdf" },
      { checked: true, label: "Build something cool", priority: 1, key: "fdas" }
    ]
  });
  var stateAcc = Acc();
  var allCheckedAcc = stateAcc.prop("items").all().prop("checked");
  var markAllDone = allCheckedAcc.set(true);
  var clearValue = stateAcc.prop("value").set("");
  var addItem = (state) => Acc().prop("items").mod(
    prepend({
      checked: false,
      label: state.value,
      priority: 1,
      key: crypto.randomUUID()
    })
  )(state);

  // examples/todo-app/TodoState.ts
  var stateAcc2 = Acc();
  var priorityAsString = stateAcc2.prop("priority").focus(viewed(String, Number));

  // examples/todo-app/Todo.ts
  var Todo = (signal, { state, removeItem, onDragStart, onDragEnd, onDragOver }) => {
    const todoData = state.get();
    const priorityState = state.focus(priorityAsString);
    const prioritySelect = enhance(
      h("select", {}, [
        h("option", { value: "0" }, "High"),
        h("option", { value: "1" }, "Low")
      ]),
      bindPropertyTo("value", priorityState, signal),
      onTo("change", (e) => priorityState.set(e.currentTarget.value), signal)
    );
    const checkedState = state.prop("checked");
    const checkbox = enhance(
      h("input", { type: "checkbox" }),
      bindPropertyTo("checked", checkedState, signal),
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
    const dragHandle = h("span", {
      className: "drag-handle",
      textContent: "\u22EE\u22EE",
      draggable: true
    });
    const deleteBtn = enhance(
      h("button", { className: "delete-btn", textContent: "\xD7" }),
      onTo("click", removeItem, signal)
    );
    const li = h("li", { className: "todo-item", "data-key": todoData.key }, [
      dragHandle,
      checkbox,
      prioritySelect,
      labelInput,
      deleteBtn
    ]);
    if (onDragStart) {
      dragHandle.addEventListener(
        "dragstart",
        (e) => {
          if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", todoData.key);
            const rect = li.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;
            e.dataTransfer.setDragImage(li, offsetX, offsetY);
          }
          li.classList.add("dragging");
          onDragStart(todoData.key);
        },
        { signal }
      );
    }
    if (onDragEnd) {
      dragHandle.addEventListener(
        "dragend",
        () => {
          li.classList.remove("dragging");
          onDragEnd();
        },
        { signal }
      );
    }
    if (onDragOver) {
      li.addEventListener(
        "dragover",
        (e) => {
          e.preventDefault();
          if (e.dataTransfer) {
            e.dataTransfer.dropEffect = "move";
          }
          onDragOver(todoData.key);
        },
        { signal }
      );
    }
    requestAnimationFrame(() => {
      li.classList.add("todo-item-enter");
    });
    return li;
  };

  // examples/todo-app/DraggableTodoList.ts
  var ANIMATION_DURATION = 300;
  var getElementByKey = (key) => $(`[data-key="${key}"]`);
  var DraggableTodoList = (signal, { items }) => {
    let draggedKey = null;
    let lastTargetKey = null;
    let previousItemCount = items.get().length;
    items.watch(signal, (currentItems) => {
      const currentCount = currentItems.length;
      if (currentCount > previousItemCount) {
        const positions = /* @__PURE__ */ new Map();
        currentItems.forEach((item) => {
          const el = $(`[data-key="${item.key}"]`);
          if (el) positions.set(item.key, el.getBoundingClientRect());
        });
        requestAnimationFrame(() => {
          positions.forEach((first, key) => {
            const el = $(`[data-key="${key}"]`);
            if (!el) return;
            const last = el.getBoundingClientRect();
            const deltaY = first.top - last.top;
            if (deltaY) {
              el.animate(
                [
                  { transform: `translateY(${deltaY}px)` },
                  { transform: "translateY(0)" }
                ],
                {
                  duration: ANIMATION_DURATION,
                  easing: "cubic-bezier(0.4, 0, 0.2, 1)"
                }
              );
            }
          });
        });
      }
      previousItemCount = currentCount;
    });
    const handleDragStart = (key) => {
      draggedKey = key;
      lastTargetKey = null;
    };
    const handleDragOver = (targetKey) => {
      if (!draggedKey || draggedKey === targetKey || lastTargetKey === targetKey)
        return;
      lastTargetKey = targetKey;
      const allItems = items.get();
      const draggedIndex = allItems.findIndex((item) => item.key === draggedKey);
      const targetIndex = allItems.findIndex((item) => item.key === targetKey);
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newItems = [...allItems];
        const [draggedItem] = newItems.splice(draggedIndex, 1);
        newItems.splice(targetIndex, 0, draggedItem);
        items.set(newItems);
      }
    };
    const handleDragEnd = () => {
      if (lastTargetKey) {
        const positions = /* @__PURE__ */ new Map();
        items.get().forEach((item) => {
          const el = getElementByKey(item.key);
          if (el) positions.set(item.key, el.getBoundingClientRect());
        });
        requestAnimationFrame(() => {
          positions.forEach((first, key) => {
            const el = getElementByKey(key);
            if (!el) return;
            const last = el.getBoundingClientRect();
            const deltaX = first.left - last.left;
            const deltaY = first.top - last.top;
            if (deltaX || deltaY) {
              el.animate(
                [
                  { transform: `translate(${deltaX}px, ${deltaY}px)` },
                  { transform: "translate(0, 0)" }
                ],
                {
                  duration: ANIMATION_DURATION,
                  easing: "cubic-bezier(0.4, 0, 0.2, 1)"
                }
              );
            }
          });
        });
      }
      draggedKey = null;
      lastTargetKey = null;
    };
    const todoList = h("ul", { className: "todo-list" });
    keyedChildren(
      todoList,
      signal,
      items,
      (row) => Todo(row.signal, {
        removeItem: () => {
          const element = $(`[data-key="${row.state.get().key}"]`);
          if (element) {
            element.classList.add("todo-item-exit");
            setTimeout(() => {
              const positions = /* @__PURE__ */ new Map();
              items.get().forEach((item) => {
                const el = $(`[data-key="${item.key}"]`);
                if (el) positions.set(item.key, el.getBoundingClientRect());
              });
              row.remove();
              requestAnimationFrame(() => {
                positions.forEach((first, key) => {
                  const el = getElementByKey(key);
                  if (!el) return;
                  const last = el.getBoundingClientRect();
                  const deltaY = first.top - last.top;
                  if (deltaY) {
                    el.animate(
                      [
                        { transform: `translateY(${deltaY}px)` },
                        { transform: "translateY(0)" }
                      ],
                      {
                        duration: ANIMATION_DURATION,
                        easing: "cubic-bezier(0.4, 0, 0.2, 1)"
                      }
                    );
                  }
                });
              });
            }, ANIMATION_DURATION);
          } else {
            row.remove();
          }
        },
        state: row.state,
        onDragStart: handleDragStart,
        onDragEnd: handleDragEnd,
        onDragOver: handleDragOver
      })
    );
    return todoList;
  };

  // examples/todo-app/AddTodoForm.ts
  var AddTodoForm = (signal, { state }) => {
    const input = enhance(
      h("input", {
        type: "text",
        placeholder: "Add a todo...",
        className: "todo-input"
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
    return enhance(
      h("form", { className: "todo-form" }, [
        input,
        h("button", {
          type: "submit",
          textContent: "Add",
          className: "add-btn"
        })
      ]),
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
  };

  // examples/todo-app/TodoApp.ts
  var TodoApp = (signal) => {
    const state = funState(init_TodoAppState());
    const markAllBtn = enhance(
      h("button", {
        textContent: "Mark All Done",
        className: "mark-all-btn"
      }),
      onTo(
        "click",
        () => {
          state.mod(markAllDone);
        },
        signal
      )
    );
    const allDoneText = h("span", {
      textContent: "",
      className: "all-done-text"
    });
    state.focus(allCheckedAcc).watchAll(signal, (checks) => {
      allDoneText.textContent = checks.length > 0 && checks.every(Boolean) ? "\u{1F389} All Done!" : "";
    });
    return h("div", { className: "todo-app" }, [
      h("h1", { textContent: "Todo Example" }),
      AddTodoForm(signal, { state }),
      h("div", { className: "controls" }, [markAllBtn, allDoneText]),
      DraggableTodoList(signal, { items: state.prop("items") })
    ]);
  };
  var app = document.getElementById("app");
  if (app) {
    mount(TodoApp, {}, app);
  }
})();
