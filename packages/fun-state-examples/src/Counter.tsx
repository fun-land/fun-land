/** This component's state is managed externally so strictly-speaking it's a stateless functional component  */
import React, { FC, ChangeEventHandler } from "react";
import { FunState } from "@fun-land/fun-state";

const inc = (a: number) => a + 1;
const dec = (a: number) => a - 1;

export type CounterState = number;
export const initialCounterState = 0;

export const Counter: FC<{ state: FunState<CounterState> }> = ({ state }) => {
  const onCountChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const val = +e.currentTarget.value;
    if (isFinite(val)) state.set(val);
  };
  return (
    <div>
      <h1>Counter</h1>
      <span>
        <input value={state.get()} onChange={onCountChange} />
      </span>
      <button onClick={() => state.mod(inc)}>up</button>
      <button onClick={() => state.mod(dec)}>down</button>
    </div>
  );
};
