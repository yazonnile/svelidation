import isFunction from './is-function';

describe('isFunction', () => {
  it('should work for arrow function', () => {
    expect(isFunction(() => {})).toBeTruthy();
  });
});
