import { loadConfigAsync } from "./ConfigLoader";

const { ccclass, property } = cc._decorator

@ccclass
export default class Launch extends cc.Component {
    test() {
        this.node.getChildByName("label-1").setLocaleKey("test.context", { level: 1 })
    }

    // start() {
    //     loadConfigAsync({
    //         onComplete: (config: any) => {
    //             globalThis._config = config;
    //         },
    //         onProgress: () => { },
    //         onError: (reason: any) => {
    //             console.error("error", reason);
    //         }
    //     });
    // }

    onEnable() {
        this.test()
    }
}
