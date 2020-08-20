import {pureState, standaloneEngine, funState} from './FunState'
import {comp, all, prop} from 'accessor-ts'
import {prepend} from './fun'

describe('mockEngine', () => {
  it('sets', () => {
    const me = standaloneEngine(1)
    expect(me.getState()).toBe(1)
    me.modState(() => 3)
    expect(me.getState()).toBe(3)
  })
})

describe('funState', () => {
  it('sets initial state', () => {
    const fs = pureState(standaloneEngine(1))

    expect(fs.get()).toBe(1)
  })
  it('updates state on set', () => {
    const fs = pureState(standaloneEngine(1))

    expect(fs.get()).toBe(1)
    fs.set(2)
    expect(fs.get()).toBe(2)
  })
  it('updates state on mod', () => {
    const fs = pureState(standaloneEngine(1))

    expect(fs.get()).toBe(1)
    fs.mod((a) => a + 2)
    expect(fs.get()).toBe(3)
  })
  it('creates sub state for prop', () => {
    const fs = funState({a: {b: 1}})
    expect(fs.get()).toEqual({a: {b: 1}})
    const afs = fs.prop('a')
    // focusing down still gives state
    expect(afs.get()).toEqual({b: 1})
    // mutating root doesnt break sub states
    fs.set({a: {b: 3}})
    expect(afs.get()).toEqual({b: 3})
    // mutating subs works
    afs.set({b: 4})
    expect(afs.get()).toEqual({b: 4})
    expect(fs.get()).toEqual({a: {b: 4}})
  })

  it('focus works for more complex accessors', () => {
    interface Jface {
      b: number
    }
    interface Iface {
      a: Jface[]
    }
    const initial = Object.freeze({a: [{b: 1}, {b: 2}]})
    const fs = funState(initial)
    expect(fs.get()).toEqual(initial)
    const acc = comp(prop<Iface>()('a'), all<Jface>(), prop<Jface>()('b'))
    const afs = fs.focus(acc)
    // focusing down still gives state (multi-items are reduced to one)
    expect(fs.query(acc)).toEqual([1, 2])
    expect(fs.focus(prop<Iface>()('a')).get()).toEqual(initial.a)
    // mutating root doesnt break sub states
    // fs.set({a: {b: 3}})
    // expect(afs.get()).toEqual({b: 3})
    // mutating subs works
    afs.mod((a) => a + 1)
    expect(afs.get()).toEqual(2)
    expect(fs.get()).toEqual({a: [{b: 2}, {b: 3}]})
    // adding items to traversal still works
    fs.prop('a').mod(prepend({b: 0}))
    expect(fs.get()).toEqual({a: [{b: 0}, {b: 2}, {b: 3}]})

    expect(afs.get()).toEqual(0)
    expect(fs.query(acc)).toEqual([0, 2, 3])
  })
})