/** @module accessor This is the actual "optics" library */
import { flow, K, flatmap } from "./util";

export interface Accessor<S, A> {
  query: (struct: S) => A[];
  mod: (f: (x: A) => A) => (struct: S) => S;
}

/**
 * Create Accessor that points to a property of an object
 * Extra lambda is to avoid specifying the key in both type and term space.
 */
export const prop =
  <Obj>() =>
  <K extends keyof Obj>(k: K): Accessor<Obj, Obj[K]> => ({
    query: (obj): [Obj[K]] => [obj[k]],
    mod:
      (transform) =>
      (obj): Obj => ({ ...obj, [k]: transform(obj[k]) }),
  });

/** Create Accessor that points to an index of an array */
export const index = <A>(i: number): Accessor<A[], A> => ({
  query: (s): A[] => [s[i]],
  mod:
    (f) =>
    (xs): A[] =>
      xs.map((x, j) => (i === j ? f(x) : x)),
});

/** Compose two Accessors */
// I'm so ammused that composed Accessors is so close to function composition.
// Doubly ammused that the fly in the ointment is the Monad operator for our query response data type.
const _comp = <A, B, C>(
  acc1: Accessor<A, B>,
  acc2: Accessor<B, C>
): Accessor<A, C> => ({
  query: flow(acc1.query, flatmap<B, C>(acc2.query)),
  mod: flow(acc2.mod, acc1.mod),
});

/**
 * Composes all passed Accessors.
 * Max of 8 cuz reasons. If you need more than then just compose twice.
 */
export function comp<A, B, C>(
  acc1: Accessor<A, B>,
  acc2: Accessor<B, C>
): Accessor<A, C>;
export function comp<A, B, C, D>(
  acc1: Accessor<A, B>,
  acc2: Accessor<B, C>,
  acc3: Accessor<C, D>
): Accessor<A, D>;
export function comp<A, B, C, D, E>(
  acc1: Accessor<A, B>,
  acc2: Accessor<B, C>,
  acc3: Accessor<C, D>,
  acc4: Accessor<D, E>
): Accessor<A, E>;
export function comp<A, B, C, D, E, F>(
  acc1: Accessor<A, B>,
  acc2: Accessor<B, C>,
  acc3: Accessor<C, D>,
  acc4: Accessor<D, E>,
  acc5: Accessor<E, F>
): Accessor<A, F>;
export function comp<A, B, C, D, E, F, G>(
  acc1: Accessor<A, B>,
  acc2: Accessor<B, C>,
  acc3: Accessor<C, D>,
  acc4: Accessor<D, E>,
  acc5: Accessor<E, F>,
  acc6: Accessor<F, G>
): Accessor<A, G>;
export function comp<A, B, C, D, E, F, G, H>(
  acc1: Accessor<A, B>,
  acc2: Accessor<B, C>,
  acc3: Accessor<C, D>,
  acc4: Accessor<D, E>,
  acc5: Accessor<E, F>,
  acc6: Accessor<F, G>,
  acc7: Accessor<G, H>
): Accessor<A, H>;
export function comp(...accs: Array<Accessor<any, any>>): Accessor<any, any> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return accs.reduce(_comp);
}

// TODO make a variate function so we don't need 4 different functions to compose Accessors

/**
 * Focus all items in a child array
 *  query unwraps them
 *  mod changes each item
 */
export const all = <A>(): Accessor<A[], A> => ({
  query: (xs): A[] => xs,
  mod:
    (transform) =>
    (xs): A[] =>
      xs.map(transform),
});

/**
 * Accessor that targets items in an array that match the passed predicate
 */
export const filter = <A>(pred: (x: A) => boolean): Accessor<A[], A> => ({
  query: (xs): A[] => xs.filter(pred),
  mod:
    (transform) =>
    (s): A[] =>
      s.map((x) => (pred(x) ? transform(x) : x)),
});

/**
 * Accessor that targets items before the passed index
 */
export const before = <A>(i: number): Accessor<A[], A> => ({
  query: (xs): A[] => xs.filter((_, j) => j < i),
  mod:
    (transform) =>
    (s): A[] =>
      s.map((x, j) => (j < i ? transform(x) : x)),
});

/**
 * Accessor that targets items before the passed index
 */
export const after = <A>(i: number): Accessor<A[], A> => ({
  query: (xs): A[] => xs.filter((_, j) => j > i),
  mod:
    (transform) =>
    (s): A[] =>
      s.map((x, j) => (j > i ? transform(x) : x)),
});

/**
 * Immutably assign to an Accessor
 */
export const set = <S, A>(acc: Accessor<S, A>): ((x: A) => (s: S) => S) =>
  flow(K, acc.mod);

/**
 * Extract the first value of an accessor. When query would return `[]` this returns undefined.
 * @example
 *   type Foo = {a: number; items: boolean[]};
 *   get(prop<Foo>()('a'))({a: 1, items: []}) // -> 1
 * @example
 *   get(comp(prop<Foo>()('items'), index(0)))({a: 1, items: []}) // -> undefined
 */
export const get =
  <S, A>(acc: Accessor<S, A>) =>
  (s: S): A | undefined =>
    acc.query(s)?.[0];

/**
 * Accessor that doesn't drill down.
 * @example
 *   readOnly<number>().query(1) // -> [1]
 * @example
 *   readOnly<number>().mod(a => a + 1) // -> 2
 * @example
 *   type Foo = {a: number}
 *   const f = (isHappy: boolean): number | Foo =>  (isHappy ? prop<Foo>()('a') : unit).query({a: 1})
 *   f(true) // -> 1
 *   f(false) // -> {a: 1}
 */
export const unit = <A>(): Accessor<A, A> => ({
  query: (x): A[] => [x],
  mod:
    (transform) =>
    (x): A =>
      transform(x),
});

/**
 * Like `unit` but mod does nothing
 * @example
 *   readOnly<number>().query(1) // -> [1]
 *   readOnly<number>().mod(a => a + 1)(1) // -> 1
 */
export const readOnly = <A>(): Accessor<A, A> => ({
  query: (x): A[] => [x],
  mod:
    (_transform) =>
    (x): A =>
      x,
});

const _pick = <Obj, Keys extends keyof Obj>(
  keys: Keys[],
  obj: Obj
): Pick<Obj, Keys> => {
  const out: Partial<Obj> = {};
  keys.forEach((k) => {
    out[k] = obj[k];
  });
  return out as Pick<Obj, Keys>;
};

/** Create an accessor that targets a subset of properties of an object. */
export const sub = <SSub, S extends SSub = never>(
  keys: Array<keyof SSub>
): Accessor<S, SSub> => ({
  query: (obj): SSub[] => [_pick(keys, obj)],
  mod:
    (f) =>
    (obj: S): S => ({ ...obj, ...f(_pick(keys, obj)) }),
});

type ArrayItemType<T> = T extends Array<infer U> ? U : never;

interface Foci<S, A> {
  /** transform value(s) focused with passed function */
  mod: (f: (x: A) => A) => (struct: S) => S;
  /** replace value(s) focused */
  set: (a: A) => (struct: S) => S;
  /** extract first value focused */
  get: (struct: S) => A | undefined;
  /** extract all focused values */
  query: (struct: S) => A[];
  /** focus child property */
  prop: <K extends keyof A>(k: K) => Foci<S, A[K]>;
  /** focus using passed accessor */
  focus: <B>(acc: Accessor<A, B>) => Foci<S, B>;
  /** focus on passed array index */
  at: <B extends ArrayItemType<A>>(idx: number) => Foci<S, B>;
  /** focus all child array items */
  all: <B extends ArrayItemType<A>>() => Foci<S, B>;
}

export function Acc<S>(): Foci<S, S>;
export function Acc<S, A>(acc: Accessor<S, A>): Foci<S, A>;
export function Acc<S>(acc = unit<S>()): Foci<S, any> {
  return focusedAcc(acc);
}

const focusedAcc = <S, A>(acc: Accessor<S, A>): Foci<S, A> => ({
  query: (struct: S): A[] => acc.query(struct),
  get: (struct: S): A | undefined => acc.query(struct)[0] ?? undefined,
  mod: acc.mod,
  set: flow(K, acc.mod),
  focus: <B>(bcc: Accessor<A, B>): Foci<S, B> => focusedAcc(comp(acc, bcc)),
  prop<K extends keyof A>(k: K): Foci<S, A[K]> {
    return this.focus(prop<A>()(k));
  },
  at: <B extends ArrayItemType<A>>(idx: number): Foci<S, B> =>
    focusedAcc(comp(acc as unknown as Accessor<S, B[]>, index<B>(idx))),
  all: <B extends ArrayItemType<A>>(): Foci<S, B> =>
    focusedAcc(comp(acc as unknown as Accessor<S, B[]>, all<B>())),
});
