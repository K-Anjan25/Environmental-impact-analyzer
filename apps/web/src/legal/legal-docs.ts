// Legal documents, built from the repository's own files at deploy time.
// The Dockerfile copies the root LICENSE, PRIVACY.md and TERMS.md, and the dataset SOURCE.md,
// so these relative paths resolve both in local builds and in the container build.
import terms from '../../../../TERMS.md?raw';
import privacy from '../../../../PRIVACY.md?raw';
import softwareLicense from '../../../../LICENSE?raw';

export type LegalDocId = 'terms' | 'privacy' | 'website-license';

export const LEGAL_DOCS: Record<LegalDocId, { title: string; body: string }> = {
  terms: { title: 'Terms of use', body: terms },
  privacy: { title: 'Privacy policy', body: privacy },
  'website-license': { title: 'Website license', body: softwareLicense },
};

export const LEGAL_DOC_IDS = Object.keys(LEGAL_DOCS) as LegalDocId[];

export function isLegalDocId(value: string): value is LegalDocId {
  return (LEGAL_DOC_IDS as string[]).includes(value);
}
