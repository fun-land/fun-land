import { Acc, viewed } from "@fun-land/accessor";
export interface TodoState {
  key: string;
  checked: boolean;
  priority: number;
  label: string;
}

const stateAcc = Acc<TodoState>();

export const priorityAsString = stateAcc
  .prop("priority")
  .focus(viewed(String, Number));
