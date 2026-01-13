import {pureState, standaloneEngine, funState, merge, extractArray} from './FunState'
import {comp, all, prop, prepend, set} from '@fun-land/accessor'

describe('standaloneEngine', () => {
  it('sets', () => {
    const me = standaloneEngine(1)
    expect(me.getState()).toBe(1)
    me.modState(() => 3)
    expect(me.getState()).toBe(3)
  })
})

describe('merge', () => {
  it('merges a partial state into a funState', () => {
    interface Obj {
      a: number
      b: boolean
    }
    const fs = funState<Obj>({a: 1, b: false})

    merge(fs)({b: true})
    expect(fs.get()).toEqual({a: 1, b: true})
  })
  it('handles undefined values correctly', () => {
    interface Obj {
      a: number | undefined
      b: boolean | undefined
    }
    const fs = funState<Obj>({a: 1, b: false})

    merge(fs)({b: undefined})
    expect(fs.get()).toEqual({a: 1, b: undefined})
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
  it('focus works recurrsively', () => {
    interface Jface {
      b: number
    }
    interface Iface {
      a: Jface[]
    }
    const initial = Object.freeze({a: [{b: 1}, {b: 2}]})
    const fs = funState(initial)
    const afs = fs.focus(prop<Iface>()('a')).focus(all<Jface>()).focus(prop<Jface>()('b'))
    // mutating subs works
    afs.mod((a) => a + 1)
    expect(afs.get()).toEqual(2)
    expect(fs.get()).toEqual({a: [{b: 2}, {b: 3}]})
    // adding items to traversal still works
    fs.prop('a').mod(prepend({b: 0}))
    expect(fs.get()).toEqual({a: [{b: 0}, {b: 2}, {b: 3}]})
    expect(afs.get()).toEqual(0)

    expect(fs.focus(prop<Iface>()('a')).focus(all<Jface>()).query(prop<Jface>()('b'))).toEqual([0, 2, 3])
  })

  describe('subscribe', () => {
    it('should call subscriber when state changes', () => {
      const fs = funState({count: 0})
      const controller = new AbortController()
      const callback = jest.fn()

      fs.subscribe(controller.signal, callback)
      fs.set({count: 1})

      expect(callback).toHaveBeenCalledWith({count: 1})
    })

    it('should call subscriber multiple times', () => {
      const fs = funState({count: 0})
      const controller = new AbortController()
      const callback = jest.fn()

      fs.subscribe(controller.signal, callback)
      fs.set({count: 1})
      fs.set({count: 2})

      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenNthCalledWith(1, {count: 1})
      expect(callback).toHaveBeenNthCalledWith(2, {count: 2})
    })

    it('should stop calling subscriber after signal aborts', () => {
      const fs = funState({count: 0})
      const controller = new AbortController()
      const callback = jest.fn()

      fs.subscribe(controller.signal, callback)
      fs.set({count: 1})
      expect(callback).toHaveBeenCalledTimes(1)

      controller.abort()
      fs.set({count: 2})
      expect(callback).toHaveBeenCalledTimes(1) // Still 1, not called again
    })

    it('should support focused subscriptions', () => {
      const fs = funState({a: 1, b: 2})
      const controller = new AbortController()
      const callback = jest.fn()

      fs.prop('a').subscribe(controller.signal, callback)
      fs.set({a: 10, b: 2})

      expect(callback).toHaveBeenCalledWith(10)
    })

    it('should only notify focused subscriber when focused value changes', () => {
      const fs = funState({a: 1, b: 2})
      const controller = new AbortController()
      const callback = jest.fn()

      fs.prop('a').subscribe(controller.signal, callback)

      // Change b only - should not notify
      fs.set({a: 1, b: 20})
      expect(callback).not.toHaveBeenCalled()

      // Change a - should notify
      fs.set({a: 10, b: 20})
      expect(callback).toHaveBeenCalledWith(10)
    })

    it('should support deeply focused subscriptions', () => {
      const fs = funState({a: {b: {c: 1}}})
      const controller = new AbortController()
      const callback = jest.fn()

      fs.prop('a').prop('b').prop('c').subscribe(controller.signal, callback)
      fs.set({a: {b: {c: 10}}})

      expect(callback).toHaveBeenCalledWith(10)
    })

    it('should only notify deeply focused subscriber when focused value changes', () => {
      const fs = funState({a: {b: {c: 1}}})
      const controller = new AbortController()
      const callback = jest.fn()

      fs.prop('a').prop('b').prop('c').subscribe(controller.signal, callback)

      // Change parent without changing focused value
      fs.set({a: {b: {c: 1}}})
      expect(callback).not.toHaveBeenCalled()

      // Change focused value
      fs.set({a: {b: {c: 5}}})
      expect(callback).toHaveBeenCalledWith(5)
    })

    it('should handle nested focus subscriptions correctly', () => {
      interface St {
        a: {b: {c: number}}
        x: number
      }
      const fs = funState<St>({a: {b: {c: 1}}, x: 0})
      const controller = new AbortController()
      const callback = jest.fn()

      // Create nested focused states via .focus() on focused states
      const aState = fs.prop('a')
      const bState = aState.prop('b')
      bState.subscribe(controller.signal, callback)

      // Change unrelated field x - the accessor library will preserve 'a' reference
      const xProp = prop<St>()('x')
      fs.mod(set(xProp)(1))
      expect(callback).not.toHaveBeenCalled()

      // Change c within b - should notify
      const cProp = comp(prop<St>()('a'), prop<St['a']>()('b'), prop<St['a']['b']>()('c'))
      fs.mod(set(cProp)(2))
      expect(callback).toHaveBeenCalledWith({c: 2})
      expect(callback).toHaveBeenCalledTimes(1)
    })
  })

  describe('extractArray', () => {
    it('should convert array state into array of focused states', () => {
      const fs = funState([{id: 1}, {id: 2}, {id: 3}])
      const items = extractArray(fs)

      expect(items.length).toBe(3)
      expect(items[0].get()).toEqual({id: 1})
      expect(items[1].get()).toEqual({id: 2})
      expect(items[2].get()).toEqual({id: 3})
    })

    it('should allow mutation through extracted states', () => {
      const fs = funState([{id: 1}, {id: 2}])
      const items = extractArray(fs)

      items[0].set({id: 10})
      expect(fs.get()).toEqual([{id: 10}, {id: 2}])
    })
  })
})
