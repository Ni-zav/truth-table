import { describe, expect, it } from 'vitest';
import { insertSymbol } from '../src/editor';
import { parse } from '../src/logic';

describe('expression editor toolbar', () => {
  it('inserts complete empty parentheses with cursor between them', () => {
    expect(insertSymbol('A ∧ ', 4, 4, '(')).toEqual({
      value: 'A ∧ ()', start: 5, end: 5, changed: true,
    });
  });

  it('wraps selected text rather than destroying it', () => {
    const negated = insertSymbol('A ∨ B', 4, 5, '¬');
    expect(negated.value).toBe('A ∨ ¬(B)');
    expect(negated.start).toBe(8);
    expect(() => parse(negated.value)).not.toThrow();

    const grouped = insertSymbol('A ∧ B ∨ C', 0, 5, '(');
    expect(grouped.value).toBe('(A ∧ B) ∨ C');
    expect(grouped.start).toBe(7);
    expect(() => parse(grouped.value)).not.toThrow();
  });

  it('normalizes whitespace around binary operators', () => {
    expect(insertSymbol('A    B', 3, 3, '→').value).toBe('A → B');
    expect(insertSymbol('A', 1, 1, '∧')).toEqual({
      value: 'A ∧ ', start: 4, end: 4, changed: true,
    });
    expect(insertSymbol('(A)', 1, 1, '¬').value).toBe('(¬A)');
  });

  it('keeps the insertion caret and respects expression limits', () => {
    const result = insertSymbol('A ∧ B', 4, 4, '¬');
    expect(result).toEqual({ value: 'A ∧ ¬B', start: 5, end: 5, changed: true });
    expect(insertSymbol('A'.repeat(240), 240, 240, 'B')).toEqual({
      value: 'A'.repeat(240), start: 240, end: 240, changed: false,
    });
  });

  it('inserts explicit closing parentheses without creating extra pairs', () => {
    expect(insertSymbol('(A', 2, 2, ')').value).toBe('(A)');
    expect(insertSymbol('B', 0, 1, ')').value).toBe('(B)');
  });
});
