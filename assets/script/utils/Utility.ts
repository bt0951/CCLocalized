import { LocaleType } from "../base/i18n/i18n";
import { loadConfigAsync } from "../launch/ConfigLoader";

export function waitSeconds(timeInSecond: number) {
    return new Promise<void>((resolve, reject) => setTimeout(() => resolve(), timeInSecond * 1000));
}

export function loadConfig() {
    // return new Promise<void>(resolve =>{
    loadConfigAsync({
        onComplete: (config: any) => {
            globalThis._config = config;
            // cc.game.emit("config-loaded");
            if (CC_EDITOR) {
                cc.log("加载配置完成");
                console.log(config);
            }
            cc.game.emit("locale-changed", LocaleType.zh_Hans);
        },
        onProgress: () => { },
        onError: (reason: any) => {
            console.error("error", reason);
            if (CC_EDITOR) {
                cc.error("加载配置失败", reason);
            }
        }
    });

    // })
}