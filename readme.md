![Svelidation](https://svgshare.com/i/GUq.svg)

Easily customizable library for `validation` scenarios in `svelte` components

# Quick example
```js
import createSvelidation from 'svelidation';

// 1. create an instance
const { createForm, createEntry } = createSvelidation();

// 2. create a validation model
const [ loginStore, loginInput ] = createEntry({
  type: 'string',
  min: 3,
  max: 15
});
```
```html
<!-- 3. use it in template  -->
<form use:createForm>
  <input type="text" use:loginInput bind:value={$loginStore.value} />

  {#if $loginStore.errors.includes('min')}
    Login should be at least 3 symbols long
  {/if}

  {#if $loginStore.errors.includes('max')}
    Login should be not longer than 15 symbols
  {/if}

  <button type="submit">Submit</button>
</form>
```
Check this and more on the [demo page](http://yazonnile.github.io/svelidation/)

# install
`npm i -S svelidation`

# basic types/rules
- `string` type
  - `min|max` - rules to check string length
- `email` type
- `number` type
  - `min|max` - rules to check number value
- `boolean` type
- `array` type
  - `max|max` - rules to check array length value
  - `includes` - check array includes element

- global rules
  - `equal` - equality with value (in case of array it sort and stringify it)
  - `match` - match textual value form by regExp 
  - `required` - check value exists

# options
```js
// default values
createSvelidation({
  validateOn: ['change'],
  clearOn: ['reset'],
  listenInputEvents: 2,
  presence: 'optional',
  trim: false
});
```
- `validateOn: string[]`
  - array of input events to validate input value

- `clearOn: string[]`
  - array of input and form events to clear errors. All events except `reset` will be applied to input. `reset` to form 

- `listenInputEvents: number`
  - specific option for control input events
    - `0`: dont allow input events
    - `1`: allow input events always 
    - `2`: allow input events after first validation run

- `presence: string`
  - Default inputs presence. If we set it to `required` - all inputs will be validated as required.
   
- `trim: boolean`
  - allow validator trim textual values before check
  - *(!!!) it doesn't trim value itself, just for check*
  
Use `validateOn`, `clearOn` and `listenInputEvents` options to be more precise in validation behavior

`presence` and `trim` as validation options could be overrides by any input for itself 

# validation level API
```js
import createSvelidation from 'svelidation';
const {
  createEntry,
  createEntries,
  createForm,
  validateStore,
  validate,
  clearErrors,
  destroy
} = createSvelidation();
```
  - createEntry
  - createEntries
  - createForm
  - validateStore
  - validate
  - clearErrors
  - destroy
  
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
  - addSpy
  - ensureRule, ensureType
  - resetType, resetRule
  - removeSpies
  
  
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
