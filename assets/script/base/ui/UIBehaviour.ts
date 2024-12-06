
const { ccclass, property } = cc._decorator;

@ccclass
export default class UIBehaviour extends cc.Component {

    onEnter(): void {

    }

    onExit(): Promise<void> {
        return Promise.resolve();
    }
}
