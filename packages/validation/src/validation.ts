import type {Accessor} from '@fun-land/accessor'

export interface Validator<S> {
  validate: (state: S) => S
  isValid: (state: S) => boolean
}

/**
 * focus a validator using an accessor
 */
export const focus = <S, T>(foci: Accessor<S, T>, validator: Validator<T>): Validator<S> => ({
  validate: foci.mod(validator.validate),
  isValid: (s: S): boolean => foci.query(s).every(validator.isValid)
})

/**
 * Compose multiple validators together. Returned validator is valid if all of the passed validators are
 */
export const every = <S>(...validators: Array<Validator<S>>): Validator<S> => ({
  isValid: (s: S): boolean => validators.every(({isValid}) => isValid(s)),
  validate: (s: S): S => validators.reduce((_s, {validate}) => validate(_s), s)
})
