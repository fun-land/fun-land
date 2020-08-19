import {head} from './fun'

describe('head', () => {
  it('gets the first element in an array', () => {
    expect(head([2])).toBe(2)
  })

  it('returns undefined for empty (an typechecks as such)', () => {
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const a: string = head<string>([])
    expect(a).toBeUndefined()
  })
})
