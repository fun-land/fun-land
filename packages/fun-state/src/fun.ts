/**
 * This file contains functional helpers that make the examples more terse.
 * You can use these or include your own such as lodash-fp or ramda.
 */

/**
 * compose two functions left-to-right
 * @sig (a -> b) -> (b -> c) -> a -> c
 */
export const pipe = <A, B, C>(f: (x: A) => B, g: (y: B) => C) => (x: A): C => g(f(x))

/** removes item at passed index from array */
export const removeAt = (index: number) => <T>(xs: T[]): T[] => xs.filter((_, i) => index !== i)

/** prepend an item to an array */
export const prepend = <A>(x: A) => (xs: A[]): A[] => [x, ...xs]

/** append an item to an array */
export const append = <A>(x: A) => (xs: A[]): A[] => [...xs, x]

/** return the first item in an array */
export const head = <A>(xs: A[]): A | undefined => xs[0]

/** return the rest of an array */
export const tail = <A>(xs: A[]): A[] => xs.slice(0)

/** negate the arg */
export const not = (a: boolean): boolean => !a
