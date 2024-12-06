import { getCurrentLanguage, LocaleType } from "../base/i18n/i18n";
import { loadConfigAsync } from "../launch/ConfigLoader";

export function waitSeconds(timeInSecond: number) {
    return new Promise<void>((resolve, reject) => setTimeout(() => resolve(), timeInSecond * 1000));
}

export function loadConfig() {
    loadConfigAsync({
        onComplete: (config: any) => {
            globalThis._config = config;
            if (CC_EDITOR) {
                cc.log("加载配置完成");
                console.log(config);
            }
            cc.game.emit("locale-changed", LocaleType[getCurrentLanguage()]);
        },
        onProgress: () => { },
        onError: (reason: any) => {
            console.error("error", reason);
            if (CC_EDITOR) {
                cc.error("加载配置失败", reason);
            }
        }
    });
}