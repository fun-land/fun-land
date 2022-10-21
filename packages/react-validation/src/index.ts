import type {Validator} from '@fun-land/validation'
import type {FunState} from '@fun-land/fun-state'
export * from './TextInput'

/**
 * run validator on state an do an action if everything is good
 * @param state to validate
 * @param validator what to use to validate
 * @param action what to do when state is valid
 * @returns nuffin
 */
export const validateAndAct = <State>(
  state: FunState<State>,
  validator: Validator<State>,
  action: (state: State) => unknown
): void =>
  state.mod((s) => {
    const nextState = validator.validate(s)
    if (validator.isValid(nextState)) {
      action(nextState)
    }
    return nextState
  })
