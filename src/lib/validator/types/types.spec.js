import {
  ensureRule,
  ensureType,
  getType,
  getRule,
  resetType,
  resetRule
} from './types';

describe('validator types', () => {
  beforeEach(() => {
    resetRule();
    resetType();
  });

  describe('basic', () => {
    it('types', () => {
      const stringType = getType('string');
      const emailType = getType('email');
      const numberType = getType('number');

      expect(stringType).toBeDefined();
      expect(Object.keys(stringType).sort()).toEqual(['typeCheck', 'minLength', 'maxLength'].sort());
      expect(emailType).toBeDefined();
      expect(Object.keys(emailType).sort()).toEqual(['typeCheck'].sort());
      expect(numberType).toBeDefined();
      expect(Object.keys(numberType).sort()).toEqual(['typeCheck', 'min', 'max'].sort());
    });

    it('rules', () => {
      const equal = getRule('equal');
      const match = getRule('match');
      const required = getRule('required');

      expect(typeof equal).toBe('function');
      expect(typeof match).toBe('function');
      expect(typeof required).toBe('function');
    });
  });

  describe('types', () => {
    describe('string', () => {
      it('typeCheck', () => {
        const { typeCheck } = getType('string');
        expect(typeCheck('')).toBeTrue();
        expect(typeCheck(undefined)).toBeFalse();
        expect(typeCheck(null)).toBeFalse();
        expect(typeCheck(' ')).toBeTrue();
      });

      it('minLength', () => {
        const { minLength } = getType('string');
        const value = '12345';
        expect(minLength(value, { minLength: 2 })).toBeTrue();
        expect(minLength(value, { minLength: 5 })).toBeTrue();
        expect(minLength(value, { minLength: 6 })).toBeFalse();
      });

      it('maxLength', () => {
        const { maxLength } = getType('string');
        const value = '12345';
        expect(maxLength(value, { maxLength: 2 })).toBeFalse();
        expect(maxLength(value, { maxLength: 5 })).toBeTrue();
        expect(maxLength(value, { maxLength: 6 })).toBeTrue();
      });
    });

    describe('email', () => {
      it('typeCheck', () => {
        const { typeCheck } = getType('email');
        expect(typeCheck('')).toBeFalse();
        expect(typeCheck(undefined)).toBeFalse();
        expect(typeCheck(null)).toBeFalse();
        expect(typeCheck(' ')).toBeFalse();
        expect(typeCheck('aaa@sss.com')).toBeTrue();
      });
    });

    describe('number', () => {
      it('typeCheck', () => {
        const { typeCheck } = getType('number');
        expect(typeCheck('')).toBeFalse();
        expect(typeCheck(undefined)).toBeFalse();
        expect(typeCheck(null)).toBeFalse();
        expect(typeCheck('null')).toBeFalse();
        expect(typeCheck(' ')).toBeFalse();
        expect(typeCheck('1')).toBeTrue();
        expect(typeCheck('.1')).toBeTrue();
        expect(typeCheck('1.1')).toBeTrue();
        expect(typeCheck(1)).toBeTrue();
        expect(typeCheck(.1)).toBeTrue();
        expect(typeCheck(1.1)).toBeTrue();
      });

      it('min', () => {
        const { min } = getType('number');
        const value = 16;
        expect(min(value, { min: 2 })).toBeTrue();
        expect(min(value, { min: 16 })).toBeTrue();
        expect(min(value, { min: 17 })).toBeFalse();
      });

      it('max', () => {
        const { max } = getType('number');
        const value = 16;
        expect(max(value, { max: 2 })).toBeFalse();
        expect(max(value, { max: 15 })).toBeFalse();
        expect(max(value, { max: 16 })).toBeTrue();
      });
    });
  });

  describe('rules', () => {
    it('equal', () => {
      const equal = getRule('equal');
      expect(equal(1, { equal: 1 })).toBeTrue();
      expect(equal('1', { equal: 1 })).toBeFalse();
      expect(equal(.1, { equal: 0.1 })).toBeTrue();
    });

    it('match', () => {
      const match = getRule('match');
      const regExp = /^202\d$/;
      expect(match(2018, { match: regExp })).toBeFalse();
      expect(match(2019, { match: regExp })).toBeFalse();
      expect(match(2020, { match: regExp })).toBeTrue();
    });

    it('required', () => {
      const required = getRule('required');
      expect(required(null)).toBeFalse();
      expect(required(undefined)).toBeFalse();
      expect(required('')).toBeFalse();
      expect(required('0')).toBeTrue();
      expect(required(0)).toBeTrue();
    });
  });

  describe('api', () => {
    it('resetRule', () => {
      expect(getRule('test')).toBeUndefined();
      ensureRule('test', (value) => (value === 'test'));
      expect(getRule('test')).toBeDefined();
      resetRule();
      expect(getRule('test')).toBeUndefined();
    });

    it('resetType', () => {
      expect(getType('string').custom).toBeUndefined();
      ensureType('string', { custom() {} });
      expect(getType('string').custom).toBeDefined();
      resetType('string');
      expect(getType('string').custom).toBeUndefined();
    });

    it('ensureType by function', () => {
      ensureType('test');
      expect(getType('test')).toBeUndefined();
      ensureType('test', { magicMethod() { } });
      expect(getType('test')).toBeUndefined();
      ensureType('test', { typeCheck() { } });
      expect(getType('test')).toBeDefined();
      expect(getType('test').typeCheck).toBeDefined();
      ensureType('test', { magicMethod(value) { return value === 'magicMethod'} });
      expect(getType('test').magicMethod).toBeDefined();
      expect(getType('test').magicMethod('s')).toBeFalse();
      expect(getType('test').magicMethod('magicMethod')).toBeTrue();

      expect(getType('string').custom).toBeUndefined();
      ensureType('string', { custom() {} });
      expect(getType('string').custom).toBeDefined();
    });

    it('ensureType by extending', () => {
      ensureType('test', { typeCheck: 'string.typeCheck' });
      expect(getType('test')).toBeDefined();
      expect(getType('test').typeCheck === getType('string').typeCheck).toBeTrue();

      ensureType('test2', { typeCheck: 'nan.typeCheck' });
      expect(getType('test2')).toBeUndefined();
    });

    it('ensureRule', () => {
      ensureRule('test');
      expect(getRule('test')).toBeUndefined();
      ensureRule('test', (value) => (value === 'test1'));
      expect(getRule('test')).toBeDefined();
      expect(getRule('test')('t')).toBeFalse();
      expect(getRule('test')('test1')).toBeTrue();
      ensureRule('test', (value) => (value === 'test2'));
      expect(getRule('test')('test1')).toBeFalse();
      expect(getRule('test')('test2')).toBeTrue();
    });
  })
});
