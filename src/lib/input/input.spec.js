import Input from './input';

describe('input', () => {
  let instance;
  let node = document.createElement('input');
  let input = (phase) => new Input(node, {
    onClear() {},
    onValidate() {},
    validateOn: [],
    clearOn: [],
    inputValidationPhase: phase
  });

  afterEach(() => {
    instance.destroy();
  });

  it('constructor', () => {
    instance = input(0);
    expect(instance.node).toBeTruthy();
    expect(instance.options).toBeTruthy();
    expect(instance.currentPhase).toBeNull();
  });

  it('setPhase', () => {
    instance = input(0);
    expect(instance.currentPhase).toBeNull();
    instance.setPhase(2);
    expect(instance.currentPhase).toBe(2);
  });

  it('preventEvents with initial phase === NEVER', () => {
    instance = input(0);
    expect(instance.preventEvents()).toBeTrue();
    instance.setPhase(0);
    expect(instance.preventEvents()).toBeTrue();
    instance.setPhase(1);
    expect(instance.preventEvents()).toBeTrue();
    instance.setPhase(2);
    expect(instance.preventEvents()).toBeTrue();
  });

  it('preventEvents with initial phase === ALWAYS', () => {
    instance = input(1);
    expect(instance.preventEvents()).toBeFalse();
    instance.setPhase(0);
    expect(instance.preventEvents()).toBeFalse();
    instance.setPhase(1);
    expect(instance.preventEvents()).toBeFalse();
    instance.setPhase(2);
    expect(instance.preventEvents()).toBeFalse();
  });

  it('preventEvents with initial phase = AFTER SUBMIT', () => {
    instance = input(2);
    expect(instance.preventEvents()).toBeTrue();
    instance.setPhase(0);
    expect(instance.preventEvents()).toBeTrue();
    instance.setPhase(1);
    expect(instance.preventEvents()).toBeTrue();
    instance.setPhase(2);
    expect(instance.preventEvents()).toBeFalse();
  });
});
