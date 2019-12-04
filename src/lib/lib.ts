import updateStoreErrors from 'lib/update-store-errors/update-store-errors';
import { get, writable } from 'svelte/store';
import { validate as validateValueByParams } from 'lib/validator/validator';
import isFunction from 'lib/is-function/is-function';
import FormElement from 'lib/form-element/form-element';
import prepareBaseParams from 'lib/prepare-base-params/prepare-base-params';
import {
  SvelidationCreateEntriesData,
  SvelidationEntry,
  SvelidationEntryParams, SvelidationFormEvents,
  SvelidationOptions, SvelidationUseFunctionReturn,
  SvelidationPhase, SvelidationUseInputFunction,
  SvelidationPhaseType, SvelidationStoreType
} from 'lib/typing/typing';

const setValidationPhase = (entries: SvelidationEntry[], phase: SvelidationPhaseType) => {
  entries.forEach(({ formElements }) => {
    if (formElements) {
      formElements.forEach(formElement => formElement.setPhase(phase));
    }
  });
};

const createValidation = (opts?: SvelidationOptions) => {
  let phase: SvelidationPhaseType = SvelidationPhase.never;
  const entries: SvelidationEntry[] = [];
  const options: SvelidationOptions = Object.assign({
    validateOn: ['change'],
    clearOn: ['reset'],
    listenInputEvents: SvelidationPhase.afterValidation,
    presence: 'optional',
    trim: false
  }, opts);

  // ensure options as array
  if (!Array.isArray(options.clearOn)) {
    options.clearOn = [];
  }

  if (!Array.isArray(options.validateOn)) {
    options.validateOn = [];
  }

  const createEntry = (createEntryParams: SvelidationEntryParams): [SvelidationStoreType, SvelidationUseInputFunction] => {
    const { value = '', ...params } = createEntryParams;
    const store: SvelidationStoreType = writable({ value, errors: [] });
    const entry: SvelidationEntry = { store, params };
    const useInput: SvelidationUseInputFunction = (inputNode, useOptions) => {
      const formElementOptions = Object.assign({}, options, useOptions, {
        onClear: () => updateStoreErrors(store, []),
        onValidate: () => validateStore(store),
        clearOn: options.clearOn.filter(event => event !== 'reset')
      });

      if (!entry.formElements) {
        entry.formElements = [];
      }

      const newElement = new FormElement(inputNode, formElementOptions);
      newElement.setPhase(phase);
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

    entries.push(entry);

    return [ store, useInput ];
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
    if (options.clearOn.indexOf('reset') > -1) {
      formNode.addEventListener('reset', onReset);
    }

    return {
      destroy: () => {
        formNode.removeEventListener('submit', onSubmit);
        formNode.removeEventListener('reset', onReset);
      }
    };
  };

  const validateStore = (store: SvelidationStoreType): any[] => {
    const entry = entries.find(entry => (entry.store === store));
    if (entry) {
      const { value } = get(store);
      const errors = validateValueByParams(value, prepareBaseParams(entry.params, options));

      if (Array.isArray(errors)) {
        updateStoreErrors(store, errors);
        return errors;
      }
    }

    return [];
  };

  const validate = (includeNoFormElements = false): any[] => {
    const errors = entries.reduce((errors, entry) => {
      if (entry.formElements || includeNoFormElements) {
        const storeErrors = validateStore(entry.store);
        if (storeErrors.length) {
          errors.push({ [entry.params.type]: storeErrors });
        }
      }

      return errors;
    }, []);

    phase = SvelidationPhase.afterValidation;
    setValidationPhase(entries, SvelidationPhase.afterValidation);

    return errors;
  };

  const clearErrors = (includeNoFormElements = false) => {
    entries.forEach(entry => {
      if (entry.formElements || includeNoFormElements) {
        updateStoreErrors(entry.store, []);
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
    validateStore,
    validate,
    clearErrors,
    destroy
  }
};

export default createValidation;
export { SvelidationPhase };
