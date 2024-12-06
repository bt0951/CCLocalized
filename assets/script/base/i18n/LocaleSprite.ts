import { getCurrentLanguage } from "./i18n";

const { ccclass, property, menu } = cc._decorator;

@ccclass
@menu("本地化/LocaleSprite")
export default class LocaleSprite extends cc.Component {
    @property()
    path: string = "";

    onEnable() {
        cc.game.on("locale-changed", this.localizeSprite, this);

        this.localizeSprite();
    }

    private localizeSprite() {
        if (this.path) {
            let locale = getCurrentLanguage();
            this.node.setSpriteFrame(`${this.path}-${locale}`);
        }
        else {
            console.warn("未设置本地化路径 ", this);
        }
    }

    onDisable() {
        cc.game.off("locale-changed", this.localizeSprite, this);
    }
}
