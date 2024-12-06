/**
 * vue js style reactive 
 */
/**
 * target to Proxy of target
 */
const reactiveMap = new WeakMap<object, any>()

/**
 * target -> subjects (key -> observers)
 */
const targetMap = new WeakMap<object, Map<PropertyKey, Set<ReactiveEffect>>>();

const effectStack: ReactiveEffect[] = [];
let activeEffect: ReactiveEffect | undefined;

const RAW_KEY = "__raw__";

const PROXY_KEY = "__proxy__";

const IS_RAW_KEY = "__skip_reactive__";

/**
 * 变量名是$开头的，不是reactive
 */
const RAW_PREFIX = "$";

export function toRaw<T>(observed: T): T {
    const raw = observed && (observed as any)[RAW_KEY];
    return raw ? toRaw(raw) : observed;
}

function isProxy<T>(proxy: T): boolean {
    const raw = proxy && (proxy as any)[PROXY_KEY];
    return raw;
}

const isArray = Array.isArray

const hasOwnProperty = Object.prototype.hasOwnProperty
const hasOwn = (val: object, key: PropertyKey): key is keyof typeof val => hasOwnProperty.call(val, key)

const isFunction = (val: unknown): val is Function => typeof val === 'function'
const isString = (val: unknown): val is string => typeof val === 'string'
const isSymbol = (val: unknown): val is symbol => typeof val === 'symbol'
const isObject = (val: unknown): val is Record<any, any> => val !== null && typeof val === 'object'

/**
 * 标记该对象不能reactive
 * @param target 
 */
export function markRaw(target: any) {
    target[IS_RAW_KEY] = true;
}

export const isIntegerKey = (key: unknown) =>
    isString(key) &&
    key !== 'NaN' &&
    key[0] !== '-' &&
    '' + parseInt(key, 10) === key;

type OperationType = "add" | "change" | "remove";

let nextId = 100;
export class ReactiveEffect {
    /**
     * reverse link to observer set,
     */
    deps: Set<Set<ReactiveEffect>> = new Set<Set<ReactiveEffect>>();

    public active: boolean = false;

    public id = nextId++;
    public scheduled: number;
    constructor(public fn: (owner?: any) => void, public owner?: any, public delay?: boolean) {

    }

    /**
     * start observe 
     */
    start() {
        if (!this.active) {
            this.active = true;
            run(this);

            this.deps.forEach(set => {
                set.add(this);
            });
        }
    }

    /**
     * stop observe
     */
    stop() {
        if (this.active) {
            this.active = false;
            this.deps.forEach(set => {
                set.delete(this);
            });
            this.deps.clear();
        }
    }
}

function notify(observer: ReactiveEffect, type?: OperationType, key?: PropertyKey, newValue?: unknown, oldValue?: unknown) {
    if (!observer.scheduled) {
        observer.scheduled = setTimeout(() => {
            observer.scheduled = 0;
            run(observer);
        }, 0);
    }
}

function run(observer: ReactiveEffect) {
    if (observer.active) {
        try {
            effectStack.push(activeEffect = observer);
            observer.fn(observer.owner);
        }
        finally {
            effectStack.pop();
            const n = effectStack.length;
            activeEffect = n > 0 ? effectStack[n - 1] : undefined;
        }
    }
}

/**
 * track target key event
 * @param target 
 * @param key 
 */
function track(target: object, key: PropertyKey) {
    if (activeEffect) {
        let subjects = targetMap.get(target);
        if (!subjects) {
            targetMap.set(target, (subjects = new Map()));
        }

        let observers = subjects.get(key);
        if (!observers) {
            subjects.set(key, (observers = new Set()));
        }

        /**
         * add observer to key subject
         */
        observers.add(activeEffect);
        if (!activeEffect.deps.has(observers)) {
            activeEffect.deps.add(observers);
        }
    }
}

/**
 * trigger target key event
 * @param target 
 * @param type 
 * @param key 
 * @param newValue 
 * @param oldValue 
 */
function trigger(target: object, type: OperationType, key: PropertyKey, newValue?: unknown, oldValue?: unknown) {
    const keyObservers = targetMap.get(target);
    if (!keyObservers) {
        return;
    }
    const set = keyObservers.get(key);
    let observers = new Set<ReactiveEffect>();
    if (set) {
        set.forEach(v => observers.add(v));
    }

    observers.forEach(observer => {
        notify(observer, type, key, newValue, oldValue);
    });

    if (type == "add") {
        if (isArray(target) && isIntegerKey(key)) {
            const set = keyObservers.get("length");
            if (set) {
                set.forEach(v => notify(v, "change", "length"));
            }
        }
    }
}

/**
 * make target reactive
 * @param target 
 */
export function reactive(target: object) {
    if (!isObject(target)) {
        return target;
    }

    if (target[IS_RAW_KEY]) {
        return toRaw(target);
    }

    if (isProxy(target)) {
        return target;
    }

    let proxy = reactiveMap.get(target);
    if (!proxy) {
        proxy = new Proxy(target, proxyHandler);
        reactiveMap.set(target, proxy);
    }

    return proxy;
}


const proxyHandler = {
    get(target: object, key: PropertyKey, receiver: object) {
        if (key === RAW_KEY) {
            return target;
        }
        if (key === PROXY_KEY) {
            return true;
        }

        const result = Reflect.get(target, key, receiver);
        if (!isFunction(result)) {
            track(target, key);
        }

        if (typeof key === 'string' && key.startsWith(RAW_PREFIX)) {
            return result;
        }

        if (isObject(result)) {
            return reactive(result);
        }
        return result;
    },

    set(target: object, key: PropertyKey, value: unknown, receiver: object) {
        value = toRaw(value);
        const oldValue = Reflect.get(toRaw(target), key, receiver);
        if (value === oldValue) {
            return true;
        }
        const hadKey =
            (Array.isArray(target) && isIntegerKey(key))
                ? Number(key) < target.length
                : Reflect.has(target, key);
        const result = Reflect.set(target, key, toRaw(value));
        if (hadKey) {
            trigger(target, "change", key, value, oldValue);
        }
        else {
            trigger(target, "add", key, value);
        }
        return result;
    },

    deleteProperty(target: object, key: PropertyKey): boolean {
        const hadKey = Reflect.has(target, key);
        const oldValue = Reflect.get(target, key);
        const result = Reflect.deleteProperty(target, key);
        if (result && hadKey) {
            trigger(target, "remove", key, undefined, oldValue);
        }
        return result;
    },

    has(target: object, key: PropertyKey): boolean {
        const result = Reflect.has(target, key);

        track(target, key);

        return result;
    }
}

// //@ts-ignore
// window.Observer = ReactiveEffect;
if (CC_DEBUG) {
    //@ts-ignore
    globalThis.reactive = {
        reactive,
        reactiveMap,
        targetKeyObservers: targetMap
    }
}