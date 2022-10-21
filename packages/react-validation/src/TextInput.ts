import type {Validator} from '@fun-land/validation'

export interface TextInputState {
  value: string
  errorMessage: string
}

/**
 * Helper to create a TextInputState instance
 * @param value initial value
 * @returns TextInputState
 */
export const initTextInputState = (value: string): TextInputState => ({
  value,
  errorMessage: ''
})

/**
 * create a Validator to work with text inputs and text areas
 * @param testFunction predicate run on the current value
 * @param errorTemplate error message or a function that takes the value and returns the error message
 * @returns Validator
 */
export const textInputValidator = (
  testFunction: (value: string) => boolean,
  errorTemplate: string | ((value: string) => string)
): Validator<TextInputState> => ({
  isValid: ({errorMessage}): boolean => errorMessage === '',
  validate: (state): TextInputState => ({
    ...state,
    errorMessage: testFunction(state.value)
      ? typeof errorTemplate === 'string'
        ? errorTemplate
        : errorTemplate(state.value)
      : ''
  })
})
