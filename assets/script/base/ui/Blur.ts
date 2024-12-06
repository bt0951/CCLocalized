import { ShaderUtils } from "../rendering/ShaderUtils";

const { ccclass, property } = cc._decorator;

function captureScreen(downScale: 1 | 2 | 4 | 8 = 8) {
    const cameras = cc.Camera.cameras.filter(e => e.node.activeInHierarchy && e.enabled && !e.node.name.startsWith("renderTexture"));
    cameras.sort((a, b) => a.depth - b.depth);

    let texture = new cc.RenderTexture();
    texture.initWithSize(Math.floor(cc.visibleRect.width / downScale), Math.floor(cc.visibleRect.height / downScale), cc.RenderTexture.DepthStencilFormat.RB_FMT_S8);
    for (let i = 0; i < cameras.length; i++) {
        let cam = cameras[i];
        const originTargetTexture = cam.targetTexture
        cam.targetTexture = texture;
        cam.render();
        cam.targetTexture = originTargetTexture
    }
    return texture;
}

@ccclass
export default class Blur extends cc.Component {
    private _texture: cc.RenderTexture;
    private _sprite: cc.Sprite

    protected onLoad(): void {
        ShaderUtils.blur(this._sprite)
    }

    protected onDestroy(): void {
        if (this._texture) {
            this._texture.destroy();
        }
    }

    static createBlur() {
        const texture = captureScreen();
        let node = new cc.Node("blur");
        node.scaleY = -1;

        let sprite = node.addComponent(cc.Sprite);
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        sprite.spriteFrame = new cc.SpriteFrame(texture);

        let blur = node.addComponent(Blur);
        blur._texture = texture;
        blur._sprite = sprite

        node.setContentSize(cc.visibleRect.width, cc.visibleRect.height);
        return node;
    }
}
