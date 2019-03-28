import * as jsep from "../utils/jsep-eval"

export function compileExpression(expression: string | undefined): any {
  let f = jsep.compile(expression || "0")
  return function(context: any) {
    try {
      const data = f(context)
      return data
    } catch {
      return 0
    }
  }
}
