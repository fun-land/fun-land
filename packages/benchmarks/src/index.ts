/**
 * Benchmark runner for fun-land packages
 */
import Benchmark from "benchmark";
import { Acc } from "@fun-land/accessor";
import { derive, funState, mapRead } from "@fun-land/fun-state";

const suite = new Benchmark.Suite("fun-land");

type User = {
  id: number;
  name: string;
  age: number;
  tags: string[];
};

const baseUser: User = {
  id: 1,
  name: "Alice",
  age: 30,
  tags: ["a", "b", "c"],
};

const makeUsers = (count: number): User[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    name: `User ${i}`,
    age: i % 100,
    tags: ["a", "b", "c"],
  }));

const userAcc = Acc<User>();
const nameAcc = userAcc.prop("name");
const ageAcc = userAcc.prop("age");
const tagsAcc = userAcc.prop("tags");
const tag0Acc = tagsAcc.at(0);

const users1000 = makeUsers(1000);
const users10k = makeUsers(10_000);

// FunState fixtures
const userState = funState<User>({ ...baseUser });
const ageState = userState.prop("age");
const nameState = userState.prop("name");
const derivedLabel = derive(
  nameState,
  ageState,
  (name, age) => `${name}-${age}`
);
const mappedAge = mapRead(ageState, (age) => age + 1);
const mappedLabel = mapRead(derivedLabel, (label) => label.toUpperCase());

const listState = funState<User[]>(users1000);
const listItemState = listState.focus(Acc<User[]>().at(500));
const listItemName = listItemState.prop("name");

suite
  // Accessor benchmarks
  .add("accessor.get:name", () => {
    nameAcc.get(baseUser);
  })
  .add("accessor.mod:age+1", () => {
    ageAcc.mod((n) => n + 1)(baseUser);
  })
  .add("accessor.query:tags", () => {
    tagsAcc.query(baseUser);
  })
  .add("accessor.query:tag0", () => {
    tag0Acc.query(baseUser);
  })
  .add("accessor.query:users10k", () => {
    Acc<User[]>().all().query(users10k);
  })

  // FunState benchmarks
  .add("fun-state.get", () => {
    userState.get();
  })
  .add("fun-state.mod", () => {
    userState.mod((u) => ({ ...u, age: u.age + 1 }));
  })
  .add("fun-state.prop.get", () => {
    ageState.get();
  })
  .add("fun-state.derive.get", () => {
    derivedLabel.get();
  })
  .add("fun-state.mapRead.get", () => {
    mappedAge.get();
  })
  .add("fun-state.mapRead.chain.get", () => {
    mappedLabel.get();
  })
  .add("fun-state.focus.item.get", () => {
    listItemState.get();
  })
  .add("fun-state.focus.item.prop.get", () => {
    listItemName.get();
  })
  .add("fun-state.focus.item.mod", () => {
    listItemName.mod((name) => `${name}!`);
  })
  .add("fun-state.list.mod", () => {
    listState.mod((xs) => xs.slice(1));
  })

  // Collection baseline (for context)
  .add("baseline.map:users", () => {
    makeUsers(100).map((u) => u.name);
  })
  .add("baseline.filter:users", () => {
    makeUsers(100).filter((u) => u.age % 2 === 0);
  })
  .on("cycle", (event: Benchmark.Event) => {
    console.log(String(event.target));
  })
  .on("complete", () => {
    console.log("Fastest is " + suite.filter("fastest").map("name"));
  })
  .run({ async: true });
