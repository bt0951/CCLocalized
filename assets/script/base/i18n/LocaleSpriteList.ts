import { loadConfig } from "../../utils/Utility";
import { getCurrentLanguage, LocaleType, setLocale } from "./i18n";

const { ccclass, property, menu, executeInEditMode } = cc._decorator;

@ccclass("SpriteSet")
class SpriteSet {
    @property({ type: cc.Enum(LocaleType) })
    locale: LocaleType = LocaleType.zh_CN;

    @property(cc.SpriteFrame)
    spriteFrame: cc.SpriteFrame = null;
}

@ccclass
@executeInEditMode
@menu("本地化/LocaleSpriteList")
export default class LocaleSpriteList extends cc.Component {

    @property({ type: cc.Enum(LocaleType) })
    _previewLocale: LocaleType = LocaleType.zh_CN;
    @property({ type: cc.Enum(LocaleType) })
    get previewLocale() { return LocaleType[getCurrentLanguage()] || this._previewLocale }
    private set previewLocale(value) {
        if (CC_EDITOR) {
            if (this._previewLocale != value) {
                this._previewLocale = value;
                if (!globalThis._config) {
                    loadConfig();
                }
                else {
                    setLocale(LocaleType[value])
                    this.localizeSprite();
                }
            }
        }
    }

    @property(SpriteSet)
    spriteFrameList: SpriteSet[] = [];


    onEnable() {
        cc.game.on("locale-changed", this.localizeSprite, this)

        this.localizeSprite();
    }

    private localizeSprite() {
        let locale = getCurrentLanguage() || LocaleType[LocaleType.zh_CN];
        locale = locale.toLowerCase();
        for (let i = 0; i < this.spriteFrameList.length; i++) {
            let frame = this.spriteFrameList[i];
            if (LocaleType[frame.locale].toLowerCase() == locale) {
                this.node.getComponent(cc.Sprite).spriteFrame = frame.spriteFrame;
            }
        }
    }

    onDisable() {
        cc.game.off("locale-changed", this.localizeSprite, this);
    }
}
