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
const has_prop = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);

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
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
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
function stop_propagation(fn) {
    return function (event) {
        event.stopPropagation();
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
function select_option(select, value) {
    for (let i = 0; i < select.options.length; i += 1) {
        const option = select.options[i];
        if (option.__value === value) {
            option.selected = true;
            return;
        }
    }
}
function select_options(select, value) {
    for (let i = 0; i < select.options.length; i += 1) {
        const option = select.options[i];
        option.selected = ~value.indexOf(option.__value);
    }
}
function select_value(select) {
    const selected_option = select.querySelector(':checked') || select.options[0];
    return selected_option && selected_option.__value;
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
function get_current_component() {
    if (!current_component)
        throw new Error(`Function called outside component initialization`);
    return current_component;
}
function createEventDispatcher() {
    const component = get_current_component();
    return (type, detail) => {
        const callbacks = component.$$.callbacks[type];
        if (callbacks) {
            // TODO are there situations where events could be dispatched
            // in a server (non-DOM) environment?
            const event = custom_event(type, detail);
            callbacks.slice().forEach(fn => {
                fn.call(component, event);
            });
        }
    };
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
function add_flush_callback(fn) {
    flush_callbacks.push(fn);
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
function outro_and_destroy_block(block, lookup) {
    transition_out(block, 1, 1, () => {
        lookup.delete(block.key);
    });
}
function update_keyed_each(old_blocks, changed, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
    let o = old_blocks.length;
    let n = list.length;
    let i = o;
    const old_indexes = {};
    while (i--)
        old_indexes[old_blocks[i].key] = i;
    const new_blocks = [];
    const new_lookup = new Map();
    const deltas = new Map();
    i = n;
    while (i--) {
        const child_ctx = get_context(ctx, list, i);
        const key = get_key(child_ctx);
        let block = lookup.get(key);
        if (!block) {
            block = create_each_block(key, child_ctx);
            block.c();
        }
        else if (dynamic) {
            block.p(changed, child_ctx);
        }
        new_lookup.set(key, new_blocks[i] = block);
        if (key in old_indexes)
            deltas.set(key, Math.abs(i - old_indexes[key]));
    }
    const will_move = new Set();
    const did_move = new Set();
    function insert(block) {
        transition_in(block, 1);
        block.m(node, next);
        lookup.set(block.key, block);
        next = block.first;
        n--;
    }
    while (o && n) {
        const new_block = new_blocks[n - 1];
        const old_block = old_blocks[o - 1];
        const new_key = new_block.key;
        const old_key = old_block.key;
        if (new_block === old_block) {
            // do nothing
            next = new_block.first;
            o--;
            n--;
        }
        else if (!new_lookup.has(old_key)) {
            // remove old block
            destroy(old_block, lookup);
            o--;
        }
        else if (!lookup.has(new_key) || will_move.has(new_key)) {
            insert(new_block);
        }
        else if (did_move.has(old_key)) {
            o--;
        }
        else if (deltas.get(new_key) > deltas.get(old_key)) {
            did_move.add(new_key);
            insert(new_block);
        }
        else {
            will_move.add(old_key);
            o--;
        }
    }
    while (o--) {
        const old_block = old_blocks[o];
        if (!new_lookup.has(old_block.key))
            destroy(old_block, lookup);
    }
    while (n)
        insert(new_blocks[n - 1]);
    return new_blocks;
}

function bind(component, name, callback) {
    if (has_prop(component.$$.props, name)) {
        name = component.$$.props[name] || name;
        component.$$.bound[name] = callback;
        callback(component.$$.ctx[name]);
    }
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
function quintOut(t) {
    return --t * t * t * t * t + 1;
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
    // skip for empty and optional fields
    if (skipValidation(value, { required, optional })) {
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

/* src/docs/ui/button.svelte generated by Svelte v3.15.0 */

function add_css() {
	var style = element("style");
	style.id = "svelte-74gb8w-style";
	style.textContent = "button.svelte-74gb8w{background:#dcefff;border-radius:3px;border:1px solid #bbb;box-shadow:0 0 5px #bbb;color:inherit;cursor:pointer;height:40px;font-size:inherit;font-weight:bold;margin-right:5px;line-height:28px;outline:0;padding:5px 10px;text-transform:uppercase}button.svelte-74gb8w:only-child{margin-right:0}button.svelte-74gb8w:hover{background-color:#fff}";
	append(document.head, style);
}

function create_fragment(ctx) {
	let button;
	let t;
	let current;
	let dispose;
	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);

	return {
		c() {
			button = element("button");

			if (!default_slot) {
				t = text("validate");
			}

			if (default_slot) default_slot.c();
			attr(button, "type", ctx.type);
			attr(button, "class", "svelte-74gb8w");
			dispose = listen(button, "click", ctx.click_handler);
		},
		m(target, anchor) {
			insert(target, button, anchor);

			if (!default_slot) {
				append(button, t);
			}

			if (default_slot) {
				default_slot.m(button, null);
			}

			current = true;
		},
		p(changed, ctx) {
			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
			}

			if (!current || changed.type) {
				attr(button, "type", ctx.type);
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
			if (detaching) detach(button);
			if (default_slot) default_slot.d(detaching);
			dispose();
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { type = "button" } = $$props;
	let { $$slots = {}, $$scope } = $$props;

	function click_handler(event) {
		bubble($$self, event);
	}

	$$self.$set = $$props => {
		if ("type" in $$props) $$invalidate("type", type = $$props.type);
		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
	};

	return { type, click_handler, $$slots, $$scope };
}

class Button extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-74gb8w-style")) add_css();
		init(this, options, instance, create_fragment, safe_not_equal, { type: 0 });
	}
}

/* src/docs/builder/components/toggle.svelte generated by Svelte v3.15.0 */

function add_css$1() {
	var style = element("style");
	style.id = "svelte-1wkghe5-style";
	style.textContent = ".toggle.svelte-1wkghe5{background:#fff;box-shadow:0 0 5px #bbb;border-radius:15px;cursor:pointer;display:inline-block;height:20px;overflow:hidden;position:relative;transition:.3s background-color ease-in-out;vertical-align:top;width:40px}.toggle.checked.svelte-1wkghe5{background:#004cb4}.toggle.svelte-1wkghe5::after{background:#bbb;border-radius:7px;content:'';height:14px;left:3px;position:absolute;top:3px;transition-property:transform, background-color;transition-duration:.3s;transition-timing-function:ease-in-out;width:14px}.toggle.checked.svelte-1wkghe5::after{background:#fff;transform:translateX(calc(100% + 6px))}input.svelte-1wkghe5{left:0;opacity:0;position:absolute;visibility:hidden;top:0}";
	append(document.head, style);
}

function create_fragment$1(ctx) {
	let label;
	let input;
	let dispose;

	return {
		c() {
			label = element("label");
			input = element("input");
			attr(input, "type", "checkbox");
			attr(input, "id", ctx.id);
			attr(input, "class", "svelte-1wkghe5");
			attr(label, "class", "toggle svelte-1wkghe5");
			toggle_class(label, "checked", ctx.checked);

			dispose = [
				listen(input, "change", ctx.input_change_handler),
				listen(input, "change", ctx.change_handler),
				listen(label, "click", stop_propagation(ctx.click_handler))
			];
		},
		m(target, anchor) {
			insert(target, label, anchor);
			append(label, input);
			input.checked = ctx.checked;
		},
		p(changed, ctx) {
			if (changed.id) {
				attr(input, "id", ctx.id);
			}

			if (changed.checked) {
				input.checked = ctx.checked;
			}

			if (changed.checked) {
				toggle_class(label, "checked", ctx.checked);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(label);
			run_all(dispose);
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let { checked = false } = $$props;
	let { id = false } = $$props;

	function click_handler(event) {
		bubble($$self, event);
	}

	function change_handler(event) {
		bubble($$self, event);
	}

	function input_change_handler() {
		checked = this.checked;
		$$invalidate("checked", checked);
	}

	$$self.$set = $$props => {
		if ("checked" in $$props) $$invalidate("checked", checked = $$props.checked);
		if ("id" in $$props) $$invalidate("id", id = $$props.id);
	};

	return {
		checked,
		id,
		click_handler,
		change_handler,
		input_change_handler
	};
}

class Toggle extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1wkghe5-style")) add_css$1();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, { checked: 0, id: 0 });
	}
}

/* src/docs/builder/components/new-field-rule.svelte generated by Svelte v3.15.0 */

function add_css$2() {
	var style = element("style");
	style.id = "svelte-cjbcpu-style";
	style.textContent = ".rule.svelte-cjbcpu{background:#dcefff;cursor:pointer;display:flex;flex:1 0 calc(50% - 10px);margin:0 10px 10px 0;min-width:250px;padding:10px;width:calc(50% - 10px)}.rule.checked.svelte-cjbcpu{cursor:initial}.disabled.svelte-cjbcpu{filter:grayscale(100%);opacity:.5;pointer-events:none}.rule.svelte-cjbcpu span.svelte-cjbcpu{flex:1;margin-left:10px}.rule.svelte-cjbcpu input.svelte-cjbcpu{border:1px solid #bbb;border-radius:3px;font-size:14px;height:20px;line-height:18px;margin-left:10px;outline:0;padding:0 3px;text-align:right;width:100px}.rule.svelte-cjbcpu input.svelte-cjbcpu:disabled{cursor:pointer;opacity:.5}.rule.svelte-cjbcpu .double.svelte-cjbcpu{width:45px}";
	append(document.head, style);
}

// (32:2) {#if typeof model.value !== 'undefined'}
function create_if_block(ctx) {
	let show_if;
	let if_block_anchor;

	function select_block_type(changed, ctx) {
		if (show_if == null || changed.model) show_if = !!Array.isArray(ctx.model.value);
		if (show_if) return create_if_block_1;
		if (ctx.type === "number") return create_if_block_2;
		return create_else_block;
	}

	let current_block_type = select_block_type(null, ctx);
	let if_block = current_block_type(ctx);

	return {
		c() {
			if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},
		p(changed, ctx) {
			if (current_block_type === (current_block_type = select_block_type(changed, ctx)) && if_block) {
				if_block.p(changed, ctx);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			}
		},
		d(detaching) {
			if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

// (38:4) {:else}
function create_else_block(ctx) {
	let input;
	let input_disabled_value;
	let dispose;

	return {
		c() {
			input = element("input");
			attr(input, "placeholder", ctx.placeholder);
			attr(input, "type", "text");
			input.disabled = input_disabled_value = !ctx.model.checked;
			attr(input, "class", "svelte-cjbcpu");
			dispose = listen(input, "input", ctx.input_input_handler_1);
		},
		m(target, anchor) {
			insert(target, input, anchor);
			set_input_value(input, ctx.model.value);
		},
		p(changed, ctx) {
			if (changed.placeholder) {
				attr(input, "placeholder", ctx.placeholder);
			}

			if (changed.model && input_disabled_value !== (input_disabled_value = !ctx.model.checked)) {
				input.disabled = input_disabled_value;
			}

			if (changed.model && input.value !== ctx.model.value) {
				set_input_value(input, ctx.model.value);
			}
		},
		d(detaching) {
			if (detaching) detach(input);
			dispose();
		}
	};
}

// (36:32) 
function create_if_block_2(ctx) {
	let input;
	let input_disabled_value;
	let input_updating = false;
	let dispose;

	function input_input_handler() {
		input_updating = true;
		ctx.input_input_handler.call(input);
	}

	return {
		c() {
			input = element("input");
			attr(input, "placeholder", ctx.placeholder);
			attr(input, "type", "number");
			input.disabled = input_disabled_value = !ctx.model.checked;
			attr(input, "class", "svelte-cjbcpu");
			dispose = listen(input, "input", input_input_handler);
		},
		m(target, anchor) {
			insert(target, input, anchor);
			set_input_value(input, ctx.model.value);
		},
		p(changed, ctx) {
			if (changed.placeholder) {
				attr(input, "placeholder", ctx.placeholder);
			}

			if (changed.model && input_disabled_value !== (input_disabled_value = !ctx.model.checked)) {
				input.disabled = input_disabled_value;
			}

			if (!input_updating && changed.model) {
				set_input_value(input, ctx.model.value);
			}

			input_updating = false;
		},
		d(detaching) {
			if (detaching) detach(input);
			dispose();
		}
	};
}

// (33:4) {#if Array.isArray(model.value)}
function create_if_block_1(ctx) {
	let input0;
	let input0_disabled_value;
	let input0_updating = false;
	let t;
	let input1;
	let input1_disabled_value;
	let input1_updating = false;
	let dispose;

	function input0_input_handler() {
		input0_updating = true;
		ctx.input0_input_handler.call(input0);
	}

	function input1_input_handler() {
		input1_updating = true;
		ctx.input1_input_handler.call(input1);
	}

	return {
		c() {
			input0 = element("input");
			t = space();
			input1 = element("input");
			attr(input0, "placeholder", ctx.placeholder);
			attr(input0, "type", "number");
			attr(input0, "class", "double svelte-cjbcpu");
			input0.disabled = input0_disabled_value = !ctx.model.checked;
			attr(input1, "placeholder", ctx.placeholder);
			attr(input1, "type", "number");
			attr(input1, "class", "double svelte-cjbcpu");
			input1.disabled = input1_disabled_value = !ctx.model.checked;

			dispose = [
				listen(input0, "input", input0_input_handler),
				listen(input1, "input", input1_input_handler)
			];
		},
		m(target, anchor) {
			insert(target, input0, anchor);
			set_input_value(input0, ctx.model.value[0]);
			insert(target, t, anchor);
			insert(target, input1, anchor);
			set_input_value(input1, ctx.model.value[1]);
		},
		p(changed, ctx) {
			if (changed.placeholder) {
				attr(input0, "placeholder", ctx.placeholder);
			}

			if (changed.model && input0_disabled_value !== (input0_disabled_value = !ctx.model.checked)) {
				input0.disabled = input0_disabled_value;
			}

			if (!input0_updating && changed.model) {
				set_input_value(input0, ctx.model.value[0]);
			}

			input0_updating = false;

			if (changed.placeholder) {
				attr(input1, "placeholder", ctx.placeholder);
			}

			if (changed.model && input1_disabled_value !== (input1_disabled_value = !ctx.model.checked)) {
				input1.disabled = input1_disabled_value;
			}

			if (!input1_updating && changed.model) {
				set_input_value(input1, ctx.model.value[1]);
			}

			input1_updating = false;
		},
		d(detaching) {
			if (detaching) detach(input0);
			if (detaching) detach(t);
			if (detaching) detach(input1);
			run_all(dispose);
		}
	};
}

function create_fragment$2(ctx) {
	let div;
	let updating_checked;
	let t0;
	let span;
	let t1;
	let t2;
	let current;
	let dispose;

	function toggle_checked_binding(value) {
		ctx.toggle_checked_binding.call(null, value);
	}

	let toggle_props = {};

	if (ctx.model.checked !== void 0) {
		toggle_props.checked = ctx.model.checked;
	}

	const toggle = new Toggle({ props: toggle_props });
	binding_callbacks.push(() => bind(toggle, "checked", toggle_checked_binding));
	let if_block = typeof ctx.model.value !== "undefined" && create_if_block(ctx);

	return {
		c() {
			div = element("div");
			create_component(toggle.$$.fragment);
			t0 = space();
			span = element("span");
			t1 = text(ctx.text);
			t2 = space();
			if (if_block) if_block.c();
			attr(span, "class", "svelte-cjbcpu");
			attr(div, "class", "rule svelte-cjbcpu");
			toggle_class(div, "checked", ctx.model.checked);
			toggle_class(div, "disabled", ctx.disabled);
			dispose = listen(div, "click", ctx.onClick);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(toggle, div, null);
			append(div, t0);
			append(div, span);
			append(span, t1);
			append(div, t2);
			if (if_block) if_block.m(div, null);
			current = true;
		},
		p(changed, ctx) {
			const toggle_changes = {};

			if (!updating_checked && changed.model) {
				updating_checked = true;
				toggle_changes.checked = ctx.model.checked;
				add_flush_callback(() => updating_checked = false);
			}

			toggle.$set(toggle_changes);
			if (!current || changed.text) set_data(t1, ctx.text);

			if (typeof ctx.model.value !== "undefined") {
				if (if_block) {
					if_block.p(changed, ctx);
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					if_block.m(div, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (changed.model) {
				toggle_class(div, "checked", ctx.model.checked);
			}

			if (changed.disabled) {
				toggle_class(div, "disabled", ctx.disabled);
			}
		},
		i(local) {
			if (current) return;
			transition_in(toggle.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(toggle.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_component(toggle);
			if (if_block) if_block.d();
			dispose();
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	let { model } = $$props;
	let { disabled = false } = $$props;
	let { type = "text" } = $$props;
	let { text } = $$props;
	let { placeholder = false } = $$props;

	if (!placeholder) {
		$$invalidate("placeholder", placeholder = "");
	}

	const onClick = () => {
		if (!model.checked) {
			$$invalidate("model", model.checked = true, model);
		}
	};

	function toggle_checked_binding(value) {
		model.checked = value;
		$$invalidate("model", model);
	}

	function input0_input_handler() {
		model.value[0] = to_number(this.value);
		$$invalidate("model", model);
	}

	function input1_input_handler() {
		model.value[1] = to_number(this.value);
		$$invalidate("model", model);
	}

	function input_input_handler() {
		model.value = to_number(this.value);
		$$invalidate("model", model);
	}

	function input_input_handler_1() {
		model.value = this.value;
		$$invalidate("model", model);
	}

	$$self.$set = $$props => {
		if ("model" in $$props) $$invalidate("model", model = $$props.model);
		if ("disabled" in $$props) $$invalidate("disabled", disabled = $$props.disabled);
		if ("type" in $$props) $$invalidate("type", type = $$props.type);
		if ("text" in $$props) $$invalidate("text", text = $$props.text);
		if ("placeholder" in $$props) $$invalidate("placeholder", placeholder = $$props.placeholder);
	};

	return {
		model,
		disabled,
		type,
		text,
		placeholder,
		onClick,
		toggle_checked_binding,
		input0_input_handler,
		input1_input_handler,
		input_input_handler,
		input_input_handler_1
	};
}

class New_field_rule extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-cjbcpu-style")) add_css$2();

		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
			model: 0,
			disabled: 0,
			type: 0,
			text: 0,
			placeholder: 0
		});
	}
}

/* src/docs/builder/components/new-field.svelte generated by Svelte v3.15.0 */

function add_css$3() {
	var style = element("style");
	style.id = "svelte-4srbam-style";
	style.textContent = ".type.svelte-4srbam{display:flex;margin-bottom:10px;overflow:hidden}.type.svelte-4srbam select.svelte-4srbam{border:1px solid #bbb;border-radius:3px;font-size:16px;height:40px;outline:0;padding:0 3px}.type.svelte-4srbam .button.svelte-4srbam{flex:1;margin-left:10px}.type.svelte-4srbam select.svelte-4srbam:disabled{background:#fff;color:inherit}.type select:disabled+.button.svelte-4srbam{margin-right:0;transition-delay:.5s}.rules.svelte-4srbam{display:flex;flex-wrap:wrap;width:calc(100% + 10px)}";
	append(document.head, style);
}

// (79:0) {:else}
function create_else_block$1(ctx) {
	let div;
	let select;
	let option0;
	let option0_value_value;
	let option1;
	let option2;
	let option3;
	let option4;
	let option5;
	let t6;
	let t7;
	let t8;
	let if_block2_anchor;
	let current;
	let dispose;
	let if_block0 = ctx.selectedType && create_if_block_3(ctx);
	let if_block1 = ctx.selectedType && create_if_block_2$1(ctx);
	let if_block2 = ctx.selectedType && create_if_block_1$1(ctx);

	return {
		c() {
			div = element("div");
			select = element("select");
			option0 = element("option");
			option0.textContent = "First, select type";
			option1 = element("option");
			option1.textContent = "string";
			option2 = element("option");
			option2.textContent = "email";
			option3 = element("option");
			option3.textContent = "number";
			option4 = element("option");
			option4.textContent = "boolean";
			option5 = element("option");
			option5.textContent = "array";
			t6 = space();
			if (if_block0) if_block0.c();
			t7 = space();
			if (if_block1) if_block1.c();
			t8 = space();
			if (if_block2) if_block2.c();
			if_block2_anchor = empty();
			option0.__value = option0_value_value = "";
			option0.value = option0.__value;
			option0.disabled = true;
			option1.__value = "string";
			option1.value = option1.__value;
			option2.__value = "email";
			option2.value = option2.__value;
			option3.__value = "number";
			option3.value = option3.__value;
			option4.__value = "boolean";
			option4.value = option4.__value;
			option5.__value = "array";
			option5.value = option5.__value;
			select.disabled = ctx.selectedType;
			attr(select, "class", "svelte-4srbam");
			if (ctx.selectedType === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
			attr(div, "class", "type svelte-4srbam");
			dispose = listen(select, "change", ctx.select_change_handler);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, select);
			append(select, option0);
			append(select, option1);
			append(select, option2);
			append(select, option3);
			append(select, option4);
			append(select, option5);
			select_option(select, ctx.selectedType);
			append(div, t6);
			if (if_block0) if_block0.m(div, null);
			insert(target, t7, anchor);
			if (if_block1) if_block1.m(target, anchor);
			insert(target, t8, anchor);
			if (if_block2) if_block2.m(target, anchor);
			insert(target, if_block2_anchor, anchor);
			current = true;
		},
		p(changed, ctx) {
			if (!current || changed.selectedType) {
				select.disabled = ctx.selectedType;
			}

			if (changed.selectedType) {
				select_option(select, ctx.selectedType);
			}

			if (ctx.selectedType) {
				if (if_block0) {
					if_block0.p(changed, ctx);
					transition_in(if_block0, 1);
				} else {
					if_block0 = create_if_block_3(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(div, null);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			if (ctx.selectedType) {
				if (if_block1) {
					if_block1.p(changed, ctx);
					transition_in(if_block1, 1);
				} else {
					if_block1 = create_if_block_2$1(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(t8.parentNode, t8);
				}
			} else if (if_block1) {
				group_outros();

				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});

				check_outros();
			}

			if (ctx.selectedType) {
				if (if_block2) {
					if_block2.p(changed, ctx);
					transition_in(if_block2, 1);
				} else {
					if_block2 = create_if_block_1$1(ctx);
					if_block2.c();
					transition_in(if_block2, 1);
					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
				}
			} else if (if_block2) {
				group_outros();

				transition_out(if_block2, 1, 1, () => {
					if_block2 = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(if_block1);
			transition_in(if_block2);
			current = true;
		},
		o(local) {
			transition_out(if_block0);
			transition_out(if_block1);
			transition_out(if_block2);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (if_block0) if_block0.d();
			if (detaching) detach(t7);
			if (if_block1) if_block1.d(detaching);
			if (detaching) detach(t8);
			if (if_block2) if_block2.d(detaching);
			if (detaching) detach(if_block2_anchor);
			dispose();
		}
	};
}

// (76:0) {#if initialState}
function create_if_block$1(ctx) {
	let t;
	let current;
	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);

	const button = new Button({
			props: {
				$$slots: { default: [create_default_slot] },
				$$scope: { ctx }
			}
		});

	button.$on("click", ctx.click_handler);

	return {
		c() {
			if (default_slot) default_slot.c();
			t = space();
			create_component(button.$$.fragment);
		},
		m(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			insert(target, t, anchor);
			mount_component(button, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
			}

			const button_changes = {};

			if (changed.$$scope) {
				button_changes.$$scope = { changed, ctx };
			}

			button.$set(button_changes);
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			transition_in(button.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			transition_out(button.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (default_slot) default_slot.d(detaching);
			if (detaching) detach(t);
			destroy_component(button, detaching);
		}
	};
}

// (89:4) {#if selectedType}
function create_if_block_3(ctx) {
	let div;
	let current;

	const button = new Button({
			props: {
				$$slots: { default: [create_default_slot_3] },
				$$scope: { ctx }
			}
		});

	button.$on("click", ctx.onChangeType);

	return {
		c() {
			div = element("div");
			create_component(button.$$.fragment);
			attr(div, "class", "button svelte-4srbam");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(button, div, null);
			current = true;
		},
		p(changed, ctx) {
			const button_changes = {};

			if (changed.$$scope) {
				button_changes.$$scope = { changed, ctx };
			}

			button.$set(button_changes);
		},
		i(local) {
			if (current) return;
			transition_in(button.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(button.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_component(button);
		}
	};
}

// (91:8) <Button on:click={onChangeType}>
function create_default_slot_3(ctx) {
	let t;

	return {
		c() {
			t = text("change");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (96:2) {#if selectedType}
function create_if_block_2$1(ctx) {
	let div;
	let updating_model;
	let t0;
	let updating_model_1;
	let t1;
	let updating_model_2;
	let t2;
	let updating_model_3;
	let t3;
	let updating_model_4;
	let t4;
	let updating_model_5;
	let t5;
	let updating_model_6;
	let t6;
	let updating_model_7;
	let div_transition;
	let current;

	function rule0_model_binding(value) {
		ctx.rule0_model_binding.call(null, value);
	}

	let rule0_props = {
		type: "number",
		disabled: !["string", "number", "array"].includes(ctx.selectedType),
		text: "min"
	};

	if (ctx.selectedRules.min !== void 0) {
		rule0_props.model = ctx.selectedRules.min;
	}

	const rule0 = new New_field_rule({ props: rule0_props });
	binding_callbacks.push(() => bind(rule0, "model", rule0_model_binding));

	function rule1_model_binding(value_1) {
		ctx.rule1_model_binding.call(null, value_1);
	}

	let rule1_props = {
		type: "number",
		disabled: !["string", "number", "array"].includes(ctx.selectedType),
		text: "max"
	};

	if (ctx.selectedRules.max !== void 0) {
		rule1_props.model = ctx.selectedRules.max;
	}

	const rule1 = new New_field_rule({ props: rule1_props });
	binding_callbacks.push(() => bind(rule1, "model", rule1_model_binding));

	function rule2_model_binding(value_2) {
		ctx.rule2_model_binding.call(null, value_2);
	}

	let rule2_props = {
		type: "number",
		disabled: !["string", "number"].includes(ctx.selectedType),
		text: "between"
	};

	if (ctx.selectedRules.between !== void 0) {
		rule2_props.model = ctx.selectedRules.between;
	}

	const rule2 = new New_field_rule({ props: rule2_props });
	binding_callbacks.push(() => bind(rule2, "model", rule2_model_binding));

	function rule3_model_binding(value_3) {
		ctx.rule3_model_binding.call(null, value_3);
	}

	let rule3_props = {
		disabled: ctx.selectedType !== "array",
		text: "includes"
	};

	if (ctx.selectedRules.includes !== void 0) {
		rule3_props.model = ctx.selectedRules.includes;
	}

	const rule3 = new New_field_rule({ props: rule3_props });
	binding_callbacks.push(() => bind(rule3, "model", rule3_model_binding));

	function rule4_model_binding(value_4) {
		ctx.rule4_model_binding.call(null, value_4);
	}

	let rule4_props = {
		disabled: ctx.selectedType === "boolean",
		text: "equal",
		placeholder: ctx.selectedType === "array" && "1,2,3"
	};

	if (ctx.selectedRules.equal !== void 0) {
		rule4_props.model = ctx.selectedRules.equal;
	}

	const rule4 = new New_field_rule({ props: rule4_props });
	binding_callbacks.push(() => bind(rule4, "model", rule4_model_binding));

	function rule5_model_binding(value_5) {
		ctx.rule5_model_binding.call(null, value_5);
	}

	let rule5_props = {
		disabled: ctx.selectedType === "boolean",
		text: "match",
		placeholder: "[A-Za-z]" + (4) + "..."
	};

	if (ctx.selectedRules.match !== void 0) {
		rule5_props.model = ctx.selectedRules.match;
	}

	const rule5 = new New_field_rule({ props: rule5_props });
	binding_callbacks.push(() => bind(rule5, "model", rule5_model_binding));

	function rule6_model_binding(value_6) {
		ctx.rule6_model_binding.call(null, value_6);
	}

	let rule6_props = {
		disabled: ctx.selectedRules.optional.checked,
		text: "required"
	};

	if (ctx.selectedRules.required !== void 0) {
		rule6_props.model = ctx.selectedRules.required;
	}

	const rule6 = new New_field_rule({ props: rule6_props });
	binding_callbacks.push(() => bind(rule6, "model", rule6_model_binding));

	function rule7_model_binding(value_7) {
		ctx.rule7_model_binding.call(null, value_7);
	}

	let rule7_props = {
		disabled: ctx.selectedRules.required.checked,
		text: "optional"
	};

	if (ctx.selectedRules.optional !== void 0) {
		rule7_props.model = ctx.selectedRules.optional;
	}

	const rule7 = new New_field_rule({ props: rule7_props });
	binding_callbacks.push(() => bind(rule7, "model", rule7_model_binding));

	return {
		c() {
			div = element("div");
			create_component(rule0.$$.fragment);
			t0 = space();
			create_component(rule1.$$.fragment);
			t1 = space();
			create_component(rule2.$$.fragment);
			t2 = space();
			create_component(rule3.$$.fragment);
			t3 = space();
			create_component(rule4.$$.fragment);
			t4 = space();
			create_component(rule5.$$.fragment);
			t5 = space();
			create_component(rule6.$$.fragment);
			t6 = space();
			create_component(rule7.$$.fragment);
			attr(div, "class", "rules svelte-4srbam");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(rule0, div, null);
			append(div, t0);
			mount_component(rule1, div, null);
			append(div, t1);
			mount_component(rule2, div, null);
			append(div, t2);
			mount_component(rule3, div, null);
			append(div, t3);
			mount_component(rule4, div, null);
			append(div, t4);
			mount_component(rule5, div, null);
			append(div, t5);
			mount_component(rule6, div, null);
			append(div, t6);
			mount_component(rule7, div, null);
			current = true;
		},
		p(changed, ctx) {
			const rule0_changes = {};
			if (changed.selectedType) rule0_changes.disabled = !["string", "number", "array"].includes(ctx.selectedType);

			if (!updating_model && changed.selectedRules) {
				updating_model = true;
				rule0_changes.model = ctx.selectedRules.min;
				add_flush_callback(() => updating_model = false);
			}

			rule0.$set(rule0_changes);
			const rule1_changes = {};
			if (changed.selectedType) rule1_changes.disabled = !["string", "number", "array"].includes(ctx.selectedType);

			if (!updating_model_1 && changed.selectedRules) {
				updating_model_1 = true;
				rule1_changes.model = ctx.selectedRules.max;
				add_flush_callback(() => updating_model_1 = false);
			}

			rule1.$set(rule1_changes);
			const rule2_changes = {};
			if (changed.selectedType) rule2_changes.disabled = !["string", "number"].includes(ctx.selectedType);

			if (!updating_model_2 && changed.selectedRules) {
				updating_model_2 = true;
				rule2_changes.model = ctx.selectedRules.between;
				add_flush_callback(() => updating_model_2 = false);
			}

			rule2.$set(rule2_changes);
			const rule3_changes = {};
			if (changed.selectedType) rule3_changes.disabled = ctx.selectedType !== "array";

			if (!updating_model_3 && changed.selectedRules) {
				updating_model_3 = true;
				rule3_changes.model = ctx.selectedRules.includes;
				add_flush_callback(() => updating_model_3 = false);
			}

			rule3.$set(rule3_changes);
			const rule4_changes = {};
			if (changed.selectedType) rule4_changes.disabled = ctx.selectedType === "boolean";
			if (changed.selectedType) rule4_changes.placeholder = ctx.selectedType === "array" && "1,2,3";

			if (!updating_model_4 && changed.selectedRules) {
				updating_model_4 = true;
				rule4_changes.model = ctx.selectedRules.equal;
				add_flush_callback(() => updating_model_4 = false);
			}

			rule4.$set(rule4_changes);
			const rule5_changes = {};
			if (changed.selectedType) rule5_changes.disabled = ctx.selectedType === "boolean";

			if (!updating_model_5 && changed.selectedRules) {
				updating_model_5 = true;
				rule5_changes.model = ctx.selectedRules.match;
				add_flush_callback(() => updating_model_5 = false);
			}

			rule5.$set(rule5_changes);
			const rule6_changes = {};
			if (changed.selectedRules) rule6_changes.disabled = ctx.selectedRules.optional.checked;

			if (!updating_model_6 && changed.selectedRules) {
				updating_model_6 = true;
				rule6_changes.model = ctx.selectedRules.required;
				add_flush_callback(() => updating_model_6 = false);
			}

			rule6.$set(rule6_changes);
			const rule7_changes = {};
			if (changed.selectedRules) rule7_changes.disabled = ctx.selectedRules.required.checked;

			if (!updating_model_7 && changed.selectedRules) {
				updating_model_7 = true;
				rule7_changes.model = ctx.selectedRules.optional;
				add_flush_callback(() => updating_model_7 = false);
			}

			rule7.$set(rule7_changes);
		},
		i(local) {
			if (current) return;
			transition_in(rule0.$$.fragment, local);
			transition_in(rule1.$$.fragment, local);
			transition_in(rule2.$$.fragment, local);
			transition_in(rule3.$$.fragment, local);
			transition_in(rule4.$$.fragment, local);
			transition_in(rule5.$$.fragment, local);
			transition_in(rule6.$$.fragment, local);
			transition_in(rule7.$$.fragment, local);

			if (local) {
				add_render_callback(() => {
					if (!div_transition) div_transition = create_bidirectional_transition(div, slide, { duration: 500, easing: quintOut }, true);
					div_transition.run(1);
				});
			}

			current = true;
		},
		o(local) {
			transition_out(rule0.$$.fragment, local);
			transition_out(rule1.$$.fragment, local);
			transition_out(rule2.$$.fragment, local);
			transition_out(rule3.$$.fragment, local);
			transition_out(rule4.$$.fragment, local);
			transition_out(rule5.$$.fragment, local);
			transition_out(rule6.$$.fragment, local);
			transition_out(rule7.$$.fragment, local);

			if (local) {
				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, { duration: 500, easing: quintOut }, false);
				div_transition.run(0);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_component(rule0);
			destroy_component(rule1);
			destroy_component(rule2);
			destroy_component(rule3);
			destroy_component(rule4);
			destroy_component(rule5);
			destroy_component(rule6);
			destroy_component(rule7);
			if (detaching && div_transition) div_transition.end();
		}
	};
}

// (146:2) {#if selectedType}
function create_if_block_1$1(ctx) {
	let t;
	let current;

	const button0 = new Button({
			props: {
				$$slots: { default: [create_default_slot_2] },
				$$scope: { ctx }
			}
		});

	button0.$on("click", ctx.onSave);

	const button1 = new Button({
			props: {
				$$slots: { default: [create_default_slot_1] },
				$$scope: { ctx }
			}
		});

	button1.$on("click", ctx.onCancel);

	return {
		c() {
			create_component(button0.$$.fragment);
			t = space();
			create_component(button1.$$.fragment);
		},
		m(target, anchor) {
			mount_component(button0, target, anchor);
			insert(target, t, anchor);
			mount_component(button1, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const button0_changes = {};

			if (changed.$$scope) {
				button0_changes.$$scope = { changed, ctx };
			}

			button0.$set(button0_changes);
			const button1_changes = {};

			if (changed.$$scope) {
				button1_changes.$$scope = { changed, ctx };
			}

			button1.$set(button1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(button0.$$.fragment, local);
			transition_in(button1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(button0.$$.fragment, local);
			transition_out(button1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(button0, detaching);
			if (detaching) detach(t);
			destroy_component(button1, detaching);
		}
	};
}

// (147:4) <Button on:click={onSave}>
function create_default_slot_2(ctx) {
	let t;

	return {
		c() {
			t = text("Create");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (148:4) <Button on:click={onCancel}>
function create_default_slot_1(ctx) {
	let t;

	return {
		c() {
			t = text("Cancel");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (78:2) <Button on:click={() => (initialState = false)}>
function create_default_slot(ctx) {
	let t;

	return {
		c() {
			t = text("add field");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

function create_fragment$3(ctx) {
	let current_block_type_index;
	let if_block;
	let if_block_anchor;
	let current;
	const if_block_creators = [create_if_block$1, create_else_block$1];
	const if_blocks = [];

	function select_block_type(changed, ctx) {
		if (ctx.initialState) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(null, ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if_blocks[current_block_type_index].m(target, anchor);
			insert(target, if_block_anchor, anchor);
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
			if_blocks[current_block_type_index].d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	let initialState = true;
	let selectedType = "";

	let selectedRules = {
		min: { checked: false, value: "" },
		max: { checked: false, value: "" },
		between: { checked: false, value: ["", ""] },
		includes: { checked: false, value: "" },
		equal: { checked: false, value: "" },
		match: { checked: false, value: "" },
		required: { checked: false },
		optional: { checked: false }
	};

	const onChangeType = () => {
		$$invalidate("selectedType", selectedType = "");

		$$invalidate("selectedRules", selectedRules = Object.keys(selectedRules).reduce(
			(result, ruleName) => {
				const rule = selectedRules[ruleName];
				result[ruleName] = { checked: false };

				if ("value" in rule) {
					result[ruleName].value = Array.isArray(rule.value) ? ["", ""] : "";
				}

				return result;
			},
			{}
		));
	};

	const isDefined = v => typeof v === "string"
	? v.length
	: typeof v !== "undefined";

	const dispatch = createEventDispatcher();

	const onSave = () => {
		const result = Object.keys(selectedRules).reduce(
			(result, ruleName) => {
				const rule = selectedRules[ruleName];

				if (!rule.checked) {
					return result;
				}

				if (!("value" in rule)) {
					result[ruleName] = true;
					return result;
				} else if (ruleName === "equal" && selectedType === "array") {
					result[ruleName] = rule.value.split(",").map(eval);
				} else if (Array.isArray(rule.value)
				? isDefined(rule.value[0]) && isDefined(rule.value[1])
				: isDefined(rule.value)) {
					result[ruleName] = rule.value;
				}

				return result;
			},
			{}
		);

		if (!Object.keys(result).length) {
			return;
		}

		result.type = selectedType;

		result.value = selectedType === "boolean"
		? false
		: selectedType === "array" ? [] : "";

		dispatch("newField", result);
		onCancel();
	};

	const onCancel = () => {
		$$invalidate("initialState", initialState = true);
		onChangeType();
	};

	let { $$slots = {}, $$scope } = $$props;
	const click_handler = () => $$invalidate("initialState", initialState = false);

	function select_change_handler() {
		selectedType = select_value(this);
		$$invalidate("selectedType", selectedType);
	}

	function rule0_model_binding(value) {
		selectedRules.min = value;
		$$invalidate("selectedRules", selectedRules);
	}

	function rule1_model_binding(value_1) {
		selectedRules.max = value_1;
		$$invalidate("selectedRules", selectedRules);
	}

	function rule2_model_binding(value_2) {
		selectedRules.between = value_2;
		$$invalidate("selectedRules", selectedRules);
	}

	function rule3_model_binding(value_3) {
		selectedRules.includes = value_3;
		$$invalidate("selectedRules", selectedRules);
	}

	function rule4_model_binding(value_4) {
		selectedRules.equal = value_4;
		$$invalidate("selectedRules", selectedRules);
	}

	function rule5_model_binding(value_5) {
		selectedRules.match = value_5;
		$$invalidate("selectedRules", selectedRules);
	}

	function rule6_model_binding(value_6) {
		selectedRules.required = value_6;
		$$invalidate("selectedRules", selectedRules);
	}

	function rule7_model_binding(value_7) {
		selectedRules.optional = value_7;
		$$invalidate("selectedRules", selectedRules);
	}

	$$self.$set = $$props => {
		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
	};

	return {
		initialState,
		selectedType,
		selectedRules,
		onChangeType,
		onSave,
		onCancel,
		click_handler,
		select_change_handler,
		rule0_model_binding,
		rule1_model_binding,
		rule2_model_binding,
		rule3_model_binding,
		rule4_model_binding,
		rule5_model_binding,
		rule6_model_binding,
		rule7_model_binding,
		$$slots,
		$$scope
	};
}

class New_field extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-4srbam-style")) add_css$3();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});
	}
}

/* src/docs/ui/widget.svelte generated by Svelte v3.15.0 */

function add_css$4() {
	var style = element("style");
	style.id = "svelte-se31xl-style";
	style.textContent = "div.svelte-se31xl{border:5px solid #dcefff;box-shadow:0 0 3px #000;border-radius:3px;margin-bottom:20px;overflow:hidden;padding:10px}";
	append(document.head, style);
}

function create_fragment$4(ctx) {
	let div;
	let current;
	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);

	return {
		c() {
			div = element("div");
			if (default_slot) default_slot.c();
			attr(div, "class", "svelte-se31xl");
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

function instance$4($$self, $$props, $$invalidate) {
	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$props => {
		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
	};

	return { $$slots, $$scope };
}

class Widget extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-se31xl-style")) add_css$4();
		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});
	}
}

/* src/docs/ui/code.svelte generated by Svelte v3.15.0 */

function add_css$5() {
	var style = element("style");
	style.id = "svelte-e9n8z1-style";
	style.textContent = "pre.svelte-e9n8z1{background:#dcefff;border:1px solid #bbb;border-radius:3px;box-shadow:0 0 5px #bbb;cursor:text;font-weight:normal;font-family:monospace;margin-bottom:10px;overflow-x:auto;padding:5px 10px}.builderMode.svelte-e9n8z1{border:0;border-radius:0;box-shadow:none;margin-bottom:0;min-height:100%}";
	append(document.head, style);
}

function create_fragment$5(ctx) {
	let pre;
	let code_1;
	let addCode_action;

	return {
		c() {
			pre = element("pre");
			code_1 = element("code");
			attr(pre, "class", "svelte-e9n8z1");
			toggle_class(pre, "builderMode", ctx.builderMode);
		},
		m(target, anchor) {
			insert(target, pre, anchor);
			append(pre, code_1);
			addCode_action = ctx.addCode.call(null, code_1) || ({});
		},
		p(changed, ctx) {
			if (changed.builderMode) {
				toggle_class(pre, "builderMode", ctx.builderMode);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(pre);
			if (addCode_action && is_function(addCode_action.destroy)) addCode_action.destroy();
		}
	};
}

function instance$5($$self, $$props, $$invalidate) {
	let { code = "" } = $$props;
	let { builderMode = false } = $$props;

	const addCode = node => {
		node.textContent = code;
	};

	$$self.$set = $$props => {
		if ("code" in $$props) $$invalidate("code", code = $$props.code);
		if ("builderMode" in $$props) $$invalidate("builderMode", builderMode = $$props.builderMode);
	};

	return { code, builderMode, addCode };
}

class Code extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-e9n8z1-style")) add_css$5();
		init(this, options, instance$5, create_fragment$5, safe_not_equal, { code: 0, builderMode: 0 });
	}
}

/* src/docs/ui/error.svelte generated by Svelte v3.15.0 */

function add_css$6() {
	var style = element("style");
	style.id = "svelte-1deodsm-style";
	style.textContent = "input[type=\"checkbox\"]~.error.svelte-1deodsm{margin-top:0}.error.svelte-1deodsm{background:#ec512a;border-radius:3px;color:#fff;cursor:pointer;margin-top:10px;margin-bottom:10px;overflow:hidden;padding:5px 50px 5px 5px;position:relative;transition:.5s color .3s ease-in-out}.error.svelte-1deodsm:hover{color:#f37f64}span.svelte-1deodsm{display:inline-block;position:relative;vertical-align:top}span.svelte-1deodsm::after{box-sizing:border-box;color:#fff;content:'remove';font-weight:bold;height:100%;font-size:1em;left:100%;opacity:0;padding:0 10px;position:absolute;text-align:center;transform:translateX(200%);transition-delay:.3s;transition-duration:.3s;transition-timing-function:ease-in-out;transition-property:opacity, transform;text-transform:uppercase;top:0}.error.svelte-1deodsm:hover span.svelte-1deodsm::after{opacity:1;transform:translateX(0)}.error.svelte-1deodsm:hover,.error.svelte-1deodsm:hover span.svelte-1deodsm::after{transition-delay:.3s}";
	append(document.head, style);
}

// (16:0) {#if $errors.includes(errorCode)}
function create_if_block$2(ctx) {
	let div;
	let span;
	let div_transition;
	let current;
	let dispose;

	function select_block_type(changed, ctx) {
		if (ctx.errorCode === "required" && !ctx.errorText && !ctx.fromLoop) return create_if_block_1$2;
		if (ctx.errorText) return create_if_block_2$2;
		return create_else_block$2;
	}

	let current_block_type = select_block_type(null, ctx);
	let if_block = current_block_type(ctx);

	return {
		c() {
			div = element("div");
			span = element("span");
			if_block.c();
			attr(span, "class", "svelte-1deodsm");
			attr(div, "class", "error svelte-1deodsm");
			dispose = listen(div, "click", ctx.removeError);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, span);
			if_block.m(span, null);
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
					if_block.m(span, null);
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
			dispose();
		}
	};
}

// (23:6) {:else}
function create_else_block$2(ctx) {
	let t0;
	let t1;

	return {
		c() {
			t0 = text(ctx.errorCode);
			t1 = text(" rule validation error");
		},
		m(target, anchor) {
			insert(target, t0, anchor);
			insert(target, t1, anchor);
		},
		p(changed, ctx) {
			if (changed.errorCode) set_data(t0, ctx.errorCode);
		},
		d(detaching) {
			if (detaching) detach(t0);
			if (detaching) detach(t1);
		}
	};
}

// (21:26) 
function create_if_block_2$2(ctx) {
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

// (19:6) {#if errorCode === 'required' && !errorText && !fromLoop}
function create_if_block_1$2(ctx) {
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

function create_fragment$6(ctx) {
	let show_if = ctx.$errors.includes(ctx.errorCode);
	let if_block_anchor;
	let if_block = show_if && create_if_block$2(ctx);

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
					if_block = create_if_block$2(ctx);
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

function instance$6($$self, $$props, $$invalidate) {
	let $errors,
		$$unsubscribe_errors = noop,
		$$subscribe_errors = () => ($$unsubscribe_errors(), $$unsubscribe_errors = subscribe(errors, $$value => $$invalidate("$errors", $errors = $$value)), errors);

	$$self.$$.on_destroy.push(() => $$unsubscribe_errors());
	let { errors } = $$props;
	$$subscribe_errors();
	let { errorCode } = $$props;
	let { errorText = "" } = $$props;
	let { fromLoop = false } = $$props;

	const removeError = () => {
		errors.update(v => {
			return v.filter(e => e !== errorCode);
		});
	};

	$$self.$set = $$props => {
		if ("errors" in $$props) $$subscribe_errors($$invalidate("errors", errors = $$props.errors));
		if ("errorCode" in $$props) $$invalidate("errorCode", errorCode = $$props.errorCode);
		if ("errorText" in $$props) $$invalidate("errorText", errorText = $$props.errorText);
		if ("fromLoop" in $$props) $$invalidate("fromLoop", fromLoop = $$props.fromLoop);
	};

	return {
		errors,
		errorCode,
		errorText,
		fromLoop,
		removeError,
		$errors
	};
}

class Error$1 extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1deodsm-style")) add_css$6();

		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
			errors: 0,
			errorCode: 0,
			errorText: 0,
			fromLoop: 0
		});
	}
}

const getEntryHTML = (id, { type }) => {
    const typeClass = type[0].toUpperCase() + type.slice(1);
    switch (true) {
        case type === 'boolean':
            return `<label><input bind:checked={$value${typeClass}${id}} use:input${typeClass}${id} class="input-choice" type="checkbox" /> Are you agree?</label>`;
        case type === 'array':
            return `<label><input bind:group={$value${typeClass}${id}} use:input${typeClass}${id} class="input-choice" type="checkbox" value="Lorem" /> Lorem</label>
<label><input bind:group={$value${typeClass}${id}} use:input${typeClass}${id} class="input-choice" type="checkbox" value="ipsum" /> Ipsum</label>
<label><input bind:group={$value${typeClass}${id}} use:input${typeClass}${id} class="input-choice" type="checkbox" value="dolor" /> Dolor?</label>`;
        case type === 'email':
            return `<input type="email" bind:value={$value${typeClass}${id}} use:input${typeClass}${id} class="input-text" />`;
        case type === 'number':
            return `<input type="number" bind:value={$value${typeClass}${id}} use:input${typeClass}${id} class="input-text" />`;
        default:
            return `<input type="text" bind:value={$value${typeClass}${id}} use:input${typeClass}${id} class="input-text" />`;
    }
};
const getEntryErrors = (id, { type }) => {
    const typeClass = type[0].toUpperCase() + type.slice(1);
    return `{#each $errors${typeClass}${id} as errorCode}
  <p>{errorCode} rule validation error</p>
{/each}`;
};
const getEntryJS = (id, params) => {
    const { type, ...rest } = params;
    const typeClass = type[0].toUpperCase() + type.slice(1);
    let paramsObject = `type: ${type}`;
    Object.keys(rest).forEach(ruleKey => {
        const paramValue = ruleKey === 'match' ? `/${rest[ruleKey]}/` : (rest[ruleKey] === '' ? "''" : JSON.stringify(rest[ruleKey]));
        paramsObject += `\n  ${ruleKey}: ${paramValue}`;
    });
    return `<script>
const [ errors${typeClass}${id}, value${typeClass}${id}, input${typeClass}${id} ] = createEntry({
  ${paramsObject}
);
</scr` + `ipt>`;
};
const getFormCode = ({ validateOnEvents, clearErrorsOnEvents, listenInputEvents, presence, trim, includeAllEntries }) => {
    const options = [];
    if (listenInputEvents !== 0 && (!validateOnEvents.change || validateOnEvents.input || validateOnEvents.blur)) {
        let code = '';
        code += `validateOnEvents: { `;
        if (validateOnEvents.change)
            code += `change: true, `;
        if (validateOnEvents.input)
            code += `input: true, `;
        if (validateOnEvents.blur)
            code += `blur: true, `;
        code += `}`;
        options.push(code);
    }
    if (!clearErrorsOnEvents.reset || (listenInputEvents !== 0 && clearErrorsOnEvents.focus)) {
        let code = '';
        code += `clearErrorsOnEvents: { `;
        if (clearErrorsOnEvents.reset)
            code += `reset: true, `;
        if (clearErrorsOnEvents.focus && listenInputEvents !== 0)
            code += `focus: true, `;
        code += `}`;
        options.push(code);
    }
    if (listenInputEvents !== 2) {
        options.push(`listenInputEvents: ` + listenInputEvents);
    }
    if (presence === 'required') {
        options.push(`presence: 'required'`);
    }
    else if (presence === 'optional') {
        options.push(`presence: 'optional'`);
    }
    if (trim) {
        options.push(`trim: true`);
    }
    if (includeAllEntries) {
        options.push(`includeAllEntries: true`);
    }
    const js = [
        `<script>`,
        `  import createSvelidation from 'svelidation';`,
        `  const { createEntry, createForm } = createSvelidation(${options.length ? `{\n    ${options.join(',\n    ')}\n  }` : ''});`,
        `</script>`
    ].join('\n');
    const html = [
        `<form use:createForm novalidate on:submit|preventDefault>`,
        `  <!-- inputs -->`,
        `</form>`
    ].join('\n');
    return js + '\n\n' + html;
};

/* src/docs/builder/components/field.svelte generated by Svelte v3.15.0 */

function add_css$7() {
	var style = element("style");
	style.id = "svelte-b7x6vc-style";
	style.textContent = ".field.svelte-b7x6vc{display:flex;position:relative}.html.svelte-b7x6vc{border-right:1px dashed #bbb;padding:10px;width:50%}.code.svelte-b7x6vc{width:50%}label.svelte-b7x6vc{cursor:pointer;display:block}label+label.svelte-b7x6vc{margin-top:5px}.buttons.svelte-b7x6vc{margin:-10px 0 10px -10px}";
	append(document.head, style);
}

function get_each_context(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.errorCode = list[i];
	return child_ctx;
}

// (36:6) {:else}
function create_else_block$3(ctx) {
	let input_1;
	let input_action;
	let dispose;

	return {
		c() {
			input_1 = element("input");
			attr(input_1, "type", "text");
			attr(input_1, "class", "input-text");
			dispose = listen(input_1, "input", ctx.input_1_input_handler_2);
		},
		m(target, anchor) {
			insert(target, input_1, anchor);
			set_input_value(input_1, ctx.$value);
			input_action = ctx.input.call(null, input_1) || ({});
		},
		p(changed, ctx) {
			if (changed.$value && input_1.value !== ctx.$value) {
				set_input_value(input_1, ctx.$value);
			}
		},
		d(detaching) {
			if (detaching) detach(input_1);
			if (input_action && is_function(input_action.destroy)) input_action.destroy();
			dispose();
		}
	};
}

// (34:33) 
function create_if_block_3$1(ctx) {
	let input_1;
	let input_action;
	let dispose;

	return {
		c() {
			input_1 = element("input");
			attr(input_1, "type", "email");
			attr(input_1, "class", "input-text");
			dispose = listen(input_1, "input", ctx.input_1_input_handler_1);
		},
		m(target, anchor) {
			insert(target, input_1, anchor);
			set_input_value(input_1, ctx.$value);
			input_action = ctx.input.call(null, input_1) || ({});
		},
		p(changed, ctx) {
			if (changed.$value && input_1.value !== ctx.$value) {
				set_input_value(input_1, ctx.$value);
			}
		},
		d(detaching) {
			if (detaching) detach(input_1);
			if (input_action && is_function(input_action.destroy)) input_action.destroy();
			dispose();
		}
	};
}

// (32:6) {#if type === 'number'}
function create_if_block_2$3(ctx) {
	let input_1;
	let input_1_updating = false;
	let input_action;
	let dispose;

	function input_1_input_handler() {
		input_1_updating = true;
		ctx.input_1_input_handler.call(input_1);
	}

	return {
		c() {
			input_1 = element("input");
			attr(input_1, "type", "number");
			attr(input_1, "class", "input-text");
			dispose = listen(input_1, "input", input_1_input_handler);
		},
		m(target, anchor) {
			insert(target, input_1, anchor);
			set_input_value(input_1, ctx.$value);
			input_action = ctx.input.call(null, input_1) || ({});
		},
		p(changed, ctx) {
			if (!input_1_updating && changed.$value) {
				set_input_value(input_1, ctx.$value);
			}

			input_1_updating = false;
		},
		d(detaching) {
			if (detaching) detach(input_1);
			if (input_action && is_function(input_action.destroy)) input_action.destroy();
			dispose();
		}
	};
}

// (27:31) 
function create_if_block_1$3(ctx) {
	let label0;
	let input0;
	let input_action;
	let t0;
	let t1;
	let label1;
	let input1;
	let input_action_1;
	let t2;
	let t3;
	let label2;
	let input2;
	let input_action_2;
	let t4;
	let dispose;

	return {
		c() {
			label0 = element("label");
			input0 = element("input");
			t0 = text(" Lorem");
			t1 = space();
			label1 = element("label");
			input1 = element("input");
			t2 = text(" Ipsum");
			t3 = space();
			label2 = element("label");
			input2 = element("input");
			t4 = text(" Dolor?");
			attr(input0, "class", "input-choice");
			attr(input0, "type", "checkbox");
			input0.__value = "Lorem";
			input0.value = input0.__value;
			ctx.$$binding_groups[0].push(input0);
			attr(label0, "class", "svelte-b7x6vc");
			attr(input1, "class", "input-choice");
			attr(input1, "type", "checkbox");
			input1.__value = "ipsum";
			input1.value = input1.__value;
			ctx.$$binding_groups[0].push(input1);
			attr(label1, "class", "svelte-b7x6vc");
			attr(input2, "class", "input-choice");
			attr(input2, "type", "checkbox");
			input2.__value = "dolor";
			input2.value = input2.__value;
			ctx.$$binding_groups[0].push(input2);
			attr(label2, "class", "svelte-b7x6vc");

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

// (25:4) {#if type === 'boolean'}
function create_if_block$3(ctx) {
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
			attr(label, "class", "svelte-b7x6vc");
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

// (41:4) {#each $errors as errorCode}
function create_each_block(ctx) {
	let current;

	const error = new Error$1({
			props: {
				errors: ctx.errors,
				errorCode: ctx.errorCode,
				fromLoop: true
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
		p(changed, ctx) {
			const error_changes = {};
			if (changed.$errors) error_changes.errorCode = ctx.errorCode;
			error.$set(error_changes);
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
			destroy_component(error, detaching);
		}
	};
}

function create_fragment$7(ctx) {
	let div3;
	let div1;
	let div0;
	let t0;
	let button;
	let t2;
	let t3;
	let t4;
	let div2;
	let current;
	let dispose;
	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);

	function select_block_type(changed, ctx) {
		if (ctx.type === "boolean") return create_if_block$3;
		if (ctx.type === "array") return create_if_block_1$3;
		if (ctx.type === "number") return create_if_block_2$3;
		if (ctx.type === "email") return create_if_block_3$1;
		return create_else_block$3;
	}

	let current_block_type = select_block_type(null, ctx);
	let if_block = current_block_type(ctx);
	let each_value = ctx.$errors;
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	const code = new Code({
			props: {
				code: getEntryJS(ctx.id, ctx.params) + "\n\n" + getEntryHTML(ctx.id, ctx.params) + "\n" + getEntryErrors(ctx.id, ctx.params),
				builderMode: true
			}
		});

	return {
		c() {
			div3 = element("div");
			div1 = element("div");
			div0 = element("div");
			if (default_slot) default_slot.c();
			t0 = space();
			button = element("button");
			button.textContent = "validate field";
			t2 = space();
			if_block.c();
			t3 = space();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t4 = space();
			div2 = element("div");
			create_component(code.$$.fragment);
			attr(button, "type", "button");
			attr(div0, "class", "buttons svelte-b7x6vc");
			attr(div1, "class", "html svelte-b7x6vc");
			attr(div2, "class", "code svelte-b7x6vc");
			attr(div3, "class", "field svelte-b7x6vc");
			dispose = listen(button, "click", ctx.validateRow);
		},
		m(target, anchor) {
			insert(target, div3, anchor);
			append(div3, div1);
			append(div1, div0);

			if (default_slot) {
				default_slot.m(div0, null);
			}

			append(div0, t0);
			append(div0, button);
			append(div1, t2);
			if_block.m(div1, null);
			append(div1, t3);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div1, null);
			}

			append(div3, t4);
			append(div3, div2);
			mount_component(code, div2, null);
			current = true;
		},
		p(changed, ctx) {
			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
			}

			if_block.p(changed, ctx);

			if (changed.errors || changed.$errors) {
				each_value = ctx.$errors;
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(div1, null);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}

			const code_changes = {};
			if (changed.id || changed.params) code_changes.code = getEntryJS(ctx.id, ctx.params) + "\n\n" + getEntryHTML(ctx.id, ctx.params) + "\n" + getEntryErrors(ctx.id, ctx.params);
			code.$set(code_changes);
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			transition_in(code.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			transition_out(code.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div3);
			if (default_slot) default_slot.d(detaching);
			if_block.d();
			destroy_each(each_blocks, detaching);
			destroy_component(code);
			dispose();
		}
	};
}

function instance$7($$self, $$props, $$invalidate) {
	let $value;
	let $errors;
	let { createEntry } = $$props;
	let { validateValueStore } = $$props;
	let { params } = $$props;
	let { id } = $$props;
	const { type } = params;
	const [errors, value, input] = createEntry(params);
	component_subscribe($$self, errors, value => $$invalidate("$errors", $errors = value));
	component_subscribe($$self, value, value => $$invalidate("$value", $value = value));

	const validateRow = () => {
		validateValueStore(value);
	};

	let { $$slots = {}, $$scope } = $$props;
	const $$binding_groups = [[]];

	function input_1_change_handler() {
		$value = this.checked;
		value.set($value);
	}

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

	function input_1_input_handler() {
		$value = to_number(this.value);
		value.set($value);
	}

	function input_1_input_handler_1() {
		$value = this.value;
		value.set($value);
	}

	function input_1_input_handler_2() {
		$value = this.value;
		value.set($value);
	}

	$$self.$set = $$props => {
		if ("createEntry" in $$props) $$invalidate("createEntry", createEntry = $$props.createEntry);
		if ("validateValueStore" in $$props) $$invalidate("validateValueStore", validateValueStore = $$props.validateValueStore);
		if ("params" in $$props) $$invalidate("params", params = $$props.params);
		if ("id" in $$props) $$invalidate("id", id = $$props.id);
		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
	};

	return {
		createEntry,
		validateValueStore,
		params,
		id,
		type,
		errors,
		value,
		input,
		validateRow,
		$value,
		$errors,
		input_1_change_handler,
		input0_change_handler,
		input1_change_handler,
		input2_change_handler,
		input_1_input_handler,
		input_1_input_handler_1,
		input_1_input_handler_2,
		$$slots,
		$$scope,
		$$binding_groups
	};
}

class Field extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-b7x6vc-style")) add_css$7();

		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
			createEntry: 0,
			validateValueStore: 0,
			params: 0,
			id: 0
		});
	}
}

/* src/docs/ui/reset.svelte generated by Svelte v3.15.0 */

function create_else_block$4(ctx) {
	let current;
	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);

	return {
		c() {
			if (default_slot) default_slot.c();
		},
		m(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
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
			if (default_slot) default_slot.d(detaching);
		}
	};
}

// (5:0) {#if n%2}
function create_if_block$4(ctx) {
	let current;
	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);

	return {
		c() {
			if (default_slot) default_slot.c();
		},
		m(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
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
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function create_fragment$8(ctx) {
	let current_block_type_index;
	let if_block;
	let if_block_anchor;
	let current;
	const if_block_creators = [create_if_block$4, create_else_block$4];
	const if_blocks = [];

	function select_block_type(changed, ctx) {
		if (ctx.n % 2) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(null, ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if_blocks[current_block_type_index].m(target, anchor);
			insert(target, if_block_anchor, anchor);
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
			if_blocks[current_block_type_index].d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

function instance$8($$self, $$props, $$invalidate) {
	let { n } = $$props;
	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$props => {
		if ("n" in $$props) $$invalidate("n", n = $$props.n);
		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
	};

	return { n, $$slots, $$scope };
}

class Reset extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$8, create_fragment$8, safe_not_equal, { n: 0 });
	}
}

/* src/docs/builder/components/form-options-row.svelte generated by Svelte v3.15.0 */

function add_css$8() {
	var style = element("style");
	style.id = "svelte-17anesa-style";
	style.textContent = ".option.svelte-17anesa{background:#dcefff;cursor:pointer;display:flex;margin-bottom:10px;min-width:250px;padding:10px}.disabled.svelte-17anesa{cursor:initial;filter:grayscale(100%);opacity:.5;pointer-events:none}.option.svelte-17anesa label.svelte-17anesa{cursor:pointer;flex:1;margin-left:10px}.option.svelte-17anesa input.svelte-17anesa{border:1px solid #bbb;border-radius:3px;font-size:14px;height:20px;line-height:18px;margin-left:10px;outline:0;padding:0 3px;text-align:right;width:100px}";
	append(document.head, style);
}

// (16:2) {#if typeof model === 'boolean'}
function create_if_block_1$4(ctx) {
	let updating_checked;
	let current;

	function toggle_checked_binding(value) {
		ctx.toggle_checked_binding.call(null, value);
	}

	let toggle_props = { id: ctx.id };

	if (ctx.model !== void 0) {
		toggle_props.checked = ctx.model;
	}

	const toggle = new Toggle({ props: toggle_props });
	binding_callbacks.push(() => bind(toggle, "checked", toggle_checked_binding));

	return {
		c() {
			create_component(toggle.$$.fragment);
		},
		m(target, anchor) {
			mount_component(toggle, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const toggle_changes = {};
			if (changed.id) toggle_changes.id = ctx.id;

			if (!updating_checked && changed.model) {
				updating_checked = true;
				toggle_changes.checked = ctx.model;
				add_flush_callback(() => updating_checked = false);
			}

			toggle.$set(toggle_changes);
		},
		i(local) {
			if (current) return;
			transition_in(toggle.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(toggle.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(toggle, detaching);
		}
	};
}

// (22:2) {#if typeof model !== 'boolean'}
function create_if_block$5(ctx) {
	let input;
	let input_updating = false;
	let dispose;

	function input_input_handler() {
		input_updating = true;
		ctx.input_input_handler.call(input);
	}

	return {
		c() {
			input = element("input");
			attr(input, "type", "number");
			attr(input, "min", "0");
			attr(input, "max", "2");
			attr(input, "class", "svelte-17anesa");
			dispose = listen(input, "input", input_input_handler);
		},
		m(target, anchor) {
			insert(target, input, anchor);
			set_input_value(input, ctx.model);
		},
		p(changed, ctx) {
			if (!input_updating && changed.model) {
				set_input_value(input, ctx.model);
			}

			input_updating = false;
		},
		d(detaching) {
			if (detaching) detach(input);
			dispose();
		}
	};
}

function create_fragment$9(ctx) {
	let div;
	let t0;
	let label;
	let t1;
	let t2;
	let current;
	let if_block0 = typeof ctx.model === "boolean" && create_if_block_1$4(ctx);
	let if_block1 = typeof ctx.model !== "boolean" && create_if_block$5(ctx);

	return {
		c() {
			div = element("div");
			if (if_block0) if_block0.c();
			t0 = space();
			label = element("label");
			t1 = text(ctx.text);
			t2 = space();
			if (if_block1) if_block1.c();
			attr(label, "for", ctx.id);
			attr(label, "class", "svelte-17anesa");
			attr(div, "class", "option svelte-17anesa");
			toggle_class(div, "checked", ctx.model);
			toggle_class(div, "disabled", ctx.disabled);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			if (if_block0) if_block0.m(div, null);
			append(div, t0);
			append(div, label);
			append(label, t1);
			append(div, t2);
			if (if_block1) if_block1.m(div, null);
			current = true;
		},
		p(changed, ctx) {
			if (typeof ctx.model === "boolean") {
				if (if_block0) {
					if_block0.p(changed, ctx);
					transition_in(if_block0, 1);
				} else {
					if_block0 = create_if_block_1$4(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(div, t0);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			if (!current || changed.text) set_data(t1, ctx.text);

			if (!current || changed.id) {
				attr(label, "for", ctx.id);
			}

			if (typeof ctx.model !== "boolean") {
				if (if_block1) {
					if_block1.p(changed, ctx);
				} else {
					if_block1 = create_if_block$5(ctx);
					if_block1.c();
					if_block1.m(div, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (changed.model) {
				toggle_class(div, "checked", ctx.model);
			}

			if (changed.disabled) {
				toggle_class(div, "disabled", ctx.disabled);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block0);
			current = true;
		},
		o(local) {
			transition_out(if_block0);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
		}
	};
}

function instance$9($$self, $$props, $$invalidate) {
	let { model } = $$props;
	let { disabled = false } = $$props;
	let { text } = $$props;
	let { id } = $$props;

	function toggle_checked_binding(value) {
		model = value;
		$$invalidate("model", model);
	}

	function input_input_handler() {
		model = to_number(this.value);
		$$invalidate("model", model);
	}

	$$self.$set = $$props => {
		if ("model" in $$props) $$invalidate("model", model = $$props.model);
		if ("disabled" in $$props) $$invalidate("disabled", disabled = $$props.disabled);
		if ("text" in $$props) $$invalidate("text", text = $$props.text);
		if ("id" in $$props) $$invalidate("id", id = $$props.id);
	};

	return {
		model,
		disabled,
		text,
		id,
		toggle_checked_binding,
		input_input_handler
	};
}

class Form_options_row extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-17anesa-style")) add_css$8();
		init(this, options, instance$9, create_fragment$9, safe_not_equal, { model: 0, disabled: 0, text: 0, id: 0 });
	}
}

/* src/docs/builder/components/form-options.svelte generated by Svelte v3.15.0 */

function create_default_slot_1$1(ctx) {
	let t;

	return {
		c() {
			t = text("Save");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (83:0) <Button on:click={onCancel}>
function create_default_slot$1(ctx) {
	let t;

	return {
		c() {
			t = text("Cancel");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

function create_fragment$a(ctx) {
	let updating_model;
	let t0;
	let updating_model_1;
	let t1;
	let updating_model_2;
	let t2;
	let updating_model_3;
	let t3;
	let updating_model_4;
	let t4;
	let updating_model_5;
	let t5;
	let updating_model_6;
	let t6;
	let updating_model_7;
	let t7;
	let updating_model_8;
	let t8;
	let updating_model_9;
	let t9;
	let t10;
	let current;

	function option0_model_binding(value) {
		ctx.option0_model_binding.call(null, value);
	}

	let option0_props = {
		id: "validateOnChange",
		disabled: ctx.formOptions.listenInputEvents === 0,
		text: "Validate on input value change"
	};

	if (ctx.formOptions.validateOnEvents.change !== void 0) {
		option0_props.model = ctx.formOptions.validateOnEvents.change;
	}

	const option0 = new Form_options_row({ props: option0_props });
	binding_callbacks.push(() => bind(option0, "model", option0_model_binding));

	function option1_model_binding(value_1) {
		ctx.option1_model_binding.call(null, value_1);
	}

	let option1_props = {
		id: "validateOnInput",
		disabled: ctx.formOptions.listenInputEvents === 0,
		text: "Validate on input event"
	};

	if (ctx.formOptions.validateOnEvents.input !== void 0) {
		option1_props.model = ctx.formOptions.validateOnEvents.input;
	}

	const option1 = new Form_options_row({ props: option1_props });
	binding_callbacks.push(() => bind(option1, "model", option1_model_binding));

	function option2_model_binding(value_2) {
		ctx.option2_model_binding.call(null, value_2);
	}

	let option2_props = {
		id: "validateOnBlur",
		disabled: ctx.formOptions.listenInputEvents === 0,
		text: "Validate on blur event"
	};

	if (ctx.formOptions.validateOnEvents.blur !== void 0) {
		option2_props.model = ctx.formOptions.validateOnEvents.blur;
	}

	const option2 = new Form_options_row({ props: option2_props });
	binding_callbacks.push(() => bind(option2, "model", option2_model_binding));

	function option3_model_binding(value_3) {
		ctx.option3_model_binding.call(null, value_3);
	}

	let option3_props = {
		id: "clearErrorsOnReset",
		text: "Empty errors on reset form event"
	};

	if (ctx.formOptions.clearErrorsOnEvents.reset !== void 0) {
		option3_props.model = ctx.formOptions.clearErrorsOnEvents.reset;
	}

	const option3 = new Form_options_row({ props: option3_props });
	binding_callbacks.push(() => bind(option3, "model", option3_model_binding));

	function option4_model_binding(value_4) {
		ctx.option4_model_binding.call(null, value_4);
	}

	let option4_props = {
		id: "clearErrorsOnFocus",
		disabled: ctx.formOptions.listenInputEvents === 0,
		text: "Empty entry errors on focus input event"
	};

	if (ctx.formOptions.clearErrorsOnEvents.focus !== void 0) {
		option4_props.model = ctx.formOptions.clearErrorsOnEvents.focus;
	}

	const option4 = new Form_options_row({ props: option4_props });
	binding_callbacks.push(() => bind(option4, "model", option4_model_binding));

	function option5_model_binding(value_5) {
		ctx.option5_model_binding.call(null, value_5);
	}

	let option5_props = {
		id: "listenInputEvents",
		text: "Listen input events (0: never, 1: always: 2: after validation)"
	};

	if (ctx.formOptions.listenInputEvents !== void 0) {
		option5_props.model = ctx.formOptions.listenInputEvents;
	}

	const option5 = new Form_options_row({ props: option5_props });
	binding_callbacks.push(() => bind(option5, "model", option5_model_binding));

	function option6_model_binding(value_6) {
		ctx.option6_model_binding.call(null, value_6);
	}

	let option6_props = {
		id: "presenceRequired",
		disabled: ctx.presence.optional,
		text: "All fields are required by default"
	};

	if (ctx.presence.required !== void 0) {
		option6_props.model = ctx.presence.required;
	}

	const option6 = new Form_options_row({ props: option6_props });
	binding_callbacks.push(() => bind(option6, "model", option6_model_binding));

	function option7_model_binding(value_7) {
		ctx.option7_model_binding.call(null, value_7);
	}

	let option7_props = {
		id: "presenceOptional",
		disabled: ctx.presence.required,
		text: "All fields are optional by default"
	};

	if (ctx.presence.optional !== void 0) {
		option7_props.model = ctx.presence.optional;
	}

	const option7 = new Form_options_row({ props: option7_props });
	binding_callbacks.push(() => bind(option7, "model", option7_model_binding));

	function option8_model_binding(value_8) {
		ctx.option8_model_binding.call(null, value_8);
	}

	let option8_props = {
		id: "trim",
		text: "Trim input value for validation purpose"
	};

	if (ctx.formOptions.trim !== void 0) {
		option8_props.model = ctx.formOptions.trim;
	}

	const option8 = new Form_options_row({ props: option8_props });
	binding_callbacks.push(() => bind(option8, "model", option8_model_binding));

	function option9_model_binding(value_9) {
		ctx.option9_model_binding.call(null, value_9);
	}

	let option9_props = {
		id: "includeAllEntries",
		text: "Validate and reset all entries"
	};

	if (ctx.formOptions.includeAllEntries !== void 0) {
		option9_props.model = ctx.formOptions.includeAllEntries;
	}

	const option9 = new Form_options_row({ props: option9_props });
	binding_callbacks.push(() => bind(option9, "model", option9_model_binding));

	const button0 = new Button({
			props: {
				$$slots: { default: [create_default_slot_1$1] },
				$$scope: { ctx }
			}
		});

	button0.$on("click", ctx.onSave);

	const button1 = new Button({
			props: {
				$$slots: { default: [create_default_slot$1] },
				$$scope: { ctx }
			}
		});

	button1.$on("click", ctx.onCancel);

	return {
		c() {
			create_component(option0.$$.fragment);
			t0 = space();
			create_component(option1.$$.fragment);
			t1 = space();
			create_component(option2.$$.fragment);
			t2 = space();
			create_component(option3.$$.fragment);
			t3 = space();
			create_component(option4.$$.fragment);
			t4 = space();
			create_component(option5.$$.fragment);
			t5 = space();
			create_component(option6.$$.fragment);
			t6 = space();
			create_component(option7.$$.fragment);
			t7 = space();
			create_component(option8.$$.fragment);
			t8 = space();
			create_component(option9.$$.fragment);
			t9 = space();
			create_component(button0.$$.fragment);
			t10 = space();
			create_component(button1.$$.fragment);
		},
		m(target, anchor) {
			mount_component(option0, target, anchor);
			insert(target, t0, anchor);
			mount_component(option1, target, anchor);
			insert(target, t1, anchor);
			mount_component(option2, target, anchor);
			insert(target, t2, anchor);
			mount_component(option3, target, anchor);
			insert(target, t3, anchor);
			mount_component(option4, target, anchor);
			insert(target, t4, anchor);
			mount_component(option5, target, anchor);
			insert(target, t5, anchor);
			mount_component(option6, target, anchor);
			insert(target, t6, anchor);
			mount_component(option7, target, anchor);
			insert(target, t7, anchor);
			mount_component(option8, target, anchor);
			insert(target, t8, anchor);
			mount_component(option9, target, anchor);
			insert(target, t9, anchor);
			mount_component(button0, target, anchor);
			insert(target, t10, anchor);
			mount_component(button1, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const option0_changes = {};
			if (changed.formOptions) option0_changes.disabled = ctx.formOptions.listenInputEvents === 0;

			if (!updating_model && changed.formOptions) {
				updating_model = true;
				option0_changes.model = ctx.formOptions.validateOnEvents.change;
				add_flush_callback(() => updating_model = false);
			}

			option0.$set(option0_changes);
			const option1_changes = {};
			if (changed.formOptions) option1_changes.disabled = ctx.formOptions.listenInputEvents === 0;

			if (!updating_model_1 && changed.formOptions) {
				updating_model_1 = true;
				option1_changes.model = ctx.formOptions.validateOnEvents.input;
				add_flush_callback(() => updating_model_1 = false);
			}

			option1.$set(option1_changes);
			const option2_changes = {};
			if (changed.formOptions) option2_changes.disabled = ctx.formOptions.listenInputEvents === 0;

			if (!updating_model_2 && changed.formOptions) {
				updating_model_2 = true;
				option2_changes.model = ctx.formOptions.validateOnEvents.blur;
				add_flush_callback(() => updating_model_2 = false);
			}

			option2.$set(option2_changes);
			const option3_changes = {};

			if (!updating_model_3 && changed.formOptions) {
				updating_model_3 = true;
				option3_changes.model = ctx.formOptions.clearErrorsOnEvents.reset;
				add_flush_callback(() => updating_model_3 = false);
			}

			option3.$set(option3_changes);
			const option4_changes = {};
			if (changed.formOptions) option4_changes.disabled = ctx.formOptions.listenInputEvents === 0;

			if (!updating_model_4 && changed.formOptions) {
				updating_model_4 = true;
				option4_changes.model = ctx.formOptions.clearErrorsOnEvents.focus;
				add_flush_callback(() => updating_model_4 = false);
			}

			option4.$set(option4_changes);
			const option5_changes = {};

			if (!updating_model_5 && changed.formOptions) {
				updating_model_5 = true;
				option5_changes.model = ctx.formOptions.listenInputEvents;
				add_flush_callback(() => updating_model_5 = false);
			}

			option5.$set(option5_changes);
			const option6_changes = {};
			if (changed.presence) option6_changes.disabled = ctx.presence.optional;

			if (!updating_model_6 && changed.presence) {
				updating_model_6 = true;
				option6_changes.model = ctx.presence.required;
				add_flush_callback(() => updating_model_6 = false);
			}

			option6.$set(option6_changes);
			const option7_changes = {};
			if (changed.presence) option7_changes.disabled = ctx.presence.required;

			if (!updating_model_7 && changed.presence) {
				updating_model_7 = true;
				option7_changes.model = ctx.presence.optional;
				add_flush_callback(() => updating_model_7 = false);
			}

			option7.$set(option7_changes);
			const option8_changes = {};

			if (!updating_model_8 && changed.formOptions) {
				updating_model_8 = true;
				option8_changes.model = ctx.formOptions.trim;
				add_flush_callback(() => updating_model_8 = false);
			}

			option8.$set(option8_changes);
			const option9_changes = {};

			if (!updating_model_9 && changed.formOptions) {
				updating_model_9 = true;
				option9_changes.model = ctx.formOptions.includeAllEntries;
				add_flush_callback(() => updating_model_9 = false);
			}

			option9.$set(option9_changes);
			const button0_changes = {};

			if (changed.$$scope) {
				button0_changes.$$scope = { changed, ctx };
			}

			button0.$set(button0_changes);
			const button1_changes = {};

			if (changed.$$scope) {
				button1_changes.$$scope = { changed, ctx };
			}

			button1.$set(button1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(option0.$$.fragment, local);
			transition_in(option1.$$.fragment, local);
			transition_in(option2.$$.fragment, local);
			transition_in(option3.$$.fragment, local);
			transition_in(option4.$$.fragment, local);
			transition_in(option5.$$.fragment, local);
			transition_in(option6.$$.fragment, local);
			transition_in(option7.$$.fragment, local);
			transition_in(option8.$$.fragment, local);
			transition_in(option9.$$.fragment, local);
			transition_in(button0.$$.fragment, local);
			transition_in(button1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(option0.$$.fragment, local);
			transition_out(option1.$$.fragment, local);
			transition_out(option2.$$.fragment, local);
			transition_out(option3.$$.fragment, local);
			transition_out(option4.$$.fragment, local);
			transition_out(option5.$$.fragment, local);
			transition_out(option6.$$.fragment, local);
			transition_out(option7.$$.fragment, local);
			transition_out(option8.$$.fragment, local);
			transition_out(option9.$$.fragment, local);
			transition_out(button0.$$.fragment, local);
			transition_out(button1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(option0, detaching);
			if (detaching) detach(t0);
			destroy_component(option1, detaching);
			if (detaching) detach(t1);
			destroy_component(option2, detaching);
			if (detaching) detach(t2);
			destroy_component(option3, detaching);
			if (detaching) detach(t3);
			destroy_component(option4, detaching);
			if (detaching) detach(t4);
			destroy_component(option5, detaching);
			if (detaching) detach(t5);
			destroy_component(option6, detaching);
			if (detaching) detach(t6);
			destroy_component(option7, detaching);
			if (detaching) detach(t7);
			destroy_component(option8, detaching);
			if (detaching) detach(t8);
			destroy_component(option9, detaching);
			if (detaching) detach(t9);
			destroy_component(button0, detaching);
			if (detaching) detach(t10);
			destroy_component(button1, detaching);
		}
	};
}

function instance$a($$self, $$props, $$invalidate) {
	let { formOptions } = $$props;

	let presence = {
		optional: formOptions.presence === "optional",
		required: formOptions.presence === "required"
	};

	const dispatch = createEventDispatcher();

	const onSave = () => {
		const listenInputEvents = parseFloat(formOptions.listenInputEvents);

		dispatch("save", Object.assign(formOptions, {
			listenInputEvents: isNaN(listenInputEvents)
			? 0
			: Math.min(2, Math.max(0, listenInputEvents)),
			presence: presence.optional
			? "optional"
			: presence.required ? "required" : null
		}));
	};

	const onCancel = () => {
		dispatch("cancel");
	};

	function option0_model_binding(value) {
		formOptions.validateOnEvents.change = value;
		$$invalidate("formOptions", formOptions);
	}

	function option1_model_binding(value_1) {
		formOptions.validateOnEvents.input = value_1;
		$$invalidate("formOptions", formOptions);
	}

	function option2_model_binding(value_2) {
		formOptions.validateOnEvents.blur = value_2;
		$$invalidate("formOptions", formOptions);
	}

	function option3_model_binding(value_3) {
		formOptions.clearErrorsOnEvents.reset = value_3;
		$$invalidate("formOptions", formOptions);
	}

	function option4_model_binding(value_4) {
		formOptions.clearErrorsOnEvents.focus = value_4;
		$$invalidate("formOptions", formOptions);
	}

	function option5_model_binding(value_5) {
		formOptions.listenInputEvents = value_5;
		$$invalidate("formOptions", formOptions);
	}

	function option6_model_binding(value_6) {
		presence.required = value_6;
		$$invalidate("presence", presence);
	}

	function option7_model_binding(value_7) {
		presence.optional = value_7;
		$$invalidate("presence", presence);
	}

	function option8_model_binding(value_8) {
		formOptions.trim = value_8;
		$$invalidate("formOptions", formOptions);
	}

	function option9_model_binding(value_9) {
		formOptions.includeAllEntries = value_9;
		$$invalidate("formOptions", formOptions);
	}

	$$self.$set = $$props => {
		if ("formOptions" in $$props) $$invalidate("formOptions", formOptions = $$props.formOptions);
	};

	return {
		formOptions,
		presence,
		onSave,
		onCancel,
		option0_model_binding,
		option1_model_binding,
		option2_model_binding,
		option3_model_binding,
		option4_model_binding,
		option5_model_binding,
		option6_model_binding,
		option7_model_binding,
		option8_model_binding,
		option9_model_binding
	};
}

class Form_options extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$a, create_fragment$a, safe_not_equal, { formOptions: 0 });
	}
}

/* src/docs/builder/builder.svelte generated by Svelte v3.15.0 */

function add_css$9() {
	var style = element("style");
	style.id = "svelte-1p4n34s-style";
	style.textContent = ".row.svelte-1p4n34s{border-bottom:1px solid #bbb;margin:0 -10px}.row.svelte-1p4n34s:first-child{padding:0 10px 10px}.row.svelte-1p4n34s:last-child{border:0;margin:0;padding-top:10px}.remove-row.svelte-1p4n34s button{background:none;border:0;cursor:pointer;color:#ec512a;font-size:12px;line-height:19px;padding:2px 5px;text-transform:uppercase}.remove-row.svelte-1p4n34s button:hover{background:#ec512a;color:#fff}.code.svelte-1p4n34s{margin-bottom:10px}";
	append(document.head, style);
}

function get_each_context$1(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.id = list[i].id;
	child_ctx.params = list[i].params;
	return child_ctx;
}

// (91:6) {:else}
function create_else_block$5(ctx) {
	let div;
	let t;
	let current;

	const code = new Code({
			props: { code: ctx.formCode, builderMode: true }
		});

	const button = new Button({
			props: {
				$$slots: { default: [create_default_slot_5] },
				$$scope: { ctx }
			}
		});

	button.$on("click", ctx.click_handler);

	return {
		c() {
			div = element("div");
			create_component(code.$$.fragment);
			t = space();
			create_component(button.$$.fragment);
			attr(div, "class", "code svelte-1p4n34s");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(code, div, null);
			insert(target, t, anchor);
			mount_component(button, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const code_changes = {};
			if (changed.formCode) code_changes.code = ctx.formCode;
			code.$set(code_changes);
			const button_changes = {};

			if (changed.$$scope) {
				button_changes.$$scope = { changed, ctx };
			}

			button.$set(button_changes);
		},
		i(local) {
			if (current) return;
			transition_in(code.$$.fragment, local);
			transition_in(button.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(code.$$.fragment, local);
			transition_out(button.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_component(code);
			if (detaching) detach(t);
			destroy_component(button, detaching);
		}
	};
}

// (85:6) {#if formOptionsMode}
function create_if_block_1$5(ctx) {
	let current;
	const formoptions = new Form_options({ props: { formOptions: ctx.formOptions } });
	formoptions.$on("save", ctx.onSave);
	formoptions.$on("cancel", ctx.cancel_handler);

	return {
		c() {
			create_component(formoptions.$$.fragment);
		},
		m(target, anchor) {
			mount_component(formoptions, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const formoptions_changes = {};
			if (changed.formOptions) formoptions_changes.formOptions = ctx.formOptions;
			formoptions.$set(formoptions_changes);
		},
		i(local) {
			if (current) return;
			transition_in(formoptions.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(formoptions.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(formoptions, detaching);
		}
	};
}

// (95:8) <Button on:click={() => (formOptionsMode = true)}>
function create_default_slot_5(ctx) {
	let t;

	return {
		c() {
			t = text("edit form options");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (101:8) <Field {params} {createEntry} {id} {validateValueStore}>
function create_default_slot_4(ctx) {
	let button;
	let dispose;

	function click_handler_1(...args) {
		return ctx.click_handler_1(ctx, ...args);
	}

	return {
		c() {
			button = element("button");
			button.textContent = "remove";
			dispose = listen(button, "click", prevent_default(click_handler_1));
		},
		m(target, anchor) {
			insert(target, button, anchor);
		},
		p(changed, new_ctx) {
			ctx = new_ctx;
		},
		d(detaching) {
			if (detaching) detach(button);
			dispose();
		}
	};
}

// (99:4) {#each fields as { id, params }
function create_each_block$1(key_1, ctx) {
	let div;
	let current;

	const field = new Field({
			props: {
				params: ctx.params,
				createEntry: ctx.createEntry,
				id: ctx.id,
				validateValueStore: ctx.validateValueStore,
				$$slots: { default: [create_default_slot_4] },
				$$scope: { ctx }
			}
		});

	return {
		key: key_1,
		first: null,
		c() {
			div = element("div");
			create_component(field.$$.fragment);
			attr(div, "class", "row field-row remove-row svelte-1p4n34s");
			this.first = div;
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(field, div, null);
			current = true;
		},
		p(changed, ctx) {
			const field_changes = {};
			if (changed.fields) field_changes.params = ctx.params;
			if (changed.createEntry) field_changes.createEntry = ctx.createEntry;
			if (changed.fields) field_changes.id = ctx.id;
			if (changed.validateValueStore) field_changes.validateValueStore = ctx.validateValueStore;

			if (changed.$$scope || changed.fields) {
				field_changes.$$scope = { changed, ctx };
			}

			field.$set(field_changes);
		},
		i(local) {
			if (current) return;
			transition_in(field.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(field.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_component(field);
		}
	};
}

// (109:8) {#if fields.length}
function create_if_block$6(ctx) {
	let current;

	const button = new Button({
			props: {
				type: "submit",
				$$slots: { default: [create_default_slot_3$1] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(button.$$.fragment);
		},
		m(target, anchor) {
			mount_component(button, target, anchor);
			current = true;
		},
		i(local) {
			if (current) return;
			transition_in(button.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(button.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(button, detaching);
		}
	};
}

// (110:10) <Button type="submit">
function create_default_slot_3$1(ctx) {
	let t;

	return {
		c() {
			t = text("Validate all");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (108:6) <NewField on:newField={onNewField}>
function create_default_slot_2$1(ctx) {
	let if_block_anchor;
	let current;
	let if_block = ctx.fields.length && create_if_block$6(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(changed, ctx) {
			if (ctx.fields.length) {
				if (!if_block) {
					if_block = create_if_block$6(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

// (82:2) <Reset n={formReset}>
function create_default_slot_1$2(ctx) {
	let form;
	let div0;
	let current_block_type_index;
	let if_block;
	let t0;
	let each_blocks = [];
	let each_1_lookup = new Map();
	let t1;
	let div1;
	let createForm_action;
	let current;
	let dispose;
	const if_block_creators = [create_if_block_1$5, create_else_block$5];
	const if_blocks = [];

	function select_block_type(changed, ctx) {
		if (ctx.formOptionsMode) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(null, ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
	let each_value = ctx.fields;
	const get_key = ctx => ctx.id;

	for (let i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context$1(ctx, each_value, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
	}

	const newfield = new New_field({
			props: {
				$$slots: { default: [create_default_slot_2$1] },
				$$scope: { ctx }
			}
		});

	newfield.$on("newField", ctx.onNewField);

	return {
		c() {
			form = element("form");
			div0 = element("div");
			if_block.c();
			t0 = space();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t1 = space();
			div1 = element("div");
			create_component(newfield.$$.fragment);
			attr(div0, "class", "row svelte-1p4n34s");
			attr(div1, "class", "row padding svelte-1p4n34s");
			form.noValidate = true;
			dispose = listen(form, "submit", prevent_default(ctx.submit_handler));
		},
		m(target, anchor) {
			insert(target, form, anchor);
			append(form, div0);
			if_blocks[current_block_type_index].m(div0, null);
			append(form, t0);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(form, null);
			}

			append(form, t1);
			append(form, div1);
			mount_component(newfield, div1, null);
			createForm_action = ctx.createForm.call(null, form) || ({});
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
				if_block.m(div0, null);
			}

			const each_value = ctx.fields;
			group_outros();
			each_blocks = update_keyed_each(each_blocks, changed, get_key, 1, ctx, each_value, each_1_lookup, form, outro_and_destroy_block, create_each_block$1, t1, get_each_context$1);
			check_outros();
			const newfield_changes = {};

			if (changed.$$scope || changed.fields) {
				newfield_changes.$$scope = { changed, ctx };
			}

			newfield.$set(newfield_changes);
		},
		i(local) {
			if (current) return;
			transition_in(if_block);

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			transition_in(newfield.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(if_block);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			transition_out(newfield.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(form);
			if_blocks[current_block_type_index].d();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d();
			}

			destroy_component(newfield);
			if (createForm_action && is_function(createForm_action.destroy)) createForm_action.destroy();
			dispose();
		}
	};
}

// (81:0) <Widget>
function create_default_slot$2(ctx) {
	let current;

	const reset = new Reset({
			props: {
				n: ctx.formReset,
				$$slots: { default: [create_default_slot_1$2] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(reset.$$.fragment);
		},
		m(target, anchor) {
			mount_component(reset, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const reset_changes = {};
			if (changed.formReset) reset_changes.n = ctx.formReset;

			if (changed.$$scope || changed.fields || changed.createEntry || changed.validateValueStore || changed.formOptionsMode || changed.formOptions || changed.formCode) {
				reset_changes.$$scope = { changed, ctx };
			}

			reset.$set(reset_changes);
		},
		i(local) {
			if (current) return;
			transition_in(reset.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(reset.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(reset, detaching);
		}
	};
}

function create_fragment$b(ctx) {
	let current;

	const widget = new Widget({
			props: {
				$$slots: { default: [create_default_slot$2] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(widget.$$.fragment);
		},
		m(target, anchor) {
			mount_component(widget, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const widget_changes = {};

			if (changed.$$scope || changed.formReset || changed.fields || changed.createEntry || changed.validateValueStore || changed.formOptionsMode || changed.formOptions || changed.formCode) {
				widget_changes.$$scope = { changed, ctx };
			}

			widget.$set(widget_changes);
		},
		i(local) {
			if (current) return;
			transition_in(widget.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(widget.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(widget, detaching);
		}
	};
}

function instance$b($$self, $$props, $$invalidate) {
	let id = 0;

	let fields = [
		{
			id: id++,
			params: { type: "string", value: "", min: 2 }
		},
		{
			id: id++,
			params: {
				type: "string",
				value: "",
				min: 2,
				required: true
			}
		},
		{
			id: id++,
			params: {
				type: "string",
				value: "",
				min: 2,
				optional: true
			}
		}
	];

	const onNewField = ({ detail: params }) => {
		$$invalidate("fields", fields = [...fields, { id: id++, params }]);
	};

	const removeRow = rowId => {
		$$invalidate("fields", fields = fields.filter(({ id }) => id !== rowId));
	};

	let formOptions = {
		validateOnEvents: { change: true, input: false, blur: false },
		clearErrorsOnEvents: { reset: true, focus: false },
		listenInputEvents: 2,
		presence: "required",
		trim: false,
		includeAllEntries: false
	};

	let formOptionsMode = false;
	let formCode = getFormCode(formOptions);
	let formReset = 0;

	const onSave = ({ detail }) => {
		$$invalidate("formOptionsMode", formOptionsMode = false);
		$$invalidate("formOptions", formOptions = detail);
		let newCode = getFormCode(formOptions);

		if (newCode !== formCode) {
			$$invalidate("formCode", formCode = newCode);
			const validation = createValidation({ ...formOptions });
			$$invalidate("createEntry", createEntry = validation.createEntry);
			$$invalidate("createForm", createForm = validation.createForm);
			$$invalidate("validateValueStore", validateValueStore = validation.validateValueStore);
			$$invalidate("formReset", formReset++, formReset);
		}
	};

	let { createEntry, createForm, validateValueStore } = createValidation(formOptions);

	function submit_handler(event) {
		bubble($$self, event);
	}

	const cancel_handler = () => $$invalidate("formOptionsMode", formOptionsMode = false);
	const click_handler = () => $$invalidate("formOptionsMode", formOptionsMode = true);
	const click_handler_1 = ({ id }) => removeRow(id);

	return {
		fields,
		onNewField,
		removeRow,
		formOptions,
		formOptionsMode,
		formCode,
		formReset,
		onSave,
		createEntry,
		createForm,
		validateValueStore,
		submit_handler,
		cancel_handler,
		click_handler,
		click_handler_1
	};
}

class Builder extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1p4n34s-style")) add_css$9();
		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});
	}
}

/* src/docs/examples/components/row.svelte generated by Svelte v3.15.0 */

function add_css$a() {
	var style = element("style");
	style.id = "svelte-13ta8dq-style";
	style.textContent = ".row.svelte-13ta8dq{margin-bottom:10px}.row.svelte-13ta8dq:last-child{margin-bottom:0}label.svelte-13ta8dq{display:block}";
	append(document.head, style);
}

function create_fragment$c(ctx) {
	let div;
	let label;
	let span;
	let t0;
	let t1;
	let current;
	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);

	return {
		c() {
			div = element("div");
			label = element("label");
			span = element("span");
			t0 = text(ctx.labelText);
			t1 = space();
			if (default_slot) default_slot.c();
			attr(span, "class", "label");
			attr(label, "class", "svelte-13ta8dq");
			attr(div, "class", "row svelte-13ta8dq");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, label);
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
			if (detaching) detach(div);
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance$c($$self, $$props, $$invalidate) {
	let { labelText = "" } = $$props;
	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$props => {
		if ("labelText" in $$props) $$invalidate("labelText", labelText = $$props.labelText);
		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
	};

	return { labelText, $$slots, $$scope };
}

class Row extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-13ta8dq-style")) add_css$a();
		init(this, options, instance$c, create_fragment$c, safe_not_equal, { labelText: 0 });
	}
}

/* src/docs/examples/components/form.svelte generated by Svelte v3.15.0 */

function add_css$b() {
	var style = element("style");
	style.id = "svelte-tbefmr-style";
	style.textContent = "h1.svelte-tbefmr{border-bottom:1px solid #004cb4;color:#fff;overflow:hidden;position:relative}h1.svelte-tbefmr span.svelte-tbefmr{background:#004cb4;color:#fff;display:inline-block;padding:0 5px;position:relative;vertical-align:top}.subtitle.svelte-tbefmr{background:#004cb4;bottom:0;font-size:12px;font-style:normal;line-height:16px;left:100%;padding:1px 5px 0;position:absolute;white-space:nowrap}.barge.svelte-tbefmr{background:#004cb4;font-style:normal;padding:0 5px;position:absolute;right:0;top:0}";
	append(document.head, style);
}

// (19:6) {#if subtitle}
function create_if_block_2$4(ctx) {
	let i;
	let t;

	return {
		c() {
			i = element("i");
			t = text(ctx.subtitle);
			attr(i, "class", "subtitle svelte-tbefmr");
		},
		m(target, anchor) {
			insert(target, i, anchor);
			append(i, t);
		},
		p(changed, ctx) {
			if (changed.subtitle) set_data(t, ctx.subtitle);
		},
		d(detaching) {
			if (detaching) detach(i);
		}
	};
}

// (24:6) {#if type}
function create_if_block_1$6(ctx) {
	let i;

	return {
		c() {
			i = element("i");
			i.textContent = "type";
			attr(i, "class", "barge svelte-tbefmr");
		},
		m(target, anchor) {
			insert(target, i, anchor);
		},
		d(detaching) {
			if (detaching) detach(i);
		}
	};
}

// (25:6) {#if rule}
function create_if_block$7(ctx) {
	let i;

	return {
		c() {
			i = element("i");
			i.textContent = "rule";
			attr(i, "class", "barge svelte-tbefmr");
		},
		m(target, anchor) {
			insert(target, i, anchor);
		},
		d(detaching) {
			if (detaching) detach(i);
		}
	};
}

// (14:0) <Widget>
function create_default_slot$3(ctx) {
	let form;
	let h1;
	let span;
	let t0;
	let t1;
	let t2;
	let t3;
	let t4;
	let createForm_action;
	let current;
	let dispose;
	let if_block0 = ctx.subtitle && create_if_block_2$4(ctx);
	let if_block1 = ctx.type && create_if_block_1$6();
	let if_block2 = ctx.rule && create_if_block$7();
	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);

	return {
		c() {
			form = element("form");
			h1 = element("h1");
			span = element("span");
			t0 = text(ctx.title);
			t1 = space();
			if (if_block0) if_block0.c();
			t2 = space();
			if (if_block1) if_block1.c();
			t3 = space();
			if (if_block2) if_block2.c();
			t4 = space();
			if (default_slot) default_slot.c();
			attr(span, "class", "svelte-tbefmr");
			attr(h1, "class", "svelte-tbefmr");
			form.noValidate = true;
			dispose = listen(form, "submit", prevent_default(ctx.submit_handler));
		},
		m(target, anchor) {
			insert(target, form, anchor);
			append(form, h1);
			append(h1, span);
			append(span, t0);
			append(span, t1);
			if (if_block0) if_block0.m(span, null);
			append(h1, t2);
			if (if_block1) if_block1.m(h1, null);
			append(h1, t3);
			if (if_block2) if_block2.m(h1, null);
			append(form, t4);

			if (default_slot) {
				default_slot.m(form, null);
			}

			createForm_action = ctx.createForm.call(null, form, ctx.createFormOpts) || ({});
			current = true;
		},
		p(changed, ctx) {
			if (!current || changed.title) set_data(t0, ctx.title);

			if (ctx.subtitle) {
				if (if_block0) {
					if_block0.p(changed, ctx);
				} else {
					if_block0 = create_if_block_2$4(ctx);
					if_block0.c();
					if_block0.m(span, null);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (ctx.type) {
				if (!if_block1) {
					if_block1 = create_if_block_1$6();
					if_block1.c();
					if_block1.m(h1, t3);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (ctx.rule) {
				if (!if_block2) {
					if_block2 = create_if_block$7();
					if_block2.c();
					if_block2.m(h1, null);
				}
			} else if (if_block2) {
				if_block2.d(1);
				if_block2 = null;
			}

			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
			}

			if (is_function(createForm_action.update) && changed.createFormOpts) createForm_action.update.call(null, ctx.createFormOpts);
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
			if (detaching) detach(form);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (if_block2) if_block2.d();
			if (default_slot) default_slot.d(detaching);
			if (createForm_action && is_function(createForm_action.destroy)) createForm_action.destroy();
			dispose();
		}
	};
}

function create_fragment$d(ctx) {
	let current;

	const widget = new Widget({
			props: {
				$$slots: { default: [create_default_slot$3] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(widget.$$.fragment);
		},
		m(target, anchor) {
			mount_component(widget, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const widget_changes = {};

			if (changed.$$scope || changed.createFormOpts || changed.rule || changed.type || changed.subtitle || changed.title) {
				widget_changes.$$scope = { changed, ctx };
			}

			widget.$set(widget_changes);
		},
		i(local) {
			if (current) return;
			transition_in(widget.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(widget.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(widget, detaching);
		}
	};
}

function instance$d($$self, $$props, $$invalidate) {
	let { createForm } = $$props;
	let { createFormOpts = {} } = $$props;
	let { title } = $$props;
	let { subtitle = "" } = $$props;
	let { type = false } = $$props;
	let { rule = false } = $$props;
	let { $$slots = {}, $$scope } = $$props;

	function submit_handler(event) {
		bubble($$self, event);
	}

	$$self.$set = $$props => {
		if ("createForm" in $$props) $$invalidate("createForm", createForm = $$props.createForm);
		if ("createFormOpts" in $$props) $$invalidate("createFormOpts", createFormOpts = $$props.createFormOpts);
		if ("title" in $$props) $$invalidate("title", title = $$props.title);
		if ("subtitle" in $$props) $$invalidate("subtitle", subtitle = $$props.subtitle);
		if ("type" in $$props) $$invalidate("type", type = $$props.type);
		if ("rule" in $$props) $$invalidate("rule", rule = $$props.rule);
		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
	};

	return {
		createForm,
		createFormOpts,
		title,
		subtitle,
		type,
		rule,
		submit_handler,
		$$slots,
		$$scope
	};
}

class Form extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-tbefmr-style")) add_css$b();

		init(this, options, instance$d, create_fragment$d, safe_not_equal, {
			createForm: 0,
			createFormOpts: 0,
			title: 0,
			subtitle: 0,
			type: 0,
			rule: 0
		});
	}
}

/* src/docs/examples/string.svelte generated by Svelte v3.15.0 */

function create_default_slot_2$2(ctx) {
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
function create_default_slot_1$3(ctx) {
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

// (19:0) <Form {createForm} title="string" subtitle="min, max, between" type>
function create_default_slot$4(ctx) {
	let t0;
	let t1;
	let t2;
	let t3;
	let current;

	const code0 = new Code({
			props: {
				code: `const [
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
				code: `<input use:inputMin bind:value={$valueMin} />
{#if $errorsMin.includes('min')}Use at least 3 symbols{/if}
<input use:inputMax bind:value={$valueMax} />
{#if $errorsMax.includes('max')}Use 5 or less symbols{/if}`
			}
		});

	const row0 = new Row({
			props: {
				$$slots: { default: [create_default_slot_2$2] },
				$$scope: { ctx }
			}
		});

	const row1 = new Row({
			props: {
				$$slots: { default: [create_default_slot_1$3] },
				$$scope: { ctx }
			}
		});

	const button = new Button({ props: { type: "submit" } });

	return {
		c() {
			create_component(code0.$$.fragment);
			t0 = space();
			create_component(code1.$$.fragment);
			t1 = space();
			create_component(row0.$$.fragment);
			t2 = space();
			create_component(row1.$$.fragment);
			t3 = space();
			create_component(button.$$.fragment);
		},
		m(target, anchor) {
			mount_component(code0, target, anchor);
			insert(target, t0, anchor);
			mount_component(code1, target, anchor);
			insert(target, t1, anchor);
			mount_component(row0, target, anchor);
			insert(target, t2, anchor);
			mount_component(row1, target, anchor);
			insert(target, t3, anchor);
			mount_component(button, target, anchor);
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
			transition_in(button.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(code0.$$.fragment, local);
			transition_out(code1.$$.fragment, local);
			transition_out(row0.$$.fragment, local);
			transition_out(row1.$$.fragment, local);
			transition_out(button.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(code0, detaching);
			if (detaching) detach(t0);
			destroy_component(code1, detaching);
			if (detaching) detach(t1);
			destroy_component(row0, detaching);
			if (detaching) detach(t2);
			destroy_component(row1, detaching);
			if (detaching) detach(t3);
			destroy_component(button, detaching);
		}
	};
}

function create_fragment$e(ctx) {
	let current;

	const form = new Form({
			props: {
				createForm: ctx.createForm,
				title: "string",
				subtitle: "min, max, between",
				type: true,
				$$slots: { default: [create_default_slot$4] },
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

function instance$e($$self, $$props, $$invalidate) {
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
		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});
	}
}

/* src/docs/examples/email.svelte generated by Svelte v3.15.0 */

function create_default_slot_1$4(ctx) {
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

// (22:0) <Form {createForm} title="email" type>
function create_default_slot$5(ctx) {
	let t0;
	let t1;
	let t2;
	let current;
	const code0 = new Code({ props: { code: ctx.htmlCode } });
	const code1 = new Code({ props: { code: ctx.jsCode } });

	const row = new Row({
			props: {
				labelText: "Type your email",
				$$slots: { default: [create_default_slot_1$4] },
				$$scope: { ctx }
			}
		});

	const button = new Button({ props: { type: "submit" } });

	return {
		c() {
			create_component(code0.$$.fragment);
			t0 = space();
			create_component(code1.$$.fragment);
			t1 = space();
			create_component(row.$$.fragment);
			t2 = space();
			create_component(button.$$.fragment);
		},
		m(target, anchor) {
			mount_component(code0, target, anchor);
			insert(target, t0, anchor);
			mount_component(code1, target, anchor);
			insert(target, t1, anchor);
			mount_component(row, target, anchor);
			insert(target, t2, anchor);
			mount_component(button, target, anchor);
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
			transition_in(button.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(code0.$$.fragment, local);
			transition_out(code1.$$.fragment, local);
			transition_out(row.$$.fragment, local);
			transition_out(button.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(code0, detaching);
			if (detaching) detach(t0);
			destroy_component(code1, detaching);
			if (detaching) detach(t1);
			destroy_component(row, detaching);
			if (detaching) detach(t2);
			destroy_component(button, detaching);
		}
	};
}

function create_fragment$f(ctx) {
	let current;

	const form = new Form({
			props: {
				createForm: ctx.createForm,
				title: "email",
				type: true,
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

function instance$f($$self, $$props, $$invalidate) {
	let $value;
	const { createEntry, createForm } = createValidation({ validateOnEvents: { input: true } });
	const [errors, value, input] = createEntry({ type: "email", required: true });
	component_subscribe($$self, value, value => $$invalidate("$value", $value = value));

	const htmlCode = `const [ errors, value, input ] = createEntry({
  type: 'email', required: true
});`;

	const jsCode = `<input use:input bind:value={$value} />
{#if $errors.includes('typeCheck')}Use valid email{/if}`;

	function input_1_input_handler() {
		$value = this.value;
		value.set($value);
	}

	return {
		createForm,
		errors,
		value,
		input,
		htmlCode,
		jsCode,
		$value,
		input_1_input_handler
	};
}

class Email extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});
	}
}

/* src/docs/examples/number.svelte generated by Svelte v3.15.0 */

function create_default_slot_2$3(ctx) {
	let input;
	let input_updating = false;
	let inputMin_action;
	let t0;
	let t1;
	let current;
	let dispose;

	function input_input_handler() {
		input_updating = true;
		ctx.input_input_handler.call(input);
	}

	const error0 = new Error$1({
			props: {
				errors: ctx.errorsMin,
				errorCode: "required"
			}
		});

	const error1 = new Error$1({
			props: {
				errors: ctx.errorsMin,
				errorCode: "min",
				errorText: "For boomers only!"
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
			attr(input, "type", "number");
			attr(input, "placeholder", "type: 'number', min: 18, required: true");
			dispose = listen(input, "input", input_input_handler);
		},
		m(target, anchor) {
			insert(target, input, anchor);
			set_input_value(input, ctx.$valueMin);
			inputMin_action = ctx.inputMin.call(null, input) || ({});
			insert(target, t0, anchor);
			mount_component(error0, target, anchor);
			insert(target, t1, anchor);
			mount_component(error1, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			if (!input_updating && changed.$valueMin) {
				set_input_value(input, ctx.$valueMin);
			}

			input_updating = false;
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
			if (inputMin_action && is_function(inputMin_action.destroy)) inputMin_action.destroy();
			if (detaching) detach(t0);
			destroy_component(error0, detaching);
			if (detaching) detach(t1);
			destroy_component(error1, detaching);
			dispose();
		}
	};
}

// (50:2) <Row labelText="Type your age #2">
function create_default_slot_1$5(ctx) {
	let input;
	let input_updating = false;
	let inputMax_action;
	let t0;
	let t1;
	let current;
	let dispose;

	function input_input_handler_1() {
		input_updating = true;
		ctx.input_input_handler_1.call(input);
	}

	const error0 = new Error$1({
			props: {
				errors: ctx.errorsMax,
				errorCode: "required"
			}
		});

	const error1 = new Error$1({
			props: {
				errors: ctx.errorsMax,
				errorCode: "max",
				errorText: "Not for boomers!"
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
			attr(input, "type", "number");
			attr(input, "placeholder", "type: 'number', max: 18, required: true");
			dispose = listen(input, "input", input_input_handler_1);
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
			if (!input_updating && changed.$valueMax) {
				set_input_value(input, ctx.$valueMax);
			}

			input_updating = false;
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

// (42:0) <Form {createForm} title="number" subtitle="min, max, between" type>
function create_default_slot$6(ctx) {
	let t0;
	let t1;
	let t2;
	let t3;
	let current;
	const code0 = new Code({ props: { code: ctx.jsCode } });
	const code1 = new Code({ props: { code: ctx.htmlCode } });

	const row0 = new Row({
			props: {
				labelText: "Type your age #1",
				$$slots: { default: [create_default_slot_2$3] },
				$$scope: { ctx }
			}
		});

	const row1 = new Row({
			props: {
				labelText: "Type your age #2",
				$$slots: { default: [create_default_slot_1$5] },
				$$scope: { ctx }
			}
		});

	const button = new Button({ props: { type: "submit" } });

	return {
		c() {
			create_component(code0.$$.fragment);
			t0 = space();
			create_component(code1.$$.fragment);
			t1 = space();
			create_component(row0.$$.fragment);
			t2 = space();
			create_component(row1.$$.fragment);
			t3 = space();
			create_component(button.$$.fragment);
		},
		m(target, anchor) {
			mount_component(code0, target, anchor);
			insert(target, t0, anchor);
			mount_component(code1, target, anchor);
			insert(target, t1, anchor);
			mount_component(row0, target, anchor);
			insert(target, t2, anchor);
			mount_component(row1, target, anchor);
			insert(target, t3, anchor);
			mount_component(button, target, anchor);
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
			transition_in(button.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(code0.$$.fragment, local);
			transition_out(code1.$$.fragment, local);
			transition_out(row0.$$.fragment, local);
			transition_out(row1.$$.fragment, local);
			transition_out(button.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(code0, detaching);
			if (detaching) detach(t0);
			destroy_component(code1, detaching);
			if (detaching) detach(t1);
			destroy_component(row0, detaching);
			if (detaching) detach(t2);
			destroy_component(row1, detaching);
			if (detaching) detach(t3);
			destroy_component(button, detaching);
		}
	};
}

function create_fragment$g(ctx) {
	let current;

	const form = new Form({
			props: {
				createForm: ctx.createForm,
				title: "number",
				subtitle: "min, max, between",
				type: true,
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

function instance$g($$self, $$props, $$invalidate) {
	let $valueMin;
	let $valueMax;
	const { createEntries, createForm } = createValidation({ validateOnEvents: { input: true } });

	const [[errorsMin, valueMin, inputMin], [errorsMax, valueMax, inputMax]] = createEntries([
		{ type: "number", min: 18, required: true },
		{ type: "number", max: 18, required: true }
	]);

	component_subscribe($$self, valueMin, value => $$invalidate("$valueMin", $valueMin = value));
	component_subscribe($$self, valueMax, value => $$invalidate("$valueMax", $valueMax = value));

	const jsCode = `const [
  [ errorsMin, valueMin, inputMin ],
  [ errorsMax, valueMax, inputMax ],
] = createEntries([
  { type: 'number', min: 18, required: true },
  { type: 'number', max: 18, required: true }
]);`;

	const htmlCode = `<input use:inputMin bind:value={$valueMin} type="number" />
{#if $errorsMin.includes('required')}
  This field is required
{/if}
{if $errorsMin.includes('min')}
  For boomers only!
{/if}
<input use:inputMax bind:value={$valueMax} type="number" />
{#if $errorsMax.includes('required')}
  This field is required
{/if}
{if $errorsMax.includes('max')}
  Not for boomers!
{/if}`;

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
		jsCode,
		htmlCode,
		$valueMin,
		$valueMax,
		input_input_handler,
		input_input_handler_1
	};
}

class Number extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});
	}
}

/* src/docs/examples/boolean.svelte generated by Svelte v3.15.0 */

function create_default_slot$7(ctx) {
	let t0;
	let t1;
	let div;
	let label;
	let input_1;
	let input_action;
	let t2;
	let t3;
	let t4;
	let current;
	let dispose;
	const code0 = new Code({ props: { code: ctx.jsCode } });
	const code1 = new Code({ props: { code: ctx.htmlCode } });

	const error = new Error$1({
			props: {
				errors: ctx.errors,
				errorCode: "required",
				errorText: "Please check"
			}
		});

	const button = new Button({ props: { type: "submit" } });

	return {
		c() {
			create_component(code0.$$.fragment);
			t0 = space();
			create_component(code1.$$.fragment);
			t1 = space();
			div = element("div");
			label = element("label");
			input_1 = element("input");
			t2 = text(" Are you agree?");
			t3 = space();
			create_component(error.$$.fragment);
			t4 = space();
			create_component(button.$$.fragment);
			attr(input_1, "class", "input-choice");
			attr(input_1, "type", "checkbox");
			attr(div, "class", "cells");
			dispose = listen(input_1, "change", ctx.input_1_change_handler);
		},
		m(target, anchor) {
			mount_component(code0, target, anchor);
			insert(target, t0, anchor);
			mount_component(code1, target, anchor);
			insert(target, t1, anchor);
			insert(target, div, anchor);
			append(div, label);
			append(label, input_1);
			input_1.checked = ctx.$value;
			input_action = ctx.input.call(null, input_1) || ({});
			append(label, t2);
			insert(target, t3, anchor);
			mount_component(error, target, anchor);
			insert(target, t4, anchor);
			mount_component(button, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			if (changed.$value) {
				input_1.checked = ctx.$value;
			}
		},
		i(local) {
			if (current) return;
			transition_in(code0.$$.fragment, local);
			transition_in(code1.$$.fragment, local);
			transition_in(error.$$.fragment, local);
			transition_in(button.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(code0.$$.fragment, local);
			transition_out(code1.$$.fragment, local);
			transition_out(error.$$.fragment, local);
			transition_out(button.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(code0, detaching);
			if (detaching) detach(t0);
			destroy_component(code1, detaching);
			if (detaching) detach(t1);
			if (detaching) detach(div);
			if (input_action && is_function(input_action.destroy)) input_action.destroy();
			if (detaching) detach(t3);
			destroy_component(error, detaching);
			if (detaching) detach(t4);
			destroy_component(button, detaching);
			dispose();
		}
	};
}

function create_fragment$h(ctx) {
	let current;

	const form = new Form({
			props: {
				createForm: ctx.createForm,
				title: "boolean",
				type: true,
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

function instance$h($$self, $$props, $$invalidate) {
	let $value;
	const { createEntry, createForm } = createValidation({ validateOnEvents: { change: true } });

	const [errors, value, input] = createEntry({
		value: false,
		type: "boolean",
		required: true
	});

	component_subscribe($$self, value, value => $$invalidate("$value", $value = value));

	const jsCode = `const [ errors, value, input ] = createEntry({
  value: false,
  type: 'boolean',
  required: true
});`;

	const htmlCode = `<input use:inputMin bind:value={$valueMin} class="input-text" />
<input use:input bind:checked={$value} type="checkbox" />
{#if $errors.includes('required')}Please check{/if}`;

	function input_1_change_handler() {
		$value = this.checked;
		value.set($value);
	}

	return {
		createForm,
		errors,
		value,
		input,
		jsCode,
		htmlCode,
		$value,
		input_1_change_handler
	};
}

class Boolean$1 extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});
	}
}

/* src/docs/examples/array.svelte generated by Svelte v3.15.0 */

function create_default_slot_2$4(ctx) {
	let t0;
	let t1;
	let div;
	let label0;
	let input0;
	let input0_value_value;
	let input_action;
	let t2;
	let t3;
	let label1;
	let input1;
	let input1_value_value;
	let input_action_1;
	let t4;
	let t5;
	let label2;
	let input2;
	let input2_value_value;
	let input_action_2;
	let t6;
	let t7;
	let t8;
	let current;
	let dispose;
	const code0 = new Code({ props: { code: ctx.js1 } });
	const code1 = new Code({ props: { code: ctx.html1 } });

	const error = new Error$1({
			props: {
				errors: ctx.errors,
				errorCode: "min",
				errorText: "Pick at least 2, please"
			}
		});

	const button = new Button({ props: { type: "submit" } });

	return {
		c() {
			create_component(code0.$$.fragment);
			t0 = space();
			create_component(code1.$$.fragment);
			t1 = space();
			div = element("div");
			label0 = element("label");
			input0 = element("input");
			t2 = text(" First option");
			t3 = space();
			label1 = element("label");
			input1 = element("input");
			t4 = text(" Second option");
			t5 = space();
			label2 = element("label");
			input2 = element("input");
			t6 = text(" Third option");
			t7 = space();
			create_component(error.$$.fragment);
			t8 = space();
			create_component(button.$$.fragment);
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
			attr(div, "class", "cells");

			dispose = [
				listen(input0, "change", ctx.input0_change_handler),
				listen(input1, "change", ctx.input1_change_handler),
				listen(input2, "change", ctx.input2_change_handler)
			];
		},
		m(target, anchor) {
			mount_component(code0, target, anchor);
			insert(target, t0, anchor);
			mount_component(code1, target, anchor);
			insert(target, t1, anchor);
			insert(target, div, anchor);
			append(div, label0);
			append(label0, input0);
			input0.checked = ~ctx.$value.indexOf(input0.__value);
			input_action = ctx.input.call(null, input0) || ({});
			append(label0, t2);
			append(div, t3);
			append(div, label1);
			append(label1, input1);
			input1.checked = ~ctx.$value.indexOf(input1.__value);
			input_action_1 = ctx.input.call(null, input1) || ({});
			append(label1, t4);
			append(div, t5);
			append(div, label2);
			append(label2, input2);
			input2.checked = ~ctx.$value.indexOf(input2.__value);
			input_action_2 = ctx.input.call(null, input2) || ({});
			append(label2, t6);
			insert(target, t7, anchor);
			mount_component(error, target, anchor);
			insert(target, t8, anchor);
			mount_component(button, target, anchor);
			current = true;
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
		i(local) {
			if (current) return;
			transition_in(code0.$$.fragment, local);
			transition_in(code1.$$.fragment, local);
			transition_in(error.$$.fragment, local);
			transition_in(button.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(code0.$$.fragment, local);
			transition_out(code1.$$.fragment, local);
			transition_out(error.$$.fragment, local);
			transition_out(button.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(code0, detaching);
			if (detaching) detach(t0);
			destroy_component(code1, detaching);
			if (detaching) detach(t1);
			if (detaching) detach(div);
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input0), 1);
			if (input_action && is_function(input_action.destroy)) input_action.destroy();
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input1), 1);
			if (input_action_1 && is_function(input_action_1.destroy)) input_action_1.destroy();
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input2), 1);
			if (input_action_2 && is_function(input_action_2.destroy)) input_action_2.destroy();
			if (detaching) detach(t7);
			destroy_component(error, detaching);
			if (detaching) detach(t8);
			destroy_component(button, detaching);
			run_all(dispose);
		}
	};
}

// (63:2) <Row labelText="Pick few options">
function create_default_slot_1$6(ctx) {
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

// (60:0) <Form createForm={createForm2} title="array" subtitle="min, max, includes" type>
function create_default_slot$8(ctx) {
	let t0;
	let t1;
	let t2;
	let current;
	const code0 = new Code({ props: { code: ctx.js2 } });
	const code1 = new Code({ props: { code: ctx.html2 } });

	const row = new Row({
			props: {
				labelText: "Pick few options",
				$$slots: { default: [create_default_slot_1$6] },
				$$scope: { ctx }
			}
		});

	const button = new Button({ props: { type: "submit" } });

	return {
		c() {
			create_component(code0.$$.fragment);
			t0 = space();
			create_component(code1.$$.fragment);
			t1 = space();
			create_component(row.$$.fragment);
			t2 = space();
			create_component(button.$$.fragment);
		},
		m(target, anchor) {
			mount_component(code0, target, anchor);
			insert(target, t0, anchor);
			mount_component(code1, target, anchor);
			insert(target, t1, anchor);
			mount_component(row, target, anchor);
			insert(target, t2, anchor);
			mount_component(button, target, anchor);
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
			transition_in(button.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(code0.$$.fragment, local);
			transition_out(code1.$$.fragment, local);
			transition_out(row.$$.fragment, local);
			transition_out(button.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(code0, detaching);
			if (detaching) detach(t0);
			destroy_component(code1, detaching);
			if (detaching) detach(t1);
			destroy_component(row, detaching);
			if (detaching) detach(t2);
			destroy_component(button, detaching);
		}
	};
}

function create_fragment$i(ctx) {
	let t;
	let current;

	const form0 = new Form({
			props: {
				createForm: ctx.createForm1,
				title: "array",
				subtitle: "min, max, includes",
				type: true,
				$$slots: { default: [create_default_slot_2$4] },
				$$scope: { ctx }
			}
		});

	const form1 = new Form({
			props: {
				createForm: ctx.createForm2,
				title: "array",
				subtitle: "min, max, includes",
				type: true,
				$$slots: { default: [create_default_slot$8] },
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

function instance$i($$self, $$props, $$invalidate) {
	let $value;
	let $valueSelect;
	const { createEntry: createEntry1, createForm: createForm1 } = createValidation({ validateOnEvents: { input: true } });
	const { createEntry: createEntry2, createForm: createForm2 } = createValidation({ validateOnEvents: { input: true } });
	const [errors, value, input] = createEntry1({ type: "array", min: 2, value: [] });
	component_subscribe($$self, value, value => $$invalidate("$value", $value = value));
	const [errorsSelect, valueSelect, inputSelect] = createEntry2({ type: "array", required: true, value: [] });
	component_subscribe($$self, valueSelect, value => $$invalidate("$valueSelect", $valueSelect = value));

	const js1 = `const [ errors, value, input ] = createEntry({
  type: 'array',
  min: 2,
  value: []
});`;

	const html1 = `<input use:input bind:group={$value} value={1} type="checkbox" /> First option
<input use:input bind:group={$value} value={2} type="checkbox" /> Second option
<input use:input bind:group={$value} value={3} type="checkbox" /> Third option
{#if $errors.includes('required')}Pick something please{/if}`;

	const js2 = `const [ errors, value, input ] = createEntry({
  type: 'array',
  required: true,
  value: []
});`;

	const html2 = `<select multiple bind:value={$valueSelect} use:inputSelect>
  <option value={1}>First lorem ipsum</option>
  <option value={2}>Second lorem ipsum</option>
  <option value={3}>Third lorem ipsum</option>
</select>
{#if $errors.includes('required')}Pick something please{/if}`;

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
		js1,
		html1,
		js2,
		html2,
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
		init(this, options, instance$i, create_fragment$i, safe_not_equal, {});
	}
}

/* src/docs/examples/required.svelte generated by Svelte v3.15.0 */

function create_default_slot_2$5(ctx) {
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

// (40:2) <Row labelText="Type your email (optional)">
function create_default_slot_1$7(ctx) {
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

// (32:0) <Form {createForm} title="required" rule>
function create_default_slot$9(ctx) {
	let t0;
	let t1;
	let t2;
	let t3;
	let current;
	const code0 = new Code({ props: { code: ctx.jsCode } });
	const code1 = new Code({ props: { code: ctx.htmlCode } });

	const row0 = new Row({
			props: {
				labelText: "Type your email (required)",
				$$slots: { default: [create_default_slot_2$5] },
				$$scope: { ctx }
			}
		});

	const row1 = new Row({
			props: {
				labelText: "Type your email (optional)",
				$$slots: { default: [create_default_slot_1$7] },
				$$scope: { ctx }
			}
		});

	const button = new Button({ props: { type: "submit" } });

	return {
		c() {
			create_component(code0.$$.fragment);
			t0 = space();
			create_component(code1.$$.fragment);
			t1 = space();
			create_component(row0.$$.fragment);
			t2 = space();
			create_component(row1.$$.fragment);
			t3 = space();
			create_component(button.$$.fragment);
		},
		m(target, anchor) {
			mount_component(code0, target, anchor);
			insert(target, t0, anchor);
			mount_component(code1, target, anchor);
			insert(target, t1, anchor);
			mount_component(row0, target, anchor);
			insert(target, t2, anchor);
			mount_component(row1, target, anchor);
			insert(target, t3, anchor);
			mount_component(button, target, anchor);
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
			transition_in(button.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(code0.$$.fragment, local);
			transition_out(code1.$$.fragment, local);
			transition_out(row0.$$.fragment, local);
			transition_out(row1.$$.fragment, local);
			transition_out(button.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(code0, detaching);
			if (detaching) detach(t0);
			destroy_component(code1, detaching);
			if (detaching) detach(t1);
			destroy_component(row0, detaching);
			if (detaching) detach(t2);
			destroy_component(row1, detaching);
			if (detaching) detach(t3);
			destroy_component(button, detaching);
		}
	};
}

function create_fragment$j(ctx) {
	let current;

	const form = new Form({
			props: {
				createForm: ctx.createForm,
				title: "required",
				rule: true,
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

function instance$j($$self, $$props, $$invalidate) {
	let $valueRequired;
	let $value;
	const { createEntry, createForm } = createValidation({ validateOnEvents: { input: true } });
	const [errorsRequired, valueRequired, inputRequired] = createEntry({ type: "email", required: true });
	component_subscribe($$self, valueRequired, value => $$invalidate("$valueRequired", $valueRequired = value));
	const [errors, value, input] = createEntry({ type: "email" });
	component_subscribe($$self, value, value => $$invalidate("$value", $value = value));

	const jsCode = `const [ errorsRequired, valueRequired, inputRequired ] = createEntry({
  type: 'email', required: true
});
const [ errors, value, input ] = createEntry({
  type: 'email'
});`;

	const htmlCode = `<input use:inputRequired bind:value={$valueRequired} type="email" />
{#if $errors.includes('typeCheck')}Use valid email{/if}
{#if $errors.includes('required')}This field is required{/if}

<input use:input bind:value={$value} type="email" />
{#if $errors.includes('typeCheck')}Use valid email{/if}`;

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
		jsCode,
		htmlCode,
		$valueRequired,
		$value,
		input_1_input_handler,
		input_1_input_handler_1
	};
}

class Required extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});
	}
}

/* src/docs/examples/match.svelte generated by Svelte v3.15.0 */

function create_default_slot_1$8(ctx) {
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

// (22:0) <Form {createForm} title="match" rule>
function create_default_slot$a(ctx) {
	let t0;
	let t1;
	let t2;
	let current;
	const code0 = new Code({ props: { code: ctx.jsCode } });
	const code1 = new Code({ props: { code: ctx.htmlCode } });

	const row = new Row({
			props: {
				labelText: "Type something like AxxxxxxB",
				$$slots: { default: [create_default_slot_1$8] },
				$$scope: { ctx }
			}
		});

	const button = new Button({ props: { type: "submit" } });

	return {
		c() {
			create_component(code0.$$.fragment);
			t0 = space();
			create_component(code1.$$.fragment);
			t1 = space();
			create_component(row.$$.fragment);
			t2 = space();
			create_component(button.$$.fragment);
		},
		m(target, anchor) {
			mount_component(code0, target, anchor);
			insert(target, t0, anchor);
			mount_component(code1, target, anchor);
			insert(target, t1, anchor);
			mount_component(row, target, anchor);
			insert(target, t2, anchor);
			mount_component(button, target, anchor);
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
			transition_in(button.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(code0.$$.fragment, local);
			transition_out(code1.$$.fragment, local);
			transition_out(row.$$.fragment, local);
			transition_out(button.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(code0, detaching);
			if (detaching) detach(t0);
			destroy_component(code1, detaching);
			if (detaching) detach(t1);
			destroy_component(row, detaching);
			if (detaching) detach(t2);
			destroy_component(button, detaching);
		}
	};
}

function create_fragment$k(ctx) {
	let current;

	const form = new Form({
			props: {
				createForm: ctx.createForm,
				title: "match",
				rule: true,
				$$slots: { default: [create_default_slot$a] },
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

function instance$k($$self, $$props, $$invalidate) {
	let $value;
	const { createEntry, createForm } = createValidation({ validateOnEvents: { input: true } });
	const [errors, value, input] = createEntry({ type: "string", match: /^A.*B$/ });
	component_subscribe($$self, value, value => $$invalidate("$value", $value = value));

	const jsCode = `const [ errors, value, input ] = createEntry({
  type: 'string', match: /^A.*B$/
});`;

	const htmlCode = `<input use:input bind:value={$value} />
{#if $errors.includes('match')}Should start from 'A' letter and ends with 'B' letter{/if}`;

	function input_1_input_handler() {
		$value = this.value;
		value.set($value);
	}

	return {
		createForm,
		errors,
		value,
		input,
		jsCode,
		htmlCode,
		$value,
		input_1_input_handler
	};
}

class Match extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$k, create_fragment$k, safe_not_equal, {});
	}
}

/* src/docs/examples/equal.svelte generated by Svelte v3.15.0 */

function create_default_slot_1$9(ctx) {
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

// (22:0) <Form {createForm} title="equal" rule>
function create_default_slot$b(ctx) {
	let t0;
	let t1;
	let t2;
	let current;
	const code0 = new Code({ props: { code: ctx.jsCode } });
	const code1 = new Code({ props: { code: ctx.htmlCode } });

	const row = new Row({
			props: {
				labelText: "Type 'qwerty'",
				$$slots: { default: [create_default_slot_1$9] },
				$$scope: { ctx }
			}
		});

	const button = new Button({ props: { type: "submit" } });

	return {
		c() {
			create_component(code0.$$.fragment);
			t0 = space();
			create_component(code1.$$.fragment);
			t1 = space();
			create_component(row.$$.fragment);
			t2 = space();
			create_component(button.$$.fragment);
		},
		m(target, anchor) {
			mount_component(code0, target, anchor);
			insert(target, t0, anchor);
			mount_component(code1, target, anchor);
			insert(target, t1, anchor);
			mount_component(row, target, anchor);
			insert(target, t2, anchor);
			mount_component(button, target, anchor);
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
			transition_in(button.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(code0.$$.fragment, local);
			transition_out(code1.$$.fragment, local);
			transition_out(row.$$.fragment, local);
			transition_out(button.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(code0, detaching);
			if (detaching) detach(t0);
			destroy_component(code1, detaching);
			if (detaching) detach(t1);
			destroy_component(row, detaching);
			if (detaching) detach(t2);
			destroy_component(button, detaching);
		}
	};
}

function create_fragment$l(ctx) {
	let current;

	const form = new Form({
			props: {
				createForm: ctx.createForm,
				title: "equal",
				rule: true,
				$$slots: { default: [create_default_slot$b] },
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

function instance$l($$self, $$props, $$invalidate) {
	let $value;
	const { createEntry, createForm } = createValidation({ validateOnEvents: { input: true } });
	const [errors, value, input] = createEntry({ type: "string", equal: "qwerty" });
	component_subscribe($$self, value, value => $$invalidate("$value", $value = value));

	const jsCode = `const [ errors, value, input ] = createEntry({
  type: 'string', equal: 'qwerty'
});`;

	const htmlCode = `<input use:input bind:value={$value} />
{#if $errors.includes('equal')}Should be equal to 'qwerty'{/if}`;

	function input_1_input_handler() {
		$value = this.value;
		value.set($value);
	}

	return {
		createForm,
		errors,
		value,
		input,
		jsCode,
		htmlCode,
		$value,
		input_1_input_handler
	};
}

class Equal extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$l, create_fragment$l, safe_not_equal, {});
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

/* src/docs/examples/array-sum-of-points.svelte generated by Svelte v3.15.0 */

function create_if_block$8(ctx) {
	let h1;
	let t0;
	let t1_value = ctx.$score.toFixed(0) + "";
	let t1;
	let t2;
	let h1_style_value;
	let if_block = ctx.$score === 100 && create_if_block_1$7();

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
					if_block = create_if_block_1$7();
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

// (73:71) {#if $score === 100}
function create_if_block_1$7(ctx) {
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

// (57:0) <Form {createForm} title="Pick as much sportsman as you can">
function create_default_slot$c(ctx) {
	let div;
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
	let t19;
	let t20;
	let t21;
	let t22;
	let current;
	let dispose;

	const error = new Error$1({
			props: {
				errors: ctx.errors,
				errorCode: "required",
				errorText: "Pick something please"
			}
		});

	let if_block = ctx.$value.length && create_if_block$8(ctx);
	const code0 = new Code({ props: { code: ctx.jsCode } });
	const code1 = new Code({ props: { code: ctx.htmlCode } });

	return {
		c() {
			div = element("div");
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
			t19 = space();
			create_component(error.$$.fragment);
			t20 = space();
			if (if_block) if_block.c();
			t21 = space();
			create_component(code0.$$.fragment);
			t22 = space();
			create_component(code1.$$.fragment);
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
			attr(div, "class", "cells");

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
			insert(target, div, anchor);
			append(div, label0);
			append(label0, input0);
			input0.checked = ~ctx.$value.indexOf(input0.__value);
			input_action = ctx.input.call(null, input0) || ({});
			append(label0, t0);
			append(div, t1);
			append(div, label1);
			append(label1, input1);
			input1.checked = ~ctx.$value.indexOf(input1.__value);
			input_action_1 = ctx.input.call(null, input1) || ({});
			append(label1, t2);
			append(div, t3);
			append(div, label2);
			append(label2, input2);
			input2.checked = ~ctx.$value.indexOf(input2.__value);
			input_action_2 = ctx.input.call(null, input2) || ({});
			append(label2, t4);
			append(div, t5);
			append(div, label3);
			append(label3, input3);
			input3.checked = ~ctx.$value.indexOf(input3.__value);
			input_action_3 = ctx.input.call(null, input3) || ({});
			append(label3, t6);
			append(div, t7);
			append(div, label4);
			append(label4, input4);
			input4.checked = ~ctx.$value.indexOf(input4.__value);
			input_action_4 = ctx.input.call(null, input4) || ({});
			append(label4, t8);
			append(div, t9);
			append(div, label5);
			append(label5, input5);
			input5.checked = ~ctx.$value.indexOf(input5.__value);
			input_action_5 = ctx.input.call(null, input5) || ({});
			append(label5, t10);
			append(div, t11);
			append(div, label6);
			append(label6, input6);
			input6.checked = ~ctx.$value.indexOf(input6.__value);
			input_action_6 = ctx.input.call(null, input6) || ({});
			append(label6, t12);
			append(div, t13);
			append(div, label7);
			append(label7, input7);
			input7.checked = ~ctx.$value.indexOf(input7.__value);
			input_action_7 = ctx.input.call(null, input7) || ({});
			append(label7, t14);
			append(div, t15);
			append(div, label8);
			append(label8, input8);
			input8.checked = ~ctx.$value.indexOf(input8.__value);
			input_action_8 = ctx.input.call(null, input8) || ({});
			append(label8, t16);
			append(div, t17);
			append(div, label9);
			append(label9, input9);
			input9.checked = ~ctx.$value.indexOf(input9.__value);
			input_action_9 = ctx.input.call(null, input9) || ({});
			append(label9, t18);
			insert(target, t19, anchor);
			mount_component(error, target, anchor);
			insert(target, t20, anchor);
			if (if_block) if_block.m(target, anchor);
			insert(target, t21, anchor);
			mount_component(code0, target, anchor);
			insert(target, t22, anchor);
			mount_component(code1, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			if (!current || changed.$score && input0_disabled_value !== (input0_disabled_value = ctx.$score === 100)) {
				input0.disabled = input0_disabled_value;
			}

			if (changed.$value) {
				input0.checked = ~ctx.$value.indexOf(input0.__value);
			}

			if (!current || changed.$score && input1_disabled_value !== (input1_disabled_value = ctx.$score === 100)) {
				input1.disabled = input1_disabled_value;
			}

			if (changed.$value) {
				input1.checked = ~ctx.$value.indexOf(input1.__value);
			}

			if (!current || changed.$score && input2_disabled_value !== (input2_disabled_value = ctx.$score === 100)) {
				input2.disabled = input2_disabled_value;
			}

			if (changed.$value) {
				input2.checked = ~ctx.$value.indexOf(input2.__value);
			}

			if (!current || changed.$score && input3_disabled_value !== (input3_disabled_value = ctx.$score === 100)) {
				input3.disabled = input3_disabled_value;
			}

			if (changed.$value) {
				input3.checked = ~ctx.$value.indexOf(input3.__value);
			}

			if (!current || changed.$score && input4_disabled_value !== (input4_disabled_value = ctx.$score === 100)) {
				input4.disabled = input4_disabled_value;
			}

			if (changed.$value) {
				input4.checked = ~ctx.$value.indexOf(input4.__value);
			}

			if (!current || changed.$score && input5_disabled_value !== (input5_disabled_value = ctx.$score === 100)) {
				input5.disabled = input5_disabled_value;
			}

			if (changed.$value) {
				input5.checked = ~ctx.$value.indexOf(input5.__value);
			}

			if (!current || changed.$score && input6_disabled_value !== (input6_disabled_value = ctx.$score === 100)) {
				input6.disabled = input6_disabled_value;
			}

			if (changed.$value) {
				input6.checked = ~ctx.$value.indexOf(input6.__value);
			}

			if (!current || changed.$score && input7_disabled_value !== (input7_disabled_value = ctx.$score === 100)) {
				input7.disabled = input7_disabled_value;
			}

			if (changed.$value) {
				input7.checked = ~ctx.$value.indexOf(input7.__value);
			}

			if (!current || changed.$score && input8_disabled_value !== (input8_disabled_value = ctx.$score === 100)) {
				input8.disabled = input8_disabled_value;
			}

			if (changed.$value) {
				input8.checked = ~ctx.$value.indexOf(input8.__value);
			}

			if (!current || changed.$score && input9_disabled_value !== (input9_disabled_value = ctx.$score === 100)) {
				input9.disabled = input9_disabled_value;
			}

			if (changed.$value) {
				input9.checked = ~ctx.$value.indexOf(input9.__value);
			}

			if (ctx.$value.length) {
				if (if_block) {
					if_block.p(changed, ctx);
				} else {
					if_block = create_if_block$8(ctx);
					if_block.c();
					if_block.m(t21.parentNode, t21);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		i(local) {
			if (current) return;
			transition_in(error.$$.fragment, local);
			transition_in(code0.$$.fragment, local);
			transition_in(code1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(error.$$.fragment, local);
			transition_out(code0.$$.fragment, local);
			transition_out(code1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input0), 1);
			if (input_action && is_function(input_action.destroy)) input_action.destroy();
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input1), 1);
			if (input_action_1 && is_function(input_action_1.destroy)) input_action_1.destroy();
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input2), 1);
			if (input_action_2 && is_function(input_action_2.destroy)) input_action_2.destroy();
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input3), 1);
			if (input_action_3 && is_function(input_action_3.destroy)) input_action_3.destroy();
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input4), 1);
			if (input_action_4 && is_function(input_action_4.destroy)) input_action_4.destroy();
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input5), 1);
			if (input_action_5 && is_function(input_action_5.destroy)) input_action_5.destroy();
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input6), 1);
			if (input_action_6 && is_function(input_action_6.destroy)) input_action_6.destroy();
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input7), 1);
			if (input_action_7 && is_function(input_action_7.destroy)) input_action_7.destroy();
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input8), 1);
			if (input_action_8 && is_function(input_action_8.destroy)) input_action_8.destroy();
			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input9), 1);
			if (input_action_9 && is_function(input_action_9.destroy)) input_action_9.destroy();
			if (detaching) detach(t19);
			destroy_component(error, detaching);
			if (detaching) detach(t20);
			if (if_block) if_block.d(detaching);
			if (detaching) detach(t21);
			destroy_component(code0, detaching);
			if (detaching) detach(t22);
			destroy_component(code1, detaching);
			run_all(dispose);
		}
	};
}

function create_fragment$m(ctx) {
	let current;

	const form = new Form({
			props: {
				createForm: ctx.createForm,
				title: "Pick as much sportsman as you can",
				$$slots: { default: [create_default_slot$c] },
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

			if (changed.$$scope || changed.$value || changed.color || changed.$score) {
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

function instance$m($$self, $$props, $$invalidate) {
	let $score;
	let $value;
	let score = tweened(0, { duration: 400, easing: cubicOut });
	component_subscribe($$self, score, value => $$invalidate("$score", $score = value));
	const { createEntry, createForm } = createValidation({ listenInputEvents: 1 });
	const [errors, value, input] = createEntry({ type: "array", value: [], required: true });
	component_subscribe($$self, value, value => $$invalidate("$value", $value = value));

	const jsCode = `let score = tweened(0, {
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
$: color = ($score < 0 ? 'red' : ($score < 50 ? 'inherit' : ($score < 100 ? '#768c7b' : '#32d75e')));`;

	const htmlCode = `<h1>Pick as much sportsman as you can</h1>
<input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={9} /> Tom Brady
<input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={-40} /> Isaac Newton
<input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={30} /> Pete Carrol
<input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={-30} /> Steve Jobs
<input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={14} /> Paul Gascoigne
<input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={16} /> Pele
<input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={20} /> Albetro Contador
<input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={-20} /> David Gilmour
<input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={11} /> Georges St-Pierre
<input disabled={$score === 100} use:input bind:group={$value} type="checkbox" value={-10} /> Rich Harris

{#if $errors.includes('required')}Pick something please{/if}
{#if $value.length}
  <h1 style={\`color: \${color}\`}>Your score: {$score.toFixed(0)}/100 {#if $score === 100}You won!{/if}</h1>
{/if}`;

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
		jsCode,
		htmlCode,
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
		init(this, options, instance$m, create_fragment$m, safe_not_equal, {});
	}
}

/* src/docs/examples/field-confirm.svelte generated by Svelte v3.15.0 */

function create_default_slot_2$6(ctx) {
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

// (49:2) <Row>
function create_default_slot_1$a(ctx) {
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

// (40:0) <Form {createForm} title="Confirm password">
function create_default_slot$d(ctx) {
	let t0;
	let t1;
	let t2;
	let t3;
	let current;
	const code0 = new Code({ props: { code: ctx.jsCode } });
	const code1 = new Code({ props: { code: ctx.htmlCode } });

	const row0 = new Row({
			props: {
				$$slots: { default: [create_default_slot_2$6] },
				$$scope: { ctx }
			}
		});

	const row1 = new Row({
			props: {
				$$slots: { default: [create_default_slot_1$a] },
				$$scope: { ctx }
			}
		});

	const button = new Button({ props: { type: "submit" } });

	return {
		c() {
			create_component(code0.$$.fragment);
			t0 = space();
			create_component(code1.$$.fragment);
			t1 = space();
			create_component(row0.$$.fragment);
			t2 = space();
			create_component(row1.$$.fragment);
			t3 = space();
			create_component(button.$$.fragment);
		},
		m(target, anchor) {
			mount_component(code0, target, anchor);
			insert(target, t0, anchor);
			mount_component(code1, target, anchor);
			insert(target, t1, anchor);
			mount_component(row0, target, anchor);
			insert(target, t2, anchor);
			mount_component(row1, target, anchor);
			insert(target, t3, anchor);
			mount_component(button, target, anchor);
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
			transition_in(button.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(code0.$$.fragment, local);
			transition_out(code1.$$.fragment, local);
			transition_out(row0.$$.fragment, local);
			transition_out(row1.$$.fragment, local);
			transition_out(button.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(code0, detaching);
			if (detaching) detach(t0);
			destroy_component(code1, detaching);
			if (detaching) detach(t1);
			destroy_component(row0, detaching);
			if (detaching) detach(t2);
			destroy_component(row1, detaching);
			if (detaching) detach(t3);
			destroy_component(button, detaching);
		}
	};
}

function create_fragment$n(ctx) {
	let current;

	const form = new Form({
			props: {
				createForm: ctx.createForm,
				title: "Confirm password",
				$$slots: { default: [create_default_slot$d] },
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

function instance$n($$self, $$props, $$invalidate) {
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

	const jsCode = `const { createEntry, createForm } = createValidation({ validateOnEvents: { input: true } });
  const [ errorsF1, valueF1, inputF1 ] = createEntry({
    type: 'string', min: 6, match: /\d+/
  });

  const [ errorsF2, valueF2, inputF2 ] = createEntry({
    type: 'string', required: true, equal: (value) => {
    return value === $valueF1;
  }
});`;

	const htmlCode = `<input use:inputF1 bind:value={$valueF1} />
{#if $errorsF1.includes('min')}At least 6 symbols{/if}
{#if $errorsF1.includes('match')}TUse at one digit{/if}

<input use:inputF2 bind:value={$valueF2} />
{#if $errorsF2.includes('required')}This field is required{/if}
{#if $errorsF2.includes('equal')}Should be equal with second one{/if}`;

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
		jsCode,
		htmlCode,
		$valueF1,
		$valueF2,
		input_input_handler,
		input_input_handler_1
	};
}

class Field_confirm extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$n, create_fragment$n, safe_not_equal, {});
	}
}

/* src/docs/examples/dynamic-steps.svelte generated by Svelte v3.15.0 */

function create_else_block$6(ctx) {
	let p;

	return {
		c() {
			p = element("p");
			p.textContent = "SUCCESS";
		},
		m(target, anchor) {
			insert(target, p, anchor);
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(p);
		}
	};
}

// (57:23) 
function create_if_block_1$8(ctx) {
	let t;
	let current;

	const row = new Row({
			props: {
				$$slots: { default: [create_default_slot_4$1] },
				$$scope: { ctx }
			}
		});

	const button = new Button({
			props: {
				type: "submit",
				$$slots: { default: [create_default_slot_3$2] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(row.$$.fragment);
			t = space();
			create_component(button.$$.fragment);
		},
		m(target, anchor) {
			mount_component(row, target, anchor);
			insert(target, t, anchor);
			mount_component(button, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const row_changes = {};

			if (changed.$$scope || changed.$step2Value) {
				row_changes.$$scope = { changed, ctx };
			}

			row.$set(row_changes);
			const button_changes = {};

			if (changed.$$scope) {
				button_changes.$$scope = { changed, ctx };
			}

			button.$set(button_changes);
		},
		i(local) {
			if (current) return;
			transition_in(row.$$.fragment, local);
			transition_in(button.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(row.$$.fragment, local);
			transition_out(button.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(row, detaching);
			if (detaching) detach(t);
			destroy_component(button, detaching);
		}
	};
}

// (51:2) {#if step === 0}
function create_if_block$9(ctx) {
	let t;
	let current;

	const row = new Row({
			props: {
				$$slots: { default: [create_default_slot_2$7] },
				$$scope: { ctx }
			}
		});

	const button = new Button({
			props: {
				type: "submit",
				$$slots: { default: [create_default_slot_1$b] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(row.$$.fragment);
			t = space();
			create_component(button.$$.fragment);
		},
		m(target, anchor) {
			mount_component(row, target, anchor);
			insert(target, t, anchor);
			mount_component(button, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			const row_changes = {};

			if (changed.$$scope || changed.$step1Value) {
				row_changes.$$scope = { changed, ctx };
			}

			row.$set(row_changes);
			const button_changes = {};

			if (changed.$$scope) {
				button_changes.$$scope = { changed, ctx };
			}

			button.$set(button_changes);
		},
		i(local) {
			if (current) return;
			transition_in(row.$$.fragment, local);
			transition_in(button.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(row.$$.fragment, local);
			transition_out(button.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(row, detaching);
			if (detaching) detach(t);
			destroy_component(button, detaching);
		}
	};
}

// (58:4) <Row>
function create_default_slot_4$1(ctx) {
	let input;
	let step2Input_action;
	let t;
	let current;
	let dispose;

	const error = new Error$1({
			props: {
				errors: ctx.step2Errors,
				errorCode: "required"
			}
		});

	return {
		c() {
			input = element("input");
			t = space();
			create_component(error.$$.fragment);
			attr(input, "class", "input-text");
			attr(input, "placeholder", "type: 'string', required: true");
			dispose = listen(input, "input", ctx.input_input_handler_1);
		},
		m(target, anchor) {
			insert(target, input, anchor);
			set_input_value(input, ctx.$step2Value);
			step2Input_action = ctx.step2Input.call(null, input) || ({});
			insert(target, t, anchor);
			mount_component(error, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			if (changed.$step2Value && input.value !== ctx.$step2Value) {
				set_input_value(input, ctx.$step2Value);
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
			if (step2Input_action && is_function(step2Input_action.destroy)) step2Input_action.destroy();
			if (detaching) detach(t);
			destroy_component(error, detaching);
			dispose();
		}
	};
}

// (62:4) <Button type="submit">
function create_default_slot_3$2(ctx) {
	let t;

	return {
		c() {
			t = text("Submit");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (52:4) <Row>
function create_default_slot_2$7(ctx) {
	let input;
	let step1Input_action;
	let t;
	let current;
	let dispose;

	const error = new Error$1({
			props: {
				errors: ctx.step1Errors,
				errorCode: "required"
			}
		});

	return {
		c() {
			input = element("input");
			t = space();
			create_component(error.$$.fragment);
			attr(input, "class", "input-text");
			attr(input, "placeholder", "type: 'string', required: true");
			dispose = listen(input, "input", ctx.input_input_handler);
		},
		m(target, anchor) {
			insert(target, input, anchor);
			set_input_value(input, ctx.$step1Value);
			step1Input_action = ctx.step1Input.call(null, input) || ({});
			insert(target, t, anchor);
			mount_component(error, target, anchor);
			current = true;
		},
		p(changed, ctx) {
			if (changed.$step1Value && input.value !== ctx.$step1Value) {
				set_input_value(input, ctx.$step1Value);
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
			if (step1Input_action && is_function(step1Input_action.destroy)) step1Input_action.destroy();
			if (detaching) detach(t);
			destroy_component(error, detaching);
			dispose();
		}
	};
}

// (56:4) <Button type="submit">
function create_default_slot_1$b(ctx) {
	let t;

	return {
		c() {
			t = text("Next step");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (23:0) <Form {createForm} createFormOpts={{ onSuccess }} title="Dynamic steps">
function create_default_slot$e(ctx) {
	let t0;
	let t1;
	let p;
	let t2;
	let t3_value = ctx.step + 1 + "";
	let t3;
	let t4;
	let current_block_type_index;
	let if_block;
	let if_block_anchor;
	let current;

	const code0 = new Code({
			props: {
				code: `const { createEntries, createForm } = createValidation({ validateOnEvents: { input: true } });
const [
  [ step1Errors, step1Value, step1Input ],
  [ step2Errors, step2Value, step2Input ]
] = createEntries([
  { type: 'string', required: true },
  { type: 'string', required: true },
]);

let step = 0;

const onSuccess = () => step++;`
			}
		});

	const code1 = new Code({
			props: {
				code: `<form use:createForm={{ onSuccess }}>
  <p>current step is #{step+1}</p>
  {#if step === 0}
    <input use:step1Input bind:value={$step1Value} />
    {#if $step1Errors.includes('required')}This field is required{/if}
    <button type="submit">Next step</button>
  {:else if step === 1}
    <input use:step2Input bind:value={$step2Value} />
    {#if $step2Errors.includes('required')}This field is required{/if}
    <button type="submit">Submit</button>
  {:else}
    <p>SUCCESS</p>
  {/if}
</form>`
			}
		});

	const if_block_creators = [create_if_block$9, create_if_block_1$8, create_else_block$6];
	const if_blocks = [];

	function select_block_type(changed, ctx) {
		if (ctx.step === 0) return 0;
		if (ctx.step === 1) return 1;
		return 2;
	}

	current_block_type_index = select_block_type(null, ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			create_component(code0.$$.fragment);
			t0 = space();
			create_component(code1.$$.fragment);
			t1 = space();
			p = element("p");
			t2 = text("current step is #");
			t3 = text(t3_value);
			t4 = space();
			if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			mount_component(code0, target, anchor);
			insert(target, t0, anchor);
			mount_component(code1, target, anchor);
			insert(target, t1, anchor);
			insert(target, p, anchor);
			append(p, t2);
			append(p, t3);
			insert(target, t4, anchor);
			if_blocks[current_block_type_index].m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(changed, ctx) {
			if ((!current || changed.step) && t3_value !== (t3_value = ctx.step + 1 + "")) set_data(t3, t3_value);
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
			transition_in(code0.$$.fragment, local);
			transition_in(code1.$$.fragment, local);
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(code0.$$.fragment, local);
			transition_out(code1.$$.fragment, local);
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			destroy_component(code0, detaching);
			if (detaching) detach(t0);
			destroy_component(code1, detaching);
			if (detaching) detach(t1);
			if (detaching) detach(p);
			if (detaching) detach(t4);
			if_blocks[current_block_type_index].d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

function create_fragment$o(ctx) {
	let current;

	const form = new Form({
			props: {
				createForm: ctx.createForm,
				createFormOpts: { onSuccess: ctx.onSuccess },
				title: "Dynamic steps",
				$$slots: { default: [create_default_slot$e] },
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

			if (changed.$$scope || changed.step || changed.$step1Value || changed.$step2Value) {
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

function instance$o($$self, $$props, $$invalidate) {
	let $step1Value;
	let $step2Value;
	const { createEntries, createForm } = createValidation({ validateOnEvents: { input: true } });
	const [[step1Errors, step1Value, step1Input], [step2Errors, step2Value, step2Input]] = createEntries([{ type: "string", required: true }, { type: "string", required: true }]);
	component_subscribe($$self, step1Value, value => $$invalidate("$step1Value", $step1Value = value));
	component_subscribe($$self, step2Value, value => $$invalidate("$step2Value", $step2Value = value));
	let step = 0;
	const onSuccess = e => $$invalidate("step", step++, step);

	function input_input_handler() {
		$step1Value = this.value;
		step1Value.set($step1Value);
	}

	function input_input_handler_1() {
		$step2Value = this.value;
		step2Value.set($step2Value);
	}

	return {
		createForm,
		step1Errors,
		step1Value,
		step1Input,
		step2Errors,
		step2Value,
		step2Input,
		step,
		onSuccess,
		$step1Value,
		$step2Value,
		input_input_handler,
		input_input_handler_1
	};
}

class Dynamic_steps extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$o, create_fragment$o, safe_not_equal, {});
	}
}

/* src/docs/docs.svelte generated by Svelte v3.15.0 */

function add_css$c() {
	var style = element("style");
	style.id = "svelte-1edyv9o-style";
	style.textContent = "@import url('https://fonts.googleapis.com/css?family=Open+Sans&display=swap');.tabs{border-bottom:5px solid #dcefff;display:flex;margin-bottom:20px;position:relative}.tabs--bar{background:#004cb4;height:5px;left:0;position:absolute;top:100%;transition:.5s transform cubic-bezier(0.86, 0, 0.07, 1);width:50%}.tabs--button{background:none;border:0;cursor:pointer;flex:1;font-size:20px;line-height:20px;outline:none;padding:20px;text-transform:uppercase}.tabs--button:hover{color:#004cb4}.tabs--button:disabled{color:#004cb4}.logo{color:inherit;cursor:pointer;display:block;font-size:18px;line-height:22px;margin:10px auto 20px;max-width:260px;text-decoration:none;text-align:center}.logo img{display:block;max-width:100%}.logo:hover{color:#004cb4}.docs{padding-bottom:300px}h1{color:#004cb4;font-size:24px;line-height:28px;margin-bottom:.5em;overflow:hidden;text-transform:uppercase}.input-text,select{border:1px solid #333;border-radius:3px;font-size:14px;height:40px;line-height:18px;outline:0;padding:5px 10px;width:100%}select{height:auto;line-height:inherit;padding:5px}.input-text:focus,select:focus{border-color:#004cb4;box-shadow:0 0 3px #004cb4}.input-choice{display:inline-block;margin:4px 10px 0 0;vertical-align:top}.cells{display:flex;flex-wrap:wrap;align-content:flex-start;align-items:flex-start;margin-top:-10px;padding:10px;justify-content:center}.cells > *{background:#fff;border:1px solid #bbb;box-shadow:0 0 5px #bbb;border-radius:3px;cursor:pointer;margin:10px 5px 0;overflow:hidden;padding:5px;text-align:center;width:150px}.cells input{display:block;margin:0 auto 5px}code{outline:0}";
	append(document.head, style);
}

// (38:0) {#if !transitionActive}
function create_if_block$a(ctx) {
	let div;
	let current_block_type_index;
	let if_block;
	let div_transition;
	let current;
	let dispose;
	const if_block_creators = [create_if_block_1$9, create_else_block$7];
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
			attr(div, "class", "docs");
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

// (56:4) {:else}
function create_else_block$7(ctx) {
	let current;
	const editor = new Builder({});

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

// (44:4) {#if pageId === 0}
function create_if_block_1$9(ctx) {
	let t0;
	let t1;
	let t2;
	let t3;
	let t4;
	let t5;
	let t6;
	let t7;
	let t8;
	let t9;
	let current;
	const string = new String$1({});
	const email = new Email({});
	const number = new Number({});
	const boolean = new Boolean$1({});
	const array = new Array$1({});
	const required = new Required({});
	const match = new Match({});
	const equal = new Equal({});
	const dynamicsteps = new Dynamic_steps({});
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
			create_component(dynamicsteps.$$.fragment);
			t8 = space();
			create_component(arraysumofpoints.$$.fragment);
			t9 = space();
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
			mount_component(dynamicsteps, target, anchor);
			insert(target, t8, anchor);
			mount_component(arraysumofpoints, target, anchor);
			insert(target, t9, anchor);
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
			transition_in(dynamicsteps.$$.fragment, local);
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
			transition_out(dynamicsteps.$$.fragment, local);
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
			destroy_component(dynamicsteps, detaching);
			if (detaching) detach(t8);
			destroy_component(arraysumofpoints, detaching);
			if (detaching) detach(t9);
			destroy_component(fieldconfirm, detaching);
		}
	};
}

function create_fragment$p(ctx) {
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
	let if_block = !ctx.transitionActive && create_if_block$a(ctx);

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
			t4 = text("Builder");
			t5 = space();
			i = element("i");
			t6 = space();
			if (if_block) if_block.c();
			if_block_anchor = empty();
			attr(a, "href", "//github.com/yazonnile/svelidation");
			attr(a, "class", "logo");
			attr(button0, "class", "tabs--button");
			button0.disabled = button0_disabled_value = ctx.pageId === 0;
			attr(button1, "class", "tabs--button");
			button1.disabled = button1_disabled_value = ctx.pageId === 1;
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

			if (!current || changed.pageId && button1_disabled_value !== (button1_disabled_value = ctx.pageId === 1)) {
				button1.disabled = button1_disabled_value;
			}

			if (!current || changed.barId && i_style_value !== (i_style_value = `transform: translateX(${100 * ctx.barId}%)`)) {
				attr(i, "style", i_style_value);
			}

			if (!ctx.transitionActive) {
				if (if_block) {
					if_block.p(changed, ctx);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block$a(ctx);
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

function instance$p($$self, $$props, $$invalidate) {
	let barId = 0;
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
		if (!document.getElementById("svelte-1edyv9o-style")) add_css$c();
		init(this, options, instance$p, create_fragment$p, safe_not_equal, {});
	}
}

new Docs({ target: document.getElementById('app') });
