import { LocaleType } from "../share/LocaleType"
import { eventCenter } from "../utils/EventCenter"

const { ccclass, property, menu } = cc._decorator

@ccclass("SpriteSet")
class SpriteSet {
    @property({ type: cc.Enum(LocaleType) })
    locale: LocaleType = LocaleType.zh_CN

    @property(cc.SpriteFrame)
    spriteFrame: cc.SpriteFrame = null
}

@ccclass
@menu("本地化/LocaleSpriteList")
export default class LocaleSpriteList extends cc.Component {
    @property(SpriteSet)
    spriteFrameList: SpriteSet[] = []

    onEnable() {
        eventCenter.on("locale-changed", this.localizeSprite, this)

        this.localizeSprite()
    }

    private localizeSprite() {
        let locale = window.locale || LocaleType[LocaleType.zh_CN]
        locale = locale.toLowerCase()
        for (let i = 0; i < this.spriteFrameList.length; i++) {
            let frame = this.spriteFrameList[i]
            if (LocaleType[frame.locale].toLowerCase() == locale) {
                this.node.setSpriteFrame(frame.spriteFrame)
            }
        }
    }

    onDisable() {
        eventCenter.off("locale-changed", this.localizeSprite, this)
    }
}
