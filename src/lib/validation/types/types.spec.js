import StringType from './string';
import NumberType from './number';
import EmailType from './email';
import BaseType from './base';

describe('types', () => {
  it('should work', () => {
    expect(StringType).toBeTruthy();
    expect(NumberType).toBeTruthy();
    expect(EmailType).toBeTruthy();
    expect(BaseType).toBeTruthy();
  });
});

