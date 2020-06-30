import { prop, index, filter, set, all, comp, unit } from "./accessor";

interface User {
  name: string;
  id: number;
  cool?: boolean;
  connections: number[];
}
const bob: User = Object.freeze({ name: "bob", id: 1, connections: [1, 2] });

// We can store accessors which are bound to the interface by type
const userProps = prop<User>();

describe("prop", () => {
  it("simple property query", () => {
    expect(prop<{ a: number }>()("a").query({ a: 1 })).toEqual([1]);
  });
  it("handles optional fields", () => {
    expect(userProps("cool").query(bob)).toEqual([undefined]);
  });
  describe("set", () => {
    it("sets immutably", () => {
      expect(set(userProps("id"))(3)(bob).id).toBe(3);
      expect(bob.id).toBe(1);
    });
  });
});
// Nested interfaces. Now we're getting to the good part
interface Friend {
  user: User;
}

// Can partially apply to create a "group" of accessors bound to a specific interface
const friendProps = prop<Friend>();

// We can compose accessors to point to things within other things

const shari: User = { name: "Shari", id: 0, connections: [3, 4] };

const myFriendBob: Friend = { user: bob };
const myFriendShari: Friend = { user: shari };

describe("comp", () => {
  const friendName = comp(friendProps("user"), userProps("name"));
  it("composes 2 accessors", () => {
    expect(
      comp(friendProps("user"), userProps("id")).query(myFriendBob)
    ).toEqual([1]);
    expect(set(friendName)("Robert")(myFriendBob).user.name).toBe("Robert");
  });
  it("handles mod correctly", () => {
    expect(
      comp(friendProps("user"), prop<User>()("id")).mod(a => a + 1)(myFriendBob)
        .user.id
    ).toBe(2);
  });
});

interface Friends {
  friends: Friend[];
}

const baz: Friends = { friends: [myFriendBob, myFriendShari] };

const isOdd = (a: number): boolean => a % 2 === 1;

describe("all", () => {
  it("handles shallow query", () => {
    expect(comp(userProps("connections"), all()).query(bob)).toEqual([1, 2]);
  });
  const allConnections = comp(
    prop<Friends>()("friends"),
    all(),
    friendProps("user"),
    userProps("connections")
  );
  const oddConnectionsOfFriends = comp(allConnections, filter(isOdd));

  it("handles deep query", () => {
    expect(oddConnectionsOfFriends.query(baz)).toEqual([1, 3]);
  });
  it("handles deep assignment", () => {
    expect(
      allConnections.query(set(oddConnectionsOfFriends)(NaN)(baz))
    ).toEqual([[NaN, 2], [NaN, 4]]);
  });
});

describe("index", () => {
  it("returns queried item", () => {
    expect(
      comp(friendProps("user"), userProps("connections"), index(1)).query(
        myFriendBob
      )
    ).toEqual([2]);
  });
});

describe("unit", () => {
  it("composes with other accessors", () => {
    expect(comp(userProps("id"), unit()).query(bob)).toEqual([1]);
    expect(comp(unit<User>(), userProps("id")).query(bob)).toEqual([1]);
  });
});
