const { ccclass, property, menu } = cc._decorator;

@ccclass
@menu("UI/UICanvas")
export default class UICanvas extends cc.Component {

    protected onEnable(): void {
        cc.view.on('canvas-resize', this.onResized, this);
        this.onResized();
    }

    protected onDisable(): void {
        cc.view.on('canvas-resize', this.onResized, this);
    }

    private onResized() {
        const canvas = this.getComponent(cc.Canvas);

        const desiginRatio = canvas.designResolution.width / canvas.designResolution.height;

        const frameSize = cc.view.getFrameSize();

        const frameRatio = frameSize.width / frameSize.height;

        if (frameRatio < desiginRatio) {
            // 宽高比低于设计的宽高比 只适配宽度
            canvas.fitWidth = true;
            canvas.fitHeight = false;
        }
        else {
            //适配高度
            canvas.fitWidth = false;
            canvas.fitHeight = true;
        }
    }
}
