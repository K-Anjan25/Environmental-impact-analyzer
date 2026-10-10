import type { ProcessFactor } from './api';

export interface FactorTextSuggestion {
  factor: ProcessFactor;
  sharedTerms: number;
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'by', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to', 'with',
  'process', 'production', 'manufacturing',
]);

function words(value: string): Set<string> {
  return new Set(
    value
      .normalize('NFKD')
      .toLocaleLowerCase()
      .replace(/[\u0300-\u036f]/g, '')
      .match(/[a-z0-9]+/g)
      ?.filter((word) => word.length > 1 && !STOP_WORDS.has(word)) ?? [],
  );
}

export function suggestFactorsByInputName(
  inputName: string,
  factors: readonly ProcessFactor[],
  limit = 5,
): FactorTextSuggestion[] {
  const inputWords = words(inputName);
  if (inputWords.size === 0 || limit <= 0) return [];

  return factors
    .map((factor) => {
      const factorWords = words(factor.activity);
      const sharedTerms = [...inputWords].filter((word) => factorWords.has(word)).length;
      const diceSimilarity = sharedTerms === 0
        ? 0
        : (2 * sharedTerms) / (inputWords.size + factorWords.size);
      return { factor, sharedTerms, diceSimilarity };
    })
    .filter((item) => item.diceSimilarity >= 0.25)
    .sort((left, right) => right.diceSimilarity - left.diceSimilarity || left.factor.activity.localeCompare(right.factor.activity))
    .slice(0, limit)
    .map(({ factor, sharedTerms }) => ({ factor, sharedTerms }));
}
