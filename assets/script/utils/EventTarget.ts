type Callback = [Function, any]

function makeTuple(callback: any, target: any): Callback {
    return [callback, target]
}

export class EventTarget {
    private table: any = {}

    on(type: string, callback: Function, target?: any) {
        let lists: { callbacks: Callback[]; targets: any[] } =
            this.table[type] || (this.table[type] = { callbacks: [], targets: [] })
        target = target || null
        lists.callbacks.push(makeTuple(callback, target))
    }

    off(type: string, callback: Function, target?: any) {
        let lists: { callbacks: Callback[]; targets: any[] } = this.table[type]
        if (lists) {
            let index = lists.callbacks.findIndex(x => x[0] == callback && x[1] == (target || null))

            if (index != -1) {
                lists.callbacks.splice(index, 1)
            }
        }
    }

    emit(type: string, ...args: any[]) {
        let lists: { callbacks: Callback[]; targets: any[] } = this.table[type]
        if (lists) {
            let callbacks = lists.callbacks
            for (let i = 0; i < callbacks.length; i++) {
                let [callback, target] = callbacks[i]
                callback.call(target, ...args)
            }
        }
    }
}
