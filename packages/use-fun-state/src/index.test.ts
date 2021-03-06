import {createElement as e, FunctionComponent, useState} from 'react'
import {render} from 'react-dom'
import {act} from 'react-dom/test-utils'
import {FunState} from '@fun-land/fun-state'
import useFunState from './index'

let container: HTMLDivElement | undefined

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
})

afterEach(() => {
  container !== undefined && document.body.removeChild(container)
  container = undefined
})

describe('useFunState', () => {
  it('doesnt recreate funstate instances every render', () => {
    interface St {
      a: number
    }
    const inc = (a: number): number => a + 1
    let st: FunState<St> | undefined
    const TestComp: FunctionComponent = () => {
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
    act(() => {
      // Something wrong with the react types so I'm forcing `any` to get it to work as documented
      container !== undefined && render(e(TestComp) as any, container)
    })
    const firstState = st
    const button = container?.querySelector('button')
    act(() => {
      button?.dispatchEvent(new MouseEvent('click', {bubbles: true}))
    })

    expect(st).toBe(firstState)
    expect(st?.get()).toEqual({a: 1})
    expect(container?.querySelector('button')?.textContent).toBe('a 1, b 1')
    act(() => {
      st?.prop('a').set(2)
    })
    expect(container?.querySelector('button')?.textContent).toBe('a 2, b 1')
  })
  it('modifies the state with the globalMod callback', () => {
    interface St {
      a: number
      b: number
    }
    const inc = (a: number): number => a + 1
    let fs: FunState<St> | undefined
    const TestComp: FunctionComponent = () => {
      fs = useFunState<St>({a: 0, b: 10}, (s) => ({...s, b: s.b - 1}))
      const s = fs.get()
      return e(
        'button',
        {
          onClick: (): void => {
            fs?.prop('a').mod(inc)
          }
        },
        `a ${s.a}, b ${s.b}`
      )
    }
    act(() => {
      // Something wrong with the react types so I'm forcing `any` to get it to work as documented
      container !== undefined && render(e(TestComp) as any, container)
    })
    act(() => {
      container?.querySelector('button')?.dispatchEvent(new MouseEvent('click', {bubbles: true}))
    })

    expect(fs?.get()).toEqual<St>({a: 1, b: 9})
  })
})
