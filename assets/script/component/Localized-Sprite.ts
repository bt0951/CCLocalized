
const { ccclass, property, executeInEditMode, inspector, requireComponent, menu } = cc._decorator

const Language = cc.Enum({
  zh: 0,
  en: 1
})
const languageMap = {
  0: cc.sys.LANGUAGE_CHINESE,
  1: cc.sys.LANGUAGE_ENGLISH
}

const SpriteFrames = {
  0: null,
  1: null
}

@ccclass
@executeInEditMode
@inspector('packages://Localized-Sprite/inspector.js')
@menu('i18n:MAIN_MENU.component.renderers/Sprite')
export default class LocalizedSprite extends cc.Sprite {

  @property(Boolean)
  private _translate: boolean = false

  @property({
    tooltip: '是否替换为本地语言图片',
    type: Boolean
  })
  get translate() {
    return this._translate
  }
  set translate(v) {
    this._translate = v
    v && this.translateTo()
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
      this._setImg(v)
    } else {
      this.spriteFrame = this.spriteFrame
    }
  }

  @property(String)
  private _url: string = ''

  @property({
    type: Language
  })
  private _language = Language.zh

  @property({
    tooltip: '语言',
    type: Language
  })
  get language() {
    return this._language
  }
  set language(v) {
    this._language = v
    this.translateTo()
  }

  @property(cc.SpriteFrame)
  private _localizedSpriteFrame: cc.SpriteFrame = null
  @property({
    type: cc.SpriteFrame
  })
  get localizedSpriteFrame() {
    return this._localizedSpriteFrame
  }
  set localizedSpriteFrame(v) {
    this._localizedSpriteFrame = v
    SpriteFrames[Language.zh] = this._localizedSpriteFrame
    this.translateTo()
  }


  onLoad() {
    this._changeLanguage()
  }

  private _changeLanguage(language?: string) {
    let lan = language || this._getSysLanguage()
    this.language = Language[lan]
  }

  public translateTo(): cc.SpriteFrame {
    let _language = this._getSysLanguage(),
      zh = Language.zh
    if (this.language == zh) {
      this.spriteFrame = SpriteFrames[zh] || this.localizedSpriteFrame
      return
    } else {
      this._setImg(this.key)
    }
  }

  private async _setImg(key: string) {
    let _str = key.split('.'),
    _len = _str.length
    let url = await this._loadUrl(),
    obj = url[_str[0]]
    if (_len == 1) {
      this._url = obj
    } else {
      let _temp: string
      _str.forEach((s, i) => {
        _temp = i == 0 ? obj : _temp[s]
      })
      this._url = _temp
    }
    let texture = await this._loadImgFromUrl(this._url)
    this.spriteFrame = new cc.SpriteFrame(texture)
  }

  private _loadImgFromUrl(url: string) {
    return new Promise<cc.Texture2D>((resolve, reject) => {
      cc.loader.load(url, (err, texture) => {
        if (err) {
          cc.error(err)
          reject(err)
          return
        } else {
          resolve(texture)
        }
      })
    })
  }

  private _loadConfig(url: string) {
    return new Promise<string>((resolve, reject) => {
      cc.loader.load(url, (err, data) => {
        if (err) {
          cc.error(err)
          reject(err)
          return
        } else {
          resolve(data)
        }
      })
    })
  }

  private async _loadUrl() {
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

  private _getSysLanguage() {
    return cc.sys.language
  }

}
