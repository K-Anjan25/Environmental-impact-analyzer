import { describe, expect, it } from 'vitest';
import type { ProcessFactor } from './api';
import { suggestFactorsByInputName } from './factor-suggestions';

function factor(id: string, activity: string): ProcessFactor {
  return {
    id,
    family_id: 'spinning',
    family_label: 'Yarn spinning',
    activity,
    source_descriptor: id,
    geography_code: 'WORLD',
    geography_label: 'World',
    reference_unit: '1 kg yarn',
    indicator_factors: [],
    data_quality: null,
    input_required_kg_per_reference_unit: null,
    source_file: 'fixture.csv',
  };
}

describe('user-confirmed factor text suggestions', () => {
  it('ranks activity names by shared material and product terms', () => {
    const cottonYarn = factor('cotton-yarn', 'Spinning cotton to yarn');
    const woolYarn = factor('wool-yarn', 'Spinning wool to yarn');
    const matches = suggestFactorsByInputName('Cotton yarn', [woolYarn, cottonYarn]);
    expect(matches[0]).toMatchObject({ factor: cottonYarn, sharedTerms: 2 });
  });

  it('does not guess when no meaningful terms overlap', () => {
    expect(suggestFactorsByInputName('Unknown mineral blend', [
      factor('cotton-yarn', 'Spinning cotton to yarn'),
    ])).toEqual([]);
  });
});
