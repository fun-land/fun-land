# `validation`

A mini-library for validating nested data structures using `@fun-land/accessor`.

It's a way of validating arbitrary state in small and well as complex cases. Validation step is separated from the checking of the valid state so you can choose when to show error messages based on the user experience you're targeting. For example, you may want to display error messages on field blur or when forms are submitted and don't want to have to hack libraries with opinions on how your validation should work.

Why?

- You have complex validation logic that spans multiple inputs
- You're validating things that aren't forms but still need to give user feedback
- You're using FunState or Accessors and want something that's designed to work with them

This library is ui-framework agnostic so batteries aren't included, see `@fun-land/react-validation` for some helpers to make working with forms in react nicer. Example below uses it.

Usage:

```tsx
import * as V from '@fun-land/validation'
import {TextInputState, textInputValidator, validateAndAct} from '@fun-land/react-validation'
import type { FunState } from '@fun-land/fun-state'
import useFunState, {bindValue, bindChecked} from '@fun-land/use-fun-state'
import * as A from '@fun-land/accessor'


// Name.tsx
// =========

// creating a validator for the name field in the form below
export const nameFieldValidator = textInputValidator(value => value.length > 0, 'Name is required')

// This component used in the form below. Note that it's only focused on its own state and can be kept unaware of where it's being used
export const NameField = ({state: FunState<TextInputState>}): React.ReactElement => {
  const {value, errorMessage} = state.get();
  const onBlur = () => state.mod(nameValidator.validate)
  return (
    <div>
      <label>Name</label>
      <input {...bindValue(state.prop('value'))} onBlur={onBlur} />
      {errorMessage && `Error: ${errorMessage}`}
    </div>
  )
}

// TOSCheckbox.tsx
// ================

export interface CheckboxState {
  checked: boolean;
  errorMessage: string;
}

// validator for checkbox that requires it to be checked
export const TOSValidator: V.Validator<CheckboxState> = {
  isValid: s => s.checked,
  validate: s => ({
    ...s,
    errorMessage: s.checked ? '' : 'You must construct additional pylons'
  })
}

export const TOSCheckbox = ({state: FunState<CheckboxState>}) => {
  const {errorMessage} = state.get();
  return (
    <label>
      <input type="checkbox" {...bindChecked(state.prop('checked'))} />
      I have read and accept the terms of service
      {errorMessage && <div>Error: {errorMessage}</div>}
    </label>
  )
}

// UserForm.tsx
// ============

// form state that composes the state of child components
interface UserFormState {
  name: InputState
  acceptedTOS: CheckboxState
}

// Foci that operates on the UserFormState interface
const stateFoci = A.Acc<UserFormState>()

// every allows us to combine multiple validators together and run them on the same state
const userFormValidator = V.every(
  // focus allows us to focus a validator using an Accessor or Foci
  V.focus(stateFoci.prop('name'), nameValidator),
  V.focus(stateFoci.prop('acceptedTOS'), TOSValidator)
);
// This allows us to compose the validators of child components

export const UserForm = ({state}: {state: FunState<UserFormState>}): React.ReactElement => {
  const onSubmit = (e) => {
    e.preventDefault()
    validateAndAct(state, userFormValidator, postForm)
  }
  return (
    <form onSubmit={onSubmit}>
      <NameField state={state.prop('name')} />
      <TOSCheckbox state={state.prop('acceptedTOS')} />
    </div>
  )
}
```

## API

## Validator

```ts
interface Validator<S> {
  validate: (state: S) => S
  isValid: (state: S) => boolean
}
```

Shape of a validator object.

## focus

```ts
;<S, T>(foci: Accessor<S, T>, validator: Validator<T>) => Validator<S>
```

Focus a validator using an accessor.

Example:

```ts
V.focus(stateFoci.prop('name'), nameValidator)
```

## every

```ts
;<S>(...validators: Array<Validator<S>>) => Validator<S>
```

Compose multiple validators together. Returned validator is valid if all of the passed validators are.

Example:

```ts
const allCapsValidator = inputValidator((value) => value.toUpperCase() === value, 'Name is not loud enough')
const loudNameValidator = V.every(nameValidator, allCapsValidator)

loudNameValidator.validate({value: 'bob', errorMessage: ''})
// ==> {value: 'bob', errorMessage: 'Name is not loud enough'}
```
