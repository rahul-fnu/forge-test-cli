let colorsEnabled = true;

export function setColorsEnabled(enabled: boolean): void {
  colorsEnabled = enabled;
}

export function isColorsEnabled(): boolean {
  return colorsEnabled;
}

function wrap(code: string, text: string): string {
  if (!colorsEnabled) return text;
  return `\x1b[${code}m${text}\x1b[0m`;
}

export function green(text: string): string {
  return wrap("32", text);
}

export function red(text: string): string {
  return wrap("31", text);
}

export function yellow(text: string): string {
  return wrap("33", text);
}

export function bold(text: string): string {
  return wrap("1", text);
}
