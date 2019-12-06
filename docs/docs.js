function noop() { }
const identity = x => x;
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
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
function create_slot(definition, ctx, fn) {
    if (definition) {
        const slot_ctx = get_slot_context(definition, ctx, fn);
        return definition[0](slot_ctx);
    }
}
function get_slot_context(definition, ctx, fn) {
    return definition[1]
        ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
        : ctx.$$scope.ctx;
}
function get_slot_changes(definition, ctx, changed, fn) {
    return definition[1]
        ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
        : ctx.$$scope.changed || {};
}
function set_store_value(store, ret, value = ret) {
    store.set(value);
    return ret;
}

const is_client = typeof window !== 'undefined';
let now = is_client
    ? () => window.performance.now()
    : () => Date.now();
let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

const tasks = new Set();
let running = false;
function run_tasks() {
    tasks.forEach(task => {
        if (!task[0](now())) {
            tasks.delete(task);
            task[1]();
        }
    });
    running = tasks.size > 0;
    if (running)
        raf(run_tasks);
}
function loop(fn) {
    let task;
    if (!running) {
        running = true;
        raf(run_tasks);
    }
    return {
        promise: new Promise(fulfil => {
            tasks.add(task = [fn, fulfil]);
        }),
        abort() {
            tasks.delete(task);
        }
    };
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
function empty() {
    return text('');
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
function select_options(select, value) {
    for (let i = 0; i < select.options.length; i += 1) {
        const option = select.options[i];
        option.selected = ~value.indexOf(option.__value);
    }
}
function select_multiple_value(select) {
    return [].map.call(select.querySelectorAll(':checked'), option => option.__value);
}
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
}
function custom_event(type, detail) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, false, false, detail);
    return e;
}

let stylesheet;
let active = 0;
let current_rules = {};
// https://github.com/darkskyapp/string-hash/blob/master/index.js
function hash(str) {
    let hash = 5381;
    let i = str.length;
    while (i--)
        hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
    return hash >>> 0;
}
function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
    const step = 16.666 / duration;
    let keyframes = '{\n';
    for (let p = 0; p <= 1; p += step) {
        const t = a + (b - a) * ease(p);
        keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
    }
    const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
    const name = `__svelte_${hash(rule)}_${uid}`;
    if (!current_rules[name]) {
        if (!stylesheet) {
            const style = element('style');
            document.head.appendChild(style);
            stylesheet = style.sheet;
        }
        current_rules[name] = true;
        stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
    }
    const animation = node.style.animation || '';
    node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
    active += 1;
    return name;
}
function delete_rule(node, name) {
    node.style.animation = (node.style.animation || '')
        .split(', ')
        .filter(name
        ? anim => anim.indexOf(name) < 0 // remove specific animation
        : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
    )
        .join(', ');
    if (name && !--active)
        clear_rules();
}
function clear_rules() {
    raf(() => {
        if (active)
            return;
        let i = stylesheet.cssRules.length;
        while (i--)
            stylesheet.deleteRule(i);
        current_rules = {};
    });
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

let promise;
function wait() {
    if (!promise) {
        promise = Promise.resolve();
        promise.then(() => {
            promise = null;
        });
    }
    return promise;
}
function dispatch(node, direction, kind) {
    node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
}
const null_transition = { duration: 0 };
function create_bidirectional_transition(node, fn, params, intro) {
    let config = fn(node, params);
    let t = intro ? 0 : 1;
    let running_program = null;
    let pending_program = null;
    let animation_name = null;
    function clear_animation() {
        if (animation_name)
            delete_rule(node, animation_name);
    }
    function init(program, duration) {
        const d = program.b - t;
        duration *= Math.abs(d);
        return {
            a: t,
            b: program.b,
            d,
            duration,
            start: program.start,
            end: program.start + duration,
            group: program.group
        };
    }
    function go(b) {
        const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
        const program = {
            start: now() + delay,
            b
        };
        if (!b) {
            // @ts-ignore todo: improve typings
            program.group = outros;
            outros.r += 1;
        }
        if (running_program) {
            pending_program = program;
        }
        else {
            // if this is an intro, and there's a delay, we need to do
            // an initial tick and/or apply CSS animation immediately
            if (css) {
                clear_animation();
                animation_name = create_rule(node, t, b, duration, delay, easing, css);
            }
            if (b)
                tick(0, 1);
            running_program = init(program, duration);
            add_render_callback(() => dispatch(node, b, 'start'));
            loop(now => {
                if (pending_program && now > pending_program.start) {
                    running_program = init(pending_program, duration);
                    pending_program = null;
                    dispatch(node, running_program.b, 'start');
                    if (css) {
                        clear_animation();
                        animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                    }
                }
                if (running_program) {
                    if (now >= running_program.end) {
                        tick(t = running_program.b, 1 - t);
                        dispatch(node, running_program.b, 'end');
                        if (!pending_program) {
                            // we're done
                            if (running_program.b) {
                                // intro — we can tidy up immediately
                                clear_animation();
                            }
                            else {
                                // outro — needs to be coordinated
                                if (!--running_program.group.r)
                                    run_all(running_program.group.c);
                            }
                        }
                        running_program = null;
                    }
                    else if (now >= running_program.start) {
                        const p = now - running_program.start;
                        t = running_program.a + running_program.d * easing(p / running_program.duration);
                        tick(t, 1 - t);
                    }
                }
                return !!(running_program || pending_program);
            });
        }
    }
    return {
        run(b) {
            if (is_function(config)) {
                wait().then(() => {
                    // @ts-ignore
                    config = config();
                    go(b);
                });
            }
            else {
                go(b);
            }
        },
        end() {
            clear_animation();
            running_program = pending_program = null;
        }
    };
}
function create_component(block) {
    block && block.c();
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

function cubicOut(t) {
    const f = t - 1.0;
    return f * f * f + 1.0;
}

function fade(node, { delay = 0, duration = 400, easing = identity }) {
    const o = +getComputedStyle(node).opacity;
    return {
        delay,
        duration,
        easing,
        css: t => `opacity: ${t * o}`
    };
}
function slide(node, { delay = 0, duration = 400, easing = cubicOut }) {
    const style = getComputedStyle(node);
    const opacity = +style.opacity;
    const height = parseFloat(style.height);
    const padding_top = parseFloat(style.paddingTop);
    const padding_bottom = parseFloat(style.paddingBottom);
    const margin_top = parseFloat(style.marginTop);
    const margin_bottom = parseFloat(style.marginBottom);
    const border_top_width = parseFloat(style.borderTopWidth);
    const border_bottom_width = parseFloat(style.borderBottomWidth);
    return {
        delay,
        duration,
        easing,
        css: t => `overflow: hidden;` +
            `opacity: ${Math.min(t * 20, 1) * opacity};` +
            `height: ${t * height}px;` +
            `padding-top: ${t * padding_top}px;` +
            `padding-bottom: ${t * padding_bottom}px;` +
            `margin-top: ${t * margin_top}px;` +
            `margin-bottom: ${t * margin_bottom}px;` +
            `border-top-width: ${t * border_top_width}px;` +
            `border-bottom-width: ${t * border_bottom_width}px;`
    };
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
            const value = get_store_value(entry.store.value);
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

/* src/docs/editor/editor.svelte generated by Svelte v3.15.0 */

function create_fragment(ctx) {
	let t;

	return {
		c() {
			t = text("generator");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

function instance($$self) {
	const { createEntry, validate, validateValueStore } = createValidation({ presence: "required" });
	const [stringErrors, stringValue] = createEntry({ type: "email" });
	console.log(validateValueStore(stringValue));
	return {};
}

class Editor extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, {});
	}
}

/* src/docs/components/error/error.svelte generated by Svelte v3.15.0 */

function add_css() {
	var style = element("style");
	style.id = "svelte-1sbbkwm-style";
	style.textContent = "input[type=\"checkbox\"]~.error.svelte-1sbbkwm{margin-top:0}.error.svelte-1sbbkwm{background:#fddbd3;border:1px solid #bbb;border-radius:3px;margin-top:10px;margin-bottom:10px;padding:5px;position:relative}";
	append(document.head, style);
}

// (9:0) {#if $errors.includes(errorCode)}
function create_if_block(ctx) {
	let div;
	let div_transition;
	let current;

	function select_block_type(changed, ctx) {
		if (ctx.errorCode === "required" && !ctx.errorText) return create_if_block_1;
		return create_else_block;
	}

	let current_block_type = select_block_type(null, ctx);
	let if_block = current_block_type(ctx);

	return {
		c() {
			div = element("div");
			if_block.c();
			attr(div, "class", "error svelte-1sbbkwm");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			if_block.m(div, null);
			current = true;
		},
		p(changed, ctx) {
			if (current_block_type === (current_block_type = select_block_type(changed, ctx)) && if_block) {
				if_block.p(changed, ctx);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(div, null);
				}
			}
		},
		i(local) {
			if (current) return;

			if (local) {
				add_render_callback(() => {
					if (!div_transition) div_transition = create_bidirectional_transition(div, slide, { delay: 0, duration: 400 }, true);
					div_transition.run(1);
				});
			}

			current = true;
		},
		o(local) {
			if (local) {
				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, { delay: 0, duration: 400 }, false);
				div_transition.run(0);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if_block.d();
			if (detaching && div_transition) div_transition.end();
		}
	};
}

// (13:4) {:else}
function create_else_block(ctx) {
	let t;

	return {
		c() {
			t = text(ctx.errorText);
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		p(changed, ctx) {
			if (changed.errorText) set_data(t, ctx.errorText);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (11:4) {#if errorCode === 'required' && !errorText}
function create_if_block_1(ctx) {
	let t;

	return {
		c() {
			t = text("This field is required");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

function create_fragment$1(ctx) {
	let show_if = ctx.$errors.includes(ctx.errorCode);
	let if_block_anchor;
	let if_block = show_if && create_if_block(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},
		p(changed, ctx) {
			if (changed.$errors || changed.errorCode) show_if = ctx.$errors.includes(ctx.errorCode);

			if (show_if) {
				if (if_block) {
					if_block.p(changed, ctx);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			transition_in(if_block);
		},
		o(local) {
			transition_out(if_block);
		},
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let $errors,
		$$unsubscribe_errors = noop,
		$$subscribe_errors = () => ($$unsubscribe_errors(), $$unsubscribe_errors = subscribe(errors, $$value => $$invalidate("$errors", $errors = $$value)), errors);

	$$self.$$.on_destroy.push(() => $$unsubscribe_errors());
	let { errors } = $$props;
	$$subscribe_errors();
	let { errorCode } = $$props;
	let { errorText = "" } = $$props;

	$$self.$set = $$props => {
		if ("errors" in $$props) $$subscribe_errors($$invalidate("errors", errors = $$props.errors));
		if ("errorCode" in $$props) $$invalidate("errorCode", errorCode = $$props.errorCode);
		if ("errorText" in $$props) $$invalidate("errorText", errorText = $$props.errorText);
	};

	return { errors, errorCode, errorText, $errors };
}

class Error$1 extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1sbbkwm-style")) add_css();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, { errors: 0, errorCode: 0, errorText: 0 });
	}
}

/* src/docs/components/row/row.svelte generated by Svelte v3.15.0 */

function add_css$1() {
	var style = element("style");
	style.id = "svelte-1h2k5uq-style";
	style.textContent = ".row.svelte-1h2k5uq{margin-bottom:10px}.row.svelte-1h2k5uq:last-child{margin-bottom:0}label.svelte-1h2k5uq{display:block}button.svelte-1h2k5uq{background:none;border:1px solid #fddbd3;border-radius:3px;cursor:pointer;height:40px;font-size:inherit;margin-right:5px;line-height:28px;outline:0;padding:5px 10px;text-transform:uppercase}button.svelte-1h2k5uq:hover{border-color:#ec512a}";
	append(document.head, style);
}

// (12:2) {:else}
function create_else_block$1(ctx) {
	let button;

	return {
		c() {
			button = element("button");
			button.textContent = "validate";
			attr(button, "type", "submit");
			attr(button, "class", "svelte-1h2k5uq");
		},
		m(target, anchor) {
			insert(target, button, anchor);
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(button);
		}
	};
}

// (7:2) {#if !buttons}
function create_if_block$1(ctx) {
	let label;
	let span;
	let t0;
	let t1;
	let current;
	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);

	return {
		c() {
			label = element("label");
			span = element("span");
			t0 = text(ctx.labelText);
			t1 = space();
			if (default_slot) default_slot.c();
			attr(span, "class", "label");
			attr(label, "class", "svelte-1h2k5uq");
		},
		m(target, anchor) {
			insert(target, label, anchor);
			append(label, span);
			append(span, t0);
			append(label, t1);

			if (default_slot) {
				default_slot.m(label, null);
			}

			current = true;
		},
		p(changed, ctx) {
			if (!current || changed.labelText) set_data(t0, ctx.labelText);

			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(label);
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function create_fragment$2(ctx) {
	let div;
	let current_block_type_index;
	let if_block;
	let current;
	const if_block_creators = [create_if_block$1, create_else_block$1];
	const if_blocks = [];

	function select_block_type(changed, ctx) {
		if (!ctx.buttons) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(null, ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			div = element("div");
			if_block.c();
			attr(div, "class", "row svelte-1h2k5uq");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			if_blocks[current_block_type_index].m(div, null);
			current = true;
		},
		p(changed, ctx) {
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(changed, ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(changed, ctx);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				}

				transition_in(if_block, 1);
				if_block.m(div, null);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if_blocks[current_block_type_index].d();
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	let { labelText = "" } = $$props;
	let { buttons = false } = $$props;
	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$props => {
		if ("labelText" in $$props) $$invalidate("labelText", labelText = $$props.labelText);
		if ("buttons" in $$props) $$invalidate("buttons", buttons = $$props.buttons);
		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
	};

	return { labelText, buttons, $$slots, $$scope };
}

class Row extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1h2k5uq-style")) add_css$1();
		init(this, options, instance$2, create_fragment$2, safe_not_equal, { labelText: 0, buttons: 0 });
	}
}

/* src/docs/components/form/form.svelte generated by Svelte v3.15.0 */

function add_css$2() {
	var style = element("style");
	style.id = "svelte-10cbp9t-style";
	style.textContent = "form.svelte-10cbp9t{border:5px solid #fddbd3;border-radius:3px;margin-bottom:20px;padding:10px}";
	append(document.head, style);
}

// (10:2) {#if !noButtons}
function create_if_block$2(ctx) {
	let current;
	const row = new Row({ props: { buttons: true } });

	return {
		c() {
			create_component(row.$$.fragment);
		},
		m(target, anchor) {
			mount_component(row, target, anchor);
			current = true;
		},
		i(local) {
			if (current) return;
			transition_in(row.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(row.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(row, detaching);
		}
	};
}

function create_fragment$3(ctx) {
	let form;
	let t;
	let createForm_action;
	let current;
	let dispose;
	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);
	let if_block = !ctx.noButtons && create_if_block$2();

	return {
		c() {
			form = element("form");
			if (default_slot) default_slot.c();
			t = space();
			if (if_block) if_block.c();
			form.noValidate = true;
			attr(form, "class", "svelte-10cbp9t");
			dispose = listen(form, "submit", prevent_default(ctx.submit_handler));
		},
		m(target, anchor) {
			insert(target, form, anchor);

			if (default_slot) {
				default_slot.m(form, null);
			}

			append(form, t);
			if (if_block) if_block.m(form, null);
			createForm_action = ctx.createForm.call(null, form) || ({});
			current = true;
		},
		p(changed, ctx) {
			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
			}

			if (!ctx.noButtons) {
				if (!if_block) {
					if_block = create_if_block$2();
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(form, null);
				} else {
					transition_in(if_block, 1);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(form);
			if (default_slot) default_slot.d(detaching);
			if (if_block) if_block.d();
			if (createForm_action && is_function(createForm_action.destroy)) createForm_action.destroy();
			dispose();
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	let { createForm } = $$props;
	let { noButtons = false } = $$props;
	let { $$slots = {}, $$scope } = $$props;

	function submit_handler(event) {
		bubble($$self, event);
	}

	$$self.$set = $$props => {
		if ("createForm" in $$props) $$invalidate("createForm", createForm = $$props.createForm);
		if ("noButtons" in $$props) $$invalidate("noButtons", noButtons = $$props.noButtons);
		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
	};

	return {
		createForm,
		noButtons,
		submit_handler,
		$$slots,
		$$scope
	};
}

class Form extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-10cbp9t-style")) add_css$2();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, { createForm: 0, noButtons: 0 });
	}
}

/* src/docs/components/code/code.svelte generated by Svelte v3.15.0 */

function add_css$3() {
	var style = element("style");
	style.id = "svelte-1qxcboa-style";
	style.textContent = "pre.svelte-1qxcboa{margin-bottom:10px;overflow-x:auto}";
	append(document.head, style);
}

function create_fragment$4(ctx) {
	let pre;
	let code;

	return {
		c() {
			pre = element("pre");
			code = element("code");
			attr(pre, "class", "svelte-1qxcboa");
		},
		m(target, anchor) {
			insert(target, pre, anchor);
			append(pre, code);
			code.innerHTML = ctx.html;
		},
		p(changed, ctx) {
			if (changed.html) code.innerHTML = ctx.html;		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(pre);
		}
	};
}

function instance$4($$self, $$props, $$invalidate) {
	let { html } = $$props;

	$$self.$set = $$props => {
		if ("html" in $$props) $$invalidate("html", html = $$props.html);
	};

	return { html };
}

class Code extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1qxcboa-style")) add_css$3();
		init(this, options, instance$4, create_fragment$4, safe_not_equal, { html: 0 });
	}
}

/* src/docs/components/types/string.svelte generated by Svelte v3.15.0 */

function create_default_slot_2(ctx) {
	let input;
	let inputMin_action;
	let t;
	let current;
	let dispose;

	const error = new Error$1({
			props: {
				errors: ctx.errorsMin,
				errorCode: "min",
				errorText: "Use at least 3 symbols"
			}
		});

	return {
		c() {
			input = element("input");
			t = space();
			create_component(error.$$.fragment);
			attr(input, "class", "input-text");
			attr(input, "placeholder", "type: 'string', min: 3");
			dispose = listen(input, "input", ctx.input_input_handler);
		},
		m(target, anchor) {
			insert(target, input, anchor);
			set_input_value(input, ctx.$valueMin);
			inputMin_action = ctx.inputMin.call(null, input) || ({});
			insert(target, t, anchor);
			mount_component(error, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			if (changed.$valueMin && input.value !== ctx.$valueMin) {
				set_input_value(input, ctx.$valueMin);
			}
		},
		i(local) {
			if (current) return;
			transition_in(error.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(error.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(input);
			if (inputMin_action && is_function(inputMin_action.destroy)) inputMin_action.destroy();
			if (detaching) detach(t);
			destroy_component(error, detaching);
			dispose();
		}
	};
}

// (35:2) <Row>
function create_default_slot_1(ctx) {
	let input;
	let inputMax_action;
	let t0;
	let t1;
	let current;
	let dispose;

	const error0 = new Error$1({
			props: {
				errors: ctx.errorsMax,
				errorCode: "max",
				errorText: "Use 5 or less symbols"
			}
		});

	const error1 = new Error$1({
			props: {
				errors: ctx.errorsMax,
				errorCode: "required"
			}
		});

	return {
		c() {
			input = element("input");
			t0 = space();
			create_component(error0.$$.fragment);
			t1 = space();
			create_component(error1.$$.fragment);
			attr(input, "class", "input-text");
			attr(input, "placeholder", "type: 'string', max: 5, required: true");
			dispose = listen(input, "input", ctx.input_input_handler_1);
		},
		m(target, anchor) {
			insert(target, input, anchor);
			set_input_value(input, ctx.$valueMax);
			inputMax_action = ctx.inputMax.call(null, input) || ({});
			insert(target, t0, anchor);
			mount_component(error0, target, anchor);
			insert(target, t1, anchor);
			mount_component(error1, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			if (changed.$valueMax && input.value !== ctx.$valueMax) {
				set_input_value(input, ctx.$valueMax);
			}
		},
		i(local) {
			if (current) return;
			transition_in(error0.$$.fragment, local);
			transition_in(error1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(error0.$$.fragment, local);
			transition_out(error1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(input);
			if (inputMax_action && is_function(inputMax_action.destroy)) inputMax_action.destroy();
			if (detaching) detach(t0);
			destroy_component(error0, detaching);
			if (detaching) detach(t1);
			destroy_component(error1, detaching);
			dispose();
		}
	};
}

// (18:0) <Form {createForm}>
function create_default_slot(ctx) {
	let h1;
	let t1;
	let t2;
	let t3;
	let t4;
	let current;

	const code0 = new Code({
			props: {
				html: `const [
  [ errorsMin, valueMin, inputMin ],
  [ errorsMax, valueMax, inputMax ]
] = createEntries([
  { type: 'string', min: 3 },
  { type: 'string', max: 5, required: true },
]);`
			}
		});

	const code1 = new Code({
			props: {
				html: `&lt;input use:inputMin bind:value={$valueMin} />
{#if $errorsMin.includes('min')}Use at least 3 symbols{/if}
&lt;input use:inputMax bind:value={$valueMax} />
{#if $errorsMax.includes('max')}Use 5 or less symbols{/if}`
			}
		});

	const row0 = new Row({
			props: {
				$$slots: { default: [create_default_slot_2] },
				$$scope: { ctx }
			}
		});

	const row1 = new Row({
			props: {
				$$slots: { default: [create_default_slot_1] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			h1 = element("h1");
			h1.textContent = "string";
			t1 = space();
			create_component(code0.$$.fragment);
			t2 = space();
			create_component(code1.$$.fragment);
			t3 = space();
			create_component(row0.$$.fragment);
			t4 = space();
			create_component(row1.$$.fragment);
		},
		m(target, anchor) {
			insert(target, h1, anchor);
			insert(target, t1, anchor);
			mount_component(code0, target, anchor);
			insert(target, t2, anchor);
			mount_component(code1, target, anchor);
			insert(target, t3, anchor);
			mount_component(row0, target, anchor);
			insert(target, t4, anchor);
			mount_component(row1, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const row0_changes = {};

			if (changed.$$scope || changed.$valueMin) {
				row0_changes.$$scope = { changed, ctx };
			}

			row0.$set(row0_changes);
			const row1_changes = {};

			if (changed.$$scope || changed.$valueMax) {
				row1_changes.$$scope = { changed, ctx };
			}

			row1.$set(row1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(code0.$$.fragment, local);
			transition_in(code1.$$.fragment, local);
			transition_in(row0.$$.fragment, local);
			transition_in(row1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(code0.$$.fragment, local);
			transition_out(code1.$$.fragment, local);
			transition_out(row0.$$.fragment, local);
			transition_out(row1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(h1);
			if (detaching) detach(t1);
			destroy_component(code0, detaching);
			if (detaching) detach(t2);
			destroy_component(code1, detaching);
			if (detaching) detach(t3);
			destroy_component(row0, detaching);
			if (detaching) detach(t4);
			destroy_component(row1, detaching);
		}
	};
}

function create_fragment$5(ctx) {
	let current;

	const form = new Form({
			props: {
				createForm: ctx.createForm,
				$$slots: { default: [create_default_slot] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(form.$$.fragment);
		},
		m(target, anchor) {
			mount_component(form, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const form_changes = {};

			if (changed.$$scope || changed.$valueMax || changed.$valueMin) {
				form_changes.$$scope = { changed, ctx };
			}

			form.$set(form_changes);
		},
		i(local) {
			if (current) return;
			transition_in(form.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(form.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(form, detaching);
		}
	};
}

function instance$5($$self, $$props, $$invalidate) {
	let $valueMin;
	let $valueMax;
	const { createEntries, createForm } = createValidation({ validateOnEvents: { input: true } });
	const [[errorsMin, valueMin, inputMin], [errorsMax, valueMax, inputMax]] = createEntries([{ type: "string", min: 3 }, { type: "string", max: 5, required: true }]);
	component_subscribe($$self, valueMin, value => $$invalidate("$valueMin", $valueMin = value));
	component_subscribe($$self, valueMax, value => $$invalidate("$valueMax", $valueMax = value));

	function input_input_handler() {
		$valueMin = this.value;
		valueMin.set($valueMin);
	}

	function input_input_handler_1() {
		$valueMax = this.value;
		valueMax.set($valueMax);
	}

	return {
		createForm,
		errorsMin,
		valueMin,
		inputMin,
		errorsMax,
		valueMax,
		inputMax,
		$valueMin,
		$valueMax,
		input_input_handler,
		input_input_handler_1
	};
}

class String$1 extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});
	}
}

/* src/docs/components/types/email.svelte generated by Svelte v3.15.0 */

function create_default_slot_1$1(ctx) {
	let input_1;
	let input_action;
	let t;
	let current;
	let dispose;

	const error = new Error$1({
			props: {
				errors: ctx.errors,
				errorCode: "typeCheck",
				errorText: "Use valid email"
			}
		});

	return {
		c() {
			input_1 = element("input");
			t = space();
			create_component(error.$$.fragment);
			attr(input_1, "class", "input-text");
			attr(input_1, "type", "email");
			attr(input_1, "placeholder", "type: 'email', required: true");
			dispose = listen(input_1, "input", ctx.input_1_input_handler);
		},
		m(target, anchor) {
			insert(target, input_1, anchor);
			set_input_value(input_1, ctx.$value);
			input_action = ctx.input.call(null, input_1) || ({});
			insert(target, t, anchor);
			mount_component(error, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			if (changed.$value && input_1.value !== ctx.$value) {
				set_input_value(input_1, ctx.$value);
			}
		},
		i(local) {
			if (current) return;
			transition_in(error.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(error.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(input_1);
			if (input_action && is_function(input_action.destroy)) input_action.destroy();
			if (detaching) detach(t);
			destroy_component(error, detaching);
			dispose();
		}
	};
}

// (14:0) <Form {createForm}>
function create_default_slot$1(ctx) {
	let h1;
	let t1;
	let t2;
	let t3;
	let current;

	const code0 = new Code({
			props: {
				html: `const [ errors, value, input ] = createEntry({
  type: 'email', required: true
});`
			}
		});

	const code1 = new Code({
			props: {
				html: `&lt;input use:input bind:value={$value} />
{#if $errors.includes('typeCheck')}Use valid email{/if}`
			}
		});

	const row = new Row({
			props: {
				labelText: "Type your email",
				$$slots: { default: [create_default_slot_1$1] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			h1 = element("h1");
			h1.textContent = "email";
			t1 = space();
			create_component(code0.$$.fragment);
			t2 = space();
			create_component(code1.$$.fragment);
			t3 = space();
			create_component(row.$$.fragment);
		},
		m(target, anchor) {
			insert(target, h1, anchor);
			insert(target, t1, anchor);
			mount_component(code0, target, anchor);
			insert(target, t2, anchor);
			mount_component(code1, target, anchor);
			insert(target, t3, anchor);
			mount_component(row, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const row_changes = {};

			if (changed.$$scope || changed.$value) {
				row_changes.$$scope = { changed, ctx };
			}

			row.$set(row_changes);
		},
		i(local) {
			if (current) return;
			transition_in(code0.$$.fragment, local);
			transition_in(code1.$$.fragment, local);
			transition_in(row.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(code0.$$.fragment, local);
			transition_out(code1.$$.fragment, local);
			transition_out(row.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(h1);
			if (detaching) detach(t1);
			destroy_component(code0, detaching);
			if (detaching) detach(t2);
			destroy_component(code1, detaching);
			if (detaching) detach(t3);
			destroy_component(row, detaching);
		}
	};
}

function create_fragment$6(ctx) {
	let current;

	const form = new Form({
			props: {
				createForm: ctx.createForm,
				$$slots: { default: [create_default_slot$1] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(form.$$.fragment);
		},
		m(target, anchor) {
			mount_component(form, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const form_changes = {};

			if (changed.$$scope || changed.$value) {
				form_changes.$$scope = { changed, ctx };
			}

			form.$set(form_changes);
		},
		i(local) {
			if (current) return;
			transition_in(form.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(form.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(form, detaching);
		}
	};
}

function instance$6($$self, $$props, $$invalidate) {
	let $value;
	const { createEntry, createForm } = createValidation({ validateOnEvents: { input: true } });
	const [errors, value, input] = createEntry({ type: "email", required: true });
	component_subscribe($$self, value, value => $$invalidate("$value", $value = value));

	function input_1_input_handler() {
		$value = this.value;
		value.set($value);
	}

	return {
		createForm,
		errors,
		value,
		input,
		$value,
		input_1_input_handler
	};
}

class Email extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});
	}
}

/* src/docs/components/types/number.svelte generated by Svelte v3.15.0 */

function create_else_block_1(ctx) {
	let current;

	const error = new Error$1({
			props: {
				errors: ctx.errorsMin,
				errorCode: "min",
				errorText: "For boomers only!"
			}
		});

	return {
		c() {
			create_component(error.$$.fragment);
		},
		m(target, anchor) {
			mount_component(error, target, anchor);
			current = true;
		},
		p: noop,
		i(local) {
			if (current) return;
			transition_in(error.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(error.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(error, detaching);
		}
	};
}

// (41:4) {#if $errorsMin.includes('required')}
function create_if_block_1$1(ctx) {
	let current;

	const error = new Error$1({
			props: {
				errors: ctx.errorsMin,
				errorCode: "required"
			}
		});

	return {
		c() {
			create_component(error.$$.fragment);
		},
		m(target, anchor) {
			mount_component(error, target, anchor);
			current = true;
		},
		p: noop,
		i(local) {
			if (current) return;
			transition_in(error.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(error.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(error, detaching);
		}
	};
}

// (39:2) <Row labelText="Type your age #1">
function create_default_slot_2$1(ctx) {
	let input;
	let input_updating = false;
	let inputMin_action;
	let t;
	let show_if;
	let current_block_type_index;
	let if_block;
	let if_block_anchor;
	let current;
	let dispose;

	function input_input_handler() {
		input_updating = true;
		ctx.input_input_handler.call(input);
	}

	const if_block_creators = [create_if_block_1$1, create_else_block_1];
	const if_blocks = [];

	function select_block_type(changed, ctx) {
		if (show_if == null || changed.$errorsMin) show_if = !!ctx.$errorsMin.includes("required");
		if (show_if) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(null, ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			input = element("input");
			t = space();
			if_block.c();
			if_block_anchor = empty();
			attr(input, "class", "input-text");
			attr(input, "type", "number");
			attr(input, "placeholder", "type: 'number', min: 18, required: true");
			dispose = listen(input, "input", input_input_handler);
		},
		m(target, anchor) {
			insert(target, input, anchor);
			set_input_value(input, ctx.$valueMin);
			inputMin_action = ctx.inputMin.call(null, input) || ({});
			insert(target, t, anchor);
			if_blocks[current_block_type_index].m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(changed, ctx) {
			if (!input_updating && changed.$valueMin) {
				set_input_value(input, ctx.$valueMin);
			}

			input_updating = false;
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(changed, ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(changed, ctx);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				}

				transition_in(if_block, 1);
				if_block.m(if_block_anchor.parentNode, if_block_anchor);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(input);
			if (inputMin_action && is_function(inputMin_action.destroy)) inputMin_action.destroy();
			if (detaching) detach(t);
			if_blocks[current_block_type_index].d(detaching);
			if (detaching) detach(if_block_anchor);
			dispose();
		}
	};
}

// (51:4) {:else}
function create_else_block$2(ctx) {
	let current;

	const error = new Error$1({
			props: {
				errors: ctx.errorsMax,
				errorCode: "max",
				errorText: "Not for boomers!"
			}
		});

	return {
		c() {
			create_component(error.$$.fragment);
		},
		m(target, anchor) {
			mount_component(error, target, anchor);
			current = true;
		},
		p: noop,
		i(local) {
			if (current) return;
			transition_in(error.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(error.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(error, detaching);
		}
	};
}

// (49:4) {#if $errorsMax.includes('required')}
function create_if_block$3(ctx) {
	let current;

	const error = new Error$1({
			props: {
				errors: ctx.errorsMin,
				errorCode: "required"
			}
		});

	return {
		c() {
			create_component(error.$$.fragment);
		},
		m(target, anchor) {
			mount_component(error, target, anchor);
			current = true;
		},
		p: noop,
		i(local) {
			if (current) return;
			transition_in(error.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(error.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(error, detaching);
		}
	};
}

// (47:2) <Row labelText="Type your age #2">
function create_default_slot_1$2(ctx) {
	let input;
	let input_updating = false;
	let inputMax_action;
	let t;
	let show_if;
	let current_block_type_index;
	let if_block;
	let if_block_anchor;
	let current;
	let dispose;

	function input_input_handler_1() {
		input_updating = true;
		ctx.input_input_handler_1.call(input);
	}

	const if_block_creators = [create_if_block$3, create_else_block$2];
	const if_blocks = [];

	function select_block_type_1(changed, ctx) {
		if (show_if == null || changed.$errorsMax) show_if = !!ctx.$errorsMax.includes("required");
		if (show_if) return 0;
		return 1;
	}

	current_block_type_index = select_block_type_1(null, ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			input = element("input");
			t = space();
			if_block.c();
			if_block_anchor = empty();
			attr(input, "class", "input-text");
			attr(input, "type", "number");
			attr(input, "placeholder", "type: 'number', max: 18, required: true");
			dispose = listen(input, "input", input_input_handler_1);
		},
		m(target, anchor) {
			insert(target, input, anchor);
			set_input_value(input, ctx.$valueMax);
			inputMax_action = ctx.inputMax.call(null, input) || ({});
			insert(target, t, anchor);
			if_blocks[current_block_type_index].m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(changed, ctx) {
			if (!input_updating && changed.$valueMax) {
				set_input_value(input, ctx.$valueMax);
			}

			input_updating = false;
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type_1(changed, ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(changed, ctx);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				}

				transition_in(if_block, 1);
				if_block.m(if_block_anchor.parentNode, if_block_anchor);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(input);
			if (inputMax_action && is_function(inputMax_action.destroy)) inputMax_action.destroy();
			if (detaching) detach(t);
			if_blocks[current_block_type_index].d(detaching);
			if (detaching) detach(if_block_anchor);
			dispose();
		}
	};
}

// (18:0) <Form {createForm}>
function create_default_slot$2(ctx) {
	let h1;
	let t1;
	let t2;
	let t3;
	let t4;
	let current;

	const code0 = new Code({
			props: {
				html: `const [
  [ errorsMin, valueMin, inputMin ],
  [ errorsMax, valueMax, inputMax ],
] = createEntries([
  { type: 'number', min: 18, required: true },
  { type: 'number', max: 18, required: true }
]);`
			}
		});

	const code1 = new Code({
			props: {
				html: `&lt;input use:inputMin bind:value={$valueMin} type="number" />
{#if $errorsMin.includes('required')}
  This field is required
{:else if $errorsMin.includes('min')}
  For boomers only!
{/if}
&lt;input use:inputMax bind:value={$valueMax} type="number" />
{#if $errorsMax.includes('required')}
  This field is required
{:else if $errorsMax.includes('max')}
  Not for boomers!
{/if}`
			}
		});

	const row0 = new Row({
			props: {
				labelText: "Type your age #1",
				$$slots: { default: [create_default_slot_2$1] },
				$$scope: { ctx }
			}
		});

	const row1 = new Row({
			props: {
				labelText: "Type your age #2",
				$$slots: { default: [create_default_slot_1$2] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			h1 = element("h1");
			h1.textContent = "number";
			t1 = space();
			create_component(code0.$$.fragment);
			t2 = space();
			create_component(code1.$$.fragment);
			t3 = space();
			create_component(row0.$$.fragment);
			t4 = space();
			create_component(row1.$$.fragment);
		},
		m(target, anchor) {
			insert(target, h1, anchor);
			insert(target, t1, anchor);
			mount_component(code0, target, anchor);
			insert(target, t2, anchor);
			mount_component(code1, target, anchor);
			insert(target, t3, anchor);
			mount_component(row0, target, anchor);
			insert(target, t4, anchor);
			mount_component(row1, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const row0_changes = {};

			if (changed.$$scope || changed.$errorsMin || changed.$valueMin) {
				row0_changes.$$scope = { changed, ctx };
			}

			row0.$set(row0_changes);
			const row1_changes = {};

			if (changed.$$scope || changed.$errorsMax || changed.$valueMax) {
				row1_changes.$$scope = { changed, ctx };
			}

			row1.$set(row1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(code0.$$.fragment, local);
			transition_in(code1.$$.fragment, local);
			transition_in(row0.$$.fragment, local);
			transition_in(row1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(code0.$$.fragment, local);
			transition_out(code1.$$.fragment, local);
			transition_out(row0.$$.fragment, local);
			transition_out(row1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(h1);
			if (detaching) detach(t1);
			destroy_component(code0, detaching);
			if (detaching) detach(t2);
			destroy_component(code1, detaching);
			if (detaching) detach(t3);
			destroy_component(row0, detaching);
			if (detaching) detach(t4);
			destroy_component(row1, detaching);
		}
	};
}

function create_fragment$7(ctx) {
	let current;

	const form = new Form({
			props: {
				createForm: ctx.createForm,
				$$slots: { default: [create_default_slot$2] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(form.$$.fragment);
		},
		m(target, anchor) {
			mount_component(form, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const form_changes = {};

			if (changed.$$scope || changed.$errorsMax || changed.$valueMax || changed.$errorsMin || changed.$valueMin) {
				form_changes.$$scope = { changed, ctx };
			}

			form.$set(form_changes);
		},
		i(local) {
			if (current) return;
			transition_in(form.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(form.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(form, detaching);
		}
	};
}

function instance$7($$self, $$props, $$invalidate) {
	let $valueMin;
	let $errorsMin;
	let $valueMax;
	let $errorsMax;
	const { createEntries, createForm } = createValidation({ validateOnEvents: { input: true } });

	const [[errorsMin, valueMin, inputMin], [errorsMax, valueMax, inputMax]] = createEntries([
		{ type: "number", min: 18, required: true },
		{ type: "number", max: 18, required: true }
	]);

	component_subscribe($$self, errorsMin, value => $$invalidate("$errorsMin", $errorsMin = value));
	component_subscribe($$self, valueMin, value => $$invalidate("$valueMin", $valueMin = value));
	component_subscribe($$self, errorsMax, value => $$invalidate("$errorsMax", $errorsMax = value));
	component_subscribe($$self, valueMax, value => $$invalidate("$valueMax", $valueMax = value));

	function input_input_handler() {
		$valueMin = to_number(this.value);
		valueMin.set($valueMin);
	}

	function input_input_handler_1() {
		$valueMax = to_number(this.value);
		valueMax.set($valueMax);
	}

	return {
		createForm,
		errorsMin,
		valueMin,
		inputMin,
		errorsMax,
		valueMax,
		inputMax,
		$valueMin,
		$errorsMin,
		$valueMax,
		$errorsMax,
		input_input_handler,
		input_input_handler_1
	};
}

class Number extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});
	}
}

/* src/docs/components/cells/cells.svelte generated by Svelte v3.15.0 */

function add_css$4() {
	var style = element("style");
	style.id = "svelte-oqyskm-style";
	style.textContent = ".holder.svelte-oqyskm{display:flex;flex-wrap:wrap;align-content:flex-start;align-items:flex-start;padding:10px;justify-content:center}.holder.svelte-oqyskm>*{background:#e0e0e0;border-radius:3px;cursor:pointer;margin:0 5px 10px;overflow:hidden;padding:5px;text-align:center;width:150px}.holder.svelte-oqyskm input{display:block;margin:0 auto 5px}";
	append(document.head, style);
}

function create_fragment$8(ctx) {
	let div;
	let current;
	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);

	return {
		c() {
			div = element("div");
			if (default_slot) default_slot.c();
			attr(div, "class", "holder svelte-oqyskm");
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			current = true;
		},
		p(changed, ctx) {
			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance$8($$self, $$props, $$invalidate) {
	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$props => {
		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
	};

	return { $$slots, $$scope };
}

class Cells extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-oqyskm-style")) add_css$4();
		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});
	}
}

/* src/docs/components/types/boolean.svelte generated by Svelte v3.15.0 */

function create_default_slot_1$3(ctx) {
	let label;
	let input_1;
	let input_action;
	let t;
	let dispose;

	return {
		c() {
			label = element("label");
			input_1 = element("input");
			t = text(" Are you agree?");
			attr(input_1, "class", "input-choice");
			attr(input_1, "type", "checkbox");
			dispose = listen(input_1, "change", ctx.input_1_change_handler);
		},
		m(target, anchor) {
			insert(target, label, anchor);
			append(label, input_1);
			input_1.checked = ctx.$value;
			input_action = ctx.input.call(null, input_1) || ({});
			append(label, t);
		},
		p(changed, ctx) {
			if (changed.$value) {
				input_1.checked = ctx.$value;
			}
		},
		d(detaching) {
			if (detaching) detach(label);
			if (input_action && is_function(input_action.destroy)) input_action.destroy();
			dispose();
		}
	};
}

// (16:0) <Form {createForm}>
function create_default_slot$3(ctx) {
	let h1;
	let t1;
	let t2;
	let t3;
	let t4;
	let current;

	const code0 = new Code({
			props: {
				html: `const [ errors, value, input ] = createEntry({
  value: false,
  type: 'boolean',
  required: true
});`
			}
		});

	const code1 = new Code({
			props: {
				html: `&lt;input use:inputMin bind:value={$valueMin} class="input-text" />
&lt;input use:input bind:checked={$value} type="checkbox" />
{#if $errors.includes('required')}Please check{/if}`
			}
		});

	const cells = new Cells({
			props: {
				$$slots: { default: [create_default_slot_1$3] },
				$$scope: { ctx }
			}
		});

	const error = new Error$1({
			props: {
				errors: ctx.errors,
				errorCode: "required",
				errorText: "Please check"
			}
		});

	return {
		c() {
			h1 = element("h1");
			h1.textContent = "boolean";
			t1 = space();
			create_component(code0.$$.fragment);
			t2 = space();
			create_component(code1.$$.fragment);
			t3 = space();
			create_component(cells.$$.fragment);
			t4 = space();
			create_component(error.$$.fragment);
		},
		m(target, anchor) {
			insert(target, h1, anchor);
			insert(target, t1, anchor);
			mount_component(code0, target, anchor);
			insert(target, t2, anchor);
			mount_component(code1, target, anchor);
			insert(target, t3, anchor);
			mount_component(cells, target, anchor);
			insert(target, t4, anchor);
			mount_component(error, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const cells_changes = {};

			if (changed.$$scope || changed.$value) {
				cells_changes.$$scope = { changed, ctx };
			}

			cells.$set(cells_changes);
		},
		i(local) {
			if (current) return;
			transition_in(code0.$$.fragment, local);
			transition_in(code1.$$.fragment, local);
			transition_in(cells.$$.fragment, local);
			transition_in(error.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(code0.$$.fragment, local);
			transition_out(code1.$$.fragment, local);
			transition_out(cells.$$.fragment, local);
			transition_out(error.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(h1);
			if (detaching) detach(t1);
			destroy_component(code0, detaching);
			if (detaching) detach(t2);
			destroy_component(code1, detaching);
			if (detaching) detach(t3);
			destroy_component(cells, detaching);
			if (detaching) detach(t4);
			destroy_component(error, detaching);
		}
	};
}

function create_fragment$9(ctx) {
	let current;

	const form = new Form({
			props: {
				createForm: ctx.createForm,
				$$slots: { default: [create_default_slot$3] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(form.$$.fragment);
		},
		m(target, anchor) {
			mount_component(form, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const form_changes = {};

			if (changed.$$scope || changed.$value) {
				form_changes.$$scope = { changed, ctx };
			}

			form.$set(form_changes);
		},
		i(local) {
			if (current) return;
			transition_in(form.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(form.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(form, detaching);
		}
	};
}

function instance$9($$self, $$props, $$invalidate) {
	let $value;
	const { createEntry, createForm } = createValidation({ validateOnEvents: { change: true } });

	const [errors, value, input] = createEntry({
		value: false,
		type: "boolean",
		required: true
	});

	component_subscribe($$self, value, value => $$invalidate("$value", $value = value));

	function input_1_change_handler() {
		$value = this.checked;
		value.set($value);
	}

	return {
		createForm,
		errors,
		value,
		input,
		$value,
		input_1_change_handler
	};
}

class Boolean extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});
	}
}

/* src/docs/components/types/array.svelte generated by Svelte v3.15.0 */

function create_default_slot_3(ctx) {
	let label0;
	let input0;
	let input0_value_value;
	let input_action;
	let t0;
	let t1;
	let label1;
	let input1;
	let input1_value_value;
	let input_action_1;
	let t2;
	let t3;
	let label2;
	let input2;
	let input2_value_value;
	let input_action_2;
	let t4;
	let dispose;

	return {
		c() {
			label0 = element("label");
			input0 = element("input");
			t0 = text(" First option");
			t1 = space();
			label1 = element("label");
			input1 = element("input");
			t2 = text(" Second option");
			t3 = space();
			label2 = element("label");
			input2 = element("input");
			t4 = text(" Third option");
			input0.__value = input0_value_value = 1;
			input0.value = input0.__value;
			attr(input0, "class", "input-choice");
			attr(input0, "type", "checkbox");
			ctx.$$binding_groups[0].push(input0);
			input1.__value = input1_value_value = 2;
			input1.value = input1.__value;
			attr(input1, "class", "input-choice");
			attr(input1, "type", "checkbox");
			ctx.$$binding_groups[0].push(input1);
			input2.__value = input2_value_value = 3;
			input2.value = input2.__value;
			attr(input2, "class", "input-choice");
			attr(input2, "type", "checkbox");
			ctx.$$binding_groups[0].push(input2);

			dispose = [
				listen(input0, "change", ctx.input0_change_handler),
				listen(input1, "change", ctx.input1_change_handler),
				listen(input2, "change", ctx.input2_change_handler)
			];
		},
		m(target, anchor) {
			insert(target, label0, anchor);
			append(label0, input0);
			input0.checked = ~ctx.$value.indexOf(input0.__value);
			input_action = ctx.input.call(null, input0) || ({});
			append(label0, t0);
			insert(target, t1, anchor);
			insert(target, label1, anchor);
			append(label1, input1);
			input1.checked = ~ctx.$value.indexOf(input1.__value);
			input_action_1 = ctx.input.call(null, input1) || ({});
			append(label1, t2);
			insert(target, t3, anchor);
			insert(target, label2, anchor);
			append(label2, input2);
			input2.checked = ~ctx.$value.indexOf(input2.__value);
			input_action_2 = ctx.input.call(null, input2) || ({});
			append(label2, t4);
		},
		p(changed, ctx) {
			if (changed.$value) {
				input0.checked = ~ctx.$value.indexOf(input0.__value);
			}

			if (changed.$value) {
				input1.checked = ~ctx.$value.indexOf(input1.__value);
			}

			if (changed.$value) {
				input2.checked = ~ctx.$value.indexOf(input2.__value);
			}
		},
		d(detaching) {
			if (detaching) detach(label0);
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input0), 1);
			if (input_action && is_function(input_action.destroy)) input_action.destroy();
			if (detaching) detach(t1);
			if (detaching) detach(label1);
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input1), 1);
			if (input_action_1 && is_function(input_action_1.destroy)) input_action_1.destroy();
			if (detaching) detach(t3);
			if (detaching) detach(label2);
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input2), 1);
			if (input_action_2 && is_function(input_action_2.destroy)) input_action_2.destroy();
			run_all(dispose);
		}
	};
}

// (24:0) <Form createForm={createForm1}>
function create_default_slot_2$2(ctx) {
	let h1;
	let t1;
	let t2;
	let t3;
	let t4;
	let current;

	const code0 = new Code({
			props: {
				html: `const [ errors, value, input ] = createEntry({
  type: 'array',
  min: 2,
  value: []
});`
			}
		});

	const code1 = new Code({
			props: {
				html: `&lt;input use:input bind:group={$value} value={1} type="checkbox" /> First option
&lt;input use:input bind:group={$value} value={2} type="checkbox" /> Second option
&lt;input use:input bind:group={$value} value={3} type="checkbox" /> Third option
{#if $errors.includes('required')}Pick something please{/if}`
			}
		});

	const cells = new Cells({
			props: {
				$$slots: { default: [create_default_slot_3] },
				$$scope: { ctx }
			}
		});

	const error = new Error$1({
			props: {
				errors: ctx.errors,
				errorCode: "min",
				errorText: "Pick at least 2, please"
			}
		});

	return {
		c() {
			h1 = element("h1");
			h1.textContent = "array checkbox";
			t1 = space();
			create_component(code0.$$.fragment);
			t2 = space();
			create_component(code1.$$.fragment);
			t3 = space();
			create_component(cells.$$.fragment);
			t4 = space();
			create_component(error.$$.fragment);
		},
		m(target, anchor) {
			insert(target, h1, anchor);
			insert(target, t1, anchor);
			mount_component(code0, target, anchor);
			insert(target, t2, anchor);
			mount_component(code1, target, anchor);
			insert(target, t3, anchor);
			mount_component(cells, target, anchor);
			insert(target, t4, anchor);
			mount_component(error, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const cells_changes = {};

			if (changed.$$scope || changed.$value) {
				cells_changes.$$scope = { changed, ctx };
			}

			cells.$set(cells_changes);
		},
		i(local) {
			if (current) return;
			transition_in(code0.$$.fragment, local);
			transition_in(code1.$$.fragment, local);
			transition_in(cells.$$.fragment, local);
			transition_in(error.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(code0.$$.fragment, local);
			transition_out(code1.$$.fragment, local);
			transition_out(cells.$$.fragment, local);
			transition_out(error.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(h1);
			if (detaching) detach(t1);
			destroy_component(code0, detaching);
			if (detaching) detach(t2);
			destroy_component(code1, detaching);
			if (detaching) detach(t3);
			destroy_component(cells, detaching);
			if (detaching) detach(t4);
			destroy_component(error, detaching);
		}
	};
}

// (56:2) <Row labelText="Pick few options">
function create_default_slot_1$4(ctx) {
	let select;
	let option0;
	let option0_value_value;
	let option1;
	let option1_value_value;
	let option2;
	let option2_value_value;
	let inputSelect_action;
	let t3;
	let current;
	let dispose;

	const error = new Error$1({
			props: {
				errors: ctx.errorsSelect,
				errorCode: "required",
				errorText: "Pick something please"
			}
		});

	return {
		c() {
			select = element("select");
			option0 = element("option");
			option0.textContent = "First lorem ipsum";
			option1 = element("option");
			option1.textContent = "Second lorem ipsum";
			option2 = element("option");
			option2.textContent = "Third lorem ipsum";
			t3 = space();
			create_component(error.$$.fragment);
			option0.__value = option0_value_value = 1;
			option0.value = option0.__value;
			option1.__value = option1_value_value = 2;
			option1.value = option1.__value;
			option2.__value = option2_value_value = 3;
			option2.value = option2.__value;
			select.multiple = true;
			if (ctx.$valueSelect === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
			dispose = listen(select, "change", ctx.select_change_handler);
		},
		m(target, anchor) {
			insert(target, select, anchor);
			append(select, option0);
			append(select, option1);
			append(select, option2);
			select_options(select, ctx.$valueSelect);
			inputSelect_action = ctx.inputSelect.call(null, select) || ({});
			insert(target, t3, anchor);
			mount_component(error, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			if (changed.$valueSelect) {
				select_options(select, ctx.$valueSelect);
			}
		},
		i(local) {
			if (current) return;
			transition_in(error.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(error.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(select);
			if (inputSelect_action && is_function(inputSelect_action.destroy)) inputSelect_action.destroy();
			if (detaching) detach(t3);
			destroy_component(error, detaching);
			dispose();
		}
	};
}

// (42:0) <Form createForm={createForm2}>
function create_default_slot$4(ctx) {
	let h1;
	let t1;
	let t2;
	let t3;
	let current;

	const code0 = new Code({
			props: {
				html: `const [ errors, value, input ] = createEntry({
  type: 'array',
  required: true,
  value: []
});`
			}
		});

	const code1 = new Code({
			props: {
				html: `&lt;select multiple bind:value={$valueSelect} use:inputSelect>
  &lt;option value={1}>First lorem ipsum&lt;/option>
  &lt;option value={2}>Second lorem ipsum&lt;/option>
  &lt;option value={3}>Third lorem ipsum&lt;/option>
&lt;/select>
{#if $errors.includes('required')}Pick something please{/if}`
			}
		});

	const row = new Row({
			props: {
				labelText: "Pick few options",
				$$slots: { default: [create_default_slot_1$4] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			h1 = element("h1");
			h1.textContent = "array select";
			t1 = space();
			create_component(code0.$$.fragment);
			t2 = space();
			create_component(code1.$$.fragment);
			t3 = space();
			create_component(row.$$.fragment);
		},
		m(target, anchor) {
			insert(target, h1, anchor);
			insert(target, t1, anchor);
			mount_component(code0, target, anchor);
			insert(target, t2, anchor);
			mount_component(code1, target, anchor);
			insert(target, t3, anchor);
			mount_component(row, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const row_changes = {};

			if (changed.$$scope || changed.$valueSelect) {
				row_changes.$$scope = { changed, ctx };
			}

			row.$set(row_changes);
		},
		i(local) {
			if (current) return;
			transition_in(code0.$$.fragment, local);
			transition_in(code1.$$.fragment, local);
			transition_in(row.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(code0.$$.fragment, local);
			transition_out(code1.$$.fragment, local);
			transition_out(row.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(h1);
			if (detaching) detach(t1);
			destroy_component(code0, detaching);
			if (detaching) detach(t2);
			destroy_component(code1, detaching);
			if (detaching) detach(t3);
			destroy_component(row, detaching);
		}
	};
}

function create_fragment$a(ctx) {
	let t;
	let current;

	const form0 = new Form({
			props: {
				createForm: ctx.createForm1,
				$$slots: { default: [create_default_slot_2$2] },
				$$scope: { ctx }
			}
		});

	const form1 = new Form({
			props: {
				createForm: ctx.createForm2,
				$$slots: { default: [create_default_slot$4] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(form0.$$.fragment);
			t = space();
			create_component(form1.$$.fragment);
		},
		m(target, anchor) {
			mount_component(form0, target, anchor);
			insert(target, t, anchor);
			mount_component(form1, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const form0_changes = {};

			if (changed.$$scope || changed.$value) {
				form0_changes.$$scope = { changed, ctx };
			}

			form0.$set(form0_changes);
			const form1_changes = {};

			if (changed.$$scope || changed.$valueSelect) {
				form1_changes.$$scope = { changed, ctx };
			}

			form1.$set(form1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(form0.$$.fragment, local);
			transition_in(form1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(form0.$$.fragment, local);
			transition_out(form1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(form0, detaching);
			if (detaching) detach(t);
			destroy_component(form1, detaching);
		}
	};
}

function instance$a($$self, $$props, $$invalidate) {
	let $value;
	let $valueSelect;
	const { createEntry: createEntry1, createForm: createForm1 } = createValidation({ validateOnEvents: { input: true } });
	const { createEntry: createEntry2, createForm: createForm2 } = createValidation({ validateOnEvents: { input: true } });
	const [errors, value, input] = createEntry1({ type: "array", min: 2, value: [] });
	component_subscribe($$self, value, value => $$invalidate("$value", $value = value));
	const [errorsSelect, valueSelect, inputSelect] = createEntry2({ type: "array", required: true, value: [] });
	component_subscribe($$self, valueSelect, value => $$invalidate("$valueSelect", $valueSelect = value));
	const $$binding_groups = [[]];

	function input0_change_handler() {
		$value = get_binding_group_value($$binding_groups[0]);
		value.set($value);
	}

	function input1_change_handler() {
		$value = get_binding_group_value($$binding_groups[0]);
		value.set($value);
	}

	function input2_change_handler() {
		$value = get_binding_group_value($$binding_groups[0]);
		value.set($value);
	}

	function select_change_handler() {
		$valueSelect = select_multiple_value(this);
		valueSelect.set($valueSelect);
	}

	return {
		createForm1,
		createForm2,
		errors,
		value,
		input,
		errorsSelect,
		valueSelect,
		inputSelect,
		$value,
		$valueSelect,
		input0_change_handler,
		input1_change_handler,
		input2_change_handler,
		select_change_handler,
		$$binding_groups
	};
}

class Array$1 extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});
	}
}

/* src/docs/components/types/required.svelte generated by Svelte v3.15.0 */

function create_default_slot_2$3(ctx) {
	let input_1;
	let inputRequired_action;
	let t0;
	let t1;
	let current;
	let dispose;

	const error0 = new Error$1({
			props: {
				errors: ctx.errorsRequired,
				errorCode: "typeCheck",
				errorText: "Use valid email"
			}
		});

	const error1 = new Error$1({
			props: {
				errors: ctx.errorsRequired,
				errorCode: "required"
			}
		});

	return {
		c() {
			input_1 = element("input");
			t0 = space();
			create_component(error0.$$.fragment);
			t1 = space();
			create_component(error1.$$.fragment);
			attr(input_1, "class", "input-text");
			attr(input_1, "type", "email");
			attr(input_1, "placeholder", "type: 'email', required: true");
			dispose = listen(input_1, "input", ctx.input_1_input_handler);
		},
		m(target, anchor) {
			insert(target, input_1, anchor);
			set_input_value(input_1, ctx.$valueRequired);
			inputRequired_action = ctx.inputRequired.call(null, input_1) || ({});
			insert(target, t0, anchor);
			mount_component(error0, target, anchor);
			insert(target, t1, anchor);
			mount_component(error1, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			if (changed.$valueRequired && input_1.value !== ctx.$valueRequired) {
				set_input_value(input_1, ctx.$valueRequired);
			}
		},
		i(local) {
			if (current) return;
			transition_in(error0.$$.fragment, local);
			transition_in(error1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(error0.$$.fragment, local);
			transition_out(error1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(input_1);
			if (inputRequired_action && is_function(inputRequired_action.destroy)) inputRequired_action.destroy();
			if (detaching) detach(t0);
			destroy_component(error0, detaching);
			if (detaching) detach(t1);
			destroy_component(error1, detaching);
			dispose();
		}
	};
}

// (36:2) <Row labelText="Type your email (optional)">
function create_default_slot_1$5(ctx) {
	let input_1;
	let input_action;
	let t;
	let current;
	let dispose;

	const error = new Error$1({
			props: {
				errors: ctx.errors,
				errorCode: "typeCheck",
				errorText: "Use valid email"
			}
		});

	return {
		c() {
			input_1 = element("input");
			t = space();
			create_component(error.$$.fragment);
			attr(input_1, "class", "input-text");
			attr(input_1, "type", "email");
			attr(input_1, "placeholder", "type: 'email'");
			dispose = listen(input_1, "input", ctx.input_1_input_handler_1);
		},
		m(target, anchor) {
			insert(target, input_1, anchor);
			set_input_value(input_1, ctx.$value);
			input_action = ctx.input.call(null, input_1) || ({});
			insert(target, t, anchor);
			mount_component(error, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			if (changed.$value && input_1.value !== ctx.$value) {
				set_input_value(input_1, ctx.$value);
			}
		},
		i(local) {
			if (current) return;
			transition_in(error.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(error.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(input_1);
			if (input_action && is_function(input_action.destroy)) input_action.destroy();
			if (detaching) detach(t);
			destroy_component(error, detaching);
			dispose();
		}
	};
}

// (17:0) <Form {createForm}>
function create_default_slot$5(ctx) {
	let h1;
	let t1;
	let t2;
	let t3;
	let t4;
	let current;

	const code0 = new Code({
			props: {
				html: `const [ errorsRequired, valueRequired, inputRequired ] = createEntry({
  type: 'email', required: true
});
const [ errors, value, input ] = createEntry({
  type: 'email'
});`
			}
		});

	const code1 = new Code({
			props: {
				html: `&lt;input use:inputRequired bind:value={$valueRequired} type="email" />
{#if $errors.includes('typeCheck')}Use valid email{/if}
{#if $errors.includes('required')}This field is required{/if}

&lt;input use:input bind:value={$value} type="email" />
{#if $errors.includes('typeCheck')}Use valid email{/if}`
			}
		});

	const row0 = new Row({
			props: {
				labelText: "Type your email (required)",
				$$slots: { default: [create_default_slot_2$3] },
				$$scope: { ctx }
			}
		});

	const row1 = new Row({
			props: {
				labelText: "Type your email (optional)",
				$$slots: { default: [create_default_slot_1$5] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			h1 = element("h1");
			h1.textContent = "required";
			t1 = space();
			create_component(code0.$$.fragment);
			t2 = space();
			create_component(code1.$$.fragment);
			t3 = space();
			create_component(row0.$$.fragment);
			t4 = space();
			create_component(row1.$$.fragment);
		},
		m(target, anchor) {
			insert(target, h1, anchor);
			insert(target, t1, anchor);
			mount_component(code0, target, anchor);
			insert(target, t2, anchor);
			mount_component(code1, target, anchor);
			insert(target, t3, anchor);
			mount_component(row0, target, anchor);
			insert(target, t4, anchor);
			mount_component(row1, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const row0_changes = {};

			if (changed.$$scope || changed.$valueRequired) {
				row0_changes.$$scope = { changed, ctx };
			}

			row0.$set(row0_changes);
			const row1_changes = {};

			if (changed.$$scope || changed.$value) {
				row1_changes.$$scope = { changed, ctx };
			}

			row1.$set(row1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(code0.$$.fragment, local);
			transition_in(code1.$$.fragment, local);
			transition_in(row0.$$.fragment, local);
			transition_in(row1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(code0.$$.fragment, local);
			transition_out(code1.$$.fragment, local);
			transition_out(row0.$$.fragment, local);
			transition_out(row1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(h1);
			if (detaching) detach(t1);
			destroy_component(code0, detaching);
			if (detaching) detach(t2);
			destroy_component(code1, detaching);
			if (detaching) detach(t3);
			destroy_component(row0, detaching);
			if (detaching) detach(t4);
			destroy_component(row1, detaching);
		}
	};
}

function create_fragment$b(ctx) {
	let current;

	const form = new Form({
			props: {
				createForm: ctx.createForm,
				$$slots: { default: [create_default_slot$5] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(form.$$.fragment);
		},
		m(target, anchor) {
			mount_component(form, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const form_changes = {};

			if (changed.$$scope || changed.$value || changed.$valueRequired) {
				form_changes.$$scope = { changed, ctx };
			}

			form.$set(form_changes);
		},
		i(local) {
			if (current) return;
			transition_in(form.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(form.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(form, detaching);
		}
	};
}

function instance$b($$self, $$props, $$invalidate) {
	let $valueRequired;
	let $value;
	const { createEntry, createForm } = createValidation({ validateOnEvents: { input: true } });
	const [errorsRequired, valueRequired, inputRequired] = createEntry({ type: "email", required: true });
	component_subscribe($$self, valueRequired, value => $$invalidate("$valueRequired", $valueRequired = value));
	const [errors, value, input] = createEntry({ type: "email" });
	component_subscribe($$self, value, value => $$invalidate("$value", $value = value));

	function input_1_input_handler() {
		$valueRequired = this.value;
		valueRequired.set($valueRequired);
	}

	function input_1_input_handler_1() {
		$value = this.value;
		value.set($value);
	}

	return {
		createForm,
		errorsRequired,
		valueRequired,
		inputRequired,
		errors,
		value,
		input,
		$valueRequired,
		$value,
		input_1_input_handler,
		input_1_input_handler_1
	};
}

class Required extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});
	}
}

/* src/docs/components/types/match.svelte generated by Svelte v3.15.0 */

function create_default_slot_1$6(ctx) {
	let input_1;
	let input_action;
	let t;
	let current;
	let dispose;

	const error = new Error$1({
			props: {
				errors: ctx.errors,
				errorCode: "match",
				errorText: "Should start from 'A' letter and ends with 'B' letter"
			}
		});

	return {
		c() {
			input_1 = element("input");
			t = space();
			create_component(error.$$.fragment);
			attr(input_1, "class", "input-text");
			attr(input_1, "type", "text");
			attr(input_1, "placeholder", "type: 'string', match: /^A.*B$/");
			dispose = listen(input_1, "input", ctx.input_1_input_handler);
		},
		m(target, anchor) {
			insert(target, input_1, anchor);
			set_input_value(input_1, ctx.$value);
			input_action = ctx.input.call(null, input_1) || ({});
			insert(target, t, anchor);
			mount_component(error, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			if (changed.$value && input_1.value !== ctx.$value) {
				set_input_value(input_1, ctx.$value);
			}
		},
		i(local) {
			if (current) return;
			transition_in(error.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(error.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(input_1);
			if (input_action && is_function(input_action.destroy)) input_action.destroy();
			if (detaching) detach(t);
			destroy_component(error, detaching);
			dispose();
		}
	};
}

// (14:0) <Form {createForm}>
function create_default_slot$6(ctx) {
	let h1;
	let t1;
	let t2;
	let t3;
	let current;

	const code0 = new Code({
			props: {
				html: `const [ errors, value, input ] = createEntry({
  type: 'string', match: /^A.*B$/
});`
			}
		});

	const code1 = new Code({
			props: {
				html: `&lt;input use:input bind:value={$value} />
{#if $errors.includes('match')}Should start from 'A' letter and ends with 'B' letter{/if}`
			}
		});

	const row = new Row({
			props: {
				labelText: "Type something like AxxxxxxB",
				$$slots: { default: [create_default_slot_1$6] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			h1 = element("h1");
			h1.textContent = "match";
			t1 = space();
			create_component(code0.$$.fragment);
			t2 = space();
			create_component(code1.$$.fragment);
			t3 = space();
			create_component(row.$$.fragment);
		},
		m(target, anchor) {
			insert(target, h1, anchor);
			insert(target, t1, anchor);
			mount_component(code0, target, anchor);
			insert(target, t2, anchor);
			mount_component(code1, target, anchor);
			insert(target, t3, anchor);
			mount_component(row, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const row_changes = {};

			if (changed.$$scope || changed.$value) {
				row_changes.$$scope = { changed, ctx };
			}

			row.$set(row_changes);
		},
		i(local) {
			if (current) return;
			transition_in(code0.$$.fragment, local);
			transition_in(code1.$$.fragment, local);
			transition_in(row.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(code0.$$.fragment, local);
			transition_out(code1.$$.fragment, local);
			transition_out(row.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(h1);
			if (detaching) detach(t1);
			destroy_component(code0, detaching);
			if (detaching) detach(t2);
			destroy_component(code1, detaching);
			if (detaching) detach(t3);
			destroy_component(row, detaching);
		}
	};
}

function create_fragment$c(ctx) {
	let current;

	const form = new Form({
			props: {
				createForm: ctx.createForm,
				$$slots: { default: [create_default_slot$6] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(form.$$.fragment);
		},
		m(target, anchor) {
			mount_component(form, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const form_changes = {};

			if (changed.$$scope || changed.$value) {
				form_changes.$$scope = { changed, ctx };
			}

			form.$set(form_changes);
		},
		i(local) {
			if (current) return;
			transition_in(form.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(form.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(form, detaching);
		}
	};
}

function instance$c($$self, $$props, $$invalidate) {
	let $value;
	const { createEntry, createForm } = createValidation({ validateOnEvents: { input: true } });
	const [errors, value, input] = createEntry({ type: "string", match: /^A.*B$/ });
	component_subscribe($$self, value, value => $$invalidate("$value", $value = value));

	function input_1_input_handler() {
		$value = this.value;
		value.set($value);
	}

	return {
		createForm,
		errors,
		value,
		input,
		$value,
		input_1_input_handler
	};
}

class Match extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});
	}
}

/* src/docs/components/types/equal.svelte generated by Svelte v3.15.0 */

function create_default_slot_1$7(ctx) {
	let input_1;
	let input_action;
	let t;
	let current;
	let dispose;

	const error = new Error$1({
			props: {
				errors: ctx.errors,
				errorCode: "equal",
				errorText: "Should be equal to 'qwerty'"
			}
		});

	return {
		c() {
			input_1 = element("input");
			t = space();
			create_component(error.$$.fragment);
			attr(input_1, "class", "input-text");
			attr(input_1, "type", "text");
			attr(input_1, "placeholder", "type: 'string', equal: 'qwerty'");
			dispose = listen(input_1, "input", ctx.input_1_input_handler);
		},
		m(target, anchor) {
			insert(target, input_1, anchor);
			set_input_value(input_1, ctx.$value);
			input_action = ctx.input.call(null, input_1) || ({});
			insert(target, t, anchor);
			mount_component(error, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			if (changed.$value && input_1.value !== ctx.$value) {
				set_input_value(input_1, ctx.$value);
			}
		},
		i(local) {
			if (current) return;
			transition_in(error.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(error.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(input_1);
			if (input_action && is_function(input_action.destroy)) input_action.destroy();
			if (detaching) detach(t);
			destroy_component(error, detaching);
			dispose();
		}
	};
}

// (14:0) <Form {createForm}>
function create_default_slot$7(ctx) {
	let h1;
	let t1;
	let t2;
	let t3;
	let current;

	const code0 = new Code({
			props: {
				html: `const [ errors, value, input ] = createEntry({
  type: 'string', equal: 'qwerty'
});`
			}
		});

	const code1 = new Code({
			props: {
				html: `&lt;input use:input bind:value={$value} />
{#if $errors.includes('equal')}Should be equal to 'qwerty'{/if}`
			}
		});

	const row = new Row({
			props: {
				labelText: "Type 'qwerty'",
				$$slots: { default: [create_default_slot_1$7] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			h1 = element("h1");
			h1.textContent = "equal";
			t1 = space();
			create_component(code0.$$.fragment);
			t2 = space();
			create_component(code1.$$.fragment);
			t3 = space();
			create_component(row.$$.fragment);
		},
		m(target, anchor) {
			insert(target, h1, anchor);
			insert(target, t1, anchor);
			mount_component(code0, target, anchor);
			insert(target, t2, anchor);
			mount_component(code1, target, anchor);
			insert(target, t3, anchor);
			mount_component(row, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const row_changes = {};

			if (changed.$$scope || changed.$value) {
				row_changes.$$scope = { changed, ctx };
			}

			row.$set(row_changes);
		},
		i(local) {
			if (current) return;
			transition_in(code0.$$.fragment, local);
			transition_in(code1.$$.fragment, local);
			transition_in(row.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(code0.$$.fragment, local);
			transition_out(code1.$$.fragment, local);
			transition_out(row.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(h1);
			if (detaching) detach(t1);
			destroy_component(code0, detaching);
			if (detaching) detach(t2);
			destroy_component(code1, detaching);
			if (detaching) detach(t3);
			destroy_component(row, detaching);
		}
	};
}

function create_fragment$d(ctx) {
	let current;

	const form = new Form({
			props: {
				createForm: ctx.createForm,
				$$slots: { default: [create_default_slot$7] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(form.$$.fragment);
		},
		m(target, anchor) {
			mount_component(form, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const form_changes = {};

			if (changed.$$scope || changed.$value) {
				form_changes.$$scope = { changed, ctx };
			}

			form.$set(form_changes);
		},
		i(local) {
			if (current) return;
			transition_in(form.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(form.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(form, detaching);
		}
	};
}

function instance$d($$self, $$props, $$invalidate) {
	let $value;
	const { createEntry, createForm } = createValidation({ validateOnEvents: { input: true } });
	const [errors, value, input] = createEntry({ type: "string", equal: "qwerty" });
	component_subscribe($$self, value, value => $$invalidate("$value", $value = value));

	function input_1_input_handler() {
		$value = this.value;
		value.set($value);
	}

	return {
		createForm,
		errors,
		value,
		input,
		$value,
		input_1_input_handler
	};
}

class Equal extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});
	}
}

function is_date(obj) {
    return Object.prototype.toString.call(obj) === '[object Date]';
}

function get_interpolator(a, b) {
    if (a === b || a !== a)
        return () => a;
    const type = typeof a;
    if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
        throw new Error('Cannot interpolate values of different type');
    }
    if (Array.isArray(a)) {
        const arr = b.map((bi, i) => {
            return get_interpolator(a[i], bi);
        });
        return t => arr.map(fn => fn(t));
    }
    if (type === 'object') {
        if (!a || !b)
            throw new Error('Object cannot be null');
        if (is_date(a) && is_date(b)) {
            a = a.getTime();
            b = b.getTime();
            const delta = b - a;
            return t => new Date(a + t * delta);
        }
        const keys = Object.keys(b);
        const interpolators = {};
        keys.forEach(key => {
            interpolators[key] = get_interpolator(a[key], b[key]);
        });
        return t => {
            const result = {};
            keys.forEach(key => {
                result[key] = interpolators[key](t);
            });
            return result;
        };
    }
    if (type === 'number') {
        const delta = b - a;
        return t => a + t * delta;
    }
    throw new Error(`Cannot interpolate ${type} values`);
}
function tweened(value, defaults = {}) {
    const store = writable(value);
    let task;
    let target_value = value;
    function set(new_value, opts) {
        if (value == null) {
            store.set(value = new_value);
            return Promise.resolve();
        }
        target_value = new_value;
        let previous_task = task;
        let started = false;
        let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
        const start = now() + delay;
        let fn;
        task = loop(now => {
            if (now < start)
                return true;
            if (!started) {
                fn = interpolate(value, new_value);
                if (typeof duration === 'function')
                    duration = duration(value, new_value);
                started = true;
            }
            if (previous_task) {
                previous_task.abort();
                previous_task = null;
            }
            const elapsed = now - start;
            if (elapsed > duration) {
                store.set(value = new_value);
                return false;
            }
            // @ts-ignore
            store.set(value = fn(easing(elapsed / duration)));
            return true;
        });
        return task.promise;
    }
    return {
        set,
        update: (fn, opts) => set(fn(target_value, value), opts),
        subscribe: store.subscribe
    };
}

/* src/docs/components/advanced/array-sum-of-points.svelte generated by Svelte v3.15.0 */

function create_default_slot_1$8(ctx) {
	let label0;
	let input0;
	let input0_disabled_value;
	let input0_value_value;
	let input_action;
	let t0;
	let t1;
	let label1;
	let input1;
	let input1_disabled_value;
	let input1_value_value;
	let input_action_1;
	let t2;
	let t3;
	let label2;
	let input2;
	let input2_disabled_value;
	let input2_value_value;
	let input_action_2;
	let t4;
	let t5;
	let label3;
	let input3;
	let input3_disabled_value;
	let input3_value_value;
	let input_action_3;
	let t6;
	let t7;
	let label4;
	let input4;
	let input4_disabled_value;
	let input4_value_value;
	let input_action_4;
	let t8;
	let t9;
	let label5;
	let input5;
	let input5_disabled_value;
	let input5_value_value;
	let input_action_5;
	let t10;
	let t11;
	let label6;
	let input6;
	let input6_disabled_value;
	let input6_value_value;
	let input_action_6;
	let t12;
	let t13;
	let label7;
	let input7;
	let input7_disabled_value;
	let input7_value_value;
	let input_action_7;
	let t14;
	let t15;
	let label8;
	let input8;
	let input8_disabled_value;
	let input8_value_value;
	let input_action_8;
	let t16;
	let t17;
	let label9;
	let input9;
	let input9_disabled_value;
	let input9_value_value;
	let input_action_9;
	let t18;
	let dispose;

	return {
		c() {
			label0 = element("label");
			input0 = element("input");
			t0 = text(" Tom Brady");
			t1 = space();
			label1 = element("label");
			input1 = element("input");
			t2 = text(" Isaac Newton");
			t3 = space();
			label2 = element("label");
			input2 = element("input");
			t4 = text(" Pete Carrol");
			t5 = space();
			label3 = element("label");
			input3 = element("input");
			t6 = text(" Steve Jobs");
			t7 = space();
			label4 = element("label");
			input4 = element("input");
			t8 = text(" Paul Gascoigne");
			t9 = space();
			label5 = element("label");
			input5 = element("input");
			t10 = text(" Pele");
			t11 = space();
			label6 = element("label");
			input6 = element("input");
			t12 = text(" Albetro Contador");
			t13 = space();
			label7 = element("label");
			input7 = element("input");
			t14 = text(" David Gilmour");
			t15 = space();
			label8 = element("label");
			input8 = element("input");
			t16 = text(" Georges St-Pierre");
			t17 = space();
			label9 = element("label");
			input9 = element("input");
			t18 = text(" Rich Harris");
			input0.disabled = input0_disabled_value = ctx.$score === 100;
			input0.__value = input0_value_value = 9;
			input0.value = input0.__value;
			attr(input0, "class", "input-choice");
			attr(input0, "type", "checkbox");
			ctx.$$binding_groups[0].push(input0);
			input1.disabled = input1_disabled_value = ctx.$score === 100;
			input1.__value = input1_value_value = -40;
			input1.value = input1.__value;
			attr(input1, "class", "input-choice");
			attr(input1, "type", "checkbox");
			ctx.$$binding_groups[0].push(input1);
			input2.disabled = input2_disabled_value = ctx.$score === 100;
			input2.__value = input2_value_value = 30;
			input2.value = input2.__value;
			attr(input2, "class", "input-choice");
			attr(input2, "type", "checkbox");
			ctx.$$binding_groups[0].push(input2);
			input3.disabled = input3_disabled_value = ctx.$score === 100;
			input3.__value = input3_value_value = -30;
			input3.value = input3.__value;
			attr(input3, "class", "input-choice");
			attr(input3, "type", "checkbox");
			ctx.$$binding_groups[0].push(input3);
			input4.disabled = input4_disabled_value = ctx.$score === 100;
			input4.__value = input4_value_value = 14;
			input4.value = input4.__value;
			attr(input4, "class", "input-choice");
			attr(input4, "type", "checkbox");
			ctx.$$binding_groups[0].push(input4);
			input5.disabled = input5_disabled_value = ctx.$score === 100;
			input5.__value = input5_value_value = 16;
			input5.value = input5.__value;
			attr(input5, "class", "input-choice");
			attr(input5, "type", "checkbox");
			ctx.$$binding_groups[0].push(input5);
			input6.disabled = input6_disabled_value = ctx.$score === 100;
			input6.__value = input6_value_value = 20;
			input6.value = input6.__value;
			attr(input6, "class", "input-choice");
			attr(input6, "type", "checkbox");
			ctx.$$binding_groups[0].push(input6);
			input7.disabled = input7_disabled_value = ctx.$score === 100;
			input7.__value = input7_value_value = -20;
			input7.value = input7.__value;
			attr(input7, "class", "input-choice");
			attr(input7, "type", "checkbox");
			ctx.$$binding_groups[0].push(input7);
			input8.disabled = input8_disabled_value = ctx.$score === 100;
			input8.__value = input8_value_value = 11;
			input8.value = input8.__value;
			attr(input8, "class", "input-choice");
			attr(input8, "type", "checkbox");
			ctx.$$binding_groups[0].push(input8);
			input9.disabled = input9_disabled_value = ctx.$score === 100;
			input9.__value = input9_value_value = -10;
			input9.value = input9.__value;
			attr(input9, "class", "input-choice");
			attr(input9, "type", "checkbox");
			ctx.$$binding_groups[0].push(input9);

			dispose = [
				listen(input0, "change", ctx.input0_change_handler),
				listen(input1, "change", ctx.input1_change_handler),
				listen(input2, "change", ctx.input2_change_handler),
				listen(input3, "change", ctx.input3_change_handler),
				listen(input4, "change", ctx.input4_change_handler),
				listen(input5, "change", ctx.input5_change_handler),
				listen(input6, "change", ctx.input6_change_handler),
				listen(input7, "change", ctx.input7_change_handler),
				listen(input8, "change", ctx.input8_change_handler),
				listen(input9, "change", ctx.input9_change_handler)
			];
		},
		m(target, anchor) {
			insert(target, label0, anchor);
			append(label0, input0);
			input0.checked = ~ctx.$value.indexOf(input0.__value);
			input_action = ctx.input.call(null, input0) || ({});
			append(label0, t0);
			insert(target, t1, anchor);
			insert(target, label1, anchor);
			append(label1, input1);
			input1.checked = ~ctx.$value.indexOf(input1.__value);
			input_action_1 = ctx.input.call(null, input1) || ({});
			append(label1, t2);
			insert(target, t3, anchor);
			insert(target, label2, anchor);
			append(label2, input2);
			input2.checked = ~ctx.$value.indexOf(input2.__value);
			input_action_2 = ctx.input.call(null, input2) || ({});
			append(label2, t4);
			insert(target, t5, anchor);
			insert(target, label3, anchor);
			append(label3, input3);
			input3.checked = ~ctx.$value.indexOf(input3.__value);
			input_action_3 = ctx.input.call(null, input3) || ({});
			append(label3, t6);
			insert(target, t7, anchor);
			insert(target, label4, anchor);
			append(label4, input4);
			input4.checked = ~ctx.$value.indexOf(input4.__value);
			input_action_4 = ctx.input.call(null, input4) || ({});
			append(label4, t8);
			insert(target, t9, anchor);
			insert(target, label5, anchor);
			append(label5, input5);
			input5.checked = ~ctx.$value.indexOf(input5.__value);
			input_action_5 = ctx.input.call(null, input5) || ({});
			append(label5, t10);
			insert(target, t11, anchor);
			insert(target, label6, anchor);
			append(label6, input6);
			input6.checked = ~ctx.$value.indexOf(input6.__value);
			input_action_6 = ctx.input.call(null, input6) || ({});
			append(label6, t12);
			insert(target, t13, anchor);
			insert(target, label7, anchor);
			append(label7, input7);
			input7.checked = ~ctx.$value.indexOf(input7.__value);
			input_action_7 = ctx.input.call(null, input7) || ({});
			append(label7, t14);
			insert(target, t15, anchor);
			insert(target, label8, anchor);
			append(label8, input8);
			input8.checked = ~ctx.$value.indexOf(input8.__value);
			input_action_8 = ctx.input.call(null, input8) || ({});
			append(label8, t16);
			insert(target, t17, anchor);
			insert(target, label9, anchor);
			append(label9, input9);
			input9.checked = ~ctx.$value.indexOf(input9.__value);
			input_action_9 = ctx.input.call(null, input9) || ({});
			append(label9, t18);
		},
		p(changed, ctx) {
			if (changed.$score && input0_disabled_value !== (input0_disabled_value = ctx.$score === 100)) {
				input0.disabled = input0_disabled_value;
			}

			if (changed.$value) {
				input0.checked = ~ctx.$value.indexOf(input0.__value);
			}

			if (changed.$score && input1_disabled_value !== (input1_disabled_value = ctx.$score === 100)) {
				input1.disabled = input1_disabled_value;
			}

			if (changed.$value) {
				input1.checked = ~ctx.$value.indexOf(input1.__value);
			}

			if (changed.$score && input2_disabled_value !== (input2_disabled_value = ctx.$score === 100)) {
				input2.disabled = input2_disabled_value;
			}

			if (changed.$value) {
				input2.checked = ~ctx.$value.indexOf(input2.__value);
			}

			if (changed.$score && input3_disabled_value !== (input3_disabled_value = ctx.$score === 100)) {
				input3.disabled = input3_disabled_value;
			}

			if (changed.$value) {
				input3.checked = ~ctx.$value.indexOf(input3.__value);
			}

			if (changed.$score && input4_disabled_value !== (input4_disabled_value = ctx.$score === 100)) {
				input4.disabled = input4_disabled_value;
			}

			if (changed.$value) {
				input4.checked = ~ctx.$value.indexOf(input4.__value);
			}

			if (changed.$score && input5_disabled_value !== (input5_disabled_value = ctx.$score === 100)) {
				input5.disabled = input5_disabled_value;
			}

			if (changed.$value) {
				input5.checked = ~ctx.$value.indexOf(input5.__value);
			}

			if (changed.$score && input6_disabled_value !== (input6_disabled_value = ctx.$score === 100)) {
				input6.disabled = input6_disabled_value;
			}

			if (changed.$value) {
				input6.checked = ~ctx.$value.indexOf(input6.__value);
			}

			if (changed.$score && input7_disabled_value !== (input7_disabled_value = ctx.$score === 100)) {
				input7.disabled = input7_disabled_value;
			}

			if (changed.$value) {
				input7.checked = ~ctx.$value.indexOf(input7.__value);
			}

			if (changed.$score && input8_disabled_value !== (input8_disabled_value = ctx.$score === 100)) {
				input8.disabled = input8_disabled_value;
			}

			if (changed.$value) {
				input8.checked = ~ctx.$value.indexOf(input8.__value);
			}

			if (changed.$score && input9_disabled_value !== (input9_disabled_value = ctx.$score === 100)) {
				input9.disabled = input9_disabled_value;
			}

			if (changed.$value) {
				input9.checked = ~ctx.$value.indexOf(input9.__value);
			}
		},
		d(detaching) {
			if (detaching) detach(label0);
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input0), 1);
			if (input_action && is_function(input_action.destroy)) input_action.destroy();
			if (detaching) detach(t1);
			if (detaching) detach(label1);
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input1), 1);
			if (input_action_1 && is_function(input_action_1.destroy)) input_action_1.destroy();
			if (detaching) detach(t3);
			if (detaching) detach(label2);
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input2), 1);
			if (input_action_2 && is_function(input_action_2.destroy)) input_action_2.destroy();
			if (detaching) detach(t5);
			if (detaching) detach(label3);
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input3), 1);
			if (input_action_3 && is_function(input_action_3.destroy)) input_action_3.destroy();
			if (detaching) detach(t7);
			if (detaching) detach(label4);
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input4), 1);
			if (input_action_4 && is_function(input_action_4.destroy)) input_action_4.destroy();
			if (detaching) detach(t9);
			if (detaching) detach(label5);
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input5), 1);
			if (input_action_5 && is_function(input_action_5.destroy)) input_action_5.destroy();
			if (detaching) detach(t11);
			if (detaching) detach(label6);
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input6), 1);
			if (input_action_6 && is_function(input_action_6.destroy)) input_action_6.destroy();
			if (detaching) detach(t13);
			if (detaching) detach(label7);
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input7), 1);
			if (input_action_7 && is_function(input_action_7.destroy)) input_action_7.destroy();
			if (detaching) detach(t15);
			if (detaching) detach(label8);
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input8), 1);
			if (input_action_8 && is_function(input_action_8.destroy)) input_action_8.destroy();
			if (detaching) detach(t17);
			if (detaching) detach(label9);
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input9), 1);
			if (input_action_9 && is_function(input_action_9.destroy)) input_action_9.destroy();
			run_all(dispose);
		}
	};
}

// (42:2) {#if $value.length}
function create_if_block$4(ctx) {
	let h1;
	let t0;
	let t1_value = ctx.$score.toFixed(0) + "";
	let t1;
	let t2;
	let h1_style_value;
	let if_block = ctx.$score === 100 && create_if_block_1$2();

	return {
		c() {
			h1 = element("h1");
			t0 = text("Your score: ");
			t1 = text(t1_value);
			t2 = text("/100 ");
			if (if_block) if_block.c();
			attr(h1, "style", h1_style_value = `color: ${ctx.color}`);
		},
		m(target, anchor) {
			insert(target, h1, anchor);
			append(h1, t0);
			append(h1, t1);
			append(h1, t2);
			if (if_block) if_block.m(h1, null);
		},
		p(changed, ctx) {
			if (changed.$score && t1_value !== (t1_value = ctx.$score.toFixed(0) + "")) set_data(t1, t1_value);

			if (ctx.$score === 100) {
				if (!if_block) {
					if_block = create_if_block_1$2();
					if_block.c();
					if_block.m(h1, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (changed.color && h1_style_value !== (h1_style_value = `color: ${ctx.color}`)) {
				attr(h1, "style", h1_style_value);
			}
		},
		d(detaching) {
			if (detaching) detach(h1);
			if (if_block) if_block.d();
		}
	};
}

// (43:71) {#if $score === 100}
function create_if_block_1$2(ctx) {
	let t;

	return {
		c() {
			t = text("You won!");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (26:0) <Form {createForm} noButtons>
function create_default_slot$8(ctx) {
	let h1;
	let t1;
	let t2;
	let t3;
	let t4;
	let t5;
	let current;

	const cells = new Cells({
			props: {
				$$slots: { default: [create_default_slot_1$8] },
				$$scope: { ctx }
			}
		});

	const error = new Error$1({
			props: {
				errors: ctx.errors,
				errorCode: "required",
				errorText: "Pick something please"
			}
		});

	let if_block = ctx.$value.length && create_if_block$4(ctx);

	const code0 = new Code({
			props: {
				html: `let score = tweened(0, {
  duration: 400,
  easing: cubicOut
});

const { createEntry, createForm } = createValidation({ listenInputEvents: 1 });
const [ errors, value, input ] = createEntry({
  type: 'array',
  value: [],
  required: true
});

$: $score = $value.reduce((a, b) => (a + b), 0);
$: color = ($score < 0 ? 'red' : ($score < 50 ? 'inherit' : ($score < 100 ? '#768c7b' : '#32d75e')));`
			}
		});

	const code1 = new Code({
			props: {
				html: `&lt;h1>Pick as much sportsman as you can&lt;/h1>
&lt;input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={9} /> Tom Brady
&lt;input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={-40} /> Isaac Newton
&lt;input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={30} /> Pete Carrol
&lt;input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={-30} /> Steve Jobs
&lt;input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={14} /> Paul Gascoigne
&lt;input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={16} /> Pele
&lt;input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={20} /> Albetro Contador
&lt;input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={-20} /> David Gilmour
&lt;input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={11} /> Georges St-Pierre
&lt;input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={-10} /> Rich Harris

{#if $errors.includes('required')}Pick something please{/if}
{#if $value.length}
  &lt;h1 style={\`color: ${ctx.color}\`}>Your score: {$score.toFixed(0)}/100 {#if $score === 100}You won!{/if}</h1>
{/if}`
			}
		});

	return {
		c() {
			h1 = element("h1");
			h1.textContent = "Pick as much sportsman as you can";
			t1 = space();
			create_component(cells.$$.fragment);
			t2 = space();
			create_component(error.$$.fragment);
			t3 = space();
			if (if_block) if_block.c();
			t4 = space();
			create_component(code0.$$.fragment);
			t5 = space();
			create_component(code1.$$.fragment);
		},
		m(target, anchor) {
			insert(target, h1, anchor);
			insert(target, t1, anchor);
			mount_component(cells, target, anchor);
			insert(target, t2, anchor);
			mount_component(error, target, anchor);
			insert(target, t3, anchor);
			if (if_block) if_block.m(target, anchor);
			insert(target, t4, anchor);
			mount_component(code0, target, anchor);
			insert(target, t5, anchor);
			mount_component(code1, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const cells_changes = {};

			if (changed.$$scope || changed.$score || changed.$value) {
				cells_changes.$$scope = { changed, ctx };
			}

			cells.$set(cells_changes);

			if (ctx.$value.length) {
				if (if_block) {
					if_block.p(changed, ctx);
				} else {
					if_block = create_if_block$4(ctx);
					if_block.c();
					if_block.m(t4.parentNode, t4);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			const code1_changes = {};

			if (changed.color) code1_changes.html = `&lt;h1>Pick as much sportsman as you can&lt;/h1>
&lt;input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={9} /> Tom Brady
&lt;input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={-40} /> Isaac Newton
&lt;input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={30} /> Pete Carrol
&lt;input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={-30} /> Steve Jobs
&lt;input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={14} /> Paul Gascoigne
&lt;input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={16} /> Pele
&lt;input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={20} /> Albetro Contador
&lt;input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={-20} /> David Gilmour
&lt;input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={11} /> Georges St-Pierre
&lt;input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={-10} /> Rich Harris

{#if $errors.includes('required')}Pick something please{/if}
{#if $value.length}
  &lt;h1 style={\`color: ${ctx.color}\`}>Your score: {$score.toFixed(0)}/100 {#if $score === 100}You won!{/if}</h1>
{/if}`;

			code1.$set(code1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(cells.$$.fragment, local);
			transition_in(error.$$.fragment, local);
			transition_in(code0.$$.fragment, local);
			transition_in(code1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(cells.$$.fragment, local);
			transition_out(error.$$.fragment, local);
			transition_out(code0.$$.fragment, local);
			transition_out(code1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(h1);
			if (detaching) detach(t1);
			destroy_component(cells, detaching);
			if (detaching) detach(t2);
			destroy_component(error, detaching);
			if (detaching) detach(t3);
			if (if_block) if_block.d(detaching);
			if (detaching) detach(t4);
			destroy_component(code0, detaching);
			if (detaching) detach(t5);
			destroy_component(code1, detaching);
		}
	};
}

function create_fragment$e(ctx) {
	let current;

	const form = new Form({
			props: {
				createForm: ctx.createForm,
				noButtons: true,
				$$slots: { default: [create_default_slot$8] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(form.$$.fragment);
		},
		m(target, anchor) {
			mount_component(form, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const form_changes = {};

			if (changed.$$scope || changed.color || changed.$value || changed.$score) {
				form_changes.$$scope = { changed, ctx };
			}

			form.$set(form_changes);
		},
		i(local) {
			if (current) return;
			transition_in(form.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(form.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(form, detaching);
		}
	};
}

function instance$e($$self, $$props, $$invalidate) {
	let $score;
	let $value;
	let score = tweened(0, { duration: 400, easing: cubicOut });
	component_subscribe($$self, score, value => $$invalidate("$score", $score = value));
	const { createEntry, createForm } = createValidation({ listenInputEvents: 1 });
	const [errors, value, input] = createEntry({ type: "array", value: [], required: true });
	component_subscribe($$self, value, value => $$invalidate("$value", $value = value));
	const $$binding_groups = [[]];

	function input0_change_handler() {
		$value = get_binding_group_value($$binding_groups[0]);
		value.set($value);
	}

	function input1_change_handler() {
		$value = get_binding_group_value($$binding_groups[0]);
		value.set($value);
	}

	function input2_change_handler() {
		$value = get_binding_group_value($$binding_groups[0]);
		value.set($value);
	}

	function input3_change_handler() {
		$value = get_binding_group_value($$binding_groups[0]);
		value.set($value);
	}

	function input4_change_handler() {
		$value = get_binding_group_value($$binding_groups[0]);
		value.set($value);
	}

	function input5_change_handler() {
		$value = get_binding_group_value($$binding_groups[0]);
		value.set($value);
	}

	function input6_change_handler() {
		$value = get_binding_group_value($$binding_groups[0]);
		value.set($value);
	}

	function input7_change_handler() {
		$value = get_binding_group_value($$binding_groups[0]);
		value.set($value);
	}

	function input8_change_handler() {
		$value = get_binding_group_value($$binding_groups[0]);
		value.set($value);
	}

	function input9_change_handler() {
		$value = get_binding_group_value($$binding_groups[0]);
		value.set($value);
	}

	let color;

	$$self.$$.update = (changed = { $value: 1, $score: 1 }) => {
		if (changed.$value) {
			 set_store_value(score, $score = $value.reduce((a, b) => a + b, 0));
		}

		if (changed.$score) {
			 $$invalidate("color", color = $score < 0
			? "red"
			: $score < 50
				? "inherit"
				: $score < 100 ? "#768c7b" : "#32d75e");
		}
	};

	return {
		score,
		createForm,
		errors,
		value,
		input,
		$score,
		$value,
		color,
		input0_change_handler,
		input1_change_handler,
		input2_change_handler,
		input3_change_handler,
		input4_change_handler,
		input5_change_handler,
		input6_change_handler,
		input7_change_handler,
		input8_change_handler,
		input9_change_handler,
		$$binding_groups
	};
}

class Array_sum_of_points extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});
	}
}

/* src/docs/components/advanced/field-confirm.svelte generated by Svelte v3.15.0 */

function create_default_slot_2$4(ctx) {
	let t0;
	let input;
	let inputF1_action;
	let t1;
	let t2;
	let current;
	let dispose;

	const error0 = new Error$1({
			props: {
				errors: ctx.errorsF1,
				errorCode: "min",
				errorText: "At least 6 symbols"
			}
		});

	const error1 = new Error$1({
			props: {
				errors: ctx.errorsF1,
				errorCode: "match",
				errorText: "Use at one digit"
			}
		});

	return {
		c() {
			t0 = text("Type your password\r\n    ");
			input = element("input");
			t1 = space();
			create_component(error0.$$.fragment);
			t2 = space();
			create_component(error1.$$.fragment);
			attr(input, "class", "input-text");
			attr(input, "type", "password");
			attr(input, "placeholder", "type: 'string', min: 6, match: /d+/");
			dispose = listen(input, "input", ctx.input_input_handler);
		},
		m(target, anchor) {
			insert(target, t0, anchor);
			insert(target, input, anchor);
			set_input_value(input, ctx.$valueF1);
			inputF1_action = ctx.inputF1.call(null, input) || ({});
			insert(target, t1, anchor);
			mount_component(error0, target, anchor);
			insert(target, t2, anchor);
			mount_component(error1, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			if (changed.$valueF1 && input.value !== ctx.$valueF1) {
				set_input_value(input, ctx.$valueF1);
			}
		},
		i(local) {
			if (current) return;
			transition_in(error0.$$.fragment, local);
			transition_in(error1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(error0.$$.fragment, local);
			transition_out(error1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(t0);
			if (detaching) detach(input);
			if (inputF1_action && is_function(inputF1_action.destroy)) inputF1_action.destroy();
			if (detaching) detach(t1);
			destroy_component(error0, detaching);
			if (detaching) detach(t2);
			destroy_component(error1, detaching);
			dispose();
		}
	};
}

// (45:2) <Row>
function create_default_slot_1$9(ctx) {
	let t0;
	let input;
	let inputF2_action;
	let t1;
	let t2;
	let current;
	let dispose;

	const error0 = new Error$1({
			props: {
				errors: ctx.errorsF2,
				errorCode: "required"
			}
		});

	const error1 = new Error$1({
			props: {
				errors: ctx.errorsF2,
				errorCode: "equal",
				errorText: "Should be equal with second one"
			}
		});

	return {
		c() {
			t0 = text("Confirm your password\r\n    ");
			input = element("input");
			t1 = space();
			create_component(error0.$$.fragment);
			t2 = space();
			create_component(error1.$$.fragment);
			attr(input, "class", "input-text");
			attr(input, "type", "password");
			attr(input, "placeholder", "type: 'string', required: true, equal: function");
			dispose = listen(input, "input", ctx.input_input_handler_1);
		},
		m(target, anchor) {
			insert(target, t0, anchor);
			insert(target, input, anchor);
			set_input_value(input, ctx.$valueF2);
			inputF2_action = ctx.inputF2.call(null, input) || ({});
			insert(target, t1, anchor);
			mount_component(error0, target, anchor);
			insert(target, t2, anchor);
			mount_component(error1, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			if (changed.$valueF2 && input.value !== ctx.$valueF2) {
				set_input_value(input, ctx.$valueF2);
			}
		},
		i(local) {
			if (current) return;
			transition_in(error0.$$.fragment, local);
			transition_in(error1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(error0.$$.fragment, local);
			transition_out(error1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(t0);
			if (detaching) detach(input);
			if (inputF2_action && is_function(inputF2_action.destroy)) inputF2_action.destroy();
			if (detaching) detach(t1);
			destroy_component(error0, detaching);
			if (detaching) detach(t2);
			destroy_component(error1, detaching);
			dispose();
		}
	};
}

// (20:0) <Form {createForm}>
function create_default_slot$9(ctx) {
	let h1;
	let t1;
	let t2;
	let t3;
	let t4;
	let current;

	const code0 = new Code({
			props: {
				html: `const { createEntry, createForm } = createValidation({ validateOnEvents: { input: true } });
  const [ errorsF1, valueF1, inputF1 ] = createEntry({
    type: 'string', min: 6, match: /\d+/
  });

  const [ errorsF2, valueF2, inputF2 ] = createEntry({
    type: 'string', required: true, equal: (value) => {
    return value === $valueF1;
  }
});`
			}
		});

	const code1 = new Code({
			props: {
				html: `&lt;input use:inputF1 bind:value={$valueF1} />
{#if $errorsF1.includes('min')}At least 6 symbols{/if}
{#if $errorsF1.includes('match')}TUse at one digit{/if}

&lt;input use:inputF2 bind:value={$valueF2} />
{#if $errorsF2.includes('required')}This field is required{/if}
{#if $errorsF2.includes('equal')}Should be equal with second one{/if}`
			}
		});

	const row0 = new Row({
			props: {
				$$slots: { default: [create_default_slot_2$4] },
				$$scope: { ctx }
			}
		});

	const row1 = new Row({
			props: {
				$$slots: { default: [create_default_slot_1$9] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			h1 = element("h1");
			h1.textContent = "Confirm password";
			t1 = space();
			create_component(code0.$$.fragment);
			t2 = space();
			create_component(code1.$$.fragment);
			t3 = space();
			create_component(row0.$$.fragment);
			t4 = space();
			create_component(row1.$$.fragment);
		},
		m(target, anchor) {
			insert(target, h1, anchor);
			insert(target, t1, anchor);
			mount_component(code0, target, anchor);
			insert(target, t2, anchor);
			mount_component(code1, target, anchor);
			insert(target, t3, anchor);
			mount_component(row0, target, anchor);
			insert(target, t4, anchor);
			mount_component(row1, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const row0_changes = {};

			if (changed.$$scope || changed.$valueF1) {
				row0_changes.$$scope = { changed, ctx };
			}

			row0.$set(row0_changes);
			const row1_changes = {};

			if (changed.$$scope || changed.$valueF2) {
				row1_changes.$$scope = { changed, ctx };
			}

			row1.$set(row1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(code0.$$.fragment, local);
			transition_in(code1.$$.fragment, local);
			transition_in(row0.$$.fragment, local);
			transition_in(row1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(code0.$$.fragment, local);
			transition_out(code1.$$.fragment, local);
			transition_out(row0.$$.fragment, local);
			transition_out(row1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(h1);
			if (detaching) detach(t1);
			destroy_component(code0, detaching);
			if (detaching) detach(t2);
			destroy_component(code1, detaching);
			if (detaching) detach(t3);
			destroy_component(row0, detaching);
			if (detaching) detach(t4);
			destroy_component(row1, detaching);
		}
	};
}

function create_fragment$f(ctx) {
	let current;

	const form = new Form({
			props: {
				createForm: ctx.createForm,
				$$slots: { default: [create_default_slot$9] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(form.$$.fragment);
		},
		m(target, anchor) {
			mount_component(form, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const form_changes = {};

			if (changed.$$scope || changed.$valueF2 || changed.$valueF1) {
				form_changes.$$scope = { changed, ctx };
			}

			form.$set(form_changes);
		},
		i(local) {
			if (current) return;
			transition_in(form.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(form.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(form, detaching);
		}
	};
}

function instance$f($$self, $$props, $$invalidate) {
	let $valueF1;
	let $valueF2;
	const { createEntry, createForm } = createValidation({ validateOnEvents: { input: true } });
	const [errorsF1, valueF1, inputF1] = createEntry({ type: "string", min: 6, match: /\d+/ });
	component_subscribe($$self, valueF1, value => $$invalidate("$valueF1", $valueF1 = value));

	const [errorsF2, valueF2, inputF2] = createEntry({
		type: "string",
		required: true,
		equal: value => {
			return value === $valueF1;
		}
	});

	component_subscribe($$self, valueF2, value => $$invalidate("$valueF2", $valueF2 = value));

	function input_input_handler() {
		$valueF1 = this.value;
		valueF1.set($valueF1);
	}

	function input_input_handler_1() {
		$valueF2 = this.value;
		valueF2.set($valueF2);
	}

	return {
		createForm,
		errorsF1,
		valueF1,
		inputF1,
		errorsF2,
		valueF2,
		inputF2,
		$valueF1,
		$valueF2,
		input_input_handler,
		input_input_handler_1
	};
}

class Field_confirm extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});
	}
}

/* src/docs/docs.svelte generated by Svelte v3.15.0 */

function add_css$5() {
	var style = element("style");
	style.id = "svelte-69jfzn-style";
	style.textContent = ".tabs{border-bottom:5px solid #fddbd3;display:flex;margin-bottom:20px;position:relative}.tabs--bar{background:#ec512a;height:5px;left:0;position:absolute;top:100%;transition:transform .5s cubic-bezier(0.86, 0, 0.07, 1);width:50%}.tabs--button{background:none;border:0;cursor:pointer;flex:1;font-size:20px;line-height:20px;outline:none;padding:20px;text-transform:uppercase}.tabs--button:hover{color:#ec512a}.tabs--button:disabled{color:inherit}.logo{color:inherit;cursor:pointer;display:block;font-size:18px;line-height:22px;margin:10px auto 20px;max-width:260px;text-decoration:none;text-align:center}.logo img{display:block;max-width:100%}.logo:hover{color:#ec512a}.pages{transition:opacity .3s ease}.pages.transition--active{opacity:0}h1{font-size:24px;line-height:28px;margin-bottom:1em}mark,pre{background:#ddd;border-radius:3px;font-weight:normal;font-family:monospace;padding:0 5px}pre{padding:5px 10px}.input-text,select{border:1px solid #333;border-radius:3px;font-size:14px;height:40px;line-height:18px;outline:0;padding:5px 10px;width:100%}select{height:auto;line-height:inherit;padding:5px}.input-choice{display:inline-block;margin:4px 10px 0 0;vertical-align:top}";
	append(document.head, style);
}

// (37:0) {#if !transitionActive}
function create_if_block$5(ctx) {
	let div;
	let current_block_type_index;
	let if_block;
	let div_transition;
	let current;
	let dispose;
	const if_block_creators = [create_if_block_1$3, create_else_block$3];
	const if_blocks = [];

	function select_block_type(changed, ctx) {
		if (ctx.pageId === 0) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(null, ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			div = element("div");
			if_block.c();
			dispose = listen(div, "outroend", ctx.outroend_handler);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			if_blocks[current_block_type_index].m(div, null);
			current = true;
		},
		p(changed, ctx) {
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(changed, ctx);

			if (current_block_type_index !== previous_block_index) {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				}

				transition_in(if_block, 1);
				if_block.m(div, null);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);

			add_render_callback(() => {
				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { delay: 0, duration: 250 }, true);
				div_transition.run(1);
			});

			current = true;
		},
		o(local) {
			transition_out(if_block);
			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { delay: 0, duration: 250 }, false);
			div_transition.run(0);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if_blocks[current_block_type_index].d();
			if (detaching && div_transition) div_transition.end();
			dispose();
		}
	};
}

// (53:4) {:else}
function create_else_block$3(ctx) {
	let current;
	const editor = new Editor({});

	return {
		c() {
			create_component(editor.$$.fragment);
		},
		m(target, anchor) {
			mount_component(editor, target, anchor);
			current = true;
		},
		i(local) {
			if (current) return;
			transition_in(editor.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(editor.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(editor, detaching);
		}
	};
}

// (42:4) {#if pageId === 0}
function create_if_block_1$3(ctx) {
	let t0;
	let t1;
	let t2;
	let t3;
	let t4;
	let t5;
	let t6;
	let t7;
	let t8;
	let current;
	const string = new String$1({});
	const email = new Email({});
	const number = new Number({});
	const boolean = new Boolean({});
	const array = new Array$1({});
	const required = new Required({});
	const match = new Match({});
	const equal = new Equal({});
	const arraysumofpoints = new Array_sum_of_points({});
	const fieldconfirm = new Field_confirm({});

	return {
		c() {
			create_component(string.$$.fragment);
			t0 = space();
			create_component(email.$$.fragment);
			t1 = space();
			create_component(number.$$.fragment);
			t2 = space();
			create_component(boolean.$$.fragment);
			t3 = space();
			create_component(array.$$.fragment);
			t4 = space();
			create_component(required.$$.fragment);
			t5 = space();
			create_component(match.$$.fragment);
			t6 = space();
			create_component(equal.$$.fragment);
			t7 = space();
			create_component(arraysumofpoints.$$.fragment);
			t8 = space();
			create_component(fieldconfirm.$$.fragment);
		},
		m(target, anchor) {
			mount_component(string, target, anchor);
			insert(target, t0, anchor);
			mount_component(email, target, anchor);
			insert(target, t1, anchor);
			mount_component(number, target, anchor);
			insert(target, t2, anchor);
			mount_component(boolean, target, anchor);
			insert(target, t3, anchor);
			mount_component(array, target, anchor);
			insert(target, t4, anchor);
			mount_component(required, target, anchor);
			insert(target, t5, anchor);
			mount_component(match, target, anchor);
			insert(target, t6, anchor);
			mount_component(equal, target, anchor);
			insert(target, t7, anchor);
			mount_component(arraysumofpoints, target, anchor);
			insert(target, t8, anchor);
			mount_component(fieldconfirm, target, anchor);
			current = true;
		},
		i(local) {
			if (current) return;
			transition_in(string.$$.fragment, local);
			transition_in(email.$$.fragment, local);
			transition_in(number.$$.fragment, local);
			transition_in(boolean.$$.fragment, local);
			transition_in(array.$$.fragment, local);
			transition_in(required.$$.fragment, local);
			transition_in(match.$$.fragment, local);
			transition_in(equal.$$.fragment, local);
			transition_in(arraysumofpoints.$$.fragment, local);
			transition_in(fieldconfirm.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(string.$$.fragment, local);
			transition_out(email.$$.fragment, local);
			transition_out(number.$$.fragment, local);
			transition_out(boolean.$$.fragment, local);
			transition_out(array.$$.fragment, local);
			transition_out(required.$$.fragment, local);
			transition_out(match.$$.fragment, local);
			transition_out(equal.$$.fragment, local);
			transition_out(arraysumofpoints.$$.fragment, local);
			transition_out(fieldconfirm.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(string, detaching);
			if (detaching) detach(t0);
			destroy_component(email, detaching);
			if (detaching) detach(t1);
			destroy_component(number, detaching);
			if (detaching) detach(t2);
			destroy_component(boolean, detaching);
			if (detaching) detach(t3);
			destroy_component(array, detaching);
			if (detaching) detach(t4);
			destroy_component(required, detaching);
			if (detaching) detach(t5);
			destroy_component(match, detaching);
			if (detaching) detach(t6);
			destroy_component(equal, detaching);
			if (detaching) detach(t7);
			destroy_component(arraysumofpoints, detaching);
			if (detaching) detach(t8);
			destroy_component(fieldconfirm, detaching);
		}
	};
}

function create_fragment$g(ctx) {
	let a;
	let t1;
	let div;
	let button0;
	let t2;
	let button0_disabled_value;
	let t3;
	let button1;
	let t4;
	let button1_disabled_value;
	let t5;
	let i;
	let i_style_value;
	let t6;
	let if_block_anchor;
	let current;
	let dispose;
	let if_block = !ctx.transitionActive && create_if_block$5(ctx);

	return {
		c() {
			a = element("a");

			a.innerHTML = `<img src="./logo.svg" alt="svelidation">
  go to github
`;

			t1 = space();
			div = element("div");
			button0 = element("button");
			t2 = text("Examples");
			t3 = space();
			button1 = element("button");
			t4 = text("Editor");
			t5 = space();
			i = element("i");
			t6 = space();
			if (if_block) if_block.c();
			if_block_anchor = empty();
			attr(a, "href", "//github.com/yazonnile/svelidation");
			attr(a, "class", "logo");
			attr(button0, "class", "tabs--button");
			button0.disabled = button0_disabled_value = ctx.pageId === 0;
			toggle_class(button0, "tabs--active", ctx.pageId === 0);
			attr(button1, "class", "tabs--button");
			button1.disabled = button1_disabled_value = ctx.pageId === 1;
			toggle_class(button1, "tabs--active", ctx.pageId === 1);
			attr(i, "class", "tabs--bar");
			attr(i, "style", i_style_value = `transform: translateX(${100 * ctx.barId}%)`);
			attr(div, "class", "tabs");

			dispose = [
				listen(button0, "click", ctx.click_handler),
				listen(button1, "click", ctx.click_handler_1)
			];
		},
		m(target, anchor) {
			insert(target, a, anchor);
			insert(target, t1, anchor);
			insert(target, div, anchor);
			append(div, button0);
			append(button0, t2);
			append(div, t3);
			append(div, button1);
			append(button1, t4);
			append(div, t5);
			append(div, i);
			insert(target, t6, anchor);
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(changed, ctx) {
			if (!current || changed.pageId && button0_disabled_value !== (button0_disabled_value = ctx.pageId === 0)) {
				button0.disabled = button0_disabled_value;
			}

			if (changed.pageId) {
				toggle_class(button0, "tabs--active", ctx.pageId === 0);
			}

			if (!current || changed.pageId && button1_disabled_value !== (button1_disabled_value = ctx.pageId === 1)) {
				button1.disabled = button1_disabled_value;
			}

			if (changed.pageId) {
				toggle_class(button1, "tabs--active", ctx.pageId === 1);
			}

			if (!current || changed.barId && i_style_value !== (i_style_value = `transform: translateX(${100 * ctx.barId}%)`)) {
				attr(i, "style", i_style_value);
			}

			if (!ctx.transitionActive) {
				if (if_block) {
					if_block.p(changed, ctx);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block$5(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(a);
			if (detaching) detach(t1);
			if (detaching) detach(div);
			if (detaching) detach(t6);
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
			run_all(dispose);
		}
	};
}

function instance$g($$self, $$props, $$invalidate) {
	let barId = 1;
	let pageId = barId;
	let transitionActive = false;

	const switchPages = n => {
		if (transitionActive) return;
		$$invalidate("transitionActive", transitionActive = true);
		$$invalidate("barId", barId = n);
	};

	const click_handler = () => switchPages(0);
	const click_handler_1 = () => switchPages(1);
	const outroend_handler = () => ($$invalidate("pageId", pageId = barId), $$invalidate("transitionActive", transitionActive = false));

	return {
		barId,
		pageId,
		transitionActive,
		switchPages,
		click_handler,
		click_handler_1,
		outroend_handler
	};
}

class Docs extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-69jfzn-style")) add_css$5();
		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});
	}
}

new Docs({ target: document.getElementById('app') });
