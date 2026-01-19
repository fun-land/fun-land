/**
 * js-framework-benchmark implementation for fun-web
 *
 * Required actions:
 * - runlots: Create 10,000 rows
 * - add: Add 1000 rows
 * - update: Update every 10th row
 * - clear: Remove all rows
 * - swaprows: Swap rows 1 and 999
 * - remove: Remove first row
 */
import {
  h,
  hx,
  mount,
  bindListChildren,
  bindClass,
  type Component,
  enhance,
} from "@fun-land/fun-web";
import {
  funState,
  type FunState,
  mapRead,
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

// Generate unique IDs - use timestamp + random to avoid duplicates
let idCounter = 1;
const randomId = () => idCounter++;

const buildData = (count: number): Row[] => {
  const data: Row[] = [];
  for (let i = 0; i < count; i++) {
    data.push({ id: randomId(), label: randomName() });
  }
  return data;
};

// Accessor to get id as string for keying
const rowIdKey: Accessor<Row, string> = {
  query: (row: Row) => [String(row.id)],
  mod: (f) => (row: Row) => ({ ...row, id: Number(f(String(row.id))) }),
};

const RowComponent: Component<{
  state: FunState<Row>;
  selected: FunState<number | undefined>;
  onRemove: () => void;
}> = (signal, { state, selected, onRemove }) => {
  const rowId = state.get().id;
  const idStr = rowId.toString();

  // Derive whether this row is selected
  const isSelected = mapRead(
    selected,
    (selectedId) => selectedId === rowId
  );

  const removeCell = h(
    "td",
    { className: "col-md-1" },
    [
      hx(
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
      ),
    ]
  );

  return enhance(
    h("tr", {}, [
      h("td", { className: "col-md-1" }, idStr),
      h(
        "td",
        { className: "col-md-4" },
        hx("a", {
          signal,
          on: {
            click: (e) => {
              e.preventDefault();
              selected.set(rowId);
            },
          },
          bind: { textContent: state.prop("label") },
        })
      ),
      removeCell,
      h("td", { className: "col-md-6" })
    ]),
    bindClass("danger", isSelected, signal)
  );
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

  // Table with keyed list
  const tbody = h("tbody", { id: "tbody" });

  // Use bindListChildren for efficient keyed list rendering
  bindListChildren({
    signal,
    state: state.prop("rows"),
    key: rowIdKey,
    row: ({ signal: rowSignal, state: rowState, remove: removeRow }) =>
      RowComponent(rowSignal, {
        state: rowState,
        selected: state.prop("selected"),
        onRemove: removeRow,
      }),
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
