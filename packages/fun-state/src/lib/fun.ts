/**
 * This file contains functional helpers that make the examples more terse.
 * You can use these or include your own such as lodash-fp or ramda.
 */

/** Constant combinator */
export const K = <A>(a: A) => (_b: unknown): A => a

/** identity function */
export const I = <A>(a: A) => a

/* Flip combinator */
export const C = <A, B, C>(f: (a: A) => (b: B) => C) => (b: B) => (a: A): C => f(a)(b)

/**
 * compose two functions left-to-right
 * @sig (a -> b) -> (b -> c) -> a -> c
 */
export const P2 = <A, B, C>(f: (x: A) => B, g: (y: B) => C) => (x: A): C => g(f(x))

/**
 * compose three functions left-to-right
 * @sig (a -> b) -> (b -> c) -> (c -> d) -> a -> d
 * */
export const P3 = <A, B, C, D>(f: (x: A) => B, g: (y: B) => C, h: (y: C) => D) => (x: A): D => h(g(f(x)))

/**
 * compose four functions left-to-right
 * @sig (a -> b) -> (b -> c) -> (c -> d) -> (d -> e) -> a -> e
 */
export const P4 = <A, B, C, D, E>(f: (x: A) => B, g: (y: B) => C, h: (y: C) => D, i: (y: D) => E) => (x: A): E =>
  i(h(g(f(x))))

export const not = (a: boolean) => !a

/** just like Array.prototype.every but as a function and curried */
export const every = <T>(f: (x: T) => boolean) => (xs: T[]) => xs.every(f)

/** removes item at passed index from array */
export const removeAt = (index: number) => <T>(xs: T[]) => xs.filter((_, i) => index !== i)
