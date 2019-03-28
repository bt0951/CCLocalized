import { config } from "../scene/utils/ConfigLoader"

const { ccclass, property } = cc._decorator

@ccclass
export default class GameLaunch extends cc.Component {
  onLoad() {
    config.loadAllConfig()
  }
}
