// @ts-ignore
import * as Polyglot from "polyglot.min"
import { config } from "./ConfigLoader"
import { compileExpression } from "./Expression"
let polyInst = null

let current = null
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

function translate(key, options): any {
  let result: string = compileExpression(key)(current)
  // Interpolate: Creates a `RegExp` object for each interpolation placeholder.
  result = result.replace(defaultTokenRegex, function(expression, argument) {
    let re = compileExpression(argument || "")(options)
    if (typeof re === "undefined") {
      return expression
    }
    // Ensure replacement value is escaped to prevent special $-prefixed regex replace tokens.
    re = re.toString()
    return re.replace(dollarRegex, dollarBillsYall)
  })
  return result
}

export function initLanguage(lang) {
  let data = config.getConfig(lang)
  initPolyglot(data)
  current = config.getConfig(lang)
}

export function initLanguageWithData(data) {
  initPolyglot(data)
  current = data
}

export function localize(key: string, options?: any): string {
  key = key || ""
  if (current) {
    try {
      return translate(key, options) || key
    } catch {
      if (polyInst) {
        return polyInst.t(key, options) || key
      }
    }
  }
  return key
}

//@ts-ignore
window.localize = localize
