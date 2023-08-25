import {
  Acc,
  prop,
  index,
  filter,
  set,
  all,
  comp,
  unit,
  before,
  after,
  sub,
  readOnly,
  get,
  viewed,
  optional
} from './accessor'

interface Complex {
  value: boolean
}

interface User {
  name: string
  id: number
  cool?: boolean
  connections: number[]
  complex?: Complex
}
const bob: User = Object.freeze({name: 'bob', id: 1, connections: [1, 2]})

// We can store accessors which are bound to the interface by type
const userProps = prop<User>()

describe('prop', () => {
  it('simple property query', () => {
    expect(prop<{a: number}>()('a').query({a: 1})).toEqual([1])
  })
  it('handles optional fields', () => {
    expect(userProps('cool').query(bob)).toEqual([undefined])
  })
})

describe('set', () => {
  it('sets immutably', () => {
    expect(set(userProps('id'))(3)(bob).id).toBe(3)
    expect(bob.id).toBe(1)
  })
})

describe('get', () => {
  it('extracts existing values', () => {
    expect(get(prop<User>()('name'))(bob)).toBe('bob')
  })
  it('returns undefined when matching no items', () => {
    expect(get(index(0))([])).toBe(undefined)
  })
})

// Nested interfaces. Now we're getting to the good part
interface Friend {
  user: User
}

// Can partially apply to create a "group" of accessors bound to a specific interface
const friendProps = prop<Friend>()

// We can compose accessors to point to things within other things

const shari: User = {name: 'Shari', id: 0, connections: [3, 4]}
const mark: User = {name: 'Mark', id: 2, connections: [3, 4], cool: true}

const myFriendBob: Friend = {user: bob}
const myFriendShari: Friend = {user: shari}
const myFriendMark: Friend = {user: mark}

describe('comp', () => {
  const friendName = comp(friendProps('user'), userProps('name'))
  it('composes 2 accessors', () => {
    expect(comp(friendProps('user'), userProps('id')).query(myFriendBob)).toEqual([1])
    expect(set(friendName)('Robert')(myFriendBob).user.name).toBe('Robert')
  })
  it('handles mod correctly', () => {
    expect(comp(friendProps('user'), prop<User>()('id')).mod((a) => a + 1)(myFriendBob).user.id).toBe(2)
  })
})

interface Friends {
  friends: Friend[]
}

const baz: Friends = {friends: [myFriendBob, myFriendShari]}

const isOdd = (a: number): boolean => a % 2 === 1

describe('all', () => {
  it('handles shallow query', () => {
    expect(comp(userProps('connections'), all()).query(bob)).toEqual([1, 2])
  })
  const allConnections = comp(prop<Friends>()('friends'), all(), friendProps('user'), userProps('connections'))
  const oddConnectionsOfFriends = comp(allConnections, filter(isOdd))

  it('handles deep query', () => {
    expect(oddConnectionsOfFriends.query(baz)).toEqual([1, 3])
  })
  it('handles deep assignment', () => {
    expect(allConnections.query(set(oddConnectionsOfFriends)(NaN)(baz))).toEqual([
      [NaN, 2],
      [NaN, 4]
    ])
  })
})

describe('index', () => {
  it('returns queried item', () => {
    expect(comp(friendProps('user'), userProps('connections'), index(1)).query(myFriendBob)).toEqual([2])
  })
  it('mods targeted item', () => {
    expect(comp(userProps('connections'), index(1)).mod((a) => a + 1)(bob)).toEqual({
      name: 'bob',
      id: 1,
      connections: [1, 3]
    })
  })
})

describe('unit', () => {
  it('query composes with other accessors', () => {
    expect(comp(userProps('id'), unit()).query(bob)).toEqual([1])
    expect(comp(unit<User>(), userProps('id')).query(bob)).toEqual([1])
  })
  it('mod still works as it should', () => {
    expect(unit<number>().mod((a) => a + 1)(2)).toBe(3)
  })
  it('mod composes with other accessors', () => {
    expect(comp(userProps('id'), unit()).mod((a) => a + 1)(bob)).toEqual({
      ...bob,
      id: 2
    })
    expect(comp(unit<User>(), userProps('id'), unit<number>()).mod((a) => a + 1)(bob)).toEqual({...bob, id: 2})
  })
})
describe('optional', () => {
  const complexChain = comp(userProps('complex'), optional<Complex | undefined>(), prop<Complex>()('value'))
  it('query empty on optional chain', () => {
    expect(complexChain.query(bob)).toEqual([])
  })
  it('query the value if present', () => {
    expect(complexChain.query({...bob, complex: {value: true}})).toEqual([true])
  })
  it('mod is noop over missing', () => {
    expect(complexChain.mod((value) => !value)(bob)).toEqual(bob)
  })
  it('mod is works if present', () => {
    expect(complexChain.mod((value) => !value)({...bob, complex: {value: true}})).toEqual({
      ...bob,
      complex: {value: false}
    })
  })
  it('examples from docs work', () => {
    const maybeUserName = comp(optional<User | undefined>(), prop<User>()('name'))
    expect(maybeUserName.query(bob)).toEqual(['bob'])
    expect(maybeUserName.query(undefined)).toEqual([]) // => []
    expect(maybeUserName.mod(() => 'Robert')(bob)) // => (bob but with name set to "Robert")
    expect(maybeUserName.mod(() => 'Robert')(undefined)) // => undefined
  })
})
describe('readOnly', () => {
  it('query composes with other accessors', () => {
    expect(comp(userProps('id'), readOnly()).query(bob)).toEqual([1])
    expect(comp(readOnly<User>(), userProps('id')).query(bob)).toEqual([1])
  })
  it('mod is a noop', () => {
    expect(readOnly<number>().mod((a) => a + 1)(2)).toBe(2)
  })
  it('mod is still noop when composed with other accessors', () => {
    expect(comp(userProps('id'), readOnly()).mod((a) => a + 1)(bob)).toEqual(bob)
    expect(comp(readOnly<User>(), userProps('id'), unit<number>()).mod((a) => a + 1)(bob)).toEqual(bob)
  })
})

describe('before', () => {
  it('gets items prior to index', () => {
    expect(before(3).query([0, 1, 2, 3, 4, 5])).toEqual([0, 1, 2])
    expect(before(0).query([0, 1, 2, 3, 4, 5])).toEqual([])
  })
  it('modify items prior to index', () => {
    const binc = (a: number): number => a + 2
    expect(before<number>(3).mod(binc)([0, 1, 2, 3, 4, 5])).toEqual([2, 3, 4, 3, 4, 5])
    expect(before<number>(0).mod(binc)([0, 1, 2, 3, 4, 5])).toEqual([0, 1, 2, 3, 4, 5])
  })
})

describe('after', () => {
  it('gets items prior to index', () => {
    expect(after(3).query([0, 1, 2, 3, 4, 5])).toEqual([4, 5])
    expect(after(5).query([0, 1, 2, 3, 4, 5])).toEqual([])
  })
  it('modify items prior to index', () => {
    const binc = (a: number): number => a + 2
    expect(after<number>(3).mod(binc)([0, 1, 2, 3, 4, 5])).toEqual([0, 1, 2, 3, 6, 7])
    expect(after<number>(5).mod(binc)([0, 1, 2, 3, 4, 5])).toEqual([0, 1, 2, 3, 4, 5])
  })
})

describe('sub', () => {
  interface SubUser {
    name: string
    connections: number[]
  }
  it('query a subset of the keys of an object', () => {
    expect(sub<SubUser, User>(['name', 'connections']).query(bob)).toEqual([{name: 'bob', connections: [1, 2]}])
  })
  it('modifies only a subset of an object', () => {
    expect(
      sub<SubUser, User>(['name', 'connections']).mod((s) => ({
        ...s,
        name: 'Robert'
      }))(bob)
    ).toEqual({name: 'Robert', connections: [1, 2], id: 1})
  })
})

describe('viewed', () => {
  type Coord = [number, number]
  interface Point {
    x: number
    y: number
  }

  const asPoint = viewed(
    ([x, y]: Coord): Point => ({x, y}),
    ({x, y}: Point): Coord => [x, y]
  )

  const coords: Coord[] = [
    [1, 2],
    [3, 4]
  ]
  it('allows querying into viewed structure', () => {
    expect(Acc<Coord[]>().all().focus(asPoint).query(coords)).toEqual([
      {x: 1, y: 2},
      {x: 3, y: 4}
    ])
  })
  it('allows drilled querying into viewed structure', () => {
    expect(Acc<Coord[]>().all().focus(asPoint).prop('x').query(coords)).toEqual([1, 3])
  })
  it('allows modding into viewed structure', () => {
    expect(
      Acc<Coord[]>()
        .all()
        .focus(asPoint)
        .prop('x')
        .mod((a) => a + 1)(coords)
    ).toEqual([
      [2, 2],
      [4, 4]
    ])
  })
})

describe('Acc', () => {
  describe('can create from accessor', () => {
    it('queries prop', () => {
      const a = Acc(prop<User>()('connections')).at(0)
      expect(a.get(bob)).toEqual(1)
    })
  })
  describe('prop', () => {
    it('queries prop', () => {
      const a = Acc<User>().prop('name')
      expect(a.query(bob)).toEqual([bob.name])
    })
  })
  describe('focus', () => {
    it('queries accessor', () => {
      const a = Acc<Friend>()
      expect(a.focus(comp(friendProps('user'), userProps('id'))).query(myFriendBob)).toEqual([1])
    })
  })
  const CoolFriends = Acc<Friends>()
    .prop('friends')
    .focus(filter((x: Friend) => x.user?.cool ?? false))

  const myFriends: Friends = {
    friends: [myFriendBob, myFriendShari, myFriendMark]
  }
  describe('get', () => {
    it('extracts value', () => {
      const a = Acc<Friend>().prop('user').prop('id')
      expect(a.get(myFriendBob)).toEqual(1)
    })
    it('returns first of a set for traversals', () => {
      expect(CoolFriends.prop('user').prop('name').get(myFriends)).toBe('Mark')
    })
    it('returns undefined when accessor fails', () => {
      expect(CoolFriends.get(baz)).toBe(undefined)
    })
  })
  describe('at', () => {
    it('queries at index', () => {
      const a = Acc<User>().prop('connections').at(1)
      expect(a.query(bob)).toEqual([bob.connections[1]])
    })
    it('mod works at index', () => {
      const a = Acc<User>().prop('connections').at(1)
      const inc = (a: number): number => a + 1
      expect(a.mod(inc)(bob).connections[1]).toEqual(bob.connections[1] + 1)
    })
  })
  describe('get all my cool friends', () => {
    it('works', () => {
      expect(CoolFriends.prop('user').prop('id').query(myFriends)).toEqual([2])
    })
  })
  describe('make all my friends cool', () => {
    it('works', () => {
      const cooledFriends = Acc<Friends>().prop('friends').all().prop('user').prop('cool').set(true)(myFriends)
      expect(CoolFriends.prop('user').prop('id').query(cooledFriends)).toEqual([1, 0, 2])
    })
  })

  describe('Acc.optional', () => {
    const complexChain = Acc<User>().prop('complex').optional().prop('value')
    it('query empty on optional chain', () => {
      expect(complexChain.query(bob)).toEqual([])
      expect(complexChain.get(bob)).toEqual(undefined)
    })
    it('query the value if present', () => {
      expect(complexChain.query({...bob, complex: {value: true}})).toEqual([true])
    })
    it('mod is noop over missing', () => {
      expect(complexChain.mod((value) => !value)(bob)).toEqual(bob)
      expect(complexChain.set(false)(bob)).toEqual(bob)
    })
    it('mod is works if present', () => {
      expect(complexChain.mod((value) => !value)({...bob, complex: {value: true}})).toEqual({
        ...bob,
        complex: {value: false}
      })
      expect(complexChain.set(false)({...bob, complex: {value: true}})).toEqual({
        ...bob,
        complex: {value: false}
      })
    })
  })
})
