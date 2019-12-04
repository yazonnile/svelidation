import createValidation, { SvelidationPhase } from './lib';
import { get } from 'svelte/store';

describe('lib', () => {
  const createInstance = opts => createValidation(opts);
  let instance;

  afterEach(() => {
    instance.destroy();
  });

  it('constructor', () => {
    instance = createInstance();
    const { createEntry, createEntries, createForm, validateStore, validate, clearErrors, destroy } = instance;

    expect(createEntry).toBeDefined();
    expect(createEntries).toBeDefined();
    expect(createForm).toBeDefined();
    expect(validateStore).toBeDefined();
    expect(validate).toBeDefined();
    expect(clearErrors).toBeDefined();
    expect(destroy).toBeDefined();
  });

  it('createEntry', () => {
    instance = createInstance();
    const { createEntry } = instance;

    const [ withValueStore ] = createEntry({ type: 'number', value: 10 });
    expect(get(withValueStore).value).toBe(10);
    const [ store ] = createEntry({ type: 'number' });
    expect(get(store).value).toBe('');
  });

  describe('createEntries', () => {
    it('array', () => {
      instance = createInstance();
      const { createEntries } = instance;
      const [
        [store1, input1],
        [store2, input2]
      ] = createEntries([{ type: 'string', value: '1' }, { type: 'string', value: '2' }]);
      expect(get(store1).value).toBe('1');
      expect(get(store2).value).toBe('2');
      expect(input1).toEqual(jasmine.any(Function));
      expect(input2).toEqual(jasmine.any(Function));
    });

    it('object', () => {
      instance = createInstance();
      const { createEntries } = instance;
      const {
        first: [store1, input1],
        second: [store2, input2]
      } = createEntries({
        first: { type: 'string', value: '1' },
        second: { type: 'string', value: '2' }
      });
      expect(get(store1).value).toBe('1');
      expect(get(store2).value).toBe('2');
      expect(input1).toEqual(jasmine.any(Function));
      expect(input2).toEqual(jasmine.any(Function));
    });
  });

  it('validateStore', () => {
    instance = createInstance();
    const [ store ] = instance.createEntry({ type: 'email', required: true });
    spyOn(store, 'update').and.callThrough();
    expect(instance.validateStore(store));
    expect(get(store).errors.length).toBe(1);
    expect(store.update).toHaveBeenCalledTimes(1);
  });

  describe('validate', () => {
    let store1, store2, input1, input2;
    beforeEach(() => {
      instance = createInstance();
      const result = instance.createEntries([{ type: 'email', required: true }, { type: 'email', required: true }]);
      store1 = result[0][0];
      store2 = result[1][0];
      input1 = result[0][1];
      input2 = result[1][1];
      input1(document.createElement('input'));
    });

    it('default', () => {
      instance.validate();
      expect(get(store1).errors.length).toBe(1);
      expect(get(store2).errors.length).toBe(0);
    });

    it('true', () => {
      instance.validate(true);
      expect(get(store1).errors.length).toBe(1);
      expect(get(store2).errors.length).toBe(1);
    });
  });

  describe('clearErrors', () => {
    let store1, store2, input1, input2;
    beforeEach(() => {
      instance = createInstance();
      const result = instance.createEntries([{ type: 'email', required: true }, { type: 'email', required: true }]);
      store1 = result[0][0];
      store2 = result[1][0];
      input1 = result[0][1];
      input2 = result[1][1];
      input1(document.createElement('input'));
      spyOn(store1, 'update').and.callThrough();
      spyOn(store2, 'update').and.callThrough();
    });

    it('default', () => {
      instance.validate(true);
      instance.clearErrors();

      expect(get(store1).errors.length).toBe(0);
      expect(get(store2).errors.length).toBe(1);
      expect(store1.update).toHaveBeenCalledTimes(2);
      expect(store2.update).toHaveBeenCalledTimes(1);
    });

    it('true', () => {
      instance.validate(true);
      instance.clearErrors(true);

      expect(get(store1).errors.length).toBe(0);
      expect(get(store2).errors.length).toBe(0);
      expect(store1.update).toHaveBeenCalledTimes(2);
      expect(store2.update).toHaveBeenCalledTimes(2);
    });
  });
});
