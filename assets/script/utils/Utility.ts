declare namespace cc {
    interface Node {
        findChild(path: string): cc.Node | null

        setLabelText(text: string, forceUpdateRenderData?): cc.Node

        setSpriteFrame(frame: cc.SpriteFrame): cc.Node

        findComponent<T>(path: string, type: { new (): T }): T

        setLocaleKey(key: string, context?: any): cc.Node

        setLocalizeCallback(callback: () => string): cc.Node
    }
}

cc.Node.prototype.findChild = function (path: string): cc.Node | null {
    return cc.find(path, this)
}

cc.Node.prototype.setSpriteFrame = function (frame: cc.SpriteFrame) {
    let sprite = this.getComponent(cc.Sprite)
    if (sprite) {
        sprite.spriteFrame = frame
    }
    return this
}

cc.Node.prototype.setLabelText = function (text: string, forceUpdateRenderData = false) {
    let label: cc.Label | cc.RichText = this.getComponent(cc.Label)
    if (label) {
        label.string = text
        forceUpdateRenderData && _updateRenderData(label)
    } else {
        label = this.getComponent(cc.RichText)
        if (label) {
            label.string = text
            forceUpdateRenderData && _updateRenderData(label)
        }
    }
    return this
}

cc.Node.prototype.setLocaleKey = function (key: string, context?: any) {
    let localeLabel = this.getComponent("LocaleLabel")
    if (!localeLabel) {
        localeLabel = this.addComponent("LocaleLabel")
    }

    localeLabel.setKey(key, context)
    return this
}

cc.Node.prototype.setLocalizeCallback = function (callback: () => string) {
    let localeLabel = this.getComponent("LocaleLabel")
    if (!localeLabel) {
        localeLabel = this.addComponent("LocaleLabel")
    }

    localeLabel.setLocalizeCallback(callback)
    return this
}

function _updateRenderData(label: cc.Label | cc.RichText) {
    if (label.node.active && label.enabled) {
        //@ts-ignore
        if (label._forceUpdateRenderData) {
            //@ts-ignore
            label._forceUpdateRenderData()
        }
    }
}
