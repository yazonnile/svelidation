import StringType from './string';
import NumberType from './number';
import EmailType from './email';
import BaseType from './base';

describe('types', function() {
  it('should work', function() {
    expect(StringType).toBeTruthy();
    expect(NumberType).toBeTruthy();
    expect(EmailType).toBeTruthy();
    expect(BaseType).toBeTruthy();
  });
});

