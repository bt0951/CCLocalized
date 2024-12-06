

export function emit(key: string, arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any): void {
    cc.game.emit(key, arg1, arg2, arg3, arg4, arg5);
}

export function on(type: string, callback: Function, target?: any) {
    cc.game.on(type, callback, target);
}

export function off(type: string, callback?: Function, target?: any): void {
    cc.game.off(type, callback, target);
}

export function targetOff(target: any): void {
    cc.game.targetOff(target);
}