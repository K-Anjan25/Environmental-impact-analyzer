import type { AssessmentResult } from './api';

export function assessmentIsScored(result: AssessmentResult): boolean {
  return result.score !== null;
}

export function availableIndicatorCount(result: AssessmentResult): number {
  return result.indicators.filter((indicator) => indicator.status !== 'unavailable').length;
}
