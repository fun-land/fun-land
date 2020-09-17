import {
  head,
  empty,
  not,
  tail,
  prepend,
  append,
  removeAt,
  mergeInto,
  flatmap,
} from "./util";

describe("flatmap", () => {
  it("can map over empty", () => {
    expect(flatmap(empty)([])).toEqual([]);
  });
  it("flattens", () => {
    expect(flatmap((a: number) => [a, a])([1, 2])).toEqual([1, 1, 2, 2]);
  });
});

describe("removeAt", () => {
  it("removes item at index", () => {
    expect(removeAt(1)([0, 1, 2])).toEqual([0, 2]);
  });
  it("noop if index out of bounds", () => {
    expect(removeAt(4)([0, 1, 2])).toEqual([0, 1, 2]);
  });
  it("noop on empty", () => {
    expect(removeAt(0)([])).toEqual([]);
  });
});

describe("prepend", () => {
  it("adds element to end of array", () => {
    expect(prepend(1)([2])).toEqual([1, 2]);
    expect(prepend(1)([])).toEqual([1]);
  });
});

describe("append", () => {
  it("adds element to front of array", () => {
    expect(append(1)([2])).toEqual([2, 1]);
    expect(append(1)([])).toEqual([1]);
  });
});

describe("head", () => {
  it("gets the first element in an array", () => {
    expect(head([2])).toBe(2);
  });

  it("returns undefined for empty (an typechecks as such)", () => {
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const a: string = head<string>([]);
    expect(a).toBeUndefined();
  });
});

describe("tail", () => {
  it("returns empty for unary array", () => {
    expect(tail([2])).toEqual([]);
  });
  it("returns empty for empty array", () => {
    expect(tail([])).toEqual([]);
  });

  it("returns rest for binary+ array", () => {
    expect(tail([2, 3])).toEqual([3]);
    expect(tail([2, 3, 4])).toEqual([3, 4]);
  });
});

describe("not", () => {
  it("defies expectation", () => {
    expect(not(true)).toBe(false);
    expect(not(false)).toBe(true);
  });
});

describe("mergeInto", () => {
  it("merges first into second arg", () => {
    interface Obj {
      a: number;
      b: number;
    }
    expect(
      mergeInto<Obj>({ a: 1 })({ a: 2, b: 3 })
    ).toEqual({ a: 1, b: 3 });
  });
});
