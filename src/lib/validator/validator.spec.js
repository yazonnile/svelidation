import { validate } from './validator';
import { addSpy, removeSpies } from './spy/spy';
import { ensureType, getType, resetType } from './types/types';

const jasmineSpy = (f) => {
  return jasmine.createSpy('#' + Math.random(), f).and.callThrough();
};

describe('validator', () => {
  it('default', () => {
    expect(validate('', { type: 'email' }).length).toBe(0);
    expect(validate('', { type: 'email', optional: true }).length).toBe(0);
    expect(validate('', { type: 'email', required: true }).length).toBe(1);
    expect(validate('4444', { type: 'email' }).length).toBe(1);

    expect(validate('', { type: 'number' }).length).toBe(0);
    expect(validate('  0  ', { type: 'number' }).length).toBe(0);
    expect(validate('  0  ', { type: 'number', max: 5 }).length).toBe(0);

    expect(validate('', { type: 'boolean' }).length).toBe(0);
    expect(validate('', { type: 'boolean', required: true }).length).toBe(1);
    expect(validate('1', { type: 'boolean' }).length).toBe(1);
    expect(validate('1', { type: 'boolean', required: true }).length).toBe(1);
    expect(validate(false, { type: 'boolean' }).length).toBe(0);
    expect(validate(false, { type: 'boolean', required: true }).length).toBe(1);
    expect(validate(true, { type: 'boolean' }).length).toBe(0);
    expect(validate(true, { type: 'boolean', required: true }).length).toBe(0);
  });

  it('trim', () => {
    expect(validate('  a  ', { type: 'string' }).length).toBe(0);
    expect(validate('  a  ', { type: 'string', min: 5 }).length).toBe(0);
    expect(validate('  a  ', { type: 'string', min: 5, trim: true }).length).toBe(1);

    expect(validate('  .0  ', { type: 'number', max: 5, trim: true }).length).toBe(0);
  });

  it('optional/required', () => {
    expect(validate('', { type: 'string' }).length).toBe(0);
    expect(validate('', { type: 'string', optional: true }).length).toBe(0);
    expect(validate('', { type: 'string', required: true }).length).toBe(1);
  });

  describe('spies', () => {
    beforeEach(() => {
      removeSpies();
    });

    afterAll(() => {
      removeSpies();
    });

    it('simple', () => {
      const cb = jasmineSpy();
      addSpy(cb);
      validate('1234', { type: 'string' });
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('update value', () => {
      const test = (expectation) => expect(validate('1234', { type: 'string', min: 5 }).length).toBe(expectation);
      test(1);
      const first = (value, params, next) => next(value + 5);
      let remove = addSpy(first, { type: 'string', ruleName: 'min' });
      test(0);
      remove();
      test(1);
      const second = jasmineSpy((value, params, next) => {
        next(value);
        return [];
      });
      remove = addSpy(second, { type: 'string', ruleName: 'min' });
      test(1);
      test(1);
      remove();
      test(1);
      expect(second).toHaveBeenCalledTimes(2);
    });

    it('update params', () => {
      const test = (expectation) => expect(validate('1234', { type: 'string', min: 3 }).length).toBe(expectation);
      test(0);
      const first = (value, params, next) => next(value, { min: 5 });
      let remove = addSpy(first, { type: 'string', ruleName: 'min' });
      test(1);
      test(1);
      remove();
      test(0);
      let i = 0;
      const second = jasmineSpy((value, params, next) => {
        i++;
        next(value);
      });
      remove = addSpy(second, { type: 'string', ruleName: 'min' });
      test(0);
      test(0);
      remove();
      test(0);
      expect(second).toHaveBeenCalledTimes(2);
    });

    it('abort', () => {
      const test = (value, expectation) => expect(validate(value, { type: 'string', min: 3 }).length).toBe(expectation);
      const testWithUndefined = (value) => expect(validate(value, { type: 'string', min: 3 })).toBeUndefined();
      test('123', 0);
      const first = jasmineSpy((value, params, next, abort) => {
        if (value === '1') abort();
        next(value);
      });
      let remove = addSpy(first);
      test('1234', 0); // 1 calls coz global spy
      test('12', 1); // 1 same
      testWithUndefined('1'); // same
      expect(first).toHaveBeenCalledTimes(3);
      remove();
      test('1', 1);
      expect(first).toHaveBeenCalledTimes(3);
    });

    it('stop', () => {
      const test = (value, expectation) => expect(validate(value, { type: 'string', min: 3 }).length).toBe(expectation);
      test('123', 0);
      const first = jasmineSpy((value, params, next, abort) => {
        next(value);
        return ['one-more-error'];
      });
      let remove = addSpy(first);
      test('1234', 1);
      test('12', 1);
      expect(first).toHaveBeenCalledTimes(2);
      remove();

      const second = jasmineSpy(() => { })
      remove = addSpy(second);
      test('1234', 0);
      test('12', 0);
      expect(second).toHaveBeenCalledTimes(2);
      remove();
    });
  });

  describe('global spies', () => {
    it('simple', () => {
      const test = (expectation) => expect(validate('123', { type: 'string', min: 3 }).length).toBe(expectation);
      const spy = jasmineSpy((value, params, next) => {
        next(value);
      });
      test(0);
      const remove = addSpy(spy);
      test(0);
      test(0);
      expect(spy).toHaveBeenCalledTimes(2);
      remove();
      test(0);
      expect(spy).toHaveBeenCalledTimes(2);
    });


    it('abort', () => {
      const testExpectation = (exp) => expect(validate('123', { type: 'string', min: 3 }).length).toBe(exp);
      const testNoType = () => expect(validate('123', { type: 'ANY' }).length).toBe(0);
      const test = () => expect(validate('123', { type: 'string' })).toBeUndefined();
      const spy = jasmineSpy((value, params, next, abort) => {
        abort();
      });
      testExpectation(0);
      testNoType();
      const remove = addSpy(spy);
      test();
      test();
      expect(spy).toHaveBeenCalledTimes(2);
      remove();
      testExpectation(0);
      testNoType();
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('stop', () => {
      const test = (exp) => expect(validate('123', { type: 'string', min: 3 }).length).toBe(exp);
      const spy = jasmineSpy(() => {
        return ['error'];
      });
      test(0);
      const remove = addSpy(spy);
      test(1);
      test(1);
      expect(spy).toHaveBeenCalledTimes(2);
      remove();
      test(0);
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe('spy types', () => {
    const test = () => {
      expect(validate('123', { type: 'string', equal: '1234' }).length).toBe(1);
      expect(validate('123', { type: 'string', max: 3 }).length).toBe(0);
      expect(validate('123', { type: 'string', min: 3 }).length).toBe(0);
      expect(validate('123', { type: 'string', min: 4 }).length).toBe(1);
      expect(validate('123', { type: 'number', min: 4 }).length).toBe(0);
    };
    const getSpy = () => jasmineSpy((value, params, next) => next(value));

    it('type/typeRule', () => {
      const typeSpy = getSpy();
      const typeRuleSpy = getSpy();
      addSpy(typeSpy, { type: 'string' });
      addSpy(typeRuleSpy, { type: 'string', ruleName: 'min' });
      test();
      expect(typeSpy).toHaveBeenCalledTimes(4);
      expect(typeRuleSpy).toHaveBeenCalledTimes(2);
    });

    it('type/rule', () => {
      const typeSpy = getSpy();
      const ruleSpy = getSpy();
      addSpy(typeSpy, { type: 'string' });
      addSpy(ruleSpy, { ruleName: 'type' });
      test();
      expect(typeSpy).toHaveBeenCalledTimes(4);
      expect(ruleSpy).toHaveBeenCalledTimes(5);
    });

    it('typeRule/rule', () => {
      const typeRuleSpy = getSpy();
      const ruleSpy = getSpy();
      addSpy(typeRuleSpy, { type: 'string', ruleName: 'max' });
      addSpy(ruleSpy, { ruleName: 'min' });
      test();
      expect(typeRuleSpy).toHaveBeenCalledTimes(1);
      expect(ruleSpy).toHaveBeenCalledTimes(3);
    });

    it('type/typeRule/rule/global', () => {
      const typeSpy = getSpy();
      const typeRuleSpy = getSpy();
      const ruleSpy1 = getSpy();
      const ruleSpy2 = getSpy();
      const globalSpy = getSpy();
      addSpy(typeSpy, { type: 'number' });
      addSpy(typeRuleSpy, { type: 'string', ruleName: 'max' });
      addSpy(ruleSpy1, { ruleName: 'min' });
      addSpy(ruleSpy2, { ruleName: 'equal' });
      addSpy(globalSpy);
      test();
      expect(typeSpy).toHaveBeenCalledTimes(1);
      expect(typeRuleSpy).toHaveBeenCalledTimes(1);
      expect(ruleSpy1).toHaveBeenCalledTimes(3);
      expect(ruleSpy2).toHaveBeenCalledTimes(1);
      expect(globalSpy).toHaveBeenCalledTimes(5);
    });
  });

  describe('common scenarios', () => {
    it('manual trim', () => {
      const test = (exp) => expect(validate('  123', { type: 'my-string', min: 4 }).length).toBe(exp);
      const spy = jasmineSpy((value, { type }, next) => {
        next(type === 'my-string' ? value.trim() : value);
      });

      test(0);
      expect(getType('my-string')).toBeUndefined();
      ensureType('my-string', {
        type: 'string.type',
        min: 'string.min'
      });
      test(0);
      const remove = addSpy(spy);
      test(1);
      remove();
      test(0);
    });

    it('rude words', () => {
      const test = (text, exp) => expect(validate(text, { type: 'no-rude' }).length).toBe(exp);
      test('any', 0);
      expect(getType('no-rude')).toBeUndefined();
      ensureType('no-rude', {
        type: (value) => {
          return !value.match(/(cunt|fuck)/);
        }
      });
      test('you cunt, motherfucker', 1);
      resetType('no-rude');
      test('you cunt, motherfucker', 0);
    });
  });
});
