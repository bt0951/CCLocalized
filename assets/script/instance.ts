import { Config } from "./share/configs/config";

declare global {
    /**
     * @deprecated  禁止使用该全局对象。使用 `this.model.config`
     */
    var _config: Config;
}