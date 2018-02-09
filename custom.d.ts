declare module cc {
  interface Sprite {
    _sgNode: cc.Sprite
    setState: Function
    translate: boolean
    language: number
    translateTo(): cc.SpriteFrame
  }
  
  interface Label {
    key: string
    translate: boolean
    language: number
    translateTo(key: string, ...args): string
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

