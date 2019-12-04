import { SvelidationFormElement, SvelidationFormElementOptions, SvelidationPhase, SvelidationPhaseType } from 'lib/typing/typing';

export default class FormElement implements SvelidationFormElement {
  node: HTMLInputElement;
  options: SvelidationFormElementOptions;
  currentPhase: SvelidationPhaseType;
  onClear: () => void;
  onValidate: () => void;

  constructor(node: HTMLInputElement, options: SvelidationFormElementOptions) {
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

  setPhase(phase: SvelidationPhaseType) {
    this.currentPhase = phase;
  }

  preventEvents(): boolean {
    const { listenInputEvents: initialPhase } = this.options;
    if (initialPhase === SvelidationPhase.never) {
      return true;
    }

    if (initialPhase === SvelidationPhase.always) {
      return false;
    }

    return this.currentPhase < initialPhase;
  }

  destroy() {
    this.options.clearOn.forEach(eventName => this.node.removeEventListener(eventName, this.onClear));
    this.options.validateOn.forEach(eventName => this.node.removeEventListener(eventName, this.onValidate));
  }
}