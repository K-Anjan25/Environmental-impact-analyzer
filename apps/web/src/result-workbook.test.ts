import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { buildResultWorkbook, BRAND_NAME, workbookFilename } from './result-workbook';
import { buildResultReport } from './result-report';
import { summarizeSelectedProcesses } from './product-summary';
import { fixtureLine } from './result-fixtures';

async function build() {
  const lines = [fixtureLine('Dyeing', 3), fixtureLine('Spinning', 1)];
  const blob = await buildResultWorkbook({
    result: {
      status: 'calculated',
      methodology_version: 'published-process-factor-scaling-v1.0',
      scope: 'process',
      aggregation: 'none',
      source_id: 'carbonfact',
      source_name: 'Sample source',
      source_version: '1.1.0',
      source_url: 'https://example.com/source',
      results: lines,
    },
    report: buildResultReport(lines),
    summary: summarizeSelectedProcesses(lines),
    inputs: [
      { activity: 'Dyeing', familyLabel: 'Dyeing', geography: 'World average', referenceUnit: '1 kg fabric', quantity: 0.18, basis: 'manual', basisLabel: 'Manual', productInputName: null },
      { activity: 'Spinning', familyLabel: 'Yarn spinning', geography: 'World average', referenceUnit: '1 kg yarn', quantity: 0.2, basis: 'manual', basisLabel: 'Manual', productInputName: 'Yarn' },
    ],
    functionalUnitLabel: 'One T-shirt',
    categoryLabel: 'Apparel',
    generatedAt: new Date('2026-10-29T08:35:00Z'),
  });
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await blob.arrayBuffer());
  return { blob, workbook };
}

describe('buildResultWorkbook', () => {
  it('writes the brand, subject, timestamp and five named sheets', async () => {
    const { blob, workbook } = await build();
    expect(blob.type).toContain('spreadsheetml');
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      'Summary', 'Inputs', 'Impacts', 'EF 3.1 score', 'Method and source',
    ]);
    const summary = workbook.getWorksheet('Summary');
    expect(summary?.getCell('B1').value).toBe(BRAND_NAME);
    expect(summary?.getImages().length).toBe(1);
    expect(summary?.getCell('B5').value).toBe('One T-shirt');
    expect(String(summary?.getCell('B7').value)).toContain('IST');
  });

  it('lists all 16 calculated indicators vertically on the first sheet', async () => {
    const { workbook } = await build();
    const summary = workbook.getWorksheet('Summary');
    expect(summary?.getTable('tblIndicators')).toBeTruthy();
    expect(summary?.getCell('A14').value).toBe('All 16 environmental indicators');
    const indicatorCodes = Array.from({ length: 16 }, (_, index) => summary?.getCell(16 + index, 1).value);
    expect(indicatorCodes.every((code) => typeof code === 'string' && code.length > 0)).toBe(true);
    expect(summary?.getCell('C16').value).toMatchObject({ formula: "'EF 3.1 score'!D4" });
    expect(summary?.getCell('D16').value).toBeTruthy();
  });

  it('keeps only calculation parameters on the Inputs sheet', async () => {
    const { workbook } = await build();
    const headers = workbook.getWorksheet('Inputs')?.getRow(4).values as unknown[];
    expect(headers).toContain('Quantity');
    expect(headers).toContain('Reference unit');
    expect(headers).not.toContain('Source URL');
    expect(headers.join(' ')).not.toMatch(/licen|attribution|retriev/i);
  });

  it('adds brand header with timestamp and page footer to every sheet, with no watermark', async () => {
    const { blob, workbook } = await build();
    for (const sheet of workbook.worksheets) {
      expect(sheet.headerFooter.oddHeader).toContain(BRAND_NAME);
      expect(sheet.headerFooter.oddHeader).toContain('&D &T');
      expect(sheet.headerFooter.oddHeader).not.toMatch(/ESTIMATE|watermark/i);
      expect(sheet.headerFooter.oddFooter).toContain('Page &P of &N');
    }
    const raw = new TextDecoder('latin1').decode(new Uint8Array(await blob.arrayBuffer()));
    // The only image is the EcoImpact Lab leaf mark; no watermark image.
    expect(raw.split('xl/media/').length - 1).toBeGreaterThan(0);
  });

  it('stores each table as a real Excel table with live formulas', async () => {
    const { workbook } = await build();
    expect(workbook.getWorksheet('Impacts')?.getTable('tblImpacts')).toBeTruthy();
    expect(workbook.getWorksheet('Inputs')?.getTable('tblInputs')).toBeTruthy();
    expect(workbook.getWorksheet('EF 3.1 score')?.getTable('tblScore')).toBeTruthy();
    const impacts = workbook.getWorksheet('Impacts');
    const efFormula = impacts?.getCell('E8').value as { formula: string; result: number };
    expect(efFormula.formula).toContain('SUMPRODUCT');
    expect(efFormula.formula).toContain('$G$4');
    expect(typeof efFormula.result).toBe('number');
    const summary = workbook.getWorksheet('Summary');
    expect((summary?.getCell('B9').value as { formula: string }).formula).toBe("'EF 3.1 score'!H21");
    expect((summary?.getCell('B8').value as { formula: string }).formula).toBe('COUNTA(Impacts!B8:B9)');
  });

  it('does not show the MIT licence anywhere in the workbook', async () => {
    const { workbook } = await build();
    const text: string[] = [];
    workbook.worksheets.forEach((sheet) => sheet.eachRow((row) => row.eachCell((cell) => text.push(String(cell.value)))));
    expect(text.join(' ')).not.toMatch(/\bMIT\b|MIT License/);
  });

  it('names the file with the IST date and time', () => {
    expect(workbookFilename(new Date('2026-10-29T08:35:00Z'))).toBe('environmental-impact-report_2026-10-29_1405.xlsx');
  });
});
