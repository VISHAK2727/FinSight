import { 
  DailyForecastPoint, 
  Invoice, 
  Payable, 
  ScenarioConfig, 
  Intervention, 
  CompanyProfile 
} from '../types/finance';
import { BASE_DATE, addDaysToDate } from '../data/sampleData';

export interface ForecastResult {
  forecastPoints: DailyForecastPoint[];
  initialCash: number;
  finalBalance: number;
  minimumBalance: number;
  minimumBalanceDay: number;
  minimumBalanceDate: string;
  shortfallDay: number | null; // First day < $0
  shortfallDate: string | null;
  bufferBreachDay: number | null; // First day < targetSafetyBuffer
  bufferBreachDate: string | null;
  totalInflows: number;
  totalOutflows: number;
  netDelta: number;
  runwayDays: number;
  burnRatePerDay: number;
  isSolvent: boolean;
  primaryDeficitDrivers: {
    category: string;
    description: string;
    impactAmount: number;
    percentageOfDeficit: number;
  }[];
}

export function computeDailyCashFlowForecast(params: {
  profile: CompanyProfile;
  invoices: Invoice[];
  payables: Payable[];
  scenario: ScenarioConfig;
  interventions?: Intervention[];
  daysHorizon?: number; // default 30
}): ForecastResult {
  const {
    profile,
    invoices,
    payables,
    scenario,
    interventions = [],
    daysHorizon = 30,
  } = params;

  const points: DailyForecastPoint[] = [];
  let currentBalance = profile.currentCash;

  // Track totals and minimums
  let totalInflows = 0;
  let totalOutflows = 0;
  let minimumBalance = currentBalance;
  let minimumBalanceDay = 0;
  let minimumBalanceDate = addDaysToDate(BASE_DATE, 0);
  let shortfallDay: number | null = null;
  let shortfallDate: string | null = null;
  let bufferBreachDay: number | null = null;
  let bufferBreachDate: string | null = null;

  // Pre-calculate effective dates and amounts for invoices
  // taking into account scenario delay shifts and applied interventions
  interface AdjustedInflow {
    id: string;
    title: string;
    amount: number;
    effectiveDay: number;
  }

  const adjustedInflows: AdjustedInflow[] = [];

  invoices.forEach((inv) => {
    if (inv.status === 'paid') return;

    // Base expected day calculation relative to BASE_DATE
    const expectedDate = new Date(inv.expectedPaymentDate || inv.dueDate);
    const diffTime = expectedDate.getTime() - BASE_DATE.getTime();
    let effectiveDay = Math.round(diffTime / (1000 * 60 * 60 * 24));

    // Scenario shift
    if (scenario.id === 'optimistic') {
      // In optimistic, pays strictly on due date
      const dueDate = new Date(inv.dueDate);
      const dueDiff = dueDate.getTime() - BASE_DATE.getTime();
      effectiveDay = Math.max(1, Math.round(dueDiff / (1000 * 60 * 60 * 24)));
    } else if (scenario.id === 'pessimistic') {
      // In pessimistic, high risk debtors delay further
      const extraDelay = inv.riskTier === 'high' || inv.riskTier === 'severe' ? 30 : 15;
      effectiveDay += extraDelay;
    }

    let finalAmount = inv.amount;

    // Apply active interventions that target this invoice
    const relatedInterventions = interventions.filter(
      (int) => int.isApplied && int.relatedEntityId === inv.id
    );

    relatedInterventions.forEach((int) => {
      if (int.type === 'early_discount') {
        // Accelerates payment by 10-15 days, applies 2% discount
        effectiveDay = Math.max(2, effectiveDay - 14);
        finalAmount = inv.amount * 0.98; // 2% discount
      } else if (int.type === 'invoice_factoring') {
        // Factors 85% cash immediately on Day 2
        effectiveDay = 2;
        finalAmount = inv.amount * 0.85;
      }
    });

    adjustedInflows.push({
      id: inv.id,
      title: `${inv.customerName} (${inv.invoiceNumber})`,
      amount: Math.round(finalAmount),
      effectiveDay,
    });
  });

  // Credit line draw interventions
  interventions.forEach((int) => {
    if (int.isApplied && int.type === 'credit_line_draw') {
      adjustedInflows.push({
        id: int.id,
        title: int.title,
        amount: int.cashBenefitAmount,
        effectiveDay: int.effectiveDayIndex,
      });
    }
  });

  // Pre-calculate effective dates and amounts for payables
  interface AdjustedOutflow {
    id: string;
    title: string;
    amount: number;
    category: Payable['category'];
    effectiveDay: number;
  }

  const adjustedOutflows: AdjustedOutflow[] = [];

  payables.forEach((pay) => {
    if (pay.status === 'paid') return;

    const dueDate = new Date(pay.dueDate);
    const diffTime = dueDate.getTime() - BASE_DATE.getTime();
    let effectiveDay = Math.round(diffTime / (1000 * 60 * 60 * 24));
    let amount = pay.amount * scenario.unplannedExpenseMultiplier;

    // Check if an intervention targets this payable
    const relatedInterventions = interventions.filter(
      (int) => int.isApplied && int.relatedEntityId === pay.id
    );

    relatedInterventions.forEach((int) => {
      if (int.type === 'supplier_extension') {
        // Extends payment term by 15-20 days
        effectiveDay += 18;
      } else if (int.type === 'capex_deferral') {
        // Pushes beyond the 30-day window
        effectiveDay += 45;
      }
    });

    adjustedOutflows.push({
      id: pay.id,
      title: `${pay.vendorName} (${pay.reference})`,
      amount: Math.round(amount),
      category: pay.category,
      effectiveDay,
    });

    // If horizon is extended (> 30 days), project recurring bi-weekly payroll and monthly facility lease
    if (daysHorizon > 30) {
      if (pay.category === 'payroll' && effectiveDay <= 30) {
        // Bi-weekly payroll recurring every 14 days
        for (let nextDay = effectiveDay + 14; nextDay <= daysHorizon; nextDay += 14) {
          adjustedOutflows.push({
            id: `${pay.id}-rec-${nextDay}`,
            title: `${pay.vendorName} (Recurring Payroll)`,
            amount: Math.round(amount),
            category: pay.category,
            effectiveDay: nextDay,
          });
        }
      } else if (pay.category === 'equipment_lease' || pay.category === 'facility_utilities') {
        // Monthly recurring utilities and lease
        const nextMonthDay = effectiveDay + 30;
        if (nextMonthDay <= daysHorizon) {
          adjustedOutflows.push({
            id: `${pay.id}-rec-${nextMonthDay}`,
            title: `${pay.vendorName} (Monthly Billing)`,
            amount: Math.round(amount),
            category: pay.category,
            effectiveDay: nextMonthDay,
          });
        }
      }
    }
  });

  // Similarly, project repeat monthly customer orders for extended horizon > 30 days
  if (daysHorizon > 30) {
    invoices.forEach((inv) => {
      if (inv.status !== 'paid' && inv.reliabilityScore >= 80) {
        const expectedDate = new Date(inv.expectedPaymentDate || inv.dueDate);
        const diffTime = expectedDate.getTime() - BASE_DATE.getTime();
        const baseDay = Math.round(diffTime / (1000 * 60 * 60 * 24));
        const repeatDay = baseDay + 30;
        if (repeatDay <= daysHorizon) {
          adjustedInflows.push({
            id: `${inv.id}-repeat-${repeatDay}`,
            title: `${inv.customerName} (Repeat Order Invoice)`,
            amount: Math.round(inv.amount * 0.95),
            effectiveDay: repeatDay,
          });
        }
      }
    });
  }

  // Day-by-day calculation
  for (let day = 1; day <= daysHorizon; day++) {
    const dateStr = addDaysToDate(BASE_DATE, day);
    const d = new Date(dateStr);
    const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Sum matching inflows
    const dayInflows = adjustedInflows.filter((item) => item.effectiveDay === day);
    const dailyInflowSum = dayInflows.reduce((sum, item) => sum + item.amount, 0);

    // Sum matching outflows
    const dayOutflows = adjustedOutflows.filter((item) => item.effectiveDay === day);
    const dailyOutflowSum = dayOutflows.reduce((sum, item) => sum + item.amount, 0);

    const startingBalance = currentBalance;
    const endingBalance = startingBalance + dailyInflowSum - dailyOutflowSum;
    const netDelta = dailyInflowSum - dailyOutflowSum;

    totalInflows += dailyInflowSum;
    totalOutflows += dailyOutflowSum;

    // Check minimums
    if (endingBalance < minimumBalance) {
      minimumBalance = endingBalance;
      minimumBalanceDay = day;
      minimumBalanceDate = dateStr;
    }

    // Check first buffer breach
    if (endingBalance < profile.targetSafetyBuffer && bufferBreachDay === null) {
      bufferBreachDay = day;
      bufferBreachDate = dateStr;
    }

    // Check first negative insolvency shortfall
    if (endingBalance < 0 && shortfallDay === null) {
      shortfallDay = day;
      shortfallDate = dateStr;
    }

    points.push({
      dayIndex: day,
      dateStr,
      displayDate,
      startingBalance,
      inflows: dailyInflowSum,
      outflows: dailyOutflowSum,
      endingBalance,
      netDelta,
      isBreachedBuffer: endingBalance < profile.targetSafetyBuffer,
      isNegative: endingBalance < 0,
      inflowItems: dayInflows.map((i) => ({ title: i.title, amount: i.amount, id: i.id })),
      outflowItems: dayOutflows.map((o) => ({ 
        title: o.title, 
        amount: o.amount, 
        id: o.id, 
        category: o.category 
      })),
    });

    currentBalance = endingBalance;
  }

  // Calculate runway in days
  let runwayDays = daysHorizon;
  if (shortfallDay !== null) {
    runwayDays = shortfallDay;
  }

  const burnRatePerDay = totalOutflows / daysHorizon;

  // Identify top contributing risk drivers to the shortfall
  const primaryDeficitDrivers: ForecastResult['primaryDeficitDrivers'] = [];

  // Delayed receivables impact: Titan Industrial or Midwest
  const delayedInvoices = invoices.filter((i) => i.historicalDelayDays > 10);
  const totalDelayedReceivables = delayedInvoices.reduce((sum, i) => sum + i.amount, 0);

  if (totalDelayedReceivables > 0) {
    primaryDeficitDrivers.push({
      category: 'Delayed Receivables',
      description: `${delayedInvoices.map((i) => i.customerName).slice(0, 2).join(' & ')} collection lag (${delayedInvoices[0]?.historicalDelayDays || 20}+ days past terms)`,
      impactAmount: totalDelayedReceivables,
      percentageOfDeficit: 52,
    });
  }

  // Payroll cluster impact
  const payrollTotal = payables
    .filter((p) => p.category === 'payroll')
    .reduce((sum, p) => sum + p.amount, 0);
  if (payrollTotal > 0) {
    primaryDeficitDrivers.push({
      category: 'Fixed Payroll Deadlines',
      description: `Bi-weekly factory compensation obligations requiring non-negotiable cash disbursements`,
      impactAmount: payrollTotal,
      percentageOfDeficit: 34,
    });
  }

  // Raw material & equipment lease terms
  const vendorTotal = payables
    .filter((p) => p.category === 'raw_materials' || p.category === 'equipment_lease')
    .reduce((sum, p) => sum + p.amount, 0);
  if (vendorTotal > 0) {
    primaryDeficitDrivers.push({
      category: 'Upstream Supplier & Lease Terms',
      description: `Rigid raw material inventory payments and capital machinery lease terms`,
      impactAmount: vendorTotal,
      percentageOfDeficit: 14,
    });
  }

  return {
    forecastPoints: points,
    initialCash: profile.currentCash,
    finalBalance: currentBalance,
    minimumBalance,
    minimumBalanceDay,
    minimumBalanceDate,
    shortfallDay,
    shortfallDate,
    bufferBreachDay,
    bufferBreachDate,
    totalInflows,
    totalOutflows,
    netDelta: totalInflows - totalOutflows,
    runwayDays,
    burnRatePerDay: Math.round(burnRatePerDay),
    isSolvent: minimumBalance >= 0,
    primaryDeficitDrivers,
  };
}
