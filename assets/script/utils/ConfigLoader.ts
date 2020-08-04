import { LocaleType } from "../share/LocaleType"
import { setLocale } from "./i18n"

function initLocale() {
    const locale = window.locale || LocaleType[LocaleType.zh_CN]
    setLocale(locale)
}

class Config {
    isLoaded = false

    private assignJsonAssets(list: cc.JsonAsset[]) {
        list.forEach(r => (this[r.name] = r.json))
        initLocale()
    }

    /**
     * 加载语言包
     * @param callback
     */
    loadLangPack(callback: (ok: boolean) => void) {
        let list = Object.keys(LocaleType).map(e => `config/${e}`)
        cc.loader.loadResArray(
            list,
            cc.JsonAsset,
            (count, total) => console.log(`...${count}/${total}`),
            (error, resList: cc.JsonAsset[]) => {
                if (!error) {
                    this.assignJsonAssets(resList)
                    callback(true)
                } else {
                    callback(false)
                }
            },
        )
    }

    getConfig(table: string) {
        return this[table]
    }
}

export let config = new Config()
if (CC_DEBUG) {
    //@ts-ignore
    window.config = config
}
