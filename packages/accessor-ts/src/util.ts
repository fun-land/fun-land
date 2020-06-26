/**
 * @module util Internal utilities
 */

/**
 * compose two functions right to left
 * @sig (b -> c) -> (a -> b) -> a -> c
 */
export const B = <B, C>(g: (y: B) => C) => <A>(f: (x: A) => B) => (x: A): C =>
  g(f(x));

/** Constant combinator */
export const K = <A>(a: A) => (_b: unknown): A => a;

/** Yay monads! */
export const flatmap = <T, U>(f: (x: T) => U[]) => (xs: T[]): U[] => {
  let out: U[] = [];
  for (const x of xs) {
    out = out.concat(f(x));
  }
  return out;
};
