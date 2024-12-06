import { View } from "../binding/View";
import { instantiate } from "../res-utils";
import { loadConfigAsync } from "../../launch/ConfigLoader";
import Blur from "./Blur";
import AssetScope from "../AssetScope";
import UIBehaviour from "./UIBehaviour";

const { ccclass, property } = cc._decorator;

const duration = 0.16;

const pools: Map<string, cc.NodePool> = new Map();

function getNodeFromPool(path: string) {
    return pools.get(path)?.get();
}

function putNodeToPool(path: string, node: cc.Node) {
    let pool = pools.get(path);
    if (!pool) {
        pool = new cc.NodePool();
        pools.set(path, pool);
    }
    pool.put(node);
}

/**
 *  基于栈的UI状态管理，UI脚本继承UIBase来实现各自的逻辑
 */
@ccclass
export abstract class UIView<M = any> extends View<M> {
    @property(cc.Node)
    private mask: cc.Node = null;

    @property(cc.Node)
    private container: cc.Node = null;

    @property
    private blurBackground = false;

    @property
    private modal = false;

    /**能不能放回pool重用 */
    protected get reusable() {
        return false;
    }

    /**
     * 是否是模态UI。弹出框
     */
    get isModal(): boolean {
        return this.modal;
    }

    /**
     * children stack
     */
    protected children: UIView[] = [];


    get current(): UIView {
        return this.children[this.children.length - 1];
    }

    private _parent: UIView = null;

    private _loadingToken: { canceled: boolean } = null;
    public uiPath: string;
    /**
     * 父状态
     */
    public get parent(): UIView {
        return this._parent;
    }

    public get root(): UIView {
        let r = this;
        while (r.parent) {
            r = r.parent as any;
        }
        return r;
    }

    private set parent(p: UIView) {
        this._parent = p;
    }

    private enter(...args: any[]) {
        const node = this.node;
        node.active = true;
        this.enabled = true;
        this.onEnter(...args);

        if (this.mask) {
            this.mask.opacity = 0.1;
            this.mask.runAction(cc.fadeTo(0.2, 100));
        }

        const behaviours = this.getComponents(UIBehaviour);
        behaviours.forEach(x => x.onEnter());
    }

    private exit() {
        const ui = this;
        ui.parent = null;
        ui.enabled = false;
        ui.onExit();
        const behaviours = this.getComponents(UIBehaviour)
        Promise.all(behaviours.map(b => b.onExit())).then(() => this._finish());
    }

    private _finish() {
        this.node.active = false;
        if (this.uiPath && this.reusable) {
            putNodeToPool(this.uiPath, this.node);
        }
        else {
            this.node.destroy();
        }
    }

    private resume() {
        this.node.active = true;
        this.enabled = true;
        this.onResume();
    }

    private pause() {
        this.node.active = false;
        this.onPause();
    }

    private _pop(ui: UIView) {
        if (this.current === ui) {
            this.children.pop();
            ui.exit();
        }
        else {
            console.error("弹出的UI 不是当前UI")
        }
    }

    protected pop(ui: UIView) {
        this._pop(ui);
        const current = this.current;
        if (current && (!ui.isModal)) {
            current.resume();
        }
    }

    private push<T extends UIView>(ui: T, ...args: any[]) {
        ui.parent = this;
        this.children.push(ui);
        ui.node.setParent(this.container || this.node);
        ui.node.setPosition(0, 0);
        ui.enter(...args);
        return ui;
    }

    private loadUi<T extends UIView>(path: string, callback: (ui?: T) => void): void {
        if (CC_DEBUG) {
            if (!globalThis._config) {
                loadConfigAsync({
                    onComplete: cfg => {
                        globalThis._config = cfg;
                        this._loadUi<T>(path, callback);
                    }
                });
                return;
            }
        }
        this._loadUi<T>(path, callback);
    }

    private _loadUi<T extends UIView>(path: string, callback: (ui?: T) => void) {
        const node = getNodeFromPool(path);
        if (node) {
            const ui = this._initUIViewNode(path, node);
            callback(ui as T);
            return;
        }
        if (this._loadingToken) {
            this._loadingToken.canceled = true;
        }
        //需要保证加载回调匹配的是当前这个加载的ui
        let loadingToken = this._loadingToken = { canceled: false };
        instantiate("prefab/ui/" + path, null, (err, node, prefab) => {
            if (err) {
                console.warn("加载ui失败" + path, err);
                callback();
            }
            else {
                if (!this.isValid || loadingToken.canceled) {
                    node.destroy();
                    console.warn("加载已经取消，销毁 UI Node ", path);
                    callback();
                    return;
                }
                AssetScope.getScope(this.node).addAsset(prefab);

                const ui = this._initUIViewNode(path, node);

                callback(ui as T);
            }
        });
    }

    private _initUIViewNode(path: string, node: cc.Node) {
        const ui = node.getComponent(UIView);
        if (ui.isModal && ui.blurBackground) {
            const blurNode = Blur.createBlur();
            node.addChild(blurNode, -1);
            blurNode.opacity = 0;
            blurNode.runAction(cc.fadeIn(duration));
        }

        ui.uiPath = path;
        return ui;
    }

    popToRoot() {
        while (this.children.length > 1) {
            this._pop(this.current);
        }
        const current = this.current;
        if (current) {
            current.resume();
        }
    }

    preloadUi(path: string) {
        return new Promise<void>((resolve) => {
            cc.resources.preload("prefab/ui/" + path, cc.Prefab, () => resolve())
        })
    }

    /**
     * 外部调用函数， 改变当前栈顶的UI
     * @param UI 
     * @param path 
     */
    changeUi<T extends UIView>(path: string, ...args: Parameters<T['onEnter']>) {
        this.loadUi<T>(path, ui => {
            if (ui) {
                if (this.current) {
                    this._pop(this.current);
                }
                this.push(ui, ...args)
            }
        });
    }

    /**
     * 推入新的UI到栈顶
     * @param UI 
     * @param path 
     */
    pushUi<T extends UIView>(path: string, ...args: Parameters<T['onEnter']>) {
        this.loadUi<T>(path, ui => {
            if (ui) {
                let current = this.current;
                if (current && (!ui.isModal)) {
                    current.pause();
                }
                this.push(ui, ...args);
            }
        })
    }

    /**
     * 关闭当前栈顶UI
     */
    back() {
        const parent = this.parent;
        if (parent) {
            parent.pop(this);
        }
        else {
            this.exit();
        }
    }

    close() {
        this.back();
    }

    blockInputEvents() {
        const node = new cc.Node("_Block Input");
        node.setContentSize(this.node.width, this.node.height);
        this.node.addChild(node);
        node.addComponent(cc.BlockInputEvents);
    }

    unblockInputEvents() {
        const node = this.node.findChild("_Block Input");
        if (node) {
            node.destroy();
        }
    }

    /**在组件面板里面拖拽的事件 */
    $change(_: any, path: string, ...args: any[]) {
        this.changeUi(path, ...args);
    }
    /**同上 */
    $push(_: any, path: string, ...args: any[]) {
        this.pushUi(path, ...args);
    }

    //////////////////////////////////////
    // 子类型override生命周期函数实现自己的逻辑
    //////////////////////////////////////

    /**
     * UI关闭，父栈弹出UI时，调用栈顶的UI停止
     */
    protected onExit() { }

    /**
     * UI加载完毕开始
     */
    public onEnter(...args: any[]) { }

    /**
     *  当父栈的栈顶UI弹出后，新的栈顶UI调用恢复
     */
    protected onResume() { }

    /**
     *  当新的UI推入父栈的时候调用栈顶的UI暂停
     */
    protected onPause() { }
}