import { observableFunState } from "./observable-fun-state";

describe("observableFunState", () => {
  it("can be watched", () => {
    const s = observableFunState({ a: 1 });
    return new Promise((resolve) =>
      s.subscribe((v) => {
        expect(v.get()).toEqual({ a: 1 });
        resolve(undefined);
      })
    );
  });
  it("updates on FS.set()", () => {
    const s = observableFunState({ a: 1 });
    return new Promise((resolve) => {
      const states: number[] = [];
      s.subscribe((v) => {
        const a = v.prop("a");
        states.push(a.get());
        if (a.get() === 1) {
          a.set(2);
          resolve(states);
        }
      });
    }).then((states) => {
      expect(states).toEqual([1, 2]);
    });
  });
  it("updates are shared across observers", () => {
    const s = observableFunState({ a: 1 });
    s.subscribe((v) => {
      const a = v.prop("a");
      if (a.get() === 1) {
        setTimeout(() => a.set(2), 1000);
      }
    });
    return new Promise((resolve) => {
      const states: number[] = [];
      s.subscribe((v) => {
        const a = v.prop("a");
        states.push(a.get());
        if (a.get() === 2) {
          resolve(states);
        }
      });
    }).then((states) => {
      expect(states).toEqual([1, 2]);
    });
  });
  it("unsubscribe detaches observer", () => {
    const s = observableFunState({ a: 1 });
    return new Promise((resolve) => {
      const states: number[] = [];
      s.subscribe((v) => {
        const a = v.prop("a");
        setTimeout(() => {
          a.set(3);
          resolve(states);
        }, 3000);
      });
      const subs = s.subscribe((v) => {
        const a = v.prop("a");
        states.push(a.get());

        if (a.get() === 1)
          setTimeout(() => {
            a.set(2);
          }, 1000);
      });
      setTimeout(() => subs.unsubscribe(), 2000);
    }).then((states) => {
      expect(states).toEqual([1, 2]);
    });
  });
});
