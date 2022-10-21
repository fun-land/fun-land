import {Acc} from '@fun-land/accessor'
import {Validator, focus, every} from './validation'

interface InputState {
  value: string
  errorMessage: string // "" when there's no error
}

const inputValidator = (predicate: (value: string) => boolean, errorMessage: string): Validator<InputState> => ({
  isValid: (s): boolean => s.errorMessage.length === 0,
  validate: (s): InputState => ({...s, errorMessage: predicate(s.value) ? '' : errorMessage})
})

const nameValidator = inputValidator((value) => value.length > 0, 'Name is required')

const TOSValidator: Validator<CheckboxState> = {
  isValid: (s): boolean => s.errorMessage.length === 0,
  validate: (s): CheckboxState => ({
    ...s,
    errorMessage: s.checked ? '' : 'You must construct additional pylons'
  })
}

interface CheckboxState {
  checked: boolean
  errorMessage: string
}

// form state that composes the state of child components
interface UserFormState {
  name: InputState
  acceptedTOS: CheckboxState
}

// Foci that operates on the UserFormState interface
const stateFoci = Acc<UserFormState>()

const invalidState: UserFormState = {
  acceptedTOS: {checked: false, errorMessage: ''},
  name: {value: '', errorMessage: ''}
}

const focusedNameValidator = focus(stateFoci.prop('name'), nameValidator)
const focusedTOSValidator = focus(stateFoci.prop('acceptedTOS'), TOSValidator)

describe('focus', () => {
  it('validates by accessor', () => {
    expect(focusedNameValidator.validate(invalidState).name).toHaveProperty('errorMessage', 'Name is required')
    const goodState = stateFoci.prop('name').prop('value').set('name')(invalidState)
    expect(focusedNameValidator.validate(goodState).name).toHaveProperty('errorMessage', '')
  })
  it('isValid by accessor', () => {
    expect(focusedNameValidator.isValid(invalidState)).toBe(true) // valid if not validated
    expect(focusedTOSValidator.isValid(invalidState)).toBe(true) // valid if not validated
    const validatedState = focusedNameValidator.validate(invalidState)
    expect(focusedNameValidator.isValid(validatedState)).toBe(false)
  })
})

describe('every', () => {
  const stateValidator = every(focusedNameValidator, focusedTOSValidator)
  it('composes validators', () => {
    expect(stateValidator.isValid(invalidState)).toBe(true)
    const validatedState = stateValidator.validate(invalidState)
    expect(validatedState.name).toHaveProperty('errorMessage', 'Name is required')
    expect(validatedState.acceptedTOS).toHaveProperty('errorMessage', 'You must construct additional pylons')
    expect(stateValidator.isValid(validatedState)).toBe(false)
  })
})
