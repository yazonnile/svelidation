import { writable, get } from 'svelte/store';
import { validate as validateValueByParams } from 'lib/validator/validator';
import updateStoreErrors from 'lib/update-store-errors/update-store-errors';
import Input from 'lib/input/input';
import isFunction from 'lib/is-function/is-function';
import {
  SvelidationEntryParamsInterface, SvelidationEntryInterface,
  SvelidationPhaseEnum, SvelidationPhaseEnumType,
  SvelidationOptionsInterface, SvelidationStoreType,
  SvelidationUseInputFunctionInterface, SvelidationUseFunctionReturn,
  SvelidationCreateEntriesDataInterface, SvelidationFormEventsInterface
} from 'lib/typing/typing';

export { SvelidationPhaseEnum } from 'lib/typing/typing';

export default class Validation {
  entries: SvelidationEntryInterface[];
  options: SvelidationOptionsInterface;
  phase: SvelidationPhaseEnumType;

  constructor(options?: SvelidationOptionsInterface) {
    this.entries = [];
    this.options = Object.assign({
      validateOn: ['change'],
      clearOn: ['reset'],
      inputValidationPhase: SvelidationPhaseEnum.afterFirstValidation,
      presence: 'optional'
    }, options);

    // ensure options as array
    if (!this.options.clearOn) {
      this.options.clearOn = [];
    }

    if (!this.options.validateOn) {
      this.options.validateOn = [];
    }

    this.phase = SvelidationPhaseEnum.never;
    this.createForm = this.createForm.bind(this);
  }

  preparePresence(params) {
    const { required, optional } = params;
    if (this.options.presence === 'required'
      && required === undefined
      && optional === undefined
    ) {
      params.required = true;
    }

    return params;
  }

  createEntry(params: SvelidationEntryParamsInterface): [SvelidationStoreType, SvelidationUseInputFunctionInterface] {
    const store: SvelidationStoreType = writable({ value: params.value || '', errors: [] });
    const entry: SvelidationEntryInterface = { store, params: this.preparePresence(params) };
    const useInput: SvelidationUseInputFunctionInterface = (inputNode, useOptions) => {
      const inputOptions = Object.assign({}, this.options, useOptions, {
        onClear: () => {
          updateStoreErrors(store, []);
        },
        onValidate: () => {
          this.validateStore(store);
        },
        clearOn: this.options.clearOn.filter(event => event !== 'reset')
      });

      entry.input = new Input(inputNode, inputOptions);
      entry.input.setPhase(this.phase);

      return {
        destroy: () => {
          entry.input.destroy();
          delete entry.input;
        }
      };
    };

    this.entries.push(entry);

    return [ store, useInput ];
  }

  createEntries(data: SvelidationCreateEntriesDataInterface) {
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

  removeEntry(entry: SvelidationEntryInterface) {
    this.entries = this.entries.filter(_ => entry !== _);
  }

  createForm(formNode: HTMLFormElement, events: SvelidationFormEventsInterface = {}): SvelidationUseFunctionReturn {
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

  validateStore(store: SvelidationStoreType): any[] {
    const entry = this.entries.find(entry => (entry.store === store));
    if (entry) {
      const { value } = get(store);
      const errors = validateValueByParams(value, entry.params);

      if (Array.isArray(errors)) {
        updateStoreErrors(store, errors);
        return errors;
      }
    }

    return [];
  }

  validate(includeNoInputs = false): any[] {
    const errors = this.entries.reduce((errors, entry) => {
      if (entry.input || includeNoInputs) {
        const storeErrors = this.validateStore(entry.store);
        if (storeErrors.length) {
          errors.push({ [entry.params.type]: storeErrors });
        }
      }

      return errors;
    }, []);

    this.setValidationPhase(SvelidationPhaseEnum.afterFirstValidation);

    return errors;
  }

  setValidationPhase(phase: SvelidationPhaseEnumType) {
    this.phase = phase;

    this.entries.forEach(({ input }) => {
      if (input) {
        input.setPhase(phase);
      }
    });
  }

  clearErrors(includeNoInputs = false) {
    this.entries.forEach(entry => {
      if (entry.input || includeNoInputs) {
        updateStoreErrors(entry.store, []);
      }
    });
  }

  destroy() {
    this.entries.forEach(entry => {
      if (entry.input) {
        entry.input.destroy();
      }
    });
  }
}
