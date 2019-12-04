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

# types/rules
### `string`
  - `min|max` - rules to check string length
### `email`
### `number`
  - `min|max` - rules to compare number value
### `boolean`
### `array`
    - `max|max` - rules to check number value
- types
  - array
    - min
    - max
    - includes
- rules
  - equal
  - match
  - required
- options
  - validateOn
  - clearOn
  - listenInputEvents
  - presence
  - trim
- validation level API
  - createValidation main function
  - createEntry
  - createEntries
  - createForm
  - validateStore
  - validate
  - clearErrors
  - destroy
- project level API Advanced
  - addSpy, removeSpies
  - ensureRule, ensureType, resetType, resetRule
  - ListenInputEventsEnum
- scripts
