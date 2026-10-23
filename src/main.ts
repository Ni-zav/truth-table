import './styles.css';
import { insertSymbol } from './editor';
import { buildTruthTable, exportDelimited, format, parse, type TruthTable } from './logic';

const editor = document.querySelector<HTMLInputElement>('#expression')!;
const error = document.querySelector<HTMLParagraphElement>('#syntax-error')!;
const table = document.querySelector<HTMLTableElement>('#truth-table')!;
const surface = document.querySelector<HTMLDivElement>('#table-surface')!;
const rowCount = document.querySelector<HTMLSpanElement>('#row-count')!;
const feedback = document.querySelector<HTMLSpanElement>('#feedback')!;
const stepsButton = document.querySelector<HTMLButtonElement>('#steps')!;
const stepsState = document.querySelector<HTMLSpanElement>('#steps-state')!;
const digitsButton = document.querySelector<HTMLButtonElement>('#digits')!;
const copyButton = document.querySelector<HTMLButtonElement>('#copy')!;
const csvButton = document.querySelector<HTMLButtonElement>('#csv')!;
const shareButton = document.querySelector<HTMLButtonElement>('#share')!;
const clearButton = document.querySelector<HTMLButtonElement>('#clear')!;

const DEFAULT_EXPRESSION = 'A ∧ (B ∨ ¬C)';
const params = new URLSearchParams(window.location.search);
if (params.has('q')) editor.value = params.get('q') ?? '';
let showSteps = params.get('steps') === '1';
let digits = params.get('digits') === '1';
let currentTable: TruthTable | null = null;
let pendingError: ReturnType<typeof setTimeout> | undefined;
let noticeTimeout: ReturnType<typeof setTimeout> | undefined;
let noticeButton: HTMLButtonElement | null = null;
let composing = false;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const superscript: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸' };

function tell(message: string, anchor: HTMLButtonElement): void {
  if (noticeTimeout !== undefined) clearTimeout(noticeTimeout);
  if (noticeButton) {
    noticeButton.classList.remove('has-feedback');
    delete noticeButton.dataset.feedback;
  }
  noticeButton = anchor;
  feedback.textContent = message;
  anchor.dataset.feedback = message;
  anchor.classList.add('has-feedback');
  noticeTimeout = setTimeout(() => {
    anchor.classList.remove('has-feedback');
    delete anchor.dataset.feedback;
    feedback.textContent = '';
    noticeButton = null;
  }, 1900);
}

function syncURL(): void {
  const url = new URL(window.location.href);
  if (editor.value && editor.value !== DEFAULT_EXPRESSION) url.searchParams.set('q', editor.value);
  else url.searchParams.delete('q');
  if (showSteps) url.searchParams.set('steps', '1');
  else url.searchParams.delete('steps');
  if (digits) url.searchParams.set('digits', '1');
  else url.searchParams.delete('digits');
  // Preserves other URL parameters and avoids adding one history entry per keystroke.
  if (url.href !== window.location.href) window.history.replaceState(null, '', url);
}

function cell(tag: 'th' | 'td', value: string, className = ''): HTMLTableCellElement {
  const element = document.createElement(tag);
  element.textContent = value;
  element.className = className;
  if (tag === 'th') element.setAttribute('scope', 'col');
  return element;
}

function truthCell(value: boolean, className: string): HTMLTableCellElement {
  const td = cell('td', digits ? (value ? '1' : '0') : (value ? 'T' : 'F'), className);
  td.setAttribute('aria-label', value ? 'True' : 'False');
  return td;
}

function updateValue(td: HTMLTableCellElement, truth: boolean, className: string, animate: boolean): void {
  const value = digits ? (truth ? '1' : '0') : (truth ? 'T' : 'F');
  const wasDifferent = td.textContent !== value;
  if (wasDifferent) td.textContent = value;
  if (td.className !== className) td.className = className;
  td.setAttribute('aria-label', truth ? 'True' : 'False');
  if (wasDifferent && animate && !reducedMotion.matches) {
    td.animate([{ opacity: .42 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
  }
}

function clearTable(symbol = '∅'): void {
  table.tHead?.replaceChildren();
  table.tBodies[0]?.replaceChildren();
  surface.classList.remove('has-result', 'is-pending');
  surface.dataset.empty = symbol;
  rowCount.textContent = '';
  surface.removeAttribute('aria-busy');
}

function updateTable(next: TruthTable, label: string): void {
  const thead = table.tHead ?? table.createTHead();
  const tbody = table.tBodies[0] ?? table.createTBody();
  const headers = [...next.variables, ...next.columns.map(column => column.text)];
  const headerRow = thead.rows[0];
  const canReuse = headerRow?.cells.length === headers.length && tbody.rows.length === next.rows.length;
  const scrollLeft = surface.scrollLeft;
  const scrollTop = surface.scrollTop;

  if (canReuse) {
    // Reuse cells: typing a different operator must not snap scroll or flicker 256 rows.
    for (let i = 0; i < headers.length; i++) {
      if (headerRow.cells[i].textContent !== headers[i]) headerRow.cells[i].textContent = headers[i];
    }
    for (let r = 0; r < next.rows.length; r++) {
      const tr = tbody.rows[r];
      const data = next.rows[r];
      const values = [...data.inputs, ...data.outputs];
      for (let c = 0; c < values.length; c++) {
        const resultIndex = c - data.inputs.length;
        const kind = resultIndex < 0 ? 'input-cell'
          : resultIndex === data.outputs.length - 1 ? 'result-cell ' + (values[c] ? 'true' : 'false')
          : 'step-cell';
        updateValue(tr.cells[c] as HTMLTableCellElement, values[c], kind, next.rows.length <= 32);
      }
    }
  } else {
    const tr = document.createElement('tr');
    for (const name of next.variables) tr.append(cell('th', name, 'variable-heading'));
    for (const column of next.columns) tr.append(cell('th', column.text, 'formula-heading'));
    thead.replaceChildren(tr);

    const fragment = document.createDocumentFragment();
    for (const data of next.rows) {
      const row = document.createElement('tr');
      for (const input of data.inputs) row.append(truthCell(input, 'input-cell'));
      for (const [i, output] of data.outputs.entries()) {
        row.append(truthCell(output, i === data.outputs.length - 1 ? 'result-cell ' + (output ? 'true' : 'false') : 'step-cell'));
      }
      fragment.append(row);
    }
    tbody.replaceChildren(fragment);
    surface.scrollLeft = scrollLeft;
    surface.scrollTop = scrollTop;
  }

  rowCount.textContent = '2' + String(next.variables.length).split('').map(char => superscript[char] ?? char).join('') + ' = ' + next.rows.length;
  surface.classList.add('has-result');
  surface.classList.remove('is-pending');
  surface.dataset.empty = '';
  surface.removeAttribute('aria-busy');
  table.setAttribute('aria-label', 'Truth table for ' + label);
  currentTable = next;
}

function render(): void {
  if (composing) return;
  if (pendingError !== undefined) clearTimeout(pendingError);
  pendingError = undefined;
  stepsButton.setAttribute('aria-pressed', String(showSteps));
  stepsState.textContent = showSteps ? '●' : '○';
  digitsButton.setAttribute('aria-pressed', String(digits));
  digitsButton.textContent = digits ? '1/0' : 'T/F';
  clearButton.disabled = editor.value.length === 0;
  error.textContent = '';
  editor.removeAttribute('aria-invalid');

  const input = editor.value.trim();
  if (!input) {
    currentTable = null;
    clearTable();
  } else {
    try {
      const ast = parse(input);
      updateTable(buildTruthTable(ast, showSteps), format(ast));
    } catch (cause) {
      // Briefly retain a dimmed last result while the user finishes typing.
      // After a pause, remove it rather than presenting stale data as current.
      currentTable = null;
      surface.classList.add('is-pending');
      surface.setAttribute('aria-busy', 'true');
      const message = cause instanceof Error ? cause.message : 'Invalid expression';
      const snapshot = editor.value;
      pendingError = setTimeout(() => {
        if (editor.value !== snapshot) return;
        clearTable('—');
        editor.setAttribute('aria-invalid', 'true');
        error.textContent = message;
      }, 340);
    }
  }
  copyButton.disabled = currentTable === null;
  csvButton.disabled = currentTable === null;
  syncURL();
}

// Clipboard API requires a secure context; retain a local fallback for previews.
async function writeClipboard(content: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(content);
      return true;
    } catch { /* Try the fallback below. */ }
  }
  const originalFocus = document.activeElement;
  const temporary = document.createElement('textarea');
  temporary.value = content;
  temporary.setAttribute('readonly', '');
  temporary.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0';
  document.body.append(temporary);
  temporary.select();
  let copied = false;
  try { copied = document.execCommand('copy'); } catch { /* No clipboard permission. */ }
  temporary.remove();
  if (originalFocus instanceof HTMLElement) originalFocus.focus({ preventScroll: true });
  return copied;
}

async function copy(content: string, button: HTMLButtonElement, success: string): Promise<void> {
  tell(await writeClipboard(content) ? success : 'Clipboard unavailable', button);
}

function insert(symbol: string): void {
  const original = editor.value;
  const edit = insertSymbol(original, editor.selectionStart ?? original.length, editor.selectionEnd ?? original.length, symbol);
  if (!edit.changed) {
    tell('Expression limit reached', clearButton);
    return;
  }
  // Replace only the changed text, preserving the surrounding text and selection.
  let from = 0;
  while (from < original.length && from < edit.value.length && original[from] === edit.value[from]) from++;
  let suffix = 0;
  while (suffix < original.length - from && suffix < edit.value.length - from
    && original[original.length - suffix - 1] === edit.value[edit.value.length - suffix - 1]) suffix++;
  editor.focus({ preventScroll: true });
  editor.setRangeText(edit.value.slice(from, edit.value.length - suffix), from, original.length - suffix, 'end');
  editor.setSelectionRange(edit.start, edit.end);
  render();
}

editor.addEventListener('compositionstart', () => { composing = true; });
editor.addEventListener('compositionend', () => { composing = false; render(); });
editor.addEventListener('input', render);
clearButton.addEventListener('click', () => {
  editor.value = '';
  render();
  editor.focus({ preventScroll: true });
});
document.querySelectorAll<HTMLButtonElement>('[data-insert]').forEach(button => {
  button.addEventListener('click', () => insert(button.dataset.insert ?? ''));
});
stepsButton.addEventListener('click', () => { showSteps = !showSteps; render(); });
digitsButton.addEventListener('click', () => { digits = !digits; render(); });
copyButton.addEventListener('click', () => {
  if (currentTable) void copy(exportDelimited(currentTable, '\t', digits), copyButton, 'Copied');
});
csvButton.addEventListener('click', () => {
  if (!currentTable) return;
  const csv = '\uFEFF' + exportDelimited(currentTable, ',', digits) + '\r\n';
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'truth-table.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  tell('Downloaded', csvButton);
});
shareButton.addEventListener('click', () => { void copy(window.location.href, shareButton, 'Link copied'); });
document.addEventListener('keydown', event => {
  if (event.isComposing) return;
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && currentTable) {
    event.preventDefault();
    void copy(exportDelimited(currentTable, '\t', digits), copyButton, 'Copied');
  }
  if (event.key === '/' && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)
      && !event.altKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    editor.focus({ preventScroll: true });
  }
  if (event.key === 'Escape' && document.activeElement === editor) editor.blur();
});
window.addEventListener('popstate', () => {
  const current = new URLSearchParams(window.location.search);
  editor.value = current.get('q') ?? DEFAULT_EXPRESSION;
  showSteps = current.get('steps') === '1';
  digits = current.get('digits') === '1';
  render();
});
render();
