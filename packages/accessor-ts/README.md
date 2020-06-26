# accessor-ts

Accessor-ts is a library for doing immutable updates and querying on nested data structures in a way that is composable and powerful. This is similar to lens and traversal libraries like partial.lenses, monacle-ts, and shades. This library aims to allow easy typed composition of optics without users having to know what optics even are.

## Accessors

Accessors are the core of this library and have the type:

```ts
// S is the type of the data structure that will be operated on, A is the type of some value(s) within
export interface Accessor<S, A> {
  // get an array of result(s) from the data structure
  query(struct: S): A[];
  // modify item(s) within the data structure using the passed function
  mod(fn: (x: A) => A): (struct: S) => S;
}
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

## Weaknesses

- Documentation is incomplete
- More useful functions should be added
- Unit testing is WIP.
- This is just a prototype at this point and isn't used in production anywhere.
- This library does not allow you to change the type of interfaces via `set` or `mod`. This doesn't come up often, however.
- Since `query` returns an array of results, users must be careful about the array being empty.
- Performance hasn't of this library hasn't been evaluated or optimized yet.

## Comparisons to other libries

- shades: Shades' usage is more terse, and doesn't require bind the types of it's optics to interfaces. Shades' types are harder to understand and leverage, especially since its source isn't in TypeScript. Accessor-ts only has one type so users don't have to understand the differences between Lenses, Isomorphisms, and Traversals. Accessor-ts doesn't have a massive generated type file that is impossible to read and understand.
- monacle-ts: Accessor-ts' usage is simpler as there is only one composition operator. monacle-ts has way more concepts to learn and use. monacle-ts has dependencies on fp-ts which is difficult to learn and understand. monacle-ts is more expressive, mature, and powerful however.
