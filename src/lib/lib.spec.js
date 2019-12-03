import Validation, { SvelidationPhaseEnum } from './lib';
import { get } from 'svelte/store';

describe('lib', () => {
  const createInstance = opts => new Validation(opts);
  let instance;

  afterEach(() => {
    instance.destroy();
  });

  describe('constructor', () => {
    it('default', () => {
      instance = createInstance();
      const { options } = instance;
      expect(options.validateOn).toEqual(['change']);
      expect(options.clearOn).toEqual(['reset']);
      expect(options.inputValidationPhase).toEqual(SvelidationPhaseEnum.afterFirstValidation);
      expect(instance.phase).toEqual(SvelidationPhaseEnum.never);
    });

    it('with null on clearOn and validateOn', () => {
      instance = createInstance({ clearOn: null, validateOn: null });
      expect(instance.options.validateOn).toEqual([]);
      expect(instance.options.clearOn).toEqual([]);
    });
  });

  it('prepareBaseParams', () => {
    instance = createInstance();
    expect(instance.options.presence).toBe('optional');
    expect(instance.options.trim).toBeFalse();
    expect(instance.prepareBaseParams({ a: 1 })).toEqual({ a: 1 });
    instance.options.presence = 'required';
    instance.options.trim = true;
    expect(instance.prepareBaseParams({ a: 1 })).toEqual({ a: 1, required: true, trim: true });
    expect(instance.prepareBaseParams({ a: 1, optional: true })).toEqual({ a: 1, optional: true, trim: true });
    expect(instance.prepareBaseParams({ a: true, trim: false })).toEqual({ a: true, trim: false, required: true });
  });

  it('createEntry', () => {
    instance = createInstance();

    const [ withValueStore ] = instance.createEntry({ type: 'number', value: 10 })
    expect(get(withValueStore).value).toBe(10);

    const [ store, email ] = instance.createEntry({ type: 'email' });
    const { destroy } = email(document.createElement('input'));
    expect(instance.entries.length).toBe(2);
    expect(instance.entries[0].input).toBeUndefined();
    expect(instance.entries[1].input).toBeDefined();
    expect(instance.entries[1].input.currentPhase).toEqual(instance.phase);

    destroy();

    expect(instance.entries[1].input).toBeUndefined();
  });

  describe('createEntries', () => {
    it('array', () => {
      instance = createInstance();
      spyOn(instance, 'createEntry').and.callThrough();
      const [
        [store1, input1],
        [store2, input2]
      ] = instance.createEntries([{ type: 'string', value: '1' }, { type: 'string', value: '2' }]);
      expect(get(store1).value).toBe('1');
      expect(get(store2).value).toBe('2');
      expect(input1).toEqual(jasmine.any(Function));
      expect(input2).toEqual(jasmine.any(Function));
      expect(instance.createEntry).toHaveBeenCalledTimes(2);
    });

    it('object', () => {
      instance = createInstance();
      const {
        first: [store1, input1],
        second: [store2, input2]
      } = instance.createEntries({
        first: { type: 'string', value: '1' },
        second: { type: 'string', value: '2' }
      });
      expect(get(store1).value).toBe('1');
      expect(get(store2).value).toBe('2');
      expect(input1).toEqual(jasmine.any(Function));
      expect(input2).toEqual(jasmine.any(Function));
    });
  });

  it('removeEntry', () => {
    instance = createInstance();
    const [
      [store1],
      [store2]
    ] = instance.createEntries([{ type: 'string', value: '1' }, { type: 'string', value: '2' }]);

    expect(instance.entries[0].store).not.toBe(store2);
    instance.removeEntry(instance.entries[0]);
    expect(instance.entries[0].store).toBe(store2);
  });

  it('createForm', () => {
    instance = createInstance();
    instance.clearErrors = jasmine.createSpy('clearErrors');
    const { createForm } = instance;
    const form = document.createElement('form');
    createForm(form);
    form.reset();
    expect(instance.clearErrors).toHaveBeenCalled();
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
      spyOn(instance, 'validateStore').and.callThrough();
      spyOn(instance, 'setValidationPhase');
    });

    it('default', () => {
      instance.validate();
      expect(get(store1).errors.length).toBe(1);
      expect(get(store2).errors.length).toBe(0);
      expect(instance.validateStore).toHaveBeenCalledTimes(1);
      expect(instance.validateStore).toHaveBeenCalledWith(store1);
      expect(instance.setValidationPhase).toHaveBeenCalledTimes(1);
      expect(instance.setValidationPhase).toHaveBeenCalledWith(SvelidationPhaseEnum.afterFirstValidation);
    });

    it('true', () => {
      instance.validate(true);
      expect(get(store1).errors.length).toBe(1);
      expect(get(store2).errors.length).toBe(1);
      expect(instance.validateStore).toHaveBeenCalledTimes(2);
      expect(instance.validateStore).toHaveBeenCalledWith(store1);
      expect(instance.setValidationPhase).toHaveBeenCalledTimes(1);
      expect(instance.setValidationPhase).toHaveBeenCalledWith(SvelidationPhaseEnum.afterFirstValidation);
    });
  });

  it('setValidationPhase', () => {
    instance = createInstance();
    const [ store, input ] = instance.createEntry({ type: 'email' });
    input(document.createElement('input'));
    spyOn(instance.entries[0].input, 'setPhase').and.callThrough();
    instance.setValidationPhase(SvelidationPhaseEnum.afterFirstValidation);

    expect(instance.entries[0].input.currentPhase).toBe(SvelidationPhaseEnum.afterFirstValidation);
    expect(instance.phase).toBe(SvelidationPhaseEnum.afterFirstValidation);
    expect(instance.entries[0].input.setPhase).toHaveBeenCalledTimes(1);
    expect(instance.entries[0].input.setPhase).toHaveBeenCalledWith(SvelidationPhaseEnum.afterFirstValidation);
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

  it('destroy', () => {
    instance = createInstance();
    const [ store, input ] = instance.createEntry({ type: 'email' });
    input(document.createElement('input'));
    spyOn(instance.entries[0].input, 'destroy');
    instance.destroy();
    expect(instance.entries[0].input.destroy).toHaveBeenCalled();
  });
});
