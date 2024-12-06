import { initLocale } from "../base/i18n/i18n";
import { Config, initConfig } from "../share/configs/config";

type LoadingCallback = { onComplete: (config: Config) => void; onError?: (error: any) => void; onProgress?: (finish: number, total: number) => void; };

function loadJson(bundle: cc.AssetManager.Bundle, path: string, callback: (e: any, data: any) => void) {
    bundle.load(path, cc.JsonAsset, (e, a) => {
        if (e) {
            callback(e, null);
        }
        else {
            callback(null, a.json)
        }
    });
}

/**
 * shared config
 */
let configBundle: cc.AssetManager.Bundle;

function load(path: string, callback: (e: any, data: any) => void) {
    if (!configBundle) {
        cc.assetManager.loadBundle("config", (error, bundle) => {
            if (error) {
                console.error(error);
                return;
            }
            configBundle = bundle;
            loadJson(configBundle, path, callback);
        })
    }
    else {
        loadJson(configBundle, path, callback);
    }
}

let config = Object.assign({}, initConfig(load))

function loadConfigDir() {
    return new Promise<void>((resolve, reject) => {
        cc.resources.loadDir("config", cc.JsonAsset, (finish, total) => { },
            (e, a) => {
                if (e) {
                    console.error(e)
                    reject(e)
                }
                else {
                    a.forEach(a => {
                        if (!config[a.name]) {
                            config[a.name] = a.json
                        }
                    })
                    initLocale(config)
                    resolve()
                }
            })
    })
}

// export function loadConfigAsync({ onComplete, onError, onProgress }: LoadingCallback) {
//     let config = initConfig(load);
//     let counter = 0;
//     const MAX = 6;
//     cc.resources.loadDir("config", cc.JsonAsset, onProgress, (e, a) => {
//         if (e) {
//             onError?.(e);
//         }
//         else {
//             a.forEach(a => config[a.name] = a.json)
//             initLocale(config);
//             counter += 1;
//             if (counter == MAX) {
//                 onComplete(config);
//             }
//         }
//     });
//     if (CC_EDITOR) {
//         counter += 4;
//         if (counter == MAX) {
//             onComplete(config);
//         }
//         return;
//     }
// }

export function loadConfigAsync({ onComplete, onError, onProgress }: LoadingCallback) {
    Promise.all(
        [
            loadConfigDir(),
        ])
        .then(() => {
            Object.freeze(config)
            onComplete?.(config)
        })
        .catch(error => {
            console.error(error)
            onError?.(error)
        })
}