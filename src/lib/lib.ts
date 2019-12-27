import {
  ListenInputEventsEnum,
  ListenInputEventsType,
  SvelidationCreateEntriesData,
  SvelidationEntry,
  SvelidationEntryParams,
  SvelidationFormEvents,
  SvelidationOptions,
  SvelidationStoreType,
  SvelidationUseFunctionReturn,
  SvelidationUseInputFunction
} from 'lib/typing/typing';
import { get, Writable, writable } from 'svelte/store';
import isFunction from 'lib/is-function/is-function';
import FormElement from 'lib/form-element/form-element';
import prepareBaseParams from 'lib/prepare-base-params/prepare-base-params';
import { validate as validateValueByParams } from 'lib/validator/validator';
import { disableWarn } from 'lib/warn/warn';

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
    includeAllEntries: false,
    validateOnEvents: {
      input: false,
      change: true,
      blur: false
    },
    clearErrorsOnEvents: {
      focus: false,
      reset: true
    },
    useCustomErrorsStore: false,
    getValues: false,
    warningsEnabled: true
  }, opts);

  if (!options.warningsEnabled) {
    disableWarn();
  }

  if (typeof options.validateOnEvents !== 'object' || options.validateOnEvents === null) {
    options.validateOnEvents = {};
  }

  if (typeof options.clearErrorsOnEvents !== 'object' || options.clearErrorsOnEvents === null) {
    options.clearErrorsOnEvents = {};
  }

  const getValues = () => {
    if (isFunction(options.getValues)) {
      return options.getValues(entries.map(entry => {
        return {
          params: entry.params,
          value: get(entry.store.value)
        }
      }));
    }

    return entries.reduce((result, entry) => {
      if (entry.formElements || options.includeAllEntries) {
        const { id } = entry.params;
        result.set(id || entry.params, get(entry.store.value));
      }

      return result;
    }, new Map());
  };

  const buildErrorsStore = (errors, entryParams = null) => {
    return isFunction(options.useCustomErrorsStore)
      ? options.useCustomErrorsStore(errors, entryParams)
      : errors;
  };

  const createEntry = (createEntryParams: SvelidationEntryParams): [Writable<any>, Writable<any>, SvelidationUseInputFunction] => {
    const { value = '', ...params } = createEntryParams;
    const store: SvelidationStoreType = {
      errors: writable(buildErrorsStore([])),
      value: writable(value)
    };
    const entry: SvelidationEntry = { store, params };
    const useInput: SvelidationUseInputFunction = (inputNode, useOptions) => {
      const formElementOptions = Object.assign({}, options, useOptions, {
        onClear: () => store.errors.set(buildErrorsStore([])),
        onValidate: () => validateValueStore(store.value)
      });

      if (!entry.formElements) {
        entry.formElements = [];
      }

      const newElement = new FormElement(inputNode, formElementOptions);
      newElement.setPhase(phase);
      entry.formElements.push(newElement);

      let preventFirstSubscriberEvent = true;
      const unsubscribe = formElementOptions.validateOnEvents.input && store.value.subscribe(() => {
        if (preventFirstSubscriberEvent) {
          preventFirstSubscriberEvent = false;
          return;
        }

        if (options.listenInputEvents === ListenInputEventsEnum.always
          || (options.listenInputEvents !== ListenInputEventsEnum.never && phase >= options.listenInputEvents)
        ) {
          validateValueStore(store.value);
        }
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
        isFunction(success) && success(getValues());
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

  const validateValueStore = (value: Writable<any>): any => {
    const entry = entries.find(entry => (entry.store.value === value));
    if (entry) {
      const value = get(entry.store.value);
      let errors = validateValueByParams(value, prepareBaseParams(entry.params, options));

      if (Array.isArray(errors)) {
        entry.store.errors.set(buildErrorsStore(errors, prepareBaseParams(entry.params, options)));
        return errors;
      }
    }

    return buildErrorsStore([]);
  };

  const validate = (includeNoFormElements = false): any => {
    const errors = entries.reduce((errors, entry) => {
      if (entry.formElements || includeNoFormElements || options.includeAllEntries) {
        const storeErrors = validateValueStore(entry.store.value);
        if (storeErrors.length) {
          errors.push({ [entry.params.type]: buildErrorsStore(storeErrors, prepareBaseParams(entry.params, options)) });
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
      if (entry.formElements || includeNoFormElements || options.includeAllEntries) {
        entry.store.errors.set(buildErrorsStore([]));
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
    getValues
  }
};

export default createValidation;
export { ListenInputEventsEnum };
export { addSpy, removeSpies } from 'lib/validator/spy/spy';
export { ensureRule, ensureType, resetType, resetRule } from 'lib/validator/types/types';
