import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
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
import ForestOutlinedIcon from '@mui/icons-material/ForestOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import {
  calculateProcessEstimates,
  getActiveSources,
  getFactorCatalog,
  type ActiveDataSource,
  type FactorCatalog,
  type ProcessEstimateLine,
  type ProcessEstimateResponse,
  type ProcessFactor,
} from './api';
import { formatProcessEstimatesCsv, downloadProcessEstimatesCsv } from './export';
import { LandscapeScene } from './LandscapeArt';

type ProductInput = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
};

type SelectedProcess = {
  key: string;
  factor: ProcessFactor;
  quantity: string;
  productInputId: string | null;
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

function dqrEntries(line: ProcessEstimateLine): Array<[string, number]> {
  if (!line.data_quality) return [];
  const entries: Array<[string, number | null]> = [
    ['Precision', line.data_quality.precision],
    ['Time representativeness', line.data_quality.temporal_representativeness],
    ['Technology representativeness', line.data_quality.technological_representativeness],
    ['Geographical representativeness', line.data_quality.geographical_representativeness],
  ];
  return entries.filter((entry): entry is [string, number] => typeof entry[1] === 'number');
}

function ProcessResult({
  line,
  index,
  productInput,
}: {
  line: ProcessEstimateLine;
  index: number;
  productInput: ProductInput | null;
}) {
  const scores = dqrEntries(line);
  const water = line.indicators.find((item) => item.code === 'WTU');
  const headingId = `result-${index}-${line.factor_id}`;

  return (
    <article className="process-result" aria-labelledby={headingId}>
      <div className="process-result-heading">
        <div>
          <div className="result-overline">{line.family_label}</div>
          <Typography id={headingId} component="h3" className="process-result-title">
            {line.activity}
          </Typography>
          <div className="process-result-meta">
            <Chip size="small" label={geographyFor(line)} className="geo-chip" />
            <span>{numberForDisplay(line.quantity)} × {line.reference_unit}</span>
          </div>
          {productInput && (
            <p className="product-input-result-context">
              <strong>User-associated input:</strong> {productInput.name} — {productInput.quantity} {productInput.unit}.
              {' '}Context only; its quantity was not used to calculate this process result.
            </p>
          )}
        </div>
        <Chip size="small" label="Separate process result" className="separate-chip" />
      </div>

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

      <div className="process-result-details">
        {line.input_required_kg_per_reference_unit !== null && (
          <p>
            <strong>Source-reported input required:</strong>{' '}
            {numberForDisplay(line.input_required_kg_per_reference_unit)} kg per reference unit. This source parameter is shown as published; no separate upstream-material or waste-treatment calculation is applied.
          </p>
        )}
        <details>
          <summary>Data quality and source row</summary>
          {scores.length > 0 ? (
            <dl className="dqr-list">
              {scores.map(([label, value]) => (
                <div key={label}><dt>{label}</dt><dd>{numberForDisplay(value)}</dd></div>
              ))}
            </dl>
          ) : (
            <p>No data-quality ratings were published for this factor.</p>
          )}
          <p className="source-row-id">Source row: <code>{line.factor_id}</code></p>
          <p className="source-row-id">Bundled file: <code>{line.source_file}</code></p>
        </details>
      </div>
    </article>
  );
}

function SourceDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [sources, setSources] = useState<ActiveDataSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [sourceLoaded, setSourceLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || sourceLoaded) return;
    let current = true;
    setLoading(true);
    getActiveSources()
      .then((items) => {
        if (current) setSources(items);
      })
      .catch((requestError: unknown) => {
        if (current) {
          setError(requestError instanceof Error ? requestError.message : 'Source details could not be loaded.');
        }
      })
      .finally(() => {
        if (current) {
          setLoading(false);
          setSourceLoaded(true);
        }
      });
    return () => {
      current = false;
    };
  }, [open, sourceLoaded]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth aria-labelledby="source-dialog-title">
      <DialogTitle id="source-dialog-title" className="dialog-title">Method, source and reuse</DialogTitle>
      <DialogContent dividers className="source-dialog-content">
        <Stack spacing={2.5}>
          <section>
            <Typography component="h3" className="dialog-section-title">Implemented calculation</Typography>
            <Typography variant="body2">
              For each selected activity and each of its 16 indicators, the app multiplies the published factor by the quantity you enter in that factor’s own reference unit. The optional product-input worksheet is user-declared context only: a manual association does not set or convert the process quantity. Every process row stays separate. No cross-stage sum, composite score, ranking, or complete product footprint is calculated.
            </Typography>
          </section>
          <section>
            <Typography component="h3" className="dialog-section-title">Data boundary</Typography>
            <Typography variant="body2">
              Factor reference units, modeled boundaries, and geographies vary by source row. The source’s Input required (kg) value is displayed when present, but this app does not apply upstream material factors or add waste treatment. The source publishes WTU in m³ world-equivalent; it is an impact indicator, not litres of physical water. Use-phase records describe representative European consumer behavior.
            </Typography>
          </section>
          {loading && <CircularProgress size={22} aria-label="Loading source details" />}
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
          {sources.map((source) => (
            <section key={source.id} className="source-dialog-card">
              <Typography component="h3" className="dialog-section-title">{source.name} · v{source.version}</Typography>
              <Typography variant="body2">{source.scope_summary}</Typography>
              <p className="same-screen-attribution">{source.attribution_text}</p>
              <div className="source-dialog-links">
                {source.attribution_links.map((link) => (
                  <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
                    {link.label} <OpenInNewOutlinedIcon fontSize="inherit" />
                  </a>
                ))}
              </div>
              <Typography variant="body2"><strong>License for source-derived results:</strong> {source.result_license}. Attribution and ShareAlike apply.</Typography>
              <Typography variant="body2"><strong>Underlying inventories:</strong> {source.background_database_note}</Typography>
              <ul className="source-limitations">
                {source.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
              </ul>
            </section>
          ))}
          <section>
            <Typography component="h3" className="dialog-section-title">Privacy</Typography>
            <Typography variant="body2">
              The app has no user accounts, analytics, database, or calculation history. Optional product-input notes and manual associations stay in browser page memory and are not sent to the API; factor IDs and the separately entered reference-unit quantities are sent for calculation. Nothing is saved after the page is closed or reloaded. If you download a CSV, it may contain the input labels and quantities you entered. The API access log is disabled and request bodies are not logged by the app. Hosting infrastructure may retain network metadata under its own operating policy.
            </Typography>
          </section>
        </Stack>
      </DialogContent>
      <DialogActions><Button onClick={onClose} variant="contained">Close</Button></DialogActions>
    </Dialog>
  );
}

function App() {
  const [catalog, setCatalog] = useState<FactorCatalog | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
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
  const [editingProductInputId, setEditingProductInputId] = useState<string | null>(null);
  const [productInputError, setProductInputError] = useState('');
  const productInputSequence = useRef(0);
  const [result, setResult] = useState<ProcessEstimateResponse | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);

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
  const associatedProductInputIds = useMemo(
    () => new Set(selectedProcesses.flatMap((line) => line.productInputId ? [line.productInputId] : [])),
    [selectedProcesses],
  );
  const unassociatedProductInputs = productInputs.filter((item) => !associatedProductInputIds.has(item.id));

  const clearProductInputDraft = () => {
    setProductInputNameDraft('');
    setProductInputQuantityDraft('');
    setProductInputUnitDraft('');
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

    if (editingProductInputId) {
      setProductInputs((current) => current.map((item) => item.id === editingProductInputId
        ? { ...item, name, quantity: productInputQuantityDraft.trim(), unit }
        : item));
    } else {
      productInputSequence.current += 1;
      setProductInputs((current) => [...current, {
        id: `product-input-${productInputSequence.current}`,
        name,
        quantity: productInputQuantityDraft.trim(),
        unit,
      }]);
    }
    clearProductInputDraft();
    setResult(null);
    setError('');
  };

  const editProductInput = (item: ProductInput) => {
    setEditingProductInputId(item.id);
    setProductInputNameDraft(item.name);
    setProductInputQuantityDraft(item.quantity);
    setProductInputUnitDraft(item.unit);
    setProductInputError('');
  };

  const removeProductInput = (inputId: string) => {
    setProductInputs((current) => current.filter((item) => item.id !== inputId));
    setSelectedProcesses((current) => current.map((line) => line.productInputId === inputId
      ? { ...line, productInputId: null }
      : line));
    if (editingProductInputId === inputId) clearProductInputDraft();
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

  const calculate = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (selectedProcesses.length === 0) {
      setError('Add at least one process factor before calculating.');
      return;
    }
    const quantities = selectedProcesses.map((line) => Number(line.quantity));
    if (quantities.some((quantity) => !Number.isFinite(quantity) || quantity <= 0)) {
      setError('Each selected process needs a quantity greater than zero.');
      return;
    }
    setCalculating(true);
    setResult(null);
    try {
      const response = await calculateProcessEstimates(
        selectedProcesses.map((line) => ({ factor_id: line.factor.id, quantity: Number(line.quantity) })),
      );
      setResult(response);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The process estimate could not be calculated.');
    } finally {
      setCalculating(false);
    }
  };

  const exportResults = () => {
    if (!result) return;
    const csv = formatProcessEstimatesCsv(result, {
      productInputs,
      processLinks: selectedProcesses.map((line) => ({
        factorId: line.factor.id,
        productInputId: line.productInputId,
      })),
    });
    downloadProcessEstimatesCsv(csv, 'environmental-process-estimates.csv');
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Environmental Impact Analyzer home">
          <span className="brand-mark"><ForestOutlinedIcon fontSize="small" /></span>
          <span className="brand-name">impact<span aria-hidden="true"> / </span>analyzer</span>
        </a>
        <div className="header-right">
          <Button variant="text" startIcon={<InfoOutlinedIcon />} onClick={() => setSourceDialogOpen(true)} className="method-button">
            Method & data
          </Button>
        </div>
      </header>

      <main id="top" className="main-content estimator-main">
        <section className="hero-section estimator-hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> APPAREL & FOOTWEAR</div>
            <Typography id="hero-title" component="h1" className="hero-title">
              Process impacts, <span className="hero-title-accent">with context.</span>
            </Typography>
            <Typography className="hero-subtitle">
              Explore 16 environmental indicators from published process data. Choose the activity, match its reference unit, and scale the factor to your quantity.
            </Typography>
          </div>
          <div className="hero-visual">
            <LandscapeScene />
          </div>
        </section>

        <div className="catalog-strip" aria-label="Loaded source coverage">
          <div><strong>{catalog?.total_records ?? '—'}</strong><span>published process factors</span></div>
          <Divider orientation="vertical" flexItem />
          <div><strong>{catalog?.families.length ?? '—'}</strong><span>selectable factor groups</span></div>
          <Divider orientation="vertical" flexItem />
          <div><strong>16</strong><span>EF 3.1 indicators</span></div>
          <div className="catalog-strip-note">Source version {catalog?.source_version ?? '1.1.0'} · Global and region-specific rows where published</div>
        </div>

        <div className="estimator-grid">
          <Paper component="section" elevation={0} className="form-card estimator-card" aria-labelledby="calculator-heading">
            <div className="card-heading-row">
              <div>
                <div className="step-label">01 <span aria-hidden="true">·</span> SELECT PROCESS DATA</div>
                <Typography id="calculator-heading" component="h2" variant="h5" className="card-title">Build a process estimate.</Typography>
                <Typography className="card-subtitle">Each activity keeps the reference unit and source geography shown in its dataset.</Typography>
              </div>
              <div className="card-number" aria-hidden="true">01</div>
            </div>

            {catalogLoading && (
              <div className="catalog-loading" aria-busy="true"><CircularProgress size={22} aria-label="Loading process factors" /></div>
            )}
            {catalogError && (
              <Alert severity="error" onClose={() => setCatalogError('')}>
                {catalogError} Reload the page to retry the bundled factor catalog.
              </Alert>
            )}

            <section className="product-input-workspace" aria-labelledby="product-input-heading">
              <div className="product-input-heading-row">
                <div>
                  <div className="step-label">V2 <span aria-hidden="true">·</span> DECLARED INPUTS</div>
                  <Typography id="product-input-heading" component="h3" className="product-input-title">
                    Optional product-input worksheet
                  </Typography>
                </div>
                <Chip label={`${productInputs.length} / ${MAX_PRODUCT_INPUTS}`} size="small" className="soft-chip" />
              </div>
              <Typography className="product-input-explainer">
                Record inputs you already know, with your own labels, quantities, and unit text. These notes stay in this page and are not sent to the API. You may manually associate an input with a selected process below, but its amount never sets or converts the separate process quantity. No factor matching, stage mapping, loss treatment, or product total is inferred; unassociated inputs are not calculated, not zero.
              </Typography>
              <div className="product-input-entry-grid">
                <TextField
                  size="small"
                  label="Input or component name"
                  value={productInputNameDraft}
                  onChange={(event) => setProductInputNameDraft(event.target.value)}
                  slotProps={{ htmlInput: { maxLength: 100 } }}
                />
                <TextField
                  type="number"
                  size="small"
                  label="Declared quantity"
                  value={productInputQuantityDraft}
                  onChange={(event) => setProductInputQuantityDraft(event.target.value)}
                  slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                />
                <TextField
                  size="small"
                  label="Unit label"
                  placeholder="e.g., kg, pair"
                  value={productInputUnitDraft}
                  onChange={(event) => setProductInputUnitDraft(event.target.value)}
                  slotProps={{ htmlInput: { maxLength: 40 } }}
                />
              </div>
              <div className="product-input-actions">
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={<AddRoundedIcon />}
                  onClick={saveProductInput}
                  disabled={productInputs.length >= MAX_PRODUCT_INPUTS && !editingProductInputId}
                >
                  {editingProductInputId ? 'Save input' : 'Add input'}
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
                        <div><strong>{item.name}</strong><span>{item.quantity} {item.unit}</span></div>
                      </div>
                      <div className="product-input-item-actions">
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
              <Typography className="product-input-summary" aria-live="polite">
                {productInputs.length === 0
                  ? 'No input lines recorded. This worksheet is optional.'
                  : `${unassociatedProductInputs.length} of ${productInputs.length} declared input line(s) are not associated with a selected process. They remain outside the estimate.`}
              </Typography>
            </section>

            {catalog && (
              <form onSubmit={calculate} className="estimator-form">
                <div className="form-grid two-col">
                  <FormControl fullWidth size="small">
                    <InputLabel id="family-label">Process family</InputLabel>
                    <Select
                      labelId="family-label"
                      id="family-filter"
                      value={familyFilter}
                      label="Process family"
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
                    <InputLabel id="geography-label">Source geography</InputLabel>
                    <Select
                      labelId="geography-label"
                      id="geography-filter"
                      value={geographyFilter}
                      label="Source geography"
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
                      label="Process activity"
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
                    <div className="factor-id-note">Source geography is shown as published; it is not inferred from the product’s market.</div>
                    {selectedFactor.input_required_kg_per_reference_unit !== null && (
                      <div className="factor-id-note">
                        Source-reported input required: {numberForDisplay(selectedFactor.input_required_kg_per_reference_unit)} kg per reference unit. Display only; not separately modeled.
                      </div>
                    )}
                  </Paper>
                )}

                <div className="form-grid quantity-grid">
                  <TextField
                    type="number"
                    size="small"
                    label="Quantity in source reference units"
                    value={quantityDraft}
                    onChange={(event) => setQuantityDraft(event.target.value)}
                    disabled={!selectedFactor}
                    slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                    helperText={selectedFactor
                      ? `Enter the number of units of “${selectedFactor.reference_unit}” represented by this activity.`
                      : 'Select an activity to see its exact unit.'}
                  />
                  <Button
                    type="button"
                    variant="outlined"
                    startIcon={<AddRoundedIcon />}
                    onClick={addProcess}
                    disabled={!selectedFactor || !quantityDraft || selectedProcesses.length >= MAX_PROCESS_LINES || selectedFactorAlreadyAdded}
                    className="add-process-button"
                  >
                    Add process
                  </Button>
                </div>

                {selectedProcesses.length > 0 && (
                  <section className="selected-processes" aria-labelledby="selected-processes-heading">
                    <div className="selected-processes-heading">
                      <Typography id="selected-processes-heading" component="h3" className="output-heading">Selected process rows</Typography>
                      <Chip label={`${selectedProcesses.length} / ${MAX_PROCESS_LINES}`} size="small" className="soft-chip" />
                    </div>
                    <Stack spacing={1.2}>
                      {selectedProcesses.map((line, index) => (
                        <div className="selected-process" key={line.key}>
                          <div className="selected-process-copy">
                            <span className="selected-process-index">{String(index + 1).padStart(2, '0')}</span>
                            <div><strong>{line.factor.activity}</strong><span>{line.factor.family_label} · {geographyFor(line.factor)} · {line.factor.reference_unit}</span></div>
                          </div>
                          <TextField
                            type="number"
                            size="small"
                            label="Quantity"
                            value={line.quantity}
                            onChange={(event) => updateSelectedQuantity(line.key, event.target.value)}
                            slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                            className="selected-quantity"
                          />
                          <IconButton aria-label={`Remove ${line.factor.activity}`} onClick={() => removeProcess(line.key)} size="small">
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                          {productInputs.length > 0 && (
                            <FormControl fullWidth size="small" className="selected-process-input-context">
                              <InputLabel id={`process-input-context-label-${index}`}>
                                Input context for {line.factor.activity}
                              </InputLabel>
                              <Select
                                labelId={`process-input-context-label-${index}`}
                                id={`process-input-context-${index}`}
                                value={line.productInputId ?? ''}
                                label={`Input context for ${line.factor.activity}`}
                                onChange={(event) => updateSelectedProductInput(line.key, event.target.value)}
                              >
                                <MenuItem value="">No input association</MenuItem>
                                {productInputs.map((item) => (
                                  <MenuItem key={item.id} value={item.id}>
                                    {item.name} — {item.quantity} {item.unit}
                                  </MenuItem>
                                ))}
                              </Select>
                              <Typography component="span" className="input-context-helper">
                                Context only; the factor quantity above is entered separately.
                              </Typography>
                            </FormControl>
                          )}
                        </div>
                      ))}
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
                    Calculate separate indicators
                  </Button>
                  <span>Up to {MAX_PROCESS_LINES} process rows · no cross-stage total</span>
                </div>
              </form>
            )}
          </Paper>

          <Paper component="section" elevation={0} className="result-card result-panel" aria-labelledby="results-heading">
            <div className="result-card-top">
              <div>
                <div className="step-label">02 <span aria-hidden="true">·</span> SEPARATE INDICATORS</div>
                <Typography id="results-heading" component="h2" variant="h5" className="card-title">Process results.</Typography>
              </div>
              {result && <Chip label="Calculated" size="small" className="calculated-chip" />}
            </div>

            {!result && !calculating && (
              <div className="empty-result process-empty">
                <div className="empty-illustration" aria-hidden="true"><ScienceOutlinedIcon /></div>
                <Typography component="h3" className="empty-title">Choose the source activity and its quantity.</Typography>
                <Typography className="empty-copy">
                  The result will show all 16 impact indicators for each selected process row, with the source factor, reference unit, geography, and attribution alongside it.
                </Typography>
                <div className="result-scope-note"><InfoOutlinedIcon fontSize="small" /> Selected process rows stay separate; no whole-product total is calculated.</div>
              </div>
            )}

            {calculating && (
              <div className="catalog-loading calculation-loading" aria-busy="true"><CircularProgress size={24} aria-label="Calculating separate process indicators" /></div>
            )}

            {result && (
              <div className="results-output">
                <div className="result-intro">
                  <Typography className="result-explanation">{result.scope}</Typography>
                  <Button size="small" startIcon={<FileDownloadOutlinedIcon />} onClick={exportResults}>
                    Download CSV
                  </Button>
                </div>
                {unassociatedProductInputs.length > 0 && (
                  <Typography className="unassociated-input-note">
                    {unassociatedProductInputs.length} declared input line(s) are not associated with these results and are not included; no zero-impact value is assigned.
                  </Typography>
                )}
                <Stack spacing={2}>
                  {result.results.map((line, index) => {
                    const selectedProcess = selectedProcesses.find((item) => item.factor.id === line.factor_id);
                    const productInput = selectedProcess?.productInputId
                      ? productInputsById.get(selectedProcess.productInputId) ?? null
                      : null;
                    return (
                      <ProcessResult
                        line={line}
                        index={index}
                        productInput={productInput}
                        key={`${index}-${line.factor_id}`}
                      />
                    );
                  })}
                </Stack>
                <div className="result-attribution">
                  <strong>Source attribution · CC BY-SA 4.0</strong>
                  <p>{result.attribution_text}</p>
                  <p>Calculation transformation: each published factor was scaled by the entered reference-unit quantity. The adapted result is available under <a href={result.license_url} target="_blank" rel="noreferrer">{result.result_license} <OpenInNewOutlinedIcon fontSize="inherit" /></a>.</p>
                  <p><strong>Background-data note:</strong> {result.background_database_note}</p>
                  <a href={result.source_url} target="_blank" rel="noreferrer">Open pinned source release <OpenInNewOutlinedIcon fontSize="inherit" /></a>
                </div>
              </div>
            )}
          </Paper>
        </div>

        <footer className="app-footer">
          <span>Environmental Impact Analyzer</span>
          <nav className="app-footer-links" aria-label="Legal and source links">
            <a href="/legal/privacy.html">Privacy</a>
            <a href="/legal/terms.html">Terms</a>
            <a href="/legal/license.html">License</a>
            <button type="button" onClick={() => setSourceDialogOpen(true)}>Source, method & privacy</button>
          </nav>
        </footer>
      </main>

      <SourceDialog open={sourceDialogOpen} onClose={() => setSourceDialogOpen(false)} />
    </div>
  );
}

export default App;
