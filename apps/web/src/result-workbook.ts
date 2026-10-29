import type { ProcessEstimateResponse } from './api';
import type { ProcessQuantityBasis } from './product-quantity';
import type { ResultReport } from './result-report';
import type { SelectedProcessSummary } from './product-summary';
import { EF31_NORMALISATION_SOURCE, EF31_WEIGHTING_SOURCE } from './ef31-score';

export const BRAND_NAME = 'Environmental Impact Analyzer';
export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const SOURCE_CREDIT =
  'Data source: The Open Source LCA Database for Footwear & Apparel, Carbonfact, version 1.1.0. https://github.com/carbonfact/lca-database-footwear-apparel, CC BY-SA 4.0.';

export interface WorkbookInputRow {
  activity: string;
  familyLabel: string;
  geography: string;
  referenceUnit: string;
  quantity: number;
  basis: ProcessQuantityBasis;
  basisLabel: string;
  productInputName: string | null;
}

export interface WorkbookInput {
  result: ProcessEstimateResponse;
  report: ResultReport;
  summary: SelectedProcessSummary | null;
  inputs: WorkbookInputRow[];
  functionalUnitLabel: string;
  categoryLabel: string;
  generatedAt: Date;
  /** Optional PNG for a diagonal background watermark. Omitted in tests. */
  watermarkPng?: Uint8Array | null;
}

const TIMESTAMP_FORMAT = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatTimestamp(date: Date): string {
  return `${TIMESTAMP_FORMAT.format(date)} IST`;
}

/** Filename like environmental-impact-report_2026-10-29_1405.xlsx (IST). */
export function workbookFilename(date: Date): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `environmental-impact-report_${parts.year}-${parts.month}-${parts.day}_${parts.hour}${parts.minute}.xlsx`;
}

function numberFormat(value: number): string {
  return value !== 0 && Math.abs(value) < 0.01 ? '0.000E+00' : '#,##0.000';
}

/** Header and footer shared by every sheet: brand, watermark, timestamp, page numbers. */
function pageHeaderFooter(sheetTitle: string) {
  return {
    oddHeader: `&L&"Arial,Bold"&10${BRAND_NAME}&C&"Arial,Bold"&K${'D9D9D9'} ESTIMATE&R&"Arial,Regular"&9${sheetTitle} · &D &T`,
    oddFooter: '&L&"Arial,Regular"&8Estimate from published process factors. Not a certified or complete product footprint.&R&"Arial,Regular"&8Page &P of &N',
  };
}

export async function buildResultWorkbook(input: WorkbookInput): Promise<Blob> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = BRAND_NAME;
  workbook.company = BRAND_NAME;
  workbook.title = `${BRAND_NAME} · process impact report`;
  workbook.subject = `Selected-row impact estimate, source ${input.result.source_version}`;
  workbook.created = input.generatedAt;
  workbook.modified = input.generatedAt;

  const watermarkId = input.watermarkPng
    ? workbook.addImage({ buffer: input.watermarkPng as unknown as ArrayBuffer, extension: 'png' })
    : null;

  const sheetFrame = (name: string, title: string, widths: number[]) => {
    const sheet = workbook.addWorksheet(name, {
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
      headerFooter: pageHeaderFooter(title),
      views: [{ showGridLines: false }],
    });
    widths.forEach((width, index) => {
      sheet.getColumn(index + 1).width = width;
    });
    if (watermarkId !== null) sheet.addBackgroundImage(watermarkId);
    return sheet;
  };

  const titleStyle = { font: { name: 'Arial', size: 18, bold: true, color: { argb: 'FF000000' } } };
  const headStyle = {
    font: { name: 'Arial', bold: true, color: { argb: 'FF000000' } },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFD23F' } },
    border: { top: { style: 'thin' as const }, bottom: { style: 'thin' as const }, left: { style: 'thin' as const }, right: { style: 'thin' as const } },
    alignment: { wrapText: true, vertical: 'middle' as const },
  };
  const timestamp = formatTimestamp(input.generatedAt);

  // 1. Cover and summary
  const cover = sheetFrame('Summary', 'Summary', [30, 60, 22]);
  cover.getCell('A1').value = BRAND_NAME;
  Object.assign(cover.getCell('A1'), titleStyle);
  cover.getCell('A2').value = 'Process impact report (estimate)';
  cover.getCell('A2').font = { name: 'Arial', size: 12, italic: true };
  const top = input.report.biggestProcess;
  const coverRows: Array<[string, string | number, string]> = [
    ['Subject', input.functionalUnitLabel || 'Not given', ''],
    ['Product category', input.categoryLabel, ''],
    ['Generated', timestamp, ''],
    ['Processes calculated', input.report.processCount, ''],
    ['EF 3.1 total (selected rows)', input.report.efPointsTotal ?? 'Not available', 'EF 3.1 points'],
    ['Climate change (GHG) total', input.report.ghgTotal ?? 'Not available', input.report.ghgUnit ?? ''],
    ['Biggest contributor', top ? `${top.activity}${top.sharePercent === null ? '' : ` · ${Math.round(top.sharePercent)}% of EF 3.1 total`}` : 'Not available', ''],
  ];
  let row = 4;
  for (const [label, value, unit] of coverRows) {
    cover.getCell(`A${row}`).value = label;
    cover.getCell(`A${row}`).font = { name: 'Arial', bold: true };
    cover.getCell(`B${row}`).value = value;
    if (typeof value === 'number') cover.getCell(`B${row}`).numFmt = numberFormat(value);
    cover.getCell(`C${row}`).value = unit;
    row += 1;
  }
  row += 1;
  cover.getCell(`A${row}`).value = 'Scope';
  cover.getCell(`A${row}`).font = { name: 'Arial', bold: true, size: 12 };
  row += 1;
  cover.getCell(`A${row}`).value =
    'Covers only the process rows in the Inputs sheet. Cultivation, ginning, transport, distribution, and use phase are not included unless listed.';
  cover.mergeCells(`A${row}:C${row}`);
  cover.getCell(`A${row}`).alignment = { wrapText: true, vertical: 'top' };
  cover.getRow(row).height = 32;
  row += 2;
  cover.getCell(`A${row}`).value = 'How to read it';
  cover.getCell(`A${row}`).font = { name: 'Arial', bold: true, size: 12 };
  row += 1;
  cover.getCell(`A${row}`).value =
    'EF 3.1 points combine 16 impact categories into one number. Higher means more impact. Compare processes only at the same reference unit.';
  cover.mergeCells(`A${row}:C${row}`);
  cover.getCell(`A${row}`).alignment = { wrapText: true, vertical: 'top' };
  cover.getRow(row).height = 32;

  // 2. Inputs: only the parameters the calculation uses
  const inputs = sheetFrame('Inputs', 'Inputs', [6, 40, 22, 24, 16, 14, 40, 30]);
  const inputHeaders = ['No.', 'Process', 'Family', 'Geography', 'Reference unit', 'Quantity', 'Quantity basis', 'Linked product input'];
  inputs.addRow(inputHeaders);
  inputs.getRow(1).eachCell((cell) => Object.assign(cell, { style: headStyle }));
  input.inputs.forEach((item, index) => {
    const added = inputs.addRow([
      index + 1,
      item.activity,
      item.familyLabel,
      item.geography,
      item.referenceUnit,
      item.quantity,
      item.basisLabel,
      item.productInputName ?? '—',
    ]);
    added.getCell(6).numFmt = numberFormat(item.quantity);
    added.alignment = { wrapText: true, vertical: 'top' };
  });
  inputs.views = [{ state: 'frozen', ySplit: 1, showGridLines: false }];

  // 3. Impacts by process: one row per process, 16 indicators across
  const impacts = sheetFrame('Impacts', 'Impacts by process', [6, 40, 12, 14, 12, 12, ...Array(16).fill(16)]);
  const indicatorCodes = input.result.results[0]?.indicators.map((item) => item.code) ?? [];
  const unitByCode = new Map<string, string>();
  for (const line of input.result.results) {
    for (const item of line.indicators) unitByCode.set(item.code, item.result_unit);
  }
  impacts.addRow([
    'No.',
    'Process',
    'Quantity',
    'Quantity unit',
    'EF 3.1 points',
    'Share of total',
    ...indicatorCodes.map((code) => `${code} (${unitByCode.get(code) ?? ''})`),
  ]);
  impacts.getRow(1).eachCell((cell) => Object.assign(cell, { style: headStyle }));
  impacts.getRow(1).height = 42;
  input.report.processes.forEach((process, index) => {
    const line = input.result.results[index];
    const values = indicatorCodes.map((code) => line?.indicators.find((item) => item.code === code)?.result_value ?? null);
    const added = impacts.addRow([
      index + 1,
      process.activity,
      process.quantity,
      process.referenceUnit,
      process.efPoints ?? 'Not available',
      process.sharePercent === null ? 'Not available' : process.sharePercent / 100,
      ...values,
    ]);
    added.getCell(3).numFmt = numberFormat(process.quantity);
    added.getCell(6).numFmt = '0.0%';
    if (typeof process.efPoints === 'number') added.getCell(5).numFmt = numberFormat(process.efPoints);
    values.forEach((value, valueIndex) => {
      if (typeof value === 'number') added.getCell(7 + valueIndex).numFmt = numberFormat(value);
    });
  });
  impacts.views = [{ state: 'frozen', xSplit: 2, ySplit: 1, showGridLines: false }];

  // 4. EF 3.1 score: totals and weighting
  const score = sheetFrame('EF 3.1 score', 'EF 3.1 score', [10, 32, 18, 14, 18, 14, 18, 14, 22]);
  score.addRow(['Code', 'Impact category', 'Selected-row total', 'Unit', 'Normalisation factor', 'Normalisation unit', 'Normalised value', 'Weight %', 'Weighted contribution']);
  score.getRow(1).eachCell((cell) => Object.assign(cell, { style: headStyle }));
  score.getRow(1).height = 32;
  for (const item of input.summary?.indicators ?? []) {
    const added = score.addRow([
      item.code,
      item.name,
      item.value ?? 'Not comparable',
      item.unit,
      item.normalisationFactor ?? '—',
      item.normalisationUnit ?? '—',
      item.normalisedValue ?? '—',
      item.weightPercent === null ? '—' : item.weightPercent / 100,
      item.weightedContribution ?? '—',
    ]);
    for (const column of [3, 5, 7, 9]) {
      const cell = added.getCell(column);
      if (typeof cell.value === 'number') cell.numFmt = numberFormat(cell.value);
    }
    added.getCell(8).numFmt = '0.00%';
  }
  const totalRow = score.addRow(['', 'EF 3.1 single score', '', '', '', '', '', '', input.report.efPointsTotal ?? 'Not available']);
  totalRow.font = { name: 'Arial', bold: true };
  if (typeof input.report.efPointsTotal === 'number') totalRow.getCell(9).numFmt = numberFormat(input.report.efPointsTotal);
  score.views = [{ state: 'frozen', ySplit: 1, showGridLines: false }];

  // 5. Method and source
  const method = sheetFrame('Method and source', 'Method and source', [28, 100]);
  const methodRows: Array<[string, string]> = [
    ['Brand', BRAND_NAME],
    ['Generated', timestamp],
    ['Method version', input.result.methodology_version],
    ['Calculation', 'Each process row is scaled by its quantity: result = published factor × quantity. Rows are not combined except in the selected-row total.'],
    ['EF 3.1 score', 'Sum over 16 categories of (selected-row total ÷ normalisation factor × weight %). Shown only when every category has a compatible unit.'],
    ['Normalisation factors', EF31_NORMALISATION_SOURCE],
    ['Weighting factors', EF31_WEIGHTING_SOURCE],
    ['Source name', input.result.source_name],
    ['Source version', input.result.source_version],
    ['Source credit', SOURCE_CREDIT],
    ['Source link', input.result.source_url],
    ['Excluded stages', 'Cultivation, ginning, transport, distribution, use phase, and end of life, unless listed on the Inputs sheet.'],
  ];
  method.addRow(['Item', 'Detail']);
  method.getRow(1).eachCell((cell) => Object.assign(cell, { style: headStyle }));
  for (const [label, value] of methodRows) {
    const added = method.addRow([label, value]);
    added.getCell(1).font = { name: 'Arial', bold: true };
    added.getCell(2).alignment = { wrapText: true, vertical: 'top' };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer as BlobPart], { type: XLSX_MIME });
}
