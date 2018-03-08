declare module cc {
  interface Sprite {
    _sgNode: cc.Sprite
    setState: Function
    translate: boolean
    language: number
    localizedSpriteFrame: cc.SpriteFrame
    translateTo(key: string): cc.SpriteFrame
  }
  
  interface Label {
    key: string
    translate: boolean
    language: number
     /**
    !#zh
    翻译文本
    @param key key
    @param data 数据
    @example 
    ```js
    lbl.translateTo('key', {name: name})
    lbl.translateTo(['key1', 'key2'], [{name: name}, obj2])
    ``` 
    */
    translateTo(key: string | string[], data?: object | object[]): string
  }

  interface AffineTransform {
    tx: number
    ty: number
  }

interface Array<T> {
  /**
   *
   * @param searchElement 
   * @param fromIndex 
   */
  includes(searchElement: T, fromIndex?: number): boolean

  /**
   * 返回这个数组和传入数组的补集
   * 返回一个新数组，元素是次数组和传入数组不同的部分
   * @param arr
   */
  complementary(arr: T): T
}

