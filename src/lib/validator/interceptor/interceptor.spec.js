import {
  addInterceptor,
  removeInterceptor,
  clearInterceptors,
  getInterceptors
} from './interceptor';

const undefinedOrEmptyArray = (item) => {
  return item === undefined || (Array.isArray(item) && item.length === 0);
};

describe('interceptor', () => {
  const typeParams = { type: 'test' };
  const typeRulesParams = { type: 'test', ruleName: 'test' };
  const ruleParams = { ruleName: 'test' };

  const runTests = (name, params) => {
    describe(`${name}`, () => {
      beforeEach(() => {
        clearInterceptors(params);
      });

      it('getInterceptors', () => {
        expect(undefinedOrEmptyArray(getInterceptors(params))).toBeTrue();
      });

      it('getInterceptors return', () => {
        const cb = () => {};
        addInterceptor(cb, params);
        expect(getInterceptors(params).length).toBe(1);
        addInterceptor(cb, params);
        expect(getInterceptors(params).length).toBe(2);
      });

      it('addInterceptor', () => {
        expect(undefinedOrEmptyArray(getInterceptors(params))).toBeTrue();
        addInterceptor(() => {}, params);
        expect(getInterceptors(params).length).toBe(1);
        addInterceptor(() => {}, params);
        addInterceptor(() => {}, params);
        expect(getInterceptors(params).length).toBe(3);
      });

      it('addInterceptor return', () => {
        const cb = () => {};
        expect(addInterceptor(cb, params).length).toBe(1);
        expect(addInterceptor(cb, params).length).toBe(2);
      });

      it('removeInterceptor', () => {
        const cb = () => { };
        addInterceptor(cb, params);
        addInterceptor(() => { }, params);
        expect(getInterceptors(params).length).toBe(2);
        removeInterceptor(() => { }, params);
        expect(getInterceptors(params).length).toBe(2);
        removeInterceptor(cb, params);
        expect(getInterceptors(params).length).toBe(1);
      });

      it('removeInterceptor return', () => {
        const cb = () => {};
        addInterceptor(cb, params);
        expect(removeInterceptor(cb, params)).toBeTrue();
        expect(removeInterceptor(() => {}, params)).toBeFalse();
      });

      it('clearInterceptors', () => {
        addInterceptor(() => { }, params);
        addInterceptor(() => { }, params);
        expect(getInterceptors(params).length).toBe(2);
        clearInterceptors(params);
        expect(getInterceptors(params).length).toBe(0);
      });

      it('clearInterceptors return', () => {
        addInterceptor(() => { }, params);
        addInterceptor(() => { }, params);
        expect(clearInterceptors(params)).toBeTrue();
        expect(clearInterceptors(params)).toBeFalse();
      });
    });
  };

  runTests('type', typeParams);
  runTests('ruleType', typeRulesParams);
  runTests('rule', ruleParams);
  runTests('global');
});
