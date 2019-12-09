import { SvelidationFormElement, SvelidationFormElementOptions, ListenInputEventsEnum, ListenInputEventsType } from 'lib/typing/typing';

export default class FormElement implements SvelidationFormElement {
  node: HTMLInputElement;
  options: SvelidationFormElementOptions;
  currentPhase: ListenInputEventsType;
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

    const { change, blur } = this.options.validateOnEvents;
    const { focus } = this.options.clearErrorsOnEvents;

    if (change) {
      node.addEventListener('change', this.onValidate);
    }

    if (blur) {
      node.addEventListener('blur', this.onValidate);
    }

    if (focus) {
      node.addEventListener('focus', this.onClear);
    }
  }

  setPhase(phase: ListenInputEventsType) {
    this.currentPhase = phase;
  }

  preventEvents(): boolean {
    const { listenInputEvents: initialPhase } = this.options;
    if (initialPhase === ListenInputEventsEnum.never) {
      return true;
    }

    if (initialPhase === ListenInputEventsEnum.always) {
      return false;
    }

    return this.currentPhase < initialPhase;
  }

  destroy() {
    this.node.removeEventListener('change', this.onValidate);
    this.node.removeEventListener('blur', this.onValidate);
    this.node.removeEventListener('focus', this.onClear);
  }
}
