import isFunction from './is-function';

describe('isFunction', function() {
  it('should work for arrow function', function() {
    expect(isFunction(() => {})).toBeTruthy();
  });
});
