import { LocaleType, setLocale } from "../base/i18n/i18n";
import { createListView } from "./ListUtility";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LanguageSelect extends cc.Component {
    showLangOptions() {
        let panel = this.node.getChildByName("languages");
        panel.active = true;
        let options = panel.getChildByName("options");
        let list = Object.keys(LocaleType);
        if (list.length === 0) {
            this.hideLangOptions();
            return;
        }
        createListView(options, options.children[0], list.length, (n, index) => {
            n.targetOff(this);
            n.on("click", () => this.setLang(list[index]), this);
            n.children[0].setLocaleKey("locale." + list[index]);
        });
    }

    hideLangOptions() {
        let panel = this.node.getChildByName("languages");
        panel.active = false;
    }

    setLang(lang) {
        this.hideLangOptions();

        setLocale(lang);
    }
}
