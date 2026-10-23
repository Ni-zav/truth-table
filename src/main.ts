import './styles.css';
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

const params = new URLSearchParams(window.location.search);
if (params.has('q')) editor.value = params.get('q') ?? '';
let showSteps = params.get('steps') === '1';
let digits = params.get('digits') === '1';
let currentTable: TruthTable | null = null;
let noticeTimeout: ReturnType<typeof setTimeout> | undefined;
const superscript: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸' };

function tell(message: string): void {
  feedback.textContent = message;
  if (noticeTimeout !== undefined) clearTimeout(noticeTimeout);
  noticeTimeout = setTimeout(() => { feedback.textContent = ''; }, 2800);
}

function syncURL(): void {
  const url = new URL(window.location.href);
  if (editor.value && editor.value !== 'A ∧ (B ∨ ¬C)') url.searchParams.set('q', editor.value);
  else url.searchParams.delete('q');
  if (showSteps) url.searchParams.set('steps', '1');
  else url.searchParams.delete('steps');
  if (digits) url.searchParams.set('digits', '1');
  else url.searchParams.delete('digits');
  window.history.replaceState(null, '', url);
}

function cell(tag: 'th' | 'td', value: string, className = ''): HTMLTableCellElement {
  const element = document.createElement(tag);
  element.textContent = value;
  if (className) element.className = className;
  if (tag === 'th') element.setAttribute('scope', 'col');
  return element;
}

function render(): void {
  stepsButton.setAttribute('aria-pressed', String(showSteps));
  stepsState.textContent = showSteps ? '●' : '○';
  digitsButton.setAttribute('aria-pressed', String(digits));
  digitsButton.textContent = digits ? '1/0' : 'T/F';
  const input = editor.value.trim();
  error.textContent = '';
  currentTable = null;
  table.tHead?.replaceChildren();
  table.tBodies[0]?.replaceChildren();
  surface.classList.remove('has-result');
  rowCount.textContent = '';

  if (!input) {
    surface.setAttribute('data-empty', '∅');
    editor.removeAttribute('aria-invalid');
    syncURL();
    return;
  }
  try {
    const ast = parse(input);
    currentTable = buildTruthTable(ast, showSteps);
    const thead = table.tHead ?? table.createTHead();
    const tbody = table.tBodies[0] ?? table.createTBody();
    const headers = document.createElement('tr');
    for (const name of currentTable.variables) headers.append(cell('th', name, 'variable-heading'));
    for (const column of currentTable.columns) headers.append(cell('th', column.text, 'formula-heading'));
    thead.append(headers);
    const fragment = document.createDocumentFragment();
    const value = (bool: boolean) => digits ? (bool ? '1' : '0') : (bool ? 'T' : 'F');
    for (const row of currentTable.rows) {
      const tr = document.createElement('tr');
      for (const item of row.inputs) tr.append(cell('td', value(item), 'input-cell'));
      for (const [index, output] of row.outputs.entries()) {
        tr.append(cell('td', value(output), index === row.outputs.length - 1 ? 'result-cell ' + (output ? 'true' : 'false') : 'step-cell'));
      }
      fragment.append(tr);
    }
    tbody.append(fragment);
    const count = currentTable.rows.length;
    rowCount.textContent = '2' + String(currentTable.variables.length).split('').map(char => superscript[char] ?? char).join('') + ' = ' + count;
    surface.setAttribute('data-empty', '');
    surface.classList.add('has-result');
    editor.removeAttribute('aria-invalid');
    table.setAttribute('aria-label', 'Truth table for ' + format(ast));
  } catch (cause) {
    editor.setAttribute('aria-invalid', 'true');
    error.textContent = cause instanceof Error ? cause.message : 'Invalid expression';
    surface.setAttribute('data-empty', '—');
  }
  syncURL();
}

async function copy(content: string, message: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(content);
    tell(message);
  } catch {
    tell('Clipboard unavailable');
  }
}

editor.addEventListener('input', render);
document.querySelector<HTMLButtonElement>('#clear')!.addEventListener('click', () => {
  editor.value = '';
  render();
  editor.focus();
});
document.querySelectorAll<HTMLButtonElement>('[data-insert]').forEach(button => {
  button.addEventListener('click', () => {
    const operator = button.dataset.insert ?? '';
    const inserted = ['¬', '(', ')'].includes(operator) ? operator : ' ' + operator + ' ';
    const start = editor.selectionStart ?? editor.value.length;
    const end = editor.selectionEnd ?? editor.value.length;
    editor.setRangeText(inserted, start, end, 'end');
    editor.focus();
    render();
  });
});
stepsButton.addEventListener('click', () => { showSteps = !showSteps; render(); });
digitsButton.addEventListener('click', () => { digits = !digits; render(); });
document.querySelector<HTMLButtonElement>('#copy')!.addEventListener('click', () => {
  if (currentTable) void copy(exportDelimited(currentTable, '\t', digits), 'Table copied');
  else tell('No table to copy');
});
document.querySelector<HTMLButtonElement>('#csv')!.addEventListener('click', () => {
  if (!currentTable) { tell('No table to export'); return; }
  const csv = '\uFEFF' + exportDelimited(currentTable, ',', digits) + '\r\n';
  const link = document.createElement('a');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  link.href = url;
  link.download = 'truth-table.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  tell('CSV downloaded');
});
document.querySelector<HTMLButtonElement>('#share')!.addEventListener('click', () => {
  void copy(window.location.href, 'Link copied');
});
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && currentTable) {
    event.preventDefault();
    void copy(exportDelimited(currentTable, '\t', digits), 'Table copied');
  }
  if (event.key === '/' && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement) && !event.altKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    editor.focus();
  }
});
window.addEventListener('popstate', () => {
  const current = new URLSearchParams(window.location.search);
  editor.value = current.get('q') ?? 'A ∧ (B ∨ ¬C)';
  showSteps = current.get('steps') === '1';
  digits = current.get('digits') === '1';
  render();
});
render();
