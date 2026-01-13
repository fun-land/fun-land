import { funState } from "./state";
import { prop } from "@fun-land/accessor";

describe("funState", () => {
  it("should create state with initial value", () => {
    const state = funState({ count: 0 });
    expect(state.get()).toEqual({ count: 0 });
  });

  it("should update state with set", () => {
    const state = funState({ count: 0 });
    state.set({ count: 5 });
    expect(state.get()).toEqual({ count: 5 });
  });

  it("should update state with mod", () => {
    const state = funState({ count: 0 });
    state.mod((s: { count: number }) => ({ count: s.count + 1 }));
    expect(state.get()).toEqual({ count: 1 });
  });

  it("should focus on property", () => {
    const state = funState({ count: 0, name: "test" });
    const countState = state.prop("count");
    expect(countState.get()).toBe(0);
  });

  it("should update focused state", () => {
    const state = funState({ count: 0, name: "test" });
    const countState = state.prop("count");
    countState.set(5);
    expect(state.get()).toEqual({ count: 5, name: "test" });
  });

  describe("subscribe subscriptions", () => {
    it("should call subscriber when state changes", () => {
      const state = funState({ count: 0 });
      const controller = new AbortController();
      const callback = jest.fn();

      state.subscribe(controller.signal, callback);
      state.set({ count: 1 });

      expect(callback).toHaveBeenCalledWith({ count: 1 });
    });

    it("should call subscriber multiple times", () => {
      const state = funState({ count: 0 });
      const controller = new AbortController();
      const callback = jest.fn();

      state.subscribe(controller.signal, callback);
      state.set({ count: 1 });
      state.set({ count: 2 });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenNthCalledWith(1, { count: 1 });
      expect(callback).toHaveBeenNthCalledWith(2, { count: 2 });
    });

    it("should call focused state subscriber only when that property changes", () => {
      const state = funState({ count: 0, name: "test" });
      const countState = state.prop("count");
      const controller = new AbortController();
      const callback = jest.fn();

      countState.subscribe(controller.signal, callback);

      // Change count - should trigger
      state.set({ count: 1, name: "test" });
      expect(callback).toHaveBeenCalledWith(1);

      // Change name only - should not trigger
      callback.mockClear();
      state.set({ count: 1, name: "changed" });
      expect(callback).not.toHaveBeenCalled();

      // Change count again - should trigger
      state.set({ count: 2, name: "changed" });
      expect(callback).toHaveBeenCalledWith(2);
    });

    it("should support multiple subscribers", () => {
      const state = funState({ count: 0 });
      const controller = new AbortController();
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      state.subscribe(controller.signal, callback1);
      state.subscribe(controller.signal, callback2);

      state.set({ count: 1 });

      expect(callback1).toHaveBeenCalledWith({ count: 1 });
      expect(callback2).toHaveBeenCalledWith({ count: 1 });
    });

    it("should work with accessor-based focus", () => {
      interface User {
        name: string;
        age: number;
      }
      const state = funState<User>({ name: "Alice", age: 30 });
      const nameState = state.focus(prop<User>()("name"));
      const controller = new AbortController();
      const callback = jest.fn();

      nameState.subscribe(controller.signal, callback);

      state.set({ name: "Bob", age: 30 });

      expect(callback).toHaveBeenCalledWith("Bob");
    });
  });

  describe("query with accessors", () => {
    it("should query state using accessor", () => {
      const state = funState({ count: 5 });
      const result = state.query(prop<{ count: number }>()("count"));
      expect(result).toEqual([5]);
    });

    it("should query focused state using accessor", () => {
      interface User {
        profile: {
          name: string;
          age: number;
        };
      }
      const state = funState<User>({
        profile: { name: "Alice", age: 30 },
      });
      const profileState = state.prop("profile");
      const result = profileState.query(prop<User["profile"]>()("name"));
      expect(result).toEqual(["Alice"]);
    });
  });

  describe("nested focus", () => {
    it("should support focusing a focused state", () => {
      interface AppState {
        user: {
          profile: {
            name: string;
          };
        };
      }
      const state = funState<AppState>({
        user: { profile: { name: "Alice" } },
      });

      const userState = state.prop("user");
      const profileState = userState.prop("profile");
      const nameState = profileState.prop("name");

      expect(nameState.get()).toBe("Alice");

      nameState.set("Bob");
      expect(state.get().user.profile.name).toBe("Bob");
    });

    it("should trigger subscriptions on nested focused states", () => {
      interface AppState {
        user: {
          profile: {
            name: string;
          };
        };
      }
      const state = funState<AppState>({
        user: { profile: { name: "Alice" } },
      });

      const userState = state.prop("user");
      const profileState = userState.prop("profile");
      const nameState = profileState.prop("name");

      const controller = new AbortController();
      const callback = jest.fn();

      nameState.subscribe(controller.signal, callback);

      state.set({ user: { profile: { name: "Bob" } } });

      expect(callback).toHaveBeenCalledWith("Bob");

      controller.abort();
    });

    it("should not trigger deeply focused subscription when unrelated field changes", () => {
      interface AppState {
        user: {
          profile: {
            name: string;
            age: number;
          };
        };
      }
      const state = funState<AppState>({
        user: { profile: { name: "Alice", age: 30 } },
      });

      const userState = state.prop("user");
      const profileState = userState.prop("profile");
      const nameState = profileState.prop("name");

      const controller = new AbortController();
      const callback = jest.fn();

      nameState.subscribe(controller.signal, callback);

      // Change age, not name
      state.set({ user: { profile: { name: "Alice", age: 31 } } });

      expect(callback).not.toHaveBeenCalled();

      // Change name
      state.set({ user: { profile: { name: "Bob", age: 31 } } });

      expect(callback).toHaveBeenCalledWith("Bob");

      controller.abort();
    });
  });
});
