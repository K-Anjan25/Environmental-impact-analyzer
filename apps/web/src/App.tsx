import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import {
  Alert,
  Autocomplete,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  getFactorCatalog,
  type FactorCatalog,
  type ProcessEstimateLine,
  type ProcessEstimateResponse,
  type ProcessFactor,
} from './api';
import { formatProcessEstimatesCsv, downloadProcessEstimatesCsv, downloadBlob } from './export';
import { buildResultReport, formatCompact, formatShare, type ProcessImpactRow, type ResultReport } from './result-report';
import { buildResultWorkbook, workbookFilename } from './result-workbook';
import { calculateFromCatalog } from './local-estimates';
import {
  describeBomMassStatus,
  reviewProductInputUse,
  type BomMassAssessment,
  type ProductInputUseReview,
} from './product-bom';
import { deriveProcessQuantity, type ProcessQuantityBasis } from './product-quantity';
import { summarizeSelectedProcesses, type SelectedProcessSummary } from './product-summary';
import {
  assessProductBoundary,
  FUNCTIONAL_UNIT_BASIS,
  PRODUCT_CATEGORY_LABEL,
  type ProductBoundaryResult,
  type ProductCategory,
} from './product-boundary';
import SiteLayout from './SiteLayout';


type ProductInput = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  parentId: string | null;
};

type SelectedProcess = {
  key: string;
  factor: ProcessFactor;
  quantity: string;
  productInputId: string | null;
  quantityBasis: ProcessQuantityBasis;
};


// A complete, valid example: three parts add up to the finished mass, and each part is linked to its process.
const WORKED_EXAMPLE = {
  category: 'footwear' as ProductCategory,
  description: "One pair of women's boots",
  finishedMassKg: '0.42',
  parts: [
    { name: 'Polyester upper (textile)', quantity: '0.30', factorId: 'MATERIAL_PROCESS_STEP:YARN_FORMATION/SPINNING/RING#SYNTHETIC_FIBERS/POLYESTER?DTEX=120@WORLD' },
    { name: 'Cotton lining', quantity: '0.02', factorId: 'MATERIAL_PROCESS_STEP:YARN_FORMATION/SPINNING/OPEN_END#PLANT_FIBERS/COTTON?DTEX=70@WORLD' },
    { name: 'Natural rubber sole', quantity: '0.10', factorId: 'MATERIAL:NATURAL_RUBBER/STR#ANY@TH' },
  ],
  assemblyFactorId: 'PRODUCT_PROCESS_STEP:FOOTWEAR_ASSEMBLY/WOMENS_BOOTS#GLO@WORLD',
};

function suggestedCategoryForProductName(name: string): ProductCategory | null {
  if (/\b(boot|boots|shoe|shoes|sneaker|sneakers|trainer|trainers|sandals?)\b/i.test(name)) return 'footwear';
  if (/\b(t-?shirts?|tees?|shirts?|dresses?|trousers|pants|skirts?|jackets?|coats?)\b/i.test(name)) return 'apparel';
  return null;
}

function numberForDisplay(value: number): string {
  if (!Number.isFinite(value)) return 'Not available';
  if (value !== 0 && (Math.abs(value) < 0.0001 || Math.abs(value) >= 1_000_000_000)) {
    return value.toExponential(4).replace(/\.0+e/, 'e').replace(/(\.\d*?[1-9])0+e/, '$1e');
  }
  return new Intl.NumberFormat('en', { maximumSignificantDigits: 6 }).format(value);
}

function geographyFor(factor: Pick<ProcessFactor | ProcessEstimateLine, 'geography_label' | 'geography_code'>): string {
  return factor.geography_label ?? factor.geography_code ?? 'Geography not stated';
}

function factorLabel(factor: ProcessFactor): string {
  return `${factor.activity} · ${geographyFor(factor)} · ${factor.reference_unit}`;
}

// A balanced check is exact to floating-point precision, so show 0 kg rather than a rounding residue such as -5.5511e-17.
function massDifferenceLabel(assessment: BomMassAssessment): string {
  if (assessment.differenceKg === null) return 'Not available';
  if (assessment.status === 'balanced') return '0 kg';
  return `${numberForDisplay(assessment.differenceKg)} kg`;
}

function IndicatorTable({ line }: { line: ProcessEstimateLine }) {
  const water = line.indicators.find((item) => item.code === 'WTU');
  return (
    <TableContainer className="indicator-table-wrap">
      <Table size="small" aria-label={`Separate environmental indicators for ${line.activity}`}>
        <TableHead>
          <TableRow>
            <TableCell>Indicator</TableCell>
            <TableCell align="right">Published factor</TableCell>
            <TableCell align="right">Scaled result</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {line.indicators.map((indicator) => (
            <TableRow key={indicator.code}>
              <TableCell>
                <strong className="indicator-code">{indicator.code}</strong>
                <span className="indicator-name">{indicator.name}</span>
              </TableCell>
              <TableCell align="right">
                <span className="numeric-value">{numberForDisplay(indicator.factor_value)}</span>
                <span className="unit-note">{indicator.factor_unit}</span>
              </TableCell>
              <TableCell align="right">
                <span className="numeric-value result-value">{numberForDisplay(indicator.result_value)}</span>
                <span className="unit-note">{indicator.result_unit}</span>
                {indicator.code === 'WTU' && water && (
                  <Tooltip title="EF 3.1 water-use impact, not a physical water volume in litres.">
                    <InfoOutlinedIcon className="unit-info-icon" aria-label="Water impact unit note" fontSize="small" />
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

interface HoldBlocker {
  text: string;
  target: string;
}



function ResultHeadline({ report, subtotalsHidden, blockers }: { report: ResultReport; subtotalsHidden: boolean; blockers: HoldBlocker[] }) {
  return (
    <section className="result-headline" aria-labelledby="result-headline-heading">
      <Typography id="result-headline-heading" component="h3" className="output-heading">Total</Typography>
      <div className="result-stat-grid">
        <div className="result-stat result-stat-yellow">
          <span>EF 3.1 single score</span>
          {subtotalsHidden ? (
            <strong className="result-stat-hidden">Hidden</strong>
          ) : (
            <strong>{formatCompact(report.efPointsTotal)}</strong>
          )}
        </div>
        <div className="result-stat result-stat-green">
          <span>Processes</span>
          <strong>{report.processCount}</strong>
        </div>
      </div>
      {subtotalsHidden && blockers.length > 0 && (
        <ul className="hold-blocker-list" aria-label="Fix these to see totals">
          {blockers.map((blocker, index) => (
            <li key={`${index}-${blocker.text}`}>{blocker.text}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ProcessImpactCard({
  row,
  line,
  index,
  subtotalsHidden,
}: {
  row: ProcessImpactRow;
  line: ProcessEstimateLine;
  index: number;
  subtotalsHidden: boolean;
}) {
  const headingId = `impact-${index}-${line.factor_id}`;
  const share = subtotalsHidden ? null : row.sharePercent;
  return (
    <article className="process-impact-card" aria-labelledby={headingId}>
      <div className="process-impact-top">
        <span className="process-impact-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <div className="process-impact-name">
          <Typography id={headingId} component="h4" className="process-impact-title">{row.activity}</Typography>
          <span className="process-impact-meta">
            {row.familyLabel} · {row.geography} · {numberForDisplay(row.quantity)} × {row.referenceUnit}
          </span>
        </div>
      </div>
      <dl className="process-impact-figures">
        <div>
          <dt>EF 3.1 points</dt>
          <dd>{formatCompact(row.efPoints)}</dd>
        </div>
        <div>
          <dt>Share of total</dt>
          <dd>{subtotalsHidden ? 'Hidden' : formatShare(share)}</dd>
        </div>
      </dl>
      {share !== null && (
        <div className="share-bar" aria-hidden="true"><span style={{ width: `${Math.min(100, Math.max(0, share))}%` }} /></div>
      )}
      <details className="indicator-disclosure">
        <summary>Show all 16 indicators</summary>
        <IndicatorTable line={line} />
      </details>
    </article>
  );
}

function BomMassAssessmentCard({ assessment }: { assessment: BomMassAssessment }) {
  if (assessment.status === 'scope-not-confirmed' || assessment.status === 'missing-product-mass') return null;
  const severity = assessment.status === 'balanced' ? 'success' : 'warning';

  return (
    <section className="bom-mass-assessment" aria-labelledby="bom-mass-assessment-heading">
      <Typography id="bom-mass-assessment-heading" component="h4" className="dialog-section-title">
        Mass check
      </Typography>
      <dl className="bom-mass-values">
        <div><dt>Declared input mass</dt><dd>{assessment.declaredInputMassKg === null ? 'Incomplete' : `${numberForDisplay(assessment.declaredInputMassKg)} kg`}</dd></div>
        <div><dt>Finished product mass</dt><dd>{assessment.finishedProductMassKg === null ? 'Not available' : `${numberForDisplay(assessment.finishedProductMassKg)} kg`}</dd></div>
        <div><dt>Mass difference (output − inputs)</dt><dd>{massDifferenceLabel(assessment)}</dd></div>
        <div><dt>Declared mass share</dt><dd>{assessment.massCoveragePercent === null ? 'Not available' : `${numberForDisplay(assessment.massCoveragePercent)}%`}</dd></div>
      </dl>
      <Alert severity={severity} className="bom-mass-status">{describeBomMassStatus(assessment)}</Alert>
      {assessment.unconvertibleInputNames.length > 0 && (
        <p className="bom-unconvertible-inputs">Mass not assessed for: {assessment.unconvertibleInputNames.join(', ')}.</p>
      )}
    </section>
  );
}

function ProductInputUseCard({ review }: { review: ProductInputUseReview }) {
  if (review.inputs.length === 0) return null;
  const notCalculated = review.inputs.filter((input) => input.status !== 'calculated-locally');

  return (
    <section className="product-input-use-review" aria-labelledby="product-input-use-heading">
      <Typography id="product-input-use-heading" component="h4" className="dialog-section-title">
        Declared-input use
      </Typography>
      <p className="input-use-counts">
        {review.locallyCalculatedCount} mapped locally · {review.contextOnlyCount} context-only · {review.notInSelectedRowsCount} not linked
      </p>
      {notCalculated.length > 0 && (
        <Alert severity="warning" className="input-use-warning">
          Not calculated (not zero): {notCalculated.map((input) => input.name).join(', ')}.
        </Alert>
      )}
      {review.repeatedLocalMappings.length > 0 && (
        <Alert severity="warning" className="input-use-warning">
          Reused across multiple process rows: {review.repeatedLocalMappings.join(', ')}. Review for overlapping boundaries.
        </Alert>
      )}
    </section>
  );
}

function SelectedProcessSummaryCard({
  summary,
  inputUseReview,
  bomMassAssessment,
}: {
  summary: SelectedProcessSummary;
  inputUseReview: ProductInputUseReview;
  bomMassAssessment: BomMassAssessment;
}) {
  return (
    <section className="selected-process-summary" aria-labelledby="selected-process-summary-heading">
      <div className="selected-process-summary-heading">
        <div>
          <div className="result-overline">CROSS-PROCESS SUBTOTAL</div>
          <Typography id="selected-process-summary-heading" component="h3" className="process-result-title">
            Selected-process total
          </Typography>
          <p className="summary-scope-copy">
            {summary.processCount} selected rows; not a complete product footprint.
          </p>
        </div>
        {summary.singleScore ? (
          <div className="ef-score-card" aria-label="EF 3.1 single score">
            <span>EF 3.1 single score</span>
            <strong>{numberForDisplay(summary.singleScore.value)}</strong>
            <small>weighted points</small>
          </div>
        ) : (
          <Alert severity="warning" className="score-unavailable">
            The EF 3.1 score is unavailable until all 16 indicators have compatible units.
          </Alert>
        )}
      </div>
      {summary.errors.length > 0 && (
        <Alert severity="warning" className="summary-data-warning">
          {summary.errors.join(' ')}
        </Alert>
      )}
      <ProductInputUseCard review={inputUseReview} />
      <BomMassAssessmentCard assessment={bomMassAssessment} />
      <TableContainer className="indicator-table-wrap summary-table-wrap">
        <Table size="small" aria-label="Selected-process indicator totals and EF 3.1 score contributions">
          <TableHead>
            <TableRow>
              <TableCell>Indicator</TableCell>
              <TableCell align="right">Selected-row total</TableCell>
              <TableCell align="right">Normalised</TableCell>
              <TableCell align="right">Weight</TableCell>
              <TableCell align="right">Weighted contribution</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {summary.indicators.map((indicator) => (
              <TableRow key={indicator.code}>
                <TableCell>
                  <strong className="indicator-code">{indicator.code}</strong>
                  <span className="indicator-name">{indicator.name}</span>
                </TableCell>
                <TableCell align="right">
                  <span className="numeric-value">{indicator.value === null ? 'Not comparable' : numberForDisplay(indicator.value)}</span>
                  <span className="unit-note">{indicator.unit}</span>
                </TableCell>
                <TableCell align="right">
                  <span className="numeric-value">
                    {indicator.normalisedValue === null ? '—' : numberForDisplay(indicator.normalisedValue)}
                  </span>
                  {indicator.normalisationFactor !== null && indicator.normalisationUnit && (
                    <span className="unit-note">NF {numberForDisplay(indicator.normalisationFactor)} {indicator.normalisationUnit}</span>
                  )}
                </TableCell>
                <TableCell align="right" className="numeric-value">
                  {indicator.weightPercent === null ? '—' : `${numberForDisplay(indicator.weightPercent)}%`}
                </TableCell>
                <TableCell align="right" className="numeric-value">
                  {indicator.weightedContribution === null ? '—' : numberForDisplay(indicator.weightedContribution)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </section>
  );
}

function holdBlockers(boundary: ProductBoundaryResult, mass: BomMassAssessment, processCount: number): HoldBlocker[] {
  if (boundary.verdict !== 'blocked') return [];
  return [
    ...boundary.functionalUnitIssues.map((issue) => ({ text: issue.message, target: 'product-inputs' })),
    ...boundary.structureIssues
      .filter((issue) => issue.severity === 'error')
      .map((issue) => ({ text: issue.message, target: 'product-inputs' })),
    ...(mass.status === 'balanced' ? [] : [{ text: describeBomMassStatus(mass), target: 'product-inputs' }]),
    ...(processCount === 0 ? [{ text: 'Add at least one material.', target: 'product-inputs' }] : []),
  ];
}

type Material = { id: string; name: string; kg: string; factor: ProcessFactor | null };
type MaterialErrors = { name?: string; kg?: string; factor?: string };
type FormErrors = {
  productName?: string;
  finished?: string;
  scope?: string;
  mass?: string;
  noMaterials?: string;
  rows: MaterialErrors[];
};

const MAX_MATERIALS = 25;
const NO_GHG = { inbound: null, distribution: null, toWasteKm: null, endOfLife: null };

function App() {
  const [catalog, setCatalog] = useState<FactorCatalog | null>(null);
  const [catalogError, setCatalogError] = useState('');
  const [productName, setProductName] = useState('');
  const [productType, setProductType] = useState<ProductCategory>('footwear');
  const [finishedMass, setFinishedMass] = useState('');
  const [scopeConfirmed, setScopeConfirmed] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([{ id: 'material-1', name: '', kg: '', factor: null }]);
  const materialSequence = useRef(1);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<ProcessEstimateResponse | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let current = true;
    getFactorCatalog()
      .then((response) => {
        if (current) setCatalog(response);
      })
      .catch((requestError: unknown) => {
        if (current) setCatalogError(requestError instanceof Error ? requestError.message : 'Processes could not be loaded.');
      });
    return () => {
      current = false;
    };
  }, []);

  const processOptions = useMemo(
    () => (catalog ? catalog.factors.filter((factor) => factor.reference_unit.startsWith('1 kg')) : []),
    [catalog],
  );
  const productInputs = useMemo<ProductInput[]>(() => materials.map((item) => ({
    id: item.id,
    name: item.name.trim(),
    quantity: item.kg.trim(),
    unit: 'kg',
    parentId: null,
  })), [materials]);
  const selectedProcesses = useMemo<SelectedProcess[]>(() => materials.flatMap((item) => (item.factor ? [{
    key: item.id,
    factor: item.factor,
    quantity: item.kg.trim(),
    productInputId: item.id,
    quantityBasis: 'declared-output' as const,
  }] : [])), [materials]);
  const productInputsById = useMemo(
    () => new Map<string, ProductInput>(productInputs.map((item) => [item.id, item])),
    [productInputs],
  );
  const productInputUseReview = useMemo(
    () => reviewProductInputUse(productInputs, selectedProcesses.map(({ productInputId, quantityBasis }) => ({
      productInputId,
      quantityBasis,
    }))),
    [productInputs, selectedProcesses],
  );
  const functionalUnitDescription = productName.trim() === ''
    ? ''
    : `One ${FUNCTIONAL_UNIT_BASIS[productType]} of ${productName.trim()}`;
  const productBoundary = useMemo<ProductBoundaryResult>(() => assessProductBoundary({
    functionalUnit: {
      category: productType,
      basis: FUNCTIONAL_UNIT_BASIS[productType],
      description: functionalUnitDescription,
    },
    inputs: productInputs,
    parentIdByInput: new Map(productInputs.map((item) => [item.id, item.parentId])),
    processLinks: selectedProcesses.map((line) => ({
      productInputId: line.productInputId,
      quantityBasis: line.quantityBasis,
      factorId: line.factor.id,
      familyId: line.factor.family_id,
    })),
    finishedProductMass: finishedMass,
    scopeConfirmed,
    ghg: NO_GHG,
  }), [productInputs, selectedProcesses, finishedMass, scopeConfirmed, productType, functionalUnitDescription]);
  const bomMassAssessment = productBoundary.massAssessment;
  const selectedProcessSummary = useMemo(
    () => result ? summarizeSelectedProcesses(result.results) : null,
    [result],
  );
  const resultReport = useMemo(() => (result ? buildResultReport(result.results) : null), [result]);

  // Errors appear only after the first Calculate press, then update as the fields change.
  const computeErrors = (): FormErrors => {
    const rows = materials.map((item): MaterialErrors => {
      const rowErrors: MaterialErrors = {};
      if (!item.name.trim()) rowErrors.name = 'Enter a name.';
      const kg = Number(item.kg);
      if (item.kg.trim() === '' || !Number.isFinite(kg) || kg <= 0) rowErrors.kg = 'Enter a weight above 0.';
      if (!item.factor) rowErrors.factor = 'Choose a process.';
      return rowErrors;
    });
    const rowsComplete = rows.every((rowErrors) => !rowErrors.name && !rowErrors.kg && !rowErrors.factor);
    const finishedValid = Number(finishedMass) > 0;
    const status = bomMassAssessment.status;
    return {
      productName: productName.trim() ? undefined : 'Enter the product name.',
      finished: finishedValid ? undefined : 'Enter the finished weight in kg.',
      scope: scopeConfirmed ? undefined : 'Tick this box to confirm.',
      noMaterials: materials.length === 0 ? 'Add at least one material.' : undefined,
      mass: rowsComplete && finishedValid && status !== 'balanced' && status !== 'scope-not-confirmed'
        ? describeBomMassStatus(bomMassAssessment)
        : undefined,
      rows,
    };
  };
  const errors = useMemo<FormErrors>(
    () => (submitted ? computeErrors() : { rows: [] }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [submitted, materials, finishedMass, scopeConfirmed, productName, bomMassAssessment],
  );
  const hasFormErrors = (value: FormErrors) => Boolean(
    value.productName || value.finished || value.scope || value.noMaterials || value.mass
    || value.rows.some((row) => row.name || row.kg || row.factor),
  );

  const changeMaterial = (id: string, patch: Partial<Material>) => {
    setMaterials((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    setResult(null);
    setError('');
  };
  const addMaterial = () => {
    materialSequence.current += 1;
    setMaterials((current) => [...current, { id: `material-${materialSequence.current}`, name: '', kg: '', factor: null }]);
    setResult(null);
  };
  const removeMaterial = (id: string) => {
    setMaterials((current) => current.filter((item) => item.id !== id));
    setResult(null);
  };
  const changeGeneral = (apply: () => void) => {
    apply();
    setResult(null);
    setError('');
  };

  const loadWorkedExample = (suggestion = false) => {
    if (!catalog) {
      setError('Processes are still loading. Try again in a moment.');
      return;
    }
    const factors = WORKED_EXAMPLE.parts.map((part) => catalog.factors.find((factor) => factor.id === part.factorId) ?? null);
    if (factors.some((factor) => factor === null)) {
      setError('The example processes are not in this catalogue.');
      return;
    }
    if (!suggestion) setProductName("Women's boots");
    setProductType(WORKED_EXAMPLE.category);
    setFinishedMass(WORKED_EXAMPLE.finishedMassKg);
    // A name-based suggestion must not certify that the suggested bill of materials is complete.
    if (suggestion) setScopeConfirmed(false);
    else setScopeConfirmed(true);
    setMaterials(WORKED_EXAMPLE.parts.map((part, index) => ({
      id: `example-${index + 1}`,
      name: part.name,
      kg: part.quantity,
      factor: factors[index] as ProcessFactor,
    })));
    setSubmitted(false);
    setResult(null);
    setError('');
  };

  const calculate = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setError('');
    if (hasFormErrors(computeErrors())) return;
    if (!catalog) {
      setError('Processes are still loading. Try again in a moment.');
      return;
    }
    const processSelections: Array<{ factor_id: string; quantity: number }> = [];
    for (const line of selectedProcesses) {
      const input = line.productInputId ? productInputsById.get(line.productInputId) ?? null : null;
      const derived = deriveProcessQuantity(line.factor, line.quantity, input, line.quantityBasis);
      if (derived.quantity === null || derived.error) {
        setError(`${line.factor.activity}: ${derived.error ?? 'Enter a valid weight.'}`);
        return;
      }
      processSelections.push({ factor_id: line.factor.id, quantity: derived.quantity });
    }
    setCalculating(true);
    setResult(null);
    try {
      setResult(calculateFromCatalog(catalog, processSelections));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The result could not be calculated.');
    } finally {
      setCalculating(false);
    }
  };

  const exportsLocked = productBoundary.verdict === 'blocked';
  const exportExcel = async () => {
    if (!result || !resultReport) return;
    const now = new Date();
    const blob = await buildResultWorkbook({
      result,
      report: resultReport,
      summary: selectedProcessSummary,
      inputs: selectedProcesses.map((line) => {
        const linkedInput = line.productInputId ? productInputsById.get(line.productInputId) ?? null : null;
        const mapping = deriveProcessQuantity(line.factor, line.quantity, linkedInput, line.quantityBasis);
        const calculated = result.results.find((item) => item.factor_id === line.factor.id);
        return {
          activity: line.factor.activity,
          familyLabel: line.factor.family_label,
          geography: geographyFor(line.factor),
          referenceUnit: line.factor.reference_unit,
          quantity: calculated?.quantity ?? Number(line.quantity),
          basis: line.quantityBasis,
          basisLabel: mapping.basisLabel,
          productInputName: linkedInput?.name ?? null,
        };
      }),
      functionalUnitLabel: functionalUnitDescription || 'Not given',
      categoryLabel: PRODUCT_CATEGORY_LABEL[productType],
      generatedAt: now,
    });
    downloadBlob(blob, workbookFilename(now));
  };

  const exportResults = () => {
    if (!result) return;
    const csv = formatProcessEstimatesCsv(result, {
      productInputs,
      finishedProductMassKg: finishedMass,
      flatBomScopeConfirmed: scopeConfirmed,
      ghg: NO_GHG,
      processLinks: selectedProcesses.map((line) => ({
        factorId: line.factor.id,
        familyId: line.factor.family_id,
        productInputId: line.productInputId,
        quantityBasis: line.quantityBasis,
      })),
      functionalUnit: {
        category: productType,
        basis: FUNCTIONAL_UNIT_BASIS[productType],
        description: functionalUnitDescription,
      },
      summary: selectedProcessSummary,
    });
    downloadProcessEstimatesCsv(csv, 'environmental-process-estimates.csv');
  };

  const suggestedCategory = suggestedCategoryForProductName(productName);
  const hasBootExampleMatch = suggestedCategory === 'footwear';
  const showCategorySuggestion = suggestedCategory === 'apparel' && productType !== 'apparel';
  const hasExistingInputs = Boolean(finishedMass || scopeConfirmed || materials.some((item) => item.name.trim() || item.kg.trim() || item.factor));

  return (
    <SiteLayout current="calculator" sourceVersion={catalog?.source_version ?? '1.1.0'} totalRecords={catalog?.total_records ?? '302'}>
      <div className="calculator-page">
        <header className="page-heading">
          <h1 className="page-title">Calculator</h1>
        </header>

        <div className="calc-layout">
          <Paper component="section" elevation={0} className="form-card calc-card" aria-labelledby="calculator-heading">
            <Typography id="calculator-heading" component="h2" className="card-title">Inputs</Typography>
            <form className="calc-form" onSubmit={calculate} noValidate>
              <p className="calc-required-note">Fields marked * are required.</p>
              <div className="calc-product-grid">
                <TextField
                  required
                  label="Product name"
                  size="small"
                  value={productName}
                  onChange={(event) => changeGeneral(() => setProductName(event.target.value))}
                  error={Boolean(errors.productName)}
                  helperText={errors.productName}
                  fullWidth
                />
                <TextField
                  required
                  select
                  label="Sold as"
                  size="small"
                  value={productType}
                  onChange={(event) => changeGeneral(() => setProductType(event.target.value as ProductCategory))}
                  fullWidth
                >
                  <MenuItem value="footwear">Pair (footwear)</MenuItem>
                  <MenuItem value="apparel">Piece (apparel)</MenuItem>
                </TextField>
                <TextField
                  required
                  label="Finished weight (kg)"
                  size="small"
                  type="number"
                  slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                  value={finishedMass}
                  onChange={(event) => changeGeneral(() => setFinishedMass(event.target.value))}
                  error={Boolean(errors.finished)}
                  helperText={errors.finished}
                  fullWidth
                />
              </div>
              {hasBootExampleMatch && (
                <div className="calc-profile-suggestion" aria-live="polite">
                  <strong>Example suggestion: women’s boots</strong>
                  <span>These sample materials and weights are not inferred from your product. Review them and confirm the whole product before calculating.</span>
                  <Button type="button" variant="outlined" onClick={() => loadWorkedExample(true)} disabled={!catalog}>
                    {hasExistingInputs ? 'Replace inputs with example' : 'Use example as a starting point'}
                  </Button>
                </div>
              )}
              {showCategorySuggestion && (
                <div className="calc-profile-suggestion" aria-live="polite">
                  <strong>Suggested category: piece (apparel)</strong>
                  <span>Check this against your product.</span>
                  <Button type="button" variant="outlined" onClick={() => changeGeneral(() => setProductType('apparel'))}>
                    Use category suggestion
                  </Button>
                </div>
              )}

              <Typography component="h2" className="card-title calc-section-title">Materials</Typography>
              <div className="calc-material-list">
                {materials.map((item, index) => {
                  const rowError = errors.rows[index] ?? {};
                  return (
                    <div className="calc-material-row" key={item.id}>
                      <TextField
                        required
                        label="Material name"
                        size="small"
                        value={item.name}
                        onChange={(event) => changeMaterial(item.id, { name: event.target.value })}
                        error={Boolean(rowError.name)}
                        helperText={rowError.name}
                        fullWidth
                      />
                      <TextField
                        required
                        label="Weight (kg)"
                        size="small"
                        type="number"
                        slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                        value={item.kg}
                        onChange={(event) => changeMaterial(item.id, { kg: event.target.value })}
                        error={Boolean(rowError.kg)}
                        helperText={rowError.kg}
                        fullWidth
                      />
                      <Autocomplete
                        options={processOptions}
                        value={item.factor}
                        onChange={(_event, value) => changeMaterial(item.id, { factor: value })}
                        getOptionLabel={factorLabel}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            required
                            label="Process"
                            size="small"
                            error={Boolean(rowError.factor)}
                            helperText={rowError.factor}
                          />
                        )}
                        fullWidth
                      />
                      <IconButton aria-label={`Remove material ${index + 1}`} onClick={() => removeMaterial(item.id)} className="calc-remove">
                        <DeleteOutlineRoundedIcon />
                      </IconButton>
                    </div>
                  );
                })}
              </div>
              <div>
                <Button
                  type="button"
                  variant="text"
                  startIcon={<AddRoundedIcon />}
                  onClick={addMaterial}
                  disabled={materials.length >= MAX_MATERIALS}
                >
                  Add material
                </Button>
              </div>
              {errors.noMaterials && <Alert severity="error">{errors.noMaterials}</Alert>}

              <FormControlLabel
                required
                className="calc-scope"
                control={<Checkbox required checked={scopeConfirmed} onChange={(event) => changeGeneral(() => setScopeConfirmed(event.target.checked))} />}
                label="These materials make up the whole product"
              />
              {errors.scope && <Alert severity="error">{errors.scope}</Alert>}
              {errors.mass && <Alert severity="error">{errors.mass}</Alert>}
              {error && <Alert severity="error">{error}</Alert>}
              {catalogError && <Alert severity="error">{catalogError}</Alert>}

              <div className="calc-actions">
                <Button type="submit" variant="contained" disabled={!catalog || calculating}>Calculate</Button>
                <Button type="button" variant="text" onClick={() => loadWorkedExample()} disabled={!catalog}>Load example</Button>
              </div>
            </form>
          </Paper>

          <Paper component="section" elevation={0} className="result-card result-panel" aria-labelledby="results-heading">
            <Typography id="results-heading" component="h2" className="card-title">Results</Typography>

            {!result && !calculating && (
              <div className="calc-empty">
                <div className="round-lab-icon empty-illustration" aria-hidden="true"><ScienceOutlinedIcon /></div>
                <p>Results appear here after you calculate.</p>
              </div>
            )}

            {calculating && (
              <div className="catalog-loading calculation-loading" aria-busy="true"><CircularProgress size={24} aria-label="Calculating" /></div>
            )}

            {result && resultReport && (
              <div className="results-output">
                <div className="result-actions">
                  <Button size="small" variant="contained" startIcon={<FileDownloadOutlinedIcon />} onClick={exportExcel} disabled={exportsLocked}>
                    Download Excel
                  </Button>
                  <Button size="small" variant="outlined" startIcon={<FileDownloadOutlinedIcon />} onClick={exportResults} disabled={exportsLocked}>
                    Download CSV
                  </Button>
                </div>
                <ResultHeadline report={resultReport} subtotalsHidden={exportsLocked} blockers={holdBlockers(productBoundary, bomMassAssessment, selectedProcesses.length)} />
                <section className="result-processes" aria-labelledby="impact-by-process-heading">
                  <Typography id="impact-by-process-heading" component="h3" className="output-heading">By process</Typography>
                  <Stack spacing={2}>
                    {resultReport.processes.map((row, index) => {
                      const line = result.results[index];
                      return (
                        <ProcessImpactCard
                          key={row.key}
                          row={row}
                          line={line}
                          index={index}
                          subtotalsHidden={exportsLocked}
                        />
                      );
                    })}
                  </Stack>
                </section>
                {exportsLocked && (
                  <details className="result-details" open>
                    <summary>Mass and input checks</summary>
                    <div className="result-checks">
                      <BomMassAssessmentCard assessment={bomMassAssessment} />
                      <ProductInputUseCard review={productInputUseReview} />
                    </div>
                  </details>
                )}
                {!exportsLocked && selectedProcessSummary && (
                  <details className="result-details">
                    <summary>Totals by indicator</summary>
                    <SelectedProcessSummaryCard
                      summary={selectedProcessSummary}
                      inputUseReview={productInputUseReview}
                      bomMassAssessment={bomMassAssessment}
                    />
                  </details>
                )}
              </div>
            )}
          </Paper>
        </div>
      </div>
    </SiteLayout>
  );
}

export default App;
