import { SvelidationInputInterface, SvelidationInputOptionsInterface, SvelidationPhaseEnum, SvelidationPhaseEnumType } from 'lib/typing/typing';

export default class Input implements SvelidationInputInterface {
  node: HTMLInputElement;
  options: SvelidationInputOptionsInterface;
  currentPhase: SvelidationPhaseEnumType;
  onClear: () => void;
  onValidate: () => void;

  constructor(node: HTMLInputElement, options: SvelidationInputOptionsInterface) {
    this.node = node;
    this.options = options;
    this.currentPhase = null;

    this.onClear = () => {
      if (!this.preventEvents()) {
        this.options.onClear();
      }
    };

    this.onValidate = () => {
      if (!this.preventEvents()) {
        this.options.onValidate();
      }
    };

    this.options.clearOn.forEach(eventName => node.addEventListener(eventName, this.onClear));
    this.options.validateOn.forEach(eventName => node.addEventListener(eventName, this.onValidate));
  }

  setPhase(phase: SvelidationPhaseEnumType) {
    this.currentPhase = phase;
  }

  preventEvents(): boolean {
    const { inputValidationPhase: initialPhase } = this.options;
    if (initialPhase === SvelidationPhaseEnum.never) {
      return true;
    }

    if (initialPhase === SvelidationPhaseEnum.always) {
      return false;
    }

    return this.currentPhase < initialPhase;
  }

  destroy() {
    this.options.clearOn.forEach(eventName => this.node.removeEventListener(eventName, this.onClear));
    this.options.validateOn.forEach(eventName => this.node.removeEventListener(eventName, this.onValidate));
  }
}
