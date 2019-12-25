import {
  ensureRule,
  ensureType,
  getType,
  getRule,
  resetType,
  resetRule
} from './types';

describe('types', () => {
  beforeEach(() => {
    resetRule();
    resetType();
  });

  describe('basic', () => {
    it('types', () => {
      const stringType = getType('string');
      const emailType = getType('email');
      const numberType = getType('number');
      const booleanType = getType('boolean');
      const arrayType = getType('array');

      expect(stringType).toBeDefined();
      expect(Object.keys(stringType).sort()).toEqual(['type', 'min', 'max', 'between'].sort());
      expect(emailType).toBeDefined();
      expect(Object.keys(emailType).sort()).toEqual(['type'].sort());
      expect(numberType).toBeDefined();
      expect(Object.keys(numberType).sort()).toEqual(['type', 'required', 'min', 'max', 'between'].sort());
      expect(booleanType).toBeDefined();
      expect(Object.keys(booleanType).sort()).toEqual(['type', 'required'].sort());
      expect(arrayType).toBeDefined();
      expect(Object.keys(arrayType).sort()).toEqual(['type', 'required', 'min', 'max', 'equal', 'includes'].sort());
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
      it('type', () => {
        const { type } = getType('string');
        expect(type('')).toBeTrue();
        expect(type(undefined)).toBeFalse();
        expect(type(null)).toBeFalse();
        expect(type(' ')).toBeTrue();
      });

      it('min', () => {
        const { min } = getType('string');
        const value = '12345';
        expect(min(value, { min: 2 })).toBeTrue();
        expect(min(value, { min: 5 })).toBeTrue();
        expect(min(value, { min: 6 })).toBeFalse();
      });

      it('max', () => {
        const { max } = getType('string');
        const value = '12345';
        expect(max(value, { max: 2 })).toBeFalse();
        expect(max(value, { max: 5 })).toBeTrue();
        expect(max(value, { max: 6 })).toBeTrue();
      });

      it('between', () => {
        const { between } = getType('string');
        const value = '12345';
        expect(between(value, { between: [2, 5] })).toBeTrue();
        expect(between(value, { between: [2, 6] })).toBeTrue();
        expect(between(value, { between: [1, 4] })).toBeFalse();
      });
    });

    describe('email', () => {
      it('type', () => {
        const { type } = getType('email');
        expect(type('')).toBeTrue();
        expect(type(undefined)).toBeFalse();
        expect(type(null)).toBeFalse();
        expect(type(' ')).toBeFalse();
        expect(type('aaa@sss.com')).toBeTrue();
      });
    });

    describe('number', () => {
      it('type', () => {
        const { type } = getType('number');
        expect(type('')).toBeTrue();
        expect(type(undefined)).toBeFalse();
        expect(type(null)).toBeFalse();
        expect(type('null')).toBeFalse();
        expect(type(' ')).toBeFalse();
        expect(type('1')).toBeTrue();
        expect(type('.1')).toBeTrue();
        expect(type('1.1')).toBeTrue();
        expect(type(1)).toBeTrue();
        expect(type(.1)).toBeTrue();
        expect(type(1.1)).toBeTrue();
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

      it('between', () => {
        const { between } = getType('number');
        const value = 5;
        expect(between(value, { between: [2, 5] })).toBeTrue();
        expect(between(value, { between: [2, 6] })).toBeTrue();
        expect(between(value, { between: [1, 4] })).toBeFalse();
      });
    });

    describe('boolean', () => {
      it('type', () => {
        const { type } = getType('boolean');
        expect(type('')).toBeFalse();
        expect(type(undefined)).toBeFalse();
        expect(type(null)).toBeFalse();
        expect(type(' ')).toBeFalse();
        expect(type(true)).toBeTrue();
        expect(type(false)).toBeTrue();
        expect(type({})).toBeFalse();
      });

      it('required', () => {
        const { required } = getType('boolean');
        expect(required(true)).toBeTrue();
        expect(required(false)).toBeFalse();
      });
    });

    describe('array', () => {
      it('type', () => {
        const { type } = getType('array');
        expect(type('')).toBeFalse();
        expect(type(undefined)).toBeFalse();
        expect(type(null)).toBeFalse();
        expect(type(' ')).toBeFalse();
        expect(type(0)).toBeFalse();
        expect(type(true)).toBeFalse();
        expect(type(false)).toBeFalse();
        expect(type({})).toBeFalse();
        expect(type([])).toBeTrue();
      });

      it('required', () => {
        const { required } = getType('array');
        expect(required([1])).toBeTrue();
        expect(required([])).toBeFalse();
      });

      it('equal', () => {
        const { equal } = getType('array');
        expect(equal([1,5,2], { equal: [5,2,1] })).toBeTrue();
        expect(equal([1,5,2], { equal: (value) => {
            return value.length === 3;
        } })).toBeTrue();
        expect(equal([1,6,2], { equal: [5,2,1] })).toBeFalse();
        expect(equal([1,5,2,1], { equal: [5,2,1] })).toBeFalse();
      });

      it('min', () => {
        const { min } = getType('array');
        expect(min([1,2,3], { min: 2 })).toBeTrue();
        expect(min([1], { min: 2 })).toBeFalse();
        expect(min([], { min: 2 })).toBeFalse();
      });

      it('max', () => {
        const { max } = getType('array');
        expect(max([1,5], { max: 2 })).toBeTrue();
        expect(max([1,6,2], { max: 2 })).toBeFalse();
        expect(max([1,5,2,1], { max: 2 })).toBeFalse();
      });

      it('includes', () => {
        const { includes } = getType('array');
        expect(includes([1,5,2], { includes: 1 })).toBeTrue();
        expect(includes([2,6,2], { includes: 1 })).toBeFalse();
        expect(includes([3,5,2,2], { includes: 1 })).toBeFalse();
      });
    });
  });

  describe('rules', () => {
    it('equal', () => {
      const equal = getRule('equal');
      const dynamicValue = () => {
        return .1;
      };
      expect(equal(1, { equal: 1 })).toBeTrue();
      expect(equal('1', { equal: 1 })).toBeFalse();
      expect(equal(.1, { equal: 0.1 })).toBeTrue();
      expect(equal(.1, { equal: value => {
        return value === dynamicValue();
      } })).toBeTrue();
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
      ensureType('test', { type() { } });
      expect(getType('test')).toBeDefined();
      expect(getType('test').type).toBeDefined();
      ensureType('test', { magicMethod(value) { return value === 'magicMethod'} });
      expect(getType('test').magicMethod).toBeDefined();
      expect(getType('test').magicMethod('s')).toBeFalse();
      expect(getType('test').magicMethod('magicMethod')).toBeTrue();

      expect(getType('string').custom).toBeUndefined();
      ensureType('string', { custom() {} });
      expect(getType('string').custom).toBeDefined();
    });

    it('ensureType by extending', () => {
      ensureType('test', { type: 'string.type' });
      expect(getType('test')).toBeDefined();
      expect(getType('test').type === getType('string').type).toBeTrue();

      ensureType('test2', { type: 'nan.type' });
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
