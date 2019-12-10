import {
  addSpy,
  removeSpy,
  removeSpies,
  getSpies
} from './spy';

const undefinedOrEmptyArray = (item) => {
  return item === undefined || (Array.isArray(item) && item.length === 0);
};

describe('spy', () => {
  const typeParams = { type: 'test' };
  const typeRulesParams = { type: 'test', ruleName: 'test' };
  const ruleParams = { ruleName: 'test' };

  const runTests = (name, params) => {
    describe(`${name}`, () => {
      beforeEach(() => {
        removeSpies(params);
      });

      afterAll(() => {
        removeSpies(params);
      });

      it('getSpies', () => {
        expect(undefinedOrEmptyArray(getSpies(params))).toBeTrue();
      });

      it('getSpies return', () => {
        const cb = () => {};
        addSpy(cb, params);
        expect(getSpies(params).length).toBe(1);
        addSpy(cb, params);
        expect(getSpies(params).length).toBe(2);
      });

      it('addSpy', () => {
        expect(undefinedOrEmptyArray(getSpies(params))).toBeTrue();
        addSpy(() => {}, params);
        expect(getSpies(params).length).toBe(1);
        addSpy(() => {}, params);
        addSpy(() => {}, params);
        expect(getSpies(params).length).toBe(3);
      });

      it('addSpy return', () => {
        const cb = () => {};
        const remove = addSpy(cb, params);
        addSpy(cb, params);
        expect(getSpies(params).length).toBe(2);
        remove();
        expect(getSpies(params).length).toBe(1);
      });

      it('removeSpy', () => {
        const cb = () => { };
        addSpy(cb, params);
        addSpy(() => { }, params);
        expect(getSpies(params).length).toBe(2);
        removeSpy(() => { }, params);
        expect(getSpies(params).length).toBe(2);
        removeSpy(cb, params);
        expect(getSpies(params).length).toBe(1);
      });

      it('removeSpy return', () => {
        const cb = () => {};
        addSpy(cb, params);
        expect(removeSpy(cb, params)).toBeTrue();
        expect(removeSpy(() => {}, params)).toBeFalse();
      });

      it('removeSpies', () => {
        addSpy(() => { }, params);
        addSpy(() => { }, params);
        expect(getSpies(params).length).toBe(2);
        removeSpies(params);
        expect(getSpies(params).length).toBe(0);
      });

      it('removeSpies return', () => {
        addSpy(() => { }, params);
        addSpy(() => { }, params);
        expect(removeSpies(params)).toBeTrue();
      });
    });
  };

  runTests('type', typeParams);
  runTests('ruleType', typeRulesParams);
  runTests('rule', ruleParams);
  runTests('global');
});
