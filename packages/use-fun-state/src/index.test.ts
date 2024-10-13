import {ChangeEvent, act} from 'react'
import {mockState} from '@fun-land/fun-state'
import useFunState, {bindChecked, bindValue} from './index'
import {renderHook} from '@testing-library/react'

const inc = (a: number): number => a + 1

interface St {
  a: number
}

const initialState = Object.freeze({a: 0})

describe('useFunState', () => {
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
    const state = mockState(bob)
    expect(bindValue(state).value).toBe(bob)
  })
  it('onChange updates value', () => {
    const bob = 'bob'
    const state = mockState(bob)
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const mockChangeEvent = {currentTarget: {value: 'Bob'}} as ChangeEvent<HTMLInputElement>
    bindValue(state).onChange(mockChangeEvent)
    expect(state.get()).toBe('Bob')
  })
})
describe('bindChecked', () => {
  it('sets checked', () => {
    const state = mockState(false)
    expect(bindChecked(state).checked).toBe(false)
  })
  it('onChange updates checked', () => {
    const state = mockState(false)
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const mockChangeEvent = {currentTarget: {checked: true}} as ChangeEvent<HTMLInputElement>
    bindChecked(state).onChange(mockChangeEvent)
    expect(state.get()).toBe(true)
  })
})
