export class MacroExpander {
  private macros = new Map<string, string>();

  register(name: string, template: string): void {
    this.macros.set(name, template);
  }

  expand(name: string, args: string[]): string {
    const template = this.macros.get(name);
    if (!template) {
      throw new Error(`Unknown macro: ${name}`);
    }
    const params = this.extractParams(template);
    let result = template;
    for (let i = 0; i < params.length && i < args.length; i++) {
      result = result.split(params[i]).join(args[i]);
    }
    return result;
  }

  has(name: string): boolean {
    return this.macros.has(name);
  }

  private extractParams(template: string): string[] {
    const seen = new Set<string>();
    const params: string[] = [];
    const regex = /[a-zA-Z_]\w*/g;
    let match;
    while ((match = regex.exec(template)) !== null) {
      const word = match[0];
      if (word === "PI" || word === "E") continue;
      const afterIdx = match.index + word.length;
      if (afterIdx < template.length && template[afterIdx] === "(") continue;
      if (!seen.has(word)) {
        seen.add(word);
        params.push(word);
      }
    }
    return params;
  }

  expandExpression(expr: string): string {
    let result = expr;
    let previous = "";
    while (result !== previous) {
      previous = result;
      result = result.replace(/([a-zA-Z_]\w*)\(([^)]*)\)/g, (match, name, argsStr) => {
        if (!this.macros.has(name)) return match;
        const args = argsStr.split(",").map((a: string) => a.trim());
        const expanded = this.expand(name, args);
        return `(${expanded})`;
      });
    }
    return result;
  }
}
