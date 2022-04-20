import { prop } from "@fun-land/accessor";
import React, { FC } from "react";
import { FunState } from "@fun-land/fun-state";

export interface TodoState {
  checked: boolean;
  priority: number;
  label: string;
}
export const todoProps = prop<TodoState>();

// Here we're mixing in additional properies that we may need
export const Todo: FC<{ state: FunState<TodoState>; removeItem: () => void }> =
  ({ state, removeItem }) => {
    const { checked, priority, label } = state.get();
    return (
      <li>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => state.prop("checked").set(e.currentTarget.checked)}
        />
        <select
          value={priority}
          onChange={(e) => state.prop("priority").set(+e.currentTarget.value)}
        >
          <option value={0}>High</option>
          <option value={1}>Low</option>
        </select>
        <input
          type="text"
          value={label}
          onChange={(e) => state.prop("label").set(e.currentTarget.value)}
        />
        <button onClick={removeItem}>X</button>
      </li>
    );
  };
