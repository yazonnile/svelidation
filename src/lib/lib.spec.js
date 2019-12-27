import createValidation from './lib';
import { get } from 'svelte/store';

describe('lib', () => {
  const createInstance = opts => createValidation(opts);
  let instance;

  it('constructor', () => {
    instance = createInstance();
    const { createEntry, createEntries, createForm, validateValueStore, validate, clearErrors, getValues } = instance;

    expect(createEntry).toBeDefined();
    expect(createEntries).toBeDefined();
    expect(createForm).toBeDefined();
    expect(validateValueStore).toBeDefined();
    expect(validate).toBeDefined();
    expect(clearErrors).toBeDefined();
    expect(getValues).toBeDefined();
  });

  it('createEntry', () => {
    instance = createInstance();
    const { createEntry } = instance;

    const withValueEntry = createEntry({ type: 'number', value: 10 });
    expect(get(withValueEntry[1])).toBe(10);
    const noValueEntry = createEntry({ type: 'number' });
    expect(get(noValueEntry[1])).toBe('');
  });

  describe('createEntries', () => {
    it('array', () => {
      instance = createInstance();
      const { createEntries } = instance;
      const [
        entry1,
        entry2
      ] = createEntries([{ type: 'string', value: '1' }, { type: 'string', value: '2' }]);
      expect(get(entry1[1])).toBe('1');
      expect(get(entry2[1])).toBe('2');
      expect(entry1[2]).toEqual(jasmine.any(Function));
      expect(entry2[2]).toEqual(jasmine.any(Function));
    });

    it('object', () => {
      instance = createInstance();
      const { createEntries } = instance;
      const {
        first: entry1,
        second: entry2
      } = createEntries({
        first: { type: 'string', value: '1' },
        second: { type: 'string', value: '2' }
      });
      expect(get(entry1[1])).toBe('1');
      expect(get(entry2[1])).toBe('2');
      expect(entry1[2]).toEqual(jasmine.any(Function));
      expect(entry2[2]).toEqual(jasmine.any(Function));
    });
  });

  it('validateValueStore', () => {
    instance = createInstance();
    const [ errors, value ] = instance.createEntry({ type: 'email', required: true });
    spyOn(errors, 'set').and.callThrough();
    expect(instance.validateValueStore(value));
    expect(get(errors).length).toBe(1);
    expect(errors.set).toHaveBeenCalledTimes(1);
  });

  describe('validate', () => {
    let entry1, entry2;
    beforeEach(() => {
      instance = createInstance();
      [ entry1, entry2 ] = instance.createEntries([{ type: 'email', required: true }, { type: 'email', required: true }]);
      entry1[2](document.createElement('input'));
    });

    it('default', () => {
      instance.validate();
      expect(get(entry1[0]).length).toBe(1);
      expect(get(entry2[0]).length).toBe(0);
    });

    it('true', () => {
      instance.validate(true);
      expect(get(entry1[0]).length).toBe(1);
      expect(get(entry2[0]).length).toBe(1);
    });
  });

  describe('clearErrors', () => {
    let entry1, entry2;
    beforeEach(() => {
      instance = createInstance();
      [ entry1, entry2 ] = instance.createEntries([{ type: 'email', required: true }, { type: 'email', required: true }]);
      entry1[2](document.createElement('input'));
      spyOn(entry1[0], 'set').and.callThrough();
      spyOn(entry2[0], 'set').and.callThrough();
    });

    it('default', () => {
      instance.validate(true);
      instance.clearErrors();

      expect(get(entry1[0]).length).toBe(0);
      expect(get(entry2[0]).length).toBe(1);
      expect(entry1[0].set).toHaveBeenCalledTimes(2);
      expect(entry2[0].set).toHaveBeenCalledTimes(1);
    });

    it('true', () => {
      instance.validate(true);
      instance.clearErrors(true);

      expect(get(entry1[0]).length).toBe(0);
      expect(get(entry2[0]).length).toBe(0);
      expect(entry1[0].set).toHaveBeenCalledTimes(2);
      expect(entry2[0].set).toHaveBeenCalledTimes(2);
    });
  });

  describe('getValues', () => {
    it('default', () => {
      instance = createInstance({ includeAllEntries: true });
      const { createEntries, getValues } = instance;
      const entry1Params = { type: 'string', value: '1' };
      const entry2Params = { type: 'string', value: '2' };

      createEntries([entry1Params, entry2Params]);

      let values = getValues();
      let result = [];

      for (let value of values.values()) {
        result.push(value);
      }

      expect(result[0]).toBe('1');
      expect(result[1]).toBe('2');
    });
    it('with ids', () => {
      instance = createInstance({ includeAllEntries: true });
      const { createEntries, getValues } = instance;

      createEntries([
        { type: 'string', value: 'text', id: 'login' },
        { type: 'email', value: 'aa@aa.aa', id: 'email' }
      ]);

      let mapValues = getValues();
      let values = Object.fromEntries(mapValues.entries());
      expect(values.login).toBe('text');
      expect(values.email).toBe('aa@aa.aa');
      expect(mapValues.get('login')).toBe('text');
      expect(mapValues.get('email')).toBe('aa@aa.aa');
    });
    it('with custom function', () => {
      instance = createInstance({
        includeAllEntries: true,
        warningsEnabled: false,
        getValues: (entries) => {
          return entries.reduce((result, { value, params }) => {
            result[params.MY_KEY] = value;
            return result;
          }, {});
        }
      });

      const { createEntries, getValues } = instance;

      createEntries([
        { type: 'string', value: 'text', MY_KEY: 'login' },
        { type: 'email', value: 'aa@aa.aa', MY_KEY: 'email' }
      ]);

      let values = getValues();
      expect(values.login).toBe('text');
      expect(values.email).toBe('aa@aa.aa');
    });
  });

  describe('includeAllEntries option', () => {
    let entry1, entry2;

    it('validate without true', () => {
      instance = createInstance({ includeAllEntries: true });
      [ entry1, entry2 ] = instance.createEntries([{ type: 'email', required: true }, { type: 'email', required: true }]);
      entry1[2](document.createElement('input'));
      instance.validate();
      expect(get(entry1[0]).length).toBe(1);
      expect(get(entry2[0]).length).toBe(1);
    });

    it('clear errors without true', () => {
      instance = createInstance({ includeAllEntries: true });
      [ entry1, entry2 ] = instance.createEntries([{ type: 'email', required: true }, { type: 'email', required: true }]);
      entry1[2](document.createElement('input'));
      spyOn(entry1[0], 'set').and.callThrough();
      spyOn(entry2[0], 'set').and.callThrough();
      instance.validate(true);
      instance.clearErrors();
      expect(get(entry1[0]).length).toBe(0);
      expect(get(entry2[0]).length).toBe(0);
      expect(entry1[0].set).toHaveBeenCalledTimes(2);
      expect(entry2[0].set).toHaveBeenCalledTimes(2);
    });
  });

  describe('useCustomErrorsStore', () => {
    it('default', () => {
      instance = createInstance({ presence: 'required', includeAllEntries: true });
      const [ entry1, entry2, entry3 ] = instance.createEntries([
        { type: 'number', min: 3, max: 7 },
        { type: 'string', max: 7, value: '12345678' },
        { type: 'string', max: 7, value: '1234' }
      ]);
      instance.validate();

      const errorsStore1 = get(entry1[0]);
      const errorsStore2 = get(entry2[0]);
      const errorsStore3 = get(entry3[0]);

      expect(Array.isArray(errorsStore1)).toBe(true);
      expect(Array.isArray(errorsStore2)).toBe(true);
      expect(Array.isArray(errorsStore3)).toBe(true);

      expect(errorsStore1.sort()).toEqual(['min', 'max', 'required'].sort());
      expect(errorsStore2).toEqual(['max']);
      expect(errorsStore3).toEqual([]);
    });

    it('custom errors store', () => {
      instance = createInstance({
        presence: 'required', includeAllEntries: true,
        useCustomErrorsStore: (errors, params) => {
          return errors.reduce((result, ruleName) => {
            result[ruleName] = params[ruleName];
            return result;
          }, {});
        }
      });
      const [ entry1, entry2, entry3 ] = instance.createEntries([
        { type: 'number', min: 3, max: 7 },
        { type: 'string', max: 7, value: '12345678' },
        { type: 'string', max: 7, value: '1234' }
      ]);
      instance.validate();

      const errorsStore1 = get(entry1[0]);
      const errorsStore2 = get(entry2[0]);
      const errorsStore3 = get(entry3[0]);

      expect(errorsStore1 instanceof Object).toBe(true);
      expect(errorsStore2 instanceof Object).toBe(true);
      expect(errorsStore3 instanceof Object).toBe(true);

      expect(errorsStore1).toEqual({ min: 3, max: 7, required: true });
      expect(errorsStore2).toEqual({ max: 7 });
      expect(errorsStore3).toEqual({});
    });
  });
});
