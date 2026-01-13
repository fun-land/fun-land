import {ChangeEvent, act, createElement as e, useState} from 'react'
import {FunState, funState} from '@fun-land/fun-state'
import useFunState, {bindChecked, bindValue} from './index'
import {fireEvent, render, renderHook} from '@testing-library/react'

const inc = (a: number): number => a + 1

interface St {
  a: number
}

const initialState = Object.freeze({a: 0})

describe('useFunState', () => {
  it('doesnt recreate funstate instances every render', () => {
    interface St {
      a: number
    }
    const inc = (a: number): number => a + 1
    let st: FunState<St> | undefined
    const TestComp = () => {
      st = useFunState<St>({a: 0})
      const [b, setB] = useState(0)
      return e(
        'button',
        {
          onClick: (): void => {
            st?.prop('a').mod(inc)
            setB(inc)
          }
        },
        `a ${st.get().a}, b ${b}`
      )
    }
    const res = render(e(TestComp))
    const firstState = st
    const button = res.getByRole('button')
    fireEvent.click(button)

    expect(st).toBe(firstState)
    expect(st?.get()).toEqual({a: 1})
    expect(res.getByRole('button').textContent).toBe('a 1, b 1')
    act(() => {
      st?.prop('a').set(2)
    })
    expect(res.getByRole('button').textContent).toBe('a 2, b 1')
  })
  it('renders with default state', () => {
    const {result} = renderHook(() => useFunState<St>(initialState))
    expect(result.current.get()).toEqual(initialState)
  })
  it('root set works', () => {
    const {result} = renderHook(() => useFunState<St>(initialState))
    act(() => {
      result.current.set({a: 4})
    })
    expect(result.current.get()).toEqual({a: 4})
  })
  it('root mod works', () => {
    const {result} = renderHook(() => useFunState(1))
    act(() => {
      result.current.mod(inc)
    })
    expect(result.current.get()).toEqual(2)
  })
  it('prop set works', () => {
    const {result} = renderHook(() => useFunState<St>(initialState))
    act(() => {
      result.current.prop('a').set(4)
    })
    expect(result.current.get()).toEqual({a: 4})
  })
  it('prop mod works', () => {
    const {result} = renderHook(() => useFunState<St>(initialState))
    act(() => {
      result.current.prop('a').mod(inc)
    })
    expect(result.current.get()).toEqual({a: 1})
  })
  it('is reference stable', () => {
    const {result} = renderHook(() => useFunState<St>(initialState))
    act(() => {
      result.current.prop('a').mod(inc)
    })
    expect(result.current.get()).toEqual({a: 1})
  })
})

describe('bindValue', () => {
  it('sets value', () => {
    const bob = 'bob'
    const state = funState(bob)
    expect(bindValue(state).value).toBe(bob)
  })
  it('onChange updates value', () => {
    const bob = 'bob'
    const state = funState(bob)
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const mockChangeEvent = {currentTarget: {value: 'Bob'}} as ChangeEvent<HTMLInputElement>
    bindValue(state).onChange(mockChangeEvent)
    expect(state.get()).toBe('Bob')
  })
})
describe('bindChecked', () => {
  it('sets checked', () => {
    const state = funState(false)
    expect(bindChecked(state).checked).toBe(false)
  })
  it('onChange updates checked', () => {
    const state = funState(false)
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const mockChangeEvent = {currentTarget: {checked: true}} as ChangeEvent<HTMLInputElement>
    bindChecked(state).onChange(mockChangeEvent)
    expect(state.get()).toBe(true)
  })
})
