
const { ccclass, property } = cc._decorator;

let defaultScope: AssetScope = null;

function getDefaultScope() {
    if (!defaultScope) {
        let node = new cc.Node("__AssetScope");
        defaultScope = node.addComponent(AssetScope);
        cc.director.getScene().addChild(node);
    }

    return defaultScope;
}

function decRef(asset: cc.Asset) {
    asset.decRef();
}

@ccclass
export default class AssetScope extends cc.Component {

    private assets: Set<cc.Asset> = new Set();

    protected onDestroy(): void {
        if (this == defaultScope) {
            defaultScope = null;
        }
        this.assets.forEach(decRef);
    }

    addAsset(asset: cc.Asset) {
        if (!this.assets.has(asset)) {
            this.assets.add(asset);
            asset.addRef();
        }
    }

    static getScope(node: cc.Node) {
        if (node) {
            const scope = node.getComponentInParent(AssetScope);
            if (scope) {
                return scope;
            }
        }
        return getDefaultScope();
    }
}
