import type { ProcessEstimateResponse } from './api';
import type { ProcessQuantityBasis } from './product-quantity';
import type { ResultReport } from './result-report';
import type { SelectedProcessSummary } from './product-summary';
import { EF31_NORMALISATION_SOURCE, EF31_WEIGHTING_SOURCE } from './ef31-score';

/**
 * Excel report. Every table is a real Excel table (ListObject), and the numbers that
 * depend on each other are live formulas: process EF points, shares, totals, the EF 3.1
 * normalisation and weighting, and the summary. Cached results are written too, so
 * viewers that do not recalculate still show values.
 */

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
}

type Cell = string | number | null | { formula: string; result?: string | number };

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

/** 1 → A, 27 → AA. */
export function columnLetter(index: number): string {
  let letters = '';
  let n = index;
  while (n > 0) {
    const remainder = (n - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

function numberFormat(value: number): string {
  return value !== 0 && Math.abs(value) < 0.01 ? '0.000E+00' : '#,##0.000';
}

function pageHeaderFooter(sheetTitle: string) {
  return {
    oddHeader: `&L&"Arial,Bold"&10${BRAND_NAME}&R&"Arial,Regular"&9${sheetTitle} · &D &T`,
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

  const newSheet = (name: string, title: string, widths: number[]) => {
    const sheet = workbook.addWorksheet(name, {
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
      headerFooter: pageHeaderFooter(title),
      views: [{ showGridLines: false }],
    });
    widths.forEach((width, index) => {
      sheet.getColumn(index + 1).width = width;
    });
    return sheet;
  };

  const headerRow = (sheet: ReturnType<typeof newSheet>, rowNumber: number) => {
    sheet.getRow(rowNumber).eachCell((cell) => {
      cell.font = { name: 'Arial', bold: true, color: { argb: 'FF000000' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD23F' } };
      cell.alignment = { wrapText: true, vertical: 'middle' };
    });
    sheet.getRow(rowNumber).height = 36;
  };

  const writeTitle = (sheet: ReturnType<typeof newSheet>, title: string, note: string) => {
    sheet.getCell('A1').value = title;
    sheet.getCell('A1').font = { name: 'Arial', size: 16, bold: true };
    sheet.getCell('A2').value = note;
    sheet.getCell('A2').font = { name: 'Arial', size: 10, italic: true };
  };

  const indicators = input.result.results[0]?.indicators ?? [];
  const codes = indicators.map((item) => item.code);
  const summaryByCode = new Map((input.summary?.indicators ?? []).map((item) => [item.code, item]));
  const n = input.report.processes.length;
  const firstRow = 8; // first data row on the Impacts sheet
  const lastRow = firstRow + n - 1;
  const totalRow = lastRow + 1;
  const firstIndicatorColumn = 7; // column G
  const indicatorLetter = (offset: number) => columnLetter(firstIndicatorColumn + offset);
  // Sheets are created in reading order: Summary, Inputs, Impacts, EF 3.1 score, Method and source.
  const cover = newSheet('Summary', 'Summary', [34, 70, 24]);
  const inputsSheet = newSheet('Inputs', 'Inputs', [6, 40, 22, 24, 16, 14, 40, 30]);
  const impactsSheet = newSheet('Impacts', 'Impacts by process', [6, 40, 12, 14, 16, 14, ...codes.map(() => 16)]);
  const scoreSheet = newSheet('EF 3.1 score', 'EF 3.1 score', [10, 32, 18, 18, 18, 18, 14, 18]);
  const method = newSheet('Method and source', 'Method and source', [28, 100]);
  const timestamp = formatTimestamp(input.generatedAt);
  const efTotal = input.report.efPointsTotal;

  // ── Inputs: calculation parameters only ─────────────────────────────────────
  writeTitle(inputsSheet, 'Inputs (calculation parameters only)', 'Only the values the calculation uses. Quantities are in the reference unit shown.');
  const inputHeaders = ['No.', 'Process', 'Family', 'Geography', 'Reference unit', 'Quantity', 'Quantity basis', 'Linked product input'];
  const inputRows: Cell[][] = input.inputs.map((item, index) => [
    index + 1,
    item.activity,
    item.familyLabel,
    item.geography,
    item.referenceUnit,
    item.quantity,
    item.basisLabel,
    item.productInputName ?? '—',
  ]);
  inputsSheet.addTable({
    name: 'tblInputs',
    ref: 'A4',
    headerRow: true,
    style: { theme: 'TableStyleMedium2', showRowStripes: true },
    columns: inputHeaders.map((name) => ({ name })),
    rows: inputRows as (string | number)[][],
  });
  headerRow(inputsSheet, 4);
  input.inputs.forEach((_, index) => {
    inputsSheet.getCell(`F${5 + index}`).numFmt = numberFormat(input.inputs[index].quantity);
  });

  // ── EF 3.1 score: one row per impact category; the single source for factors and weights ──
  writeTitle(scoreSheet, 'EF 3.1 score', 'Normalised value = selected-row total ÷ normalisation factor. Weighted points = normalised value × weight % ÷ 100.');
  const scoreFirstRow = 4;
  const scoreLastRow = scoreFirstRow + codes.length - 1;
  const scoreTotalRow = scoreLastRow + 2;
  const scoreRows: Cell[][] = codes.map((code, offset) => {
    const row = scoreFirstRow + offset;
    const item = summaryByCode.get(code);
    const total = item?.value ?? null;
    const impactsColumn = indicatorLetter(offset);
    const normalised = item?.normalisedValue ?? null;
    const weighted = item?.weightedContribution ?? null;
    return [
      code,
      item?.name ?? indicators[offset]?.name ?? code,
      item?.unit ?? indicators[offset]?.result_unit ?? '',
      { formula: `Impacts!${impactsColumn}${totalRow}`, result: total ?? 'n/a' },
      item?.normalisationFactor ?? null,
      { formula: `IFERROR(D${row}/E${row},"n/a")`, result: normalised ?? 'n/a' },
      item?.weightPercent ?? null,
      { formula: `IFERROR(F${row}*G${row}/100,"n/a")`, result: weighted ?? 'n/a' },
    ];
  });
  scoreSheet.addTable({
    name: 'tblScore',
    ref: `A${scoreFirstRow - 1}`,
    headerRow: true,
    style: { theme: 'TableStyleMedium2', showRowStripes: true },
    columns: ['Code', 'Impact category', 'Unit', 'Selected-row total', 'Normalisation factor', 'Normalised value', 'Weight %', 'Weighted points'].map((name) => ({ name })),
    rows: scoreRows as (string | number)[][],
  });
  headerRow(scoreSheet, scoreFirstRow - 1);
  scoreSheet.getCell(`A${scoreTotalRow}`).value = 'EF 3.1 single score';
  scoreSheet.getCell(`A${scoreTotalRow}`).font = { name: 'Arial', bold: true };
  scoreSheet.getCell(`H${scoreTotalRow}`).value = {
    formula: `IFERROR(SUM(H${scoreFirstRow}:H${scoreLastRow}),"n/a")`,
    result: efTotal ?? 'n/a',
  };
  scoreSheet.getCell(`H${scoreTotalRow}`).font = { name: 'Arial', bold: true };
  scoreSheet.getCell(`H${scoreTotalRow}`).numFmt = '#,##0.000000E+00';
  for (let row = scoreFirstRow; row <= scoreLastRow; row += 1) {
    scoreSheet.getCell(`G${row}`).numFmt = '0.00';
    scoreSheet.getCell(`D${row}`).numFmt = '#,##0.000000E+00';
    scoreSheet.getCell(`E${row}`).numFmt = '#,##0.000000E+00';
    scoreSheet.getCell(`F${row}`).numFmt = '#,##0.000000E+00';
    scoreSheet.getCell(`H${row}`).numFmt = '#,##0.000000E+00';
  }

  // ── Impacts: one row per process, 16 indicators across; EF points and shares as formulas ──
  writeTitle(impactsSheet, 'Impacts by process', 'EF 3.1 points = SUMPRODUCT(result ÷ normalisation factor × weight %) ÷ 100. Share = points ÷ selected-row total.');
  impactsSheet.getCell('B4').value = 'Normalisation factor';
  impactsSheet.getCell('B5').value = 'Weight %';
  impactsSheet.getCell('B4').font = { name: 'Arial', bold: true };
  impactsSheet.getCell('B5').font = { name: 'Arial', bold: true };
  codes.forEach((_, offset) => {
    const letter = indicatorLetter(offset);
    const scoreRow = scoreFirstRow + offset;
    impactsSheet.getCell(`${letter}4`).value = { formula: `'EF 3.1 score'!E${scoreRow}`, result: summaryByCode.get(codes[offset])?.normalisationFactor ?? 'n/a' };
    impactsSheet.getCell(`${letter}5`).value = { formula: `'EF 3.1 score'!G${scoreRow}`, result: summaryByCode.get(codes[offset])?.weightPercent ?? 'n/a' };
    impactsSheet.getCell(`${letter}4`).numFmt = '#,##0.000000E+00';
  });

  const impactRows: Cell[][] = input.report.processes.map((process, index) => {
    const row = firstRow + index;
    const line = input.result.results[index];
    const values = codes.map((code) => line?.indicators.find((item) => item.code === code)?.result_value ?? null);
    const lastIndicator = indicatorLetter(codes.length - 1);
    const firstIndicator = indicatorLetter(0);
    const pointsResult: string | number = process.efPoints ?? 'n/a';
    const shareResult: string | number = process.sharePercent === null ? 'n/a' : process.sharePercent / 100;
    return [
      index + 1,
      process.activity,
      { formula: `Inputs!F${5 + index}`, result: process.quantity },
      { formula: `Inputs!E${5 + index}`, result: process.referenceUnit },
      {
        formula: `IFERROR(SUMPRODUCT((${firstIndicator}${row}:${lastIndicator}${row}/$${firstIndicator}$4:$${lastIndicator}$4)*$${firstIndicator}$5:$${lastIndicator}$5)/100,"n/a")`,
        result: pointsResult,
      },
      { formula: `IFERROR(E${row}/$E$${totalRow},"n/a")`, result: shareResult },
      ...values,
    ];
  });
  impactsSheet.addTable({
    name: 'tblImpacts',
    ref: `A${firstRow - 1}`,
    headerRow: true,
    style: { theme: 'TableStyleMedium2', showRowStripes: true },
    columns: ['No.', 'Process', 'Quantity', 'Unit', 'EF 3.1 points', 'Share of total', ...codes.map((code) => `${code} (${indicators.find((item) => item.code === code)?.result_unit ?? ''})`)].map((name) => ({ name })),
    rows: impactRows as (string | number)[][],
  });
  headerRow(impactsSheet, firstRow - 1);

  // Totals under the table. A total is a SUM only when every row uses the same unit.
  impactsSheet.getCell(`B${totalRow}`).value = 'Selected-row total';
  impactsSheet.getCell(`B${totalRow}`).font = { name: 'Arial', bold: true };
  impactsSheet.getCell(`E${totalRow}`).value = {
    formula: `IFERROR(SUM(E${firstRow}:E${lastRow}),"n/a")`,
    result: efTotal ?? 'n/a',
  };
  impactsSheet.getCell(`F${totalRow}`).value = {
    formula: `IFERROR(SUM(F${firstRow}:F${lastRow}),"n/a")`,
    result: efTotal === null ? 'n/a' : 1,
  };
  impactsSheet.getCell(`E${totalRow}`).numFmt = '#,##0.000000E+00';
  impactsSheet.getCell(`F${totalRow}`).numFmt = '0.0%';
  codes.forEach((code, offset) => {
    const letter = indicatorLetter(offset);
    const summaryItem = summaryByCode.get(code);
    const unitsAgree = input.report.processes.every(
      (_, index) => input.result.results[index]?.indicators.find((item) => item.code === code)?.result_unit
        === indicators.find((item) => item.code === code)?.result_unit,
    );
    const cell = impactsSheet.getCell(`${letter}${totalRow}`);
    if (unitsAgree) {
      cell.value = {
        formula: `IFERROR(SUM(${letter}${firstRow}:${letter}${lastRow}),"n/a")`,
        result: summaryItem?.value ?? 'n/a',
      };
      cell.numFmt = numberFormat(summaryItem?.value ?? 0);
    } else {
      cell.value = 'Not comparable';
    }
    cell.font = { name: 'Arial', bold: true };
  });
  for (let row = firstRow; row <= lastRow; row += 1) {
    impactsSheet.getCell(`C${row}`).numFmt = '#,##0.000';
    impactsSheet.getCell(`E${row}`).numFmt = '#,##0.000000E+00';
    impactsSheet.getCell(`F${row}`).numFmt = '0.0%';
    for (let offset = 0; offset < codes.length; offset += 1) {
      impactsSheet.getCell(`${indicatorLetter(offset)}${row}`).numFmt = '#,##0.000000E+00';
    }
  }
  impactsSheet.views = [{ state: 'frozen', xSplit: 2, ySplit: firstRow - 1, showGridLines: false }];

  // ── Summary: formulas point at the sheets above ─────────────────────────────
  cover.getCell('A1').value = BRAND_NAME;
  cover.getCell('A1').font = { name: 'Arial', size: 18, bold: true };
  cover.getCell('A2').value = 'Process impact report (estimate)';
  cover.getCell('A2').font = { name: 'Arial', size: 12, italic: true };
  const top = input.report.biggestProcess;
  const lastDataRef = `Impacts!$E$${firstRow}:$E$${lastRow}`;
  const ghgOffset = codes.indexOf('GHG');
  const rowsSummary: Array<[string, Cell, Cell]> = [
    ['Subject', input.functionalUnitLabel || 'Not given', ''],
    ['Product category', input.categoryLabel, ''],
    ['Generated', timestamp, ''],
    ['Processes calculated', { formula: `COUNTA(Impacts!B${firstRow}:B${lastRow})`, result: n }, ''],
    ['EF 3.1 total (selected rows)', { formula: `'EF 3.1 score'!H${scoreTotalRow}`, result: efTotal ?? 'n/a' }, 'EF 3.1 points'],
    [
      'Climate change (GHG) total',
      ghgOffset >= 0
        ? { formula: `Impacts!${indicatorLetter(ghgOffset)}${totalRow}`, result: input.report.ghgTotal ?? 'n/a' }
        : 'n/a',
      input.report.ghgUnit ?? '',
    ],
    [
      'Biggest contributor',
      {
        formula: `IFERROR(INDEX(Impacts!B${firstRow}:B${lastRow},MATCH(MAX(${lastDataRef}),${lastDataRef},0)),"n/a")`,
        result: top?.activity ?? 'n/a',
      },
      '',
    ],
    [
      'Biggest contributor share',
      {
        formula: `IFERROR(MAX(Impacts!F${firstRow}:F${lastRow}),"n/a")`,
        result: top?.sharePercent === null || top === null ? 'n/a' : (top?.sharePercent ?? 0) / 100,
      },
      '',
    ],
  ];
  const summaryTable: Cell[][] = rowsSummary.map(([label, value, unit]) => [label, value, unit]);
  cover.addTable({
    name: 'tblSummary',
    ref: 'A4',
    headerRow: true,
    style: { theme: 'TableStyleMedium2', showRowStripes: true },
    columns: ['Item', 'Value', 'Unit'].map((name) => ({ name })),
    rows: summaryTable as (string | number)[][],
  });
  headerRow(cover, 4);
  cover.getCell('B9').numFmt = '#,##0.000000E+00';
  cover.getCell('B10').numFmt = '#,##0.000';
  cover.getCell('B12').numFmt = '0.0%';
  cover.getCell('A14').value = 'Scope';
  cover.getCell('A14').font = { name: 'Arial', bold: true, size: 12 };
  cover.getCell('A15').value = 'Covers only the process rows on the Inputs sheet. Cultivation, ginning, transport, distribution, and use phase are not included unless listed.';
  cover.mergeCells('A15:C15');
  cover.getCell('A15').alignment = { wrapText: true, vertical: 'top' };
  cover.getRow(15).height = 32;
  cover.getCell('A17').value = 'How to read it';
  cover.getCell('A17').font = { name: 'Arial', bold: true, size: 12 };
  cover.getCell('A18').value = 'EF 3.1 points combine 16 impact categories into one number. Higher means more impact. Compare processes only at the same reference unit.';
  cover.mergeCells('A18:C18');
  cover.getCell('A18').alignment = { wrapText: true, vertical: 'top' };
  cover.getRow(18).height = 32;

  // ── Method and source ──────────────────────────────────────────────────────
  writeTitle(method, 'Method and source', 'How the numbers are made and where the factors come from.');
  const methodRows: Array<[string, string]> = [
    ['Brand', BRAND_NAME],
    ['Generated', timestamp],
    ['Method version', input.result.methodology_version],
    ['Calculation', 'Each process row is scaled by its quantity: result = published factor × quantity. Rows are not combined except in the selected-row total.'],
    ['EF 3.1 score', 'Sum over 16 categories of (selected-row total ÷ normalisation factor × weight %) ÷ 100. Shown only when every category has a compatible unit.'],
    ['Normalisation factors', EF31_NORMALISATION_SOURCE],
    ['Weighting factors', EF31_WEIGHTING_SOURCE],
    ['Source name', input.result.source_name],
    ['Source version', input.result.source_version],
    ['Source credit', SOURCE_CREDIT],
    ['Source link', input.result.source_url],
    ['Excluded stages', 'Cultivation, ginning, transport, distribution, use phase, and end of life, unless listed on the Inputs sheet.'],
  ];
  method.addTable({
    name: 'tblMethod',
    ref: 'A4',
    headerRow: true,
    style: { theme: 'TableStyleMedium2', showRowStripes: true },
    columns: ['Item', 'Detail'].map((name) => ({ name })),
    rows: methodRows as (string | number)[][],
  });
  headerRow(method, 4);
  for (let row = 5; row < 5 + methodRows.length; row += 1) {
    method.getCell(`B${row}`).alignment = { wrapText: true, vertical: 'top' };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer as BlobPart], { type: XLSX_MIME });
}
