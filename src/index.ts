import { writable, get } from 'svelte/store';
import validateValueByParams from 'lib/validation/validation';
import updateStoreErrors from 'lib/update-store-errors/update-store-errors';
import Input from 'lib/input/input';
import isFunction from 'lib/is-function/is-function';
import {
  EntryParamsInterface, EntryInterface,
  PhaseEnum, PhaseEnumType,
  OptionsInterface, ErrorsType, StoreType,
  UseInputFunctionInterface, UseFunctionReturn,
  CreateEntriesDataInterface, FormEventsInterface
} from 'lib/typing/typing';

export { addValidator, BaseType, StringType, NumberType, EmailType } from 'lib/validation/validation';
export { PhaseEnum } from 'lib/typing/typing';

export default class Validation {
  entries: EntryInterface[];
  options: OptionsInterface;
  phase: PhaseEnumType;

  constructor(options?: OptionsInterface) {
    this.entries = [];
    this.options = Object.assign({
      validateOn: ['input'],
      clearOn: ['reset'],
      inputValidationPhase: PhaseEnum.afterFirstValidation
    }, options);

    // ensure options as array
    if (!this.options.clearOn) {
      this.options.clearOn = [];
    }

    if (!this.options.validateOn) {
      this.options.validateOn = [];
    }

    this.phase = PhaseEnum.never;
    this.createForm = this.createForm.bind(this);
  }

  createEntry(params: EntryParamsInterface): [StoreType, UseInputFunctionInterface] {
    const store: StoreType = writable({ value: params.value || '', errors: [] });
    const entry: EntryInterface = { store, params };
    const useInput: UseInputFunctionInterface = (inputNode, useOptions) => {
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

  createEntries(data: CreateEntriesDataInterface) {
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

  removeEntry(entry: EntryInterface) {
    this.entries = this.entries.filter(_ => entry !== _);
  }

  createForm(formNode: HTMLFormElement, events: FormEventsInterface = {}): UseFunctionReturn {
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

  validateStore(store: StoreType): ErrorsType {
    const entry = this.entries.find(entry => (entry.store === store));
    if (entry) {
      const { value } = get(store);
      const errors = validateValueByParams(value, entry.params);
      updateStoreErrors(store, errors);
      return errors;
    }

    return [];
  }

  validate(includeNoInputs = false): ErrorsType[] {
    const errors = this.entries.reduce((errors, entry) => {
      if (entry.input || includeNoInputs) {
        const storeErrors = this.validateStore(entry.store);
        if (storeErrors.length) {
          errors.push({ [entry.params.type]: storeErrors });
        }
      }

      return errors;
    }, []);

    this.updatePhase(PhaseEnum.afterFirstValidation);

    return errors;
  }

  updatePhase(phase: PhaseEnumType) {
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
}
