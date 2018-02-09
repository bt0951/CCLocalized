
const { ccclass, property, executeInEditMode, inspector, requireComponent, menu } = cc._decorator
const Language = cc.Enum({
  zh: 0,
  en: 1
})

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
    SpriteFrames[this.language] = this._localizedSpriteFrame
    this.translateTo()
  }


  public translateTo(): cc.SpriteFrame {
    this.spriteFrame = SpriteFrames[this.language]
    return this.spriteFrame
  }

}
