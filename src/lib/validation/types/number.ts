import BaseType from './base';

export default class NumberType extends BaseType {
  getValue() {
    return parseFloat(super.getValue() as string);
  }
  typeValidation() {
    return super.typeValidation(/\d+/);
  }
  minValueRule() {
    return this.getValue() >= this.params.minValue;
  }
  maxValueRule() {
    return this.getValue() <= this.params.maxValue;
  }
}

