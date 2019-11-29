import validateValueByParams, { getRuleKeys, addValidator } from './validation';

describe('validation', function() {
  it('should work', function() {
    expect(validateValueByParams).toBeTruthy();
    expect(getRuleKeys).toBeTruthy();
    expect(addValidator).toBeTruthy();
  });
});
