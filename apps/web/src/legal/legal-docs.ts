// Legal documents, built from the repository's own files at deploy time.
// The Dockerfile copies the root LICENSE, PRIVACY.md and TERMS.md, and the dataset LICENSE and SOURCE.md,
// so these relative paths resolve both in local builds and in the container build.
import terms from '../../../../TERMS.md?raw';
import privacy from '../../../../PRIVACY.md?raw';
import softwareLicense from '../../../../LICENSE?raw';
import datasetLicense from '../../../../services/api/data/carbonfact-v1.1.0/LICENSE?raw';
import sourceRecord from '../../../../services/api/data/carbonfact-v1.1.0/SOURCE.md?raw';

export type LegalDocId = 'terms' | 'privacy' | 'software-license' | 'dataset-license' | 'source-record';

export const LEGAL_DOCS: Record<LegalDocId, { title: string; body: string }> = {
  terms: { title: 'Terms of use', body: terms },
  privacy: { title: 'Privacy policy', body: privacy },
  'software-license': { title: 'Software license', body: softwareLicense },
  'dataset-license': { title: 'Dataset license', body: datasetLicense },
  'source-record': { title: 'Carbonfact source record', body: sourceRecord },
};

export const LEGAL_DOC_IDS = Object.keys(LEGAL_DOCS) as LegalDocId[];

export function isLegalDocId(value: string): value is LegalDocId {
  return (LEGAL_DOC_IDS as string[]).includes(value);
}
