/**
 * Optimized js-framework-benchmark implementation for fun-web
 * 
 * Optimizations for 10k rows:
 * 1. Single selection subscription: Instead of N subscriptions (one per row via mapRead),
 *    uses one subscription that updates all row elements directly via classList manipulation.
 *    Reduces subscription overhead from O(n) to O(1) for selection state.
 * 
 * 2. Direct DOM updates: Selection state changes update row elements directly rather than
 *    re-deriving state through reactive chains.
 * 
 * 3. Simplified row rendering: Removed bindClass enhancer which adds subscription overhead.
 * 
 * To use this version:
 *   pnpm run build-optimized-prod
 * 
 * To compare with standard version:
 *   pnpm run build-prod
 */
import {
  h,
  hx,
  mount,
  bindListChildren,
  type Component,
} from "@fun-land/fun-web";
import {
  funState,
  type FunState,
} from "@fun-land/fun-state";
import { type Accessor } from "@fun-land/accessor";

interface Row {
  id: number;
  label: string;
}

interface AppState {
  rows: Row[];
  selected?: number;
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

const rowIdKey: Accessor<Row, string> = {
  query: (row: Row) => [String(row.id)],
  mod: (f) => (row: Row) => ({ ...row, id: Number(f(String(row.id))) }),
};

// Optimized row component - no per-row selection subscription
const RowComponent: Component<{
  state: FunState<Row>;
  selectedId: number | undefined;
  onSelect: (id: number) => void;
  onRemove: () => void;
}> = (signal, { state, selectedId, onSelect, onRemove }) => {
  const row = state.get();
  const rowId = row.id;
  const idStr = rowId.toString();
  const isSelected = selectedId === rowId;

  // Create row element once, update properties directly
  const tr = h("tr", {});
  if (isSelected) {
    tr.classList.add("danger");
  } else {
    tr.classList.remove("danger");
  }

  // ID cell - static, set once
  const idCell = h("td", { className: "col-md-1" }, idStr);

  // Label cell with binding
  const labelCell = h("td", { className: "col-md-4" });
  const labelLink = hx("a", {
    signal,
    on: {
      click: (e) => {
        e.preventDefault();
        onSelect(rowId);
      },
    },
    bind: { textContent: state.prop("label") },
  });
  labelCell.appendChild(labelLink);

  // Remove cell
  const removeCell = h("td", { className: "col-md-1" });
  const removeLink = hx(
    "a",
    {
      signal,
      on: {
        click: (e) => {
          e.preventDefault();
          onRemove();
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

  // Empty cell
  const emptyCell = h("td", { className: "col-md-6" });

  tr.appendChild(idCell);
  tr.appendChild(labelCell);
  tr.appendChild(removeCell);
  tr.appendChild(emptyCell);

  return tr;
};

const App: Component = (signal) => {
  const state = funState<AppState>({ rows: [], selected: undefined });

  // Action handlers
  const runLots = () => {
    state.prop("rows").set(buildData(10000));
    state.prop("selected").set(undefined);
  };

  const add = () => {
    state.prop("rows").mod((rows) => [...rows, ...buildData(1000)]);
  };

  const update = () => {
    state
      .prop("rows")
      .mod((rows) =>
        rows.map((row, i) =>
          i % 10 === 0 ? { ...row, label: `${row.label} !!!` } : row
        )
      );
  };

  const clear = () => {
    state.prop("rows").set([]);
    state.prop("selected").set(undefined);
  };

  const swapRows = () => {
    state.prop("rows").mod((rows) => {
      if (rows.length > 998) {
        const newRows = [...rows];
        [newRows[1], newRows[998]] = [newRows[998], newRows[1]];
        return newRows;
      }
      return rows;
    });
  };

  const run = () => {
    state.prop("rows").set(buildData(1000));
    state.prop("selected").set(undefined);
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

  // Table with optimized list binding
  const tbody = h("tbody", { id: "tbody" });

  // Track row elements for efficient selection updates
  const rowElements = new Map<number, HTMLElement>();

  // Single subscription for selection changes - update all rows at once
  state.prop("selected").watch(signal, (selectedId) => {
    // Update all row elements' selection state
    for (const [rowId, tr] of rowElements) {
      const shouldBeSelected = selectedId === rowId;
      if (shouldBeSelected) {
        tr.classList.add("danger");
      } else {
        tr.classList.remove("danger");
      }
    }
  });

  // Use bindListChildren with optimized row rendering
  bindListChildren({
    signal,
    state: state.prop("rows"),
    key: rowIdKey,
    row: ({ signal: rowSignal, state: rowState, remove: removeRow }) => {
      const row = rowState.get();
      const rowId = row.id;
      const selectedId = state.prop("selected").get();

      const tr = RowComponent(rowSignal, {
        state: rowState,
        selectedId,
        onSelect: (id) => state.prop("selected").set(id),
        onRemove: removeRow,
      }) as HTMLElement;

      // Track for efficient selection updates
      rowElements.set(rowId, tr);
      rowSignal.addEventListener("abort", () => {
        rowElements.delete(rowId);
      }, { once: true });

      return tr;
    },
  })(tbody);

  const table = h(
    "table",
    { className: "table table-hover table-striped test-data" },
    [tbody]
  );

  const container = h("div", { className: "container" }, [
    h("div", { className: "jumbotron" }, [
      h("div", { className: "row" }, [
        h("div", { className: "col-md-6" }, [h("h1", null, "fun-web")]),
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
