import { writable, get } from 'svelte/store';
import { validate as validateValueByParams } from 'lib/validator/validator';
import updateStoreErrors from 'lib/update-store-errors/update-store-errors';
import FormElement from 'lib/form-element/form-element';
import isFunction from 'lib/is-function/is-function';
import {
  SvelidationEntryParams, SvelidationEntry,
  SvelidationPhase, SvelidationPhaseType,
  SvelidationOptions, SvelidationStoreType,
  SvelidationUseInputFunction, SvelidationUseFunctionReturn,
  SvelidationCreateEntriesData, SvelidationFormEvents
} from 'lib/typing/typing';

export { SvelidationPhase } from 'lib/typing/typing';

export default class Validation {
  entries: SvelidationEntry[];
  options: SvelidationOptions;
  phase: SvelidationPhaseType;

  constructor(options?: SvelidationOptions) {
    this.entries = [];
    this.options = Object.assign({
      validateOn: ['change'],
      clearOn: ['reset'],
      listenInputEvents: SvelidationPhase.afterValidation,
      presence: 'optional',
      trim: false
    }, options);

    // ensure options as array
    if (!this.options.clearOn) {
      this.options.clearOn = [];
    }

    if (!this.options.validateOn) {
      this.options.validateOn = [];
    }

    this.phase = SvelidationPhase.never;
    this.createForm = this.createForm.bind(this);
  }

  createEntry(createEntryParams: SvelidationEntryParams): [SvelidationStoreType, SvelidationUseInputFunction] {
    const { value = '', ...params } = createEntryParams;
    const store: SvelidationStoreType = writable({ value, errors: [] });
    const entry: SvelidationEntry = { store, params };
    const useInput: SvelidationUseInputFunction = (inputNode, useOptions) => {
      const formElementOptions = Object.assign({}, this.options, useOptions, {
        onClear: () => {
          updateStoreErrors(store, []);
        },
        onValidate: () => {
          this.validateStore(store);
        },
        clearOn: this.options.clearOn.filter(event => event !== 'reset')
      });

      if (!entry.formElements) {
        entry.formElements = [];
      }

      const newElement = new FormElement(inputNode, formElementOptions);
      newElement.setPhase(this.phase);
      entry.formElements.push(newElement);

      return {
        destroy: () => {
          for (let i = 0; i < entry.formElements.length; i++) {
            const formElement = entry.formElements[i];
            if (formElement.node === inputNode) {
              entry.formElements.splice(i, 1);
              formElement.destroy();
              break;
            }
          }

          if (!entry.formElements.length) {
            delete entry.formElements;
          }
        }
      };
    };

    this.entries.push(entry);

    return [ store, useInput ];
  }

  createEntries(data: SvelidationCreateEntriesData) {
    if (Array.isArray(data)) {
      return data.map(_ => this.createEntry(_));
    } else {
      return Object.keys(data).reduce((sum, currentKey) => {
        return Object.assign(sum, {
          [currentKey]: this.createEntry(data[currentKey])
        });
      }, {});
    }
  }

  removeEntry(entry: SvelidationEntry) {
    this.entries = this.entries.filter(_ => entry !== _);
  }

  createForm(formNode: HTMLFormElement, events: SvelidationFormEvents = {}): SvelidationUseFunctionReturn {
    const { onFail: fail, onSubmit: submit, onSuccess: success } = events;
    const onReset = () => this.clearErrors();
    const onSubmit = e => {
      const errors = this.validate();
      isFunction(submit) && submit(e, errors);
      if (errors.length) {
        isFunction(fail) && fail(errors);
      } else {
        isFunction(success) && success();
      }
    };

    formNode.addEventListener('submit', onSubmit);
    if (this.options.clearOn.indexOf('reset') > -1) {
      formNode.addEventListener('reset', onReset);
    }

    return {
      destroy: () => {
        formNode.removeEventListener('submit', onSubmit);
        formNode.removeEventListener('reset', onReset);
      }
    };
  }

  prepareBaseParams(params) {
    const { trim, required, optional } = params;
    if (this.options.presence === 'required' && required === undefined && optional === undefined) {
      params.required = true;
    }

    if (this.options.trim && trim === undefined) {
      params.trim = true;
    }

    return {...params};
  }

  validateStore(store: SvelidationStoreType): any[] {
    const entry = this.entries.find(entry => (entry.store === store));
    if (entry) {
      const { value } = get(store);
      const errors = validateValueByParams(value, this.prepareBaseParams(entry.params));

      if (Array.isArray(errors)) {
        updateStoreErrors(store, errors);
        return errors;
      }
    }

    return [];
  }

  validate(includeNoFormElements = false): any[] {
    const errors = this.entries.reduce((errors, entry) => {
      if (entry.formElements || includeNoFormElements) {
        const storeErrors = this.validateStore(entry.store);
        if (storeErrors.length) {
          errors.push({ [entry.params.type]: storeErrors });
        }
      }

      return errors;
    }, []);

    this.setValidationPhase(SvelidationPhase.afterValidation);

    return errors;
  }

  setValidationPhase(phase: SvelidationPhaseType) {
    this.phase = phase;

    this.entries.forEach(({ formElements }) => {
      if (formElements) {
        formElements.forEach(formElement => formElement.setPhase(phase));
      }
    });
  }

  clearErrors(includeNoFormElements = false) {
    this.entries.forEach(entry => {
      if (entry.formElements || includeNoFormElements) {
        updateStoreErrors(entry.store, []);
      }
    });
  }

  destroy() {
    this.entries.forEach(entry => {
      if (entry.formElements) {
        entry.formElements.forEach(formElement => formElement.destroy());
      }
    });
  }
}
