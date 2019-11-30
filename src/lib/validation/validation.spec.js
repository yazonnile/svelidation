import validateValueByParams, { getRuleKeys, addValidator } from './validation';

describe('validation', () => {
  it('should work', () => {
    expect(validateValueByParams).toBeTruthy();
    expect(getRuleKeys).toBeTruthy();
    expect(addValidator).toBeTruthy();
  });
});
