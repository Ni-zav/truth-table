/** Text-editing rules shared by toolbar clicks and keyboard edits. No DOM assumptions. */
export type Edit = { value: string; start: number; end: number; changed: boolean };

export function insertSymbol(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  symbol: string,
  limit = 240,
): Edit {
  const start = Math.max(0, Math.min(selectionStart, value.length));
  const end = Math.max(start, Math.min(selectionEnd, value.length));
  const selected = value.slice(start, end);
  let from = start;
  let to = end;
  let replacement: string;
  let caret: number;

  if (selected && (symbol === '¬' || symbol === '(' || symbol === ')')) {
    replacement = symbol === '¬' ? '¬(' + selected + ')' : '(' + selected + ')';
    caret = start + replacement.length;
  } else if (symbol === '(') {
    replacement = '()';
    caret = start + 1;
  } else if (symbol === ')' || symbol === '¬') {
    replacement = symbol;
    caret = start + symbol.length;
  } else {
    // Consume adjacent spacing rather than gradually accumulating extra spaces.
    while (from > 0 && /\s/u.test(value[from - 1])) from--;
    while (to < value.length && /\s/u.test(value[to])) to++;
    const before = value.slice(0, from);
    const prefix = before && !before.endsWith('(') ? ' ' : '';
    replacement = prefix + symbol + ' ';
    caret = from + replacement.length;
  }

  const updated = value.slice(0, from) + replacement + value.slice(to);
  if (updated.length > limit) return { value, start, end, changed: false };
  return { value: updated, start: caret, end: caret, changed: updated !== value };
}
