export interface CalcPlugin {
  name: string;
  functions: Map<string, (args: number[]) => number>;
}

export class PluginRegistry {
  private functions = new Map<string, (args: number[]) => number>();

  register(plugin: CalcPlugin): void {
    for (const [name, fn] of plugin.functions) {
      this.functions.set(name, fn);
    }
  }

  getFunction(name: string): ((args: number[]) => number) | undefined {
    return this.functions.get(name);
  }

  listFunctions(): string[] {
    return Array.from(this.functions.keys());
  }
}
