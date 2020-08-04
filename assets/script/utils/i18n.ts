//@ts-ignore
import * as Polyglot from "polyglot.min"
import { evaluateExpression } from "./Expression"
import { config } from "./ConfigLoader"
import { eventCenter } from "./EventCenter"

let polyInst = null
let current: any = {}

function initPolyglot(data) {
    if (data) {
        if (polyInst) {
            polyInst.replace(data)
        } else {
            polyInst = new Polyglot({ phrases: data, allowMissing: true })
        }
    }
}

const dollarRegex = /\$/g
const dollarBillsYall = "$$"
const defaultTokenRegex = /%\{(.*?)\}/g

function translate(key: string, options: any): any {
    let result: string = current[key]
    if (!result) {
        return key
    }
    result = result.replace(defaultTokenRegex, function (expression, argument) {
        var re = evaluateExpression(argument, options)
        if (typeof re === "undefined") {
            return expression
        }
        re = re.toString()
        return re.replace(dollarRegex, dollarBillsYall)
    })
    return result
}

export function setLocale(lang: string, init?: boolean) {
    if (window.locale == lang) {
        return
    }
    cc.sys.localStorage.setItem("LANG-1", lang)
    let data = config.getConfig(lang)
    initPolyglot(data)
    current = config.getConfig(lang)
    window.locale = lang

    if (!init) {
        eventCenter.emit("locale-changed", lang)
    }
}

export function localize(key: string, options?: any): string {
    if (!key) {
        return ""
    }

    if (current) {
        try {
            return translate(key, options) || key
        } catch (e) {
            console.error(e, "语言包错误 " + key, options)
            if (polyInst) {
                return polyInst.t(key, options) || key
            }
        }
    }
    return key
}

export function replaceTag(value: string, options?: any): string {
    value = value.replace(defaultTokenRegex, function (expression, argument) {
        var re = evaluateExpression(argument, options)
        if (typeof re === "undefined") {
            return expression
        }
        re = re.toString()
        return re.replace(dollarRegex, dollarBillsYall)
    })
    return value
}

if (CC_DEBUG) {
    //@ts-ignore
    window.localize = localize
}
