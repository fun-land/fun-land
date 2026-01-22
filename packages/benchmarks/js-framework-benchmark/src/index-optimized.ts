/**
 * Optimized js-framework-benchmark implementation for fun-web
 * 
 * Optimizations for 10k rows:
 * 1. Eliminate key lookups: avoid bindListChildren/accessor key extraction entirely and
 *    drive DOM updates directly from the known benchmark actions.
 *
 * 2. O(1) selection updates: single selected-id variable updates only the affected row(s)
 *    instead of N subscriptions.
 *
 * 3. Direct DOM updates: update label nodes and row classes in-place.
 * 
 * To use this version:
 *   pnpm run build-optimized-prod
 * 
 * To compare with standard version:
 *   pnpm run build-prod
 */
import { h, hx, mount, type Component } from "@fun-land/fun-web";

interface Row {
  id: number;
  label: string;
}

const random = (max: number) => Math.round(Math.random() * 1000) % max;
const adjectives = [
  "pretty",
  "large",
  "big",
  "small",
  "tall",
  "short",
  "long",
  "handsome",
  "plain",
  "quaint",
  "clean",
  "elegant",
  "easy",
  "angry",
  "crazy",
  "helpful",
  "mushy",
  "odd",
  "unsightly",
  "adorable",
  "important",
  "inexpensive",
  "cheap",
  "free",
  "delicious",
  "strange",
  "ambitious",
  "wide",
  "all",
  "fast",
  "quick",
];
const colours = [
  "red",
  "yellow",
  "blue",
  "green",
  "pink",
  "brown",
  "purple",
  "brown",
  "white",
  "black",
  "orange",
];
const nouns = [
  "table",
  "chair",
  "house",
  "bbq",
  "desk",
  "car",
  "banana",
  "sandwich",
  "burger",
  "pizza",
  "mouse",
  "keyboard",
];

const randomName = () =>
  `${adjectives[random(adjectives.length)]} ${colours[random(colours.length)]} ${nouns[random(nouns.length)]}`;

let idCounter = 1;
const randomId = () => idCounter++;

const buildData = (count: number): Row[] => {
  const data: Row[] = [];
  for (let i = 0; i < count; i++) {
    data.push({ id: randomId(), label: randomName() });
  }
  return data;
};

const App: Component = (signal) => {
  let rows: Row[] = [];
  let selectedId: number | undefined;

  const rowElements = new Map<number, HTMLTableRowElement>();
  const rowLabels = new Map<number, HTMLAnchorElement>();
  const tbody = h("tbody", { id: "tbody" });

  const setSelected = (nextId: number | undefined): void => {
    if (selectedId === nextId) return;
    if (selectedId != null) {
      rowElements.get(selectedId)?.classList.remove("danger");
    }
    selectedId = nextId;
    if (selectedId != null) {
      rowElements.get(selectedId)?.classList.add("danger");
    }
  };

  const removeRowById = (rowId: number): void => {
    let index = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].id === rowId) {
        index = i;
        break;
      }
    }
    if (index === -1) return;
    rows.splice(index, 1);
    rowElements.get(rowId)?.remove();
    rowElements.delete(rowId);
    rowLabels.delete(rowId);
    if (selectedId === rowId) {
      selectedId = undefined;
    }
  };

  const createRow = (row: Row): HTMLTableRowElement => {
    const rowId = row.id;
    const tr = h("tr", {});
    if (selectedId === rowId) tr.classList.add("danger");

    const idCell = h("td", { className: "col-md-1" }, String(rowId));

    const labelCell = h("td", { className: "col-md-4" });
    const labelLink = hx(
      "a",
      {
        signal,
        on: {
          click: (e) => {
            e.preventDefault();
            setSelected(rowId);
          },
        },
      },
      row.label
    );
    labelCell.appendChild(labelLink);

    const removeCell = h("td", { className: "col-md-1" });
    const removeLink = hx(
      "a",
      {
        signal,
        on: {
          click: (e) => {
            e.preventDefault();
            removeRowById(rowId);
          },
        },
      },
      [
        hx("span", {
          signal,
          props: { className: "glyphicon glyphicon-remove" },
          attrs: { "aria-hidden": "true" },
        }),
      ]
    );
    removeCell.appendChild(removeLink);

    const emptyCell = h("td", { className: "col-md-6" });

    tr.appendChild(idCell);
    tr.appendChild(labelCell);
    tr.appendChild(removeCell);
    tr.appendChild(emptyCell);

    rowElements.set(rowId, tr);
    rowLabels.set(rowId, labelLink);
    return tr;
  };

  const renderAll = (nextRows: Row[]): void => {
    rows = nextRows;
    setSelected(undefined);
    rowElements.clear();
    rowLabels.clear();
    const frag = document.createDocumentFragment();
    for (const row of rows) {
      frag.appendChild(createRow(row));
    }
    tbody.replaceChildren(frag);
  };

  const appendRows = (nextRows: Row[]): void => {
    const frag = document.createDocumentFragment();
    for (const row of nextRows) {
      frag.appendChild(createRow(row));
    }
    tbody.appendChild(frag);
  };

  // Action handlers
  const runLots = () => {
    renderAll(buildData(10000));
  };

  const add = () => {
    const next = buildData(1000);
    rows = rows.concat(next);
    appendRows(next);
  };

  const update = () => {
    for (let i = 0; i < rows.length; i += 10) {
      const row = rows[i];
      row.label = `${row.label} !!!`;
      const labelEl = rowLabels.get(row.id);
      if (labelEl) labelEl.textContent = row.label;
    }
  };

  const clear = () => {
    rows = [];
    setSelected(undefined);
    rowElements.clear();
    rowLabels.clear();
    tbody.replaceChildren();
  };

  const swapRows = () => {
    if (rows.length > 998) {
      const tmp = rows[1];
      rows[1] = rows[998];
      rows[998] = tmp;
      const el1 = tbody.children[1];
      const el2 = tbody.children[998];
      if (el1 && el2) {
        const placeholder = document.createComment("swap");
        tbody.replaceChild(placeholder, el1);
        tbody.replaceChild(el1, el2);
        tbody.replaceChild(el2, placeholder);
      }
    }
  };

  const run = () => {
    renderAll(buildData(1000));
  };

  // Create action buttons
  const runBtn = hx(
    "button",
    {
      signal,
      props: { id: "run", className: "btn btn-primary btn-block" },
      attrs: { type: "button" },
      on: { click: run },
    },
    "Create 1,000 rows"
  );

  const runLotsBtn = hx(
    "button",
    {
      signal,
      props: { id: "runlots", className: "btn btn-primary btn-block" },
      attrs: { type: "button" },
      on: { click: runLots },
    },
    "Create 10,000 rows"
  );

  const addBtn = hx(
    "button",
    {
      signal,
      props: { id: "add", className: "btn btn-primary btn-block" },
      attrs: { type: "button" },
      on: { click: add },
    },
    "Append 1,000 rows"
  );

  const updateBtn = hx(
    "button",
    {
      signal,
      props: { id: "update", className: "btn btn-primary btn-block" },
      attrs: { type: "button" },
      on: { click: update },
    },
    "Update every 10th row"
  );

  const clearBtn = hx(
    "button",
    {
      signal,
      props: { id: "clear", className: "btn btn-primary btn-block" },
      attrs: { type: "button" },
      on: { click: clear },
    },
    "Clear"
  );

  const swapRowsBtn = hx(
    "button",
    {
      signal,
      props: { id: "swaprows", className: "btn btn-primary btn-block" },
      attrs: { type: "button" },
      on: { click: swapRows },
    },
    "Swap Rows"
  );

  // Table body is updated directly by the action handlers.
  const table = h(
    "table",
    { className: "table table-hover table-striped test-data" },
    [tbody]
  );

  const container = h("div", { className: "container" }, [
    h("div", { className: "jumbotron" }, [
      h("div", { className: "row" }, [
        h("div", { className: "col-md-6" }, [h("h1", null, "fun-web (optimized)")]),
        h("div", { className: "col-md-6" }, [
          h("div", { className: "row" }, [
            h("div", { className: "col-sm-6 smallpad" }, [runBtn]),
            h("div", { className: "col-sm-6 smallpad" }, [runLotsBtn]),
            h("div", { className: "col-sm-6 smallpad" }, [addBtn]),
            h("div", { className: "col-sm-6 smallpad" }, [updateBtn]),
            h("div", { className: "col-sm-6 smallpad" }, [clearBtn]),
            h("div", { className: "col-sm-6 smallpad" }, [swapRowsBtn]),
          ]),
        ]),
      ]),
    ]),
    table,
    h("span", {
      className: "preloadicon glyphicon glyphicon-remove",
      "aria-hidden": "true",
    }),
  ]);

  return h("div", { id: "main" }, [container]);
};

// Mount the app
const app = document.getElementById("app");
if (app) {
  mount(App, {}, app);
}
