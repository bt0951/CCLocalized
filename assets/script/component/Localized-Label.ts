const { ccclass, property, executeInEditMode, inspector, menu } = cc._decorator

const Language = cc.Enum({
  zh: 0,
  en: 1
})

const languageMap = {
  0: cc.sys.LANGUAGE_CHINESE,
  1: cc.sys.LANGUAGE_ENGLISH
}

@ccclass
@executeInEditMode
@inspector('packages://Localized-Label/inspector.js')
@menu('i18n:MAIN_MENU.component.renderers/Label')
export default class LocalizedLabel extends cc.Label {

  // @property({
  //   override: true
  // })
  // public horizontalAlign: cc.Label.HorizontalAlign = cc.Label.HorizontalAlign.CENTER

  // @property({
  //   override: true
  // })
  // public verticalAlign: cc.Label.VerticalAlign = cc.Label.VerticalAlign.CENTER

  @property(Boolean)
  private _translate: boolean = false

  @property({
    tooltip: '是否翻译为本地语言文本',
    type: Boolean
  })
  get translate() {
    return this._translate
  }
  set translate(v) {
    this._translate = v
    v && this.translateTo(this.key)
  }

  @property
  private _key: string = ''

  @property({
    tooltip: 'key路径',
  })
  get key() {
    return this._key
  }

  set key(v) {
    if (v) {
      this._key = v
      this._setString(v)
    } else {
      this.string = this.string
    }
  }

  @property({
    type: Language
  })
  private _language = Language[this._getSysLanguage()] || Language.zh

  @property({
    tooltip: '语言',
    type: Language
  })
  get language() {
    return this._language
  }
  set language(v) {
    this._language = v
    this.translateTo(this._key)
  }

  onLoad() {
    this._addEventListener()
    this._changeLanguage()
  }

  onDestroy() {
    this._removeEventListener()
  }

  private _addEventListener() {
    cc.game.on('CHANGE_LANGUAGE', this._OnChangeLanguage, this)
  }

  private _removeEventListener() {
    cc.game.off('CHANGE_LANGUAGE', this._OnChangeLanguage, this)
  }

  private _OnChangeLanguage(language: string) {
    let lan = this._getSysLanguage()
    this._changeLanguage(lan)
  }

  private _changeLanguage(language?: string) {
    let lan = language || this._getSysLanguage()
    this.language = Language[lan]
  }

  public translateTo(key: string, ...args): string {
    this.key = key
    this._setString(key, ...args)
    return this.string
  }

  private async _setString(key: string, ...args) {
    let _str = key.split('.'),
      _len = _str.length
    let str = await this._loadText(),
      obj = str[_str[0]]
    if (_len == 1) {
      this.string = obj
    } else {
      let _temp: string
      _str.forEach((s, i) => {
        _temp = i == 0 ? obj : _temp[s]
      })
      if (args.length > 0) {
        let _optTemp = _temp.split('%s')
        let _f1st = _optTemp[0]
        args.forEach(arg => {
          _optTemp.forEach(item => {
            _temp = _f1st + arg
          })
        })
        _temp = args.length > 0 ? _temp : _f1st
      }
      this.string = _temp
    }
  }

  private async _loadText() {
    let sysLanguage = this._getSysLanguage()
    let lan = languageMap[this.language] || sysLanguage
    let url = cc.url.raw(`resources/i18n/Strings-${lan}.json`)
    try {
      let str = await this._loadConfig(url)
      return str
    } catch (error) {
      cc.error(JSON.stringify(error))
    }
  }

  private _loadConfig(url) {
    return new Promise<cc.Prefab>((resolve, reject) => {
      cc.loader.load(url, (err, data) => {
        if (err) {
          cc.error(err)
          reject(err)
          return
        }
        resolve(data)
      })
    })
  }

  private _getSysLanguage() {
    return cc.sys.language
  }

}
