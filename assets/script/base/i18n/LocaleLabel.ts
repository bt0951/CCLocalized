import { loadConfig } from "../../utils/Utility";
import { LocaleType, localize } from "./i18n"

const { ccclass, property, menu, executeInEditMode } = cc._decorator

@ccclass
@executeInEditMode
@menu("本地化/LocaleLabel")
export default class LocaleLabel extends cc.Component {
    @property()
    key: string = "";

    @property({ type: cc.Enum(LocaleType) })
    _previewLocale: LocaleType = LocaleType.zh_Hans;
    @property({ type: cc.Enum(LocaleType) })
    get previewLocale() { return this._previewLocale }
    private set previewLocale(value) {
        if (CC_EDITOR) {
            if (this._previewLocale != value) {
                this._previewLocale = value;
                if (!globalThis._config) {
                    loadConfig();
                }
                else {
                    this.localizeText();
                }
            }
        }
    }

    private overrideKey: string = '';

    context: any

    private localizeCallback: () => string

    onEnable() {
        cc.game.on("locale-changed", this.localizeText, this)

        this.localizeText()
    }

    private localizeText() {
        let text: string = this.localizedText
        if (text) {
            let label = this.getComponent(cc.Label)
            if (label) {
                if (label.string != text) {
                    label.string = text
                    // this._updateRenderData(label)
                }
            }
            else {
                let label = this.getComponent(cc.RichText)
                if (label) {
                    if (label.string != text) {
                        label.string = text
                        // this._updateRenderData(label)
                    }
                }
            }
        }
    }

    get localizedText(): string {
        if (this.localizeCallback) {
            return this.localizeCallback()
        }
        else if (this.overrideKey || this.key) {
            return localize(this.overrideKey || this.key, this.context)
        }

        return ""
    }

    // _updateRenderData(label: cc.Label | cc.RichText) {
    //     if (label.node.active && label.enabled) {
    //         //@ts-ignore
    //         if (label._forceUpdateRenderData) {
    //             //@ts-ignore
    //             label._forceUpdateRenderData()
    //         }
    //     }
    // }

    onDisable() {
        cc.game.off("locale-changed", this.localizeText, this)
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


cc.Node.prototype.setLocaleKey = function (key: string, context?: any) {
    let localeLabel = this.getComponent(LocaleLabel)
    if (!localeLabel) {
        localeLabel = this.addComponent(LocaleLabel)
    }

    localeLabel.setKey(key, context)
    return this
} 