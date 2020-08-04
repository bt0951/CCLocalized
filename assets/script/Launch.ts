import { config } from "./utils/ConfigLoader"

const { ccclass, property } = cc._decorator

@ccclass
export default class Launch extends cc.Component {
    test() {
        this.node.getChildByName("label-1").setLocaleKey("test.context", { level: 1 })
    }

    start() {
        config.loadLangPack(ok => {
            if (ok) {
                //TODO:
                //...
            } else {
                //TODO:
                //...
            }
        })
    }

    onEnable() {
        this.test()
    }
}
