function noop() { }
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function subscribe(store, callback) {
    const unsub = store.subscribe(callback);
    return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function get_store_value(store) {
    let value;
    subscribe(store, _ => value = _)();
    return value;
}
function component_subscribe(component, store, callback) {
    component.$$.on_destroy.push(subscribe(store, callback));
}

function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function element(name) {
    return document.createElement(name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function prevent_default(fn) {
    return function (event) {
        event.preventDefault();
        // @ts-ignore
        return fn.call(this, event);
    };
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function get_binding_group_value(group) {
    const value = [];
    for (let i = 0; i < group.length; i += 1) {
        if (group[i].checked)
            value.push(group[i].__value);
    }
    return value;
}
function to_number(value) {
    return value === '' ? undefined : +value;
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.data !== data)
        text.data = data;
}
function set_input_value(input, value) {
    if (value != null || input.value) {
        input.value = value;
    }
}
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
}
class HtmlTag {
    constructor(html, anchor = null) {
        this.e = element('div');
        this.a = anchor;
        this.u(html);
    }
    m(target, anchor = null) {
        for (let i = 0; i < this.n.length; i += 1) {
            insert(target, this.n[i], anchor);
        }
        this.t = target;
    }
    u(html) {
        this.e.innerHTML = html;
        this.n = Array.from(this.e.childNodes);
    }
    p(html) {
        this.d();
        this.u(html);
        this.m(this.t, this.a);
    }
    d() {
        this.n.forEach(detach);
    }
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
// TODO figure out if we still want to support
// shorthand events, or if we want to implement
// a real bubbling mechanism
function bubble(component, event) {
    const callbacks = component.$$.callbacks[event.type];
    if (callbacks) {
        callbacks.slice().forEach(fn => fn(event));
    }
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
function flush() {
    const seen_callbacks = new Set();
    do {
        // first, call beforeUpdate functions
        // and update components
        while (dirty_components.length) {
            const component = dirty_components.shift();
            set_current_component(component);
            update(component.$$);
        }
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                callback();
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update($$.dirty);
        run_all($$.before_update);
        $$.fragment && $$.fragment.p($$.dirty, $$.ctx);
        $$.dirty = null;
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    // onMount happens before the initial afterUpdate
    add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push(...new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = {};
    }
}
function make_dirty(component, key) {
    if (!component.$$.dirty) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty = blank_object();
    }
    component.$$.dirty[key] = true;
}
function init(component, options, instance, create_fragment, not_equal, props) {
    const parent_component = current_component;
    set_current_component(component);
    const prop_values = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty: null
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, prop_values, (key, ret, value = ret) => {
            if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                if ($$.bound[key])
                    $$.bound[key](value);
                if (ready)
                    make_dirty(component, key);
            }
            return ret;
        })
        : prop_values;
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(children(options.target));
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set() {
        // overridden by instance, if it has props
    }
}

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

var updateStoreErrors = (store, errors = []) => {
    store.update(value => {
        return { ...value, errors };
    });
};

const subscriber_queue = [];
/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
 */
function writable(value, start = noop) {
    let stop;
    const subscribers = [];
    function set(new_value) {
        if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (stop) { // store is ready
                const run_queue = !subscriber_queue.length;
                for (let i = 0; i < subscribers.length; i += 1) {
                    const s = subscribers[i];
                    s[1]();
                    subscriber_queue.push(s, value);
                }
                if (run_queue) {
                    for (let i = 0; i < subscriber_queue.length; i += 2) {
                        subscriber_queue[i][0](subscriber_queue[i + 1]);
                    }
                    subscriber_queue.length = 0;
                }
            }
        }
    }
    function update(fn) {
        set(fn(value));
    }
    function subscribe(run, invalidate = noop) {
        const subscriber = [run, invalidate];
        subscribers.push(subscriber);
        if (subscribers.length === 1) {
            stop = start(set) || noop;
        }
        run(value);
        return () => {
            const index = subscribers.indexOf(subscriber);
            if (index !== -1) {
                subscribers.splice(index, 1);
            }
            if (subscribers.length === 0) {
                stop();
                stop = null;
            }
        };
    }
    return { set, update, subscribe };
}

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
        this.options.clearOn.forEach(eventName => node.addEventListener(eventName, this.onClear));
        this.options.validateOn.forEach(eventName => node.addEventListener(eventName, this.onValidate));
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
        this.options.clearOn.forEach(eventName => this.node.removeEventListener(eventName, this.onClear));
        this.options.validateOn.forEach(eventName => this.node.removeEventListener(eventName, this.onValidate));
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
        if (installType[ruleName]) {
            installType[ruleName]();
        }
    }
};
const installType = {
    string: () => {
        ensureType('string', {
            typeCheck: (value) => (typeof value === 'string'),
            min: (value, { min }) => (value.length >= min),
            max: (value, { max }) => (value.length <= max),
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
            typeCheck: (value) => (typeof value === 'number' || !isNaN(parseFloat(value))),
            min: (value, { min }) => (parseFloat(value) >= min),
            max: (value, { max }) => (parseFloat(value) <= max),
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
            equal: (value, { equal }) => value.sort().toString() === equal.sort().toString(),
            includes: (value, { includes }) => value.includes(includes)
        });
    },
};
const installRule = {
    equal: () => {
        ensureRule('equal', (value, { equal }) => (value === equal));
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
        validateOn: ['change'],
        clearOn: ['reset'],
        listenInputEvents: ListenInputEventsEnum.afterValidation,
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
    const createEntry = (createEntryParams) => {
        const { value = '', ...params } = createEntryParams;
        const store = writable({ value, errors: [] });
        const entry = { store, params };
        const useInput = (inputNode, useOptions) => {
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
        return [store, useInput];
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
    const validateStore = (store) => {
        const entry = entries.find(entry => (entry.store === store));
        if (entry) {
            const { value } = get_store_value(store);
            const errors = validate(value, prepareBaseParams(entry.params, options));
            if (Array.isArray(errors)) {
                updateStoreErrors(store, errors);
                return errors;
            }
        }
        return [];
    };
    const validate$1 = (includeNoFormElements = false) => {
        const errors = entries.reduce((errors, entry) => {
            if (entry.formElements || includeNoFormElements) {
                const storeErrors = validateStore(entry.store);
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
        validate: validate$1,
        clearErrors,
        destroy
    };
};

/* src/docs/components/demo.svelte generated by Svelte v3.15.0 */

function create_if_block_5(ctx) {
	let p;

	return {
		c() {
			p = element("p");
			p.textContent = "Login should be at least 3 symbols long";
			attr(p, "class", "error");
		},
		m(target, anchor) {
			insert(target, p, anchor);
		},
		d(detaching) {
			if (detaching) detach(p);
		}
	};
}

// (44:4) {#if $loginStore.errors.includes('max')}
function create_if_block_4(ctx) {
	let p;

	return {
		c() {
			p = element("p");
			p.textContent = "Login should be not longer than 15 symbols";
			attr(p, "class", "error");
		},
		m(target, anchor) {
			insert(target, p, anchor);
		},
		d(detaching) {
			if (detaching) detach(p);
		}
	};
}

// (51:4) {#if $emailStore.errors.includes('typeCheck')}
function create_if_block_3(ctx) {
	let p;

	return {
		c() {
			p = element("p");
			p.textContent = "Email should be correct";
			attr(p, "class", "error");
		},
		m(target, anchor) {
			insert(target, p, anchor);
		},
		d(detaching) {
			if (detaching) detach(p);
		}
	};
}

// (58:4) {#if $ageStore.errors.includes('typeCheck')}
function create_if_block_2(ctx) {
	let p;

	return {
		c() {
			p = element("p");
			p.textContent = "Please, fill the number!";
			attr(p, "class", "error");
		},
		m(target, anchor) {
			insert(target, p, anchor);
		},
		d(detaching) {
			if (detaching) detach(p);
		}
	};
}

// (61:4) {#if $ageStore.errors.includes('min')}
function create_if_block_1(ctx) {
	let p;

	return {
		c() {
			p = element("p");
			p.textContent = "For boomers only!";
			attr(p, "class", "error");
		},
		m(target, anchor) {
			insert(target, p, anchor);
		},
		d(detaching) {
			if (detaching) detach(p);
		}
	};
}

// (67:2) {#if options && options.clearOn && options.clearOn.indexOf('reset') > -1}
function create_if_block(ctx) {
	let button;

	return {
		c() {
			button = element("button");
			button.textContent = "Reset";
			attr(button, "type", "reset");
		},
		m(target, anchor) {
			insert(target, button, anchor);
		},
		d(detaching) {
			if (detaching) detach(button);
		}
	};
}

function create_fragment(ctx) {
	let form;
	let h1;
	let t0;
	let html_tag;
	let raw1_value = `<pre><code>${ctx.defaultSettings ? "// default settings\n" : ""}createValidation(${JSON.stringify(ctx.options, null, "  ")});</code></pre>` + "";
	let t1;
	let label0;
	let t2;
	let input0;
	let loginInput_action;
	let t3;
	let show_if_5 = ctx.$loginStore.errors.includes("min");
	let t4;
	let show_if_4 = ctx.$loginStore.errors.includes("max");
	let t5;
	let label1;
	let t6;
	let input1;
	let emailInput_action;
	let t7;
	let show_if_3 = ctx.$emailStore.errors.includes("typeCheck");
	let t8;
	let label2;
	let t9;
	let input2;
	let ageInput_action;
	let t10;
	let show_if_2 = ctx.$ageStore.errors.includes("typeCheck");
	let t11;
	let show_if_1 = ctx.$ageStore.errors.includes("min");
	let t12;
	let button;
	let t14;
	let show_if = ctx.options && ctx.options.clearOn && ctx.options.clearOn.indexOf("reset") > -1;
	let createForm_action;
	let dispose;
	let if_block0 = show_if_5 && create_if_block_5();
	let if_block1 = show_if_4 && create_if_block_4();
	let if_block2 = show_if_3 && create_if_block_3();
	let if_block3 = show_if_2 && create_if_block_2();
	let if_block4 = show_if_1 && create_if_block_1();
	let if_block5 = show_if && create_if_block();

	return {
		c() {
			form = element("form");
			h1 = element("h1");
			t0 = space();
			t1 = space();
			label0 = element("label");
			t2 = text("Login\r\n    ");
			input0 = element("input");
			t3 = space();
			if (if_block0) if_block0.c();
			t4 = space();
			if (if_block1) if_block1.c();
			t5 = space();
			label1 = element("label");
			t6 = text("Email\r\n    ");
			input1 = element("input");
			t7 = space();
			if (if_block2) if_block2.c();
			t8 = space();
			label2 = element("label");
			t9 = text("Number\r\n    ");
			input2 = element("input");
			t10 = space();
			if (if_block3) if_block3.c();
			t11 = space();
			if (if_block4) if_block4.c();
			t12 = space();
			button = element("button");
			button.textContent = "Submit";
			t14 = space();
			if (if_block5) if_block5.c();
			html_tag = new HtmlTag(raw1_value, t1);
			attr(input0, "type", "text");
			attr(input1, "type", "email");
			attr(input2, "type", "text");
			attr(button, "type", "submit");
			form.noValidate = true;
			toggle_class(form, "success", ctx.success);

			dispose = [
				listen(input0, "input", ctx.input0_input_handler),
				listen(input1, "input", ctx.input1_input_handler),
				listen(input2, "input", ctx.input2_input_handler),
				listen(form, "submit", prevent_default(ctx.submit_handler))
			];
		},
		m(target, anchor) {
			insert(target, form, anchor);
			append(form, h1);
			h1.innerHTML = ctx.title;
			append(form, t0);
			html_tag.m(form);
			append(form, t1);
			append(form, label0);
			append(label0, t2);
			append(label0, input0);
			set_input_value(input0, ctx.$loginStore.value);
			loginInput_action = ctx.loginInput.call(null, input0) || ({});
			append(label0, t3);
			if (if_block0) if_block0.m(label0, null);
			append(label0, t4);
			if (if_block1) if_block1.m(label0, null);
			append(form, t5);
			append(form, label1);
			append(label1, t6);
			append(label1, input1);
			set_input_value(input1, ctx.$emailStore.value);
			emailInput_action = ctx.emailInput.call(null, input1) || ({});
			append(label1, t7);
			if (if_block2) if_block2.m(label1, null);
			append(form, t8);
			append(form, label2);
			append(label2, t9);
			append(label2, input2);
			set_input_value(input2, ctx.$ageStore.value);
			ageInput_action = ctx.ageInput.call(null, input2) || ({});
			append(label2, t10);
			if (if_block3) if_block3.m(label2, null);
			append(label2, t11);
			if (if_block4) if_block4.m(label2, null);
			append(form, t12);
			append(form, button);
			append(form, t14);
			if (if_block5) if_block5.m(form, null);

			createForm_action = ctx.createForm.call(null, form, {
				onSuccess: ctx.onSuccess,
				onFail: ctx.onFail
			}) || ({});
		},
		p(changed, ctx) {
			if (changed.title) h1.innerHTML = ctx.title;			if ((changed.defaultSettings || changed.options) && raw1_value !== (raw1_value = `<pre><code>${ctx.defaultSettings ? "// default settings\n" : ""}createValidation(${JSON.stringify(ctx.options, null, "  ")});</code></pre>` + "")) html_tag.p(raw1_value);

			if (changed.$loginStore && input0.value !== ctx.$loginStore.value) {
				set_input_value(input0, ctx.$loginStore.value);
			}

			if (changed.$loginStore) show_if_5 = ctx.$loginStore.errors.includes("min");

			if (show_if_5) {
				if (!if_block0) {
					if_block0 = create_if_block_5();
					if_block0.c();
					if_block0.m(label0, t4);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (changed.$loginStore) show_if_4 = ctx.$loginStore.errors.includes("max");

			if (show_if_4) {
				if (!if_block1) {
					if_block1 = create_if_block_4();
					if_block1.c();
					if_block1.m(label0, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (changed.$emailStore && input1.value !== ctx.$emailStore.value) {
				set_input_value(input1, ctx.$emailStore.value);
			}

			if (changed.$emailStore) show_if_3 = ctx.$emailStore.errors.includes("typeCheck");

			if (show_if_3) {
				if (!if_block2) {
					if_block2 = create_if_block_3();
					if_block2.c();
					if_block2.m(label1, null);
				}
			} else if (if_block2) {
				if_block2.d(1);
				if_block2 = null;
			}

			if (changed.$ageStore && input2.value !== ctx.$ageStore.value) {
				set_input_value(input2, ctx.$ageStore.value);
			}

			if (changed.$ageStore) show_if_2 = ctx.$ageStore.errors.includes("typeCheck");

			if (show_if_2) {
				if (!if_block3) {
					if_block3 = create_if_block_2();
					if_block3.c();
					if_block3.m(label2, t11);
				}
			} else if (if_block3) {
				if_block3.d(1);
				if_block3 = null;
			}

			if (changed.$ageStore) show_if_1 = ctx.$ageStore.errors.includes("min");

			if (show_if_1) {
				if (!if_block4) {
					if_block4 = create_if_block_1();
					if_block4.c();
					if_block4.m(label2, null);
				}
			} else if (if_block4) {
				if_block4.d(1);
				if_block4 = null;
			}

			if (changed.options) show_if = ctx.options && ctx.options.clearOn && ctx.options.clearOn.indexOf("reset") > -1;

			if (show_if) {
				if (!if_block5) {
					if_block5 = create_if_block();
					if_block5.c();
					if_block5.m(form, null);
				}
			} else if (if_block5) {
				if_block5.d(1);
				if_block5 = null;
			}

			if (changed.success) {
				toggle_class(form, "success", ctx.success);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(form);
			if (loginInput_action && is_function(loginInput_action.destroy)) loginInput_action.destroy();
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (emailInput_action && is_function(emailInput_action.destroy)) emailInput_action.destroy();
			if (if_block2) if_block2.d();
			if (ageInput_action && is_function(ageInput_action.destroy)) ageInput_action.destroy();
			if (if_block3) if_block3.d();
			if (if_block4) if_block4.d();
			if (if_block5) if_block5.d();
			if (createForm_action && is_function(createForm_action.destroy)) createForm_action.destroy();
			run_all(dispose);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let $loginStore;
	let $emailStore;
	let $ageStore;
	let { defaultSettings = false } = $$props;
	let { options = null } = $$props;
	let { title = "Default" } = $$props;
	const { createForm, createEntry } = createValidation(options);
	const [loginStore, loginInput] = createEntry({ type: "string", min: 5, max: 15 });
	component_subscribe($$self, loginStore, value => $$invalidate("$loginStore", $loginStore = value));
	const [emailStore, emailInput] = createEntry({ type: "email" });
	component_subscribe($$self, emailStore, value => $$invalidate("$emailStore", $emailStore = value));
	const [ageStore, ageInput] = createEntry({ type: "number", min: 18 });
	component_subscribe($$self, ageStore, value => $$invalidate("$ageStore", $ageStore = value));
	let success = false;

	const onSuccess = () => {
		$$invalidate("success", success = true);
	};

	const onFail = () => {
		$$invalidate("success", success = false);
	};

	function submit_handler(event) {
		bubble($$self, event);
	}

	function input0_input_handler() {
		$loginStore.value = this.value;
		loginStore.set($loginStore);
	}

	function input1_input_handler() {
		$emailStore.value = this.value;
		emailStore.set($emailStore);
	}

	function input2_input_handler() {
		$ageStore.value = this.value;
		ageStore.set($ageStore);
	}

	$$self.$set = $$props => {
		if ("defaultSettings" in $$props) $$invalidate("defaultSettings", defaultSettings = $$props.defaultSettings);
		if ("options" in $$props) $$invalidate("options", options = $$props.options);
		if ("title" in $$props) $$invalidate("title", title = $$props.title);
	};

	return {
		defaultSettings,
		options,
		title,
		createForm,
		loginStore,
		loginInput,
		emailStore,
		emailInput,
		ageStore,
		ageInput,
		success,
		onSuccess,
		onFail,
		$loginStore,
		$emailStore,
		$ageStore,
		submit_handler,
		input0_input_handler,
		input1_input_handler,
		input2_input_handler
	};
}

class Demo extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, { defaultSettings: 0, options: 0, title: 0 });
	}
}

/* src/docs/components/dynamic.svelte generated by Svelte v3.15.0 */

function create_if_block_6(ctx) {
	let label;
	let t0;
	let input;
	let input_updating = false;
	let ageInput_action;
	let t1;
	let show_if_1 = ctx.$ageStore.errors.includes("min");
	let t2;
	let show_if = ctx.$ageStore.errors.includes("typeCheck");
	let dispose;

	function input_input_handler_1() {
		input_updating = true;
		ctx.input_input_handler_1.call(input);
	}

	let if_block0 = show_if_1 && create_if_block_8();
	let if_block1 = show_if && create_if_block_7();

	return {
		c() {
			label = element("label");
			t0 = text("Number STEP 3\r\n      ");
			input = element("input");
			t1 = space();
			if (if_block0) if_block0.c();
			t2 = space();
			if (if_block1) if_block1.c();
			attr(input, "type", "number");
			dispose = listen(input, "input", input_input_handler_1);
		},
		m(target, anchor) {
			insert(target, label, anchor);
			append(label, t0);
			append(label, input);
			set_input_value(input, ctx.$ageStore.value);
			ageInput_action = ctx.ageInput.call(null, input) || ({});
			append(label, t1);
			if (if_block0) if_block0.m(label, null);
			append(label, t2);
			if (if_block1) if_block1.m(label, null);
		},
		p(changed, ctx) {
			if (!input_updating && changed.$ageStore) {
				set_input_value(input, ctx.$ageStore.value);
			}

			input_updating = false;
			if (changed.$ageStore) show_if_1 = ctx.$ageStore.errors.includes("min");

			if (show_if_1) {
				if (!if_block0) {
					if_block0 = create_if_block_8();
					if_block0.c();
					if_block0.m(label, t2);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (changed.$ageStore) show_if = ctx.$ageStore.errors.includes("typeCheck");

			if (show_if) {
				if (!if_block1) {
					if_block1 = create_if_block_7();
					if_block1.c();
					if_block1.m(label, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}
		},
		d(detaching) {
			if (detaching) detach(label);
			if (ageInput_action && is_function(ageInput_action.destroy)) ageInput_action.destroy();
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			dispose();
		}
	};
}

// (63:23) 
function create_if_block_3$1(ctx) {
	let label0;
	let t0;
	let input0;
	let emailInput_action;
	let t1;
	let show_if_1 = ctx.$emailStore.errors.includes("typeCheck");
	let t2;
	let label1;
	let t3;
	let input1;
	let email2Input_action;
	let t4;
	let show_if = ctx.$email2Store.errors.includes("typeCheck");
	let dispose;
	let if_block0 = show_if_1 && create_if_block_5$1();
	let if_block1 = show_if && create_if_block_4$1();

	return {
		c() {
			label0 = element("label");
			t0 = text("Email STEP 2\r\n      ");
			input0 = element("input");
			t1 = space();
			if (if_block0) if_block0.c();
			t2 = space();
			label1 = element("label");
			t3 = text("Email STEP 2\r\n      ");
			input1 = element("input");
			t4 = space();
			if (if_block1) if_block1.c();
			attr(input0, "type", "email");
			attr(input1, "type", "email");

			dispose = [
				listen(input0, "input", ctx.input0_input_handler),
				listen(input1, "input", ctx.input1_input_handler)
			];
		},
		m(target, anchor) {
			insert(target, label0, anchor);
			append(label0, t0);
			append(label0, input0);
			set_input_value(input0, ctx.$emailStore.value);
			emailInput_action = ctx.emailInput.call(null, input0) || ({});
			append(label0, t1);
			if (if_block0) if_block0.m(label0, null);
			insert(target, t2, anchor);
			insert(target, label1, anchor);
			append(label1, t3);
			append(label1, input1);
			set_input_value(input1, ctx.$email2Store.value);
			email2Input_action = ctx.email2Input.call(null, input1) || ({});
			append(label1, t4);
			if (if_block1) if_block1.m(label1, null);
		},
		p(changed, ctx) {
			if (changed.$emailStore && input0.value !== ctx.$emailStore.value) {
				set_input_value(input0, ctx.$emailStore.value);
			}

			if (changed.$emailStore) show_if_1 = ctx.$emailStore.errors.includes("typeCheck");

			if (show_if_1) {
				if (!if_block0) {
					if_block0 = create_if_block_5$1();
					if_block0.c();
					if_block0.m(label0, null);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (changed.$email2Store && input1.value !== ctx.$email2Store.value) {
				set_input_value(input1, ctx.$email2Store.value);
			}

			if (changed.$email2Store) show_if = ctx.$email2Store.errors.includes("typeCheck");

			if (show_if) {
				if (!if_block1) {
					if_block1 = create_if_block_4$1();
					if_block1.c();
					if_block1.m(label1, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}
		},
		d(detaching) {
			if (detaching) detach(label0);
			if (emailInput_action && is_function(emailInput_action.destroy)) emailInput_action.destroy();
			if (if_block0) if_block0.d();
			if (detaching) detach(t2);
			if (detaching) detach(label1);
			if (email2Input_action && is_function(email2Input_action.destroy)) email2Input_action.destroy();
			if (if_block1) if_block1.d();
			run_all(dispose);
		}
	};
}

// (52:2) {#if step === 1}
function create_if_block$1(ctx) {
	let label;
	let t0;
	let input;
	let loginInput_action;
	let t1;
	let show_if_1 = ctx.$loginStore.errors.includes("min");
	let t2;
	let show_if = ctx.$loginStore.errors.includes("max");
	let dispose;
	let if_block0 = show_if_1 && create_if_block_2$1();
	let if_block1 = show_if && create_if_block_1$1();

	return {
		c() {
			label = element("label");
			t0 = text("Login STEP 1\r\n      ");
			input = element("input");
			t1 = space();
			if (if_block0) if_block0.c();
			t2 = space();
			if (if_block1) if_block1.c();
			attr(input, "type", "text");
			dispose = listen(input, "input", ctx.input_input_handler);
		},
		m(target, anchor) {
			insert(target, label, anchor);
			append(label, t0);
			append(label, input);
			set_input_value(input, ctx.$loginStore.value);
			loginInput_action = ctx.loginInput.call(null, input) || ({});
			append(label, t1);
			if (if_block0) if_block0.m(label, null);
			append(label, t2);
			if (if_block1) if_block1.m(label, null);
		},
		p(changed, ctx) {
			if (changed.$loginStore && input.value !== ctx.$loginStore.value) {
				set_input_value(input, ctx.$loginStore.value);
			}

			if (changed.$loginStore) show_if_1 = ctx.$loginStore.errors.includes("min");

			if (show_if_1) {
				if (!if_block0) {
					if_block0 = create_if_block_2$1();
					if_block0.c();
					if_block0.m(label, t2);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (changed.$loginStore) show_if = ctx.$loginStore.errors.includes("max");

			if (show_if) {
				if (!if_block1) {
					if_block1 = create_if_block_1$1();
					if_block1.c();
					if_block1.m(label, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}
		},
		d(detaching) {
			if (detaching) detach(label);
			if (loginInput_action && is_function(loginInput_action.destroy)) loginInput_action.destroy();
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			dispose();
		}
	};
}

// (82:6) {#if $ageStore.errors.includes('min')}
function create_if_block_8(ctx) {
	let p;

	return {
		c() {
			p = element("p");
			p.textContent = "For boomers only!";
			attr(p, "class", "error");
		},
		m(target, anchor) {
			insert(target, p, anchor);
		},
		d(detaching) {
			if (detaching) detach(p);
		}
	};
}

// (85:6) {#if $ageStore.errors.includes('typeCheck')}
function create_if_block_7(ctx) {
	let p;

	return {
		c() {
			p = element("p");
			p.textContent = "Number plz!";
			attr(p, "class", "error");
		},
		m(target, anchor) {
			insert(target, p, anchor);
		},
		d(detaching) {
			if (detaching) detach(p);
		}
	};
}

// (67:6) {#if $emailStore.errors.includes('typeCheck')}
function create_if_block_5$1(ctx) {
	let p;

	return {
		c() {
			p = element("p");
			p.textContent = "Email should be correct";
			attr(p, "class", "error");
		},
		m(target, anchor) {
			insert(target, p, anchor);
		},
		d(detaching) {
			if (detaching) detach(p);
		}
	};
}

// (74:6) {#if $email2Store.errors.includes('typeCheck')}
function create_if_block_4$1(ctx) {
	let p;

	return {
		c() {
			p = element("p");
			p.textContent = "Email should be correct";
			attr(p, "class", "error");
		},
		m(target, anchor) {
			insert(target, p, anchor);
		},
		d(detaching) {
			if (detaching) detach(p);
		}
	};
}

// (56:6) {#if $loginStore.errors.includes('min')}
function create_if_block_2$1(ctx) {
	let p;

	return {
		c() {
			p = element("p");
			p.textContent = "Login should be at least 3 symbols long";
			attr(p, "class", "error");
		},
		m(target, anchor) {
			insert(target, p, anchor);
		},
		d(detaching) {
			if (detaching) detach(p);
		}
	};
}

// (59:6) {#if $loginStore.errors.includes('max')}
function create_if_block_1$1(ctx) {
	let p;

	return {
		c() {
			p = element("p");
			p.textContent = "Login should be not longer than 15 symbols";
			attr(p, "class", "error");
		},
		m(target, anchor) {
			insert(target, p, anchor);
		},
		d(detaching) {
			if (detaching) detach(p);
		}
	};
}

function create_fragment$1(ctx) {
	let form;
	let h1;
	let t1;
	let div;
	let button0;
	let t3;
	let button1;
	let t5;
	let button2;
	let t7;
	let t8;
	let button3;
	let t9_value = (ctx.step < 3 ? "NEXT" : "submit") + "";
	let t9;
	let createForm_action;
	let dispose;

	function select_block_type(changed, ctx) {
		if (ctx.step === 1) return create_if_block$1;
		if (ctx.step === 2) return create_if_block_3$1;
		if (ctx.step === 3) return create_if_block_6;
	}

	let current_block_type = select_block_type(null, ctx);
	let if_block = current_block_type && current_block_type(ctx);

	return {
		c() {
			form = element("form");
			h1 = element("h1");
			h1.textContent = "Dynamic example";
			t1 = space();
			div = element("div");
			button0 = element("button");
			button0.textContent = "Step 1";
			t3 = space();
			button1 = element("button");
			button1.textContent = "Step 2";
			t5 = space();
			button2 = element("button");
			button2.textContent = "Step 3";
			t7 = space();
			if (if_block) if_block.c();
			t8 = space();
			button3 = element("button");
			t9 = text(t9_value);
			attr(button0, "type", "button");
			toggle_class(button0, "button-active", ctx.step === 1);
			attr(button1, "type", "button");
			toggle_class(button1, "button-active", ctx.step === 2);
			attr(button2, "type", "button");
			toggle_class(button2, "button-active", ctx.step === 3);
			attr(div, "class", "row");
			attr(button3, "type", "submit");
			form.noValidate = true;
			toggle_class(form, "success", ctx.success);

			dispose = [
				listen(button0, "click", ctx.click_handler),
				listen(button1, "click", ctx.click_handler_1),
				listen(button2, "click", ctx.click_handler_2),
				listen(form, "submit", prevent_default(ctx.submit_handler))
			];
		},
		m(target, anchor) {
			insert(target, form, anchor);
			append(form, h1);
			append(form, t1);
			append(form, div);
			append(div, button0);
			append(div, t3);
			append(div, button1);
			append(div, t5);
			append(div, button2);
			append(form, t7);
			if (if_block) if_block.m(form, null);
			append(form, t8);
			append(form, button3);
			append(button3, t9);

			createForm_action = ctx.createForm.call(null, form, {
				onSuccess: ctx.onSuccess,
				onFail: ctx.onFail
			}) || ({});
		},
		p(changed, ctx) {
			if (changed.step) {
				toggle_class(button0, "button-active", ctx.step === 1);
			}

			if (changed.step) {
				toggle_class(button1, "button-active", ctx.step === 2);
			}

			if (changed.step) {
				toggle_class(button2, "button-active", ctx.step === 3);
			}

			if (current_block_type === (current_block_type = select_block_type(changed, ctx)) && if_block) {
				if_block.p(changed, ctx);
			} else {
				if (if_block) if_block.d(1);
				if_block = current_block_type && current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(form, t8);
				}
			}

			if (changed.step && t9_value !== (t9_value = (ctx.step < 3 ? "NEXT" : "submit") + "")) set_data(t9, t9_value);

			if (changed.success) {
				toggle_class(form, "success", ctx.success);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(form);

			if (if_block) {
				if_block.d();
			}

			if (createForm_action && is_function(createForm_action.destroy)) createForm_action.destroy();
			run_all(dispose);
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let $loginStore;
	let $emailStore;
	let $email2Store;
	let $ageStore;
	const { createForm, createEntry } = createValidation({ validateOn: [], presence: "required" });
	const [loginStore, loginInput] = createEntry({ type: "string", min: 3, max: 15 });
	component_subscribe($$self, loginStore, value => $$invalidate("$loginStore", $loginStore = value));
	const [emailStore, emailInput] = createEntry({ type: "email" });
	component_subscribe($$self, emailStore, value => $$invalidate("$emailStore", $emailStore = value));
	const [email2Store, email2Input] = createEntry({ type: "email" });
	component_subscribe($$self, email2Store, value => $$invalidate("$email2Store", $email2Store = value));
	const [ageStore, ageInput] = createEntry({ type: "number", min: 18 });
	component_subscribe($$self, ageStore, value => $$invalidate("$ageStore", $ageStore = value));
	let step = 1;
	let success = false;

	const onSuccess = () => {
		if (step === 3) {
			$$invalidate("success", success = true);
		} else {
			$$invalidate("step", step++, step);
		}
	};

	const onFail = () => {
		$$invalidate("success", success = false);
	};

	function submit_handler(event) {
		bubble($$self, event);
	}

	const click_handler = () => $$invalidate("step", step = 1);
	const click_handler_1 = () => $$invalidate("step", step = 2);
	const click_handler_2 = () => $$invalidate("step", step = 3);

	function input_input_handler() {
		$loginStore.value = this.value;
		loginStore.set($loginStore);
	}

	function input0_input_handler() {
		$emailStore.value = this.value;
		emailStore.set($emailStore);
	}

	function input1_input_handler() {
		$email2Store.value = this.value;
		email2Store.set($email2Store);
	}

	function input_input_handler_1() {
		$ageStore.value = to_number(this.value);
		ageStore.set($ageStore);
	}

	return {
		createForm,
		loginStore,
		loginInput,
		emailStore,
		emailInput,
		email2Store,
		email2Input,
		ageStore,
		ageInput,
		step,
		success,
		onSuccess,
		onFail,
		$loginStore,
		$emailStore,
		$email2Store,
		$ageStore,
		submit_handler,
		click_handler,
		click_handler_1,
		click_handler_2,
		input_input_handler,
		input0_input_handler,
		input1_input_handler,
		input_input_handler_1
	};
}

class Dynamic extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});
	}
}

/* src/docs/components/radios.svelte generated by Svelte v3.15.0 */

function create_if_block_1$2(ctx) {
	let p;

	return {
		c() {
			p = element("p");
			p.textContent = "Please select something";
			attr(p, "class", "error");
		},
		m(target, anchor) {
			insert(target, p, anchor);
		},
		d(detaching) {
			if (detaching) detach(p);
		}
	};
}

// (37:2) {#if options && options.clearOn && options.clearOn.indexOf('reset') > -1}
function create_if_block$2(ctx) {
	let button;

	return {
		c() {
			button = element("button");
			button.textContent = "Reset";
			attr(button, "type", "reset");
		},
		m(target, anchor) {
			insert(target, button, anchor);
		},
		d(detaching) {
			if (detaching) detach(button);
		}
	};
}

function create_fragment$2(ctx) {
	let form;
	let h1;
	let t0;
	let div;
	let p;
	let t2;
	let label0;
	let input0;
	let input0_value_value;
	let radioInput_action;
	let t3;
	let t4;
	let label1;
	let input1;
	let input1_value_value;
	let radioInput_action_1;
	let t5;
	let t6;
	let label2;
	let input2;
	let input2_value_value;
	let radioInput_action_2;
	let t7;
	let t8;
	let t9;
	let button;
	let t11;
	let show_if = ctx.options && ctx.options.clearOn && ctx.options.clearOn.indexOf("reset") > -1;
	let createForm_action;
	let dispose;
	let if_block0 = ctx.$radioStore.errors.length && create_if_block_1$2();
	let if_block1 = show_if && create_if_block$2();

	return {
		c() {
			form = element("form");
			h1 = element("h1");
			t0 = space();
			div = element("div");
			p = element("p");
			p.textContent = "Check your experience (years)";
			t2 = space();
			label0 = element("label");
			input0 = element("input");
			t3 = text(" less than 1");
			t4 = space();
			label1 = element("label");
			input1 = element("input");
			t5 = text(" 1 .. 3");
			t6 = space();
			label2 = element("label");
			input2 = element("input");
			t7 = text(" more than 3");
			t8 = space();
			if (if_block0) if_block0.c();
			t9 = space();
			button = element("button");
			button.textContent = "Submit";
			t11 = space();
			if (if_block1) if_block1.c();
			attr(input0, "type", "radio");
			input0.__value = input0_value_value = 0;
			input0.value = input0.__value;
			ctx.$$binding_groups[0].push(input0);
			attr(input1, "type", "radio");
			input1.__value = input1_value_value = 1;
			input1.value = input1.__value;
			ctx.$$binding_groups[0].push(input1);
			attr(input2, "type", "radio");
			input2.__value = input2_value_value = 2;
			input2.value = input2.__value;
			ctx.$$binding_groups[0].push(input2);
			attr(div, "class", "label");
			attr(button, "type", "submit");
			form.noValidate = true;
			toggle_class(form, "success", ctx.success);

			dispose = [
				listen(input0, "change", ctx.input0_change_handler),
				listen(input1, "change", ctx.input1_change_handler),
				listen(input2, "change", ctx.input2_change_handler),
				listen(form, "submit", prevent_default(ctx.submit_handler))
			];
		},
		m(target, anchor) {
			insert(target, form, anchor);
			append(form, h1);
			h1.innerHTML = ctx.title;
			append(form, t0);
			append(form, div);
			append(div, p);
			append(div, t2);
			append(div, label0);
			append(label0, input0);
			input0.checked = input0.__value === ctx.$radioStore.value;
			radioInput_action = ctx.radioInput.call(null, input0) || ({});
			append(label0, t3);
			append(div, t4);
			append(div, label1);
			append(label1, input1);
			input1.checked = input1.__value === ctx.$radioStore.value;
			radioInput_action_1 = ctx.radioInput.call(null, input1) || ({});
			append(label1, t5);
			append(div, t6);
			append(div, label2);
			append(label2, input2);
			input2.checked = input2.__value === ctx.$radioStore.value;
			radioInput_action_2 = ctx.radioInput.call(null, input2) || ({});
			append(label2, t7);
			append(div, t8);
			if (if_block0) if_block0.m(div, null);
			append(form, t9);
			append(form, button);
			append(form, t11);
			if (if_block1) if_block1.m(form, null);

			createForm_action = ctx.createForm.call(null, form, {
				onSuccess: ctx.onSuccess,
				onFail: ctx.onFail
			}) || ({});
		},
		p(changed, ctx) {
			if (changed.title) h1.innerHTML = ctx.title;
			if (changed.$radioStore) {
				input0.checked = input0.__value === ctx.$radioStore.value;
			}

			if (changed.$radioStore) {
				input1.checked = input1.__value === ctx.$radioStore.value;
			}

			if (changed.$radioStore) {
				input2.checked = input2.__value === ctx.$radioStore.value;
			}

			if (ctx.$radioStore.errors.length) {
				if (!if_block0) {
					if_block0 = create_if_block_1$2();
					if_block0.c();
					if_block0.m(div, null);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (changed.options) show_if = ctx.options && ctx.options.clearOn && ctx.options.clearOn.indexOf("reset") > -1;

			if (show_if) {
				if (!if_block1) {
					if_block1 = create_if_block$2();
					if_block1.c();
					if_block1.m(form, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (changed.success) {
				toggle_class(form, "success", ctx.success);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(form);
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input0), 1);
			if (radioInput_action && is_function(radioInput_action.destroy)) radioInput_action.destroy();
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input1), 1);
			if (radioInput_action_1 && is_function(radioInput_action_1.destroy)) radioInput_action_1.destroy();
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input2), 1);
			if (radioInput_action_2 && is_function(radioInput_action_2.destroy)) radioInput_action_2.destroy();
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (createForm_action && is_function(createForm_action.destroy)) createForm_action.destroy();
			run_all(dispose);
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	let $radioStore;
	let { options = null } = $$props;
	let { title = "Default" } = $$props;
	const { createForm, createEntry } = createValidation(options);
	const [radioStore, radioInput] = createEntry({ type: "number", required: true });
	component_subscribe($$self, radioStore, value => $$invalidate("$radioStore", $radioStore = value));
	let success = false;

	const onSuccess = () => {
		$$invalidate("success", success = true);
	};

	const onFail = () => {
		$$invalidate("success", success = false);
	};

	const $$binding_groups = [[]];

	function submit_handler(event) {
		bubble($$self, event);
	}

	function input0_change_handler() {
		$radioStore.value = this.__value;
		radioStore.set($radioStore);
	}

	function input1_change_handler() {
		$radioStore.value = this.__value;
		radioStore.set($radioStore);
	}

	function input2_change_handler() {
		$radioStore.value = this.__value;
		radioStore.set($radioStore);
	}

	$$self.$set = $$props => {
		if ("options" in $$props) $$invalidate("options", options = $$props.options);
		if ("title" in $$props) $$invalidate("title", title = $$props.title);
	};

	return {
		options,
		title,
		createForm,
		radioStore,
		radioInput,
		success,
		onSuccess,
		onFail,
		$radioStore,
		submit_handler,
		input0_change_handler,
		input1_change_handler,
		input2_change_handler,
		$$binding_groups
	};
}

class Radios extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$2, create_fragment$2, safe_not_equal, { options: 0, title: 0 });
	}
}

/* src/docs/components/array.svelte generated by Svelte v3.15.0 */

function add_css() {
	var style = element("style");
	style.id = "svelte-1gy2nnl-style";
	style.textContent = "form.svelte-1gy2nnl{margin-top:1px}";
	append(document.head, style);
}

// (32:4) {#if $arrayStore.errors.length}
function create_if_block_1$3(ctx) {
	let p;

	return {
		c() {
			p = element("p");
			p.textContent = "Please select at least 2";
			attr(p, "class", "error");
		},
		m(target, anchor) {
			insert(target, p, anchor);
		},
		d(detaching) {
			if (detaching) detach(p);
		}
	};
}

// (38:2) {#if options && options.clearOn && options.clearOn.indexOf('reset') > -1}
function create_if_block$3(ctx) {
	let button;

	return {
		c() {
			button = element("button");
			button.textContent = "Reset";
			attr(button, "type", "reset");
		},
		m(target, anchor) {
			insert(target, button, anchor);
		},
		d(detaching) {
			if (detaching) detach(button);
		}
	};
}

function create_fragment$3(ctx) {
	let form;
	let h1;
	let t0;
	let div;
	let p;
	let t2;
	let label0;
	let input0;
	let input0_value_value;
	let arrayInput_action;
	let t3;
	let t4;
	let label1;
	let input1;
	let input1_value_value;
	let arrayInput_action_1;
	let t5;
	let t6;
	let label2;
	let input2;
	let input2_value_value;
	let arrayInput_action_2;
	let t7;
	let t8;
	let t9;
	let button;
	let t11;
	let show_if = ctx.options && ctx.options.clearOn && ctx.options.clearOn.indexOf("reset") > -1;
	let createForm_action;
	let dispose;
	let if_block0 = ctx.$arrayStore.errors.length && create_if_block_1$3();
	let if_block1 = show_if && create_if_block$3();

	return {
		c() {
			form = element("form");
			h1 = element("h1");
			t0 = space();
			div = element("div");
			p = element("p");
			p.textContent = "Check your skills";
			t2 = space();
			label0 = element("label");
			input0 = element("input");
			t3 = text("Sport");
			t4 = space();
			label1 = element("label");
			input1 = element("input");
			t5 = text("History");
			t6 = space();
			label2 = element("label");
			input2 = element("input");
			t7 = text("Politics");
			t8 = space();
			if (if_block0) if_block0.c();
			t9 = space();
			button = element("button");
			button.textContent = "Submit";
			t11 = space();
			if (if_block1) if_block1.c();
			attr(input0, "type", "checkbox");
			input0.__value = input0_value_value = 0;
			input0.value = input0.__value;
			ctx.$$binding_groups[0].push(input0);
			attr(input1, "type", "checkbox");
			input1.__value = input1_value_value = 1;
			input1.value = input1.__value;
			ctx.$$binding_groups[0].push(input1);
			attr(input2, "type", "checkbox");
			input2.__value = input2_value_value = 2;
			input2.value = input2.__value;
			ctx.$$binding_groups[0].push(input2);
			attr(div, "class", "label");
			attr(button, "type", "submit");
			form.noValidate = true;
			attr(form, "class", "svelte-1gy2nnl");
			toggle_class(form, "success", ctx.success);

			dispose = [
				listen(input0, "change", ctx.input0_change_handler),
				listen(input1, "change", ctx.input1_change_handler),
				listen(input2, "change", ctx.input2_change_handler),
				listen(form, "submit", prevent_default(ctx.submit_handler))
			];
		},
		m(target, anchor) {
			insert(target, form, anchor);
			append(form, h1);
			h1.innerHTML = ctx.title;
			append(form, t0);
			append(form, div);
			append(div, p);
			append(div, t2);
			append(div, label0);
			append(label0, input0);
			input0.checked = ~ctx.$arrayStore.value.indexOf(input0.__value);
			arrayInput_action = ctx.arrayInput.call(null, input0) || ({});
			append(label0, t3);
			append(div, t4);
			append(div, label1);
			append(label1, input1);
			input1.checked = ~ctx.$arrayStore.value.indexOf(input1.__value);
			arrayInput_action_1 = ctx.arrayInput.call(null, input1) || ({});
			append(label1, t5);
			append(div, t6);
			append(div, label2);
			append(label2, input2);
			input2.checked = ~ctx.$arrayStore.value.indexOf(input2.__value);
			arrayInput_action_2 = ctx.arrayInput.call(null, input2) || ({});
			append(label2, t7);
			append(div, t8);
			if (if_block0) if_block0.m(div, null);
			append(form, t9);
			append(form, button);
			append(form, t11);
			if (if_block1) if_block1.m(form, null);

			createForm_action = ctx.createForm.call(null, form, {
				onSuccess: ctx.onSuccess,
				onFail: ctx.onFail
			}) || ({});
		},
		p(changed, ctx) {
			if (changed.title) h1.innerHTML = ctx.title;
			if (changed.$arrayStore) {
				input0.checked = ~ctx.$arrayStore.value.indexOf(input0.__value);
			}

			if (changed.$arrayStore) {
				input1.checked = ~ctx.$arrayStore.value.indexOf(input1.__value);
			}

			if (changed.$arrayStore) {
				input2.checked = ~ctx.$arrayStore.value.indexOf(input2.__value);
			}

			if (ctx.$arrayStore.errors.length) {
				if (!if_block0) {
					if_block0 = create_if_block_1$3();
					if_block0.c();
					if_block0.m(div, null);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (changed.options) show_if = ctx.options && ctx.options.clearOn && ctx.options.clearOn.indexOf("reset") > -1;

			if (show_if) {
				if (!if_block1) {
					if_block1 = create_if_block$3();
					if_block1.c();
					if_block1.m(form, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (changed.success) {
				toggle_class(form, "success", ctx.success);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(form);
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input0), 1);
			if (arrayInput_action && is_function(arrayInput_action.destroy)) arrayInput_action.destroy();
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input1), 1);
			if (arrayInput_action_1 && is_function(arrayInput_action_1.destroy)) arrayInput_action_1.destroy();
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input2), 1);
			if (arrayInput_action_2 && is_function(arrayInput_action_2.destroy)) arrayInput_action_2.destroy();
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (createForm_action && is_function(createForm_action.destroy)) createForm_action.destroy();
			run_all(dispose);
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	let $arrayStore;
	let { options = null } = $$props;
	let { title = "Default" } = $$props;
	const { createEntry, createForm } = createValidation(options);
	const [arrayStore, arrayInput] = createEntry({ type: "array", min: 2, value: [] });
	component_subscribe($$self, arrayStore, value => $$invalidate("$arrayStore", $arrayStore = value));
	let success = false;

	const onSuccess = () => {
		$$invalidate("success", success = true);
	};

	const onFail = () => {
		$$invalidate("success", success = false);
	};

	const $$binding_groups = [[]];

	function submit_handler(event) {
		bubble($$self, event);
	}

	function input0_change_handler() {
		$arrayStore.value = get_binding_group_value($$binding_groups[0]);
		arrayStore.set($arrayStore);
	}

	function input1_change_handler() {
		$arrayStore.value = get_binding_group_value($$binding_groups[0]);
		arrayStore.set($arrayStore);
	}

	function input2_change_handler() {
		$arrayStore.value = get_binding_group_value($$binding_groups[0]);
		arrayStore.set($arrayStore);
	}

	$$self.$set = $$props => {
		if ("options" in $$props) $$invalidate("options", options = $$props.options);
		if ("title" in $$props) $$invalidate("title", title = $$props.title);
	};

	return {
		options,
		title,
		createForm,
		arrayStore,
		arrayInput,
		success,
		onSuccess,
		onFail,
		$arrayStore,
		submit_handler,
		input0_change_handler,
		input1_change_handler,
		input2_change_handler,
		$$binding_groups
	};
}

class Array$1 extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1gy2nnl-style")) add_css();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, { options: 0, title: 0 });
	}
}

const target = document.getElementById('app');
new Array$1({
    target,
    props: {
        title: 'Array example',
        options: {
            validateOn: ['change'],
            clearOn: ['reset'],
            listenInputEvents: ListenInputEventsEnum.afterValidation
        }
    }
});
new Demo({
    target,
    props: {
        title: 'Validation by <mark>change</mark> event after form <mark>submit</mark>',
        defaultSettings: true,
        options: {
            validateOn: ['change'],
            clearOn: ['reset'],
            listenInputEvents: ListenInputEventsEnum.afterValidation
        }
    }
});
new Demo({
    target,
    props: {
        title: 'Validation by <mark>blur</mark> / <mark>focus</mark> events <mark>always</mark>',
        options: {
            validateOn: ['blur'],
            clearOn: ['focus'],
            listenInputEvents: ListenInputEventsEnum.always
        }
    }
});
new Demo({
    target,
    props: {
        title: '<mark>submit</mark> only validation',
        options: {
            listenInputEvents: ListenInputEventsEnum.never
        }
    }
});
new Dynamic({ target });
new Radios({
    target,
    props: {
        title: 'Radios example',
        options: {
            validateOn: ['change'],
            clearOn: ['reset'],
            listenInputEvents: ListenInputEventsEnum.afterValidation
        }
    }
});
