import { Model } from "../../game/model/Model";
import { Binder } from "./binding";
const { ccclass, property } = cc._decorator;

export interface EventCenter {
    on(event: string, listener: (...args: any[]) => void): EventCenter;
}

function invoke(f: () => void) {
    f();
}
/**
 * 可绑定UI视图，需继承自该类，并实现onBind函数来手动绑定数据和UI。
 */
@ccclass
export abstract class View<DataSource> extends cc.Component {

    get model(): Model {
        //@ts-ignore
        return globalThis.getModel();
    }

    protected binder: Binder<DataSource>;

    get dataSource(): DataSource {
        if (this.binder) {
            return this.binder.data;
        }
        return null;
    }

    /**
     * 设置绑定数据源
     */
    set dataSource(data: DataSource) {
        if (this.dataSource != data) {
            const binder = this.bind(data);
            if (data && typeof data === "object") {
                this.onBind(binder);
            }
        }
    }

    /**
     * 需要子类中实现onBind函数，来添加数据和UI的绑定关系。
     * @param binder 
     */
    protected onBind(binder: Binder<DataSource>) { }

    /**
     * 添加全局事件监听器
     */
    protected doAddListener(eventCenter: EventCenter): void { }

    protected unregisters: (() => void)[] = []
    protected on(evt: string, listener: (...args: any[]) => void) {
        cc.game.on(evt, listener, this);
        this.unregisters.push(() => cc.game.off(evt, listener, this));
        return this;
    }

    protected emit(event: string, ...args: any[]) {
        cc.game.emit(event, ...args);
    }

    protected removeAllListeners() {
        this.unregisters.forEach(invoke);
        this.unregisters.length = 0;
    }

    private bind(data: DataSource) {
        if (!this.binder) {
            return this.binder = new Binder(data);
        }
        else {
            return this.binder._rebind(data);
        }
    }

    private unbind() {
        if (this.binder) {
            this.binder._unbind();
        }
    }

    protected onDestroy() {
        this.unbind();
        this.removeAllListeners();
    }

    protected onEnable() {
        this.binder?.start();
        this.doAddListener(this as any);
    }

    protected onDisable() {
        this.binder?.stop();
        this.removeAllListeners();
    }
}