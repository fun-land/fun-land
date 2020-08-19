import { prop } from 'accessor-ts'
import React, { FC } from 'react'
import { FunState } from '../../../src/useFunState'

export interface TodoState {
  checked: boolean
  priority: number
  label: string
}
export const todoProps = prop<TodoState>()

// Here we're mixing in additional properies that we may need
export const Todo: FC<FunState<TodoState> & { removeItem: () => void }> = ({ state, removeItem, prop }) => (
  <li>
    <input type="checkbox" checked={state.checked} onChange={e => prop('checked').set(e.currentTarget.checked)} />
    <select value={state.priority} onChange={e => prop('priority').set(+e.currentTarget.value)}>
      <option value={0}>High</option>
      <option value={1}>Low</option>
    </select>
    <input type="text" value={state.label} onChange={e => prop('label').set(e.currentTarget.value)} />
    <button onClick={removeItem}>X</button>
  </li>
)
