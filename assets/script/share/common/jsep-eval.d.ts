import * as jsep from "./jsep";

declare function compile(expression: string): (context: object) => any;
declare function evaluate(node: any, context: object): any;

export { compile, jsep as parse, evaluate as eval };
