
import * as jsep from "./jsep-eval"

let expressionCache: any = {}

export function evaluateExpression(expression: number | string | boolean | undefined, context?: any, ignoreError?: boolean): any {
    if (typeof (expression) == "number") {
        return expression
    }
    if (typeof (expression) == "undefined") {
        return 0
    }

    if (expression === true) {
        return true
    }

    if (expression === false) {
        return false
    }

    try {
        expression = expression || "0"
        let cached = expressionCache[expression]
        if (cached) {
            return cached(context)
        }

        let f = jsep.compile(expression)
        expressionCache[expression] = f
        return f(context)
    }
    catch (e) {
        if (ignoreError) {
            console.warn(e, expression)
        }
        else {
            console.error(e, expression)
        }
        return 0
    }
}

export function evaluateExpressionWithoutCatch(expression: number | string | boolean | undefined, context?: any, ignoreError?: boolean): any {
    if (typeof (expression) == "number") {
        return expression
    }
    if (typeof (expression) == "undefined") {
        return 0
    }

    if (expression === true) {
        return true
    }

    if (expression === false) {
        return false
    }

    expression = expression || "0"
    let cached = expressionCache[expression]
    if (cached) {
        return cached(context)
    }

    let f = jsep.compile(expression)
    expressionCache[expression] = f
    return f(context)
}