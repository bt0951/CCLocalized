import { eventCenter } from "../utils/EventCenter"
import { localize } from "../utils/i18n"

const { ccclass, property, menu } = cc._decorator

@ccclass
@menu("本地化/LocaleLabel")
export default class LocaleLabel extends cc.Component {
    @property()
    key: string = ""

    context: any
    private overrideKey: string = ""
    private localizeCallback: () => string

    onEnable() {
        eventCenter.on("locale-changed", this.localizeText, this)

        this.localizeText()
    }

    private localizeText() {
        let text: string = this.localizedText
        if (text) {
            let label = this.getComponent(cc.Label)
            if (label) {
                if (label.string != text) {
                    label.string = text
                    this._updateRenderData(label)
                }
            } else {
                let label = this.getComponent(cc.RichText)
                if (label) {
                    if (label.string != text) {
                        label.string = text
                        this._updateRenderData(label)
                    }
                }
            }
        }
    }

    get localizedText(): string {
        if (this.localizeCallback) {
            return this.localizeCallback()
        } else if (this.overrideKey || this.key) {
            return localize(this.overrideKey || this.key, this.context)
        }

        return ""
    }

    _updateRenderData(label: cc.Label | cc.RichText) {
        if (label.node.active && label.enabled) {
            //@ts-ignore
            if (label._forceUpdateRenderData) {
                //@ts-ignore
                label._forceUpdateRenderData()
            }
        }
    }

    onDisable() {
        eventCenter.off("locale-changed", this.localizeText, this)
    }

    setKey(key: string, context?: any) {
        let dirty = false
        if (context) {
            this.context = context
            dirty = true
        }

        if (this.overrideKey != key) {
            this.overrideKey = key
            dirty = true
        }

        if (dirty) {
            this.localizeText()
        }
    }

    setLocalizeCallback(method: () => string) {
        this.localizeCallback = method
        this.localizeText()
    }
}
