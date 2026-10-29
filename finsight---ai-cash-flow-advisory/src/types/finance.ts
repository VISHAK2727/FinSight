/**
 * Financial data contracts for Finsight
 */

export type PaymentTerms = 'Net-15' | 'Net-30' | 'Net-45' | 'Net-60' | 'Net-90' | 'Due on Receipt';

export type InvoiceStatus = 'pending' | 'overdue' | 'paid' | 'factored' | 'discounted';

export type RiskTier = 'low' | 'moderate' | 'high' | 'severe';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  issueDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  expectedPaymentDate: string; // Adjusted for customer delay habits
  paymentTerms: PaymentTerms;
  status: InvoiceStatus;
  historicalDelayDays: number; // e.g. 18 days average delay
  reliabilityScore: number;    // 0 - 100
  riskTier: RiskTier;
  industrySegment: string;
  notes?: string;
  originalExpectedDate?: string;
}

export type PayableCategory = 
  | 'raw_materials' 
  | 'payroll' 
  | 'equipment_lease' 
  | 'facility_utilities' 
  | 'freight_logistics' 
  | 'taxes' 
  | 'debt_service' 
  | 'general_overhead';

export type PayablePriority = 'critical' | 'standard' | 'flexible';

export interface Payable {
  id: string;
  reference: string;
  vendorName: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  category: PayableCategory;
  priority: PayablePriority;
  status: 'scheduled' | 'paid' | 'deferred';
  originalDueDate?: string;
  deferredDays?: number;
  notes?: string;
}

export interface DailyForecastPoint {
  dayIndex: number;
  dateStr: string;
  displayDate: string;
  startingBalance: number;
  inflows: number;
  outflows: number;
  endingBalance: number;
  netDelta: number;
  isBreachedBuffer: boolean;
  isNegative: boolean;
  inflowItems: { title: string; amount: number; id: string }[];
  outflowItems: { title: string; amount: number; id: string; category: PayableCategory }[];
}

export type ScenarioType = 'expected' | 'optimistic' | 'pessimistic';

export interface ScenarioConfig {
  id: ScenarioType;
  name: string;
  description: string;
  invoiceDelayShiftDays: number;
  unplannedExpenseMultiplier: number;
  receivableDefaultRate: number; // 0 to 1
  assumptions: string[];
}

export type InterventionType = 
  | 'early_discount'       // Offer 2% discount for prompt 10-day payment
  | 'invoice_factoring'    // Sell 85% of receivable to factoring firm (3% fee)
  | 'supplier_extension'   // Negotiate 15-day delay on non-critical payables
  | 'capex_deferral'       // Pause non-essential equipment upgrade
  | 'credit_line_draw';    // Draw exact shortfall from bank revolving line (8% APR)

export interface Intervention {
  id: string;
  type: InterventionType;
  title: string;
  description: string;
  relatedEntityId?: string; // invoice or payable id
  cashBenefitAmount: number;
  effectiveDayIndex: number;
  cost: number;
  disruptionScore: number; // 1 (mild) to 10 (severe)
  isApplied: boolean;
  feasibility: 'high' | 'medium' | 'conditional';
}

export interface SolverResult {
  isSolvable: boolean;
  targetSafetyBuffer: number;
  baselineMinBalance: number;
  baselineShortfallDay: number | null;
  baselineShortfallDate: string | null;
  postInterventionMinBalance: number;
  recommendedInterventions: Intervention[];
  totalCost: number;
  totalDisruptionScore: number;
  summaryExplanation: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  industry: string;
  description: string;
  currentCash: number;
  targetSafetyBuffer: number;
  monthlyBurnRate: number;
  creditLineAvailable: number;
  creditLineApr: number;
  currency: string;
}

export interface AiDiagnosticResult {
  executiveSummary: string;
  liquidityHealth: 'healthy' | 'caution' | 'critical';
  projectedCrisisDay?: number;
  projectedDeficit?: number;
  primaryRiskDrivers: string[];
  immediateActionPlan: {
    step: number;
    action: string;
    impact: string;
    timeframe: string;
  }[];
  workingCapitalAdvice: string;
}

export interface CollectionLetterResult {
  customerName: string;
  invoiceNumber: string;
  amount: number;
  subject: string;
  tone: 'polite_early' | 'firm_overdue' | 'urgent_final';
  letterBody: string;
}
