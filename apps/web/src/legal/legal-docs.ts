// Legal documents, built from the repository's own files at deploy time.
// The Dockerfile copies the root PRIVACY.md and TERMS.md, and the dataset SOURCE.md,
// so these relative paths resolve both in local builds and in the container build.
import terms from '../../../../TERMS.md?raw';
import privacy from '../../../../PRIVACY.md?raw';

export type LegalDocId = 'terms' | 'privacy';

export const LEGAL_DOCS: Record<LegalDocId, { title: string; body: string }> = {
  terms: { title: 'Terms of use', body: terms },
  privacy: { title: 'Privacy policy', body: privacy },
};

export const LEGAL_DOC_IDS = Object.keys(LEGAL_DOCS) as LegalDocId[];

export function isLegalDocId(value: string): value is LegalDocId {
  return (LEGAL_DOC_IDS as string[]).includes(value);
}
