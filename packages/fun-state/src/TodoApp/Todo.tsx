import { prop } from '../lib/accessor'
import React, { FC } from 'react'
import { FunState } from '../lib/useFunState'

export interface TodoState {
  checked: boolean
  priority: number
  label: string
}
export const todoProps = prop<TodoState>()

// Here we're mixing in additional properies that we may need
export const Todo: FC<FunState<TodoState> & { removeItem: () => void }> = ({ state, mod, set, removeItem }) => (
  <li>
    <input type="checkbox" checked={state.checked} onChange={e => set(todoProps('checked'))(e.currentTarget.checked)} />
    <select value={state.priority} onChange={e => set(todoProps('priority'))(+e.currentTarget.value)}>
      <option value={0}>High</option>
      <option value={1}>Low</option>
    </select>
    <input type="text" value={state.label} onChange={e => set(todoProps('label'))(e.currentTarget.value)} />
    <button onClick={removeItem}>X</button>
  </li>
)
