import {validateAndAct} from './index'
import {initTextInputState, textInputValidator} from './TextInput'
import {funState} from '@fun-land/fun-state'

describe('initTextInputState', () => {
  it('creates initial state with empty error message', () => {
    const state = initTextInputState('hello')
    expect(state).toEqual({
      value: 'hello',
      errorMessage: ''
    })
  })

  it('creates state with empty string value', () => {
    const state = initTextInputState('')
    expect(state).toEqual({
      value: '',
      errorMessage: ''
    })
  })
})

describe('textInputValidator', () => {
  describe('with string error template', () => {
    const validator = textInputValidator(
      (value) => value.length < 3,
      'Value must be at least 3 characters'
    )

    it('validates and returns error when test fails', () => {
      const state = initTextInputState('ab')
      const result = validator.validate(state)
      expect(result.errorMessage).toBe('Value must be at least 3 characters')
      expect(validator.isValid(result)).toBe(false)
    })

    it('validates and clears error when test passes', () => {
      const state = initTextInputState('abc')
      const result = validator.validate(state)
      expect(result.errorMessage).toBe('')
      expect(validator.isValid(result)).toBe(true)
    })

    it('preserves value during validation', () => {
      const state = initTextInputState('test')
      const result = validator.validate(state)
      expect(result.value).toBe('test')
    })
  })

  describe('with function error template', () => {
    const validator = textInputValidator(
      (value) => value.length < 3,
      (value) => `"${value}" is too short (minimum 3 characters)`
    )

    it('generates error message using function', () => {
      const state = initTextInputState('ab')
      const result = validator.validate(state)
      expect(result.errorMessage).toBe('"ab" is too short (minimum 3 characters)')
      expect(validator.isValid(result)).toBe(false)
    })

    it('clears error when test passes', () => {
      const state = initTextInputState('abc')
      const result = validator.validate(state)
      expect(result.errorMessage).toBe('')
      expect(validator.isValid(result)).toBe(true)
    })
  })

  describe('isValid', () => {
    const validator = textInputValidator(
      (value) => value.length < 3,
      'Too short'
    )

    it('returns false when errorMessage is present', () => {
      const state = {value: 'ab', errorMessage: 'Too short'}
      expect(validator.isValid(state)).toBe(false)
    })

    it('returns true when errorMessage is empty', () => {
      const state = {value: 'abc', errorMessage: ''}
      expect(validator.isValid(state)).toBe(true)
    })
  })
})

describe('validateAndAct', () => {
  const validator = textInputValidator(
    (value) => value.trim() === '',
    'Value cannot be empty'
  )

  it('calls action when state is valid', () => {
    const state = funState(initTextInputState('hello'))
    const action = jest.fn()

    validateAndAct(state, validator, action)

    expect(action).toHaveBeenCalledWith({value: 'hello', errorMessage: ''})
  })

  it('does not call action when state is invalid', () => {
    const state = funState(initTextInputState(''))
    const action = jest.fn()

    validateAndAct(state, validator, action)

    expect(action).not.toHaveBeenCalled()
  })

  it('updates state with validation result', () => {
    const state = funState(initTextInputState(''))

    validateAndAct(state, validator, () => {})

    expect(state.get()).toEqual({
      value: '',
      errorMessage: 'Value cannot be empty'
    })
  })

  it('clears error message when state becomes valid', () => {
    const state = funState({value: '', errorMessage: 'Value cannot be empty'})
    const action = jest.fn()

    // First validation should fail
    expect(state.get().errorMessage).toBe('Value cannot be empty')

    // Update to valid value
    state.set({value: 'hello', errorMessage: 'Value cannot be empty'})

    // Validate again
    validateAndAct(state, validator, action)

    expect(state.get()).toEqual({value: 'hello', errorMessage: ''})
    expect(action).toHaveBeenCalled()
  })

  it('works with complex validators', () => {
    const emailValidator = textInputValidator(
      (value) => !value.includes('@'),
      'Invalid email address'
    )
    const state = funState(initTextInputState('user@example.com'))
    const action = jest.fn()

    validateAndAct(state, emailValidator, action)

    expect(action).toHaveBeenCalledWith({
      value: 'user@example.com',
      errorMessage: ''
    })
  })
})
