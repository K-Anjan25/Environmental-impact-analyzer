import type { FactorCatalog, ProcessEstimateResponse, ProcessSelection } from './api';

export function calculateFromCatalog(
  catalog: FactorCatalog,
  selections: readonly ProcessSelection[],
): ProcessEstimateResponse {
  if (selections.length === 0) throw new Error('Add at least one process before calculating.');

  const factorById = new Map(catalog.factors.map((factor) => [factor.id, factor]));
  const results = selections.map((selection) => {
    const factor = factorById.get(selection.factor_id);
    if (!factor) throw new Error(`The selected factor is not available in the loaded catalog: ${selection.factor_id}`);
    if (!Number.isFinite(selection.quantity) || selection.quantity <= 0) {
      throw new Error(`The quantity for ${factor.activity} must be finite and greater than zero.`);
    }

    return {
      factor_id: factor.id,
      family_id: factor.family_id,
      family_label: factor.family_label,
      activity: factor.activity,
      geography_code: factor.geography_code,
      geography_label: factor.geography_label,
      quantity: selection.quantity,
      reference_unit: factor.reference_unit,
      input_required_kg_per_reference_unit: factor.input_required_kg_per_reference_unit,
      data_quality: factor.data_quality,
      indicators: factor.indicator_factors.map((indicator) => ({
        code: indicator.code,
        name: indicator.name,
        factor_value: indicator.source_factor_value,
        factor_unit: `${indicator.unit} per ${factor.reference_unit}`,
        result_value: indicator.source_factor_value * selection.quantity,
        result_unit: indicator.unit,
      })),
      source_file: factor.source_file,
    };
  });

  return {
    status: 'calculated',
    methodology_version: 'published-process-factor-scaling-v1.0-browser',
    scope: 'Process factors were scaled in this browser from the published catalog. Declared product-input quantities were not sent to the API.',
    aggregation: 'none',
    source_id: catalog.source_id,
    source_name: catalog.source_name,
    source_version: catalog.source_version,
    source_url: catalog.source_url,
    license_name: catalog.license_name,
    attribution_text: catalog.attribution_text,
    license_url: catalog.license_url,
    background_database_note: catalog.background_database_note,
    result_license: catalog.result_license,
    results,
  };
}
