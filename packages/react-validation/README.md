<h1 align="center">@fun-land/react-validation</h1>

A set of helpers to make using `@fun-land/validation` with React pleasant.

## Usage

See [@fun-land/validation](https://github.com/fun-land/fun-land/tree/main/packages/validation#readme) for examples.

## API

## validateAndAct

```ts
<State>(
  state: FunState<State>,
  validator: Validator<State>,
  action: (state: State) => unknown
) => void
```

Run validator on state an do an action if everything is good.

Example:

```ts
validateAndAct(formState, formValidator, postForm)
```

## TextInputState

```ts
interface TextInputState {
  value: string
  errorMessage: string
}
```

Interface for `input[type=text]` and `textarea` element state.

## initTextInputState

```ts
;(value: string) => TextInputState
```

Helper to create a TextInputState instance

## textInputValidator

```ts
(
  testFunction: (value: string) => boolean,
  errorTemplate: string | ((value: string) => string)
) => Validator<TextInputState>
```

Creates a `Validator<TextInputState>` to work with text inputs and text areas.
