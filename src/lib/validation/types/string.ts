import BaseType from './base';

export default class StringType extends BaseType {
  getValue() {
    const { trim = true } = this.params;
    const value = super.getValue().toString();
    return trim ? value.trim() : value;
  }
  typeValidation() {
    return super.typeValidation(/.+/);
  }
  minLengthRule() {
    return this.getValue().length >= this.params.minLength;
  }
  maxLengthRule() {
    return this.getValue().length <= this.params.maxLength;
  }
}

