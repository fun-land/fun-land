// Examples
//=========
import { prop, index, filter, set, all, comp } from "./accessor";

/**
 * Accessor is a library for doing immutable updates and querying on nested data structures in a way that is composable and powerful.
 */

console.log(
  "simple property query",
  prop<{ a: number }>()("a").query({ a: 1 })
);

// Sample interface
interface User {
  name: string;
  id: number;
  cool?: boolean;
  connections: number[];
}

// Sample User
const bob: User = { name: "bob", id: 1, connections: [1, 2] };

// We can store accessors which are bound to the interface by type
const userProps = prop<User>();

console.log("shallow update", set(userProps("id"))(3)(bob));

// trying to pass an invalid key to our accessor will be caught by TypeScript (uncomment next line)
// userProps("invalid");

console.log("query of optional field", userProps("cool").query(bob));

// Nested interfaces. Now we're getting to the good part
interface Friend {
  user: User;
}

// Can partially apply to create a "group" of accessors bound to a specific interface
const friendProps = prop<Friend>();

// We can compose accessors to point to things within other things
const friendName = comp(friendProps("user"), userProps("name"));

const shari: User = { name: "Shari", id: 0, connections: [3, 4] };

const myFriendBob: Friend = { user: bob };
const myFriendShari: Friend = { user: shari };
console.log("set", set(friendName)("Robert")(myFriendBob));

console.log(
  "composed query",
  comp(friendProps("user"), userProps("id")).query(myFriendBob)
);

// We can use Accessor.mod to run a function on the targeted value
console.log(
  "composed mod",
  comp(friendProps("user"), prop<User>()("id")).mod(a => a + 1)(myFriendBob)
);

// if we want to collect all elements targeted by an accessor we can add all() to the composition
console.log(
  "composed query with traversal",
  comp(friendProps("user"), userProps("connections"), all()).query(myFriendBob)
);

// `index` can be used to focus a specific element of an array
console.log(
  "composed query with index",
  comp(friendProps("user"), userProps("connections"), index(1)).query(
    myFriendBob
  )
);

interface Friends {
  friends: Friend[];
}

const baz: Friends = { friends: [myFriendBob, myFriendShari] };

const isOdd = (a: number): boolean => a % 2 === 1;

// accessor chain as reusable value
const oddConnectionsOfFriends = comp(
  prop<Friends>()("friends"),
  all(),
  friendProps("user"),
  userProps("connections"),
  filter(isOdd)
);

console.log("query with filter", oddConnectionsOfFriends.query(baz));

console.log("deep filtered assignment", set(oddConnectionsOfFriends)(NaN)(baz));
