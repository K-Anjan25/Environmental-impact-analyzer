import { useMemo, useState, type FormEvent } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ForestOutlinedIcon from '@mui/icons-material/ForestOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import {
  assessProduct,
  getCandidateSources,
  previewDescription,
  type AssessmentResult,
  type CandidateDataSource,
  type Category,
  type ExtractionCandidate,
  type Provenance,
  type ProductPayload,
  type ProcessMappingRequirement,
  type ProcessStage,
} from './api';
import { assessmentIsScored } from './assessment';
import { buildLicensingInquiryHref } from './licensing';
import { OrbitGlyph, SurrealScene } from './SurrealScene';

type Stage = 'input' | 'review';
type MaterialRow = { material: string; sharePercent: string; provenance: Provenance };
type ComponentRow = {
  component: string;
  material: string;
  sharePercent: string;
  sourceReference: string;
};
type ProcessEvidenceRow = {
  stage: ProcessStage;
  processDescription: string;
  referenceUnit: string;
  country: string;
  year: string;
  sourceReference: string;
  lossWasteNotes: string;
  wasteTreatment: string;
};
type FormState = {
  name: string;
  category: Category;
  subtype: string;
  description: string;
  materials: MaterialRow[];
  componentBOM: ComponentRow[];
  processEvidence: ProcessEvidenceRow[];
  massG: string;
  massProvenance: Provenance;
  manufacturingCountry: string;
  manufacturingCountryProvenance: Provenance;
  certificationClaims: string;
  certificationClaimsProvenance: Provenance;
};

const INITIAL_FORM: FormState = {
  name: '',
  category: 'apparel',
  subtype: 't_shirt',
  description: '',
  materials: [{ material: '', sharePercent: '', provenance: 'user_provided' }],
  componentBOM: [],
  processEvidence: [],
  massG: '',
  massProvenance: 'user_provided',
  manufacturingCountry: '',
  manufacturingCountryProvenance: 'user_provided',
  certificationClaims: '',
  certificationClaimsProvenance: 'user_provided',
};

const PROCESS_STAGES: Array<{ value: ProcessStage; label: string }> = [
  { value: 'material_production', label: 'Material / component production' },
  { value: 'spinning', label: 'Yarn spinning' },
  { value: 'knitting', label: 'Knitting' },
  { value: 'weaving', label: 'Weaving' },
  { value: 'dyeing', label: 'Dyeing' },
  { value: 'printing', label: 'Printing' },
  { value: 'finishing', label: 'Finishing' },
  { value: 'textile_assembly', label: 'Textile / garment assembly' },
  { value: 'shoe_assembly', label: 'Shoe assembly' },
  { value: 'other', label: 'Other process' },
];

const SUBTYPES: Record<Category, Array<{ value: string; label: string }>> = {
  apparel: [
    { value: 't_shirt', label: 'T-shirt' },
    { value: 'shirt', label: 'Shirt' },
    { value: 'jeans', label: 'Jeans' },
    { value: 'sweater', label: 'Sweater' },
    { value: 'jacket', label: 'Jacket' },
    { value: 'dress', label: 'Dress' },
    { value: 'other', label: 'Other apparel' },
  ],
  footwear: [
    { value: 'shoes', label: 'Shoes' },
    { value: 'other', label: 'Other footwear' },
  ],
};

function candidateTitle(candidate: ExtractionCandidate): string {
  switch (candidate.field) {
    case 'material_composition':
      return `${candidate.value.material ?? 'Material'} · ${candidate.value.share_percent ?? '?'}%`;
    case 'mass_g':
      return `Item mass · ${candidate.value.mass_g ?? '?'} g`;
    case 'manufacturing_country':
      return `Made in · ${candidate.value.manufacturing_country ?? 'unknown'}`;
    case 'certification_claim':
      return `Certification wording · ${candidate.value.claim ?? 'claim'}`;
  }
}

function provenanceLabel(provenance: Provenance): string {
  return provenance === 'user_confirmed_extraction' ? 'Confirmed from description' : 'Entered by you';
}

function mappingStatusLabel(status: ProcessMappingRequirement['status']): string {
  const labels: Record<ProcessMappingRequirement['status'], string> = {
    provided: 'Provided · unverified',
    partial: 'Partial',
    missing: 'Missing input',
    not_collected: 'Not collected',
    not_selected: 'Boundary not selected',
    not_in_candidate: 'Not in candidate',
  };
  return labels[status];
}

function App() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [stage, setStage] = useState<Stage>('input');
  const [candidates, setCandidates] = useState<ExtractionCandidate[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<boolean[]>([]);
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [busy, setBusy] = useState<'preview' | 'assessment' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [candidateSources, setCandidateSources] = useState<CandidateDataSource[]>([]);
  const [sourcesLoaded, setSourcesLoaded] = useState(false);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [sourcesError, setSourcesError] = useState('');
  const [sampleLoaded, setSampleLoaded] = useState(false);

  const knownShareTotal = useMemo(
    () => form.materials.reduce((total, row) => total + (Number(row.sharePercent) || 0), 0),
    [form.materials],
  );
  const knownBOMShareTotal = useMemo(
    () => form.componentBOM.reduce((total, row) => total + (Number(row.sharePercent) || 0), 0),
    [form.componentBOM],
  );

  const updateForm = (patch: Partial<FormState>) => {
    setForm((current) => ({ ...current, ...patch }));
    setAssessment(null);
    setError('');
    setStage('input');
  };

  const handleCategoryChange = (category: Category) => {
    updateForm({ category, subtype: SUBTYPES[category][0].value });
    setCandidates([]);
    setNotice('');
  };

  const handleDescriptionChange = (description: string) => {
    updateForm({ description });
    setCandidates([]);
    setNotice('');
  };

  const openMethodology = () => {
    setMethodologyOpen(true);
    if (sourcesLoaded || sourcesLoading) return;
    setSourcesLoading(true);
    setSourcesError('');
    getCandidateSources()
      .then((sources) => {
        setCandidateSources(sources);
        setSourcesLoaded(true);
      })
      .catch((sourceError) => {
        setSourcesError(sourceError instanceof Error ? sourceError.message : 'The source registry is unavailable.');
      })
      .finally(() => setSourcesLoading(false));
  };

  const handlePreview = async () => {
    if (!form.description.trim()) {
      setError('Add a product description before asking for suggestions.');
      return;
    }
    setBusy('preview');
    setError('');
    setNotice('');
    setAssessment(null);
    try {
      const response = await previewDescription(form.category, form.description.trim());
      setCandidates(response.candidates);
      setSelectedCandidates(response.candidates.map(() => true));
      setNotice(response.message);
      if (response.candidates.length > 0) setStage('review');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not read this description. Try entering the details manually.');
    } finally {
      setBusy(null);
    }
  };

  const applySelectedCandidates = () => {
    const chosen = candidates.filter((_, index) => selectedCandidates[index]);
    if (chosen.length === 0) {
      setStage('input');
      setCandidates([]);
      setNotice('No suggestions were applied. You can continue with manual details.');
      return;
    }

    const next: FormState = {
      ...form,
      materials: form.materials.filter((row) => row.material.trim() && row.sharePercent.trim()),
    };
    const confirmed: Provenance = 'user_confirmed_extraction';

    for (const candidate of chosen) {
      if (candidate.field === 'material_composition') {
        const material = String(candidate.value.material ?? '');
        const sharePercent = String(candidate.value.share_percent ?? '');
        const existing = next.materials.find(
          (row) => row.material.toLowerCase() === material.toLowerCase(),
        );
        if (existing) {
          existing.sharePercent = sharePercent;
          existing.provenance = confirmed;
        } else {
          next.materials.push({ material, sharePercent, provenance: confirmed });
        }
      } else if (candidate.field === 'mass_g') {
        next.massG = String(candidate.value.mass_g ?? '');
        next.massProvenance = confirmed;
      } else if (candidate.field === 'manufacturing_country') {
        next.manufacturingCountry = String(candidate.value.manufacturing_country ?? '');
        next.manufacturingCountryProvenance = confirmed;
      } else if (candidate.field === 'certification_claim') {
        const claim = String(candidate.value.claim ?? '');
        const currentClaims = next.certificationClaims
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
        if (!currentClaims.some((item) => item.toLowerCase() === claim.toLowerCase())) {
          currentClaims.push(claim);
        }
        next.certificationClaims = currentClaims.join(', ');
        next.certificationClaimsProvenance = confirmed;
      }
    }

    if (next.materials.length === 0) {
      next.materials = [{ material: '', sharePercent: '', provenance: 'user_provided' }];
    }
    setForm(next);
    setAssessment(null);
    setStage('input');
    setCandidates([]);
    setNotice(`Applied ${chosen.length} suggestion${chosen.length === 1 ? '' : 's'}. Review each field before calculating.`);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');

    const incompleteRows = form.materials.some(
      (row) => Boolean(row.material.trim()) !== Boolean(row.sharePercent.trim()),
    );
    if (incompleteRows) {
      setError('For each material, enter both its name and percentage—or clear both fields.');
      return;
    }
    if (knownShareTotal > 100.000001) {
      setError('Known material percentages cannot total more than 100%.');
      return;
    }
    const materials = form.materials
      .filter((row) => row.material.trim() && row.sharePercent.trim())
      .map((row) => ({
        material: row.material.trim(),
        share_percent: Number(row.sharePercent),
        provenance: row.provenance,
      }));
    if (materials.some((row) => !Number.isFinite(row.share_percent) || row.share_percent <= 0 || row.share_percent > 100)) {
      setError('Material percentages must be greater than 0 and no more than 100.');
      return;
    }

    const incompleteBOMRow = form.componentBOM.some((row) => {
      const hasAny = Boolean(
        row.component.trim() || row.material.trim() || row.sharePercent.trim() || row.sourceReference.trim(),
      );
      const hasCore = Boolean(row.component.trim() && row.material.trim() && row.sharePercent.trim());
      return hasAny && !hasCore;
    });
    if (incompleteBOMRow) {
      setError('For each component entry, provide its component, material, and share—or clear the row.');
      return;
    }
    if (knownBOMShareTotal > 100.000001) {
      setError('Component material shares cannot total more than 100% of the item.');
      return;
    }
    const componentBOM = form.componentBOM
      .filter((row) => row.component.trim() && row.material.trim() && row.sharePercent.trim())
      .map((row) => ({
        component: row.component.trim(),
        material: row.material.trim(),
        share_percent_of_item: Number(row.sharePercent),
        source_reference: row.sourceReference.trim() || null,
        provenance: 'user_provided' as const,
      }));
    if (componentBOM.some((row) => !Number.isFinite(row.share_percent_of_item) || row.share_percent_of_item <= 0 || row.share_percent_of_item > 100)) {
      setError('Component shares must be greater than 0 and no more than 100%.');
      return;
    }

    const invalidProcessYear = form.processEvidence.some((row) => {
      if (!row.year.trim()) return false;
      const year = Number(row.year);
      return !Number.isInteger(year) || year < 1900 || year > 2100;
    });
    if (invalidProcessYear) {
      setError('Process data years must be whole years between 1900 and 2100.');
      return;
    }
    const processEvidence = form.processEvidence
      .filter((row) =>
        row.processDescription.trim() ||
        row.referenceUnit.trim() ||
        row.country.trim() ||
        row.year.trim() ||
        row.sourceReference.trim() ||
        row.lossWasteNotes.trim() ||
        row.wasteTreatment.trim(),
      )
      .map((row) => ({
        stage: row.stage,
        process_description: row.processDescription.trim() || null,
        reference_unit: row.referenceUnit.trim() || null,
        country: row.country.trim() || null,
        year: row.year.trim() ? Number(row.year) : null,
        source_reference: row.sourceReference.trim() || null,
        loss_waste_notes: row.lossWasteNotes.trim() || null,
        waste_treatment: row.wasteTreatment.trim() || null,
        provenance: 'user_provided' as const,
      }));

    const mass = form.massG.trim() ? Number(form.massG) : null;
    if (mass !== null && (!Number.isFinite(mass) || mass <= 0 || mass > 100_000)) {
      setError('Enter a valid item mass in grams.');
      return;
    }

    const payload: ProductPayload = {
      category: form.category,
      subtype: form.subtype,
      name: form.name.trim(),
      attributes: {
        material_composition: materials,
        mass_g: mass,
        mass_provenance: form.massProvenance,
        manufacturing_country: form.manufacturingCountry.trim() || null,
        manufacturing_country_provenance: form.manufacturingCountryProvenance,
        certification_claims: form.certificationClaims
          .split(',')
          .map((claim) => claim.trim())
          .filter(Boolean),
        certification_claims_provenance: form.certificationClaimsProvenance,
        component_bom: componentBOM,
        process_evidence: processEvidence,
      },
    };

    setBusy('assessment');
    setAssessment(null);
    try {
      const response = await assessProduct(payload);
      setAssessment(response);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Assessment could not be completed. Please retry.');
    } finally {
      setBusy(null);
    }
  };

  const addMaterialRow = () => {
    updateForm({
      materials: [...form.materials, { material: '', sharePercent: '', provenance: 'user_provided' }],
    });
  };

  const updateMaterial = (index: number, patch: Partial<MaterialRow>) => {
    const materials = form.materials.map((row, rowIndex) =>
      rowIndex === index ? { ...row, ...patch, provenance: patch.provenance ?? 'user_provided' } : row,
    );
    updateForm({ materials });
  };

  const addComponentRow = () => {
    updateForm({
      componentBOM: [...form.componentBOM, { component: '', material: '', sharePercent: '', sourceReference: '' }],
    });
  };

  const updateComponentRow = (index: number, patch: Partial<ComponentRow>) => {
    updateForm({
      componentBOM: form.componentBOM.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    });
  };

  const addProcessEvidenceRow = () => {
    updateForm({
      processEvidence: [
        ...form.processEvidence,
        {
          stage: 'material_production',
          processDescription: '',
          referenceUnit: '',
          country: '',
          year: '',
          sourceReference: '',
          lossWasteNotes: '',
          wasteTreatment: '',
        },
      ],
    });
  };

  const updateProcessEvidenceRow = (index: number, patch: Partial<ProcessEvidenceRow>) => {
    updateForm({
      processEvidence: form.processEvidence.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    });
  };

  const loadExample = () => {
    updateForm({
      ...form,
      name: form.name || 'Everyday T-shirt',
      description: '100% organic cotton T-shirt, 180 g. Made in India. GOTS certified.',
    });
    setSampleLoaded(true);
    setNotice('Example text added. Use “Suggest details” to review the detected phrases.');
  };

  const startOver = () => {
    setForm(INITIAL_FORM);
    setAssessment(null);
    setCandidates([]);
    setSelectedCandidates([]);
    setStage('input');
    setError('');
    setNotice('');
    setSampleLoaded(false);
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Environmental Impact Analyzer home">
          <span className="brand-mark"><ForestOutlinedIcon fontSize="small" /></span>
          <span className="brand-name">impact<span aria-hidden="true"> / </span>analyzer</span>
        </a>
        <div className="header-right">
          <span className="prototype-label"><span className="status-dot" /> Prototype</span>
          <Button
            variant="text"
            startIcon={<InfoOutlinedIcon />}
onClick={openMethodology}
            className="method-button"
          >
            How it works
          </Button>
        </div>
      </header>

      <main id="top" className="main-content">
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> PRODUCT IMPACT, WITH CONTEXT</div>
            <Typography id="hero-title" component="h1" className="hero-title">
              Look beyond the <span className="hero-title-accent">label.</span>
            </Typography>
            <Typography className="hero-subtitle">
              Understand what’s known, what’s missing, and what it would take to make a fair comparison.
            </Typography>
            <div className="hero-note">
              <span className="hero-note-icon"><ScienceOutlinedIcon /></span>
              <span><strong>Evidence before estimates.</strong> No footprint score is invented when data is missing.</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="art-caption-top" aria-hidden="true"><span /> A dreamlike study of materials</div>
            <SurrealScene />
            <div className="art-caption-bottom">Original vector illustration · not a footprint result</div>
          </div>
        </section>

        <div className="workspace-grid">
          <Paper component="section" elevation={0} className="form-card" aria-labelledby="form-heading">
            <div className="card-heading-row">
              <div>
                <div className="step-label">01 <span aria-hidden="true">·</span> PRODUCT DETAILS</div>
                <Typography id="form-heading" component="h2" variant="h5" className="card-title">
                  Start with what you know.
                </Typography>
                <Typography className="card-subtitle">
                  Unknown details are okay. They will never be treated as zero impact.
                </Typography>
              </div>
              <div className="card-number" aria-hidden="true">01</div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-grid two-col">
                <FormControl fullWidth size="small">
                  <InputLabel id="category-label">Category</InputLabel>
                  <Select
                    labelId="category-label"
                    id="category"
                    value={form.category}
                    label="Category"
                    onChange={(event) => handleCategoryChange(event.target.value as Category)}
                  >
                    <MenuItem value="apparel">Apparel</MenuItem>
                    <MenuItem value="footwear">Footwear</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel id="subtype-label">Item type</InputLabel>
                  <Select
                    labelId="subtype-label"
                    id="subtype"
                    value={form.subtype}
                    label="Item type"
                    onChange={(event) => updateForm({ subtype: event.target.value })}
                  >
                    {SUBTYPES[form.category].map((item) => (
                      <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              <TextField
                label="Product name"
                value={form.name}
                onChange={(event) => updateForm({ name: event.target.value })}
                placeholder="e.g. Everyday T-shirt"
                required
                fullWidth
                size="small"
                slotProps={{ htmlInput: { maxLength: 120 } }}
              />

              <div className="field-section">
                <div className="field-section-heading">
                  <div>
                    <Typography component="h3" className="field-title">Material composition</Typography>
                    <Typography className="field-help">Enter known percentages; partial composition is okay.</Typography>
                  </div>
                  <Tooltip title="These are product details, not verified environmental results.">
                    <InfoOutlinedIcon className="muted-icon" fontSize="small" />
                  </Tooltip>
                </div>
                <Stack spacing={1.1}>
                  {form.materials.map((row, index) => (
                    <div className="material-row" key={`material-${index}`}>
                      <TextField
                        label={index === 0 ? 'Material' : `Material ${index + 1}`}
                        value={row.material}
                        onChange={(event) => updateMaterial(index, { material: event.target.value })}
                        size="small"
                        fullWidth
                        placeholder="Cotton"
                        slotProps={{ htmlInput: { maxLength: 80 } }}
                      />
                      <TextField
                        label="Share %"
                        type="number"
                        value={row.sharePercent}
                        onChange={(event) => updateMaterial(index, { sharePercent: event.target.value })}
                        size="small"
                        slotProps={{ htmlInput: { min: 0, max: 100, step: 0.1 } }}
                        className="share-field"
                      />
                      <Tooltip title="Remove material">
                        <span>
                          <IconButton
                            aria-label={`Remove material ${index + 1}`}
                            onClick={() => updateForm({ materials: form.materials.filter((_, i) => i !== index) })}
                            disabled={form.materials.length === 1}
                            size="small"
                            className="remove-material"
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </div>
                  ))}
                </Stack>
                <div className="materials-footer">
                  <Button size="small" startIcon={<AddRoundedIcon />} onClick={addMaterialRow} type="button" disabled={form.materials.length >= 20}>
                    Add material{form.materials.length >= 20 ? ' (max 20)' : ''}
                  </Button>
                  <span className={knownShareTotal > 100.000001 ? 'share-total invalid' : 'share-total'}>
                    Known total: {knownShareTotal.toLocaleString(undefined, { maximumFractionDigits: 1 })}%
                  </span>
                </div>
              </div>

              <div className="form-grid two-col">
                <TextField
                  label="Item mass (g)"
                  type="number"
                  value={form.massG}
                  onChange={(event) => updateForm({ massG: event.target.value, massProvenance: 'user_provided' })}
                  size="small"
                  fullWidth
                  placeholder="e.g. 180"
                  slotProps={{ htmlInput: { min: 0, max: 100000, step: 1 } }}
                  helperText="Optional · ‘I don’t know’ is fine"
                />
                <TextField
                  label="Made in (country)"
                  value={form.manufacturingCountry}
                  onChange={(event) => updateForm({ manufacturingCountry: event.target.value, manufacturingCountryProvenance: 'user_provided' })}
                  size="small"
                  fullWidth
                  placeholder="e.g. India"
                  slotProps={{ htmlInput: { maxLength: 100 } }}
                  helperText="Optional · not independently verified"
                />
              </div>

              <details className="process-input-details">
                <summary>Optional: component BOM and supplier process details</summary>
                <div className="process-input-content">
                  <Typography className="field-help">
                    These unverified entries are sent to this prototype’s API for a no-score readiness response; the app does not store assessment records or contact a factor provider. Evidence references are text only and are never fetched. Hosting log/retention behavior has not been reviewed, so do not enter confidential supplier details.
                  </Typography>

                  <div className="field-section">
                    <div className="field-section-heading">
                      <div>
                        <Typography component="h3" className="field-title">Component BOM</Typography>
                        <Typography className="field-help">One row per component/material; share is a percent of total item mass. Partial entries are okay.</Typography>
                      </div>
                    </div>
                    <Stack spacing={1}>
                      {form.componentBOM.map((row, index) => (
                        <div className="component-input-card" key={`component-${index}`}>
                          <div className="bom-main-row">
                            <TextField
                              label="Component"
                              value={row.component}
                              onChange={(event) => updateComponentRow(index, { component: event.target.value })}
                              size="small"
                              placeholder="Main fabric"
                              slotProps={{ htmlInput: { maxLength: 80 } }}
                            />
                            <TextField
                              label="Material"
                              value={row.material}
                              onChange={(event) => updateComponentRow(index, { material: event.target.value })}
                              size="small"
                              placeholder="Cotton"
                              slotProps={{ htmlInput: { maxLength: 80 } }}
                            />
                            <TextField
                              label="Share of item %"
                              type="number"
                              value={row.sharePercent}
                              onChange={(event) => updateComponentRow(index, { sharePercent: event.target.value })}
                              size="small"
                              slotProps={{ htmlInput: { min: 0, max: 100, step: 0.1 } }}
                            />
                            <Tooltip title="Remove component row">
                              <IconButton
                                type="button"
                                aria-label={`Remove component row ${index + 1}`}
                                onClick={() => updateForm({ componentBOM: form.componentBOM.filter((_, i) => i !== index) })}
                                size="small"
                                className="remove-material"
                              >
                                <DeleteOutlineRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </div>
                          <TextField
                            label="Specification/evidence reference (optional)"
                            value={row.sourceReference}
                            onChange={(event) => updateComponentRow(index, { sourceReference: event.target.value })}
                            size="small"
                            fullWidth
                            placeholder="Supplier BOM or product specification"
                            slotProps={{ htmlInput: { maxLength: 500 } }}
                          />
                        </div>
                      ))}
                    </Stack>
                    <div className="materials-footer">
                      <Button size="small" type="button" startIcon={<AddRoundedIcon />} onClick={addComponentRow} disabled={form.componentBOM.length >= 100}>
                        Add BOM row{form.componentBOM.length >= 100 ? ' (max 100)' : ''}
                      </Button>
                      <span className={knownBOMShareTotal > 100.000001 ? 'share-total invalid' : 'share-total'}>
                        Reported BOM total: {knownBOMShareTotal.toLocaleString(undefined, { maximumFractionDigits: 1 })}%
                      </span>
                    </div>
                  </div>

                  <Divider className="form-divider" />

                  <div className="field-section">
                    <div className="field-section-heading">
                      <div>
                        <Typography component="h3" className="field-title">Supplier process evidence</Typography>
                        <Typography className="field-help">Add a stage only when you know a process, output/reference unit, place/year, source reference, or supplier-reported loss/waste detail. Blank stages stay unknown.</Typography>
                      </div>
                    </div>
                    <Stack spacing={1}>
                      {form.processEvidence.map((row, index) => (
                        <div className="process-evidence-card" key={`process-evidence-${index}`}>
                          <div className="process-main-row">
                            <FormControl fullWidth size="small">
                              <InputLabel id={`process-stage-${index}`}>Stage</InputLabel>
                              <Select
                                labelId={`process-stage-${index}`}
                                id={`process-stage-value-${index}`}
                                value={row.stage}
                                label="Stage"
                                onChange={(event) => updateProcessEvidenceRow(index, { stage: event.target.value as ProcessStage })}
                              >
                                {PROCESS_STAGES.map((stage) => (
                                  <MenuItem key={stage.value} value={stage.value}>{stage.label}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <TextField
                              label="Process / technology (optional)"
                              value={row.processDescription}
                              onChange={(event) => updateProcessEvidenceRow(index, { processDescription: event.target.value })}
                              size="small"
                              placeholder="e.g. ring-spun yarn"
                              slotProps={{ htmlInput: { maxLength: 160 } }}
                            />
                          </div>
                          <div className="process-unit-row">
                            <TextField
                              label="Supplier-declared output / reference unit (optional)"
                              value={row.referenceUnit}
                              onChange={(event) => updateProcessEvidenceRow(index, { referenceUnit: event.target.value })}
                              size="small"
                              fullWidth
                              placeholder="e.g. 1 kg yarn or 1 pair"
                              helperText="Text only; compare against the exact factor basis. No conversion is performed."
                              slotProps={{ htmlInput: { maxLength: 120 } }}
                            />
                          </div>
                          <div className="process-meta-row">
                            <TextField
                              label="Country / region"
                              value={row.country}
                              onChange={(event) => updateProcessEvidenceRow(index, { country: event.target.value })}
                              size="small"
                              slotProps={{ htmlInput: { maxLength: 100 } }}
                            />
                            <TextField
                              label="Data year"
                              type="number"
                              value={row.year}
                              onChange={(event) => updateProcessEvidenceRow(index, { year: event.target.value })}
                              size="small"
                              slotProps={{ htmlInput: { min: 1900, max: 2100, step: 1 } }}
                            />
                            <TextField
                              label="Evidence reference"
                              value={row.sourceReference}
                              onChange={(event) => updateProcessEvidenceRow(index, { sourceReference: event.target.value })}
                              size="small"
                              placeholder="Supplier record / spec"
                              slotProps={{ htmlInput: { maxLength: 500 } }}
                            />
                            <Tooltip title="Remove process evidence">
                              <IconButton
                                type="button"
                                aria-label={`Remove process evidence ${index + 1}`}
                                onClick={() => updateForm({ processEvidence: form.processEvidence.filter((_, i) => i !== index) })}
                                size="small"
                                className="remove-material"
                              >
                                <DeleteOutlineRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </div>
                          <div className="process-loss-row">
                            <TextField
                              label="Process input / loss note (optional)"
                              value={row.lossWasteNotes}
                              onChange={(event) => updateProcessEvidenceRow(index, { lossWasteNotes: event.target.value })}
                              size="small"
                              fullWidth
                              multiline
                              minRows={2}
                              helperText="Supplier-reported text only; not scaled against a factor."
                              slotProps={{ htmlInput: { maxLength: 300 } }}
                            />
                            <TextField
                              label="Waste-treatment note (optional)"
                              value={row.wasteTreatment}
                              onChange={(event) => updateProcessEvidenceRow(index, { wasteTreatment: event.target.value })}
                              size="small"
                              fullWidth
                              multiline
                              minRows={2}
                              helperText="Recorded as evidence; the treatment route is not verified."
                              slotProps={{ htmlInput: { maxLength: 160 } }}
                            />
                          </div>
                        </div>
                      ))}
                    </Stack>
                    <Button size="small" type="button" startIcon={<AddRoundedIcon />} onClick={addProcessEvidenceRow} disabled={form.processEvidence.length >= 50}>
                      Add process evidence{form.processEvidence.length >= 50 ? ' (max 50)' : ''}
                    </Button>
                  </div>
                </div>
              </details>

              <TextField
                label="Certification wording (optional)"
                value={form.certificationClaims}
                onChange={(event) => updateForm({ certificationClaims: event.target.value, certificationClaimsProvenance: 'user_provided' })}
                placeholder="e.g. GOTS, OEKO-TEX"
                size="small"
                fullWidth
                helperText="Record the wording only; this prototype cannot verify certifications."
              />

              <Divider className="form-divider" />

              <div className="description-heading">
                <div>
                  <Typography component="h3" className="field-title">Product description</Typography>
                  <Typography className="field-help">We’ll suggest only a few recognizable details.</Typography>
                </div>
                {!sampleLoaded && (
                  <Button size="small" variant="text" onClick={loadExample} type="button" className="example-button">
                    Try an example
                  </Button>
                )}
              </div>
              <TextField
                value={form.description}
                onChange={(event) => handleDescriptionChange(event.target.value)}
                placeholder="Paste a product description or enter any details you have…"
                multiline
                minRows={3}
                maxRows={6}
                fullWidth
                size="small"
                slotProps={{ htmlInput: { maxLength: 5000, 'aria-label': 'Product description' } }}
                helperText={`${form.description.length}/5,000 characters · sent to the suggestion API only when requested; hosting log/retention behavior is not reviewed`}
              />
              <Button
                type="button"
                variant="outlined"
                startIcon={<AutoAwesomeOutlinedIcon />}
                onClick={handlePreview}
                disabled={busy !== null || !form.description.trim()}
                className="suggest-button"
              >
                {busy === 'preview' ? 'Checking phrases…' : 'Suggest details from description'}
              </Button>

              {stage === 'review' && candidates.length > 0 && (
                <div className="review-box" aria-labelledby="review-heading">
                  <div className="review-heading-row">
                    <div>
                      <div className="step-label">02 <span aria-hidden="true">·</span> REVIEW SUGGESTIONS</div>
                      <Typography id="review-heading" component="h3" className="field-title">Check each phrase.</Typography>
                    </div>
                    <Chip label="Not verified" size="small" className="unverified-chip" />
                  </div>
                  <Typography className="field-help review-intro">
                    These are rule-based text matches, not AI verification. Select only details you want to use.
                  </Typography>
                  <Stack spacing={0.4} className="candidate-list">
                    {candidates.map((candidate, index) => (
                      <div className="candidate-item" key={`${candidate.field}-${candidate.evidence_span}-${index}`}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={selectedCandidates[index] ?? false}
                              onChange={(event) => {
                                setSelectedCandidates((current) => current.map((value, i) => i === index ? event.target.checked : value));
                              }}
                              size="small"
                            />
                          }
                          label={
                            <span className="candidate-label">
                              <strong>{candidateTitle(candidate)}</strong>
                              <span className="evidence-span">“{candidate.evidence_span}”</span>
                              <span className="candidate-note">{candidate.note}</span>
                            </span>
                          }
                        />
                      </div>
                    ))}
                  </Stack>
                  <div className="review-actions">
                    <Button onClick={() => { setCandidates([]); setStage('input'); }} type="button" color="inherit">
                      Dismiss
                    </Button>
                    <Button onClick={applySelectedCandidates} type="button" variant="contained" color="primary" startIcon={<CheckCircleOutlineRoundedIcon />}>
                      Apply selected
                    </Button>
                  </div>
                </div>
              )}

              {notice && <Alert severity="info" className="inline-alert">{notice}</Alert>}
              {error && <Alert severity="error" className="inline-alert" role="alert">{error}</Alert>}

              <div className="form-footer">
                <div className="privacy-note">
                  <InfoOutlinedIcon fontSize="small" />
                  <span>Descriptions are sent to the suggestion API on request; app-level assessment storage is not enabled. Hosting log/retention behavior is unreviewed—avoid confidential data.</span>
                </div>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={busy !== null || !form.name.trim() || knownShareTotal > 100.000001}
                  endIcon={<span aria-hidden="true">↗</span>}
                  className="submit-button"
                >
                  {busy === 'assessment' ? 'Reviewing details…' : 'Review assessment'}
                </Button>
              </div>
              <Typography className="fine-print">
                This prototype does not calculate a product footprint. It will not turn missing data into a zero or a score.
              </Typography>
            </form>
          </Paper>

          <Paper component="section" elevation={0} className="result-card" aria-labelledby="result-heading" aria-live="polite">
            <div className="result-card-top">
              <div>
                <div className="step-label">02 <span aria-hidden="true">·</span> ENVIRONMENTAL ASSESSMENT</div>
                <Typography id="result-heading" component="h2" variant="h5" className="card-title">What the evidence says.</Typography>
              </div>
              {assessment && <Chip label="No score" size="small" className="result-status-chip" />}
            </div>

            {assessment ? (
              <AssessmentPanel result={assessment} onStartOver={startOver} />
            ) : (
              <EmptyAssessment hasInput={Boolean(form.name || form.description || knownShareTotal)} />
            )}

            <div className="method-note">
              <span className="method-note-icon"><InfoOutlinedIcon fontSize="small" /></span>
              <span><strong>Why no score?</strong> No reviewed, licensed impact dataset is connected to this prototype.</span>
              <Button onClick={openMethodology} size="small" aria-label="Read the methodology explanation">Learn more</Button>
            </div>
          </Paper>
        </div>

        <footer className="site-footer">
          <span>Environmental Impact Analyzer <span className="footer-dot" aria-hidden="true">·</span> Evidence before estimates</span>
          <span>Prototype v0.1 <span className="footer-dot" aria-hidden="true">·</span> No app-level assessment storage</span>
        </footer>
      </main>

      <Dialog open={methodologyOpen} onClose={() => setMethodologyOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">How this prototype works</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} className="method-dialog-copy">
            <Alert severity="warning" icon={<WarningAmberRoundedIcon />}>
              <strong>No environmental footprint is calculated.</strong> No consumer-score method is approved; any future index requires reviewed data and LCA methods, independent validation, and legal/claims approval.
            </Alert>
            <div>
              <Typography component="h3" className="dialog-section-title">Text suggestions</Typography>
              <Typography variant="body2">The current parser uses simple, deterministic patterns to find phrases such as material percentages, item mass, a “made in” country, or certification wording. Suggestions are editable and require your confirmation. They are not verified facts.</Typography>
            </div>
            <div>
              <Typography component="h3" className="dialog-section-title">What a future score would need</Typography>
              <Typography variant="body2">A reviewed life-cycle boundary, traceable factors, compatible climate and water indicators, a representative category reference set, and an expert-reviewed method. Missing data must never be treated as zero.</Typography>
              <Typography variant="body2" className="pefcr-limit">The <a href="https://www.carbonfact.com/hubfs/A&FW_PEFCR_v3.1.pdf" target="_blank" rel="noreferrer">Apparel &amp; Footwear PEFCR v3.1 report</a> defines a full-life-cycle EU method and states validity through 31 December 2027. The European Commission’s <a href="https://green-forum.ec.europa.eu/news/transitional-guidance-limited-availability-ef-compliant-datasets-2026-07-14_en" target="_blank" rel="noreferrer">July 2026 transition guidance</a> says existing PEFCRs remain valid until EF 4.0 is implemented; confirm current rules and EF database rights before compliance-related use.</Typography>
              <Typography variant="body2" className="pefcr-limit">The PEFCR report does not allow a single score for business-to-consumer communication or comparisons against its representative products. This prototype is not PEFCR-compliant; any separate consumer score needs independent expert and legal review.</Typography>
            </div>
            <div className="source-registry-block">
              <div className="source-heading-row">
                <div>
                  <Typography component="h3" className="dialog-section-title">Candidate data source</Typography>
                  <Typography variant="body2">Listed for transparency only. It is not loaded into the assessment.</Typography>
                </div>
                <Chip label="Not active" size="small" className="source-pending-chip" />
              </div>
              {sourcesLoading && <Typography variant="body2" className="source-loading">Loading source register…</Typography>}
              {sourcesError && <Alert severity="info" className="source-error">{sourcesError}</Alert>}
              {candidateSources.map((source) => (
                <div className="source-candidate" key={source.id}>
                  <strong className="source-name">{source.name}</strong>
                  <span className="source-metadata">{source.publisher} · v{source.version} · released {source.release_date}</span>
                  <Typography variant="body2">{source.scope_summary}</Typography>
                  <span className="source-indicators"><strong>Indicators listed:</strong> {source.impact_indicators.join(' · ')}</span>
                  <div className="source-links">
                    <a href={source.source_url} target="_blank" rel="noreferrer">Dataset record ↗</a>
                    <a href={source.repository_url} target="_blank" rel="noreferrer">Pinned release ↗</a>
                    <a href={source.changelog_url} target="_blank" rel="noreferrer">Current changelog ↗</a>
                    <a href={source.license_url} target="_blank" rel="noreferrer">{source.license_name} ↗</a>
                    <a href={source.license_terms_url} target="_blank" rel="noreferrer">Current license guidance ↗</a>
                  </div>
                  <div className="source-terms">
                    <Typography component="h4" className="dialog-section-title">Potential open-license path — not yet cleared</Typography>
                    <Typography variant="body2">{source.use_terms_summary}</Typography>
                    <div className="source-attribution">
                      <strong>Attribution to display if adopted:</strong> {source.attribution_text}
                    </div>
                    <div className="source-links" aria-label="Attribution links">
                      {source.attribution_links.map((link) => (
                        <a href={link.url} key={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>
                      ))}
                    </div>
                    <Typography variant="body2"><strong>Background database:</strong> {source.background_database_note}</Typography>
                    <Typography variant="body2">
                      <strong>Alternative:</strong> The publisher lists separate commercial terms for organizations unable to meet the open-license conditions.{' '}
                      <a href={`mailto:${source.commercial_license_contact}`}>{source.commercial_license_contact}</a>
                    </Typography>
                    <a className="licensing-inquiry-link" href={buildLicensingInquiryHref(source)}>
                      Prepare version-specific licensing questions ↗
                    </a>
                  </div>
                  <div className="source-review-gates">
                    <Typography component="h4" className="dialog-section-title">Remaining activation gates</Typography>
                    <ul className="review-gate-list">
                      {source.review_gates.map((gate) => (
                        <li key={gate.id}>
                          <span className="review-gate-status">{gate.status}</span>
                          <div><strong>{gate.title}</strong><span>{gate.details}</span></div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <ul className="source-limitations">
                    {source.limitations.slice(0, 3).map((limitation) => <li key={limitation}>{limitation}</li>)}
                  </ul>
                  <span className="source-review-state">
                    License review: {source.license_review_status} · method review: {source.method_review_status} · scoring use: disabled
                  </span>
                </div>
              ))}
            </div>
            <div>
              <Typography component="h3" className="dialog-section-title">Privacy</Typography>
              <Typography variant="body2">This prototype has no app-level assessment storage. Product details, process notes, evidence references, and descriptions are sent to the app’s API when needed for review; evidence references are not fetched. Hosting log/retention behavior has not been reviewed, so do not enter personal, confidential, or sensitive supplier information.</Typography>
            </div>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMethodologyOpen(false)} variant="contained">Got it</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

function EmptyAssessment({ hasInput }: { hasInput: boolean }) {
  return (
    <div className="empty-result">
      <div className="empty-illustration" aria-hidden="true">
        <OrbitGlyph />
      </div>
      <Chip
        icon={<InfoOutlinedIcon />}
        label={hasInput ? 'Details are not environmental results' : 'Waiting for product details'}
        size="small"
        className="soft-chip"
      />
      <Typography component="h3" className="empty-title">
        {hasInput ? 'Facts first. Footprint later.' : 'Your assessment starts here.'}
      </Typography>
      <Typography className="empty-copy">
        {hasInput
          ? 'Your product details can be reviewed, but this prototype has no approved factor library to turn them into an impact estimate.'
          : 'Enter a few product details to see what can be captured—and what still needs credible evidence.'}
      </Typography>
      <div className="indicator-preview-grid">
        <div className="indicator-preview">
          <span className="indicator-icon climate-dot" />
          <div><strong>Climate</strong><span>Awaiting reviewed data</span></div>
          <span className="preview-dash" aria-hidden="true">—</span>
        </div>
        <div className="indicator-preview">
          <span className="indicator-icon water-dot" />
          <div><strong>Water</strong><span>Awaiting reviewed data</span></div>
          <span className="preview-dash" aria-hidden="true">—</span>
        </div>
      </div>
      <div className="empty-footnote"><InfoOutlinedIcon fontSize="small" /> “Not available” is not the same as zero impact.</div>
    </div>
  );
}

function AssessmentPanel({ result, onStartOver }: { result: AssessmentResult; onStartOver: () => void }) {
  const scored = assessmentIsScored(result);
  return (
    <div className="assessment-output">
      <div className="result-summary">
        <div className="result-summary-icon"><WarningAmberRoundedIcon /></div>
        <div>
          <div className="result-overline">{scored ? 'SCREENING SCORE' : 'NO SCORE AVAILABLE'}</div>
          <Typography component="h3" className="result-headline">
            {scored ? 'Assessment ready' : 'Score withheld'}
          </Typography>
          <Typography className="result-explanation">{result.score_explanation}</Typography>
        </div>
      </div>

      <div className="assessment-meta">
        <div><span>Product</span><strong>{result.product_name}</strong></div>
        <div><span>Method version</span><strong>{result.methodology_version}</strong></div>
        <div><span>Functional unit</span><strong>{result.functional_unit}</strong></div>
        <div><span>Boundary</span><strong>{result.boundary}</strong></div>
      </div>

      <div className="output-section">
        <div className="output-section-heading">
          <Typography component="h4" className="output-heading">Impact indicators</Typography>
          <span className="not-calculated-label">NOT CALCULATED</span>
        </div>
        <div className="indicator-result-grid">
          {result.indicators.map((indicator) => (
            <div className="indicator-result" key={indicator.name}>
              <div className={`indicator-icon ${indicator.name === 'climate' ? 'climate-dot' : 'water-dot'}`} />
              <div className="indicator-result-label"><strong>{indicator.label}</strong><span>{indicator.unit}</span></div>
              <div className="indicator-result-value" aria-hidden="true">—</div>
              <p>{indicator.reason}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="output-section">
        <div className="output-section-heading">
          <Typography component="h4" className="output-heading">Product-to-process mapping</Typography>
          <Chip label="Not ready" size="small" className="source-pending-chip" />
        </div>
        <span className="mapping-source-version">Candidate source release v{result.process_mapping_readiness.source_version}</span>
        <a className="mapping-source-link" href={result.process_mapping_readiness.source_url} target="_blank" rel="noreferrer">
          Open pinned process-family table ↗
        </a>
        <Typography className="mapping-readiness-note">{result.process_mapping_readiness.note}</Typography>
        <details className="mapping-details">
          <summary>Review {result.process_mapping_readiness.requirements.length} mapping requirements</summary>
          <div className="mapping-requirements">
            {result.process_mapping_readiness.requirements.map((requirement) => (
              <div className="mapping-requirement" key={requirement.id}>
                <span className="mapping-requirement-status">{mappingStatusLabel(requirement.status)}</span>
                <div>
                  <strong>{requirement.label}</strong>
                  <p>{requirement.details}</p>
                  <span>{requirement.next_step}</span>
                </div>
              </div>
            ))}
          </div>
        </details>
      </div>

      <div className="output-section">
        <div className="output-section-heading">
          <Typography component="h4" className="output-heading">What we captured</Typography>
          <Chip label={`${result.known_facts.length} facts`} size="small" className="soft-chip" />
        </div>
        {result.known_facts.length > 0 ? (
          <div className="known-facts-list">
            {result.known_facts.map((fact, index) => (
              <div className="known-fact" key={`${fact.label}-${index}`}>
                <span className="fact-info-icon" aria-hidden="true"><InfoOutlinedIcon fontSize="small" /></span>
                <div><strong>{fact.label}</strong><span>{fact.value}</span></div>
                <Chip label={provenanceLabel(fact.provenance)} size="small" variant="outlined" className="provenance-chip" />
              </div>
            ))}
          </div>
        ) : (
          <Typography className="empty-facts">No product attributes were confirmed. You can add details on the left.</Typography>
        )}
      </div>

      {result.data_gaps.length > 0 && (
        <div className="output-section">
          <div className="output-section-heading">
            <Typography component="h4" className="output-heading">Details still unknown</Typography>
          </div>
          <div className="gap-list">
            {result.data_gaps.map((gap) => <Chip key={gap} label={gap} size="small" className="gap-chip" />)}
          </div>
        </div>
      )}

      <div className="output-warning">
        <WarningAmberRoundedIcon fontSize="small" />
        <span>{result.limitations[0]}</span>
      </div>

      <div className="output-actions">
        <Button onClick={onStartOver} variant="outlined">Start another assessment</Button>
        <span>Reference: {result.assessment_id.slice(0, 8)}</span>
      </div>
    </div>
  );
}

export default App;
