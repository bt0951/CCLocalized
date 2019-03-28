import { initLanguageWithData, localize as _localize } from "../../scene/utils/i18n"
import { LanguageConf, languageMap } from "../config/LanguageConfig"

const { ccclass, property, executeInEditMode, inspector, menu } = cc._decorator

const Language = cc.Enum(LanguageConf)

@ccclass
@executeInEditMode
@inspector("packages://Localized-Label/inspector.js")
@menu("i18n:MAIN_MENU.component.renderers/Localized-Label")
export default class LocalizedLabel extends cc.Label {
  // @property({
  //   override: true
  // })
  // public horizontalAlign: cc.Label.HorizontalAlign = cc.Label.HorizontalAlign.CENTER

  // @property({
  //   override: true
  // })
  // public verticalAlign: cc.Label.VerticalAlign = cc.Label.VerticalAlign.CENTER

  @property(Boolean) private _isTranslate: boolean = false

  @property({
    tooltip: "是否翻译为本地语言文本",
    type: Boolean,
  })
  get isTranslate() {
    return this._isTranslate
  }
  set isTranslate(v) {
    this._isTranslate = v
    v && this.localize(this.k)
  }

  @property private _k: string = ""

  @property({
    tooltip: "key路径",
  })
  get k() {
    return this._k
  }

  set k(v) {
    if (v) {
      this._k = v
      CC_EDITOR && this._setStringAsync()
    } else {
      this.string = this.string
    }
  }

  @property({
    type: Language,
  })
  private _language = Language.简体中文

  @property({
    tooltip: "语言",
    type: Language,
  })
  get language() {
    return this._language
  }
  set language(v) {
    this._language = v
    this._isTranslate && this.localize(this.k, this._obj)
  }

  @property(Object) private _obj: object = null

  public localize(key: string, obj?: object): string {
    this.k = key
    this._obj = obj
    this._localizeString()
    return this.string
  }

  private _getFormatedKey(key: string = this.k) {
    const splitArr = key.split("#")
    let [_key, opt] = splitArr
    debugger
    if (opt) {
      opt = opt.replace(/\s+/g, "")
      return { key: _key, opt: JSON.parse(opt) }
    } else {
      return { key: _key }
    }
  }

  private _localizeString() {
    CC_EDITOR ? this._setStringAsync() : this._setString()
  }

  private _setString() {
    this.string = _localize(this.k, this._obj)
  }

  private async _setStringAsync() {
    await this._loadText()
    const { key, opt } = this._getFormatedKey(this.k)
    const str = opt ? _localize(key, opt) : _localize(key)
    this.string = str
  }

  private async _loadText() {
    const jsonName = languageMap[this.language]
    let url = cc.url.raw(`resources/i18n/${jsonName}.json`)
    const str = await this._loadConfig(url)
    initLanguageWithData(str)
    return str
  }

  private _loadConfig(url) {
    return new Promise<cc.JsonAsset>((resolve, reject) => {
      cc.loader.load(url, (err, data: cc.JsonAsset) => {
        if (err) {
          cc.error(err)
          reject(err)
          return
        }
        resolve(data)
      })
    })
  }
}
