
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
function noop() { }
function add_location(element, file, line, column, char) {
    element.__svelte_meta = {
        loc: { file, line, column, char }
    };
}
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
function validate_store(store, name) {
    if (!store || typeof store.subscribe !== 'function') {
        throw new Error(`'${name}' is not a store with a 'subscribe' method`);
    }
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
function to_number(value) {
    return value === '' ? undefined : +value;
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_input_value(input, value) {
    if (value != null || input.value) {
        input.value = value;
    }
}
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
}
function custom_event(type, detail) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, false, false, detail);
    return e;
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

function dispatch_dev(type, detail) {
    document.dispatchEvent(custom_event(type, detail));
}
function append_dev(target, node) {
    dispatch_dev("SvelteDOMInsert", { target, node });
    append(target, node);
}
function insert_dev(target, node, anchor) {
    dispatch_dev("SvelteDOMInsert", { target, node, anchor });
    insert(target, node, anchor);
}
function detach_dev(node) {
    dispatch_dev("SvelteDOMRemove", { node });
    detach(node);
}
function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
    const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
    if (has_prevent_default)
        modifiers.push('preventDefault');
    if (has_stop_propagation)
        modifiers.push('stopPropagation');
    dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
    const dispose = listen(node, event, handler, options);
    return () => {
        dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
        dispose();
    };
}
function attr_dev(node, attribute, value) {
    attr(node, attribute, value);
    if (value == null)
        dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
    else
        dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
}
function set_data_dev(text, data) {
    data = '' + data;
    if (text.data === data)
        return;
    dispatch_dev("SvelteDOMSetData", { node: text, data });
    text.data = data;
}
class SvelteComponentDev extends SvelteComponent {
    constructor(options) {
        if (!options || (!options.target && !options.$$inline)) {
            throw new Error(`'target' is a required option`);
        }
        super();
    }
    $destroy() {
        super.$destroy();
        this.$destroy = () => {
            console.warn(`Component was already destroyed`); // eslint-disable-line no-console
        };
    }
}

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

var updateStoreErrors = (store, errors) => {
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
        return this.currentPhase !== initialPhase;
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
            validateOn: ['input'],
            clearOn: ['reset'],
            inputValidationPhase: PhaseEnum.afterFirstValidation
        }, options);
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
            const { value } = get_store_value(store);
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
        this.updatePhase(PhaseEnum.afterFirstValidation);
        return errors;
    }
    updatePhase(phase) {
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

/* src/demo/demo.svelte generated by Svelte v3.15.0 */
const file = "src/demo/demo.svelte";

function add_css() {
	var style = element("style");
	style.id = "svelte-6vxai9-style";
	style.textContent = "\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVtby5zdmVsdGUiLCJzb3VyY2VzIjpbImRlbW8uc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XHJcbiAgZXhwb3J0IGxldCBkZWZhdWx0U2V0dGluZ3MgPSBmYWxzZTtcclxuICBleHBvcnQgbGV0IG9wdGlvbnMgPSBudWxsO1xyXG4gIGV4cG9ydCBsZXQgdGl0bGUgPSAnRGVmYXVsdCc7XHJcblxyXG4gIGltcG9ydCBWYWxpZGF0aW9uIGZyb20gJ3NyYy9pbmRleCc7XHJcblxyXG4gIGNvbnN0IHZhbGlkYXRpb24gPSBuZXcgVmFsaWRhdGlvbihvcHRpb25zKTtcclxuICBjb25zdCB7IGNyZWF0ZUZvcm0gfSA9IHZhbGlkYXRpb247XHJcblxyXG4gIGNvbnN0IFsgbG9naW5TdG9yZSwgbG9naW5JbnB1dCBdID0gdmFsaWRhdGlvbi5jcmVhdGVFbnRyeSh7XHJcbiAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgIG1pbkxlbmd0aDogMyxcclxuICAgIG1heExlbmd0aDogMTVcclxuICB9KTtcclxuXHJcbiAgY29uc3QgWyBlbWFpbFN0b3JlLCBlbWFpbElucHV0IF0gPSB2YWxpZGF0aW9uLmNyZWF0ZUVudHJ5KHtcclxuICAgIHR5cGU6ICdlbWFpbCdcclxuICB9KTtcclxuXHJcbiAgY29uc3QgWyBhZ2VTdG9yZSwgYWdlSW5wdXQgXSA9IHZhbGlkYXRpb24uY3JlYXRlRW50cnkoe1xyXG4gICAgdHlwZTogJ251bWJlcicsXHJcbiAgICBtaW5WYWx1ZTogMThcclxuICB9KTtcclxuXHJcbiAgbGV0IHN1Y2Nlc3MgPSBmYWxzZTtcclxuICBjb25zdCBvblN1Y2Nlc3MgPSAoKSA9PiB7IHN1Y2Nlc3MgPSB0cnVlOyB9O1xyXG4gIGNvbnN0IG9uRmFpbCA9ICgpID0+IHsgc3VjY2VzcyA9IGZhbHNlOyB9O1xyXG48L3NjcmlwdD5cclxuXHJcbjxmb3JtXHJcbiAgbm92YWxpZGF0ZVxyXG4gIHVzZTpjcmVhdGVGb3JtPXt7IG9uU3VjY2Vzcywgb25GYWlsIH19XHJcbiAgb246c3VibWl0fHByZXZlbnREZWZhdWx0XHJcbiAgY2xhc3M6c3VjY2Vzc1xyXG4+XHJcbiAgPGgxPntAaHRtbCB0aXRsZX08L2gxPlxyXG4gIHtAaHRtbCBgPHByZT48Y29kZT4ke2RlZmF1bHRTZXR0aW5ncyA/ICcvLyBkZWZhdWx0IHNldHRpbmdzXFxuJyA6ICcnfW5ldyBWYWxpZGF0aW9uKCR7SlNPTi5zdHJpbmdpZnkob3B0aW9ucywgbnVsbCwgJyAgJyl9KTs8L2NvZGU+PC9wcmU+YH1cclxuICA8bGFiZWw+XHJcbiAgICBMb2dpblxyXG4gICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgdXNlOmxvZ2luSW5wdXQgYmluZDp2YWx1ZT17JGxvZ2luU3RvcmUudmFsdWV9IC8+XHJcbiAgICB7I2lmICRsb2dpblN0b3JlLmVycm9ycy5pbmNsdWRlcygnbWluTGVuZ3RoJyl9XHJcbiAgICAgIDxwIGNsYXNzPVwiZXJyb3JcIj5Mb2dpbiBzaG91bGQgYmUgYXQgbGVhc3QgMyBzeW1ib2xzIGxvbmc8L3A+XHJcbiAgICB7L2lmfVxyXG4gICAgeyNpZiAkbG9naW5TdG9yZS5lcnJvcnMuaW5jbHVkZXMoJ21heExlbmd0aCcpfVxyXG4gICAgICA8cCBjbGFzcz1cImVycm9yXCI+TG9naW4gc2hvdWxkIGJlIG5vdCBsb25nZXIgdGhhbiAxNSBzeW1ib2xzPC9wPlxyXG4gICAgey9pZn1cclxuICA8L2xhYmVsPlxyXG4gIDxsYWJlbD5cclxuICAgIEVtYWlsXHJcbiAgICA8aW5wdXQgdHlwZT1cImVtYWlsXCIgdXNlOmVtYWlsSW5wdXQgYmluZDp2YWx1ZT17JGVtYWlsU3RvcmUudmFsdWV9IC8+XHJcbiAgICB7I2lmICRlbWFpbFN0b3JlLmVycm9ycy5pbmNsdWRlcygndHlwZScpfVxyXG4gICAgICA8cCBjbGFzcz1cImVycm9yXCI+RW1haWwgc2hvdWxkIGJlIGNvcnJlY3Q8L3A+XHJcbiAgICB7L2lmfVxyXG4gIDwvbGFiZWw+XHJcbiAgPGxhYmVsPlxyXG4gICAgTnVtYmVyXHJcbiAgICA8aW5wdXQgdHlwZT1cIm51bWJlclwiIHVzZTphZ2VJbnB1dCBiaW5kOnZhbHVlPXskYWdlU3RvcmUudmFsdWV9IC8+XHJcbiAgICB7I2lmICRhZ2VTdG9yZS5lcnJvcnMuaW5jbHVkZXMoJ21pblZhbHVlJyl9XHJcbiAgICAgIDxwIGNsYXNzPVwiZXJyb3JcIj5Gb3IgYm9vbWVycyBvbmx5ITwvcD5cclxuICAgIHsvaWZ9XHJcbiAgPC9sYWJlbD5cclxuXHJcbiAgPGJ1dHRvbiB0eXBlPVwic3VibWl0XCI+U3VibWl0PC9idXR0b24+XHJcbiAgeyNpZiBvcHRpb25zICYmIG9wdGlvbnMuY2xlYXJPbiAmJiBvcHRpb25zLmNsZWFyT24uaW5kZXhPZigncmVzZXQnKSA+IC0xfVxyXG4gICAgPGJ1dHRvbiB0eXBlPVwicmVzZXRcIj5SZXNldDwvYnV0dG9uPlxyXG4gIHsvaWZ9XHJcbjwvZm9ybT5cclxuXHJcbjxzdHlsZT5cclxuICBkaXYge1xyXG4gICAgbWFyZ2luLWJvdHRvbTogMjBweDtcclxuICB9XHJcbjwvc3R5bGU+XHJcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIn0= */";
	append_dev(document.head, style);
}

// (42:4) {#if $loginStore.errors.includes('minLength')}
function create_if_block_4(ctx) {
	let p;

	const block = {
		c: function create() {
			p = element("p");
			p.textContent = "Login should be at least 3 symbols long";
			attr_dev(p, "class", "error");
			add_location(p, file, 42, 6, 1134);
		},
		m: function mount(target, anchor) {
			insert_dev(target, p, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(p);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_4.name,
		type: "if",
		source: "(42:4) {#if $loginStore.errors.includes('minLength')}",
		ctx
	});

	return block;
}

// (45:4) {#if $loginStore.errors.includes('maxLength')}
function create_if_block_3(ctx) {
	let p;

	const block = {
		c: function create() {
			p = element("p");
			p.textContent = "Login should be not longer than 15 symbols";
			attr_dev(p, "class", "error");
			add_location(p, file, 45, 6, 1265);
		},
		m: function mount(target, anchor) {
			insert_dev(target, p, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(p);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_3.name,
		type: "if",
		source: "(45:4) {#if $loginStore.errors.includes('maxLength')}",
		ctx
	});

	return block;
}

// (52:4) {#if $emailStore.errors.includes('type')}
function create_if_block_2(ctx) {
	let p;

	const block = {
		c: function create() {
			p = element("p");
			p.textContent = "Email should be correct";
			attr_dev(p, "class", "error");
			add_location(p, file, 52, 6, 1502);
		},
		m: function mount(target, anchor) {
			insert_dev(target, p, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(p);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_2.name,
		type: "if",
		source: "(52:4) {#if $emailStore.errors.includes('type')}",
		ctx
	});

	return block;
}

// (59:4) {#if $ageStore.errors.includes('minValue')}
function create_if_block_1(ctx) {
	let p;

	const block = {
		c: function create() {
			p = element("p");
			p.textContent = "For boomers only!";
			attr_dev(p, "class", "error");
			add_location(p, file, 59, 6, 1720);
		},
		m: function mount(target, anchor) {
			insert_dev(target, p, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(p);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1.name,
		type: "if",
		source: "(59:4) {#if $ageStore.errors.includes('minValue')}",
		ctx
	});

	return block;
}

// (65:2) {#if options && options.clearOn && options.clearOn.indexOf('reset') > -1}
function create_if_block(ctx) {
	let button;

	const block = {
		c: function create() {
			button = element("button");
			button.textContent = "Reset";
			attr_dev(button, "type", "reset");
			add_location(button, file, 65, 4, 1907);
		},
		m: function mount(target, anchor) {
			insert_dev(target, button, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(button);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block.name,
		type: "if",
		source: "(65:2) {#if options && options.clearOn && options.clearOn.indexOf('reset') > -1}",
		ctx
	});

	return block;
}

function create_fragment(ctx) {
	let form;
	let h1;
	let t0;
	let html_tag;
	let raw1_value = `<pre><code>${ctx.defaultSettings ? "// default settings\n" : ""}new Validation(${JSON.stringify(ctx.options, null, "  ")});</code></pre>` + "";
	let t1;
	let label0;
	let t2;
	let input0;
	let loginInput_action;
	let t3;
	let show_if_4 = ctx.$loginStore.errors.includes("minLength");
	let t4;
	let show_if_3 = ctx.$loginStore.errors.includes("maxLength");
	let t5;
	let label1;
	let t6;
	let input1;
	let emailInput_action;
	let t7;
	let show_if_2 = ctx.$emailStore.errors.includes("type");
	let t8;
	let label2;
	let t9;
	let input2;
	let input2_updating = false;
	let ageInput_action;
	let t10;
	let show_if_1 = ctx.$ageStore.errors.includes("minValue");
	let t11;
	let button;
	let t13;
	let show_if = ctx.options && ctx.options.clearOn && ctx.options.clearOn.indexOf("reset") > -1;
	let createForm_action;
	let dispose;
	let if_block0 = show_if_4 && create_if_block_4(ctx);
	let if_block1 = show_if_3 && create_if_block_3(ctx);
	let if_block2 = show_if_2 && create_if_block_2(ctx);

	function input2_input_handler() {
		input2_updating = true;
		ctx.input2_input_handler.call(input2);
	}

	let if_block3 = show_if_1 && create_if_block_1(ctx);
	let if_block4 = show_if && create_if_block(ctx);

	const block = {
		c: function create() {
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
			button = element("button");
			button.textContent = "Submit";
			t13 = space();
			if (if_block4) if_block4.c();
			add_location(h1, file, 36, 2, 815);
			html_tag = new HtmlTag(raw1_value, t1);
			attr_dev(input0, "type", "text");
			add_location(input0, file, 40, 4, 1007);
			add_location(label0, file, 38, 2, 983);
			attr_dev(input1, "type", "email");
			add_location(input1, file, 50, 4, 1379);
			add_location(label1, file, 48, 2, 1355);
			attr_dev(input2, "type", "number");
			add_location(input2, file, 57, 4, 1598);
			add_location(label2, file, 55, 2, 1573);
			attr_dev(button, "type", "submit");
			add_location(button, file, 63, 2, 1787);
			form.noValidate = true;
			toggle_class(form, "success", ctx.success);
			add_location(form, file, 30, 0, 702);

			dispose = [
				listen_dev(input0, "input", ctx.input0_input_handler),
				listen_dev(input1, "input", ctx.input1_input_handler),
				listen_dev(input2, "input", input2_input_handler),
				listen_dev(form, "submit", prevent_default(ctx.submit_handler), false, false, true)
			];
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, form, anchor);
			append_dev(form, h1);
			h1.innerHTML = ctx.title;
			append_dev(form, t0);
			html_tag.m(form);
			append_dev(form, t1);
			append_dev(form, label0);
			append_dev(label0, t2);
			append_dev(label0, input0);
			set_input_value(input0, ctx.$loginStore.value);
			loginInput_action = ctx.loginInput.call(null, input0) || ({});
			append_dev(label0, t3);
			if (if_block0) if_block0.m(label0, null);
			append_dev(label0, t4);
			if (if_block1) if_block1.m(label0, null);
			append_dev(form, t5);
			append_dev(form, label1);
			append_dev(label1, t6);
			append_dev(label1, input1);
			set_input_value(input1, ctx.$emailStore.value);
			emailInput_action = ctx.emailInput.call(null, input1) || ({});
			append_dev(label1, t7);
			if (if_block2) if_block2.m(label1, null);
			append_dev(form, t8);
			append_dev(form, label2);
			append_dev(label2, t9);
			append_dev(label2, input2);
			set_input_value(input2, ctx.$ageStore.value);
			ageInput_action = ctx.ageInput.call(null, input2) || ({});
			append_dev(label2, t10);
			if (if_block3) if_block3.m(label2, null);
			append_dev(form, t11);
			append_dev(form, button);
			append_dev(form, t13);
			if (if_block4) if_block4.m(form, null);

			createForm_action = ctx.createForm.call(null, form, {
				onSuccess: ctx.onSuccess,
				onFail: ctx.onFail
			}) || ({});
		},
		p: function update(changed, ctx) {
			if (changed.title) h1.innerHTML = ctx.title;			if ((changed.defaultSettings || changed.options) && raw1_value !== (raw1_value = `<pre><code>${ctx.defaultSettings ? "// default settings\n" : ""}new Validation(${JSON.stringify(ctx.options, null, "  ")});</code></pre>` + "")) html_tag.p(raw1_value);

			if (changed.$loginStore && input0.value !== ctx.$loginStore.value) {
				set_input_value(input0, ctx.$loginStore.value);
			}

			if (changed.$loginStore) show_if_4 = ctx.$loginStore.errors.includes("minLength");

			if (show_if_4) {
				if (!if_block0) {
					if_block0 = create_if_block_4(ctx);
					if_block0.c();
					if_block0.m(label0, t4);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (changed.$loginStore) show_if_3 = ctx.$loginStore.errors.includes("maxLength");

			if (show_if_3) {
				if (!if_block1) {
					if_block1 = create_if_block_3(ctx);
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

			if (changed.$emailStore) show_if_2 = ctx.$emailStore.errors.includes("type");

			if (show_if_2) {
				if (!if_block2) {
					if_block2 = create_if_block_2(ctx);
					if_block2.c();
					if_block2.m(label1, null);
				}
			} else if (if_block2) {
				if_block2.d(1);
				if_block2 = null;
			}

			if (!input2_updating && changed.$ageStore) {
				set_input_value(input2, ctx.$ageStore.value);
			}

			input2_updating = false;
			if (changed.$ageStore) show_if_1 = ctx.$ageStore.errors.includes("minValue");

			if (show_if_1) {
				if (!if_block3) {
					if_block3 = create_if_block_1(ctx);
					if_block3.c();
					if_block3.m(label2, null);
				}
			} else if (if_block3) {
				if_block3.d(1);
				if_block3 = null;
			}

			if (changed.options) show_if = ctx.options && ctx.options.clearOn && ctx.options.clearOn.indexOf("reset") > -1;

			if (show_if) {
				if (!if_block4) {
					if_block4 = create_if_block(ctx);
					if_block4.c();
					if_block4.m(form, null);
				}
			} else if (if_block4) {
				if_block4.d(1);
				if_block4 = null;
			}

			if (changed.success) {
				toggle_class(form, "success", ctx.success);
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(form);
			if (loginInput_action && is_function(loginInput_action.destroy)) loginInput_action.destroy();
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (emailInput_action && is_function(emailInput_action.destroy)) emailInput_action.destroy();
			if (if_block2) if_block2.d();
			if (ageInput_action && is_function(ageInput_action.destroy)) ageInput_action.destroy();
			if (if_block3) if_block3.d();
			if (if_block4) if_block4.d();
			if (createForm_action && is_function(createForm_action.destroy)) createForm_action.destroy();
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance($$self, $$props, $$invalidate) {
	let $loginStore;
	let $emailStore;
	let $ageStore;
	let { defaultSettings = false } = $$props;
	let { options = null } = $$props;
	let { title = "Default" } = $$props;
	const validation = new Validation(options);
	const { createForm } = validation;

	const [loginStore, loginInput] = validation.createEntry({
		type: "string",
		minLength: 3,
		maxLength: 15
	});

	validate_store(loginStore, "loginStore");
	component_subscribe($$self, loginStore, value => $$invalidate("$loginStore", $loginStore = value));
	const [emailStore, emailInput] = validation.createEntry({ type: "email" });
	validate_store(emailStore, "emailStore");
	component_subscribe($$self, emailStore, value => $$invalidate("$emailStore", $emailStore = value));
	const [ageStore, ageInput] = validation.createEntry({ type: "number", minValue: 18 });
	validate_store(ageStore, "ageStore");
	component_subscribe($$self, ageStore, value => $$invalidate("$ageStore", $ageStore = value));
	let success = false;

	const onSuccess = () => {
		$$invalidate("success", success = true);
	};

	const onFail = () => {
		$$invalidate("success", success = false);
	};

	const writable_props = ["defaultSettings", "options", "title"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Demo> was created with unknown prop '${key}'`);
	});

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
		$ageStore.value = to_number(this.value);
		ageStore.set($ageStore);
	}

	$$self.$set = $$props => {
		if ("defaultSettings" in $$props) $$invalidate("defaultSettings", defaultSettings = $$props.defaultSettings);
		if ("options" in $$props) $$invalidate("options", options = $$props.options);
		if ("title" in $$props) $$invalidate("title", title = $$props.title);
	};

	$$self.$capture_state = () => {
		return {
			defaultSettings,
			options,
			title,
			success,
			$loginStore,
			$emailStore,
			$ageStore
		};
	};

	$$self.$inject_state = $$props => {
		if ("defaultSettings" in $$props) $$invalidate("defaultSettings", defaultSettings = $$props.defaultSettings);
		if ("options" in $$props) $$invalidate("options", options = $$props.options);
		if ("title" in $$props) $$invalidate("title", title = $$props.title);
		if ("success" in $$props) $$invalidate("success", success = $$props.success);
		if ("$loginStore" in $$props) loginStore.set($loginStore = $$props.$loginStore);
		if ("$emailStore" in $$props) emailStore.set($emailStore = $$props.$emailStore);
		if ("$ageStore" in $$props) ageStore.set($ageStore = $$props.$ageStore);
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

class Demo extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-6vxai9-style")) add_css();
		init(this, options, instance, create_fragment, safe_not_equal, { defaultSettings: 0, options: 0, title: 0 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Demo",
			options,
			id: create_fragment.name
		});
	}

	get defaultSettings() {
		throw new Error("<Demo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set defaultSettings(value) {
		throw new Error("<Demo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get options() {
		throw new Error("<Demo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set options(value) {
		throw new Error("<Demo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get title() {
		throw new Error("<Demo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set title(value) {
		throw new Error("<Demo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/demo/dynamic.svelte generated by Svelte v3.15.0 */
const file$1 = "src/demo/dynamic.svelte";

// (78:23) 
function create_if_block_6(ctx) {
	let label;
	let t0;
	let input;
	let input_updating = false;
	let ageInput_action;
	let t1;
	let show_if = ctx.$ageStore.errors.includes("minValue");
	let dispose;

	function input_input_handler_1() {
		input_updating = true;
		ctx.input_input_handler_1.call(input);
	}

	let if_block = show_if && create_if_block_7(ctx);

	const block = {
		c: function create() {
			label = element("label");
			t0 = text("Number STEP 3\r\n      ");
			input = element("input");
			t1 = space();
			if (if_block) if_block.c();
			attr_dev(input, "type", "number");
			add_location(input, file$1, 80, 6, 2268);
			add_location(label, file$1, 78, 4, 2232);
			dispose = listen_dev(input, "input", input_input_handler_1);
		},
		m: function mount(target, anchor) {
			insert_dev(target, label, anchor);
			append_dev(label, t0);
			append_dev(label, input);
			set_input_value(input, ctx.$ageStore.value);
			ageInput_action = ctx.ageInput.call(null, input) || ({});
			append_dev(label, t1);
			if (if_block) if_block.m(label, null);
		},
		p: function update(changed, ctx) {
			if (!input_updating && changed.$ageStore) {
				set_input_value(input, ctx.$ageStore.value);
			}

			input_updating = false;
			if (changed.$ageStore) show_if = ctx.$ageStore.errors.includes("minValue");

			if (show_if) {
				if (!if_block) {
					if_block = create_if_block_7(ctx);
					if_block.c();
					if_block.m(label, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(label);
			if (ageInput_action && is_function(ageInput_action.destroy)) ageInput_action.destroy();
			if (if_block) if_block.d();
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_6.name,
		type: "if",
		source: "(78:23) ",
		ctx
	});

	return block;
}

// (63:23) 
function create_if_block_3$1(ctx) {
	let label0;
	let t0;
	let input0;
	let emailInput_action;
	let t1;
	let show_if_1 = ctx.$emailStore.errors.includes("type");
	let t2;
	let label1;
	let t3;
	let input1;
	let email2Input_action;
	let t4;
	let show_if = ctx.$email2Store.errors.includes("type");
	let dispose;
	let if_block0 = show_if_1 && create_if_block_5(ctx);
	let if_block1 = show_if && create_if_block_4$1(ctx);

	const block = {
		c: function create() {
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
			attr_dev(input0, "type", "email");
			add_location(input0, file$1, 65, 6, 1761);
			add_location(label0, file$1, 63, 4, 1726);
			attr_dev(input1, "type", "email");
			add_location(input1, file$1, 72, 6, 2000);
			add_location(label1, file$1, 70, 4, 1965);

			dispose = [
				listen_dev(input0, "input", ctx.input0_input_handler),
				listen_dev(input1, "input", ctx.input1_input_handler)
			];
		},
		m: function mount(target, anchor) {
			insert_dev(target, label0, anchor);
			append_dev(label0, t0);
			append_dev(label0, input0);
			set_input_value(input0, ctx.$emailStore.value);
			emailInput_action = ctx.emailInput.call(null, input0) || ({});
			append_dev(label0, t1);
			if (if_block0) if_block0.m(label0, null);
			insert_dev(target, t2, anchor);
			insert_dev(target, label1, anchor);
			append_dev(label1, t3);
			append_dev(label1, input1);
			set_input_value(input1, ctx.$email2Store.value);
			email2Input_action = ctx.email2Input.call(null, input1) || ({});
			append_dev(label1, t4);
			if (if_block1) if_block1.m(label1, null);
		},
		p: function update(changed, ctx) {
			if (changed.$emailStore && input0.value !== ctx.$emailStore.value) {
				set_input_value(input0, ctx.$emailStore.value);
			}

			if (changed.$emailStore) show_if_1 = ctx.$emailStore.errors.includes("type");

			if (show_if_1) {
				if (!if_block0) {
					if_block0 = create_if_block_5(ctx);
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

			if (changed.$email2Store) show_if = ctx.$email2Store.errors.includes("type");

			if (show_if) {
				if (!if_block1) {
					if_block1 = create_if_block_4$1(ctx);
					if_block1.c();
					if_block1.m(label1, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(label0);
			if (emailInput_action && is_function(emailInput_action.destroy)) emailInput_action.destroy();
			if (if_block0) if_block0.d();
			if (detaching) detach_dev(t2);
			if (detaching) detach_dev(label1);
			if (email2Input_action && is_function(email2Input_action.destroy)) email2Input_action.destroy();
			if (if_block1) if_block1.d();
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_3$1.name,
		type: "if",
		source: "(63:23) ",
		ctx
	});

	return block;
}

// (52:2) {#if step === 1}
function create_if_block$1(ctx) {
	let label;
	let t0;
	let input;
	let loginInput_action;
	let t1;
	let show_if_1 = ctx.$loginStore.errors.includes("minLength");
	let t2;
	let show_if = ctx.$loginStore.errors.includes("maxLength");
	let dispose;
	let if_block0 = show_if_1 && create_if_block_2$1(ctx);
	let if_block1 = show_if && create_if_block_1$1(ctx);

	const block = {
		c: function create() {
			label = element("label");
			t0 = text("Login STEP 1\r\n      ");
			input = element("input");
			t1 = space();
			if (if_block0) if_block0.c();
			t2 = space();
			if (if_block1) if_block1.c();
			attr_dev(input, "type", "text");
			add_location(input, file$1, 54, 6, 1337);
			add_location(label, file$1, 52, 4, 1302);
			dispose = listen_dev(input, "input", ctx.input_input_handler);
		},
		m: function mount(target, anchor) {
			insert_dev(target, label, anchor);
			append_dev(label, t0);
			append_dev(label, input);
			set_input_value(input, ctx.$loginStore.value);
			loginInput_action = ctx.loginInput.call(null, input) || ({});
			append_dev(label, t1);
			if (if_block0) if_block0.m(label, null);
			append_dev(label, t2);
			if (if_block1) if_block1.m(label, null);
		},
		p: function update(changed, ctx) {
			if (changed.$loginStore && input.value !== ctx.$loginStore.value) {
				set_input_value(input, ctx.$loginStore.value);
			}

			if (changed.$loginStore) show_if_1 = ctx.$loginStore.errors.includes("minLength");

			if (show_if_1) {
				if (!if_block0) {
					if_block0 = create_if_block_2$1(ctx);
					if_block0.c();
					if_block0.m(label, t2);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (changed.$loginStore) show_if = ctx.$loginStore.errors.includes("maxLength");

			if (show_if) {
				if (!if_block1) {
					if_block1 = create_if_block_1$1(ctx);
					if_block1.c();
					if_block1.m(label, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(label);
			if (loginInput_action && is_function(loginInput_action.destroy)) loginInput_action.destroy();
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$1.name,
		type: "if",
		source: "(52:2) {#if step === 1}",
		ctx
	});

	return block;
}

// (82:6) {#if $ageStore.errors.includes('minValue')}
function create_if_block_7(ctx) {
	let p;

	const block = {
		c: function create() {
			p = element("p");
			p.textContent = "For boomers only!";
			attr_dev(p, "class", "error");
			add_location(p, file$1, 82, 8, 2394);
		},
		m: function mount(target, anchor) {
			insert_dev(target, p, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(p);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_7.name,
		type: "if",
		source: "(82:6) {#if $ageStore.errors.includes('minValue')}",
		ctx
	});

	return block;
}

// (67:6) {#if $emailStore.errors.includes('type')}
function create_if_block_5(ctx) {
	let p;

	const block = {
		c: function create() {
			p = element("p");
			p.textContent = "Email should be correct";
			attr_dev(p, "class", "error");
			add_location(p, file$1, 67, 8, 1888);
		},
		m: function mount(target, anchor) {
			insert_dev(target, p, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(p);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_5.name,
		type: "if",
		source: "(67:6) {#if $emailStore.errors.includes('type')}",
		ctx
	});

	return block;
}

// (74:6) {#if $email2Store.errors.includes('type')}
function create_if_block_4$1(ctx) {
	let p;

	const block = {
		c: function create() {
			p = element("p");
			p.textContent = "Email should be correct";
			attr_dev(p, "class", "error");
			add_location(p, file$1, 74, 8, 2130);
		},
		m: function mount(target, anchor) {
			insert_dev(target, p, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(p);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_4$1.name,
		type: "if",
		source: "(74:6) {#if $email2Store.errors.includes('type')}",
		ctx
	});

	return block;
}

// (56:6) {#if $loginStore.errors.includes('minLength')}
function create_if_block_2$1(ctx) {
	let p;

	const block = {
		c: function create() {
			p = element("p");
			p.textContent = "Login should be at least 3 symbols long";
			attr_dev(p, "class", "error");
			add_location(p, file$1, 56, 8, 1468);
		},
		m: function mount(target, anchor) {
			insert_dev(target, p, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(p);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_2$1.name,
		type: "if",
		source: "(56:6) {#if $loginStore.errors.includes('minLength')}",
		ctx
	});

	return block;
}

// (59:6) {#if $loginStore.errors.includes('maxLength')}
function create_if_block_1$1(ctx) {
	let p;

	const block = {
		c: function create() {
			p = element("p");
			p.textContent = "Login should be not longer than 15 symbols";
			attr_dev(p, "class", "error");
			add_location(p, file$1, 59, 8, 1605);
		},
		m: function mount(target, anchor) {
			insert_dev(target, p, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(p);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1$1.name,
		type: "if",
		source: "(59:6) {#if $loginStore.errors.includes('maxLength')}",
		ctx
	});

	return block;
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

	const block = {
		c: function create() {
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
			add_location(h1, file$1, 45, 2, 909);
			attr_dev(button0, "type", "button");
			toggle_class(button0, "button-active", ctx.step === 1);
			add_location(button0, file$1, 47, 4, 960);
			attr_dev(button1, "type", "button");
			toggle_class(button1, "button-active", ctx.step === 2);
			add_location(button1, file$1, 48, 4, 1064);
			attr_dev(button2, "type", "button");
			toggle_class(button2, "button-active", ctx.step === 3);
			add_location(button2, file$1, 49, 4, 1168);
			attr_dev(div, "class", "row");
			add_location(div, file$1, 46, 2, 937);
			attr_dev(button3, "type", "submit");
			add_location(button3, file$1, 86, 2, 2472);
			form.noValidate = true;
			toggle_class(form, "success", ctx.success);
			add_location(form, file$1, 39, 0, 796);

			dispose = [
				listen_dev(button0, "click", ctx.click_handler, false, false, false),
				listen_dev(button1, "click", ctx.click_handler_1, false, false, false),
				listen_dev(button2, "click", ctx.click_handler_2, false, false, false),
				listen_dev(form, "submit", prevent_default(ctx.submit_handler), false, false, true)
			];
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, form, anchor);
			append_dev(form, h1);
			append_dev(form, t1);
			append_dev(form, div);
			append_dev(div, button0);
			append_dev(div, t3);
			append_dev(div, button1);
			append_dev(div, t5);
			append_dev(div, button2);
			append_dev(form, t7);
			if (if_block) if_block.m(form, null);
			append_dev(form, t8);
			append_dev(form, button3);
			append_dev(button3, t9);

			createForm_action = ctx.createForm.call(null, form, {
				onSuccess: ctx.onSuccess,
				onFail: ctx.onFail
			}) || ({});
		},
		p: function update(changed, ctx) {
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

			if (changed.step && t9_value !== (t9_value = (ctx.step < 3 ? "NEXT" : "submit") + "")) set_data_dev(t9, t9_value);

			if (changed.success) {
				toggle_class(form, "success", ctx.success);
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(form);

			if (if_block) {
				if_block.d();
			}

			if (createForm_action && is_function(createForm_action.destroy)) createForm_action.destroy();
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$1.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$1($$self, $$props, $$invalidate) {
	let $loginStore;
	let $emailStore;
	let $email2Store;
	let $ageStore;
	const validation = new Validation({ validateOn: [] });
	const { createForm } = validation;

	const [loginStore, loginInput] = validation.createEntry({
		type: "string",
		minLength: 3,
		maxLength: 15
	});

	validate_store(loginStore, "loginStore");
	component_subscribe($$self, loginStore, value => $$invalidate("$loginStore", $loginStore = value));
	const [emailStore, emailInput] = validation.createEntry({ type: "email" });
	validate_store(emailStore, "emailStore");
	component_subscribe($$self, emailStore, value => $$invalidate("$emailStore", $emailStore = value));
	const [email2Store, email2Input] = validation.createEntry({ type: "email" });
	validate_store(email2Store, "email2Store");
	component_subscribe($$self, email2Store, value => $$invalidate("$email2Store", $email2Store = value));
	const [ageStore, ageInput] = validation.createEntry({ type: "number", minValue: 18 });
	validate_store(ageStore, "ageStore");
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

	$$self.$capture_state = () => {
		return {};
	};

	$$self.$inject_state = $$props => {
		if ("step" in $$props) $$invalidate("step", step = $$props.step);
		if ("success" in $$props) $$invalidate("success", success = $$props.success);
		if ("$loginStore" in $$props) loginStore.set($loginStore = $$props.$loginStore);
		if ("$emailStore" in $$props) emailStore.set($emailStore = $$props.$emailStore);
		if ("$email2Store" in $$props) email2Store.set($email2Store = $$props.$email2Store);
		if ("$ageStore" in $$props) ageStore.set($ageStore = $$props.$ageStore);
	};

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

class Dynamic extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Dynamic",
			options,
			id: create_fragment$1.name
		});
	}
}

/* src/demo/custom.svelte generated by Svelte v3.15.0 */
const file$2 = "src/demo/custom.svelte";

// (43:4) {#if $firstStore.errors.includes('newTypeParam')}
function create_if_block_1$2(ctx) {
	let p;

	const block = {
		c: function create() {
			p = element("p");
			p.textContent = "OMG, you've messed up";
			attr_dev(p, "class", "error");
			add_location(p, file$2, 43, 6, 1141);
		},
		m: function mount(target, anchor) {
			insert_dev(target, p, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(p);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1$2.name,
		type: "if",
		source: "(43:4) {#if $firstStore.errors.includes('newTypeParam')}",
		ctx
	});

	return block;
}

// (50:4) {#if $secondStore.errors.includes('type')}
function create_if_block$2(ctx) {
	let p;

	const block = {
		c: function create() {
			p = element("p");
			p.textContent = "OMG, you've messed up";
			attr_dev(p, "class", "error");
			add_location(p, file$2, 50, 6, 1375);
		},
		m: function mount(target, anchor) {
			insert_dev(target, p, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(p);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$2.name,
		type: "if",
		source: "(50:4) {#if $secondStore.errors.includes('type')}",
		ctx
	});

	return block;
}

function create_fragment$2(ctx) {
	let form;
	let h1;
	let t1;
	let label0;
	let t2;
	let input0;
	let firstInput_action;
	let t3;
	let show_if_1 = ctx.$firstStore.errors.includes("newTypeParam");
	let t4;
	let label1;
	let t5;
	let input1;
	let secondInput_action;
	let t6;
	let show_if = ctx.$secondStore.errors.includes("type");
	let t7;
	let button;
	let createForm_action;
	let dispose;
	let if_block0 = show_if_1 && create_if_block_1$2(ctx);
	let if_block1 = show_if && create_if_block$2(ctx);

	const block = {
		c: function create() {
			form = element("form");
			h1 = element("h1");
			h1.textContent = "Custom example";
			t1 = space();
			label0 = element("label");
			t2 = text("Type 'AAA' (by rule)\r\n    ");
			input0 = element("input");
			t3 = space();
			if (if_block0) if_block0.c();
			t4 = space();
			label1 = element("label");
			t5 = text("Type 'AAA' (by type)\r\n    ");
			input1 = element("input");
			t6 = space();
			if (if_block1) if_block1.c();
			t7 = space();
			button = element("button");
			button.textContent = "submit";
			add_location(h1, file$2, 38, 2, 944);
			attr_dev(input0, "type", "email");
			add_location(input0, file$2, 41, 4, 1010);
			add_location(label0, file$2, 39, 2, 971);
			attr_dev(input1, "type", "email");
			add_location(input1, file$2, 48, 4, 1249);
			add_location(label1, file$2, 46, 2, 1210);
			attr_dev(button, "type", "submit");
			add_location(button, file$2, 53, 2, 1444);
			form.noValidate = true;
			toggle_class(form, "success", ctx.success);
			add_location(form, file$2, 32, 0, 831);

			dispose = [
				listen_dev(input0, "input", ctx.input0_input_handler),
				listen_dev(input1, "input", ctx.input1_input_handler),
				listen_dev(form, "submit", prevent_default(ctx.submit_handler), false, false, true)
			];
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, form, anchor);
			append_dev(form, h1);
			append_dev(form, t1);
			append_dev(form, label0);
			append_dev(label0, t2);
			append_dev(label0, input0);
			set_input_value(input0, ctx.$firstStore.value);
			firstInput_action = ctx.firstInput.call(null, input0) || ({});
			append_dev(label0, t3);
			if (if_block0) if_block0.m(label0, null);
			append_dev(form, t4);
			append_dev(form, label1);
			append_dev(label1, t5);
			append_dev(label1, input1);
			set_input_value(input1, ctx.$secondStore.value);
			secondInput_action = ctx.secondInput.call(null, input1) || ({});
			append_dev(label1, t6);
			if (if_block1) if_block1.m(label1, null);
			append_dev(form, t7);
			append_dev(form, button);

			createForm_action = ctx.createForm.call(null, form, {
				onSuccess: ctx.onSuccess,
				onFail: ctx.onFail
			}) || ({});
		},
		p: function update(changed, ctx) {
			if (changed.$firstStore && input0.value !== ctx.$firstStore.value) {
				set_input_value(input0, ctx.$firstStore.value);
			}

			if (changed.$firstStore) show_if_1 = ctx.$firstStore.errors.includes("newTypeParam");

			if (show_if_1) {
				if (!if_block0) {
					if_block0 = create_if_block_1$2(ctx);
					if_block0.c();
					if_block0.m(label0, null);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (changed.$secondStore && input1.value !== ctx.$secondStore.value) {
				set_input_value(input1, ctx.$secondStore.value);
			}

			if (changed.$secondStore) show_if = ctx.$secondStore.errors.includes("type");

			if (show_if) {
				if (!if_block1) {
					if_block1 = create_if_block$2(ctx);
					if_block1.c();
					if_block1.m(label1, null);
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
		d: function destroy(detaching) {
			if (detaching) detach_dev(form);
			if (firstInput_action && is_function(firstInput_action.destroy)) firstInput_action.destroy();
			if (if_block0) if_block0.d();
			if (secondInput_action && is_function(secondInput_action.destroy)) secondInput_action.destroy();
			if (if_block1) if_block1.d();
			if (createForm_action && is_function(createForm_action.destroy)) createForm_action.destroy();
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$2.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$2($$self, $$props, $$invalidate) {
	let $firstStore;
	let $secondStore;

	addValidator("newTypeByRule", class extends StringType {
		newTypeParamRule() {
			return this.getValue() === this.params.newTypeParam;
		}
	});

	addValidator("newTypeByType", class extends BaseType {
		typeValidation() {
			return super.typeValidation(/AAA/);
		}
	});

	const validation = new Validation();
	const { createForm } = validation;

	const [firstStore, firstInput] = validation.createEntry({
		type: "newTypeByRule",
		newTypeParam: "AAA"
	});

	validate_store(firstStore, "firstStore");
	component_subscribe($$self, firstStore, value => $$invalidate("$firstStore", $firstStore = value));
	const [secondStore, secondInput] = validation.createEntry({ type: "newTypeByType" });
	validate_store(secondStore, "secondStore");
	component_subscribe($$self, secondStore, value => $$invalidate("$secondStore", $secondStore = value));
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
		$firstStore.value = this.value;
		firstStore.set($firstStore);
	}

	function input1_input_handler() {
		$secondStore.value = this.value;
		secondStore.set($secondStore);
	}

	$$self.$capture_state = () => {
		return {};
	};

	$$self.$inject_state = $$props => {
		if ("success" in $$props) $$invalidate("success", success = $$props.success);
		if ("$firstStore" in $$props) firstStore.set($firstStore = $$props.$firstStore);
		if ("$secondStore" in $$props) secondStore.set($secondStore = $$props.$secondStore);
	};

	return {
		createForm,
		firstStore,
		firstInput,
		secondStore,
		secondInput,
		success,
		onSuccess,
		onFail,
		$firstStore,
		$secondStore,
		submit_handler,
		input0_input_handler,
		input1_input_handler
	};
}

class Custom extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Custom",
			options,
			id: create_fragment$2.name
		});
	}
}

const target = document.getElementById('app');
new Demo({
    target,
    props: {
        title: '<mark>input</mark> event after form <mark>submit</mark>',
        defaultSettings: true,
        options: {
            validateOn: ['input'],
            clearOn: ['reset'],
            inputValidationPhase: PhaseEnum.afterFirstValidation
        }
    }
});
new Demo({
    target,
    props: {
        title: '<mark>blur</mark> / <mark>focus</mark> events <mark>always</mark>',
        options: {
            validateOn: ['blur'],
            clearOn: ['focus'],
            inputValidationPhase: PhaseEnum.always
        }
    }
});
new Demo({
    target,
    props: {
        title: '<mark>submit</mark> only validation',
        options: {
            inputValidationPhase: PhaseEnum.never
        }
    }
});
new Dynamic({ target });
new Custom({ target });
//# sourceMappingURL=demo.js.map
