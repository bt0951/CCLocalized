import { wait } from "./Utils"

export function scaleDownAndFadeIn(
    node: cc.Node,
    opt?: { scale?: number; scaleTime?: number; fadeTime?: number },
) {
    let scaleTime = (opt && opt.scaleTime) || 0.2
    let fadeTime = (opt && opt.fadeTime) || 0.2
    node.scale = (opt && opt.scale) || 1.1
    node.opacity = 0
    node.runAction(cc.spawn(cc.fadeIn(fadeTime).easing(cc.easeIn(3)), cc.scaleTo(scaleTime, 1, 1)))
}
/**
 * 创建一个列表 通常parent搭配layout来使用
 * @param parent 父节点
 * @param prefab 预制模板
 * @param count 数量
 * @param itemCallback 列表元素初始化回调
 */
export function createListView(
    parent: cc.Node,
    prefab: cc.Node | cc.Prefab,
    count: number,
    itemCallback: (node: cc.Node, index: number) => void,
) {
    for (let i = parent.children.length; i < count; i++) {
        let node = cc.instantiate(prefab) as cc.Node
        parent.addChild(node)
    }

    for (let i = count; i < parent.children.length; i++) {
        parent.children[i].active = false
    }

    for (let i = 0; i < count; i++) {
        parent.children[i].active = true
        itemCallback(parent.children[i], i)
    }
}

export async function createListViewAsync(
    parent: cc.Node,
    prefab: cc.Node | cc.Prefab,
    count: number,
    itemCallback: (node: cc.Node, index: number, isNew?: boolean) => void,
    delayTime: number = 0,
    context?: { stoped: boolean },
) {
    for (let i = 0; i < parent.children.length && i < count; i++) {
        await wait(delayTime)
        if (context && context.stoped) {
            break
        }
        parent.children[i].active = true
        itemCallback(parent.children[i], i)
    }

    for (let i = parent.children.length; i < count; i++) {
        await wait(delayTime)
        if (context && context.stoped) {
            break
        }
        let node = cc.instantiate(prefab) as cc.Node
        parent.addChild(node)
        parent.children[i].active = true
        itemCallback(parent.children[i], i, true)
    }

    for (let i = count; i < parent.children.length; i++) {
        if (context && context.stoped) {
            break
        }
        parent.children[i].active = false
    }

    return
}

/**
 * 只是创建新节点延迟
 * @param parent
 * @param prefab
 * @param count
 * @param itemCallback
 * @param delayTime
 * @param context
 */
export async function createListViewAsync2(
    parent: cc.Node,
    prefab: cc.Node | cc.Prefab,
    count: number,
    itemCallback: (node: cc.Node, index: number, isNew?: boolean) => void,
    delayTime: number = 0,
    context?: { stoped: boolean },
) {
    for (let i = 0; i < parent.children.length && i < count; i++) {
        parent.children[i].active = true
        itemCallback(parent.children[i], i)
    }

    for (let i = parent.children.length; i < count; i++) {
        await wait(delayTime)
        if (context && context.stoped) {
            break
        }
        let node = cc.instantiate(prefab) as cc.Node
        parent.addChild(node)
        parent.children[i].active = true
        //新创建的节点 isNew true
        itemCallback(parent.children[i], i, true)
    }

    for (let i = count; i < parent.children.length; i++) {
        parent.children[i].active = false
    }

    return
}

/**
 * 逐帧加载
 * @export
 * @param {cc.Node} parent
 * @param {(cc.Node | cc.Prefab)} prefab
 * @param {number} count
 * @param {number} fbfNumber 每帧渲染的数量
 */
export async function createListViewFrameByFrame(
    parent: cc.Node,
    prefab: cc.Node | cc.Prefab,
    count: number,
    fbfNumber: number = 1,
    itemCallback: (node: cc.Node, index: number, isNew?: boolean) => void,
) {
    const oneFrame = 0
    for (let i = 0; i < parent.children.length && i < count; i++) {
        if (i % ~~fbfNumber == 0) {
            await wait(oneFrame)
        }
        parent.children[i].active = true
        itemCallback(parent.children[i], i)
    }

    for (let i = parent.children.length; i < count; i++) {
        if (i % ~~fbfNumber == 0) {
            await wait(oneFrame)
        }
        let node = cc.instantiate(prefab) as cc.Node
        parent.addChild(node)
        parent.children[i].active = true
        itemCallback(parent.children[i], i, true)
    }

    for (let i = count; i < parent.children.length; i++) {
        parent.children[i].active = false
    }
}
