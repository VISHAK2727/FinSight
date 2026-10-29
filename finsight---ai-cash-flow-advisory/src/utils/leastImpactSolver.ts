import { 
  CompanyProfile, 
  Invoice, 
  Payable, 
  ScenarioConfig, 
  Intervention, 
  SolverResult 
} from '../types/finance';
import { computeDailyCashFlowForecast } from './cashFlowEngine';

/**
 * Generates all realistic candidate interventions available to the business.
 */
export function generateCandidateInterventions(params: {
  profile: CompanyProfile;
  invoices: Invoice[];
  payables: Payable[];
}): Intervention[] {
  const { profile, invoices, payables } = params;
  const candidates: Intervention[] = [];

  // 1. Capex / Discretionary Overhead Deferral
  const flexiblePayables = payables.filter(
    (p) => p.priority === 'flexible' && p.status !== 'paid'
  );
  flexiblePayables.forEach((p) => {
    candidates.push({
      id: `defer-${p.id}`,
      type: 'capex_deferral',
      title: `Defer ${p.vendorName}`,
      description: `Postpone non-urgent ${p.category.replace('_', ' ')} expense by 45 days to preserve liquidity during critical payroll window.`,
      relatedEntityId: p.id,
      cashBenefitAmount: p.amount,
      effectiveDayIndex: 1,
      cost: 0,
      disruptionScore: 2.0, // Low friction
      isApplied: false,
      feasibility: 'high',
    });
  });

  // 2. Supplier Term Renegotiation (Net-30 -> Net-45/60)
  const standardPayables = payables.filter(
    (p) => p.priority === 'standard' && p.category === 'raw_materials' && p.status !== 'paid'
  );
  standardPayables.forEach((p) => {
    candidates.push({
      id: `extend-${p.id}`,
      type: 'supplier_extension',
      title: `Negotiate 18-Day Extension with ${p.vendorName.split('(')[0].trim()}`,
      description: `Request temporary 18-day extension on material invoice (${p.reference}) with vendor goodwill notice.`,
      relatedEntityId: p.id,
      cashBenefitAmount: p.amount,
      effectiveDayIndex: 1,
      cost: 0,
      disruptionScore: 2.8,
      isApplied: false,
      feasibility: 'high',
    });
  });

  // 3. Early Payment Incentive (2% 10 Net-30) for reliable customers
  const promptInvoices = invoices.filter(
    (inv) => inv.reliabilityScore >= 70 && inv.status === 'pending' && inv.amount >= 15000
  );
  promptInvoices.forEach((inv) => {
    const discountCost = Math.round(inv.amount * 0.02);
    candidates.push({
      id: `discount-${inv.id}`,
      type: 'early_discount',
      title: `Offer 2% Early Pay Discount to ${inv.customerName}`,
      description: `Incentivize prompt remittance within 5 days for invoice ${inv.invoiceNumber} in exchange for a 2% ($${discountCost.toLocaleString()}) discount.`,
      relatedEntityId: inv.id,
      cashBenefitAmount: inv.amount * 0.98,
      effectiveDayIndex: 5,
      cost: discountCost,
      disruptionScore: 1.5, // Least disruptive
      isApplied: false,
      feasibility: 'high',
    });
  });

  // 4. Selective Invoice Factoring on large delayed receivables
  const delayedInvoices = invoices.filter(
    (inv) => (inv.riskTier === 'high' || inv.riskTier === 'severe' || inv.historicalDelayDays > 20) &&
             inv.amount >= 30000 && 
             inv.status === 'pending'
  );
  delayedInvoices.forEach((inv) => {
    const advanceAmount = Math.round(inv.amount * 0.85);
    const factoringFee = Math.round(inv.amount * 0.03);
    candidates.push({
      id: `factor-${inv.id}`,
      type: 'invoice_factoring',
      title: `Factor 85% of ${inv.customerName} Receivable`,
      description: `Sell invoice ${inv.invoiceNumber} ($${inv.amount.toLocaleString()}) to a commercial factor for an immediate 85% advance ($${advanceAmount.toLocaleString()}) at a 3% fee ($${factoringFee.toLocaleString()}).`,
      relatedEntityId: inv.id,
      cashBenefitAmount: advanceAmount,
      effectiveDayIndex: 2,
      cost: factoringFee,
      disruptionScore: 3.8,
      isApplied: false,
      feasibility: 'medium',
    });
  });

  // 5. Revolving Credit Facility Draw
  if (profile.creditLineAvailable > 0) {
    const drawTiers = [15000, 25000, profile.creditLineAvailable];
    drawTiers.forEach((drawAmount) => {
      if (drawAmount <= profile.creditLineAvailable) {
        const monthlyInterest = Math.round(drawAmount * (profile.creditLineApr / 100 / 12));
        candidates.push({
          id: `credit-draw-${drawAmount}`,
          type: 'credit_line_draw',
          title: `Draw $${drawAmount.toLocaleString()} from Revolving Line of Credit`,
          description: `Access existing commercial bank credit facility at ${profile.creditLineApr}% APR. Requires standard monthly debt servicing ($${monthlyInterest}/mo).`,
          cashBenefitAmount: drawAmount,
          effectiveDayIndex: 12,
          cost: monthlyInterest,
          disruptionScore: 4.2,
          isApplied: false,
          feasibility: 'high',
        });
      }
    });
  }

  return candidates;
}

/**
 * Least-Impact Solver:
 * Finds the minimum disruption, lowest cost set of interventions that ensures
 * the daily balance never dips below targetSafetyBuffer.
 */
export function solveLeastImpactSolvency(params: {
  profile: CompanyProfile;
  invoices: Invoice[];
  payables: Payable[];
  scenario: ScenarioConfig;
  targetSafetyBuffer: number;
}): SolverResult {
  const { profile, invoices, payables, scenario, targetSafetyBuffer } = params;

  // 1. Calculate baseline without any interventions
  const baseline = computeDailyCashFlowForecast({
    profile: { ...profile, targetSafetyBuffer },
    invoices,
    payables,
    scenario,
    interventions: [],
  });

  // If already above target buffer on all days, no action needed!
  if (baseline.minimumBalance >= targetSafetyBuffer) {
    return {
      isSolvable: true,
      targetSafetyBuffer,
      baselineMinBalance: baseline.minimumBalance,
      baselineShortfallDay: null,
      baselineShortfallDate: null,
      postInterventionMinBalance: baseline.minimumBalance,
      recommendedInterventions: [],
      totalCost: 0,
      totalDisruptionScore: 0,
      summaryExplanation: `Your projected cash flow remains completely solvent across the 30-day horizon, staying at or above your $${targetSafetyBuffer.toLocaleString()} safety buffer on all days. No crisis interventions required.`,
    };
  }

  // 2. Generate candidate levers
  const allCandidates = generateCandidateInterventions({ profile, invoices, payables });

  // 3. Greedy with branch-and-bound optimization for minimal disruption
  // Sort candidate actions by efficiency: DisruptionScore + CostWeight
  const sortedCandidates = [...allCandidates].sort((a, b) => {
    const penaltyA = a.disruptionScore * 1000 + a.cost;
    const penaltyB = b.disruptionScore * 1000 + b.cost;
    return penaltyA - penaltyB;
  });

  const selectedInterventions: Intervention[] = [];
  let bestForecast = baseline;
  let isSolvable = false;

  // Greedily add interventions one by one
  for (const candidate of sortedCandidates) {
    // Prevent overlapping credit line draws
    if (
      candidate.type === 'credit_line_draw' &&
      selectedInterventions.some((i) => i.type === 'credit_line_draw')
    ) {
      continue;
    }

    // Prevent duplicate actions on same invoice/payable
    if (
      candidate.relatedEntityId &&
      selectedInterventions.some((i) => i.relatedEntityId === candidate.relatedEntityId)
    ) {
      continue;
    }

    const testInterventions = [
      ...selectedInterventions,
      { ...candidate, isApplied: true },
    ];

    const testForecast = computeDailyCashFlowForecast({
      profile: { ...profile, targetSafetyBuffer },
      invoices,
      payables,
      scenario,
      interventions: testInterventions,
    });

    // Check if it meaningfully improves the minimum balance
    if (testForecast.minimumBalance > bestForecast.minimumBalance) {
      selectedInterventions.push({ ...candidate, isApplied: true });
      bestForecast = testForecast;

      // If we reached or exceeded target buffer, we have solved the crisis!
      if (testForecast.minimumBalance >= targetSafetyBuffer) {
        isSolvable = true;
        break;
      }
    }
  }

  // If still not solved, check if drawing max credit line can bridge the gap
  if (!isSolvable) {
    const maxCredit = allCandidates.find(
      (c) => c.type === 'credit_line_draw' && c.cashBenefitAmount === profile.creditLineAvailable
    );
    if (maxCredit && !selectedInterventions.some((i) => i.id === maxCredit.id)) {
      // Replace smaller credit draw if any
      const filtered = selectedInterventions.filter((i) => i.type !== 'credit_line_draw');
      filtered.push({ ...maxCredit, isApplied: true });
      const testForecast = computeDailyCashFlowForecast({
        profile: { ...profile, targetSafetyBuffer },
        invoices,
        payables,
        scenario,
        interventions: filtered,
      });
      if (testForecast.minimumBalance > bestForecast.minimumBalance) {
        selectedInterventions.length = 0;
        selectedInterventions.push(...filtered);
        bestForecast = testForecast;
        if (testForecast.minimumBalance >= targetSafetyBuffer) {
          isSolvable = true;
        }
      }
    }
  }

  const totalCost = selectedInterventions.reduce((sum, i) => sum + i.cost, 0);
  const totalDisruptionScore = Number(
    (
      selectedInterventions.reduce((sum, i) => sum + i.disruptionScore, 0) /
      Math.max(1, selectedInterventions.length)
    ).toFixed(1)
  );

  let summaryExplanation = '';
  if (isSolvable) {
    summaryExplanation = `The solver identified ${selectedInterventions.length} coordinated, low-impact interventions that eliminate the projected $${Math.abs(baseline.minimumBalance).toLocaleString()} shortfall on Day ${baseline.shortfallDay || baseline.bufferBreachDay}. Cash reserves are lifted to a safe low of $${bestForecast.minimumBalance.toLocaleString()} (maintaining your $${targetSafetyBuffer.toLocaleString()} buffer) at a total financial cost of only $${totalCost.toLocaleString()}.`;
  } else {
    summaryExplanation = `The maximum available working capital interventions lifted your low point from $${baseline.minimumBalance.toLocaleString()} to $${bestForecast.minimumBalance.toLocaleString()}, significantly softening the crisis, but additional equity or debt facility may be needed to achieve the full $${targetSafetyBuffer.toLocaleString()} buffer.`;
  }

  return {
    isSolvable,
    targetSafetyBuffer,
    baselineMinBalance: baseline.minimumBalance,
    baselineShortfallDay: baseline.shortfallDay || baseline.bufferBreachDay,
    baselineShortfallDate: baseline.shortfallDate || baseline.bufferBreachDate,
    postInterventionMinBalance: bestForecast.minimumBalance,
    recommendedInterventions: selectedInterventions,
    totalCost,
    totalDisruptionScore,
    summaryExplanation,
  };
}
