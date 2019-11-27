import { EntryParamsInterface } from 'lib/typing/typing';

export default class BaseType {
  value: string|number|undefined|null;
  params: EntryParamsInterface;
  errors: string[];

  constructor(value, params) {
    this.value = value;
    this.params = params;
    this.errors = [];
  }

  getValue() {
    return (this.value === undefined || this.value === null) ? '' : this.value;
  }

  optionalWithNoValue() {
    return !this.getValue() && this.params.optional;
  }

  typeValidation(regExp: RegExp) {
    return this.getValue().toString().match(regExp);
  }

  matchRule() {
    return this.getValue().toString().match(this.params.match);
  }

  equalRule() {
    return this.getValue() === this.params.equal;
  }

  getErrors() {
    return this.errors;
  }
}
