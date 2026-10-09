// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import theme from './theme';

const styles = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const DECORATIVE_SELECTORS = [
  '.brand-name span',
  '.step-label span',
  '.card-number',
  '.preview-dash',
  '.indicator-result-value',
  '.footer-dot',
];

function luminance(hex: string): number {
  const channel = (offset: number) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function isSixDigitHex(value: string): boolean {
  return value.startsWith('#') && value.length === 7 && [...value.slice(1)].every((digit) => /[\da-f]/i.test(digit));
}

async function expectNoAxeViolations(): Promise<void> {
  const report = await axe.run(document.body, {
    rules: {
      // JSDOM cannot calculate rendered color contrast; a static CSS check covers the page palette below.
      'color-contrast': { enabled: false },
    },
  });
  expect(report.violations).toEqual([]);
}

describe('assessment form accessibility', () => {
  it('keeps declared non-decorative CSS text colors legible on the light page surface', () => {
    const failures: string[] = [];
    let selector = '';
    let selectionForeground = '';
    let selectionBackground = '';

    for (const line of styles.split('\n')) {
      const openBrace = line.indexOf('{');
      const text = openBrace >= 0 ? line.slice(openBrace + 1) : line;
      if (openBrace >= 0) {
        const nextSelector = line.slice(0, openBrace).trim();
        if (nextSelector) selector = nextSelector;
      }
      const declarations = text.split('}')[0];
      for (const rawDeclaration of declarations.split(';')) {
        const separator = rawDeclaration.indexOf(':');
        if (separator < 0) continue;
        const property = rawDeclaration.slice(0, separator).trim();
        const value = rawDeclaration.slice(separator + 1).trim();
        if (property === 'color' && isSixDigitHex(value)) {
          if (selector.includes('::selection')) {
            selectionForeground = value;
          } else if (!DECORATIVE_SELECTORS.some((item) => selector.includes(item))) {
            if (contrastRatio(value, '#f4f1e9') < 4.5) failures.push(`${selector}: ${value}`);
          }
        }
        if (selector.includes('::selection') && property === 'background' && isSixDigitHex(value)) {
          selectionBackground = value;
        }
      }
      if (line.includes('}')) selector = '';
    }

    expect(failures).toEqual([]);
    expect(selectionForeground).not.toBe('');
    expect(selectionBackground).not.toBe('');
    expect(contrastRatio(selectionForeground, selectionBackground)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(theme.palette.secondary.main, '#f4f1e9')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(theme.palette.text.secondary, '#f4f1e9')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#ffffff', theme.palette.primary.main)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#ffffff', '#438064')).toBeGreaterThanOrEqual(4.5);
  });

  it('has no axe violations in the initial and expanded supplier-evidence form', async () => {
    const { container } = render(<App />);
    const details = container.querySelector('details');
    const summary = details?.querySelector('summary');
    expect(summary).not.toBeNull();
    fireEvent.click(summary!);
    fireEvent.click(screen.getByRole('button', { name: /Add process evidence/ }));

    await expectNoAxeViolations();
  });

  it('has no axe violations in the methodology dialog', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'How it works' }));
    await screen.findByRole('heading', { name: 'Privacy' });

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/sources');
    await expectNoAxeViolations();
  });

  it('has no axe violations in the no-score results and expanded mapping checklist', async () => {
    const result = {
      assessment_id: 'sample-assessment-id',
      product_name: 'Sample tee',
      category: 'apparel',
      subtype: 't_shirt',
      status: 'not_scored',
      methodology_version: 'prototype-no-score-v0.4',
      score: null,
      score_explanation: 'No score is available in this prototype.',
      functional_unit: 'One finished item (input reference only; no result calculated)',
      boundary: 'Not assessed',
      confidence: { level: 'not_assessed', drivers: [] },
      indicators: [
        {
          name: 'climate',
          label: 'Climate impact',
          unit: 'kg CO₂e/item',
          status: 'unavailable',
          value: null,
          reason: 'No reviewed climate factors are configured.',
        },
        {
          name: 'water',
          label: 'Water-use impact',
          unit: 'Not selected',
          status: 'unavailable',
          value: null,
          reason: 'The product-level water method is unresolved.',
        },
      ],
      process_mapping_readiness: {
        source_id: 'carbonfact-apparel-footwear-v1.1.0',
        source_version: '1.1.0',
        source_url: 'https://example.com/process-families',
        status: 'not_ready',
        scoring_enabled: false,
        note: 'Mapping checklist only; no impact calculated.',
        requirements: [
          {
            id: 'process-route',
            label: 'Fiber, textile, and assembly process route',
            status: 'not_collected',
            details: 'No process routes were recorded.',
            next_step: 'Review supplier evidence.',
          },
        ],
      },
      known_facts: [],
      data_gaps: ['material composition'],
      limitations: ['This prototype does not calculate environmental impact.'],
      next_steps: ['Review source rights and method before scoring.'],
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => result,
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Product name' }), {
      target: { value: 'Sample tee' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Review assessment' }));
    await screen.findByText('Score withheld');
    fireEvent.click(screen.getByText('Review 1 mapping requirements'));

    await expectNoAxeViolations();
  });
});
