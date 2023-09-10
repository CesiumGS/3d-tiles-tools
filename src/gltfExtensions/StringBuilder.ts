/**
 * Internal utility class to build formatted strings
 *
 * @internal
 */
export class StringBuilder {
  private s: string;
  private indent: number;
  private indentation: number;
  constructor() {
    this.s = "";
    this.indentation = 2;
    this.indent = 0;
  }
  increaseIndent() {
    this.indent += this.indentation;
  }
  decreaseIndent() {
    this.indent -= this.indentation;
  }
  addLine(...args: any[]) {
    this.s += " ".repeat(this.indent);
    for (const arg of args) {
      this.s += `${arg}`;
    }
    this.s += "\n";
  }
  toString(): string {
    return this.s;
  }
}
