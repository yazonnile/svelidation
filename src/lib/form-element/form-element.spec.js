import FormElement from './form-element';

describe('form-element', () => {
  let instance;
  let node = document.createElement('input');
  let formElement = (phase) => new FormElement(node, {
    onClear() {},
    onValidate() {},
    validateOnEvents: {},
    clearErrorsOnEvents: {},
    listenInputEvents: phase
  });

  afterEach(() => {
    instance.destroy();
  });

  it('constructor', () => {
    instance = formElement(0);
    expect(instance.node).toBeTruthy();
    expect(instance.options).toBeTruthy();
    expect(instance.currentPhase).toBeNull();
  });

  it('setPhase', () => {
    instance = formElement(0);
    expect(instance.currentPhase).toBeNull();
    instance.setPhase(2);
    expect(instance.currentPhase).toBe(2);
  });

  it('preventEvents with initial phase === NEVER', () => {
    instance = formElement(0);
    expect(instance.preventEvents()).toBeTrue();
    instance.setPhase(0);
    expect(instance.preventEvents()).toBeTrue();
    instance.setPhase(1);
    expect(instance.preventEvents()).toBeTrue();
    instance.setPhase(2);
    expect(instance.preventEvents()).toBeTrue();
  });

  it('preventEvents with initial phase === ALWAYS', () => {
    instance = formElement(1);
    expect(instance.preventEvents()).toBeFalse();
    instance.setPhase(0);
    expect(instance.preventEvents()).toBeFalse();
    instance.setPhase(1);
    expect(instance.preventEvents()).toBeFalse();
    instance.setPhase(2);
    expect(instance.preventEvents()).toBeFalse();
  });

  it('preventEvents with initial phase = AFTER SUBMIT', () => {
    instance = formElement(2);
    expect(instance.preventEvents()).toBeTrue();
    instance.setPhase(0);
    expect(instance.preventEvents()).toBeTrue();
    instance.setPhase(1);
    expect(instance.preventEvents()).toBeTrue();
    instance.setPhase(2);
    expect(instance.preventEvents()).toBeFalse();
  });
});
