/** @module accessor This is the actual "optics" library */
import { B, K, flatmap } from "./util";

export interface Accessor<S, A> {
  query(struct: S): A[];
  mod(f: (x: A) => A): (struct: S) => S;
}

/**
 * Create Accessor that points to a property of an object
 * Extra lambda is to avoid specifying the key in both type and term space.
 */
export const prop = <Obj>() => <K extends keyof Obj>(
  k: K
): Accessor<Obj, Obj[K]> => ({
  query: (obj): [Obj[K]] => [obj[k]],
  mod: transform => (obj): Obj => ({ ...obj, [k]: transform(obj[k]) })
});

/** Create Accessor that points to an index of an array */
export const index = <A>(i: number): Accessor<A[], A> => ({
  query: (s): A[] => [s[i]],
  mod: f => (xs): A[] => xs.map((x, j) => (i === j ? f(x) : x))
});

/** Compose two Accessors */
// I'm so ammused that composed Accessors is so close to function composition.
// Doubly ammused that the fly in the ointment is the Monad operator for our query response data type.
const _comp = <A, B, C>(
  acc1: Accessor<A, B>,
  acc2: Accessor<B, C>
): Accessor<A, C> => ({
  query: B(flatmap<B, C>(acc2.query))(acc1.query),
  mod: B(acc1.mod)(acc2.mod)
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
export function comp(...accs: Accessor<any, any>[]): Accessor<any, any> {
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
  mod: transform => (xs): A[] => xs.map(transform)
});

/**
 * Accessor that targets items in an array that match the passed predicate
 */
export const filter = <A>(pred: (x: A) => boolean): Accessor<A[], A> => ({
  query: (xs): A[] => xs.filter(pred),
  mod: transform => (s): A[] => s.map(x => (pred(x) ? transform(x) : x))
});

/**
 * Accessor that targets items before the passed index
 */
export const before = <A>(i: number): Accessor<A[], A> => ({
  query: (xs): A[] => xs.filter((_, j) => j < i),
  mod: transform => (s): A[] => s.map((x, j) => (i < j ? transform(x) : x))
});

/**
 * Accessor that targets items before the passed index
 */
export const after = <A>(i: number): Accessor<A[], A> => ({
  query: (xs): A[] => xs.filter((_, j) => j > i),
  mod: transform => (s): A[] => s.map((x, j) => (i > j ? transform(x) : x))
});

/**
 * Immutably assign to an Accessor
 */
export const set = <S, A>(acc: Accessor<S, A>): ((x: A) => (s: S) => S) =>
  B(acc.mod)(K);

/**
 * No-op Accessor
 * Makes Accessors a monoid in conjunction with `comp`
 */
export const unit = <A>(): Accessor<A, A> => ({
  query: (xs): A[] => [xs],
  mod: transform => (xs): A => xs
});
