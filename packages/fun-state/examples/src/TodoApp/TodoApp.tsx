import React, { FC, ChangeEventHandler } from 'react'
import { TodoState, Todo, todoProps } from './Todo'
import useFunState, { FunState } from '../../../src/useFunState'
import { pipe, removeAt, prepend } from '../../../src/fun'
import { comp, prop, set, all, index } from 'accessor-ts'

/**
 * TodoApp Model
 */
interface State {
  value: string
  items: TodoState[]
}
const initialState: State = { value: '', items: [] }
const stateProps = prop<State>()

// some business logic pulled out of the component. These are all State -> State
const addItem = (state: State): State =>
  stateProps('items').mod(prepend<TodoState>({ checked: false, label: state.value, priority: 1 }))(state)
const clearValue = set(stateProps('value'))('')

//modifying a bunch of child items
const markAllDone = set(comp(stateProps('items'), all<TodoState>(), todoProps('checked')))(true)

// modifying the collection
const removeItem = pipe(removeAt, stateProps('items').mod)

// depends on state as props but
const Todos: FC<{ funState: FunState<State> }> = ({ funState }) => {
  // A little bit of business logic in-line for convenience
  const onValueChange: ChangeEventHandler<HTMLInputElement> = ({ currentTarget: { value } }) =>
    funState.prop('value').set(value)
  const onClickAllDone = () => funState.mod(markAllDone)
  // querying child items
  const allDone = funState.query(comp(stateProps('items'), all<TodoState>())).every(a => a.checked)
  return (
    <div>
      <h1>Todo App</h1>
      <form
        onSubmit={e => {
          e.preventDefault()
          funState.mod(pipe(addItem, clearValue))
        }}>
        <input value={funState.state.value} onChange={onValueChange} type="input" />
        <button type="submit">Add</button>
      </form>
      <button onClick={onClickAllDone}>Mark All done</button> {allDone && 'all done!'}
      <ul>
        {funState.state.items.map((item, i) => (
          <Todo
            {...funState.focus(comp(stateProps('items'), index(i)))}
            key={i}
            removeItem={() => funState.mod(removeItem(i))}
          />
        ))}
      </ul>
    </div>
  )
}

// The Apps themselves can be impure but other components should not be
const TodoApp: FC = () => <Todos funState={useFunState(initialState)} />
export default TodoApp
