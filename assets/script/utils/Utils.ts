const wait = async (timeInSecond: number, target = cc.Canvas.instance) =>
    new Promise((resolve, reject) => target.scheduleOnce(() => resolve(), timeInSecond))

export { wait }
