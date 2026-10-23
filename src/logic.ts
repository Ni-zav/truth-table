export type Operator = 'and' | 'or' | 'xor' | 'nand' | 'nor' | 'xnor' | 'implies' | 'iff';
export type Node =
  | { kind: 'variable'; name: string }
  | { kind: 'constant'; value: boolean }
  | { kind: 'not'; operand: Node }
  | { kind: 'binary'; op: Operator; left: Node; right: Node };

type Token = { type: 'variable' | 'constant' | 'operator' | 'left' | 'right' | 'eof'; value: string; position: number };

export class ExpressionError extends Error {
  constructor(message: string, readonly position: number) {
    super(message + ' · column ' + (position + 1));
    this.name = 'ExpressionError';
  }
}

const operators: Record<string, string> = {
  '¬': 'not', '!': 'not', '~': 'not',
  '∧': 'and', '&': 'and', '&&': 'and', '*': 'and',
  '∨': 'or', '|': 'or', '||': 'or', '+': 'or',
  '⊕': 'xor', '^': 'xor', '⊼': 'nand', '↑': 'nand',
  '⊽': 'nor', '↓': 'nor', '⊙': 'xnor',
  '→': 'implies', '⇒': 'implies', '->': 'implies', '=>': 'implies',
  '↔': 'iff', '⇔': 'iff', '≡': 'iff', '<->': 'iff', '<=>': 'iff',
};
const words: Record<string, string> = {
  NOT: 'not', AND: 'and', OR: 'or', XOR: 'xor', NAND: 'nand', NOR: 'nor',
  XNOR: 'xnor', IMPLIES: 'implies', IFF: 'iff', TRUE: 'true', FALSE: 'false',
};
const precedence: Record<Operator, number> = {
  iff: 1, implies: 2, or: 3, nor: 3, xor: 4, xnor: 4, and: 5, nand: 5,
};
const symbols: Record<Operator, string> = {
  and: '∧', or: '∨', xor: '⊕', nand: '↑', nor: '↓', xnor: '⊙',
  implies: '→', iff: '↔',
};

function tokenize(source: string): Token[] {
  if (source.length > 240) throw new ExpressionError('Expression is too long', 240);
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const char = source[i];
    if (/\s/u.test(char)) { i++; continue; }
    if (char === '(' || char === ')') {
      tokens.push({ type: char === '(' ? 'left' : 'right', value: char, position: i++ });
      continue;
    }
    const match = source.slice(i).match(/^[A-Za-z]+/);
    if (match) {
      const raw = match[0];
      const upper = raw.toUpperCase();
      const value = words[upper];
      if (value === 'true' || value === 'false') {
        tokens.push({ type: 'constant', value, position: i });
      } else if (value) {
        tokens.push({ type: 'operator', value, position: i });
      } else if (upper.length === 1) {
        tokens.push({ type: 'variable', value: upper, position: i });
      } else {
        throw new ExpressionError('Unknown name “' + raw + '”', i);
      }
      i += raw.length;
      continue;
    }
    if (char === '1' || char === '0' || char === '⊤' || char === '⊥') {
      tokens.push({ type: 'constant', value: char === '1' || char === '⊤' ? 'true' : 'false', position: i++ });
      continue;
    }
    const matched = ['<->', '<=>', '&&', '||', '->', '=>'].find(value => source.startsWith(value, i));
    const op = matched ?? char;
    if (operators[op]) {
      tokens.push({ type: 'operator', value: operators[op], position: i });
      i += op.length;
      continue;
    }
    throw new ExpressionError('Unexpected “' + char + '”', i);
  }
  tokens.push({ type: 'eof', value: '', position: source.length });
  return tokens;
}

export function parse(source: string): Node {
  const tokens = tokenize(source);
  let i = 0;
  const peek = () => tokens[i];
  const pop = () => tokens[i++];

  const expression = (minimum = 1): Node => {
    const token = pop();
    let node: Node;
    if (token.type === 'variable') node = { kind: 'variable', name: token.value };
    else if (token.type === 'constant') node = { kind: 'constant', value: token.value === 'true' };
    else if (token.type === 'operator' && token.value === 'not') {
      node = { kind: 'not', operand: expression(6) };
    } else if (token.type === 'left') {
      node = expression();
      if (peek().type !== 'right') throw new ExpressionError('Expected “)”', peek().position);
      pop();
    } else {
      throw new ExpressionError('Expected a variable, constant or “(”', token.position);
    }

    while (peek().type === 'operator' && peek().value !== 'not') {
      const next = peek();
      const op = next.value as Operator;
      const strength = precedence[op];
      if (strength === undefined || strength < minimum) break;
      pop();
      const right = expression(strength + (op === 'implies' ? 0 : 1));
      node = { kind: 'binary', op, left: node, right };
    }
    return node;
  };
  const root = expression();
  if (peek().type !== 'eof') {
    throw new ExpressionError(peek().type === 'right' ? 'Unexpected “)”' : 'Expected an operator', peek().position);
  }
  return root;
}

export function variables(root: Node): string[] {
  const names = new Set<string>();
  const visit = (node: Node): void => {
    if (node.kind === 'variable') names.add(node.name);
    else if (node.kind === 'not') visit(node.operand);
    else if (node.kind === 'binary') { visit(node.left); visit(node.right); }
  };
  visit(root);
  return [...names].sort();
}

export function evaluate(node: Node, values: Readonly<Record<string, boolean>>): boolean {
  if (node.kind === 'variable') return values[node.name] ?? false;
  if (node.kind === 'constant') return node.value;
  if (node.kind === 'not') return !evaluate(node.operand, values);
  const left = evaluate(node.left, values);
  const right = evaluate(node.right, values);
  switch (node.op) {
    case 'and': return left && right;
    case 'or': return left || right;
    case 'xor': return left !== right;
    case 'nand': return !(left && right);
    case 'nor': return !(left || right);
    case 'xnor': return left === right;
    case 'implies': return !left || right;
    case 'iff': return left === right;
  }
}

export function format(root: Node): string {
  const render = (node: Node, parent = 0, isRight = false, parentOp?: Operator): string => {
    if (node.kind === 'variable') return node.name;
    if (node.kind === 'constant') return node.value ? '⊤' : '⊥';
    if (node.kind === 'not') {
      return '¬' + (node.operand.kind === 'binary' ? '(' + render(node.operand) + ')' : render(node.operand));
    }
    const current = precedence[node.op];
    const text = render(node.left, current, false, node.op) + ' ' + symbols[node.op] + ' ' + render(node.right, current, true, node.op);
    const bracket = current < parent || (current === parent && (parentOp === 'implies' ? !isRight : isRight));
    return bracket ? '(' + text + ')' : text;
  };
  return render(root);
}

export type TruthColumn = { text: string; node: Node };
export type TruthRow = { inputs: boolean[]; outputs: boolean[] };
export type TruthTable = { variables: string[]; columns: TruthColumn[]; rows: TruthRow[] };

export function buildTruthTable(root: Node, showSteps = false): TruthTable {
  const names = variables(root);
  if (names.length > 8) throw new ExpressionError('Use at most eight variables', 0);
  const columns: TruthColumn[] = [];
  if (showSteps) {
    const seen = new Set<string>();
    const visit = (node: Node): void => {
      if (node.kind === 'not') visit(node.operand);
      if (node.kind === 'binary') { visit(node.left); visit(node.right); }
      if (node !== root && (node.kind === 'not' || node.kind === 'binary')) {
        const text = format(node);
        if (!seen.has(text)) { columns.push({ text, node }); seen.add(text); }
      }
    };
    visit(root);
  }
  columns.push({ text: format(root), node: root });
  const rows: TruthRow[] = [];
  for (let row = 0; row < 2 ** names.length; row++) {
    const inputs = names.map((_, i) => ((row >> (names.length - i - 1)) & 1) === 0);
    const values = Object.fromEntries(names.map((name, i) => [name, inputs[i]]));
    rows.push({ inputs, outputs: columns.map(column => evaluate(column.node, values)) });
  }
  return { variables: names, columns, rows };
}

export function exportDelimited(table: TruthTable, delimiter: '\t' | ',' = '\t', digits = false): string {
  const value = (bool: boolean) => digits ? (bool ? '1' : '0') : (bool ? 'T' : 'F');
  const lines = [
    [...table.variables, ...table.columns.map(column => column.text)],
    ...table.rows.map(row => [...row.inputs, ...row.outputs].map(value)),
  ];
  return lines.map(row => row.map(entry => delimiter === ',' ? '"' + entry.replaceAll('"', '""') + '"' : entry).join(delimiter)).join('\r\n');
}
