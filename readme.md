![Svelidation](https://yazonnile.github.io/svelidation/logo.svg)

Easily customizable library for `validation` scenarios in `svelte` components.
Need to validate just a few simple inputs? Or need to build a huge form with dynamic steps? No problems. Svelidation was born for it!

![NPM](https://img.shields.io/npm/l/svelidation) ![npm](https://img.shields.io/npm/v/svelidation)

# Quick example
```js
import createSvelidation from 'svelidation';

// 1. create an instance
const { createForm, createEntry } = createSvelidation();

// 2. create a validation model
const [ errorsStore, valueStore, useInput ] = createEntry({
  type: 'string',
  required: true
});
```
```html
<!-- 3. use it in template  -->
<form use:createForm>
  <input type="text" use:useInput bind:value={$valueStore} />

  {#if $errorsStore.includes('required')}
    This field is required
  {/if}

  <button type="submit">Submit</button>
</form>
```
Check more examples on the [demo page](http://yazonnile.github.io/svelidation/)

# install
`npm i -S svelidation`

# basic types
Combination of type/rules is using in [here](#createEntryParams)
## `string`
check string length
  - `{ type: 'string', min: 3 }`
  - `{ type: 'string', max: 3 }`
  - `{ type: 'string', between: [4, 10] }`
## `email`
  - `{ type: 'email' }`
## `number`
check number value
  - `{ type: 'number', min: 3 }`
  - `{ type: 'number', max: 3 }`
  - `{ type: 'number', between: [4, 10] }`
## `boolean`
  - `{ type: 'boolean' }`
## `array`
check array length and specific element
  - `{ type: 'array', min: 3 }`
  - `{ type: 'array', max: 3 }`
  - `{ type: 'array', includes: 3 }`

# global rules
## `equal`
equality with value (in case of array it sorta and stringifies it), could take a function as equal value
  - `{ type: 'string', equal: 'my-custrom-string' }`
  - `{ type: 'string', equal: value => (value === myFunction()) }`
## `match`
match textual value form by regExp
  - `{ type: 'number', match: '202\d' }`
## `required`
check value exists
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
  includeAllEntries: false,
  useCustomErrorsStore: false
  warningsEnabled: true
  getValues: false
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

- `useCustomErrorsStore(errorsArray, entryParams): errorsStore`
  - optional method to make possible to use custom errorsStore structure. By default this is array of strings. This method can override default store with any you want
  - `errorsArray` - default array of errors strings
  - `entryParam` - ([check here](#createEntryParams))
  - check `CUSTOM ERRORS` example on [demo page](http://yazonnile.github.io/svelidation/)

- `warningsEnabled: boolean`
  - option that makes warnings in dev mode visible. `true` by default

- `getValues(entries): values`
  - optional method to build own values result
  - default `getValues` implementation returns `Map` structure `Map{ [entryParams.id || entryParams]: value }`
  - example#1 `{ type: 'string' }` `getValues` result will looks like this: `Map{ { type: 'string' }: '' }`
  - example#2 `{ type: 'string', id: 'login' }` `getValues` result will looks like this: `Map{ login: '' }`
  - `entries` - array of entries params and values
  - result of `getValues` will passed to onSuccess option for form ([check here](#createForm))
  - check two `get values` examples on the [demo page](http://yazonnile.github.io/svelidation/)

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
  getValues
} = createSvelidation();
```

### `createEntry`
Create validation entry
```js
const [ errorsStore, valueStore, inputFunctionForUse ] = createEntry(createEntryParams);
```

`errorsStore`, `valueStore` used for bind errors and value stores in templates. One more time. THIS IS SVELTE STORES. You might see something like `errors[]` below in this readme - this is just a array with strings

`inputFunctionForUse` function for `use` svelte directive on input, to assign its events to validation process

```html
<input use:inputFunctionForUse />
<!-- or -->
<input use:inputFunctionForUse={{ clearErrorsOnEvents, validateOnEvents }} />
```
This is the place where `clearErrorsOnEvents` and `validateOnEvents` options could be overrided for specific input

#### createEntryParams
Check list of types/rules [here](#basic-types)

```js
// createEntryParams
{
  type, // required
  value, // initial value, required for some types of fields
  id, // optional param for getValues method

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

This function makes subscribe on submit/reset form events for validation/clearErrors by default
```html
<form use:createForm></form>
<!-- or -->
<form use:createForm={{ onSubmit, onFail, onSuccess }}></form>
```
An object with callbacks could be used as param in `use` function

`onSubmit(submitEvent, errors[])` - every form submit attempt. `errors[]` - array of all errors store values. Not array of stores, but array of store errors.

`onFail(errors[])` - on every failed validation (when `errors.length > 0`)

`onSuccess(values)` - when there aren't any errors. Get `values` ([check here](#options)) as result

### `clearErrors`
Manually clear all errors stores
```js
clearErrors(includeNoFormElements = false);
```
Only argument same as in [validate](#validate)

### `validate: allValidationErrors[]`
Manually validate stores
```js
const allErrors = validate(includeNoFormElements = false);
```
Only argument makes possible to validate all created entries.

Without this params validation will check inputs assigned to nodes only (`inputFunctionForUse` ([check here](#createEntry)))

Return array of all errors store values

### `validateValueStore: errors[]`
Manually validate value store
```js
const [ emailErrorsStore, emailValueStore ] = createEntry({ type: 'email' });
const errors = validateValueStore(emailValueStore); // array of string, not errorsStores!!!
```
Returns errors store value

### `getValues: values`
[check here](#options)

# advanced API
```js
import {
  ensureRule,
  resetRule,
  ensureType,
  resetType,
  addSpy,
  removeSpies
} from 'svelidation';
```
### `ensureRule(ruleName: string, ruleFunction)`
  - `ruleFunction: (value, entryParams): boolean`
Allows to add your own global (will be available for any type) rules
```js
import createValidation, { ensureRule } from 'svelidation';
const { createEntry, validate } = createValidation();

const myRuleFunction = (value, entryParams) => {
  // entryParams === { type: 'string'... }
  // entryParams.myRule === 'my rule value...'
  return entryParams.type === 'string';
}

ensureRule('myRule', myRuleFunction);

const [ stringErrors, stringValue ] = createEntry({
  type: 'string',
  myRule: 'my rule value for string'
});

const [ numberErrors, numberValue ] = createEntry({
  type: 'number',
  myRule: 'my rule value for email'
});

console.log(validate(true)); // [{ number: ['myRule'] }]
```
### `resetRule(ruleName?: string)`
Remove custom rule. If calls without `ruleName` - it will remove all custom global rules
```js
import createValidation, { ensureRule, resetRule } from 'svelidation';
const { createEntry, validate } = createValidation();

ensureRule('myRule', (value, { myRule, type }) => {
  // myRule === 'my rule value...'
  return type === 'string';
});

const [ numberErrors, numberValue ] = createEntry({
  type: 'number',
  myRule: 'my rule value for email'
});

console.log(validate(true)); // [{ number: ['myRule'] }]
resetRule('myRule');
console.log(validate(true)); // [] - there in no rule like myRule, so no validation, no errors
```
### `ensureType(typeName: string, typeRules)`
  - `typeRules: { [key: string]: ruleFunction }`
    - `ruleFunction: (value, entryParams): boolean`

Extend existing/add new type to validator. In case of creating new type, there is one clause. `typeRules` has to have method named `type`. This is a basic and required method for every type and it calls everytime we validate type. And if it return `false` - current entry validation stops with `type` error
```js
import createValidation, { ensureType } from 'svelidation';
const { createEntry, validate, validateValueStore } = createValidation();

// extend existing type with custom rule
ensureType('string', {
  between5and10: (value) => {
    console.log('extended!');
    return value.length >= 5 && value.length <= 10;
  }
});

const [ stringErrors, stringValue ] = createEntry({
  type: 'string',
  between5and10: true,
  value: 'asdf'
});

console.log(validateValueStore(stringValue)); // ['between5and10']

// create new type with its own rules
ensureType('myNewType', {
  type: (value) => {
    return value === 'custom!!!';
  },
  anotherRule: (value, { anotherRule }) => {
    return false;
  },
  min: 'string.min' // yes, we can take some existing rules from another types
});

const [ myErrors, myValue ] = createEntry({
  type: 'myNewType',
  anotherRule: 'something',
  min: 10,
  value: 'custom!!!'
});

console.log(validateValueStore(myValue)); // ['anotherRule', 'min']
```
### `resetType(typeName?: string)`
Work same as `resetRule`, but on the type level

~~omg :) I hope noone will need to use methods below~~
### Ok, so what are you saying? Spies? O_o

Yes. Spies. Spy.

By design, this is a function to observe validation process and get into it.

Spy can observe types, global rules, specific rule of specific type. Spy can observe everything! Literally. Just create a global spy and it will observe every validation. Every rule, every type, everything will be in its hands.

If you need to prevent something, or update value somehow - special spy is the place.

You need to know just one thing. Spy has god power, but it has to give this power to the next spy. And there will always be **next** spy, even if its not your spy.

So, lets dive into examples

### `addSpy(spyFunction, spyParams?): removeSpyFunction`
Method to add spy in the validation process

  - `spyFunction(value, entryParams, next, abort): errors[]`
    - `next(nextValue, mixedParams?: entryParamsLike)`
    - `abort()`
  - `spyParams?: { ruleName?: string, type?: string }`

```js
import createValidation, { addSpy } from 'svelidation';
const { createEntry, validateValueStore } = createValidation();

const [ stringErrors, stringValue ] = createEntry({
  type: 'string',
  value: '...',
  min: 5,
  max: 10,
});

const removeSpy = addSpy((value, params, next, abort) => {
  console.log('spying!');
  next(value);
}, { type: 'string', ruleName: 'min' });

validateValueStore(stringValue);
// LOG: >> 'spying!'
```

First of all, take a look at the line with `next(value)` call. This is **VERY IMPORTANT LINE** in spies paradigm. Remember? Spy has god power, but it has to give this power to next spy. This.

`next(value, params)` - is the function witch spy have to call with any value spy wants. This new value will be taken by next validation rules or another spies (until type validation ends). Almost same with the params. But params will be merged with original for next validators. So the value will replace the original one, params will be merged

And it can returns errors, that will be merged with validation errors

```js
import createValidation, { addSpy, ensureType } from 'svelidation';
const { createEntry, validateValueStore } = createValidation();

const [ stringErrors, stringValue ] = createEntry({
  type: 'string',
  value: '...',
  myRule: 'hello'
});

const removeSpy = addSpy((value, params, next, abort) => {
  console.log('spying!');
  next(value, { somethingFromSpy: 'world' });
  return ['error-from-spy'];
}, { type: 'string', ruleName: 'myRule' });

ensureType('string', {
  myRule: (value, { myRule, somethingFromSpy }) => {
    console.log(myRule, somethingFromSpy); // 'hello', 'world'
    return false;
  }
});

console.log(validateValueStore(stringValue));
// ["error-from-spy", "myRule"]
// first is from spy, second from our rule, that always return false
```

What happens if we will not call `next`? Validation process will stop and return existing errors for the moment.

`abort()` method - its an emergency brake. If it calls - validation stop and return nothing.

And last, but not least `spyParams?: { ruleName?: string, type?: string }`. This is an optional object to describe spy's field of responsibilty.
  - `{ ruleName: 'min', type: 'string' }` - spy for specific rule in specific type. Will be called each time, when current pair rule-type check
  - `{ ruleName: 'match' }` - spy for specific rule. Will be called with each `ruleName` check
  - `{ type: 'array' }` - spy for EVERY validation of specific type. Will be called once per `type`.
  - `undefined` - spy for everything. Will be called once before every validation.

So, for example if you create spies:
```js
addSpy(() => {}); // 1
addSpy(() => {}, { type: 'string' }); // 2
addSpy(() => {}, { type: 'string', ruleName: 'min' }); // 3
addSpy(() => {}, { ruleName: 'min' }); // 4

// run validation for a { type: 'string', min: 5 }
// each spy will be called once

// run validation for a { type: 'string', min: 5 }, { type: 'string', max: 5 }
// 3 and 4 will be called once.
// 1 and 2 - twice, because we validate 2 entries (1st spy), and 2 strings (2nd spy)

// run validation for a { type: 'string', min: 5 }, { type: 'email', required: true }
// 1 - twice, because we validate 2 entries
// 2, 3 and 4 will be called once
```

Last thing about the spies.

If you create a spy that will observe `type` method of any type - remember, that returning an error from that spy will stop current entry validation because `type` method fails, so there is no point to continue validation

To remove your spy - just call `removeSpyFunction` that returns `addSpy` method.

And to remove all spies...

### `removeSpies(params?: { type?: string, ruleName?: string })`
This is an easy one after `addSpy` :). It just removes all spies depends on params.
  - `{type: 'string', ruleName: 'min'}` - remove all spies for specific rule in specific type
  - `{runeName: 'match'}` - remove all spies for specific global rule
  - `{type: 'string'}` - remove all spies for specific type
  - `undefined` - remove all spies at all

# scripts
- `npm run build` - build demo and library files into `dist`
- `npm run dev` - run dev server from dist folder with demo page by default
- `npm run test` - run all tests on production version of build
- `npm run e2e` - e2e testing of lib file from `dist`
- `npm run e2e:dev` - dev server from `e2e/dist` folder with tests name in params
- `npm run unit` - unit testing of `spec.js` files in `lib`
- `npm run unit:dev` - dev server for unit testing

# TODO
- [x] demo examples
- [x] complete readme
- [x] unit tests
- [x] e2e tests
- [x] builder demo
- [x] eslint
- [ ] add comments in the code
