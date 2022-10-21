# `validation`

A mini-library for validating nested data structures using `@fun-land/accessor`.

Why? It's a way of validating arbitrary state in small and well as complex cases. Validation step is separated from the checking of the valid state so you can choose when to show error messages based on the user experience you're targeting. For example, you may want to display error messages on field blur or when forms are submitted. Or maybe you have the concept of validating state but you don't really have forms. This mini-library will work for all these cases. That said, this doesn't provide form bindings for specific libraries like react so batteries aren't included. The batteries are pretty cheap, tho.

## API

## Validator

```ts
interface Validator<S> {
  validate: (state: S) => S
  isValid: (state: S) => boolean
}
```

Shape of a validator object.

Example:

```tsx
import * as V from '@fun-land/validation'
import type { FunState } from '@fun-land/fun-state'
// Some state definition for the component we want to validate. input(type=text) in this case
interface InputState {
  value: string
  errorMessage: string // "" when there's no error
}

// helper to create validators for InputState
const inputValidator = (
  predicate: (value: string) => boolean,
  errorMessage: string
): V.Validator<InputState> => ({
  isValid: (s) => s.errorMessage.length === 0,
  validate: (s) =>({...s, errorMessage: predicate(s.value) ? '' : errorMessage}),
})

// creating a validator for the name field in the form below
const nameValidator = inputValidator(value => value.length > 0, 'Name is required')

// usage with @fun-land/use-fun-state
const NameForm = ({state}: {state: FunState<InputState>}): React.ReactElement => {
  const {errorMessage, value} = state.get()
  const onSubmit = (e) => {
    e.preventDefault();
    // checking if the field is in its validated state
    if(nameValidator.isValid(nextState)){
      postForm(nextState)
    }
  };
  const onChange = ({currentTarget: {value}}) => state.prop('value').set(value)
  const onBlur = () => state.mod(nameValidator.validate)
  return (
    <form onSubmit={onSubmit}>
      <label>Name</label>
      <input
        type="text"
        onChange={onChange}
        // Validating the field on blur. You can do this on submit just as easilly.
        onBlur={onBlur}
        value={state.prop('value').get()} />
      {errorMessage && `Error: ${errorMessage}`}
    </div>
  )
}
```

## focus

```ts
<S, T>(foci: Accessor<S, T>, validator: Validator<T>) => Validator<S>
```

Focus a validator using an accessor.

Example:

```tsx
// Expanding the example from above
import * as A from '@fun-land/accessor'

interface CheckboxState {
  checked: boolean;
  errorMessage: string;
}

// form state that composes the state of child components
interface UserFormState {
  name: InputState
  acceptedTOS: CheckboxState
}

// validator for checkbox that requires it to be checked
const TOSValidator: V.Validator<CheckboxState> = {
  isValid: s => s.checked,
  validate: s => ({
    ...s,
    errorMessage: s.checked ? '' : 'You must construct additional pylons'
  })
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

// We refactor the Name field out to isolate its complexity. Note that it's only focused on it's own state and can be kept unaware of where it's being used
const NameField = ({state: FunState<InputState>}): React.ReactElement => {
  const {value, errorMessage} = state.get();
  const onChange = ({currentTarget: {value}}) => state.prop('value').set(value)
  const onBlur = () => state.mod(nameValidator.validate)
  return (
    <div>
      <label>Name</label>
      <input
        type="text"
        onChange={onChange}
        onBlur={onBlur}
        value={value} />
        {errorMessage && `Error: ${errorMessage}`}
    </div>
  )
}

const TOSCheckbox = ({state: FunState<CheckboxState>}) => {
  const {checked, errorMessage} = state.get();
  return (
    <label>
      <input
        type="checkbox"
        checked={checked}
        onChange={({currentTarget: {checked}}) => state.prop('checked').set(checked)}
      />
      I have read and accept the terms of service
      {errorMessage && <div>Error: {errorMessage}</div>}
    </label>
  )
}

const UserForm = ({state}: {state: FunState<UserFormState>}): React.ReactElement => {
  const onSubmit = (e) => {
    e.preventDefault()
    state.mod(s => {
      // validate all the fields
      const nextState = userFormValidator.validate(s)
      // checking if the whole form is in its valid state
      if(userFormValidator.isValid(nextState)){
        postForm(nextState)
      }
      // returning the next state so any error messages show/hide
      return nextState
    })
  }
  return (
    <form onSubmit={onSubmit}>
      <NameField state={state.prop('name')} />
      <TOSCheckbox state={state.prop('acceptedTOS')} />
    </div>
  )
}
```

## every

```ts
<S>(...validators: Array<Validator<S>>) => Validator<S>
```

Compose multiple validators together. Returned validator is valid if all of the passed validators are.

Example:

```ts
const allCapsValidator = inputValidator((value) => value.toUpperCase() === value, 'Name is not loud enough')
const loudNameValidator = V.every(nameValidator, allCapsValidator)

loudNameValidator.validate({value: 'bob', errorMessage: ''})
// ==> {value: 'bob', errorMessage: 'Name is not loud enough'}
```
