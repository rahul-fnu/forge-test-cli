import { CalcPlugin } from "../plugins.js";

export const mathPlugin: CalcPlugin = {
  name: "math",
  functions: new Map<string, (args: number[]) => number>([
    ["abs", (args) => Math.abs(args[0])],
    ["sqrt", (args) => Math.sqrt(args[0])],
    ["round", (args) => Math.round(args[0])],
    ["floor", (args) => Math.floor(args[0])],
    ["ceil", (args) => Math.ceil(args[0])],
    ["sin", (args) => Math.sin(args[0])],
    ["cos", (args) => Math.cos(args[0])],
    ["tan", (args) => Math.tan(args[0])],
    ["log", (args) => Math.log(args[0])],
    ["exp", (args) => Math.exp(args[0])],
    ["min", (args) => Math.min(args[0], args[1])],
    ["max", (args) => Math.max(args[0], args[1])],
    ["PI", () => Math.PI],
    ["E", () => Math.E],
  ]),
};
