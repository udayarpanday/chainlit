import type { Workbook } from 'exceljs';
import type JSZip from 'jszip';

import { spreadsheetCellText } from './spreadsheetPreview';

export type ChartKind =
  'bar' | 'line' | 'area' | 'pie' | 'doughnut' | 'scatter';
export interface ChartMarker {
  col: number;
  row: number;
  x: number;
  y: number;
}
export interface ChartSeries {
  name: string;
  kind: ChartKind;
  values: (number | null)[];
  categories: string[];
  xValues: (number | null)[];
  color?: string;
  pointColors: Record<number, string>;
}
export interface SpreadsheetChart {
  id: string;
  title: string;
  series: ChartSeries[];
  horizontal: boolean;
  grouping: string;
  legend: boolean;
  xTitle: string;
  yTitle: string;
  hole: number;
  from: ChartMarker;
  to?: ChartMarker;
  width: number;
  height: number;
  unavailable?: string;
}
export interface WorkbookCharts {
  bySheet: Map<string, SpreadsheetChart[]>;
  unavailable: number;
}

const maxPoints = 500;
const relationshipNamespace =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const strictRelationshipNamespace =
  'http://purl.oclc.org/ooxml/officeDocument/relationships';
const child = (node: Element | undefined, name: string) =>
  node && [...node.children].find((item) => item.localName === name);
const all = (node: Element | Document | undefined, name: string): Element[] =>
  node ? [...node.getElementsByTagNameNS('*', name)] : [];
const first = (node: Element | Document | undefined, name: string) =>
  all(node, name)[0];
const value = (node: Element | undefined) => node?.getAttribute('val') || '';
const relationId = (node: Element) =>
  node.getAttributeNS(relationshipNamespace, 'id') ||
  node.getAttributeNS(strictRelationshipNamespace, 'id') ||
  '';

async function xml(archive: JSZip, path: string) {
  const file = archive.file(path);
  if (!file) throw new Error('Missing chart part');
  const source = await file.async('text');
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error('Unsupported XML');
  const document = new DOMParser().parseFromString(source, 'application/xml');
  if (document.getElementsByTagName('parsererror').length)
    throw new Error('Invalid chart XML');
  return document;
}

// Resolve package paths only. External relationships are never fetched.
function partPath(source: string, target: string): string | undefined {
  if (!target || /[\\?#]|^[a-z][a-z\d+.-]*:|^\/\//i.test(target)) return;
  const segments = target.startsWith('/') ? [] : source.split('/').slice(0, -1);
  for (const segment of target.split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      if (!segments.length) return;
      segments.pop();
    } else segments.push(segment);
  }
  return segments.join('/');
}

async function relationships(archive: JSZip, source: string) {
  const parts = source.split('/');
  const name = parts.pop()!;
  const path = [...parts, '_rels', `${name}.rels`].join('/');
  const result = new Map<string, string>();
  if (!archive.file(path)) return result;
  for (const relation of all(await xml(archive, path), 'Relationship')) {
    if (relation.getAttribute('TargetMode')?.toLowerCase() === 'external')
      continue;
    const resolved = partPath(source, relation.getAttribute('Target') || '');
    if (resolved && resolved.startsWith('xl/'))
      result.set(relation.getAttribute('Id') || '', resolved);
  }
  return result;
}

function numeric(text: string | null | undefined): number | null {
  if (text == null || !text.trim()) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function rangeValues(
  formula: string,
  workbook: Workbook,
  labels: boolean
): (string | number | null)[] | undefined {
  const match =
    /^(?:'((?:[^']|'')+)'|([^'!\[\]]+))!\$?([A-Z]{1,3})\$?(\d+)(?::\$?([A-Z]{1,3})\$?(\d+))?$/i.exec(
      formula.trim()
    );
  if (!match) return;
  const sheet = workbook.getWorksheet(
    (match[1] || match[2]).replace(/''/g, "'")
  );
  if (!sheet) return;
  const column = (letters: string) =>
    [...letters.toUpperCase()].reduce(
      (sum, letter) => sum * 26 + letter.charCodeAt(0) - 64,
      0
    );
  const fromCol = column(match[3]);
  const toCol = column(match[5] || match[3]);
  const fromRow = Number(match[4]);
  const toRow = Number(match[6] || match[4]);
  if (
    fromCol < 1 ||
    toCol > 16384 ||
    fromRow < 1 ||
    toRow > 1048576 ||
    toCol < fromCol ||
    toRow < fromRow
  )
    return;
  if ((toCol - fromCol + 1) * (toRow - fromRow + 1) > maxPoints)
    throw new Error('Chart has too many points');
  const values: (string | number | null)[] = [];
  for (let row = fromRow; row <= toRow; row++) {
    for (let col = fromCol; col <= toCol; col++) {
      const cell = sheet.getCell(row, col);
      const raw = cell.value;
      const cached =
        raw && typeof raw === 'object' && 'result' in raw ? raw.result : raw;
      values.push(
        labels
          ? spreadsheetCellText(cell)
          : typeof cached === 'number' && Number.isFinite(cached)
            ? cached
            : null
      );
    }
  }
  return values;
}

function sourceValues(
  source: Element | undefined,
  workbook: Workbook,
  labels = false
): (string | number | null)[] {
  if (!source) return [];
  const formula = first(source, 'f')?.textContent;
  if (formula) {
    const values = rangeValues(formula, workbook, labels);
    // Locally generated files often omit caches. Formula cells themselves are
    // never evaluated; their stored results are used when available.
    if (values?.some((item) => item !== null && item !== '')) return values;
  }
  const cache =
    first(source, 'numCache') ||
    first(source, 'strCache') ||
    first(source, 'numLit') ||
    first(source, 'strLit');
  if (!cache) return [];
  const count = numeric(value(child(cache, 'ptCount'))) || 0;
  if (count > maxPoints) throw new Error('Chart has too many points');
  const values: (string | number | null)[] = Array.from(
    { length: count },
    () => null
  );
  for (const point of [...cache.children].filter(
    (node) => node.localName === 'pt'
  )) {
    const index = Number(point.getAttribute('idx'));
    if (!Number.isInteger(index) || index < 0 || index >= maxPoints)
      throw new Error('Invalid chart point');
    const text = child(point, 'v')?.textContent || '';
    while (values.length <= index) values.push(null);
    values[index] = labels ? text : numeric(text);
  }
  return values;
}

function chartText(node: Element | undefined, workbook: Workbook): string {
  const rich = all(node, 't')
    .map((item) => item.textContent || '')
    .join('');
  return (
    rich ||
    String(
      sourceValues(node, workbook, true)[0] ||
        first(node, 'v')?.textContent ||
        ''
    )
  );
}

function chartColor(
  node: Element | undefined,
  theme: string[]
): string | undefined {
  const fill = child(node, 'solidFill');
  const rgb = value(child(fill, 'srgbClr'));
  if (/^[\da-f]{6}$/i.test(rgb)) return `#${rgb}`;
  const scheme = value(child(fill, 'schemeClr'));
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
  const hex = theme[names.indexOf(scheme)];
  return hex && /^[\da-f]{6}$/i.test(hex) ? `#${hex}` : undefined;
}

function marker(node: Element | undefined): ChartMarker {
  const coordinate = (name: string, max: number) =>
    Math.max(0, Math.min(max, numeric(child(node, name)?.textContent) || 0));
  return {
    col: coordinate('col', 16384),
    row: coordinate('row', 1048576),
    x: coordinate('colOff', 19050000) / 9525,
    y: coordinate('rowOff', 19050000) / 9525
  };
}

function parseChart(
  root: Document,
  chart: SpreadsheetChart,
  workbook: Workbook,
  theme: string[]
) {
  const plot = first(root, 'plotArea');
  if (!plot) throw new Error('Missing chart plot');
  chart.title =
    chartText(child(first(root, 'chart'), 'title'), workbook) || chart.title;
  chart.legend = !!first(root, 'legend');
  const types: Record<string, ChartKind> = {
    barChart: 'bar',
    lineChart: 'line',
    areaChart: 'area',
    pieChart: 'pie',
    doughnutChart: 'doughnut',
    scatterChart: 'scatter'
  };
  const plots = [...plot.children].filter((node) =>
    node.localName.endsWith('Chart')
  );
  if (!plots.length || plots.some((node) => !types[node.localName]))
    throw new Error('Unsupported chart type');
  if (first(plot, 'logBase'))
    throw new Error('Logarithmic axes are not supported');
  const axisSets = new Set(
    plots.map((node) =>
      [...node.children]
        .filter((item) => item.localName === 'axId')
        .map(value)
        .sort()
        .join(',')
    )
  );
  if (axisSets.size > 1)
    throw new Error('Secondary chart axes are not supported');
  chart.horizontal = value(child(plots[0], 'barDir')) === 'bar';
  chart.grouping = value(child(plots[0], 'grouping')) || 'clustered';
  chart.hole = Math.max(
    0.1,
    Math.min(0.9, (numeric(value(child(plots[0], 'holeSize'))) || 50) / 100)
  );
  const scatter = types[plots[0].localName] === 'scatter';
  const axes = all(plot, 'valAx');
  chart.xTitle = chartText(
    child(
      scatter ? axes[0] : first(plot, chart.horizontal ? 'valAx' : 'catAx'),
      'title'
    ),
    workbook
  );
  chart.yTitle = chartText(
    child(
      scatter ? axes[1] : first(plot, chart.horizontal ? 'catAx' : 'valAx'),
      'title'
    ),
    workbook
  );
  for (const group of plots) {
    for (const node of [...group.children].filter(
      (item) => item.localName === 'ser'
    )) {
      const kind = types[group.localName];
      const shape = child(node, 'spPr');
      const points: Record<number, string> = {};
      for (const point of [...node.children].filter(
        (item) => item.localName === 'dPt'
      )) {
        const index = numeric(value(child(point, 'idx')));
        const color = chartColor(child(point, 'spPr'), theme);
        if (index !== null && index >= 0 && index < maxPoints && color)
          points[index] = color;
      }
      const values = sourceValues(
        child(node, kind === 'scatter' ? 'yVal' : 'val'),
        workbook
      ).map((item) => (typeof item === 'number' ? item : null));
      chart.series.push({
        kind,
        name:
          chartText(child(node, 'tx'), workbook) ||
          `Series ${chart.series.length + 1}`,
        categories: sourceValues(child(node, 'cat'), workbook, true).map(
          (item) => (item == null ? '' : String(item))
        ),
        values,
        xValues: sourceValues(child(node, 'xVal'), workbook).map((item) =>
          typeof item === 'number' ? item : null
        ),
        color:
          chartColor(shape, theme) || chartColor(child(shape, 'ln'), theme),
        pointColors: points
      });
    }
  }
  if (
    !chart.series.length ||
    !chart.series.some((series) => series.values.some((item) => item !== null))
  )
    throw new Error('Chart data is unavailable');
  if (
    chart.series.some(
      (series) =>
        series.kind === 'scatter' &&
        !series.values.some(
          (value, index) => value !== null && series.xValues[index] != null
        )
    )
  )
    throw new Error('Scatter chart data is unavailable');
  if (
    chart.series.length > 20 ||
    chart.series.reduce((sum, series) => sum + series.values.length, 0) > 2000
  )
    throw new Error('Chart is too large');
  if (
    !Number.isFinite(
      chart.series.reduce(
        (sum, series) =>
          sum +
          [...series.values, ...series.xValues].reduce<number>(
            (total, item) => total + Math.abs(item || 0),
            0
          ),
        0
      )
    )
  )
    throw new Error('Chart values exceed the supported range');
  if (
    plots.length > 1 &&
    (chart.horizontal ||
      chart.grouping.includes('Stacked') ||
      chart.grouping === 'stacked' ||
      chart.series.some((series) =>
        ['scatter', 'pie', 'doughnut'].includes(series.kind)
      ))
  )
    throw new Error('Unsupported chart combination');
  if (
    chart.series.some((series) => ['pie', 'doughnut'].includes(series.kind)) &&
    chart.series.length > 1
  )
    throw new Error('Multiple pie series are not supported');
}

export async function readSpreadsheetCharts(
  archive: JSZip,
  workbook: Workbook,
  theme: string[]
): Promise<WorkbookCharts> {
  const result: WorkbookCharts = { bySheet: new Map(), unavailable: 0 };
  const manifest = await xml(archive, 'xl/workbook.xml');
  const sheets = await relationships(archive, 'xl/workbook.xml');
  let count = 0;
  for (const sheet of all(manifest, 'sheet')) {
    const name = sheet.getAttribute('name') || '';
    if (workbook.getWorksheet(name)?.state !== 'visible') continue;
    const path = sheets.get(relationId(sheet));
    if (!path) continue;
    try {
      const document = await xml(archive, path);
      const sheetRels = await relationships(archive, path);
      const charts: SpreadsheetChart[] = [];
      result.bySheet.set(name, charts);
      for (const drawing of all(document, 'drawing')) {
        const drawingPath = sheetRels.get(relationId(drawing));
        if (!drawingPath) {
          result.unavailable++;
          continue;
        }
        const drawingXml = await xml(archive, drawingPath);
        const drawingRels = await relationships(archive, drawingPath);
        for (const anchor of [...drawingXml.documentElement.children].filter(
          (node) =>
            ['oneCellAnchor', 'twoCellAnchor', 'absoluteAnchor'].includes(
              node.localName
            )
        )) {
          const reference = first(anchor, 'chart');
          if (!reference || count++ >= 32) {
            result.unavailable++;
            continue;
          }
          const chartPath = drawingRels.get(relationId(reference));
          const extent = child(anchor, 'ext');
          const chart: SpreadsheetChart = {
            id: `${drawingPath}:${charts.length}`,
            title: first(anchor, 'cNvPr')?.getAttribute('name') || 'Chart',
            series: [],
            horizontal: false,
            grouping: 'clustered',
            legend: false,
            xTitle: '',
            yTitle: '',
            hole: 0.5,
            from: marker(child(anchor, 'from')),
            to: child(anchor, 'to') ? marker(child(anchor, 'to')) : undefined,
            width: Math.max(
              240,
              Math.min(
                2000,
                (numeric(extent?.getAttribute('cx')) || 5715000) / 9525
              )
            ),
            height: Math.max(
              180,
              Math.min(
                1200,
                (numeric(extent?.getAttribute('cy')) || 3429000) / 9525
              )
            )
          };
          const position = child(anchor, 'pos');
          if (position)
            chart.from = {
              col: 0,
              row: 0,
              x: (numeric(position.getAttribute('x')) || 0) / 9525,
              y: (numeric(position.getAttribute('y')) || 0) / 9525
            };
          try {
            if (!chartPath) throw new Error('Missing chart relationship');
            parseChart(await xml(archive, chartPath), chart, workbook, theme);
          } catch {
            chart.unavailable =
              'This chart cannot be previewed. Open the downloaded workbook to view it.';
            result.unavailable++;
          }
          charts.push(chart);
        }
      }
    } catch {
      // A malformed optional drawing must not prevent the worksheets opening.
      result.unavailable++;
    }
  }
  return result;
}
