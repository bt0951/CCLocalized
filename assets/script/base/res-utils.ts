import AutoReleaseContext from "./AutoReleaseContext";
import AssetScope from "./AssetScope";

export function instantiate(path: string, parent: cc.Node, callback?: (error: Error | string, node?: cc.Node, prefab?: cc.Prefab) => void) {
    cc.resources.load(path, cc.Prefab, (error, prefab) => {
        if (error) {
            callback?.(error);
        }
        else {
            prefab.addRef();
            if (parent && !parent.isValid) {
                callback?.("parent invalid");
                prefab.decRef();
                return;
            }
            const node = cc.instantiate(prefab);
            node.addComponent(AutoReleaseContext).setAsset(prefab);
            if (parent) {
                node.setParent(parent);
                AssetScope.getScope(parent).addAsset(prefab);
            }
            prefab.decRef();
            callback?.(null, node, prefab);
        }
    });
}

export function instantiateEffect(path: string, parent: cc.Node, callback?: (error: Error | string, node?: cc.Node, prefab?: cc.Prefab) => void) {
    cc.assetManager.loadBundle("effects", (e, b) => {
        if (b) {
            b.load(path, cc.Prefab, (error, prefab) => {
                if (prefab) {
                    if (parent.isValid) {
                        prefab.addRef();
                        if (parent && !parent.isValid) {
                            callback?.("parent invalid");
                            prefab.decRef();
                            return;
                        }
                        const node = cc.instantiate(prefab);
                        node.addComponent(AutoReleaseContext).setAsset(prefab);
                        if (parent) {
                            node.setParent(parent);
                            AssetScope.getScope(parent).addAsset(prefab);
                        }
                        prefab.decRef();
                        callback?.(null, node, prefab);
                    }
                }
                else if (error) {
                    callback?.(error);
                }
            })
        }
        else if (b) {
            callback?.(e);
        }
    })
}

const slash = /\//g;

export function addOrRemoveChild(parent: cc.Node, path: string, isAdd: boolean, position?: cc.Vec2) {
    const childName = path.replace(slash, '_');
    let container = parent.findChild(childName);
    if (isAdd) {
        if (!container) {
            container = new cc.Node();
            container.name = childName;
            parent.addChild(container)
            instantiate(path, container);
            if (position) {
                container.setPosition(position);
            }
        }
    }
    else {
        if (container) {
            container.setParent(null);
            container.destroy();
        }
    }
}

export function instantiateDisallowMultiple(path: string, parent: cc.Node, callback?: (error: Error | string, node?: cc.Node, prefab?: cc.Prefab) => void) {
    const name = path.replace(slash, '_');

    const node = parent.findChild(name)
    if (node) {
        callback?.(null, node);
    }
    else {
        cc.resources.load(path, cc.Prefab, (error, prefab) => {
            if (error) {
                callback?.(error);
            }
            else {
                prefab.addRef();

                if (parent && !parent.isValid) {
                    callback?.("parent invalid");
                    prefab.decRef();
                    return;
                }
                let node = parent.findChild(name)
                if (!node) {
                    node = cc.instantiate(prefab);
                    node.addComponent(AutoReleaseContext).setAsset(prefab);
                    if (parent) {
                        node.setParent(parent);
                        AssetScope.getScope(parent).addAsset(prefab);
                    }
                    node.name = name;
                }

                prefab.decRef();

                callback?.(null, node, prefab);
            }
        });
    }
}

function setSpriteFrame(sprite: cc.Sprite & { _spritePath?: string }, path: string | null, onComplete?: Function) {
    if (!path) {
        sprite.spriteFrame = null;
        sprite._spritePath = path;
        onComplete?.();
        return
    }

    if (sprite._spritePath == path) {
        onComplete?.();
        return;
    }
    sprite._spritePath = path;

    cc.resources.getOrLoad(path, cc.SpriteFrame, (error, spriteFrame) => {
        if (path != sprite._spritePath) {
            return;
        }
        if (error) {
            console.warn(error);
            if (sprite.isValid) {
                sprite.spriteFrame = null
            }
        }
        else {
            spriteFrame.addRef();

            if (sprite.isValid) {
                const node = sprite.node;
                let ref = node.getComponent(AutoReleaseContext);
                if (!ref) {
                    ref = node.addComponent(AutoReleaseContext);
                }
                ref.setAsset(spriteFrame);
                AssetScope.getScope(node).addAsset(spriteFrame);
                sprite.spriteFrame = spriteFrame;
            }
            spriteFrame.decRef();
        }
        onComplete?.()
    });
}

export function loadConfigListAsync(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        const paths: string[] = cc.resources.getDirWithPath("config", cc.JsonAsset, []).map(x => x.path);
        cc.resources.load(paths, cc.JsonAsset, (error, assets) => {
            if (error) {
                reject(error);
            }
            else {
                let map = new Map();
                for (let i = 0, len = assets.length; i < len; i++) {
                    const asset = assets[i];
                    map.set(paths[i].replace("config/", ""), asset.json);
                }
                resolve(map);
            }
        })
    })
}

cc.Node.prototype.setSpriteFrame = function (path: string, onComplete?: Function) {
    const sprite = this.getComponent(cc.Sprite);
    if (!sprite) {
        console.warn("setSpriteFrame null ", path);
        return;
    }
    sprite.setSpriteFrame(path, onComplete);
}

cc.Sprite.prototype.setSpriteFrame = function (path: string, onComplete?: Function) {
    setSpriteFrame(this, path, onComplete);
}

/**
 * 缓存有的情况下立即回调
 */
cc.AssetManager.Bundle.prototype.getOrLoad = function <T extends cc.Asset>(paths: string, type: { prototype: T }, onComplete?: (error: Error, assets: T) => void): void {
    const p = this.get(paths, type);
    if (p) {
        onComplete(null, p);
    }
    else {
        this.load(paths, type, onComplete);
    }
}

if (CC_DEBUG) {
    //@ts-ignore
    window.instantiate = instantiate;
}