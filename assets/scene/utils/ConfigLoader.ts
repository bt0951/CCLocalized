import { initLanguage } from "./i18n"

interface ConfigInterface {
  loadAllConfig(): Promise<any>
  getConfig(table: string)
  query(table: string, code: string | number)
  find(table: string, key: string, value?: string | number)
  getItemAt(table: string, index?: number)
}

class Config implements ConfigInterface {
  public async loadAllConfig() {
    return new Promise((resolve, reject) => {
      cc.loader.loadResDir("i18n", cc.JsonAsset, (error, resources: cc.JsonAsset[], urls) => {
        if (!error) {
          resources.forEach(r => (this[r.name] = r.json))
          initLanguage("zh-CN")
          resolve()
        } else {
          reject(error)
        }
      })
    })
  }

  public getConfig(table: string) {
    return this[table]
  }

  public query(table: string, code: string | number) {
    let conf = this[table]
    if (conf) {
      if (Array.isArray(conf)) {
        for (var i in conf) {
          let item = conf[i]
          if (item.code == code) {
            return item
          }
        }
      }
    }
  }

  public find(table: string, key: string, value?: string | number) {
    let conf = this[table]
    if (conf) {
      if (Array.isArray(conf)) {
        for (let i = 0; i < conf.length; i++) {
          let item = conf[i]
          if (item[key] == value) {
            return conf[i]
          }
        }
      } else {
        return conf[key]
      }
    }
  }

  public getItemAt(table: string, index?: number) {
    let conf = this[table]
    if (conf) {
      if (Array.isArray(conf)) {
        return conf[index || 0]
      }
    }
  }
}

export let config: ConfigInterface = new Config()
