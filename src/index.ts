import { writable, get } from 'svelte/store';
import validateValueByParams from 'lib/validation/validation';
import updateStore from 'lib/update-store/update-store';
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
      clearOn: [],
      inputValidationPhase: PhaseEnum.afterFirstValidation
    }, options);

    this.phase = PhaseEnum.never;
    this.createForm = this.createForm.bind(this);
  }

  createEntry(params: EntryParamsInterface): [StoreType, UseInputFunctionInterface] {
    const store: StoreType = writable({ value: params.value || '', errors: [] });
    const entry: EntryInterface = { store, params };
    const useInput: UseInputFunctionInterface = (inputNode, useOptions) => {
      const inputOptions = Object.assign({}, this.options, useOptions, {
        onClear: () => {
          updateStore(store, { errors: [] });
        },
        onValidate: () => {
          this.validateStore(store);
        }
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
    const onSubmit = e => {
      const errors = this.validateAll();
      isFunction(submit) && submit(e, errors);
      if (errors.length) {
        isFunction(fail) && fail(errors);
      } else {
        isFunction(success) && success();
      }
    };

    formNode.addEventListener('submit', onSubmit);

    return {
      destroy: () => {
        formNode.removeEventListener('submit', onSubmit);
      }
    };
  }

  validateStore(store: StoreType): ErrorsType {
    const entry = this.entries.find(entry => (entry.store === store));
    if (entry) {
      const { value } = get(store);
      const errors = validateValueByParams(value, entry.params);
      updateStore(store, { errors });
      return errors;
    }

    return [];
  }

  validateAll(): ErrorsType[] {
    const errors = this.entries.reduce((errors, entry) => {
      if (entry.input) {
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

  clearErrors() {
    this.entries.forEach(entry => {
      updateStore(entry.store, { errors: [] });
    });
  }
}
