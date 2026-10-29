import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import {
  Alert,
  Autocomplete,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import {
  calculateProcessEstimates,
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
import {
  END_OF_LIFE_FACTORS,
  FREIGHT_FACTORS,
  type EndOfLifeRoute,
  type FreightMode,
} from './ghg-supplement';
import { suggestFactorsByInputName } from './factor-suggestions';
import SiteLayout from './SiteLayout';

type GhgFreightDraft = { mode: FreightMode; distanceKm: string };
const FUNCTIONAL_UNIT_EXAMPLES: Record<ProductCategory, string[]> = {
  footwear: ["one pair of women's boots", 'one pair of sneakers'],
  apparel: ['one knitted t-shirt', 'one pair of trousers'],
};
const FREIGHT_MODE_OPTIONS = Object.entries(FREIGHT_FACTORS) as Array<[FreightMode, (typeof FREIGHT_FACTORS)[FreightMode]]>;
const END_OF_LIFE_OPTIONS = Object.entries(END_OF_LIFE_FACTORS) as Array<[EndOfLifeRoute, (typeof END_OF_LIFE_FACTORS)[EndOfLifeRoute]]>;


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

const MAX_PROCESS_LINES = 25;
const MAX_PRODUCT_INPUTS = 25;
const UNSPECIFIED_GEOGRAPHY = '__not_stated__';

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

function ResultHeadline({ report, subtotalsHidden }: { report: ResultReport; subtotalsHidden: boolean }) {
  return (
    <section className="result-headline" aria-labelledby="result-headline-heading">
      <Typography id="result-headline-heading" component="h3" className="output-heading">Summary</Typography>
      <div className="result-stat-grid">
        <div className="result-stat result-stat-yellow">
          <span>EF 3.1 total</span>
          {subtotalsHidden ? (
            <strong className="result-stat-hidden">Hidden</strong>
          ) : (
            <strong>{formatCompact(report.efPointsTotal)}</strong>
          )}
          <small>{subtotalsHidden ? 'Fix the items in Step 2' : 'points · higher means more impact'}</small>
        </div>
        <div className="result-stat result-stat-pink">
          <span>Climate change</span>
          {subtotalsHidden ? (
            <strong className="result-stat-hidden">Hidden</strong>
          ) : (
            <strong>{formatCompact(report.ghgTotal)}</strong>
          )}
          <small>{subtotalsHidden ? 'GHG layer waits for Step 2' : (report.ghgUnit ?? 'GHG not available')}</small>
        </div>
        <div className="result-stat result-stat-green">
          <span>Processes</span>
          <strong>{report.processCount}</strong>
          <small>selected rows</small>
        </div>
      </div>
      {!subtotalsHidden && <p className="result-sentence">{report.sentence}</p>}
    </section>
  );
}

function ProcessImpactCard({
  row,
  line,
  index,
  productInput,
  quantityBasisLabel,
  subtotalsHidden,
}: {
  row: ProcessImpactRow;
  line: ProcessEstimateLine;
  index: number;
  productInput: ProductInput | null;
  quantityBasisLabel: string;
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
        <div>
          <dt>Climate change</dt>
          <dd>{row.ghgValue === null ? '—' : `${formatCompact(row.ghgValue)} ${row.ghgUnit ?? ''}`}</dd>
        </div>
      </dl>
      {share !== null && (
        <div className="share-bar" aria-hidden="true"><span style={{ width: `${Math.min(100, Math.max(0, share))}%` }} /></div>
      )}
      {row.driver && (
        <p className="process-driver">
          Biggest driver: <strong>{row.driver.name}</strong> ({row.driver.code}), {formatShare(row.driver.sharePercent)} of this row.
        </p>
      )}
      {productInput && (
        <p className="product-input-result-context">
          <strong>Input mapping:</strong> {productInput.name} · {productInput.quantity} {productInput.unit} · {quantityBasisLabel}
        </p>
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
        Flat BOM mass diagnostic
      </Typography>
      <dl className="bom-mass-values">
        <div><dt>Declared input mass</dt><dd>{assessment.declaredInputMassKg === null ? 'Incomplete' : `${numberForDisplay(assessment.declaredInputMassKg)} kg`}</dd></div>
        <div><dt>Finished product mass</dt><dd>{assessment.finishedProductMassKg === null ? 'Not available' : `${numberForDisplay(assessment.finishedProductMassKg)} kg`}</dd></div>
        <div><dt>Mass difference (output − inputs)</dt><dd>{assessment.differenceKg === null ? 'Not available' : `${numberForDisplay(assessment.differenceKg)} kg`}</dd></div>
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

function FactorSuggestionDialog({
  open,
  input,
  suggestions,
  selectedFactorIds,
  onClose,
  onSelect,
}: {
  open: boolean;
  input: ProductInput | null;
  suggestions: ReturnType<typeof suggestFactorsByInputName>;
  selectedFactorIds: Set<string>;
  onClose: () => void;
  onSelect: (factor: ProcessFactor) => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="factor-suggestion-title">
      <DialogTitle id="factor-suggestion-title" className="dialog-title">Match a process factor</DialogTitle>
      <DialogContent dividers className="source-dialog-content">
        <Typography variant="body2" className="suggestion-dialog-note">
          Text matches only — confirm the process, geography, and reference unit before using a suggestion.
        </Typography>
        {input && <p className="suggestion-input-label"><strong>Input:</strong> {input.name}</p>}
        {suggestions.length > 0 ? (
          <Stack spacing={1}>
            {suggestions.map(({ factor, sharedTerms }) => (
              <div className="factor-suggestion-card" key={factor.id}>
                <div>
                  <strong>{factor.activity}</strong>
                  <span>{factor.family_label} · {geographyFor(factor)} · {factor.reference_unit}</span>
                  <small>{sharedTerms} shared name term{sharedTerms === 1 ? '' : 's'}</small>
                </div>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={selectedFactorIds.has(factor.id)}
                  onClick={() => onSelect(factor)}
                >
                  Use as output
                </Button>
              </div>
            ))}
          </Stack>
        ) : (
          <Alert severity="info">No strong name matches. Search the factor catalog manually.</Alert>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose} variant="contained">Close</Button></DialogActions>
    </Dialog>
  );
}

function App() {
  const [catalog, setCatalog] = useState<FactorCatalog | null>(null);
  const [, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [familyFilter, setFamilyFilter] = useState('');
  const [geographyFilter, setGeographyFilter] = useState('');
  const [selectedFactor, setSelectedFactor] = useState<ProcessFactor | null>(null);
  const [quantityDraft, setQuantityDraft] = useState('');
  const [selectedProcesses, setSelectedProcesses] = useState<SelectedProcess[]>([]);
  const [productInputs, setProductInputs] = useState<ProductInput[]>([]);
  const [productInputNameDraft, setProductInputNameDraft] = useState('');
  const [productInputQuantityDraft, setProductInputQuantityDraft] = useState('');
  const [productInputUnitDraft, setProductInputUnitDraft] = useState('');
  const [finishedProductMassDraft, setFinishedProductMassDraft] = useState('');
  const [inboundDraft, setInboundDraft] = useState<GhgFreightDraft>({ mode: 'hgv-articulated', distanceKm: '' });
  const [distributionDraft, setDistributionDraft] = useState<GhgFreightDraft>({ mode: 'hgv-articulated', distanceKm: '' });
  const [toWasteKmDraft, setToWasteKmDraft] = useState('');
  const [endOfLifeDraft, setEndOfLifeDraft] = useState<EndOfLifeRoute | ''>('');
  const [flatBomScopeConfirmed, setFlatBomScopeConfirmed] = useState(false);
  const [functionalUnitCategory, setFunctionalUnitCategory] = useState<ProductCategory>('footwear');
  const [functionalUnitDescription, setFunctionalUnitDescription] = useState('');
  const [productInputParentDraft, setProductInputParentDraft] = useState('');
  const [editingProductInputId, setEditingProductInputId] = useState<string | null>(null);
  const [productInputError, setProductInputError] = useState('');
  const productInputSequence = useRef(0);
  const [result, setResult] = useState<ProcessEstimateResponse | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');
  const [suggestionInputId, setSuggestionInputId] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    getFactorCatalog()
      .then((response) => {
        if (current) setCatalog(response);
      })
      .catch((requestError: unknown) => {
        if (current) {
          setCatalogError(requestError instanceof Error ? requestError.message : 'Process factors could not be loaded.');
        }
      })
      .finally(() => {
        if (current) setCatalogLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);

  const familyFactors = useMemo(() => {
    if (!catalog) return [];
    return catalog.factors.filter((factor) => !familyFilter || factor.family_id === familyFilter);
  }, [catalog, familyFilter]);

  const geographyOptions = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const factor of familyFactors) {
      const code = factor.geography_code || null;
      const key = code ?? UNSPECIFIED_GEOGRAPHY;
      const label = code ? `${factor.geography_label ?? code} (${code})` : 'Geography not stated';
      const current = counts.get(key);
      counts.set(key, { label, count: (current?.count ?? 0) + 1 });
    }
    return [...counts.entries()]
      .map(([code, option]) => ({ code, ...option }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [familyFactors]);

  const visibleFactors = useMemo(() => {
    if (!geographyFilter) return familyFactors;
    if (geographyFilter === UNSPECIFIED_GEOGRAPHY) {
      return familyFactors.filter((factor) => !factor.geography_code);
    }
    return familyFactors.filter((factor) => factor.geography_code === geographyFilter);
  }, [familyFactors, geographyFilter]);

  const selectedFactorAlreadyAdded = selectedFactor
    ? selectedProcesses.some((line) => line.factor.id === selectedFactor.id)
    : false;
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
  const productBoundary = useMemo<ProductBoundaryResult>(() => assessProductBoundary({
    functionalUnit: {
      category: functionalUnitCategory,
      basis: FUNCTIONAL_UNIT_BASIS[functionalUnitCategory],
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
    finishedProductMass: finishedProductMassDraft,
    scopeConfirmed: flatBomScopeConfirmed,
    ghg: {
      inbound: inboundDraft.distanceKm.trim() === '' ? null : inboundDraft,
      distribution: distributionDraft.distanceKm.trim() === '' ? null : distributionDraft,
      toWasteKm: toWasteKmDraft.trim() === '' ? null : toWasteKmDraft,
      endOfLife: endOfLifeDraft === '' ? null : endOfLifeDraft,
    },
  }), [productInputs, selectedProcesses, finishedProductMassDraft, flatBomScopeConfirmed, functionalUnitCategory, functionalUnitDescription, inboundDraft, distributionDraft, toWasteKmDraft, endOfLifeDraft]);
  const bomMassAssessment = productBoundary.massAssessment;
  const massBalanced = bomMassAssessment.status === 'balanced';
  const scenarioHint = (value: string) => (!massBalanced && value.trim() !== '' ? 'Not counted until the product mass check balances.' : undefined);
  const selectedProcessSummary = useMemo(
    () => result ? summarizeSelectedProcesses(result.results) : null,
    [result],
  );
  const suggestionInput = suggestionInputId ? productInputsById.get(suggestionInputId) ?? null : null;
  const factorSuggestions = useMemo(
    () => suggestionInput && catalog ? suggestFactorsByInputName(suggestionInput.name, catalog.factors) : [],
    [catalog, suggestionInput],
  );
  const clearProductInputDraft = () => {
    setProductInputNameDraft('');
    setProductInputQuantityDraft('');
    setProductInputUnitDraft('');
    setProductInputParentDraft('');
    setEditingProductInputId(null);
    setProductInputError('');
  };

  const saveProductInput = () => {
    const name = productInputNameDraft.trim();
    const quantity = Number(productInputQuantityDraft);
    const unit = productInputUnitDraft.trim();
    if (!name) {
      setProductInputError('Enter a name for this declared input.');
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setProductInputError('Enter a finite quantity greater than zero.');
      return;
    }
    if (!unit) {
      setProductInputError('Enter the unit as published or provided for this input.');
      return;
    }
    if (!editingProductInputId && productInputs.length >= MAX_PRODUCT_INPUTS) {
      setProductInputError(`You can declare up to ${MAX_PRODUCT_INPUTS} product input lines.`);
      return;
    }

    const parentId = productInputParentDraft || null;
    if (parentId !== null && parentId === editingProductInputId) {
      setProductInputError('A component cannot be its own parent.');
      return;
    }

    if (editingProductInputId) {
      setProductInputs((current) => current.map((item) => item.id === editingProductInputId
        ? { ...item, name, quantity: productInputQuantityDraft.trim(), unit, parentId }
        : item));
    } else {
      productInputSequence.current += 1;
      setProductInputs((current) => [...current, {
        id: `product-input-${productInputSequence.current}`,
        name,
        quantity: productInputQuantityDraft.trim(),
        unit,
        parentId,
      }]);
    }
    clearProductInputDraft();
    setFlatBomScopeConfirmed(false);
    setResult(null);
    setError('');
  };

  const editProductInput = (item: ProductInput) => {
    setEditingProductInputId(item.id);
    setProductInputNameDraft(item.name);
    setProductInputQuantityDraft(item.quantity);
    setProductInputUnitDraft(item.unit);
    setProductInputParentDraft(item.parentId ?? '');
    setProductInputError('');
  };

  const removeProductInput = (inputId: string) => {
    setProductInputs((current) => current.filter((item) => item.id !== inputId));
    setSelectedProcesses((current) => current.map((line) => line.productInputId === inputId
      ? { ...line, productInputId: null, quantityBasis: 'manual' }
      : line));
    if (editingProductInputId === inputId) clearProductInputDraft();
    setFlatBomScopeConfirmed(false);
    setResult(null);
    setError('');
  };

  const updateSelectedProductInput = (key: string, productInputId: string) => {
    setSelectedProcesses((current) => current.map((line) => line.key === key
      ? { ...line, productInputId: productInputId || null }
      : line));
    setResult(null);
    setError('');
  };

  const updateSelectedQuantityBasis = (key: string, quantityBasis: ProcessQuantityBasis) => {
    setSelectedProcesses((current) => current.map((line) => line.key === key
      ? { ...line, quantityBasis }
      : line));
    setResult(null);
    setError('');
  };

  const updateSelectedQuantity = (key: string, quantity: string) => {
    setSelectedProcesses((current) => current.map((line) => line.key === key ? { ...line, quantity } : line));
    setResult(null);
    setError('');
  };

  const addProcess = () => {
    if (!selectedFactor) {
      setError('Choose a process activity from the open factor catalog.');
      return;
    }
    const quantity = Number(quantityDraft);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('Enter a quantity greater than zero in the selected factor’s reference unit.');
      return;
    }
    if (selectedFactorAlreadyAdded) {
      setError('That factor is already in the list. Edit its quantity in the selected process list.');
      return;
    }
    if (selectedProcesses.length >= MAX_PROCESS_LINES) {
      setError(`A calculation can include up to ${MAX_PROCESS_LINES} separate process rows.`);
      return;
    }
    setSelectedProcesses((current) => [
      ...current,
      {
        key: `${selectedFactor.id}-${Date.now()}`,
        factor: selectedFactor,
        quantity: quantityDraft,
        productInputId: null,
        quantityBasis: 'manual',
      },
    ]);
    setSelectedFactor(null);
    setQuantityDraft('');
    setResult(null);
    setError('');
  };

  const removeProcess = (key: string) => {
    setSelectedProcesses((current) => current.filter((line) => line.key !== key));
    setResult(null);
    setError('');
  };

  const addSuggestedFactor = (factor: ProcessFactor) => {
    if (!suggestionInput) return;
    if (selectedProcesses.some((line) => line.factor.id === factor.id)) {
      setError('That factor is already in the selected process rows.');
      return;
    }
    if (selectedProcesses.length >= MAX_PROCESS_LINES) {
      setError(`A calculation can include up to ${MAX_PROCESS_LINES} process rows.`);
      return;
    }
    setSelectedProcesses((current) => [...current, {
      key: `${factor.id}-${Date.now()}`,
      factor,
      quantity: '',
      productInputId: suggestionInput.id,
      quantityBasis: 'declared-output',
    }]);
    setSuggestionInputId(null);
    setResult(null);
    setError('');
  };

  const calculate = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (selectedProcesses.length === 0) {
      setError('Add at least one process factor before calculating.');
      return;
    }
    const selections = selectedProcesses.map((line) => {
      const input = line.productInputId ? productInputsById.get(line.productInputId) ?? null : null;
      const derived = deriveProcessQuantity(line.factor, line.quantity, input, line.quantityBasis);
      return { line, derived };
    });
    const invalid = selections.find(({ derived }) => derived.quantity === null || derived.error);
    if (invalid) {
      setError(`${invalid.line.factor.activity}: ${invalid.derived.error ?? 'Enter a valid process quantity.'}`);
      return;
    }
    const processSelections = selections.map(({ line, derived }) => ({
      factor_id: line.factor.id,
      quantity: derived.quantity as number,
    }));

    setCalculating(true);
    setResult(null);
    try {
      const usesDeclaredInput = selectedProcesses.some((line) => line.quantityBasis !== 'manual');
      const response = usesDeclaredInput
        ? calculateFromCatalog(catalog as FactorCatalog, processSelections)
        : await calculateProcessEstimates(processSelections);
      setResult(response);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The process estimate could not be calculated.');
    } finally {
      setCalculating(false);
    }
  };

  const resultReport = useMemo(() => (result ? buildResultReport(result.results) : null), [result]);

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
      functionalUnitLabel: functionalUnitDescription.trim() || 'Not given',
      categoryLabel: PRODUCT_CATEGORY_LABEL[functionalUnitCategory],
      generatedAt: now,
    });
    downloadBlob(blob, workbookFilename(now));
  };

  const exportResults = () => {
    if (!result) return;
    const csv = formatProcessEstimatesCsv(result, {
      productInputs,
      finishedProductMassKg: finishedProductMassDraft,
      flatBomScopeConfirmed,
      ghg: {
        inbound: inboundDraft.distanceKm.trim() === '' ? null : inboundDraft,
        distribution: distributionDraft.distanceKm.trim() === '' ? null : distributionDraft,
        toWasteKm: toWasteKmDraft.trim() === '' ? null : toWasteKmDraft,
        endOfLife: endOfLifeDraft === '' ? null : endOfLifeDraft,
      },
      processLinks: selectedProcesses.map((line) => ({
        factorId: line.factor.id,
        familyId: line.factor.family_id,
        productInputId: line.productInputId,
        quantityBasis: line.quantityBasis,
      })),
      functionalUnit: {
        category: functionalUnitCategory,
        basis: FUNCTIONAL_UNIT_BASIS[functionalUnitCategory],
        description: functionalUnitDescription,
      },
      summary: selectedProcessSummary,
    });
    downloadProcessEstimatesCsv(csv, 'environmental-process-estimates.csv');
  };

  return (
    <>
      <SiteLayout current="calculator" sourceVersion={catalog?.source_version ?? '1.1.0'} totalRecords={catalog?.total_records ?? '302'}>
        <div className="calculator-page">
          <header className="page-heading">
            <p className="privacy-pill"><span className="glow-dot" aria-hidden="true" />Local only · inputs stay in this browser</p>
            <p className="landing-eyebrow">PROCESS CALCULATOR</p>
            <h1 className="page-title">Calculate a process estimate.</h1>
            <p className="page-lede">Choose published apparel and footwear processes, enter quantities, and read the 16 EF 3.1 indicators for each selected row.</p>
          </header>
        <div className="estimator-grid">
          <Paper component="section" elevation={0} className="form-card estimator-card ui-art-form" aria-labelledby="calculator-heading">
            <div className="card-heading-row">
              <div>
                <div className="step-label">STEP 2 · ADD PROCESSES</div>
                <Typography id="calculator-heading" component="h2" variant="h5" className="card-title">Build a process estimate.</Typography>
              </div>
                          </div>

            {catalogError && (
              <Alert severity="error" onClose={() => setCatalogError('')}>
                {catalogError} Reload the page to retry the bundled factor catalog.
              </Alert>
            )}

            <section id="product-inputs" className="product-input-workspace" aria-labelledby="product-input-heading">
              <div className="product-input-heading-row">
                <Typography id="product-input-heading" component="h3" className="product-input-title">
                  Step 1 · Product inputs (optional)
                </Typography>
                <Chip label={`${productInputs.length} / ${MAX_PRODUCT_INPUTS}`} size="small" className="soft-chip" />
              </div>
              <div className="product-input-entry-grid">
                <TextField
                  size="small"
                  label="Name (for example, cotton yarn)"
                  value={productInputNameDraft}
                  onChange={(event) => setProductInputNameDraft(event.target.value)}
                  slotProps={{ htmlInput: { maxLength: 100 } }}
                />
                <TextField
                  type="number"
                  size="small"
                  label="Amount"
                  value={productInputQuantityDraft}
                  onChange={(event) => setProductInputQuantityDraft(event.target.value)}
                  slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                />
                <TextField
                  size="small"
                  label="Unit (for example, kg)"
                  placeholder="e.g., kg, pair"
                  value={productInputUnitDraft}
                  onChange={(event) => setProductInputUnitDraft(event.target.value)}
                  slotProps={{ htmlInput: { maxLength: 40 } }}
                />
                <FormControl size="small" fullWidth>
                  <InputLabel id="product-input-parent-label">Part of</InputLabel>
                  <Select
                    labelId="product-input-parent-label"
                    id="product-input-parent"
                    value={productInputParentDraft}
                    label="Part of"
                    onChange={(event) => setProductInputParentDraft(event.target.value)}
                  >
                    <MenuItem value="">Top-level line</MenuItem>
                    {productInputs
                      .filter((item) => item.id !== editingProductInputId)
                      .map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </div>
              <div className="product-input-actions">
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={<AddRoundedIcon />}
                  onClick={saveProductInput}
                  disabled={productInputs.length >= MAX_PRODUCT_INPUTS && !editingProductInputId}
                >
                  {editingProductInputId ? 'Save input' : 'Add material'}
                </Button>
                {editingProductInputId && (
                  <Button type="button" onClick={clearProductInputDraft}>Cancel edit</Button>
                )}
                {productInputError && <Alert severity="error" onClose={() => setProductInputError('')}>{productInputError}</Alert>}
              </div>
              {productInputs.length > 0 && (
                <Stack spacing={1} className="product-input-list" aria-label="Declared product inputs">
                  {productInputs.map((item, index) => (
                    <div className="product-input-item" key={item.id}>
                      <div className="product-input-item-copy">
                        <span className="product-input-index">{String(index + 1).padStart(2, '0')}</span>
                        <div><strong>{item.name}</strong><span>{item.quantity} {item.unit}{item.parentId ? ` · part of ${productInputs.find((parent) => parent.id === item.parentId)?.name ?? 'a missing line'}` : ''}</span></div>
                      </div>
                      <div className="product-input-item-actions">
                        <Button size="small" onClick={() => setSuggestionInputId(item.id)}>Find factor</Button>
                        <IconButton aria-label={`Edit product input ${item.name}`} onClick={() => editProductInput(item)} size="small">
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton aria-label={`Remove product input ${item.name}`} onClick={() => removeProductInput(item.id)} size="small">
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </div>
                    </div>
                  ))}
                </Stack>
              )}
              <details className="bom-mass-check-workspace">
                <summary>Optional checks: mass, transport, and life-cycle stages</summary>
                <div className="functional-unit-fields">
                  <FormControl size="small" fullWidth>
                    <InputLabel id="functional-unit-category-label">Product category</InputLabel>
                    <Select
                      labelId="functional-unit-category-label"
                      id="functional-unit-category"
                      value={functionalUnitCategory}
                      label="Product category"
                      onChange={(event) => {
                        setFunctionalUnitCategory(event.target.value as ProductCategory);
                        setFlatBomScopeConfirmed(false);
                      }}
                    >
                      <MenuItem value="footwear">Footwear (per pair)</MenuItem>
                      <MenuItem value="apparel">Apparel (per piece)</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    fullWidth
                    label="Functional unit"
                    placeholder="e.g., one pair of women's boots"
                    value={functionalUnitDescription}
                    onChange={(event) => setFunctionalUnitDescription(event.target.value)}
                    slotProps={{ htmlInput: { maxLength: 140 } }}
                  />
                </div>
                <div className="fu-suggestions" aria-label="Functional unit examples">
                  <span className="fu-suggestions-label">Examples:</span>
                  {FUNCTIONAL_UNIT_EXAMPLES[functionalUnitCategory].map((example) => (
                    <Chip key={example} size="small" variant="outlined" label={example} onClick={() => setFunctionalUnitDescription(example)} />
                  ))}
                </div>
                <FormControlLabel
                  className="bom-mass-confirmation"
                  control={(
                    <Checkbox
                      size="small"
                      checked={flatBomScopeConfirmed}
                      onChange={(event) => setFlatBomScopeConfirmed(event.target.checked)}
                    />
                  )}
                  label="All declared lines are product components for one functional unit"
                />
                <div className="bom-mass-field">
                  <label className="bom-mass-field-label" htmlFor="finished-product-mass">Finished product mass per functional unit (kg)</label>
                  <TextField
                    id="finished-product-mass"
                    type="number"
                    size="small"
                    fullWidth
                    placeholder="e.g., 0.42"
                    value={finishedProductMassDraft}
                    onChange={(event) => setFinishedProductMassDraft(event.target.value)}
                    slotProps={{ htmlInput: { min: 0, step: 'any', 'aria-label': 'Finished product mass per functional unit (kg)' } }}
                  />
                </div>
                {bomMassAssessment.status === 'scope-not-confirmed' && (
                  <div className="bom-mass-compact" aria-live="polite">
                    <strong>{describeBomMassStatus(bomMassAssessment)}</strong>
                  </div>
                )}
                {bomMassAssessment.status !== 'missing-product-mass' && bomMassAssessment.status !== 'scope-not-confirmed' && (
                  <div className="bom-mass-compact" aria-live="polite">
                    <span>{bomMassAssessment.declaredInputMassKg === null
                      ? bomMassAssessment.status === 'no-declared-inputs' ? 'No declared inputs' : 'Input mass incomplete'
                      : `Inputs ${numberForDisplay(bomMassAssessment.declaredInputMassKg)} kg`}</span>
                    {bomMassAssessment.differenceKg !== null && (
                      <span>Difference {numberForDisplay(bomMassAssessment.differenceKg)} kg</span>
                    )}
                    <strong>{describeBomMassStatus(bomMassAssessment)}</strong>
                  </div>
                )}
                <details className="ghg-inputs ghg-accordion">
                  <summary>Transport and end of life (climate change only)</summary>
                  <div className="form-grid two-col">
                    <TextField
                      select
                      size="small"
                      label="A2 inbound transport mode"
                      value={inboundDraft.mode}
                      onChange={(event) => setInboundDraft((draft) => ({ ...draft, mode: event.target.value as FreightMode }))}
                      slotProps={{ select: { renderValue: (value) => FREIGHT_FACTORS[value as FreightMode].label } }}
                    >
                      {FREIGHT_MODE_OPTIONS.map(([id, option]) => (<MenuItem key={id} value={id}>{option.label}</MenuItem>))}
                    </TextField>
                    <TextField
                      type="number"
                      size="small"
                      id="ghg-inbound-distance"
                      label="A2 inbound distance (km)"
                      value={inboundDraft.distanceKm}
                      onChange={(event) => setInboundDraft((draft) => ({ ...draft, distanceKm: event.target.value }))}
                      helperText={scenarioHint(inboundDraft.distanceKm)}
                      slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 0, step: 'any' } }}
                    />
                    <TextField
                      select
                      size="small"
                      label="A4 distribution mode"
                      value={distributionDraft.mode}
                      onChange={(event) => setDistributionDraft((draft) => ({ ...draft, mode: event.target.value as FreightMode }))}
                      slotProps={{ select: { renderValue: (value) => FREIGHT_FACTORS[value as FreightMode].label } }}
                    >
                      {FREIGHT_MODE_OPTIONS.map(([id, option]) => (<MenuItem key={id} value={id}>{option.label}</MenuItem>))}
                    </TextField>
                    <TextField
                      type="number"
                      size="small"
                      id="ghg-distribution-distance"
                      label="A4 distribution distance (km)"
                      value={distributionDraft.distanceKm}
                      onChange={(event) => setDistributionDraft((draft) => ({ ...draft, distanceKm: event.target.value }))}
                      helperText={scenarioHint(distributionDraft.distanceKm)}
                      slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 0, step: 'any' } }}
                    />
                    <TextField
                      type="number"
                      size="small"
                      id="ghg-to-waste-distance"
                      label="C2 distance to waste (km, HGV)"
                      value={toWasteKmDraft}
                      onChange={(event) => setToWasteKmDraft(event.target.value)}
                      helperText={scenarioHint(toWasteKmDraft)}
                      slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 0, step: 'any' } }}
                    />
                    <TextField
                      select
                      size="small"
                      id="ghg-end-of-life"
                      label="C3 and C4 end-of-life route"
                      value={endOfLifeDraft}
                      onChange={(event) => setEndOfLifeDraft(event.target.value as EndOfLifeRoute | '')}
                      slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true, renderValue: (value) => value === '' ? 'Not declared' : END_OF_LIFE_FACTORS[value as EndOfLifeRoute].label } }}
                    >
                      <MenuItem value="">Not declared</MenuItem>
                      {END_OF_LIFE_OPTIONS.map(([id, option]) => (<MenuItem key={id} value={id}>{option.label}</MenuItem>))}
                    </TextField>
                  </div>
                </details>
              </details>
            </section>

            {!catalog && !catalogError && (
              <div className="process-skeleton" aria-busy="true">
                <span className="visually-hidden" role="status">Loading process factors</span>
                <div className="process-skeleton-row" aria-hidden="true">
                  <span className="skeleton-bar skeleton-bar-label" />
                  <span className="skeleton-bar skeleton-bar-field" />
                </div>
                <div className="process-skeleton-row" aria-hidden="true">
                  <span className="skeleton-bar skeleton-bar-field" />
                  <span className="skeleton-bar skeleton-bar-field" />
                </div>
                <div className="process-skeleton-row" aria-hidden="true">
                  <span className="skeleton-bar skeleton-bar-wide" />
                </div>
              </div>
            )}
            {catalog && (
              <form id="process-library" onSubmit={calculate} className="estimator-form">
                <div className="form-grid two-col">
                  <FormControl fullWidth size="small">
                    <InputLabel id="family-label">Type of step</InputLabel>
                    <Select
                      labelId="family-label"
                      id="family-filter"
                      value={familyFilter}
                      label="Type of step"
                      onChange={(event) => {
                        setFamilyFilter(event.target.value);
                        setGeographyFilter('');
                        setSelectedFactor(null);
                        setQuantityDraft('');
                        setResult(null);
                      }}
                    >
                      <MenuItem value="">All families ({catalog.total_records})</MenuItem>
                      {catalog.families.map((family) => (
                        <MenuItem value={family.id} key={family.id}>{family.label} ({family.record_count})</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel id="geography-label">Where is it made?</InputLabel>
                    <Select
                      labelId="geography-label"
                      id="geography-filter"
                      value={geographyFilter}
                      label="Where is it made?"
                      onChange={(event) => {
                        setGeographyFilter(event.target.value);
                        setSelectedFactor(null);
                        setQuantityDraft('');
                        setResult(null);
                        setError('');
                      }}
                    >
                      <MenuItem value="">All geographies ({familyFactors.length})</MenuItem>
                      {geographyOptions.map((option) => (
                        <MenuItem value={option.code} key={option.code}>{option.label} ({option.count})</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>

                <Autocomplete
                  options={visibleFactors}
                  value={selectedFactor}
                  getOptionLabel={factorLabel}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  filterOptions={(options, state) => {
                    const query = state.inputValue.trim().toLocaleLowerCase();
                    if (!query) return options.slice(0, 50);
                    return options.filter((factor) => {
                      const searchable = `${factor.activity} ${factor.family_label} ${factor.geography_label ?? ''} ${factor.geography_code ?? ''} ${factor.reference_unit} ${factor.id}`.toLocaleLowerCase();
                      return searchable.includes(query);
                    }).slice(0, 100);
                  }}
                  noOptionsText="No process factors match this search."
                  onInputChange={(_, _value, reason) => {
                    if (reason === 'input' || reason === 'clear') setSelectedFactor(null);
                  }}
                  onChange={(_, factor) => {
                    setSelectedFactor(factor);
                    setQuantityDraft('');
                    setResult(null);
                    setError('');
                  }}
                  renderOption={(props, factor) => {
                    const { key, ...optionProps } = props;
                    return (
                      <li {...optionProps} key={key ?? factor.id}>
                        <div className="factor-option">
                          <strong>{factor.activity}</strong>
                          <span>{factor.family_label} · {geographyFor(factor)} · {factor.reference_unit}</span>
                        </div>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Pick a process"
                      placeholder="Search and select a published activity"
                      size="small"
                    />
                  )}
                />

                {selectedFactor && (
                  <Paper variant="outlined" className="factor-detail-card">
                    <div className="factor-detail-heading">
                      <div>
                        <Typography component="h3" className="factor-detail-title">{selectedFactor.activity}</Typography>
                        <Typography variant="body2">{selectedFactor.family_label} · {geographyFor(selectedFactor)}</Typography>
                      </div>
                      <Chip size="small" label="16 indicators" className="soft-chip" />
                    </div>
                    <div className="reference-unit-note"><strong>Reference unit:</strong> {selectedFactor.reference_unit}</div>
                  </Paper>
                )}

                <div className="form-grid quantity-grid">
                  <TextField
                    type="number"
                    size="small"
                    label="How much? (in the unit shown)"
                    value={quantityDraft}
                    onChange={(event) => setQuantityDraft(event.target.value)}
                    disabled={!selectedFactor}
                    slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                  />
                  <Button
                    type="button"
                    variant="outlined"
                    startIcon={<AddRoundedIcon />}
                    onClick={addProcess}
                    disabled={!selectedFactor || !quantityDraft || selectedProcesses.length >= MAX_PROCESS_LINES || selectedFactorAlreadyAdded}
                    className="add-process-button"
                  >
                    Add this step
                  </Button>
                </div>

                {selectedProcesses.length > 0 && (
                  <section className="selected-processes" aria-labelledby="selected-processes-heading">
                    <div className="selected-processes-heading">
                      <Typography id="selected-processes-heading" component="h3" className="output-heading">Selected process rows</Typography>
                      <Chip label={`${selectedProcesses.length} / ${MAX_PROCESS_LINES}`} size="small" className="soft-chip" />
                    </div>
                    <Stack spacing={1.2}>
                      {selectedProcesses.map((line, index) => {
                        const linkedInput = line.productInputId ? productInputsById.get(line.productInputId) ?? null : null;
                        const derived = deriveProcessQuantity(line.factor, line.quantity, linkedInput, line.quantityBasis);
                        const shownQuantity = line.quantityBasis === 'manual'
                          ? line.quantity
                          : derived.quantity === null ? '' : String(derived.quantity);
                        return (
                          <div className="selected-process" key={line.key}>
                            <div className="selected-process-copy">
                              <span className="selected-process-index">{String(index + 1).padStart(2, '0')}</span>
                              <div><strong>{line.factor.activity}</strong><span>{line.factor.family_label} · {geographyFor(line.factor)} · {line.factor.reference_unit}</span></div>
                            </div>
                            <TextField
                              type="number"
                              size="small"
                              label={line.quantityBasis === 'manual' ? 'Quantity' : 'Mapped quantity'}
                              value={shownQuantity}
                              onChange={(event) => updateSelectedQuantity(line.key, event.target.value)}
                              disabled={line.quantityBasis !== 'manual'}
                              slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                              className="selected-quantity"
                            />
                            <IconButton aria-label={`Remove ${line.factor.activity}`} onClick={() => removeProcess(line.key)} size="small">
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                            {productInputs.length > 0 && (
                              <div className="process-mapping-controls">
                                <FormControl fullWidth size="small">
                                  <InputLabel id={`process-input-context-label-${index}`}>Goes into which step?</InputLabel>
                                  <Select
                                    labelId={`process-input-context-label-${index}`}
                                    id={`process-input-context-${index}`}
                                    value={line.productInputId ?? ''}
                                    label="Goes into which step?"
                                    onChange={(event) => updateSelectedProductInput(line.key, event.target.value)}
                                  >
                                    <MenuItem value="">No input association</MenuItem>
                                    {productInputs.map((item) => (
                                      <MenuItem key={item.id} value={item.id}>
                                        {item.name} — {item.quantity} {item.unit}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                                <FormControl fullWidth size="small">
                                  <InputLabel id={`process-quantity-basis-label-${index}`}>Quantity basis</InputLabel>
                                  <Select
                                    labelId={`process-quantity-basis-label-${index}`}
                                    id={`process-quantity-basis-${index}`}
                                    value={line.quantityBasis}
                                    label="Quantity basis"
                                    onChange={(event) => updateSelectedQuantityBasis(line.key, event.target.value as ProcessQuantityBasis)}
                                  >
                                    <MenuItem value="manual">Manual quantity</MenuItem>
                                    <MenuItem value="declared-output">Input is process output</MenuItem>
                                    <MenuItem value="declared-input">Input is process feed</MenuItem>
                                  </Select>
                                </FormControl>
                                {line.quantityBasis !== 'manual' && derived.error && (
                                  <span className="quantity-mapping-error" role="alert">{derived.error}</span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </Stack>
                  </section>
                )}

                {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

                <div className="calculator-actions">
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={calculating ? <CircularProgress size={16} color="inherit" /> : <CalculateOutlinedIcon />}
                    disabled={calculating || selectedProcesses.length === 0}
                  >
                    Calculate my results
                  </Button>
                </div>
              </form>
            )}
          </Paper>

          <Paper component="section" elevation={0} className="result-card result-panel ui-art-result" aria-labelledby="results-heading">
            <div className="result-card-top">
              <div>
                <div className="step-label">STEP 3 · RESULTS</div>
                <Typography id="results-heading" component="h2" variant="h5" className="card-title">Your results.</Typography>
              </div>
              {result && <Chip label="Calculated" size="small" className="calculated-chip" />}
            </div>

            {!result && !calculating && (
              <div className="empty-result process-empty">
                <div className="empty-illustration" aria-hidden="true"><ScienceOutlinedIcon /></div>
                <Typography component="h3" className="empty-title">Choose the source activity and its quantity.</Typography>
                <Typography className="empty-copy">
                  16 environmental indicators for each selected process.
                </Typography>
              </div>
            )}

            {calculating && (
              <div className="catalog-loading calculation-loading" aria-busy="true"><CircularProgress size={24} aria-label="Calculating process indicators and selected-row subtotal" /></div>
            )}

            {result && resultReport && (
              <div className="results-output">
                <div className="result-intro">
                  <span className="result-scope-label">Selected rows only</span>
                  <div className="result-actions">
                    <Button size="small" variant="contained" startIcon={<FileDownloadOutlinedIcon />} onClick={exportExcel} disabled={exportsLocked} aria-describedby={exportsLocked ? 'exports-locked-note' : undefined}>
                      Download Excel
                    </Button>
                    <Button size="small" startIcon={<FileDownloadOutlinedIcon />} onClick={exportResults} disabled={exportsLocked} aria-describedby={exportsLocked ? 'exports-locked-note' : undefined}>
                      Download CSV
                    </Button>
                    {exportsLocked && (
                      <span id="exports-locked-note" className="exports-locked-note">Downloads unlock when the Step 2 items are fixed.</span>
                    )}
                  </div>
                </div>
                <ResultHeadline report={resultReport} subtotalsHidden={productBoundary.verdict === 'blocked'} />
                <section className="result-processes" aria-labelledby="impact-by-process-heading">
                  <Typography id="impact-by-process-heading" component="h3" className="output-heading">Impact by process</Typography>
                  <Stack spacing={2}>
                    {resultReport.processes.map((row, index) => {
                      const line = result.results[index];
                      const selectedProcess = selectedProcesses.find((item) => item.factor.id === line.factor_id);
                      const productInput = selectedProcess?.productInputId
                        ? productInputsById.get(selectedProcess.productInputId) ?? null
                        : null;
                      const quantityMapping = selectedProcess
                        ? deriveProcessQuantity(selectedProcess.factor, selectedProcess.quantity, productInput, selectedProcess.quantityBasis)
                        : null;
                      return (
                        <ProcessImpactCard
                          key={row.key}
                          row={row}
                          line={line}
                          index={index}
                          productInput={productInput}
                          quantityBasisLabel={quantityMapping?.basisLabel ?? 'Manual process quantity'}
                          subtotalsHidden={productBoundary.verdict === 'blocked'}
                        />
                      );
                    })}
                  </Stack>
                </section>
                {selectedProcessSummary && productBoundary.verdict === 'blocked' && (bomMassAssessment.status !== 'scope-not-confirmed' && bomMassAssessment.status !== 'missing-product-mass' || productInputUseReview.inputs.length > 0) && (
                  <details className="result-details" open>
                    <summary>Mass and input checks</summary>
                    <div className="result-checks">
                      <BomMassAssessmentCard assessment={bomMassAssessment} />
                      <ProductInputUseCard review={productInputUseReview} />
                    </div>
                  </details>
                )}
                {selectedProcessSummary && productBoundary.verdict !== 'blocked' && (
                  <details className="result-details">
                    <summary>Totals by indicator and EF 3.1 table</summary>
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

      <FactorSuggestionDialog
        open={suggestionInputId !== null}
        input={suggestionInput}
        suggestions={factorSuggestions}
        selectedFactorIds={new Set(selectedProcesses.map((line) => line.factor.id))}
        onClose={() => setSuggestionInputId(null)}
        onSelect={addSuggestedFactor}
      />
    </>
  );
}

export default App;
