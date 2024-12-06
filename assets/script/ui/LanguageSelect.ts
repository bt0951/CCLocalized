import { getCurrentLanguage, localize, setLocale, supportLanguages } from "../base/i18n/i18n";
import GenericMenu from "../base/ui/GenericMenu";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LanguageSelect extends cc.Component {
    @property(cc.Node)
    private lauguageTextNode: Node = null!

    showLangOptions() {
        const locale = getCurrentLanguage()
        let list = supportLanguages
            // .filter(x => x != locale)
            .map(e => ({ text: localize(`locale.${e}`) }))
        if (list.length === 0) {
            this.hideLangOptions()
            return
        }
        GenericMenu.show(list, this.node, (index) => {
            const text = supportLanguages[index]
            setLocale(text)
        })
    }

    hideLangOptions() {
        let panel = this.node.getChildByName("languages")!
        panel.active = false
    }

    setLang(node?: Node, lang?: string) {
        this.hideLangOptions()

        setLocale(lang!)
    }

}