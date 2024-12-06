declare namespace cc {
    interface Node {
        findChild(path: string): cc.Node | null

        setLabelText(text: string): cc.Node

        setLocaleKey(key: string, context?: any): cc.Node

        setSpriteFrame(path: string, onComplete?: Function): void

        onClick<T, T1>(callback: (node?: cc.Node, userData?: T1) => void, target?: T, userData?: T1): void;

        getComponentInParent<T extends cc.Component>(type: { prototype: T }): T;

        getOrAdd<T extends cc.Component>(type: { prototype: T }): T;

        select(selected: boolean): cc.Node

        fadeIn(t: number): void
        fadeOut(t: number): void
        fadeOutAndDestroy(t: number): void

        getLocalMinX(): number
        getLocalMaxX(): number
        getLocalMaxY(): number
        getLocalMinY(): number
    }

    interface Sprite {
        setSpriteFrame(path: string, onComplete?: Function): void
    }
}

declare namespace cc.AssetManager {
    interface Bundle {
        getOrLoad<T extends cc.Asset>(paths: string, type: { prototype: T }, onComplete?: (error: Error, assets: T) => void): void;
    }
}

cc.Node.prototype.findChild = function (path: string): cc.Node | null {
    return cc.find(path, this)
}

cc.Node.prototype.setLabelText = function (text: string) {
    let label: cc.Label | cc.RichText = this.getComponent(cc.Label)
    if (label) {
        label.string = text
    } else {
        label = this.getComponent(cc.RichText)
        if (label) {
            label.string = text
        }
    }
    return this
}

cc.Node.prototype.getComponentInParent = function <T extends cc.Component>(type: { prototype: T }): T {

    for (let node = this; node && node.isValid && !(node instanceof cc.Scene); node = node.parent) {
        const comp = node.getComponent(type);
        if (comp) {
            return comp;
        }
    }

    return null;
}

cc.Node.prototype.getOrAdd = function <T extends cc.Component>(type: new () => T): T {
    return this.getComponent(type) || this.addComponent(type);
}

cc.Node.prototype.select = function (selected: boolean): cc.Node {
    const selectedNode = this.findChild("selected")
    if (selectedNode) {
        selectedNode.active = selected
    }
    return this
}

cc.Node.prototype.fadeIn = function (t: number): void {
    this.active = true;
    this.opacity = 0;
    cc.tween(this).to(t, { opacity: 255 }).start();
}

cc.Node.prototype.fadeOut = function (t: number): void {
    cc.tween(this).to(t, { opacity: 0 }).call(() => this.active = false).start();
}

cc.Node.prototype.fadeOutAndDestroy = function (t: number): void {
    cc.tween(this).to(t, { opacity: 0 }).call(this.destroy, this).start();
}

cc.Node.prototype.getLocalMinX = function (): number {
    return -this.width * this.anchorX;
}

cc.Node.prototype.getLocalMaxX = function (): number {
    return this.width * (1 - this.anchorX)
}

cc.Node.prototype.getLocalMaxY = function (): number {
    return this.height * (1 - this.anchorY);
}
cc.Node.prototype.getLocalMinY = function (): number {
    return -this.height * this.anchorY;
}