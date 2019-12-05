![Svelidation](https://svgshare.com/i/GUq.svg)

Easily customizable library for `validation` scenarios in `svelte` components

# Quick example
```js
import createSvelidation from 'svelidation';

// 1. create an instance
const { createForm, createEntry } = createSvelidation();

// 2. create a validation model
const [ errorsStore, valueStore, useInput ] = createEntry({
  type: 'string',
  min: 3,
  max: 15
});
```
```html
<!-- 3. use it in template  -->
<form use:createForm>
  <input type="text" use:useInput bind:value={$valueStore} />

  {#if $errorsStore.includes('min')}
    Login should be at least 3 symbols long
  {/if}

  {#if $errorsStore.includes('max')}
    Login should be not longer than 15 symbols
  {/if}

  <button type="submit">Submit</button>
</form>
```
Check more examples on the [demo page](http://yazonnile.github.io/svelidation/)

# install
`npm i -S svelidation`

# basic types/rules
Combination of type/rules are using in [here](#createEntryParams)
- `string` type
  - `{ type: 'string', min: 3 }`
  - `{ type: 'string', max: 3 }`
  - rules to check string length
- `email` type
  - `{ type: 'email' }`
- `number` type
  - `{ type: 'number', min: 3 }`
  - `{ type: 'number', max: 3 }`
  - rules to check number value
- `boolean` type
  - `{ type: 'boolean' }`
- `array` type
  - `{ type: 'array', min: 3 }`
  - `{ type: 'array', max: 3 }`
  - rules to check array length value
  - `{ type: 'array', includes: 3 }`
   - check array includes element

- global rules
  - `equal` - equality with value (in case of array it sort and stringify it), could take a function as equal value
  - `{ type: 'string', equal: 'my-custrom-string' }`
  - `{ type: 'string', equal: value => (value === myFunction()) }`
  - `match` - match textual value form by regExp
  - `{ type: 'number', match: '202\d' }`
  - `required` - check value exists
  - `{ type: 'email', required: true }`

# options
```js
// default values
createSvelidation({
  validateOnEvents: { change: true, input: false, blur: false },
  clearErrorsOnEvents: { reset: true, focus: false },
  listenInputEvents: 2,
  presence: 'optional',
  trim: false,
  includeAllEntries: false
});
```
- `validateOnEvents: { [key: string]: boolean }`
  - object of input events to validate input value
  - possible events: `change`, `input`, `blur`

- `clearErrorsOnEvents: { [key: string]: boolean }`
  - object of events to clear errors
  - possible events: `reset`, `focus`

- `listenInputEvents: number`
  - specific option for control input events
    - `0`: dont allow input events
    - `1`: allow input events always
    - `2`: allow input events after first validation run

- `presence: string`
  - Default inputs presence. If we set it to `required` - all inputs will be validated as required by default
  - This options equals `optional` by default, this means that all fields in validation are optional and will be validated in case of having value, or having another validation rules

- `trim: boolean`
  - allow validator trim textual values before check
  - *(!!!) it doesn't trim value itself, just for check purpose*

- `includeAllEntries: boolean`
  - By default validation works for entries that were assigned with inputs by `use` svelte directive. This option makes possible to validate ALL entries in validation


`validateOnEvents`, `clearErrorsOnEvents`, `presence` and `trim` behavior could be overrided by any input for itself ([check here](#createEntry))

# validation level API
```js
import createSvelidation from 'svelidation';
const {
  createEntry,
  createEntries,
  createForm,
  validateValueStore,
  validate,
  clearErrors,
} = createSvelidation();
```

### `createEntry`
Create validation entry
```js
const [ errorsStore, valueStore, inputFunctionForUse ] = createEntry(createEntryParams);
```

`errorsStore`, `valueStore` used for bind errors and value store in templates

`inputFunctionForUse` function for `use` svelte directive on input, to assign its events to validation process

#### createEntryParams
Check list of types/rules [here](#basic-typesrules)

```js
// createEntryParams
{
  type, // required
  value, // initial value, required for some types of fields

  // other rules, like min/max/required...

  trim, // works like trim option for createSvelidation function, but on input level
  required,
  optional // makes possible to override presence option of createSvelidation function
}
```


### `createEntries`
Additional way to create a few entries at the time
```js
const {
  first: [firstErrorsStore, firstValueStore, firstInput],
  second: [secondErrorsStore, secondValueStore, secondInput]
} = createEntries({
  first: {
    // createEntryParams
  },
  second: {
    // createEntryParams
  },
})
```
```js
const [
  [firstErrorsStore, firstValueStore, firstInput],
  [secondErrorsStore, secondValueStore, secondInput]
] = createEntries([
  {
    // createEntryParams
  }, {
    // createEntryParams
  },
])
```

### `createForm`

Function for form `use`

By default this function makes subscribe on submit/reset form events for validation/clearErrors
```html
<form use:createForm></form>
<!-- or -->
<form use:createForm={{ onSubmit, onFail, onSuccess }}></form>
```
As options in use function could be use an object with callbacks.

`onSubmit(submitEvent, errors[])` - every form submit attempt. `errors[]` - array of all errors store values

`onFail(errors[])` - on every failed validation (when `errors.length > 0`)

`onSuccess()` - when there aren't any errors

### `clearErrors`
Manually clear all errors stores
```js
clearErrors(includeNoFormElements = false);
```
Only argument same as in [validate](#validate)

### `validate`
Manually validate stores
```js
const allErrors = validate(includeNoFormElements = false);
```
Only argument makes possible to validate all created entries.

Without arguments it will validate only inputs assigned to nodes with `inputFunctionForUse` ([check here](#createEntry))

Return array of all errors store values

### `validateValueStore`
Manually validate value store
```js
const [ emailErrorsStore, emailValueStore ] = createEntry({ type: 'email' });
const errors = validateValueStore(emailValueStore);
```
Returns errors store value

# global level API
```js
import {
  addSpy,
  ensureRule,
  ensureType,
  resetType,
  resetRule,
  removeSpies
} from 'svelidation';
```
### `addSpy`
### `ensureRule`
### `ensureType`
### `resetType`
### `resetRule`
### `removeSpies`

# scripts
- `npm run build` - build demo and library files into `dist`
- `npm run dev` - run dev server from dist folder with demo page by default
- `npm run test` - run all tests on production version of build
- `npm run e2e` - e2e testing of lib file from `dist`
- `npm run e2e:dev` - dev server from `e2e/dist` folder with tests name in params
- `npm run unit` - unit testing of `spec.js` files in `lib`
- `npm run unit:dev` - dev server for unit testing

# TODO
- eslints
