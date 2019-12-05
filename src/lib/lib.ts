import {
  SvelidationCreateEntriesData, SvelidationEntry,
  SvelidationEntryParams, SvelidationFormEvents,
  SvelidationOptions, SvelidationUseFunctionReturn,
  ListenInputEventsEnum, SvelidationUseInputFunction,
  ListenInputEventsType, SvelidationStoreType
} from 'lib/typing/typing';
import { get, Writable, writable } from 'svelte/store';
import isFunction from 'lib/is-function/is-function';
import FormElement from 'lib/form-element/form-element';
import prepareBaseParams from 'lib/prepare-base-params/prepare-base-params';
import { validate as validateValueByParams } from 'lib/validator/validator';

const setValidationPhase = (entries: SvelidationEntry[], phase: ListenInputEventsType) => {
  entries.forEach(({ formElements }) => {
    if (formElements) {
      formElements.forEach(formElement => formElement.setPhase(phase));
    }
  });
};

const createValidation = (opts?: SvelidationOptions) => {
  let phase: ListenInputEventsType = ListenInputEventsEnum.never;
  const entries: SvelidationEntry[] = [];
  const options: SvelidationOptions = Object.assign({
    listenInputEvents: ListenInputEventsEnum.afterValidation,
    presence: 'optional',
    trim: false,
    validateOnEvents: {
      input: false,
      change: true,
      blur: false
    },
    clearErrorsOnEvents: {
      focus: false,
      reset: true
    }
  }, opts);

  if (typeof options.validateOnEvents !== 'object' || options.validateOnEvents === null) {
    options.validateOnEvents = {};
  }

  if (typeof options.clearErrorsOnEvents !== 'object' || options.clearErrorsOnEvents === null) {
    options.clearErrorsOnEvents = {};
  }

  const createEntry = (createEntryParams: SvelidationEntryParams): [Writable<any[]>, Writable<any>, SvelidationUseInputFunction] => {
    const { value = '', ...params } = createEntryParams;
    const store: SvelidationStoreType = {
      errors: writable([]),
      value: writable(value)
    };
    const entry: SvelidationEntry = { store, params };
    const useInput: SvelidationUseInputFunction = (inputNode, useOptions) => {
      const formElementOptions = Object.assign({}, options, useOptions, {
        onClear: () => store.errors.set([]),
        onValidate: () => validateValueStore(store.value)
      });

      if (!entry.formElements) {
        entry.formElements = [];
      }

      const newElement = new FormElement(inputNode, formElementOptions);
      newElement.setPhase(phase);
      entry.formElements.push(newElement);

      let subscribeEvent = true;
      const unsubscribe = formElementOptions.validateOnEvents.input && store.value.subscribe(() => {
        if (subscribeEvent) {
          subscribeEvent = false;
          return;
        }

        validateValueStore(store.value);
      });

      return {
        destroy: () => {
          if (isFunction(unsubscribe)) {
            unsubscribe();
          }

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

    entries.push(entry);

    return [ store.errors, store.value, useInput ];
  };

  const createEntries = (data: SvelidationCreateEntriesData) => {
    if (Array.isArray(data)) {
      return data.map(createEntry);
    } else {
      return Object.keys(data).reduce((sum, currentKey) => {
        return Object.assign(sum, {
          [currentKey]: createEntry(data[currentKey])
        });
      }, {});
    }
  };

  const createForm = (formNode: HTMLFormElement, events: SvelidationFormEvents = {}): SvelidationUseFunctionReturn => {
    const { onFail: fail, onSubmit: submit, onSuccess: success } = events;
    const onReset = () => clearErrors();
    const onSubmit = e => {
      const errors = validate();
      isFunction(submit) && submit(e, errors);
      if (errors.length) {
        isFunction(fail) && fail(errors);
      } else {
        isFunction(success) && success();
      }
    };

    formNode.addEventListener('submit', onSubmit);
    if (options.clearErrorsOnEvents.reset) {
      formNode.addEventListener('reset', onReset);
    }

    return {
      destroy: () => {
        formNode.removeEventListener('submit', onSubmit);
        formNode.removeEventListener('reset', onReset);
      }
    };
  };

  const validateValueStore = (value: Writable<any>): any[] => {
    const entry = entries.find(entry => (entry.store.value === value));
    if (entry) {
      const value = get(entry.store.value);
      const errors = validateValueByParams(value, prepareBaseParams(entry.params, options));

      if (Array.isArray(errors)) {
        entry.store.errors.set(errors);
        return errors;
      }
    }

    return [];
  };

  const validate = (includeNoFormElements = false): any[] => {
    const errors = entries.reduce((errors, entry) => {
      if (entry.formElements || includeNoFormElements) {
        const storeErrors = validateValueStore(entry.store.value);
        if (storeErrors.length) {
          errors.push({ [entry.params.type]: storeErrors });
        }
      }

      return errors;
    }, []);

    phase = ListenInputEventsEnum.afterValidation;
    setValidationPhase(entries, ListenInputEventsEnum.afterValidation);

    return errors;
  };

  const clearErrors = (includeNoFormElements = false) => {
    entries.forEach(entry => {
      if (entry.formElements || includeNoFormElements) {
        entry.store.errors.set([]);
      }
    });
  };

  const destroy = () => {
    entries.forEach(entry => {
      if (entry.formElements) {
        entry.formElements.forEach(formElement => formElement.destroy());
      }
    });
  };

  return {
    createEntry,
    createEntries,
    createForm,
    validateValueStore,
    validate,
    clearErrors,
    destroy
  }
};

export default createValidation;
export { ListenInputEventsEnum };
export { addSpy, removeSpies } from 'lib/validator/spy/spy';
export { ensureRule, ensureType, resetType, resetRule } from 'lib/validator/types/types';
