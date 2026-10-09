import { describe, expect, it } from 'vitest';
import type { AssessmentResult } from './api';
import { assessmentIsScored, availableIndicatorCount } from './assessment';

const noScoreResult: AssessmentResult = {
  assessment_id: 'test-id',
  product_name: 'Sample shirt',
  category: 'apparel',
  subtype: 't_shirt',
  status: 'not_scored',
  methodology_version: 'prototype-no-score-v0.4',
  score: null,
  score_explanation: 'No reviewed dataset is connected.',
  functional_unit: 'One finished item',
  boundary: 'Not assessed',
  confidence: { level: 'not_assessed', drivers: [] },
  indicators: [
    { name: 'climate', label: 'Climate impact', unit: 'kg CO₂e/item', status: 'unavailable', value: null, reason: 'No data.' },
    { name: 'water', label: 'Water-use impact', unit: 'Not selected', status: 'unavailable', value: null, reason: 'Water method and unit are unresolved.' },
  ],
  process_mapping_readiness: {
    source_id: 'carbonfact-apparel-footwear-v1.1.0',
    source_version: '1.1.0',
    source_url: 'https://github.com/carbonfact/lca-database-footwear-apparel/blob/v.1.1.0/README.md#whats-included',
    status: 'not_ready',
    scoring_enabled: false,
    note: 'Checklist only; no impacts calculated.',
    requirements: [
      {
        id: 'process-route',
        label: 'Fiber, textile, and assembly process route',
        status: 'not_collected',
        details: 'No process route has been documented.',
        next_step: 'Collect a sourced process route.',
      },
    ],
  },
  known_facts: [],
  data_gaps: [],
  limitations: [],
  next_steps: [],
};

describe('assessment helpers', () => {
  it('does not treat a null score as zero or as an available score', () => {
    expect(assessmentIsScored(noScoreResult)).toBe(false);
    expect(noScoreResult.process_mapping_readiness.status).toBe('not_ready');
    expect(noScoreResult.process_mapping_readiness.scoring_enabled).toBe(false);
  });

  it('reports no available indicators when the API withholds them', () => {
    expect(availableIndicatorCount(noScoreResult)).toBe(0);
  });
});
