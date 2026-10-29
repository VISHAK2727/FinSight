import { RiskTier } from '../types/finance';

/**
 * Calculates payment reliability score (0-100) based on:
 * - Historical delay days (heaviest penalty: >20 days delay drops score severely)
 * - Payment terms (longer terms have higher variance)
 * - Current aging relative to due date
 */
export function calculateReliabilityScore(params: {
  historicalDelayDays: number;
  paymentTerms: string;
  isOverdue?: boolean;
  daysPastDue?: number;
}): { score: number; riskTier: RiskTier; label: string } {
  let score = 95; // Base score for standard active account

  // 1. Historical Delay Impact
  const delay = Math.max(0, params.historicalDelayDays);
  if (delay === 0) {
    score += 5; // Perfect history bonus
  } else if (delay <= 7) {
    score -= delay * 1.5; // Slight friction
  } else if (delay <= 15) {
    score -= 10 + (delay - 7) * 2.5; // Moderate friction
  } else if (delay <= 30) {
    score -= 30 + (delay - 15) * 2; // Chronic delay
  } else {
    score -= 60 + Math.min(30, (delay - 30) * 1.2); // Severe delay
  }

  // 2. Terms complexity penalty
  if (params.paymentTerms === 'Net-60') {
    score -= 6;
  } else if (params.paymentTerms === 'Net-90') {
    score -= 12;
  }

  // 3. Current delinquency penalty
  if (params.isOverdue && params.daysPastDue && params.daysPastDue > 0) {
    score -= Math.min(25, params.daysPastDue * 1.5);
  }

  // Clamp 0 - 100
  const finalScore = Math.max(5, Math.min(99, Math.round(score)));

  let riskTier: RiskTier = 'low';
  let label = 'High Reliability';

  if (finalScore >= 80) {
    riskTier = 'low';
    label = 'Reliable (On-Time)';
  } else if (finalScore >= 60) {
    riskTier = 'moderate';
    label = 'Moderate Delay Risk';
  } else if (finalScore >= 40) {
    riskTier = 'high';
    label = 'Elevated Risk (30d+ Delay)';
  } else {
    riskTier = 'severe';
    label = 'Severe Delinquency Risk';
  }

  return { score: finalScore, riskTier, label };
}

/**
 * Calculates expected payment date based on invoice due date and historical customer payment habits.
 */
export function computeExpectedPaymentDate(dueDateStr: string, historicalDelayDays: number): string {
  const due = new Date(dueDateStr);
  due.setDate(due.getDate() + Math.max(0, historicalDelayDays));
  return due.toISOString().split('T')[0];
}
