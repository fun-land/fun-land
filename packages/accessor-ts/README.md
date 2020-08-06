# accessor-ts

Accessor-ts is a library for doing immutable updates and querying on nested data structures in a way that is composable and powerful. This is similar to lens and traversal libraries like [partial.lenses](https://github.com/calmm-js/partial.lenses), [monacle-ts](https://github.com/gcanti/monocle-ts), and [shades](https://github.com/jamesmcnamara/shades). This library aims to allow easy typed composition of optics without the bewildering functional programming jargon that usually comes with them

## Installation

```bash
  npm install -S accessor-ts
```

## Examples

```
import { prop, index, filter, set, all, comp } from "accessor-ts";
```

Simple property query

```ts
prop<{ a: number }>()("a").query({ a: 1 });
```

While you can inline an interface for your Accessors you probably want to define your interfaces separately and then create your accessors to match.

```ts
// Sample interface
interface User {
  name: string;
  id: number;
  cool?: boolean;
  connections: number[];
}

// Sample User
const bob: User = { name: "bob", id: 1, connections: [1, 2] };
```

Partially applied accessors can be stored, bound to the interface's type

```ts
const userProps = prop<User>();
```

`set` an accessor to immutably modify its target

```ts
set(userProps("id"))(3)(bob); // => { name: "bob", id: 3, connections: [1, 2] }
```

Trying to pass an invalid key to our accessor will be caught by TypeScript

```ts
userProps("invalid"); // `Argument of type '"invalid"' is not assignable to parameter of type '"id" | "name" | "cool" | "connections"'.ts(2345)`
```

You can query for optional fields

```ts
userProps("cool").query(bob); // => [undefined]
```

Accessors are composable so that you can extract or modify nested data structures.

```ts
interface Friend {
  user: User;
}

const friendProps = prop<Friend>();
const myFriendBob: Friend = { user: bob };

comp(friendProps("user"), userProps("id")).query(myFriendBob); // => 1
```

This is the same as `myFriendBob.user.id`.

The composed accessors are accessors themselves and can be stored and reused

```ts
const friendName = comp(friendProps("user"), userProps("name"));
set(friendName)("Robert")(myFriendBob); // => {user: {name: "Robert", id: 1, connections: [1, 2]}}
```

We can use Accessor.mod to run a function on the targeted value

```ts
comp(userProp("id")).mod(a => a + 1)(bob); // => { name: "bob", id: 2, connections: [1, 2] }
```

`index` can be used to focus a specific element of an array

```ts
comp(friendProps("user"), userProps("connections"), index(1)).query(
  myFriendBob
); // => [1]
```

`all()` can be used to target all items within a nested array

```ts
comp(friendProps("user"), userProps("connections"), all()).query(myFriendBob); // => [1, 2]
```

`all` gets much more interesting when we have Arrays within Arrays

```ts
interface Friends {
  friends: Friend[];
}

const shari: User = { name: "Shari", id: 0, connections: [3, 4] };

const myFriendShari: Friend = { user: shari };

const baz: Friends = { friends: [myFriendBob, myFriendShari] };
const makeAllFriendsCool = set(
  comp(
    prop<Friends>()("friends"),
    all(),
    friendProps("user"),
    userProps("cool")
  )
)(true);

makeAllFriendsCool(baz); // => Sets "cool" to true for all the users within
```

`filter` can be used to reduce the scope of an accessor to items which pass a test function. This doesn't remove items from the data structure but just changes what you get from queries or modify.

```ts
const isOdd = (a: number): boolean => a % 2 === 1;

// accessor chain as reusable value
const oddConnectionsOfFriends = comp(
  prop<Friends>()("friends"),
  all(),
  friendProps("user"),
  userProps("connections"),
  filter(isOdd)
);

oddConnectionsOfFriends.query(baz) // => [1, 3]

set(oddConnectionsOfFriends)(NaN)(baz)); /* =>
  {friends: [
    {user: {name: "bob", id: 1, connections: [NaN, 2]}},
    {user: {name: "Shari", id: 0, connections: [NaN, 4]}}
  ]} */
```

## API

## Accessors

Accessors are the core of this library and have the interface:

```ts
// S is the type of the data structure that will be operated on, A is the type of some value(s) within
export interface Accessor<S, A> {
  // get an array of result(s) from the data structure
  query(struct: S): A[];
  // modify item(s) within the data structure using the passed function
  mod(fn: (x: A) => A): (struct: S) => S;
}
```
Since accessor-ts only provides Accessors for arrays and objects you may want to create your own if you use other data structures like `Set`, `Map` or immutable.js

### prop 
```ts
: <Obj>() => <K extends keyof Obj>(k: K) => Accessor<Obj, Obj[K]>;
```

Create Accessor that points to a property of an object

Example:
```ts
prop<Person>()('name').query(bob) // => ['bob']
```


### index
```ts
: <A>(i: number) => Accessor<A[], A>;
```
Create Accessor that points to an index of an array

Example:
```ts
index(1).query([1, 2, 3]) // => [2]
```
### set
```ts
: <S, A>(acc: Accessor<S, A>) => (x: A) => (s: S) => S
```
Immutably assign using an Accessor

Example:
```ts
set(prop<Person>()('name'))('Robert')(bob) // => {name: 'Robert', ...}
```

### comp
```ts
: <A, B, C>(acc1: Accessor<A, B>, acc2: Accessor<B, C>) => Accessor<A, C>
```
Compose 2 or more Accessors (overloaded up to 8)

Examples:
```ts
comp(prop<Person>()('address'), prop<Address>()('city')).query(bob) // => ['Seattle']
```

### all
```ts
: <A>() => Accessor<A[], A>
```
Create Accessor focused on all items in an array. `query` unwraps them, `mod` changes each item.

Examples:
```ts
const makeAllFriendsCool = (user: Person) => set(comp(prop<Person>()('friends'), all<Person>(), prop<Person>()('isCool'))(true).query(user)
// BTW you can make functions point-free if you like:
const getFriends = comp(prop<Person>()('friends'), all<Person>()).query
// is the same as
const getFriends = (user: Person) => comp(prop<Person>()('friends'), all<Person>()).query(user)
```

### filter
```ts
: <A>(pred: (x: A) => boolean) => Accessor<A[], A>
```
Create Accessor that targets items in an array that match the passed predicate. `query` returns the matched items, `mod` modifies matched items.

Example:
```ts
const getCoolFriends = (user: Person) => comp(prop<Person>()('friends'), filter<Person>(friend => friend.isCool)).query(user);
```

### before
```ts
: <A>(i: number) => Accessor<A[], A>
```
Create Accessor that targets items in an array before the passed index

Example:
```ts
const getFirstTenFriends = comp(prop<Person>()('friends'), before(10)).query
```

### after
```ts
: <A>(i: number) => Accessor<A[], A>
```
Create Accessor that targets items in an array after the passed index

Example:
```ts
const getMoreFriends = comp(prop<Person>()('friends'), after(9)).query
```

### unit
```ts
: <A>(): Accessor<A, A>
```
No-op Accessor  
Makes Accessors a monoid in conjunction with `comp`. You'll probably only need this if you're writing really abstract code.


Example:
```ts
comp(prop<Person>()('name'), unit<String>()).query(bob) // => ['bob']
```

## Weaknesses
- More useful functions should be added
- This is a prototype and isn't used in production anywhere.
- Since `query` returns an array of results, users must be careful about the array being empty.
- Performance of this library hasn't been evaluated or optimized yet.

## Comparisons to other libries

- [shades](https://github.com/jamesmcnamara/shades): Shades' usage is more terse, and doesn't require binding the types of its optics to interfaces. Shades' types are harder to understand and leverage, especially since its source isn't in TypeScript. Accessor-ts only has one type so users don't have to understand the differences between Lenses, Isomorphisms, and Traversals. Shades has a massive generated type file that is impossible to grok and slows down the TS compiler on medium to large projects (in my experience).
- [monacle-ts](https://github.com/gcanti/monocle-ts): Accessor-ts' usage is simpler as there is only one composition operator. monacle-ts has way more concepts to learn and use. monacle-ts has dependencies on fp-ts which is difficult to learn and leverage. monacle-ts is more expressive, mature, and powerful.
