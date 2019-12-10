# Svelidation changelog

# 1.0.4
* makes `email` `typeCheck` valid on empty string

# 1.0.3
* fixed preventing validation in store input event

# 1.0.2
* add builder on demo page
* **FIXED** optional-required-presence behavior

# 1.0.0

* unit tests for types and spies
* `abort` method for spies
* `addSpy` will now return `removeSpy` function
* adding extending to `ensureType`
* unit tests for validator
* add `presence` options
* add `trim` option
* add `boolean` type
* renamed/refactored `input` -> `form-element`
* allowed entry has a multi inputs
* add radio demo
* add `array` type
* replaced lib class with closure
* merge `typeCheck` flow with all rules
* rename phaseEnum with `ListenInputEventsEnum`
* rename `min/maxLength` into `min/max`
* moved `demo` to `docs`
* add `postcss` for demo purpose
* renamed `validateOn` (array) option to `validateOnEvents` (object)
* renamed `clearOn` (array) option to `clearErrorsOnEvents` (object)
* `formElement` has specific events. Not all are supported
* `optional` `number` with empty string is `valid`
* renamed `validateStore` to `validateValueStore`
* **split store to two stores (errors, value), so increased createEntry return array by one**
* **input event now works as subscription on value store**
* add `includeAllEntries` option
* function into `equal` rule
* **remove destroy api method because opf useless**
* add between rule to string and number
* update demo page
* add builder

## 0.1.0

* update default validateOn event from `input` to `change` (updated big amount of e2e tests)
* totally refactored build process
* `clearOn` and `validateOn` options for main class are ensured with empty array
* added `destroy` method to main class (it destroys all `Inputs` classes available)
* `preventEvents` method in `Input` class now compare `initialPhase` with a current one, instead of take `not equal`

## 0.0.4

* added optional param to `validate` and `clearErrors` apis
* added `reset` event to `clearOn` option by default

## 0.0.1

* initial commit
* core validation functionality
* integrate validation to svelte
