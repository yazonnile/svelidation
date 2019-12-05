import createValidation from './lib';
import { get } from 'svelte/store';

describe('lib', () => {
  const createInstance = opts => createValidation(opts);
  let instance;

  afterEach(() => {
    instance.destroy();
  });

  it('constructor', () => {
    instance = createInstance();
    const { createEntry, createEntries, createForm, validateValueStore, validate, clearErrors, destroy } = instance;

    expect(createEntry).toBeDefined();
    expect(createEntries).toBeDefined();
    expect(createForm).toBeDefined();
    expect(validateValueStore).toBeDefined();
    expect(validate).toBeDefined();
    expect(clearErrors).toBeDefined();
    expect(destroy).toBeDefined();
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
});
