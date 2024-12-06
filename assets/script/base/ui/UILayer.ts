

import { UIView } from './UIView';

const { property, ccclass, menu } = cc._decorator;
const layers: Map<string, UILayer> = new Map();

@ccclass
@menu("UI/UILayer")
export default class UILayer extends UIView {
    @property
    defaultUiName: string = "";

    /**
     * children display queue
     */
    private displayQueue: (() => void)[] = [];

    protected override pop(ui: UIView<any>): void {
        super.pop(ui);

        if (this.displayQueue.length > 0) {
            this.displayQueue.shift();
        }
        this.displayNext();
    }

    protected displayNext() {
        if (this.displayQueue.length > 0) {
            const fn = this.displayQueue[0];
            fn();
        }
    }

    /**
     * 排队播放ui
     * @param uiPath 
     * @param args 
     */
    queueUi<T extends UIView>(uiPath: string, ...args: Parameters<T['onEnter']>) {
        this.displayQueue.push(() => this.pushUi(uiPath, ...args));
        if (this.displayQueue.length == 1) {
            this.displayNext();
        }
    }

    protected onLoad(): void {
        const nodeName = this.node.name;
        if (layers.has(nodeName)) {
            console.error("UI层 重复了", nodeName);
        }
        layers.set(nodeName, this);
        //@ts-ignore
        window.uiLayer = this;
    }

    protected start(): void {
        if (this.defaultUiName) {
            this.changeUi(this.defaultUiName);
        }
    }

    protected onDestroy(): void {
        super.onDestroy();
        const nodeName = this.node.name;
        const layer = layers.get(nodeName);
        if (layer === this) {
            layers.delete(nodeName);
        }
    }
}

export function getUiLayer(name?: string) {
    return layers.get(name ?? "RootLayer") || layers.get("RootLayer") || layers.get("Canvas");
}

export function getTipUiLayer() {
    return getUiLayer("TipLayer");
}

export function getDialogUiLayer() {
    return getUiLayer("DialogLayer");
}

export function getMiddleUiLayer(){
    return getUiLayer("MiddleLayer")
}