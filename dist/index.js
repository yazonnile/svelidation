import { writable, get } from 'svelte/store';

class BaseType {
    constructor(value, params) {
        this.value = value;
        this.params = params;
        this.errors = [];
    }
    getValue() {
        return (this.value === undefined || this.value === null) ? '' : this.value;
    }
    optionalWithNoValue() {
        return !this.getValue() && this.params.optional;
    }
    typeValidation(regExp) {
        return this.getValue().toString().match(regExp);
    }
    matchRule() {
        return this.getValue().toString().match(this.params.match);
    }
    equalRule() {
        return this.getValue() === this.params.equal;
    }
    getErrors() {
        return this.errors;
    }
}

class StringType extends BaseType {
    getValue() {
        const { trim = true } = this.params;
        const value = super.getValue().toString();
        return trim ? value.trim() : value;
    }
    typeValidation() {
        return super.typeValidation(/.+/);
    }
    minLengthRule() {
        return this.getValue().length >= this.params.minLength;
    }
    maxLengthRule() {
        return this.getValue().length <= this.params.maxLength;
    }
}

class NumberType extends BaseType {
    getValue() {
        return parseFloat(super.getValue());
    }
    typeValidation() {
        return super.typeValidation(/\d+/);
    }
    minValueRule() {
        return this.getValue() >= this.params.minValue;
    }
    maxValueRule() {
        return this.getValue() <= this.params.maxValue;
    }
}

class EmailType extends BaseType {
    typeValidation() {
        return super.typeValidation(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    }
}

const validators = {
    string: StringType,
    number: NumberType,
    email: EmailType
};
const getRuleKeys = (params) => {
    const { type, value, trim, optional, ...rest } = params;
    return Object.keys(rest);
};
const addValidator = (key, typeClass) => {
    validators[key] = typeClass;
};
var validateValueByParams = (value, params) => {
    const { type } = params;
    const validatorClass = validators[type];
    if (!validatorClass) {
        console.warn(`validatorDoesntExist`);
        return [];
    }
    const instance = new validatorClass(value, params);
    // field is optional with empty value
    if (instance.optionalWithNoValue()) {
        return [];
    }
    const ruleKeys = getRuleKeys(params);
    if (ruleKeys.length) {
        return ruleKeys.reduce((errors, ruleKey) => {
            const ruleMethod = `${ruleKey}Rule`;
            if (typeof instance[ruleMethod] === 'function') {
                if (!instance[ruleMethod]()) {
                    errors.push(`${ruleKey}`);
                }
            }
            else {
                console.warn(`${type}::ruleDoesntExist::${ruleKey}`);
            }
            return errors;
        }, []);
    }
    else {
        if (typeof instance.typeValidation === 'function') {
            return instance.typeValidation() ? [] : ['type'];
        }
        else {
            console.warn(`${type}::typeValidationDoesntExist`);
            return [];
        }
    }
};

var updateStoreErrors = (store, errors = []) => {
    store.update(value => {
        return { ...value, errors };
    });
};

var PhaseEnum;
(function (PhaseEnum) {
    PhaseEnum[PhaseEnum["never"] = 0] = "never";
    PhaseEnum[PhaseEnum["always"] = 1] = "always";
    PhaseEnum[PhaseEnum["afterFirstValidation"] = 2] = "afterFirstValidation";
})(PhaseEnum || (PhaseEnum = {}));

class Input {
    constructor(node, options) {
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
    setPhase(phase) {
        this.currentPhase = phase;
    }
    preventEvents() {
        const { inputValidationPhase: initialPhase } = this.options;
        if (initialPhase === PhaseEnum.never) {
            return true;
        }
        if (initialPhase === PhaseEnum.always) {
            return false;
        }
        return this.currentPhase < initialPhase;
    }
    destroy() {
        this.options.clearOn.forEach(eventName => this.node.removeEventListener(eventName, this.onClear));
        this.options.validateOn.forEach(eventName => this.node.removeEventListener(eventName, this.onValidate));
    }
}

var isFunction = (f) => {
    return typeof f === 'function';
};

class Validation {
    constructor(options) {
        this.entries = [];
        this.options = Object.assign({
            validateOn: ['change'],
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
    createEntry(params) {
        const store = writable({ value: params.value || '', errors: [] });
        const entry = { store, params };
        const useInput = (inputNode, useOptions) => {
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
        return [store, useInput];
    }
    createEntries(data) {
        if (Array.isArray(data)) {
            return data.map(_ => this.createEntry(_));
        }
        else {
            return Object.keys(data).reduce((sum, currentKey) => {
                return Object.assign(sum, {
                    [currentKey]: this.createEntry(data[currentKey])
                });
            }, {});
        }
    }
    removeEntry(entry) {
        this.entries = this.entries.filter(_ => entry !== _);
    }
    createForm(formNode, events = {}) {
        const { onFail: fail, onSubmit: submit, onSuccess: success } = events;
        const onReset = () => this.clearErrors();
        const onSubmit = e => {
            const errors = this.validate();
            isFunction(submit) && submit(e, errors);
            if (errors.length) {
                isFunction(fail) && fail(errors);
            }
            else {
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
    validateStore(store) {
        const entry = this.entries.find(entry => (entry.store === store));
        if (entry) {
            const { value } = get(store);
            const errors = validateValueByParams(value, entry.params);
            updateStoreErrors(store, errors);
            return errors;
        }
        return [];
    }
    validate(includeNoInputs = false) {
        const errors = this.entries.reduce((errors, entry) => {
            if (entry.input || includeNoInputs) {
                const storeErrors = this.validateStore(entry.store);
                if (storeErrors.length) {
                    errors.push({ [entry.params.type]: storeErrors });
                }
            }
            return errors;
        }, []);
        this.setValidationPhase(PhaseEnum.afterFirstValidation);
        return errors;
    }
    setValidationPhase(phase) {
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

export default Validation;
export { BaseType, EmailType, NumberType, PhaseEnum, StringType, addValidator };
