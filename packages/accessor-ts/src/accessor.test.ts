import {
  prop,
  index,
  filter,
  set,
  all,
  comp,
  unit,
  before,
  after,
} from "./accessor";

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
      comp(friendProps("user"), prop<User>()("id")).mod((a) => a + 1)(
        myFriendBob
      ).user.id
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
    ).toEqual([
      [NaN, 2],
      [NaN, 4],
    ]);
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
  it("mods targeted item", () => {
    expect(
      comp(userProps("connections"), index(1)).mod((a) => a + 1)(bob)
    ).toEqual({ name: "bob", id: 1, connections: [1, 3] });
  });
});

describe("unit", () => {
  it("query composes with other accessors", () => {
    expect(comp(userProps("id"), unit()).query(bob)).toEqual([1]);
    expect(comp(unit<User>(), userProps("id")).query(bob)).toEqual([1]);
  });
  it("mod composes with other accessors", () => {
    expect(comp(userProps("id"), unit()).mod((a) => a + 1)(bob)).toEqual(bob);
    expect(comp(unit<User>(), userProps("id")).mod((a) => a + 1)(bob)).toEqual(
      bob
    );
  });
});

describe("before", () => {
  it("gets items prior to index", () => {
    expect(before(3).query([0, 1, 2, 3, 4, 5])).toEqual([0, 1, 2]);
    expect(before(0).query([0, 1, 2, 3, 4, 5])).toEqual([]);
  });
  it("modify items prior to index", () => {
    const binc = (a: number): number => a + 2;
    expect(before<number>(3).mod(binc)([0, 1, 2, 3, 4, 5])).toEqual([
      2,
      3,
      4,
      3,
      4,
      5,
    ]);
    expect(before<number>(0).mod(binc)([0, 1, 2, 3, 4, 5])).toEqual([
      0,
      1,
      2,
      3,
      4,
      5,
    ]);
  });
});

describe("after", () => {
  it("gets items prior to index", () => {
    expect(after(3).query([0, 1, 2, 3, 4, 5])).toEqual([4, 5]);
    expect(after(5).query([0, 1, 2, 3, 4, 5])).toEqual([]);
  });
  it("modify items prior to index", () => {
    const binc = (a: number): number => a + 2;
    expect(after<number>(3).mod(binc)([0, 1, 2, 3, 4, 5])).toEqual([
      0,
      1,
      2,
      3,
      6,
      7,
    ]);
    expect(after<number>(5).mod(binc)([0, 1, 2, 3, 4, 5])).toEqual([
      0,
      1,
      2,
      3,
      4,
      5,
    ]);
  });
});
