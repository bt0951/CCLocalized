import ListView from "../ui/ListView";
import { ReactiveEffect } from "./reactive";

export type PropNames<T> = { [K in keyof T]: K }[keyof T];

export type KeysMatching<T, V> = { [K in keyof T]: T[K] extends V ? K : never }[keyof T];

export type NonFunctionPropNames<T> = {
    [K in keyof T]: T[K] extends Function ? never : K
}[keyof T];

type BindingView = cc.Component & { _context?: Binder; _bindingPath?: PropertyKey[]; _bindProperty?: any };

type Toggle = cc.Toggle & { _onToggle?: ((check: boolean) => void) | PropertyKey } & BindingView;
type EditBox = cc.EditBox & { _onEditEnd?: ((text: string) => void) | PropertyKey } & BindingView;
type Button = cc.Button & { _onClick?: (() => void) | PropertyKey } & BindingView;
type List = ListView & { _itemCallback?: (node: cc.Node, item: any, index?: number) => void } & BindingView;
function getBindingValue(ui: BindingView) {
    const { _context, _bindingPath } = ui;
    let data = _context.data;
    for (let i = 0; i < _bindingPath.length; i++) {
        const p = _bindingPath[i];
        if (typeof p === "undefined") {
            break;
        }
        data = data?.[p];
    }
    return data;
}

function getEffect(ui: (cc.Node | cc.Component) & { _effect?: ReactiveEffect }) {
    let effect = ui._effect;
    return effect;
}

function makeEffect(ui: cc.Component & { _effect?: ReactiveEffect }, func: (owner: any) => void) {
    // console.error("make effect ", effect.id);
    let effect = ui._effect = new ReactiveEffect(func, ui);
    return effect;
}


function setBindingValue(ui: BindingView, value: unknown) {
    const { _context, _bindingPath } = ui;
    let data = _context.data;
    for (let i = 0; i < _bindingPath.length - 1; i++) {
        data = data[_bindingPath[i]];
    }
    data[_bindingPath[_bindingPath.length - 1]] = value;
}

function stopEffect(effect: ReactiveEffect) {
    effect.stop();
}

function startEffect(effect: ReactiveEffect) {
    effect.start();
}

function setProperty<T extends BindingView>(view: T) {
    const key: PropNames<T> = view._bindProperty;
    view[key] = getBindingValue(view);
}

function setLabelText(label: cc.Label | EditBox) {
    label.string = `${getBindingValue(label)}`
}

function setToggleIsChecked(toggle: Toggle) {
    toggle.isChecked = !!getBindingValue(toggle)
}

function setSpriteFill(sprite: cc.Sprite) {
    sprite.fillRange = getBindingValue(sprite)
}

function setListCount(listView: ListView) {
    listView.itemCount = getBindingValue(listView)?.length ?? 0;
}

function setDummy() {

}

function onEditingDidEnded(editBox: EditBox) {
    const text = editBox.string;
    if (editBox._onEditEnd) {
        if (typeof editBox._onEditEnd == "function") {
            editBox._onEditEnd(text);
        }
    }
    else {
        setBindingValue(editBox, text);
    }
}

function onToggleChanged(toggle: Toggle) {
    const data = toggle._context.data;
    const isOn = toggle.isChecked;
    if (toggle._onToggle) {
        if (typeof toggle._onToggle == "function") {
            toggle._onToggle(isOn);
        }
        else {
            data[toggle._onToggle](isOn);
        }
    }
    else {
        setBindingValue(toggle, isOn);
    }
}

function onButtonClicked(button: Button) {
    if (button._onClick) {
        if (typeof button._onClick == "function") {
            button._onClick();
        }
        else {
            button._context.data[button._onClick]();
        }
    }
}

export class Binder<DataSource = any> {
    private effects: Set<ReactiveEffect> = new Set();

    constructor(public data: DataSource) {

    }

    private _add(effect: ReactiveEffect) {
        if (effect.active) {
            effect.stop();
        }
        effect.start();
        this.effects.add(effect);
        return this;
    }

    private _remove(effect: ReactiveEffect) {
        effect.stop();
        this.effects.delete(effect);
    }

    start() {
        this.effects.forEach(startEffect);
    }

    stop() {
        this.effects.forEach(stopEffect);
    }

    _rebind(data: DataSource) {
        if (this.data != data) {
            if (this.data) {
                this._unbind();
            }
            this.data = data;
        }
        return this;
    }

    _unbind() {
        this.stop();
        this.effects.clear();
        this.data = null;
    }

    bind(handler: (data: DataSource) => void) {
        const effect = new ReactiveEffect(() => handler(this.data));
        return this._add(effect);
    }

    private setBindingPath(text: cc.Component & { _bindingPath?: PropertyKey[], _context?: any }, ...bindingPath: PropertyKey[]) {
        text._bindingPath = [...bindingPath];
        text._context = this;
    }

    setBinding<T extends BindingView, K extends PropNames<T>, P extends KeysMatching<DataSource, T[K]>>(comp: T, bindProperty: K, path: P) {
        this.setBindingPath(comp, path);
        comp._bindProperty = bindProperty;
        const effect = getEffect(comp) || makeEffect(comp, setProperty);
        return this._add(effect);
    }

    bindLabel<P extends PropNames<DataSource>, P1 extends PropNames<DataSource[P]>, P2 extends PropNames<DataSource[P][P1]>, P3 extends PropNames<DataSource[P][P1][P2]>>(label: cc.Label | cc.RichText, property: P, property1?: P1, property2?: P2, property3?: P3) {
        this.setBindingPath(label, property, property1, property2, property3);
        const effect = getEffect(label) || makeEffect(label, setLabelText);

        return this._add(effect);
    }

    bindEditBox<P extends PropNames<DataSource>>(editBox: EditBox, property: P, onEndEdit?: (v: string) => void) {
        this.setBindingPath(editBox, property);
        let effect = getEffect(editBox)
        if (!effect) {
            effect = makeEffect(editBox, setLabelText);
            editBox.node.on('editing-did-ended', onEditingDidEnded);
        }

        editBox._onEditEnd = onEndEdit;
        return this._add(effect);
    }

    bindToggle<K extends KeysMatching<DataSource, boolean>, E extends KeysMatching<DataSource, (b: boolean) => void>>(toggle: Toggle, prop: K, onToggle?: E | ((v: boolean) => void)) {
        this.setBindingPath(toggle, prop);
        let effect = getEffect(toggle);
        if (!effect) {
            effect = makeEffect(toggle, setToggleIsChecked);
            toggle.node.on("toggle", onToggleChanged);
        }
        toggle._onToggle = onToggle;
        return this._add(effect);
    }

    bindButton<K extends KeysMatching<DataSource, () => void>>(button: Button, onClick: K | (() => void)) {
        this.setBindingPath(button, "");
        let effect = getEffect(button);
        if (!effect) {
            effect = makeEffect(button, () => { });
            button.node.on("click", onButtonClicked);
        }
        button._onClick = onClick;
        return this._add(effect);
    }

    bindListView<T, K extends KeysMatching<DataSource, T[]>>(listView: List, prop: K, itemCallback: (node: cc.Node, data: T, index?: number) => void) {
        this.setBindingPath(listView, prop);
        let effect = getEffect(listView);
        if (!effect) {
            effect = makeEffect(listView, setListCount);
            listView.itemCallback = (node, i) => {
                const data = getBindingValue(listView);
                listView._itemCallback(node, data[i], i);
            }
        }
        listView._itemCallback = itemCallback;
        return this._add(effect);
    }
}