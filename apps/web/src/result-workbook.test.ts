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
    watermarkPng: null,
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
    expect(summary?.getCell('A1').value).toBe(BRAND_NAME);
    expect(summary?.getCell('B4').value).toBe('One T-shirt');
    expect(String(summary?.getCell('B6').value)).toContain('IST');
  });

  it('keeps only calculation parameters on the Inputs sheet', async () => {
    const { workbook } = await build();
    const headers = workbook.getWorksheet('Inputs')?.getRow(1).values as unknown[];
    expect(headers).toContain('Quantity');
    expect(headers).toContain('Reference unit');
    expect(headers).not.toContain('Source URL');
    expect(headers.join(' ')).not.toMatch(/licen|attribution|retriev/i);
  });

  it('adds brand header, watermark text and page footer to every sheet', async () => {
    const { workbook } = await build();
    for (const sheet of workbook.worksheets) {
      expect(sheet.headerFooter.oddHeader).toContain(BRAND_NAME);
      expect(sheet.headerFooter.oddHeader).toContain('ESTIMATE');
      expect(sheet.headerFooter.oddHeader).toContain('&D &T');
      expect(sheet.headerFooter.oddFooter).toContain('Page &P of &N');
    }
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
