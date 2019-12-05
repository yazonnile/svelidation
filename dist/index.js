import { writable, get } from 'svelte/store';

var ListenInputEventsEnum;
(function (ListenInputEventsEnum) {
    ListenInputEventsEnum[ListenInputEventsEnum["never"] = 0] = "never";
    ListenInputEventsEnum[ListenInputEventsEnum["always"] = 1] = "always";
    ListenInputEventsEnum[ListenInputEventsEnum["afterValidation"] = 2] = "afterValidation";
})(ListenInputEventsEnum || (ListenInputEventsEnum = {}));
var SvelidationPresence;
(function (SvelidationPresence) {
    SvelidationPresence["required"] = "required";
    SvelidationPresence["optional"] = "optional";
})(SvelidationPresence || (SvelidationPresence = {}));

var isFunction = (f) => {
    return typeof f === 'function';
};

class FormElement {
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
    setPhase(phase) {
        this.currentPhase = phase;
    }
    preventEvents() {
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
        this.node.removeEventListener('blur', this.onClear);
    }
}

const prepareBaseParams = (entryParams, validationOptions) => {
    const { trim: entryTrim, required, optional } = entryParams;
    const { presence, trim: optionsTrim } = validationOptions;
    const output = { ...entryParams };
    if (presence === SvelidationPresence.required && required === undefined && optional === undefined) {
        output.required = true;
    }
    if (optionsTrim && entryTrim === undefined) {
        output.trim = true;
    }
    return output;
};

let globals = [];
let typeRules = {};
let types = {};
let rules = {};
const addSpy = (spy, params) => {
    if (!params) {
        globals.push(spy);
    }
    else {
        const { type, ruleName } = params;
        if (type && ruleName) {
            if (!typeRules[type])
                typeRules[type] = {};
            if (!typeRules[type][ruleName])
                typeRules[type][ruleName] = [];
            typeRules[type][ruleName].push(spy);
        }
        else {
            const list = type ? types : rules;
            const key = type || ruleName;
            if (!list[key])
                list[key] = [];
            list[key].push(spy);
        }
    }
    return () => removeSpy(spy, params);
};
const getSpies = (params) => {
    if (!params) {
        return globals;
    }
    try {
        const { type: typeName, ruleName } = params;
        if (typeName && ruleName) {
            return typeRules[typeName][ruleName] || [];
        }
        else if (typeName) {
            return types[typeName] || [];
        }
        else {
            return rules[ruleName] || [];
        }
    }
    catch (e) {
        return [];
    }
};
const removeSpy = (spy, params) => {
    const list = getSpies(params);
    if (!list) {
        return false;
    }
    const spyPosition = list.indexOf(spy);
    return list.splice(spyPosition, spyPosition === -1 ? 0 : 1).length > 0;
};
const removeSpies = (params) => {
    if (!params) {
        globals.length = 0;
        typeRules = {};
        types = {};
        rules = {};
        return true;
    }
    const list = getSpies(params);
    if (!list) {
        return false;
    }
    list.length = 0;
    return true;
};

let types$1 = {};
let rules$1 = {};
const ensureType = (typeName, typeRules) => {
    if (typeof typeRules !== 'object') {
        return;
    }
    Object.keys(typeRules).reduce((obj, key) => {
        const rule = typeRules[key];
        try {
            if (typeof rule === 'string') {
                const [typeName, ruleName] = rule.split('.');
                const inheritedRule = getType(typeName)[ruleName];
                if (isFunction(inheritedRule)) {
                    obj[ruleName] = inheritedRule;
                }
            }
            else if (isFunction(rule)) {
                obj[key] = rule;
            }
        }
        catch (e) {
            delete obj[key];
        }
        return obj;
    }, typeRules);
    if (!types$1[typeName]) {
        if (!isFunction(typeRules.typeCheck)) {
            return;
        }
        types$1[typeName] = {};
    }
    Object.assign(types$1[typeName], typeRules);
};
const resetType = (typeName) => {
    if (!typeName) {
        types$1 = {};
        Object.keys(installType).forEach(key => installType[key]());
    }
    else {
        delete types$1[typeName];
        if (installType[typeName]) {
            installType[typeName]();
        }
    }
};
const resetRule = (ruleName) => {
    if (!ruleName) {
        rules$1 = {};
        Object.keys(installRule).forEach(key => installRule[key]());
    }
    else {
        delete rules$1[ruleName];
        if (installRule[ruleName]) {
            installRule[ruleName]();
        }
    }
};
const installType = {
    string: () => {
        ensureType('string', {
            typeCheck: (value) => (typeof value === 'string'),
            min: (value, { min }) => (value.length >= min),
            max: (value, { max }) => (value.length <= max),
            between: (value, { between }) => (value.length >= between[0] && value.length <= between[1])
        });
    },
    email: () => {
        ensureType('email', {
            typeCheck: (value) => (typeof value === 'string'
                && !!(String(value)).match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/))
        });
    },
    number: () => {
        ensureType('number', {
            typeCheck: (value) => (typeof value === 'number' || (typeof value === 'string' && (value === '' || !isNaN(parseFloat(value))))),
            min: (value, { min }) => (parseFloat(value) >= min),
            max: (value, { max }) => (parseFloat(value) <= max),
            between: (value, { between }) => (value >= between[0] && value <= between[1])
        });
    },
    boolean: () => {
        ensureType('boolean', {
            typeCheck: (value) => typeof value === 'boolean',
            required: (value) => value,
        });
    },
    array: () => {
        ensureType('array', {
            typeCheck: (value) => Array.isArray(value),
            required: (value) => value.length > 0,
            min: (value, { min }) => value.length >= min,
            max: (value, { max }) => value.length <= max,
            equal: (value, { equal }) => {
                if (isFunction(equal)) {
                    return equal(value);
                }
                return value.sort().toString() === equal.sort().toString();
            },
            includes: (value, { includes }) => value.includes(includes)
        });
    },
};
const installRule = {
    equal: () => {
        ensureRule('equal', (value, { equal }) => {
            if (isFunction(equal)) {
                return equal(value);
            }
            return value === equal;
        });
    },
    match: () => {
        ensureRule('match', (value, { match }) => !!(String(value)).match(match));
    },
    required: () => {
        ensureRule('required', (value) => {
            if (value === undefined || value === null) {
                return false;
            }
            if (typeof value === 'number') {
                return !isNaN(value);
            }
            return !!String(value);
        });
    }
};
const ensureRule = (ruleName, rule) => {
    if (!isFunction(rule)) {
        return;
    }
    Object.assign(rules$1, {
        [ruleName]: rule
    });
};
const getType = (typeName) => types$1[typeName];
const getRule = (ruleName) => rules$1[ruleName];
resetType();
resetRule();

const runRuleWithSpies = ({ value, params: initialParams, rule, ruleName, spies }) => {
    const errors = [];
    const { type } = initialParams;
    let nextValue = value;
    let nextParams = initialParams;
    let stop = false;
    let abort = false;
    for (let i = 0; i < spies.length; i++) {
        stop = true;
        const spyErrors = spies[i](nextValue, { type, ruleName, ...nextParams }, (value, params = {}) => {
            nextValue = value;
            nextParams = { ...initialParams, ...params };
            stop = false;
        }, () => {
            abort = true;
        });
        if (abort) {
            return { abort };
        }
        if (Array.isArray(spyErrors)) {
            errors.push(...spyErrors);
        }
        if (stop) {
            break;
        }
    }
    if (!stop && !rule(nextValue, nextParams)) {
        errors.push(ruleName);
    }
    return { errors, stop };
};
const getScope = ({ type, optional, ...rules }) => {
    const typeRules = getType(type);
    if (!typeRules) {
        return {};
    }
    return [...Object.keys(rules), 'typeCheck'].reduce((obj, ruleName) => {
        const rule = typeRules[ruleName] || getRule(ruleName);
        if (rule) {
            obj[ruleName] = rule;
        }
        return obj;
    }, {});
};
const skipValidation = (value, { optional, required = false }) => {
    const valueIsAbsent = [undefined, null, ''].indexOf(value) > -1;
    const valueIsOptional = typeof optional === 'boolean' ? optional : !required;
    return valueIsAbsent && valueIsOptional;
};
const validate = (value, validateParams) => {
    const { trim = false, ...params } = validateParams;
    if (trim && typeof value === 'string') {
        value = value.trim();
    }
    const { required, optional, type } = params;
    const globalSpies = getSpies();
    const typeSpies = getSpies({ type });
    const scope = getScope(params);
    // no typeCheck - no party
    if (!isFunction(scope.typeCheck)) {
        return [];
    }
    // skip for empty and optional fields with no other rules except typeCheck provided
    if (skipValidation(value, { required, optional }) && Object.keys(scope).length === 1) {
        return [];
    }
    const result = [];
    // ensure typeCheck with first pick
    const ruleNames = Object.keys(scope).filter(key => (key !== 'typeCheck'));
    ruleNames.unshift('typeCheck');
    for (let i = 0; i < ruleNames.length; i++) {
        const typeRuleSpies = getSpies({ type, ruleName: ruleNames[i] });
        const ruleSpies = getSpies({ ruleName: ruleNames[i] });
        const { stop, errors, abort } = runRuleWithSpies({
            value, params,
            rule: scope[ruleNames[i]],
            ruleName: ruleNames[i],
            spies: [...globalSpies, ...typeSpies, ...typeRuleSpies, ...ruleSpies]
        });
        // exit validation with no errors in case of abort call
        if (abort) {
            return;
        }
        // stop validation with current errors in case of stop call
        // or if there are errors on first (typeCheck) step
        if (stop || (i === 0 && errors.length)) {
            return errors;
        }
        else {
            result.push(...errors);
        }
    }
    return result;
};

const setValidationPhase = (entries, phase) => {
    entries.forEach(({ formElements }) => {
        if (formElements) {
            formElements.forEach(formElement => formElement.setPhase(phase));
        }
    });
};
const createValidation = (opts) => {
    let phase = ListenInputEventsEnum.never;
    const entries = [];
    const options = Object.assign({
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
        }
    }, opts);
    if (typeof options.validateOnEvents !== 'object' || options.validateOnEvents === null) {
        options.validateOnEvents = {};
    }
    if (typeof options.clearErrorsOnEvents !== 'object' || options.clearErrorsOnEvents === null) {
        options.clearErrorsOnEvents = {};
    }
    const createEntry = (createEntryParams) => {
        const { value = '', ...params } = createEntryParams;
        const store = {
            errors: writable([]),
            value: writable(value)
        };
        const entry = { store, params };
        const useInput = (inputNode, useOptions) => {
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
                if (phase === ListenInputEventsEnum.always
                    || phase !== ListenInputEventsEnum.never
                    || phase > options.listenInputEvents) {
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
        return [store.errors, store.value, useInput];
    };
    const createEntries = (data) => {
        if (Array.isArray(data)) {
            return data.map(createEntry);
        }
        else {
            return Object.keys(data).reduce((sum, currentKey) => {
                return Object.assign(sum, {
                    [currentKey]: createEntry(data[currentKey])
                });
            }, {});
        }
    };
    const createForm = (formNode, events = {}) => {
        const { onFail: fail, onSubmit: submit, onSuccess: success } = events;
        const onReset = () => clearErrors();
        const onSubmit = e => {
            const errors = validate$1();
            isFunction(submit) && submit(e, errors);
            if (errors.length) {
                isFunction(fail) && fail(errors);
            }
            else {
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
    const validateValueStore = (value) => {
        const entry = entries.find(entry => (entry.store.value === value));
        if (entry) {
            const value = get(entry.store.value);
            const errors = validate(value, prepareBaseParams(entry.params, options));
            if (Array.isArray(errors)) {
                entry.store.errors.set(errors);
                return errors;
            }
        }
        return [];
    };
    const validate$1 = (includeNoFormElements = false) => {
        const errors = entries.reduce((errors, entry) => {
            if (entry.formElements || includeNoFormElements || options.includeAllEntries) {
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
            if (entry.formElements || includeNoFormElements || options.includeAllEntries) {
                entry.store.errors.set([]);
            }
        });
    };
    return {
        createEntry,
        createEntries,
        createForm,
        validateValueStore,
        validate: validate$1,
        clearErrors,
    };
};

export default createValidation;
export { ListenInputEventsEnum, addSpy, ensureRule, ensureType, removeSpies, resetRule, resetType };
