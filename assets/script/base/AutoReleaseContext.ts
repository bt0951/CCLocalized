const { ccclass, property } = cc._decorator;

/**
 * 自动卸载资源引用
 */
@ccclass
export default class AutoReleaseContext extends cc.Component {

    /** 
      * 实例化需要复制的
      * 从一个node实例化后会复制property
      * 这里只是给ccclass加了个 props, 实际set get 在constructor里面
      */
    @property()
    asset: cc.Asset = null;

    /**
     * 实际上的引用了的资源
     */
    private _asset: cc.Asset = null;
    constructor() {
        super();
        /**
         * 重新定义属性，get, set
         * 实例化Node的时候会clone所有的props，在这里劫持 setter 来增加资源引用。
         */
        Object.defineProperty(this, "asset", {
            get: function () {
                return this._asset;
            },
            set: function (value) {
                this.setAsset(value);
            }
        })
    }

    setAsset(asset: cc.Asset) {
        let oldAsset = this._asset;

        //先增加新引用
        if (asset) {
            asset.addRef();
        }
        this._asset = asset;

        //再减少旧引用，如果是同一个资源的话就是 1->2, 2->1 不会release资源
        if (oldAsset) {
            oldAsset.decRef();
        }
    }

    onDestroy() {
        let asset = this._asset;
        this._asset = null;
        if (asset) {
            asset.decRef();
        }
    }
}
