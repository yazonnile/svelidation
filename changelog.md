# Svelidation changelog

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
