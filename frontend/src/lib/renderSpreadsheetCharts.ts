import type { Worksheet } from 'exceljs';

import type { ChartMarker, SpreadsheetChart } from './spreadsheetCharts';

const svgNamespace = 'http://www.w3.org/2000/svg';
const defaults = ['4472C4', 'ED7D31', 'A5A5A5', 'FFC000', '5B9BD5', '70AD47'];
const compact = (number: number) =>
  new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
    notation: Math.abs(number) >= 10000 ? 'compact' : 'standard'
  }).format(number);

// SVG is constructed as DOM nodes: workbook text never becomes HTML or code.
export function renderSpreadsheetChart(
  document: Document,
  chart: SpreadsheetChart,
  width: number,
  height: number,
  theme: string[]
) {
  const make = (
    name: string,
    attributes: Record<string, string | number> = {},
    text?: string
  ) => {
    const node = document.createElementNS(svgNamespace, name);
    for (const [key, value] of Object.entries(attributes))
      node.setAttribute(key, String(value));
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const svg = make('svg', {
    viewBox: `0 0 ${width} ${height}`,
    width: '100%',
    height: '100%',
    role: 'img',
    'aria-label': chart.title,
    style:
      'display:block;font:12px Calibri,Arial,sans-serif;background:white;color:#17212b'
  });
  svg.appendChild(make('title', {}, chart.title));
  const label = (
    text: string,
    x: number,
    y: number,
    anchor = 'middle',
    size = 11
  ) => {
    const node = make(
      'text',
      { x, y, 'text-anchor': anchor, 'font-size': size, fill: '#334155' },
      text
    );
    svg.appendChild(node);
    return node;
  };
  label(chart.title.slice(0, 90), width / 2, 24, 'middle', 15);
  if (chart.unavailable) {
    label('This chart cannot be previewed.', width / 2, height / 2);
    label('View it in the downloaded workbook.', width / 2, height / 2 + 20);
    return svg;
  }
  const palette = defaults.map(
    (fallback, index) =>
      `#${/^[\da-f]{6}$/i.test(theme[index + 4] || '') ? theme[index + 4] : fallback}`
  );
  const seriesColor = (index: number) =>
    chart.series[index].color || palette[index % palette.length];
  const pie =
    chart.series[0]?.kind === 'pie' || chart.series[0]?.kind === 'doughnut';
  const entries = pie
    ? chart.series[0].values.map((_, index) => ({
        name: chart.series[0].categories[index] || String(index + 1),
        color:
          chart.series[0].pointColors[index] || palette[index % palette.length]
      }))
    : chart.series.map((series, index) => ({
        name: series.name,
        color: seriesColor(index)
      }));
  const legend = chart.legend ? entries.slice(0, 12) : [];
  const legendColumns = Math.max(1, Math.min(3, Math.floor(width / 170)));
  const legendHeight = Math.ceil(legend.length / legendColumns) * 18;
  const tooltip = (node: SVGElement, text: string) =>
    node.appendChild(make('title', {}, text));
  const draw = (
    name: string,
    attributes: Record<string, string | number>,
    title?: string
  ) => {
    const node = make(name, attributes);
    if (title) tooltip(node, title);
    svg.appendChild(node);
    return node;
  };
  legend.forEach((entry, index) => {
    const x = 18 + (index % legendColumns) * ((width - 36) / legendColumns);
    const y =
      height - legendHeight + Math.floor(index / legendColumns) * 18 + 8;
    draw('rect', { x, y: y - 9, width: 10, height: 10, fill: entry.color });
    const text = label(
      entry.name.length > 22 ? entry.name.slice(0, 21) + '…' : entry.name,
      x + 16,
      y,
      'start'
    );
    tooltip(text, entry.name);
  });
  if (pie) {
    const series = chart.series[0];
    const positive = series.values.map((value) => Math.abs(value || 0));
    const sum = positive.reduce((total, value) => total + value, 0);
    if (!sum) {
      label('No chart values available', width / 2, height / 2);
      return svg;
    }
    const cx = width / 2;
    const cy = (height - legendHeight + 35) / 2;
    const radius = Math.max(
      30,
      Math.min(width - 40, height - legendHeight - 70) / 2
    );
    const inner = series.kind === 'doughnut' ? radius * chart.hole : 0;
    const point = (angle: number, distance: number) =>
      `${cx + Math.cos(angle) * distance},${cy + Math.sin(angle) * distance}`;
    let start = -Math.PI / 2;
    positive.forEach((value, index) => {
      if (!value) return;
      const end = start + (value / sum) * Math.PI * 2;
      const middle = (start + end) / 2;
      // Two arcs also handle a full-circle slice without a degenerate path.
      let path = `M${point(start, radius)} A${radius},${radius} 0 0 1 ${point(middle, radius)} A${radius},${radius} 0 0 1 ${point(end, radius)}`;
      path += inner
        ? ` L${point(end, inner)} A${inner},${inner} 0 0 0 ${point(middle, inner)} A${inner},${inner} 0 0 0 ${point(start, inner)} Z`
        : ` L${cx},${cy} Z`;
      draw(
        'path',
        {
          d: path,
          fill: entries[index].color,
          stroke: '#fff',
          'stroke-width': 1,
          'data-chart-slice': index
        },
        `${entries[index].name}: ${compact(series.values[index]!)} (${compact((value / sum) * 100)}%)`
      );
      start = end;
    });
    return svg;
  }

  const scatter = chart.series.every((series) => series.kind === 'scatter');
  const horizontal = chart.horizontal;
  const stacked =
    chart.grouping === 'stacked' || chart.grouping === 'percentStacked';
  const percent = chart.grouping === 'percentStacked';
  const count = Math.max(
    1,
    ...chart.series.map((series) => series.values.length)
  );
  const sums = Array.from({ length: count }, (_, index) => ({
    positive: chart.series.reduce(
      (total, series) => total + Math.max(0, series.values[index] || 0),
      0
    ),
    negative: chart.series.reduce(
      (total, series) =>
        total + Math.abs(Math.min(0, series.values[index] || 0)),
      0
    )
  }));
  const positive = new Array(count).fill(0);
  const negative = new Array(count).fill(0);
  const prepared = chart.series.map((series) =>
    series.values.map((raw, index) => {
      if (raw === null || raw === undefined) return null;
      const value = percent
        ? (raw /
            ((raw < 0 ? sums[index].negative : sums[index].positive) || 1)) *
          100
        : raw;
      const totals = value < 0 ? negative : positive;
      const start = stacked ? totals[index] : 0;
      const end = start + value;
      if (stacked) totals[index] = end;
      return { start, end, raw, index };
    })
  );
  const ends = prepared.flatMap((series) =>
    series.flatMap((point) => (point ? [point.start, point.end] : []))
  );
  let min = Math.min(0, ...ends);
  let max = Math.max(0, ...ends);
  if (min === max) max = min + 1;
  const padding = percent ? 0 : (max - min) * 0.06;
  const paddedMax = max > 0 ? max + padding : max;
  const paddedMin = min < 0 ? min - padding : min;
  if (Number.isFinite(paddedMax - paddedMin)) {
    max = paddedMax;
    min = paddedMin;
  }
  const left = horizontal ? 105 : 66;
  const top = 46;
  const plotWidth = Math.max(80, width - left - 22);
  const plotHeight = Math.max(
    50,
    height - top - legendHeight - (chart.xTitle ? 72 : 52)
  );
  const valuePosition = (value: number) =>
    horizontal
      ? left + ((value - min) / (max - min)) * plotWidth
      : top + ((max - value) / (max - min)) * plotHeight;
  const band = (horizontal ? plotHeight : plotWidth) / count;
  const categoryPosition = (index: number) =>
    (horizontal ? top : left) + band * (index + 0.5);
  const categoryName = (index: number) =>
    chart.series.find((series) => series.categories[index])?.categories[
      index
    ] || String(index + 1);
  const xValues = chart.series.flatMap((series) =>
    series.xValues.filter((item): item is number => item !== null)
  );
  let xMin = xValues.length ? Math.min(...xValues) : 0;
  let xMax = xValues.length ? Math.max(...xValues) : 1;
  if (xMin === xMax) {
    xMin -= 0.5;
    xMax += 0.5;
  }
  const xPosition = (value: number) =>
    left + ((value - xMin) / (xMax - xMin || 1)) * plotWidth;
  for (let index = 0; index <= 5; index++) {
    const value = min + ((max - min) * index) / 5;
    const position = valuePosition(value);
    draw(
      'line',
      horizontal
        ? {
            x1: position,
            y1: top,
            x2: position,
            y2: top + plotHeight,
            stroke: '#e2e8f0'
          }
        : {
            x1: left,
            y1: position,
            x2: left + plotWidth,
            y2: position,
            stroke: '#e2e8f0'
          }
    );
    label(
      compact(value) + (percent ? '%' : ''),
      horizontal ? position : left - 8,
      horizontal ? top + plotHeight + 18 : position + 4,
      horizontal ? 'middle' : 'end'
    );
    if (scatter) {
      const x = xMin + ((xMax - xMin) * index) / 5;
      label(compact(x), xPosition(x), top + plotHeight + 18);
    }
  }
  draw('rect', {
    x: left,
    y: top,
    width: plotWidth,
    height: plotHeight,
    fill: 'none',
    stroke: '#cbd5e1'
  });
  if (!scatter) {
    const step = Math.max(1, Math.ceil(count / (horizontal ? 10 : 8)));
    for (let index = 0; index < count; index += step) {
      const name = categoryName(index);
      const text = label(
        name.length > 16 ? name.slice(0, 15) + '…' : name,
        horizontal ? left - 8 : categoryPosition(index),
        horizontal ? categoryPosition(index) + 4 : top + plotHeight + 18,
        horizontal ? 'end' : 'middle',
        10
      );
      tooltip(text, name);
    }
  }
  if (chart.xTitle)
    label(
      chart.xTitle.slice(0, 80),
      left + plotWidth / 2,
      top + plotHeight + 48
    );
  if (chart.yTitle) {
    const title = label(chart.yTitle.slice(0, 80), 15, top + plotHeight / 2);
    title.setAttribute('transform', `rotate(-90 15 ${top + plotHeight / 2})`);
  }
  const bars = chart.series.filter((series) => series.kind === 'bar');
  let barIndex = 0;
  chart.series.forEach((series, seriesIndex) => {
    const color = seriesColor(seriesIndex);
    const points = prepared[seriesIndex];
    if (series.kind === 'bar') {
      const slot = stacked ? 0 : barIndex++;
      const thickness = (band * 0.72) / (stacked ? 1 : bars.length);
      points.forEach((point) => {
        if (!point) return;
        const a = valuePosition(point.start);
        const b = valuePosition(point.end);
        const category =
          categoryPosition(point.index) - band * 0.36 + slot * thickness;
        draw(
          'rect',
          horizontal
            ? {
                x: Math.min(a, b),
                y: category,
                width: Math.abs(a - b),
                height: thickness,
                fill: series.pointColors[point.index] || color,
                'data-chart-bar': point.index
              }
            : {
                x: category,
                y: Math.min(a, b),
                width: thickness,
                height: Math.abs(a - b),
                fill: series.pointColors[point.index] || color,
                'data-chart-bar': point.index
              },
          `${series.name} — ${categoryName(point.index)}: ${compact(point.raw)}`
        );
      });
    } else if (series.kind === 'scatter') {
      points.forEach((point, index) => {
        const x = series.xValues[index];
        if (!point || x === null || x === undefined) return;
        draw(
          'circle',
          {
            cx: xPosition(x),
            cy: valuePosition(point.raw),
            r: 3.5,
            fill: color,
            'data-chart-point': index
          },
          `${series.name}: ${compact(x)}, ${compact(point.raw)}`
        );
      });
    } else {
      // Preserve gaps rather than turning blank cells into invented zeroes.
      let segment: NonNullable<(typeof points)[number]>[] = [];
      const flush = () => {
        if (!segment.length) return;
        const path = segment
          .map(
            (point, index) =>
              `${index ? 'L' : 'M'}${categoryPosition(point.index)},${valuePosition(point.end)}`
          )
          .join(' ');
        if (series.kind === 'area') {
          const base = [...segment]
            .reverse()
            .map(
              (point) =>
                `L${categoryPosition(point.index)},${valuePosition(point.start)}`
            )
            .join(' ');
          draw('path', {
            d: `${path} ${base} Z`,
            fill: color,
            'fill-opacity': 0.4,
            stroke: 'none',
            'data-chart-area': seriesIndex
          });
        }
        draw('path', {
          d: path,
          fill: 'none',
          stroke: color,
          'stroke-width': 2,
          'data-chart-line': seriesIndex
        });
        segment.forEach((point) =>
          draw(
            'circle',
            {
              cx: categoryPosition(point.index),
              cy: valuePosition(point.end),
              r: 2.5,
              fill: color
            },
            `${series.name} — ${categoryName(point.index)}: ${compact(point.raw)}`
          )
        );
        segment = [];
      };
      points.forEach((point) => {
        if (point) segment.push(point);
        else flush();
      });
      flush();
    }
  });
  return svg;
}

export function renderSpreadsheetCharts(
  document: Document,
  host: HTMLElement,
  worksheet: Worksheet,
  charts: SpreadsheetChart[],
  theme: string[]
) {
  const columnWidth = (index: number) =>
    worksheet.getColumn(index).hidden
      ? 0
      : Math.max(
          24,
          Math.min(
            1800,
            (worksheet.getColumn(index).width ||
              worksheet.properties.defaultColWidth ||
              8.43) *
              7 +
              5
          )
        );
  const rowHeight = (index: number) => {
    if (worksheet.getRow(index).hidden) return 0;
    const row = host.querySelector(`th[data-row="${index}"]`)?.parentElement;
    return (
      row?.getBoundingClientRect().height ||
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
  };
  const position = (marker: ChartMarker) => {
    let x = 44 + marker.x;
    let y = 26 + marker.y;
    for (let column = 1; column <= Math.min(50, marker.col); column++)
      x += columnWidth(column);
    for (let row = 1; row <= Math.min(500, marker.row); row++)
      y += rowHeight(row);
    return { x: Math.min(60000, x), y: Math.min(60000, y) };
  };
  host.style.position = 'relative';
  let right = 0;
  let bottom = 0;
  for (const chart of charts) {
    const start = position(chart.from);
    const end = chart.to ? position(chart.to) : undefined;
    const width = end
      ? Math.max(240, Math.min(2000, end.x - start.x))
      : chart.width;
    const height = end
      ? Math.max(180, Math.min(1200, end.y - start.y))
      : chart.height;
    const container = document.createElement('section');
    container.setAttribute('aria-label', chart.title);
    container.dataset.spreadsheetChart = chart.id;
    Object.assign(container.style, {
      position: 'absolute',
      left: `${start.x}px`,
      top: `${start.y}px`,
      width: `${width}px`,
      height: `${height}px`,
      background: '#fff',
      border: '1px solid #cbd5e1',
      overflow: 'hidden',
      zIndex: '1'
    });
    container.appendChild(
      renderSpreadsheetChart(document, chart, width, height, theme)
    );
    host.appendChild(container);
    right = Math.max(right, start.x + width);
    bottom = Math.max(bottom, start.y + height);
  }
  host.style.minWidth = charts.length ? `${right}px` : '';
  host.style.minHeight = charts.length ? `${bottom}px` : '';
}
