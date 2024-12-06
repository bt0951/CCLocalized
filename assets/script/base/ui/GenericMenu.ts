import ListView from "./ListView";
import { getTipUiLayer } from "./UILayer";
import { UIView } from "./UIView";

const { ccclass, property } = cc._decorator;

interface MenuItem {
    text: string;
}

@ccclass
export default class GenericMenu extends UIView {
    get isModal(): boolean {
        return true;
    }

    @property(ListView)
    private listView: ListView = null;

    public override onEnter(menus: MenuItem[], eventNode: cc.Node, callback: (index: number) => void): void {
        this.listView.itemCallback = (node: cc.Node, index: number) => {
            const label = node.getComponentInChildren(cc.Label);
            label.string = menus[index].text;
            label.overflow = cc.Label.Overflow.NONE;
            node.targetOff(this);
            node.on("click", () => { callback(index); this.close() }, this);
            node.width = node.parent.width - 10;
        }
        this.listView.itemCount = menus.length;

        let pos = eventNode.convertToWorldSpaceAR(cc.Vec2.ZERO);

        let container = this.node.parent;
        let localPos = container.convertToNodeSpaceAR(pos);

        let width = this.listView.node.width;
        let height = this.listView.node.height;

        let left = container.width * (-container.anchorX) + width * this.listView.node.anchorX;
        let right = container.width * (1 - container.anchorX) - width * (1 - this.listView.node.anchorX);
        let top = container.height * (1 - container.anchorY) - height * (1 - this.listView.node.anchorY);
        let bottom = container.height * (- container.anchorY) + height * this.listView.node.anchorY;
        if (localPos.x < left) {
            localPos.x = left;
        }
        if (localPos.x > right) {
            localPos.x = right;
        }
        if (localPos.y > top) {
            localPos.y = top;
        }
        if (localPos.y < bottom) {
            localPos.y = bottom;
        }

        this.listView.node.setPosition(localPos);
        this.node.opacity = 0;
        this.node.runAction(cc.fadeIn(0.1));
    }

    static show(menus: MenuItem[], node: cc.Node, callback: (index: number) => void) {
        getTipUiLayer().pushUi<GenericMenu>("generic-menu", menus, node, callback);
    }
}
