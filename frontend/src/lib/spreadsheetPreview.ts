import type { Border, Cell, Color, Font, Worksheet } from 'exceljs';
import { format } from 'ssf';

export const spreadsheetCss = `
html,body{margin:0;height:100%;background:#fff;color:#17212b;font:14px Calibri,Carlito,"Segoe UI",Arial,sans-serif}
*{box-sizing:border-box}#sheet{min-width:100%;min-height:100%;outline:none}
table{border-collapse:separate;border-spacing:0;table-layout:fixed}
th{background:#f4f6f8;color:#64748b;font:12px "Segoe UI",Arial,sans-serif;font-weight:400;user-select:none;text-align:center}
thead th{position:sticky;top:0;height:26px;z-index:4;border-right:1px solid #dce1e6;border-bottom:1px solid #cbd2d9}
tbody th{position:sticky;left:0;z-index:3;border-right:1px solid #cbd2d9;border-bottom:1px solid #dce1e6}
thead th:first-child{left:0;z-index:6}td{background:#fff;vertical-align:bottom;border-right:1px solid #e6e9ec;border-bottom:1px solid #e6e9ec;padding:0 4px;cursor:cell;line-height:1.2;overflow:hidden}
td>div{overflow:hidden;text-overflow:clip;white-space:pre}td:focus{outline:none}
td[data-selected]{outline:2px solid #16834b;outline-offset:-2px;position:relative;z-index:5}
th[data-selected]{background:#e2f2e9;color:#166534;font-weight:600}
.no-grid td{border-right-color:transparent;border-bottom-color:transparent}
`;

const defaultTheme = [
  'FFFFFF',
  '000000',
  'E7E6E6',
  '44546A',
  '4472C4',
  'ED7D31',
  'A5A5A5',
  'FFC000',
  '5B9BD5',
  '70AD47',
  '0563C1',
  '954F72'
];
const indexedColors = [
  '000000',
  'FFFFFF',
  'FF0000',
  '00FF00',
  '0000FF',
  'FFFF00',
  'FF00FF',
  '00FFFF',
  '000000',
  'FFFFFF',
  'FF0000',
  '00FF00',
  '0000FF',
  'FFFF00',
  'FF00FF',
  '00FFFF',
  '800000',
  '008000',
  '000080',
  '808000',
  '800080',
  '008080',
  'C0C0C0',
  '808080',
  '9999FF',
  '993366',
  'FFFFCC',
  'CCFFFF',
  '660066',
  'FF8080',
  '0066CC',
  'CCCCFF',
  '000080',
  'FF00FF',
  'FFFF00',
  '00FFFF',
  '800080',
  '800000',
  '008080',
  '0000FF',
  '00CCFF',
  'CCFFFF',
  'CCFFCC',
  'FFFF99',
  '99CCFF',
  'FF99CC',
  'CC99FF',
  'FFCC99',
  '3366FF',
  '33CCCC',
  '99CC00',
  'FFCC00',
  'FF9900',
  'FF6600',
  '666699',
  '969696',
  '003366',
  '339966',
  '003300',
  '333300',
  '993300',
  '993366',
  '333399',
  '333333'
];

export function spreadsheetTheme(xml?: string): string[] {
  if (!xml) return defaultTheme;
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  const scheme = document.getElementsByTagNameNS('*', 'clrScheme')[0];
  const names = [
    'lt1',
    'dk1',
    'lt2',
    'dk2',
    'accent1',
    'accent2',
    'accent3',
    'accent4',
    'accent5',
    'accent6',
    'hlink',
    'folHlink'
  ];
  return names.map((name, index) => {
    const value = scheme?.getElementsByTagNameNS('*', name)[0]
      ?.firstElementChild;
    const hex = value?.getAttribute('lastClr') || value?.getAttribute('val');
    return hex && /^[a-f\d]{6}$/i.test(hex) ? hex : defaultTheme[index];
  });
}

function color(
  value: Partial<Color> | undefined,
  theme: string[]
): string | undefined {
  if (!value) return;
  const details = value as Partial<Color> & { indexed?: number; tint?: number };
  const hex =
    value.argb?.slice(-6) ||
    (value.theme !== undefined ? theme[value.theme] : undefined) ||
    (details.indexed !== undefined
      ? indexedColors[details.indexed]
      : undefined);
  if (!hex || !/^[a-f\d]{6}$/i.test(hex)) return;
  const tint = Math.max(-1, Math.min(1, details.tint || 0));
  const channels = [0, 2, 4].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16);
    return Math.round(
      tint < 0 ? channel * (1 + tint) : channel + (255 - channel) * tint
    );
  });
  return `rgb(${channels.join(',')})`;
}

function font(element: HTMLElement, value: Partial<Font>, theme: string[]) {
  if (value.name)
    element.style.fontFamily = `"${value.name.replace(/["\\\r\n]/g, '')}",Calibri,"Segoe UI",Arial,sans-serif`;
  if (value.size)
    element.style.fontSize = `${(Math.max(6, Math.min(96, value.size)) * 4) / 3}px`;
  if (value.bold !== undefined)
    element.style.fontWeight = value.bold ? '700' : '400';
  if (value.italic !== undefined)
    element.style.fontStyle = value.italic ? 'italic' : 'normal';
  element.style.textDecoration = [
    value.underline && value.underline !== 'none' ? 'underline' : '',
    value.strike ? 'line-through' : ''
  ]
    .filter(Boolean)
    .join(' ');
  const foreground = color(value.color, theme);
  if (foreground) element.style.color = foreground;
}

function border(value: Partial<Border> | undefined, theme: string[]) {
  if (!value?.style) return;
  const width =
    value.style === 'thick'
      ? 3
      : value.style.startsWith('medium') || value.style === 'double'
        ? 2
        : 1;
  const line =
    value.style === 'double'
      ? 'double'
      : /dot/i.test(value.style) && !/dash/i.test(value.style)
        ? 'dotted'
        : /dash/i.test(value.style)
          ? 'dashed'
          : 'solid';
  return `${width}px ${line} ${color(value.color, theme) || '#111827'}`;
}

export function spreadsheetCellText(cell: Cell): string {
  const raw = cell.value;
  const value =
    raw && typeof raw === 'object' && 'result' in raw ? raw.result : raw;
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && !(value instanceof Date))
    return 'error' in value ? value.error : cell.text;
  if (cell.numFmt?.length > 256) return cell.text;
  try {
    // ExcelJS stores Excel dates in UTC; SSF interprets Date fields locally.
    const date =
      value instanceof Date
        ? new Date(
            value.getUTCFullYear(),
            value.getUTCMonth(),
            value.getUTCDate(),
            value.getUTCHours(),
            value.getUTCMinutes(),
            value.getUTCSeconds()
          )
        : value;
    return format(
      cell.numFmt || (value instanceof Date ? 'yyyy-mm-dd' : 'General'),
      date,
      { date1904: cell.workbook.properties.date1904 }
    );
  } catch {
    return cell.text;
  }
}

export interface SpreadsheetSelection {
  address: string;
  value: string;
}

export function renderSpreadsheet(
  document: Document,
  host: HTMLElement,
  worksheet: Worksheet,
  theme: string[],
  onSelect: (selection: SpreadsheetSelection) => void
) {
  const rowLimit = Math.min(Math.max(worksheet.rowCount, 30), 500);
  const colLimit = Math.min(Math.max(worksheet.columnCount, 12), 50);
  const rows = Array.from({ length: rowLimit }, (_, index) => index + 1).filter(
    (index) => !worksheet.getRow(index).hidden
  );
  const columns = Array.from(
    { length: colLimit },
    (_, index) => index + 1
  ).filter((index) => !worksheet.getColumn(index).hidden);
  const table = document.createElement('table');
  table.setAttribute('role', 'grid');
  table.setAttribute('aria-label', worksheet.name);
  table.setAttribute('aria-readonly', 'true');
  if (worksheet.views?.[0]?.showGridLines === false)
    table.className = 'no-grid';
  const widths = columns.map((index) =>
    Math.max(
      24,
      Math.min(
        1800,
        (worksheet.getColumn(index).width ||
          worksheet.properties.defaultColWidth ||
          8.43) *
          7 +
          5
      )
    )
  );
  const heights = rows.map((index) =>
    Math.max(
      16,
      Math.min(
        600,
        ((worksheet.getRow(index).height ||
          worksheet.properties.defaultRowHeight ||
          15) *
          4) /
          3
      )
    )
  );
  const colgroup = document.createElement('colgroup');
  [44, ...widths].forEach((width) => {
    const column = document.createElement('col');
    column.style.width = `${width}px`;
    colgroup.appendChild(column);
  });
  table.style.width = `${44 + widths.reduce((sum, width) => sum + width, 0)}px`;
  table.appendChild(colgroup);
  const head = table.createTHead().insertRow();
  head.appendChild(document.createElement('th'));
  columns.forEach((index) => {
    const header = document.createElement('th');
    header.scope = 'col';
    header.dataset.column = String(index);
    header.textContent = worksheet.getColumn(index).letter;
    head.appendChild(header);
  });
  const merges = new Map<string, { rows: number; columns: number }>();
  for (const range of worksheet.model.merges || []) {
    const [start, end = start] = range.split(':');
    const first = worksheet.getCell(start);
    const last = worksheet.getCell(end);
    if (Number(first.row) > rowLimit || Number(first.col) > colLimit) continue;
    merges.set(first.address, {
      rows: rows.filter(
        (index) => index >= Number(first.row) && index <= Number(last.row)
      ).length,
      columns: columns.filter(
        (index) => index >= Number(first.col) && index <= Number(last.col)
      ).length
    });
  }
  const view = worksheet.views?.find((item) => item.state === 'frozen');
  const frozen = view?.state === 'frozen' ? view : undefined;
  let top = 26;
  const body = table.createTBody();
  rows.forEach((rowIndex, rowPosition) => {
    const row = body.insertRow();
    row.style.height = `${heights[rowPosition]}px`;
    const rowHeader = document.createElement('th');
    rowHeader.scope = 'row';
    rowHeader.dataset.row = String(rowIndex);
    rowHeader.textContent = String(rowIndex);
    const frozenRow = frozen && rowIndex <= (frozen.ySplit || 0);
    if (frozenRow) {
      rowHeader.style.top = `${top}px`;
      rowHeader.style.zIndex = '5';
    }
    row.appendChild(rowHeader);
    let left = 44;
    columns.forEach((columnIndex, columnPosition) => {
      const cell = worksheet.getCell(rowIndex, columnIndex);
      const frozenColumn = frozen && columnIndex <= (frozen.xSplit || 0);
      if (frozenColumn) {
        const header = head.cells[columnPosition + 1];
        header.style.left = `${left}px`;
        header.style.zIndex = '5';
      }
      if (!(cell.isMerged && cell.master.address !== cell.address)) {
        const node = row.insertCell();
        node.dataset.row = String(rowIndex);
        node.dataset.column = String(columnIndex);
        node.dataset.address = cell.address;
        node.tabIndex = -1;
        const merged = merges.get(cell.address);
        if (merged) {
          node.rowSpan = Math.max(1, merged.rows);
          node.colSpan = Math.max(1, merged.columns);
        }
        font(node, cell.font || {}, theme);
        const alignment = cell.alignment || {};
        const raw = cell.value;
        const value =
          raw && typeof raw === 'object' && 'result' in raw ? raw.result : raw;
        if (
          (typeof value === 'number' || value instanceof Date) &&
          !alignment.wrapText
        )
          node.dataset.numeric = '';
        node.style.textAlign =
          alignment.horizontal === 'centerContinuous'
            ? 'center'
            : alignment.horizontal === 'fill' ||
                alignment.horizontal === 'distributed'
              ? 'left'
              : alignment.horizontal ||
                (typeof value === 'number' || value instanceof Date
                  ? 'right'
                  : 'left');
        node.style.verticalAlign =
          alignment.vertical === 'middle'
            ? 'middle'
            : alignment.vertical === 'top'
              ? 'top'
              : 'bottom';
        if (alignment.indent)
          node.style.paddingLeft = `${4 + Math.min(20, alignment.indent) * 10}px`;
        const fill = cell.fill;
        if (fill?.type === 'pattern' && fill.pattern !== 'none')
          node.style.backgroundColor =
            color(fill.fgColor || fill.bgColor, theme) || '#fff';
        for (const side of ['top', 'bottom', 'left', 'right'] as const) {
          const line = border(cell.border?.[side], theme);
          if (line) node.style.setProperty(`border-${side}`, line);
        }
        if (frozenRow || frozenColumn) {
          node.style.position = 'sticky';
          node.style.zIndex = frozenRow && frozenColumn ? '4' : '2';
          if (frozenRow) node.style.top = `${top}px`;
          if (frozenColumn) node.style.left = `${left}px`;
        }
        const content = document.createElement('div');
        if (worksheet.getRow(rowIndex).height)
          content.style.maxHeight = `${heights.slice(rowPosition, rowPosition + node.rowSpan).reduce((sum, height) => sum + height, 0)}px`;
        if (alignment.wrapText) {
          content.style.whiteSpace = 'pre-wrap';
          content.style.overflowWrap = 'anywhere';
        }
        if (raw && typeof raw === 'object' && 'richText' in raw) {
          raw.richText.forEach((run) => {
            const span = document.createElement('span');
            span.textContent = run.text;
            if (run.font) font(span, run.font, theme);
            content.appendChild(span);
          });
        } else content.textContent = spreadsheetCellText(cell);
        // Text can extend over adjacent empty cells, as it does in Excel.
        if (
          typeof raw === 'string' &&
          !alignment.wrapText &&
          node.colSpan === 1 &&
          !alignment.horizontal
        ) {
          let available = widths[columnPosition] - 8;
          for (let next = columnPosition + 1; next < columns.length; next++) {
            const neighbor = worksheet.getCell(rowIndex, columns[next]);
            if (
              (neighbor.value !== null && neighbor.value !== undefined) ||
              neighbor.isMerged ||
              (neighbor.fill?.type === 'pattern' &&
                neighbor.fill.pattern !== 'none')
            )
              break;
            available += widths[next];
          }
          node.style.overflow = 'visible';
          content.style.position = 'relative';
          content.style.zIndex = '1';
          content.style.width = `${available}px`;
          content.style.pointerEvents = 'none';
        }
        node.title = content.textContent || '';
        node.appendChild(content);
      }
      left += widths[columnPosition];
    });
    top += heights[rowPosition];
  });
  host.replaceChildren(table);
  // Excel uses hashes rather than showing a misleading partial number/date.
  host
    .querySelectorAll<HTMLTableCellElement>('td[data-numeric]')
    .forEach((cell) => {
      const content = cell.firstElementChild as HTMLElement;
      if (content.scrollWidth > cell.clientWidth - 8 && cell.clientWidth)
        content.textContent = '#####';
    });
  // Wrapped text can increase an automatic row height after layout.
  if (frozen) {
    let stickyTop = 26;
    [...body.rows].forEach((row, index) => {
      if (rows[index] <= (frozen.ySplit || 0)) {
        [...row.cells].forEach((cell) => (cell.style.top = `${stickyTop}px`));
      }
      stickyTop += row.offsetHeight || heights[index];
    });
  }
  let selected: HTMLTableCellElement | undefined;
  const select = (node: HTMLTableCellElement, focus = false) => {
    host
      .querySelectorAll('[data-selected]')
      .forEach((item) => item.removeAttribute('data-selected'));
    if (selected) selected.tabIndex = -1;
    selected = node;
    node.dataset.selected = '';
    node.tabIndex = 0;
    head
      .querySelector(`[data-column="${node.dataset.column}"]`)
      ?.setAttribute('data-selected', '');
    body
      .querySelector(`th[data-row="${node.dataset.row}"]`)
      ?.setAttribute('data-selected', '');
    const cell = worksheet.getCell(node.dataset.address!);
    onSelect({
      address: cell.address,
      value: cell.formula ? `=${cell.formula}` : spreadsheetCellText(cell)
    });
    if (focus) node.focus({ preventScroll: true });
  };
  const onClick = (event: Event) => {
    const node = (event.target as HTMLElement).closest<HTMLTableCellElement>(
      'td[data-address]'
    );
    if (node) select(node, true);
  };
  const onKey = (event: KeyboardEvent) => {
    if (
      !selected ||
      !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)
    )
      return;
    event.preventDefault();
    const row = rows.indexOf(Number(selected.dataset.row));
    const column = columns.indexOf(Number(selected.dataset.column));
    const nextRow =
      rows[
        row +
          (event.key === 'ArrowUp'
            ? -1
            : event.key === 'ArrowDown'
              ? selected.rowSpan
              : 0)
      ];
    const nextColumn =
      columns[
        column +
          (event.key === 'ArrowLeft'
            ? -1
            : event.key === 'ArrowRight'
              ? selected.colSpan
              : 0)
      ];
    if (!nextRow || !nextColumn) return;
    const cell = worksheet.getCell(nextRow, nextColumn);
    const address = cell.isMerged ? cell.master.address : cell.address;
    const node = host.querySelector<HTMLTableCellElement>(
      `td[data-address="${address}"]`
    );
    if (node) {
      select(node, true);
      node.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  };
  host.addEventListener('click', onClick);
  host.addEventListener('keydown', onKey);
  const first = body.querySelector<HTMLTableCellElement>('td');
  if (first) select(first);
  return {
    truncated:
      worksheet.rowCount > rowLimit || worksheet.columnCount > colLimit,
    dispose: () => {
      host.removeEventListener('click', onClick);
      host.removeEventListener('keydown', onKey);
    }
  };
}
