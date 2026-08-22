import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const qaDir = path.resolve(scriptDir, '..');
const renderDir = path.join(qaDir, 'pdf_render_V4.2');
const contactDir = path.join(qaDir, 'pdf_contact_sheets_V4.2');
const jsonPath = path.join(qaDir, 'PDF逐页渲染QA_V4.2.json');
const csvPath = path.join(qaDir, 'PDF逐页渲染QA_V4.2.csv');

const pageFiles = fs.readdirSync(renderDir)
  .filter((name) => /^page-\d+\.png$/i.test(name))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

if (pageFiles.length === 0) {
  throw new Error(`未找到渲染页：${renderDir}`);
}

fs.mkdirSync(contactDir, { recursive: true });
for (const name of fs.readdirSync(contactDir)) {
  if (/^pages_\d+_\d+\.png$/i.test(name)) {
    fs.rmSync(path.join(contactDir, name));
  }
}

function inspectPage(fileName) {
  const page = Number(fileName.match(/\d+/)[0]);
  const filePath = path.join(renderDir, fileName);
  const buffer = fs.readFileSync(filePath);
  const png = PNG.sync.read(buffer);
  let ink = 0;
  let darkInk = 0;
  let edgeInk = 0;
  let minX = png.width;
  let minY = png.height;
  let maxX = -1;
  let maxY = -1;
  const pixelCount = png.width * png.height;
  const edgeBand = 3;

  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const offset = (y * png.width + x) * 4;
      const alpha = png.data[offset + 3];
      if (alpha === 0) continue;
      const r = png.data[offset];
      const g = png.data[offset + 1];
      const b = png.data[offset + 2];
      const minChannel = Math.min(r, g, b);
      if (minChannel < 250) ink += 1;
      if (minChannel < 235) {
        darkInk += 1;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        if (x < edgeBand || y < edgeBand || x >= png.width - edgeBand || y >= png.height - edgeBand) {
          edgeInk += 1;
        }
      }
    }
  }

  const inkRatio = ink / pixelCount;
  const darkInkRatio = darkInk / pixelCount;
  const blank = darkInkRatio < 0.00025;
  const edgeTouch = edgeInk > 0;
  const bbox = darkInk > 0
    ? { min_x: minX, min_y: minY, max_x: maxX, max_y: maxY }
    : null;
  const margins = bbox
    ? {
        left: minX,
        top: minY,
        right: png.width - 1 - maxX,
        bottom: png.height - 1 - maxY,
      }
    : null;

  return {
    page,
    file_name: fileName,
    file_size: buffer.length,
    width: png.width,
    height: png.height,
    ink_ratio: Number(inkRatio.toFixed(6)),
    dark_ink_ratio: Number(darkInkRatio.toFixed(6)),
    blank,
    edge_touch: edgeTouch,
    edge_ink_pixels: edgeInk,
    bbox,
    margins,
    png,
  };
}

function blitThumbnail(source, target, targetX, targetY, boxWidth, boxHeight) {
  const scale = Math.min(boxWidth / source.width, boxHeight / source.height);
  const width = Math.max(1, Math.floor(source.width * scale));
  const height = Math.max(1, Math.floor(source.height * scale));
  const x0 = targetX + Math.floor((boxWidth - width) / 2);
  const y0 = targetY + Math.floor((boxHeight - height) / 2);

  for (let y = 0; y < height; y += 1) {
    const sourceY = Math.min(source.height - 1, Math.floor(y / scale));
    for (let x = 0; x < width; x += 1) {
      const sourceX = Math.min(source.width - 1, Math.floor(x / scale));
      const sourceOffset = (sourceY * source.width + sourceX) * 4;
      const targetOffset = ((y0 + y) * target.width + (x0 + x)) * 4;
      source.data.copy(target.data, targetOffset, sourceOffset, sourceOffset + 4);
    }
  }
}

const results = pageFiles.map(inspectPage);
const expectedWidth = results[0].width;
const expectedHeight = results[0].height;
const allowedDimensions = new Set([
  `${expectedWidth}x${expectedHeight}`,
  `${expectedHeight}x${expectedWidth}`,
]);
const dimensionsAllowed = (row) => allowedDimensions.has(`${row.width}x${row.height}`);
const anomalies = results.filter((row) =>
  row.blank || row.edge_touch || !dimensionsAllowed(row) || row.file_size < 5000
);

const pagesPerSheet = 30;
const columns = 5;
const rows = 6;
const cellWidth = 154;
const cellHeight = 218;
const gap = 8;
const sheetWidth = columns * cellWidth + (columns + 1) * gap;
const sheetHeight = rows * cellHeight + (rows + 1) * gap;

for (let start = 0; start < results.length; start += pagesPerSheet) {
  const slice = results.slice(start, start + pagesPerSheet);
  const sheet = new PNG({ width: sheetWidth, height: sheetHeight, colorType: 6 });
  sheet.data.fill(255);
  slice.forEach((row, index) => {
    const column = index % columns;
    const line = Math.floor(index / columns);
    const x = gap + column * (cellWidth + gap);
    const y = gap + line * (cellHeight + gap);
    blitThumbnail(row.png, sheet, x, y, cellWidth, cellHeight);
  });
  const firstPage = slice[0].page.toString().padStart(3, '0');
  const lastPage = slice.at(-1).page.toString().padStart(3, '0');
  const outputPath = path.join(contactDir, `pages_${firstPage}_${lastPage}.png`);
  fs.writeFileSync(outputPath, PNG.sync.write(sheet));
}

const serializableResults = results.map(({ png, ...row }) => row);
const expectedPageCount = Number(process.env.EXPECTED_PAGES || 287);
const summary = {
  generated_at: new Date().toISOString(),
  source_pdf: '计划书/07_全球经济周期与亚非拉国别风险多币种储备智能决策平台总计划书_V4.2.pdf',
  rendered_page_count: results.length,
  expected_page_count: expectedPageCount,
  consistent_a4_dimensions: results.every(dimensionsAllowed),
  allowed_page_dimensions: [...allowedDimensions],
  portrait_page_count: results.filter((row) => row.width === expectedWidth && row.height === expectedHeight).length,
  landscape_page_count: results.filter((row) => row.width === expectedHeight && row.height === expectedWidth).length,
  blank_page_count: results.filter((row) => row.blank).length,
  edge_touch_page_count: results.filter((row) => row.edge_touch).length,
  low_size_page_count: results.filter((row) => row.file_size < 5000).length,
  anomaly_count: anomalies.length,
  anomaly_pages: anomalies.map((row) => row.page),
  machine_result: results.length === expectedPageCount && anomalies.length === 0 ? 'PASS' : 'REVIEW_REQUIRED',
  interpretation: '机器检查用于发现空白页、尺寸不一致、图像损坏和贴边裁切风险；不能替代抽样人工视觉检查。',
  pages: serializableResults,
};

fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

const headers = [
  'page', 'file_name', 'file_size', 'width', 'height', 'ink_ratio', 'dark_ink_ratio',
  'blank', 'edge_touch', 'edge_ink_pixels', 'margin_left', 'margin_top', 'margin_right', 'margin_bottom',
];
const escapeCsv = (value) => {
  const stringValue = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(stringValue) ? `"${stringValue.replaceAll('"', '""')}"` : stringValue;
};
const csvLines = [headers.join(',')];
for (const row of serializableResults) {
  csvLines.push([
    row.page, row.file_name, row.file_size, row.width, row.height, row.ink_ratio, row.dark_ink_ratio,
    row.blank, row.edge_touch, row.edge_ink_pixels,
    row.margins?.left, row.margins?.top, row.margins?.right, row.margins?.bottom,
  ].map(escapeCsv).join(','));
}
fs.writeFileSync(csvPath, `${csvLines.join('\r\n')}\r\n`, 'utf8');

process.stdout.write(`${JSON.stringify({
  rendered_page_count: summary.rendered_page_count,
  blank_page_count: summary.blank_page_count,
  edge_touch_page_count: summary.edge_touch_page_count,
  anomaly_count: summary.anomaly_count,
  machine_result: summary.machine_result,
  contact_sheet_count: Math.ceil(results.length / pagesPerSheet),
}, null, 2)}\n`);
