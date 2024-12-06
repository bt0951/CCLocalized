import { IConfigure } from "../../config";

declare global {
    interface Array<T> {

        /**
         * 按id查询一个列表, 仅用于只读的配置等列表，动态删减的列表禁止用这个方法（删除和增加element的时候没有动态更新索引）。
         * key必须是 id, level, lvl
         * @param id 
         */
        $id(id: number | string): T;

        /**
         * 按id查询一个配置表, 仅用于只读的配置等列表，动态删减的列表禁止用这个方法（删除和增加element的时候没有动态更新索引）。
         * key 必须是 code
         * @param code 
         * @param ignoreError 
         */
        $code(code: string, ignoreError?: 1): T;
    }
}

Array.prototype.$id = function (id: number | string) {
    const key = String(id);
    let list: any[] & { $map?: Map<number | string, any> } = this;
    if (!list.$map) {
        const m = list.$map = new Map();
        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            const k = String(item.id ?? item.level ?? item.lvl ?? item.code);
            m.set(k, item);
        }
    }
    const v = list.$map.get(key);
    if (!v) {
        console.error("!!!!!!!!!!找不到 id ", id);
    }
    return v;
}

Array.prototype.$code = function (code: string, flag) {
    let list: any[] & { $map?: Map<string, any> } = this;
    if (!list.$map) {
        const m = list.$map = new Map();
        for (let i = 0; i < list.length; i++) {
            m.set(list[i].code, list[i]);
        }
    }
    const v = list.$map.get(code);
    if (!v && !flag) {
        console.error("!!!!!!!!!!找不到 code ", code);
    }
    return v;
}

type KeysMatching<T, V> = { [K in keyof T]: T[K] extends V ? K : never }[keyof T];

type CodeIndexed = { code: string };
type CodeIndexedKeys = KeysMatching<Config, CodeIndexed[]>;
type IdIndexed = { id: string | number };
type IdIndexedKeys = KeysMatching<Config, IdIndexed[]>;

type ConfigLoader = (path: string, callback: (error: any, data: any) => void) => void;
export interface Config extends IConfigure {
    getConfig(name: string): any;
    load<T>(path: string): Promise<T>;
}

class _Config implements Config {
    constructor(private loader: ConfigLoader) {

    }
    [path: string]: any;
    getConfig(name: string) {
        return this[name];
    }

    private loadAsync(path: string): Promise<any> {
        return new Promise<any>((resovle, reject) => {
            this.loader(path, (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    resovle(data);
                }
            })
        });
    }

    async load<T>(path: string) {
        if (this[path]) {
            return this[path] as T;
        }
        let tab = await this.loadAsync(path);
        this[path] = tab;
        return tab as T;
    }
}

/**
 * 配置加载器，加载指定相对路径的配置文件。
 * @param loader 
 */
export function initConfig(loader: ConfigLoader) {
    return new _Config(loader);
}
