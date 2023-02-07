# accessor

Accessor is a library for doing immutable updates and querying on nested data structures in a way that is composable and powerful. This is similar to lens and traversal libraries like [partial.lenses](https://github.com/calmm-js/partial.lenses), [monacle-ts](https://github.com/gcanti/monocle-ts), and [shades](https://github.com/jamesmcnamara/shades). This library aims to allow easy typed composition of optics without the bewildering functional programming jargon that usually comes with them.

## Installation

```bash
  npm install -S @fun-land/accessor
```

## Prerequisites

- This library and its examples uses [currying](https://blog.bitsrc.io/understanding-currying-in-javascript-ceb2188c339), arrow functions, and generics extensively so it'll help if you're familiar with those concepts.
- TypeScript - While usage without TypeScript will work, you lose a lot of the benefit of this library without types. If you're looking for an optics library for use without TS check out [partial.lenses](https://github.com/calmm-js/partial.lenses).

## Examples

```
import { prop, index, filter, set, all, comp } from "@fun-land/accessor";
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

comp(friendProps("user"), userProps("id")).query(myFriendBob); // => [1]
```

This is the same as `myFriendBob.user.id`.

The composed accessors are accessors themselves and can be stored and reused

```ts
const friendName = comp(friendProps("user"), userProps("name"));
set(friendName)("Robert")(myFriendBob); // => {user: {name: "Robert", id: 1, connections: [1, 2]}}
```

We can use Accessor.mod to run a function on the targeted value

```ts
comp(userProp("id")).mod((a) => a + 1)(bob); // => { name: "bob", id: 2, connections: [1, 2] }
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
: <Obj>() => <Key extends keyof Obj>(k: Key) => Accessor<Obj, Obj[Key]>;
```

Create Accessor that points to a property of an object

Example:

```ts
prop<User>()("name").query(bob); // => ['bob']
```

### index

```ts
: <A>(i: number) => Accessor<A[], A>;
```

Create Accessor that points to an index of an array

Example:

```ts
index(1).query([1, 2, 3]); // => [2]
```

### set

```ts
: <S, A>(acc: Accessor<S, A>) => (x: A) => (s: S) => S
```

Immutably assign using an Accessor

Example:

```ts
set(prop<User>()("name"))("Robert")(bob); // => {name: 'Robert', ...}
```

### get

```ts
: <S, A>(acc: Accessor<S, A>) => (s: S): A | undefined =>
```

Extract the first value of an accessor. When query would return `[]` this returns undefined.

Example:

```ts
type Foo = { a: number; items: boolean[] };
const foo = { a: 1, items: [] };

get(prop<Foo>()("a"))(foo); // -> 1

get(index(0))([]); // -> undefined
```

### comp

```ts
: <A, B, C>(acc1: Accessor<A, B>, acc2: Accessor<B, C>) => Accessor<A, C>
```

Compose 2 or more Accessors (overloaded up to 8)

Examples:

```ts
comp(prop<User>()("address"), prop<Address>()("city")).query(bob); // => ['Seattle']
```

### all

```ts
: <A>() => Accessor<A[], A>
```

Create Accessor focused on all items in an array. `query` unwraps them, `mod` changes each item.

Examples:

```ts
const makeAllFriendsCool = (user: User) => set(comp(prop<User>()('friends'), all<User>(), prop<User>()('isCool'))(true).query(user)
// BTW you can make functions point-free if you like:
const getFriends = comp(prop<User>()('friends'), all<User>()).query
// is the same as
const getFriends = (user: User) => comp(prop<User>()('friends'), all<User>()).query(user)
```

### filter

```ts
: <A>(pred: (x: A) => boolean) => Accessor<A[], A>
```

Create Accessor that targets items in an array that match the passed predicate. `query` returns the matched items, `mod` modifies matched items.

Example:

```ts
const getCoolFriends = (user: User) =>
  comp(
    prop<User>()("friends"),
    filter<User>((friend) => friend.isCool)
  ).query(user);
```

### viewed

```ts
: <X, Y>(toView: (x: X) => Y, fromView: (y: Y) => X) => Accessor<X, Y>
```
Create an accessor that let's you operate on the data as if it's a different encoding. I.e an isomorphism.

Example: 

```ts
type Coord = [number, number]
type Point = {x: number; y: number}

const coordToPoint: Accessor<Coord, Point> = viewed(
  ([x, y]: Coord): Point => ({x,y}),
  ({x, y}: Point): Coord => [x, y]
);

const coords: Coord[] = [[1,2], [3,4]];
const getPoints = Acc<Coord[]>().all().focus(asPoint).prop("x").query
getPoints(coords) // => [{ x: 1, y: 2 }, { x: 3, y: 4 },]
```


### before

```ts
: <A>(i: number) => Accessor<A[], A>
```

Create Accessor that targets items in an array before the passed index

Example:

```ts
const getFirstTenFriends = comp(prop<User>()("friends"), before(10)).query;
```

### after

```ts
: <A>(i: number) => Accessor<A[], A>
```

Create Accessor that targets items in an array after the passed index

Example:

```ts
const getMoreFriends = comp(prop<User>()("friends"), after(9)).query;
```

### sub

```ts
: <SSub, S extends SSub = never>(keys: Array<keyof SSub>) => Accessor<S, SSub>
```

Create an accessor that targets a subset of properties of an object.

Example:

```ts
interface Entity {
  name: string;
  id: number;
}
const entityAcc = sub<Entity, User>(["name", "id"]);

entityAcc.query(bob); // => [{name: 'bob', id: 1}]
```

### unit

```ts
: <A>(): Accessor<A, A>
```

Accessor that doesn't drill down.

Example:

```ts
comp(prop<User>()("name"), unit<string>()).query(bob); // => ['bob']
```

### readOnly

```ts
: <A>(): Accessor<A, A>
```

Like `unit` but mod does nothing

Example:

```ts
readOnly<number>().query(1); // -> 1

readOnly<number>().mod((a) => a + 1); // -> 2

type Foo = { a: number };
const f = (isHappy: boolean): number | Foo =>
  (isHappy ? prop<Foo>()("a") : unit).query({ a: 1 });
f(true); // -> 1
f(false); // -> {a: 1}
```

## Utilities

Bonus functions which are not directly related to accessors but are useful when using them or doing functional programming in-general.

### flow

```ts
: <A, B, C>(f: (x: A) => B, g: (y: B) => C) => (x: A) => C;
```

Compose two functions left to right.

### K

```ts
<A>(a: A) =>
  (_b: unknown) =>
    A;
```

Constant combinator. Returns a function that ignores its argument and returns the original one.

### empty

```ts
: <A>() => A[]
```

Returns an empty array.

### flatmap

```ts
: <T, U>(f: (x: T) => U[]) => (xs: T[]) => U[]
```

Apply an array returning function to each item in an array and return an unnested array.

### removeAt

```ts
: (index: number) => <T>(xs: T[]) => T[]
```

Removes item at passed index from array.

### prepend

```ts
: <A>(x: A) => (xs: A[]): A[]
```

Prepend an item to an array.

### append

```ts
: <A>(x: A) => (xs: A[]): A[]
```

Append an item to the end of an array

### head

```ts
: <A>(xs: A[]) => A | undefined;
```

Return the first item in an array

### tail

```ts
: <A>(xs: A[]) => A[]
```

Return a copy of the array excluding the first item.

### not

```ts
: (a: boolean) => boolean;
```

Logically negate the argument.

### mergeInto

```ts
: <State>(part: Partial<State>) => (s: State) => State;
```

Merge a partial object into the full one. Useful for updating a subset of properties of an object.

## Fluent API (new)

### Acc

```ts
<S>() => Foci<S, S>;
<S, A>(acc: Accessor<S, A>) => Foci<S, A>;
```

Create a Foci either from nothing or an accessor. This allows you to build up a Foci by chaining.

```ts
const bobsName = Acc<User>().prop("name").get();
const bobsFirstConnection = Acc(prop<User>()("connections")).at(0).get();
const makeMyFriendsCool = Acc<Friends>()
  .prop("friends")
  .all()
  .prop("user")
  .prop("cool")
  .set(true)(allMyFriends);
```

### Foci&lt;S,A&gt;.mod

```ts
(f: (x: A) => A) => (struct: S) => S;
```

Transform value(s) focused with passed function.

### Foci&lt;S,A&gt;.set

```ts
(a: A) => (struct: S) => S;
```

Replace value(s) focused.

### Foci&lt;S,A&gt;.get

```ts
(struct: S) => A | undefined;
```

Extract first value focused.

### Foci&lt;S,A&gt;.query

```ts
(struct: S) => A[]
```

Extract all values focused.

### Foci&lt;S,A&gt;.prop

```ts
<K extends keyof A>(k: K) => Foci<S, A[K]>
```

Focus child property.

### Foci&lt;S,A&gt;.focus

```ts
<B>(acc: Accessor<A, B>) => Foci<S, B>
```

Focus using passed accessor.

### Foci&lt;S,A&gt;.at

```ts
<B extends ArrayItemType<A>>(idx: number) => Foci<S, B>
```

If `A` is an array this focuses item in the array at passed index.

### Foci&lt;S,A&gt;.all

```ts
<B extends ArrayItemType<A>>() => Foci<S, B>
```

If `A` is an array this focuses all items in the array.

## Weaknesses

- Performance of this library hasn't been evaluated or optimized yet.

## Comparisons to other libries

- [shades](https://github.com/jamesmcnamara/shades): Shades' usage is more terse, and doesn't require binding the types of its optics to interfaces. Shades' types are harder to understand and leverage, especially since its source isn't in TypeScript. Accessor-ts only has one type so users don't have to understand the differences between Lenses, Isomorphisms, and Traversals. Shades has a massive generated type file that is impossible to grok and slows down the TS compiler on medium to large projects (in my experience).
- [monacle-ts](https://github.com/gcanti/monocle-ts): Accessor-ts' usage is simpler as there is only one composition operator. monacle-ts has way more concepts to learn and use. monacle-ts has dependencies on fp-ts which is difficult to learn and leverage. monacle-ts is more expressive, mature, and powerful.
