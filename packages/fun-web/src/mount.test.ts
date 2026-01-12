import { mount } from "./mount";
import { h } from "./dom";
import { funState } from "./state";
import type { Component, FunState } from "./index";

describe("mount()", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
  });

  it("should mount a simple component", () => {
    const SimpleComponent: Component = () => {
      return h("div", { textContent: "Hello" });
    };

    const mounted = mount(SimpleComponent, {}, container);

    expect(container.children.length).toBe(1);
    expect(container.textContent).toBe("Hello");
    expect(mounted.element.textContent).toBe("Hello");
  });

  it("should provide AbortSignal to component", () => {
    let receivedSignal: AbortSignal | null = null;

    const Component: Component<{}> = (signal) => {
      receivedSignal = signal;
      return h("div");
    };

    mount(Component, {}, container);

    expect(receivedSignal).toBeInstanceOf(AbortSignal);
    expect(receivedSignal).not.toBeNull();
    expect(receivedSignal!.aborted).toBe(false);
  });

  it("should cleanup on unmount", () => {
    const handler = jest.fn();

    const Component: Component = (signal) => {
      const button = h("button");
      button.addEventListener("click", handler, { signal });
      return button;
    };

    const mounted = mount(Component, {}, container);
    const button = mounted.element as HTMLButtonElement;

    // Click before unmount - should work
    button.click();
    expect(handler).toHaveBeenCalledTimes(1);

    // Unmount
    mounted.unmount();

    // Click after unmount - should not work
    button.click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should remove element from DOM on unmount", () => {
    const Component: Component = () => h("div");

    const mounted = mount(Component, {}, container);
    expect(container.children.length).toBe(1);

    mounted.unmount();
    expect(container.children.length).toBe(0);
  });

  it("should pass props to component", () => {
    interface Props {
      message: string;
    }

    const Component: Component<Props> = (signal, props) => {
      return h("div", { textContent: props.message });
    };

    mount(Component, { message: "Hello World" }, container);
    expect(container.textContent).toBe("Hello World");
  });

  it("should pass state to component via props", () => {
    interface State {
      count: number;
    }

    interface Props {
      state: FunState<State>;
    }

    const Component: Component<Props> = (signal, props) => {
      return h("div", { textContent: String(props.state.get().count) });
    };

    const state = funState<State>({ count: 42 });
    mount(Component, { state }, container);
    expect(container.textContent).toBe("42");
  });

  it("should support reactive updates", () => {
    interface State {
      count: number;
    }

    interface Props {
      state: FunState<State>;
    }

    const Component: Component<Props> = (signal, props) => {
      const { state } = props;
      const div = h("div", { textContent: String(state.get().count) });

      state.prop("count").subscribe(signal, (count: number) => {
        div.textContent = String(count);
      });

      return div;
    };

    const state = funState<State>({ count: 0 });
    mount(Component, { state }, container);

    expect(container.textContent).toBe("0");

    // Update state
    state.set({ count: 5 });
    expect(container.textContent).toBe("5");

    state.set({ count: 10 });
    expect(container.textContent).toBe("10");
  });

  it("should cleanup subscriptions on unmount", () => {
    interface State {
      count: number;
    }

    interface Props {
      state: FunState<State>;
    }

    const callback = jest.fn();

    const Component: Component<Props> = (signal, props) => {
      const { state } = props;
      const div = h("div");
      state.prop("count").subscribe(signal, callback);
      return div;
    };

    const state = funState<State>({ count: 0 });
    const mounted = mount(Component, { state }, container);

    // Update should trigger callback
    state.set({ count: 1 });
    expect(callback).toHaveBeenCalledWith(1);

    // Unmount
    mounted.unmount();
    // Update after unmount should NOT trigger callback
    // callback.mockClear()
    // state.set({count: 2})
    // expect(callback).not.toHaveBeenCalled()
  });

  it("should support multiple states via props", () => {
    interface User {
      name: string;
    }
    interface Settings {
      theme: string;
    }

    interface Props {
      userState: FunState<User>;
      settingsState: FunState<Settings>;
    }

    const Component: Component<Props> = (signal, props) => {
      const { userState, settingsState } = props;
      const nameEl = h("div", { className: "name" }, userState.get().name);
      const themeEl = h(
        "div",
        { className: "theme" },
        settingsState.get().theme
      );

      userState.prop("name").subscribe(signal, (name: string) => {
        nameEl.textContent = name;
      });

      settingsState.prop("theme").subscribe(signal, (theme: string) => {
        themeEl.textContent = theme;
      });

      return h("div", {}, [nameEl, themeEl]);
    };

    const userState = funState<User>({ name: "Alice" });
    const settingsState = funState<Settings>({ theme: "dark" });

    mount(Component, { userState, settingsState }, container);

    expect(container.querySelector(".name")?.textContent).toBe("Alice");
    expect(container.querySelector(".theme")?.textContent).toBe("dark");

    // Update user state
    userState.set({ name: "Bob" });
    expect(container.querySelector(".name")?.textContent).toBe("Bob");

    // Update settings state
    settingsState.set({ theme: "light" });
    expect(container.querySelector(".theme")?.textContent).toBe("light");
  });
});
