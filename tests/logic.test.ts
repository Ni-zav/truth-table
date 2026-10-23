import { describe, expect, it } from 'vitest';
import { buildTruthTable, evaluate, exportDelimited, format, parse } from '../src/logic';

describe('Boolean expressions', () => {
  it('uses correct precedence, grouping and right-associative implication', () => {
    const row = { A: false, B: true, C: false };
    expect(evaluate(parse('A | B & C'), row)).toBe(false);
    expect(evaluate(parse('(A | B) & C'), row)).toBe(false);
    expect(evaluate(parse('A -> B -> C'), row)).toBe(true);
    expect(evaluate(parse('(A -> B) -> C'), row)).toBe(false);
    expect(evaluate(parse('NOT A AND B'), row)).toBe(true);
    expect(evaluate(parse('A OR B AND C'), row)).toBe(false);
  });

  it('evaluates all eight binary operators for every assignment', () => {
    const cases: Record<string, string> = {
      'A ∧ B': 'TFFF', 'A ∨ B': 'TTTF', 'A ⊕ B': 'FTTF',
      'A ↑ B': 'FTTT', 'A ↓ B': 'FFFT', 'A ⊙ B': 'TFFT',
      'A → B': 'TFTT', 'A ↔ B': 'TFFT',
    };
    for (const [source, wanted] of Object.entries(cases)) {
      const actual = buildTruthTable(parse(source)).rows.map(row => row.outputs[0] ? 'T' : 'F').join('');
      expect(actual, source).toBe(wanted);
    }
  });

  it('supports text, ASCII and mathematical notation without executing code', () => {
    expect(format(parse('!(a && b) <=> ~a || ~b'))).toBe('¬(A ∧ B) ↔ ¬A ∨ ¬B');
    expect(evaluate(parse('TRUE XOR FALSE'), {})).toBe(true);
    expect(evaluate(parse('⊥ ⇒ ⊤'), {})).toBe(true);
  });

  it('sorts variables, enumerates all rows and exposes optional subexpressions', () => {
    const root = parse('(B ∨ A) ∧ ¬C');
    const detailed = buildTruthTable(root, true);
    expect(detailed.variables).toEqual(['A', 'B', 'C']);
    expect(detailed.rows).toHaveLength(8);
    expect(detailed.rows[0].inputs).toEqual([true, true, true]);
    expect(detailed.rows[7].inputs).toEqual([false, false, false]);
    expect(detailed.columns.map(column => column.text)).toEqual(['B ∨ A', '¬C', '(B ∨ A) ∧ ¬C']);
    expect(buildTruthTable(root).columns).toHaveLength(1);
  });

  it('rejects errors and excessive variables clearly', () => {
    for (const input of ['A B', 'A &&', 'A | )', '(A', 'A;alert(1)', 'a'.repeat(241), 'A & J & B & C & D & E & F & G & H']) {
      expect(() => buildTruthTable(parse(input))).toThrow();
    }
    expect(buildTruthTable(parse('⊤')).rows).toHaveLength(1);
    expect(buildTruthTable(parse('A')).rows).toHaveLength(2);
  });

  it('exports TSV and escaped CSV with the current format', () => {
    const table = buildTruthTable(parse('A → B'));
    expect(exportDelimited(table)).toContain('A\tB\tA → B\r\n');
    expect(exportDelimited(table, ',')).toContain('"A","B","A → B"\r\n');
    expect(exportDelimited(table, '\t', true)).toContain('1\t0\t0');
  });
  it('keeps formatted parentheses semantically equivalent to the AST', () => {
    for (const source of ['(A -> B) -> C', 'A -> (B -> C)', 'A ↑ (B ∧ C)', 'A ↓ (B ∨ C)', '¬(A ∨ B)']) {
      const first = buildTruthTable(parse(source));
      const reformatted = buildTruthTable(parse(format(parse(source))));
      expect(reformatted.rows.map(row => row.outputs[0])).toEqual(first.rows.map(row => row.outputs[0]));
    }
  });

  it('obeys De Morgan and enumerates the eight-variable boundary', () => {
    const left = buildTruthTable(parse('¬(A ∧ B)'));
    const right = buildTruthTable(parse('¬A ∨ ¬B'));
    expect(left.rows.map(row => row.outputs[0])).toEqual(right.rows.map(row => row.outputs[0]));
    expect(buildTruthTable(parse('A & B & C & D & E & F & G & H')).rows).toHaveLength(256);
    expect(() => buildTruthTable(parse('A & B & C & D & E & F & G & H & I'))).toThrow(/at most eight/);
  });

});
