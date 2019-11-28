# Svelidation

Easily customizable library for `validation` scenarios in `svelte` components 

## Quick example
```js
import Svelidation from 'svelidation';

// 1. create an instance
const validation = new Svelidation();
const { createForm } = validation;

// 2. create a validation model
const [ loginStore, loginInput ] = validation.createEntry({
  type: 'string',
  minLength: 3,
  maxLength: 15
});
```
```html
<!-- 3. use it in template  -->
<form use:createForm>
  <input type="text" use:loginInput bind:value={$loginStore.value} />

  {#if $loginStore.errors.includes('minLength')}
    Login should be at least 3 symbols long
  {/if}

  {#if $loginStore.errors.includes('maxLength')}
    Login should be not longer than 15 symbols
  {/if}

  <button type="submit">Submit</button>
</form>
```
Check this and more on the [demo page](http://yazonnile.github.io/svelidation/)

## Install
`npm i -S svelidation`

## Class options (all options are optional)
```js
new Svelidation({
  validateOn,
  clearOn,
  inputValidationPhase
});
```
`validateOn (string[]: ['input'])`: array of input events to validate input value

`clearOn (string[]: [])`: array of input events to clear input errors

`inputValidationPhase (number: 0)`: specific option for control input events
  - `0`: dont allow input events
  - `1`: allow input events always
  - `2`: allow input events after first form validation
    
#### Example #1
Inputs will remove errors on focus and validate value on blur only after first form validation 
```js
new Svelidation({
  validateOn: ['blur'],
  clearOn: ['focus']
});
```
    
#### Example #2
Inputs events will not affect validation
```js
new Svelidation({
  inputValidationPhase: 0
});
```

## Validators
 - `base`
   - optional
   - match
   - equal
 - `string` extends `base`
   - type
   - minLength
   - maxLength
 - `number` extends `base`
   - type
   - minValue
   - maxValue
 - `email` extends `base`
   - type

## API

### `this.createEntry`
```js
const instance = new Svelidation();
instance.createEntry({
  type, // required
  
  minLength,
  maxLength,
  minValue,
  maxValue,
  match,
  equal,

  optional,
  trim,
  value,
})
```
`type (string)`: specific validator name (`string`, `number`, `email`). The only required param

`maxLength | minLength (number)`: `string` specific rules for value length 

`maxValue | minValue (number)`: `number` specific rules for value

`match (regExp)`

`equal (any)`

`optional (boolean)`: is field optional. If optional and empty - it is valid.

`trim (boolean)`: does validation need to trim value before check

`value (string)`: initial value of input

### `this.createEntries`
Additional way to create a few entries at the time
```js
const instance = new Svelidation();
const {
  first: [firstStore, firstInput],
  second: [secondStore, secondInput]
} = instance.createEntries({
  first: {
    // createEntry params
  },
  second: {
    // createEntry params
  },
})
```
```js
const instance = new Svelidation();
const [
  [firstStore, firstInput],
  [secondStore, secondInput]
] = instance.createEntries([
  {
    // createEntry params
  }, {
    // createEntry params
  },
])
```

### `this.createForm`
Function for form `use`
```js
const instance = new Svelidation();
const { createForm } = instance;
```
```html
<form use:createForm></form>
<!-- or -->
<form use:createForm={{ onSubmit, onFail, onSuccess }}></form>
```
Callbacks for form validation on submit 

`onSubmit(submitEvent, errors[])`

`onFail(errors[])`

`onSuccess()`

### `this.validateAll`
Manually validate all (binded to inputs) entries
```js
const instance = new Svelidation();
instance.validateAll();
```

### `this.clearErrors`
Clear all errors
```js
const instance = new Svelidation();
instance.clearErrors();
```

### `this.validateStore`
Manually validate store
```js
const instance = new Svelidation();
const [ emailStore ] = instance.createEntry({ type: 'email' });
instance.validateStore(emailStore);
```

## Advanced API
Add custom or modify current validators
### `addValidator`
```js
import Validation, { StringType, BaseType, addValidator } from 'src/index';

  addValidator('newTypeByRule', class extends StringType {
    newTypeParamRule() {
      return this.getValue() === this.params.newTypeParam;
    }
  });

  addValidator('newTypeByType', class extends BaseType {
    typeValidation() {
      return super.typeValidation(/AAA/);
    }
  });

  const validation = new Validation();
  const { createForm } = validation;

  const [ firstStore, firstInput ] = validation.createEntry({
    type: 'newTypeByRule',
    newTypeParam: 'AAA'
  });

  const [ secondStore, secondInput ] = validation.createEntry({
    type: 'newTypeByType'
  });
```
```html
<form use:createForm>
  <h1>Custom example</h1>
  <label>
    Type 'AAA' (by rule)
    <input type="email" use:firstInput bind:value={$firstStore.value} />
    {#if $firstStore.errors.includes('newTypeParam')}
      <p class="error">OMG, you've messed up</p>
    {/if}
  </label>
  <label>
    Type 'AAA' (by type)
    <input type="email" use:secondInput bind:value={$secondStore.value} />
    {#if $secondStore.errors.includes('type')}
      <p class="error">OMG, you've messed up</p>
    {/if}
  </label>
  <button type="submit">submit</button>
</form>
```

# TODO
- e2e tests
- unit tests
- eslints
