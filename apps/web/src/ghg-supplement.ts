/*
 * Climate-change (GHG) supplement for transport and end-of-life stages.
 *
 * Source: UK Government GHG Conversion Factors for Company Reporting, 2026 edition (DEFRA/DESNZ),
 * published by the UK government. These factors are GHG only (kg CO2e, IPCC AR5
 * GWP-100, embedded). They are not EF 3.1 indicators, so they are never added to the 16-indicator
 * subtotal; the report shows them as a separate climate-change line.
 */

export const DEFRA_2026_SOURCE = {
  name: 'UK Government GHG Conversion Factors for Company Reporting, 2026 (DEFRA/DESNZ)',
  publisherUrl: 'https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting',
  transcriptionNote:
    'Values transcribed from the DEFRA 2026 workbook as reproduced by GreenCalculus (greencalculus.com/standards/uk-defra-emission-factors/, sections 4.5 and 4.6, MasterBrain v2026.264). Re-verify against the gov.uk workbook before audit-grade disclosure.',
  retrieved: '2026-10-22',
  gwpBasis: 'IPCC AR5 GWP-100, embedded in every CO2e factor',
  scope: 'Climate change (GHG) only; not one of the 16 EF 3.1 indicators.',
} as const;

export type FreightMode = 'hgv-articulated' | 'hgv-rigid-over-17t' | 'container-ship' | 'freight-rail' | 'air-long-haul-with-rf';

/** kg CO2e per tonne-kilometre, DEFRA 2026 "Freighting goods" tab. */
export const FREIGHT_FACTORS: Readonly<Record<FreightMode, { label: string; kgCo2ePerTonneKm: number }>> = {
  'hgv-articulated': { label: 'Road, HGV articulated (average laden)', kgCo2ePerTonneKm: 0.07926 },
  'hgv-rigid-over-17t': { label: 'Road, HGV rigid over 17 t (average laden)', kgCo2ePerTonneKm: 0.17256 },
  'container-ship': { label: 'Sea, container ship (average)', kgCo2ePerTonneKm: 0.01612 },
  'freight-rail': { label: 'Rail, freight train', kgCo2ePerTonneKm: 0.02583 },
  'air-long-haul-with-rf': { label: 'Air, long-haul freight flight (with radiative forcing)', kgCo2ePerTonneKm: 0.89939 },
};

export type EndOfLifeRoute = 'landfill-mixed-ci' | 'combustion-mixed-ci' | 'recycling-plastic-closed-loop' | 'landfill-plastic';

/** kg CO2e per tonne of waste, DEFRA 2026 "Waste disposal" tab. */
export const END_OF_LIFE_FACTORS: Readonly<Record<EndOfLifeRoute, { label: string; kgCo2ePerTonne: number; basis: 'gate-to-grave' | 'transport-to-facility' }>> = {
  'landfill-mixed-ci': { label: 'Landfill, commercial and industrial waste', kgCo2ePerTonne: 520.58023, basis: 'gate-to-grave' },
  'combustion-mixed-ci': { label: 'Combustion (energy from waste), commercial and industrial waste', kgCo2ePerTonne: 4.65358, basis: 'transport-to-facility' },
  'recycling-plastic-closed-loop': { label: 'Recycling, average plastics, closed loop', kgCo2ePerTonne: 4.65358, basis: 'transport-to-facility' },
  'landfill-plastic': { label: 'Landfill, average plastics', kgCo2ePerTonne: 9.00687, basis: 'gate-to-grave' },
};

export interface GhgDeclarations {
  /** Inbound transport of declared components to the factory (A2). */
  inbound?: { mode: FreightMode; distanceKm: string } | null;
  /** Outbound distribution of the finished product (A4). */
  distribution?: { mode: FreightMode; distanceKm: string } | null;
  /** Finished product transport to the waste facility (C2), by articulated HGV. */
  toWasteKm?: string | null;
  /** End-of-life treatment route for the finished product (C3 and C4). */
  endOfLife?: EndOfLifeRoute | null;
}

export interface GhgSupplementLine {
  stage: 'A2' | 'A4' | 'C2' | 'C3';
  label: string;
  kgCo2e: number;
  detail: string;
}

export interface GhgSupplementResult {
  lines: GhgSupplementLine[];
  totalKgCo2e: number | null;
  declaredStages: Array<'A2' | 'A4' | 'C2' | 'C3'>;
  issues: string[];
}

function parseDistance(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined || raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * Per-functional-unit climate-change values. Masses are kilograms per functional unit.
 * Freight: kg × km / 1000 × factor (per tonne-km). End of life: kg / 1000 × factor (per tonne).
 */
export function assessGhgSupplement(params: {
  declaredComponentMassKg: number | null;
  finishedProductMassKg: number | null;
  declarations: GhgDeclarations;
}): GhgSupplementResult {
  const { declaredComponentMassKg, finishedProductMassKg, declarations } = params;
  const lines: GhgSupplementLine[] = [];
  const issues: string[] = [];

  const addFreight = (stage: 'A2' | 'A4' | 'C2', label: string, massKg: number | null, distanceRaw: string | null | undefined, mode: FreightMode) => {
    if (distanceRaw === null || distanceRaw === undefined || distanceRaw.trim() === '') return;
    const distance = parseDistance(distanceRaw);
    if (distance === null) {
      issues.push(`${stage}: enter a distance of zero or more kilometres.`);
      return;
    }
    if (massKg === null) {
      issues.push(`${stage}: the mass for this stage is not available until the mass check balances.`);
      return;
    }
    const factor = FREIGHT_FACTORS[mode];
    lines.push({
      stage,
      label,
      kgCo2e: (massKg / 1000) * distance * factor.kgCo2ePerTonneKm,
      detail: `${(massKg / 1000).toFixed(4)} t × ${distance} km × ${factor.kgCo2ePerTonneKm} kg CO2e/t-km (${factor.label})`,
    });
  };

  if (declarations.inbound) {
    addFreight('A2', 'Transport to factory', declaredComponentMassKg, declarations.inbound.distanceKm, declarations.inbound.mode);
  }
  if (declarations.distribution) {
    addFreight('A4', 'Distribution to customer', finishedProductMassKg, declarations.distribution.distanceKm, declarations.distribution.mode);
  }
  addFreight('C2', 'Transport to waste treatment', finishedProductMassKg, declarations.toWasteKm, 'hgv-articulated');

  if (declarations.endOfLife) {
    const route = END_OF_LIFE_FACTORS[declarations.endOfLife];
    if (finishedProductMassKg === null) {
      issues.push('C3: the finished product mass is needed for the end-of-life route.');
    } else {
      lines.push({
        stage: 'C3',
        label: `End of life: ${route.label.toLowerCase()}`,
        kgCo2e: (finishedProductMassKg / 1000) * route.kgCo2ePerTonne,
        detail: `${(finishedProductMassKg / 1000).toFixed(4)} t × ${route.kgCo2ePerTonne} kg CO2e/t (${route.basis === 'gate-to-grave' ? 'gate-to-grave' : 'transport to facility only'})`,
      });
    }
  }

  const declaredStages = lines.map((line) => line.stage);
  return {
    lines,
    totalKgCo2e: lines.length > 0 ? lines.reduce((sum, line) => sum + line.kgCo2e, 0) : null,
    declaredStages,
    issues,
  };
}
