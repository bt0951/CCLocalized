declare module cc {
  interface Label {
    k: string
    isTranslate: boolean
    language: number
    /**
    !#zh
    本地化
    @param k key
    @param data 数据
    @example 
    ```js
    lbl.translateTo('key', {name})
    ``` 
    */
    localize(key: string, data?: object): string
  }
}
