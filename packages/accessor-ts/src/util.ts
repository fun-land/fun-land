/**
 * @module util Functional utilities
 */

/**
 * @deprecated You should switch to `flow` as left-to-right type inferrance works better in TypeScript
 */
export const B = <B, C>(g: (y: B) => C) => <A>(f: (x: A) => B) => (x: A): C =>
  g(f(x));

/**
 * Compose two functions left to right
 * @sig (a -> b, b -> c) -> a -> c
 */
export const flow = <A, B, C>(f: (x: A) => B, g: (y: B) => C) => (x: A): C =>
  g(f(x));

/** Constant combinator */
export const K = <A>(a: A) => (_b: unknown): A => a;

/** Apply an array returning function to each item in an array and return an unnested array */
// Yay monads!
export const flatmap = <T, U>(f: (x: T) => U[]) => (xs: T[]): U[] => {
  let out: U[] = [];
  for (const x of xs) {
    out = out.concat(f(x));
  }
  return out;
};

/** Returns an empty array */
export const empty = <A>(): A[] => [];

/** Removes item at passed index from array */
export const removeAt = (index: number) => <T>(xs: T[]): T[] =>
  xs.filter((_, i) => index !== i);

/** Prepend an item to an array */
export const prepend = <A>(x: A) => (xs: A[]): A[] => [x, ...xs];

/** Append an item to an array */
export const append = <A>(x: A) => (xs: A[]): A[] => [...xs, x];

/** Return the first item in an array */
export const head = <A>(xs: A[]): A | undefined =>
  xs.length > 0 ? xs[0] : undefined;

/** Return a copy of the array excluding the first item */
export const tail = <A>(xs: A[]): A[] => xs.slice(1);

/** Logically negate the arg */
export const not = (a: boolean): boolean => !a;

/** Merge a partial object into the full one. Useful for updating a subset of properties of an object.  */
export const mergeInto = <State>(part: Partial<State>) => (
  s: State
): State => ({ ...s, ...part });
