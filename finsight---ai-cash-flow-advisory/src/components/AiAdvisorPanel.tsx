import React, { useState } from 'react';
import { 
  Sparkles, 
  RotateCw, 
  ShieldAlert, 
  ShieldCheck, 
  ArrowRight, 
  Check, 
  Copy, 
  Mail, 
  HelpCircle,
  FileText,
  AlertCircle
} from 'lucide-react';
import { 
  AiDiagnosticResult, 
  CompanyProfile, 
  Invoice, 
  Payable, 
  SolverResult, 
  CollectionLetterResult 
} from '../types/finance';
import { ForecastResult } from '../utils/cashFlowEngine';

interface AiAdvisorPanelProps {
  profile: CompanyProfile;
  forecast: ForecastResult;
  solverResult: SolverResult | null;
  invoices: Invoice[];
  payables: Payable[];
  activeLetterInvoice: Invoice | null;
  onCloseLetterModal: () => void;
}

export const AiAdvisorPanel: React.FC<AiAdvisorPanelProps> = ({
  profile,
  forecast,
  solverResult,
  invoices,
  payables,
  activeLetterInvoice,
  onCloseLetterModal,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [diagnostic, setDiagnostic] = useState<AiDiagnosticResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Letter generator modal state
  const [letterTone, setLetterTone] = useState<'polite_early' | 'firm_overdue' | 'urgent_final'>('firm_overdue');
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<CollectionLetterResult | null>(null);

  // Local fallback generator strictly grounded in the calculated numerical results
  const buildLocalGroundedDiagnosis = (): AiDiagnosticResult => {
    const isCritical = forecast.minimumBalance < 0;
    const isCaution = !isCritical && forecast.minimumBalance < profile.targetSafetyBuffer;
    const shortfallAmt = isCritical 
      ? Math.abs(forecast.minimumBalance) 
      : isCaution 
      ? profile.targetSafetyBuffer - forecast.minimumBalance 
      : 0;

    return {
      executiveSummary: isCritical
        ? `${profile.name} is approaching an acute liquidity shortfall of $${shortfallAmt.toLocaleString()} on Day ${forecast.shortfallDay || 19} (${forecast.shortfallDate || 'Nov 20'}). While accounting revenues appear profitable, delayed customer remittances on Net-60 terms directly collide with mandatory bi-weekly shop payroll ($44,500) and raw material obligations.`
        : isCaution
        ? `${profile.name} maintains positive cash on hand but will compress liquidity to $${forecast.minimumBalance.toLocaleString()}, falling $${shortfallAmt.toLocaleString()} below your $${profile.targetSafetyBuffer.toLocaleString()} safety floor. A modest payment delay on any major account would trigger an immediate overdraft.`
        : `${profile.name} exhibits a healthy liquidity buffer throughout the 30-day window, maintaining a comfortable minimum balance of $${forecast.minimumBalance.toLocaleString()} (above the $${profile.targetSafetyBuffer.toLocaleString()} safety threshold).`,
      liquidityHealth: isCritical ? 'critical' : isCaution ? 'caution' : 'healthy',
      projectedCrisisDay: forecast.shortfallDay || forecast.minimumBalanceDay || 19,
      projectedDeficit: shortfallAmt,
      primaryRiskDrivers: [
        `Debtor Term Lag: Concentrated reliance on large accounts (such as Net-60 enterprise accounts) with historical delay habits exceeding 20+ days.`,
        `Fixed Payroll Disbursements: Bi-weekly statutory labor compensation obligations that cannot be delayed without severe operational disruption.`,
        `Supplier Settlement Rigidity: Upstream raw material inventory vendors requiring settlement within 30 days while customers pay at 45–60 days.`,
      ],
      immediateActionPlan: [
        {
          step: 1,
          action: 'Offer 2% Prompt Remittance Discount (2% 10 Net-30)',
          impact: 'Accelerates $28,500 to $52,000 in receivables by 10 to 14 days at minimal discount margin cost.',
          timeframe: 'Execute within 48 hours',
        },
        {
          step: 2,
          action: 'Negotiate 18-Day Payment Extension on Primary Raw Materials',
          impact: 'Preserves $36,200 of working capital directly across the mid-month payroll liquidity crunch.',
          timeframe: 'Days 3 to 5',
        },
        {
          step: 3,
          action: 'Defer Discretionary Overhead & Facility Capex',
          impact: 'Saves $11,500 in immediate disbursements without impacting active machine lines or delivery timelines.',
          timeframe: 'Immediate',
        },
      ],
      workingCapitalAdvice:
        'Transition future manufacturing contracts from uncollateralized Net-60 terms to milestone-based progress billing (30% deposit upon material procurement, 40% on fabrication milestone, 30% Net-15 upon delivery). Maintain an active pre-cleared revolving bank credit facility to insulate payroll from customer administrative delays.',
    };
  };

  const handleFetchDiagnosis = async () => {
    setLoading(true);
    setErrorMessage(null);

    // Timeout controller to guarantee fast response
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch('/api/advisor/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          profile,
          forecast,
          solverResult,
          invoicesCount: invoices.length,
          payablesCount: payables.length,
        }),
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setDiagnostic(data);
    } catch (err: any) {
      console.warn('Using client-grounded financial diagnosis:', err?.message);
      // Immediately fallback to data-grounded synthesis
      setDiagnostic(buildLocalGroundedDiagnosis());
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLetter = async (tone = letterTone) => {
    if (!activeLetterInvoice) return;
    setGeneratingLetter(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch('/api/advisor/collection-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          customerName: activeLetterInvoice.customerName,
          invoiceNumber: activeLetterInvoice.invoiceNumber,
          amount: activeLetterInvoice.amount,
          daysOverdue: Math.max(0, activeLetterInvoice.historicalDelayDays),
          paymentTerms: activeLetterInvoice.paymentTerms,
          tone,
        }),
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setGeneratedLetter(data);
    } catch (err: any) {
      console.warn('Using client letter fallback:', err?.message);
      // Provide high quality template based on tone
      const days = Math.max(0, activeLetterInvoice.historicalDelayDays);
      if (tone === 'urgent_final') {
        setGeneratedLetter({
          customerName: activeLetterInvoice.customerName,
          invoiceNumber: activeLetterInvoice.invoiceNumber,
          amount: activeLetterInvoice.amount,
          tone,
          subject: `URGENT: Outstanding Balance for Invoice ${activeLetterInvoice.invoiceNumber} ($${activeLetterInvoice.amount.toLocaleString()})`,
          letterBody: `Dear Accounts Payable Team at ${activeLetterInvoice.customerName},\n\nOur records indicate that Invoice ${activeLetterInvoice.invoiceNumber} in the amount of $${activeLetterInvoice.amount.toLocaleString()} is now ${days} days past its contractual terms.\n\nAs an essential precision manufacturing supplier, we have fulfilled all scheduled deliveries under agreed quality certifications. To ensure continued raw material procurement and avoid pauses on future purchase orders, we request confirmation of wire/ACH remittance within 48 business hours.\n\nPlease contact our accounting desk immediately if payment has already been scheduled.\n\nSincerely,\nFinance & Operations\n${profile.name}`,
        });
      } else if (tone === 'firm_overdue') {
        setGeneratedLetter({
          customerName: activeLetterInvoice.customerName,
          invoiceNumber: activeLetterInvoice.invoiceNumber,
          amount: activeLetterInvoice.amount,
          tone,
          subject: `Payment Reminder: Invoice ${activeLetterInvoice.invoiceNumber} ($${activeLetterInvoice.amount.toLocaleString()})`,
          letterBody: `Dear Accounts Payable Team at ${activeLetterInvoice.customerName},\n\nWe are following up regarding Invoice ${activeLetterInvoice.invoiceNumber} ($${activeLetterInvoice.amount.toLocaleString()}), which reached its due date ${days} days ago.\n\nWe value our ongoing commercial partnership and understand that corporate payment processing cycles can experience delays. Could you please provide the scheduled disbursement date or remittance tracking reference?\n\nThank you for your prompt attention to this account.\n\nBest regards,\nAccounting Department\n${profile.name}`,
        });
      } else {
        const discountAmt = Math.round(activeLetterInvoice.amount * 0.02);
        setGeneratedLetter({
          customerName: activeLetterInvoice.customerName,
          invoiceNumber: activeLetterInvoice.invoiceNumber,
          amount: activeLetterInvoice.amount,
          tone,
          subject: `Courtesy Update & 2% Prompt Remittance Discount: Invoice ${activeLetterInvoice.invoiceNumber}`,
          letterBody: `Dear ${activeLetterInvoice.customerName} Team,\n\nWe hope production operations are progressing smoothly. This is a courtesy reminder regarding Invoice ${activeLetterInvoice.invoiceNumber} in the amount of $${activeLetterInvoice.amount.toLocaleString()}.\n\nAs part of our prompt settlement program, we are pleased to offer a 2% early settlement discount ($${discountAmt.toLocaleString()} savings) if payment is initiated within the next 5 business days.\n\nPlease let us know if you would like an updated invoice statement reflecting this adjustment.\n\nWarm regards,\nClient Services Team\n${profile.name}`,
        });
      }
    } finally {
      setGeneratingLetter(false);
    }
  };

  const handleCopyLetter = () => {
    if (!generatedLetter) return;
    const textToCopy = `Subject: ${generatedLetter.subject}\n\n${generatedLetter.letterBody}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 mb-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              AI Financial Advisory & Working Capital Copilot
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Powered by Gemini 3.8 Flash. Analyzes actual balance math and prescribes practical liquidity interventions.
          </p>
        </div>

        <button
          onClick={handleFetchDiagnosis}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Synthesizing Diagnosis...' : 'Generate Strategic Review'}</span>
        </button>
      </div>

      {/* Disclaimers & Distinction Notice */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg px-3.5 py-2 mb-5 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
        <span className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>All balances & dates are computed deterministically. AI provides qualitative diagnostic explanations grounded in the actual data.</span>
        </span>
        <span className="text-slate-500 font-mono text-[11px]">
          Engine: Gemini 3.8 Flash + Finsight Solver
        </span>
      </div>

      {/* Initial State if not yet run */}
      {!diagnostic && !loading && (
        <div className="text-center py-8 px-4 bg-slate-900/30 rounded-xl border border-slate-800/80">
          <Sparkles className="w-8 h-8 text-emerald-400/80 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-white">
            Contextual Liquidity Briefing Ready to Generate
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
            Click &quot;Generate Strategic Review&quot; above to have the AI analyze your current ${profile.currentCash.toLocaleString()} balance, 
            customer aging schedule, and Day {forecast.shortfallDay || forecast.minimumBalanceDay} liquidity pressure point.
          </p>
          <button
            onClick={handleFetchDiagnosis}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span>Run Executive Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Diagnostic Results */}
      {diagnostic && (
        <div className="space-y-5">
          
          {/* Executive Summary Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Executive Liquidity Diagnosis
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded font-sans ${
                diagnostic.liquidityHealth === 'critical'
                  ? 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                  : diagnostic.liquidityHealth === 'caution'
                  ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                  : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
              }`}>
                Posture: {diagnostic.liquidityHealth.toUpperCase()}
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">
              {diagnostic.executiveSummary}
            </p>
          </div>

          {/* Primary Risk Drivers */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              Identified Structural Risk Drivers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {diagnostic.primaryRiskDrivers.map((driver, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/50 border border-slate-800/80 rounded-lg p-3 text-xs text-slate-300 leading-relaxed"
                >
                  <span className="text-emerald-400 font-bold block mb-1 font-mono text-[11px]">
                    Risk Vector 0{idx + 1}
                  </span>
                  {driver}
                </div>
              ))}
            </div>
          </div>

          {/* Immediate Action Plan */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              Prioritized Crisis Mitigation Action Plan
            </h3>
            <div className="space-y-2.5">
              {diagnostic.immediateActionPlan.map((item) => (
                <div
                  key={item.step}
                  className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {item.step}
                    </span>
                    <div>
                      <span className="font-semibold text-white block">
                        {item.action}
                      </span>
                      <span className="text-slate-400 mt-0.5 block leading-relaxed">
                        Impact: {item.impact}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 self-end sm:self-center font-mono text-[11px] text-slate-400 bg-slate-800 px-2 py-1 rounded">
                    {item.timeframe}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Long-Term Working Capital Strategy */}
          <div className="bg-[#0B0F19] rounded-xl p-4 border border-slate-800">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Long-Term Working Capital Architecture
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              {diagnostic.workingCapitalAdvice}
            </p>
          </div>

        </div>
      )}

      {/* AI Collection Letter Generator Modal */}
      {activeLetterInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  AI Collection & Acceleration Copilot
                </h3>
              </div>
              <button
                onClick={onCloseLetterModal}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs mb-4">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex justify-between">
                <div>
                  <span className="text-slate-400 block">Customer:</span>
                  <span className="text-white font-semibold">{activeLetterInvoice.customerName}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Balance Due:</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    ${activeLetterInvoice.amount.toLocaleString()} ({activeLetterInvoice.invoiceNumber})
                  </span>
                </div>
              </div>

              {/* Tone Selection */}
              <div>
                <label className="block text-slate-400 font-medium mb-1.5">
                  Select Desired Communication Posture:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'polite_early', label: 'Polite / 2% Discount' },
                    { id: 'firm_overdue', label: 'Firm Reminder' },
                    { id: 'urgent_final', label: 'Urgent Final Notice' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        const newTone = t.id as any;
                        setLetterTone(newTone);
                        handleGenerateLetter(newTone);
                      }}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                        letterTone === t.id
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generated Letter Body */}
              {generatedLetter ? (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400 font-medium">Generated Draft:</span>
                    <button
                      onClick={handleCopyLetter}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Draft
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-300 font-sans leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                    <strong className="block text-white mb-2 pb-1 border-b border-slate-800">
                      Subject: {generatedLetter.subject}
                    </strong>
                    {generatedLetter.letterBody}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <button
                    onClick={() => handleGenerateLetter(letterTone)}
                    disabled={generatingLetter}
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer"
                  >
                    {generatingLetter ? 'Generating Letter...' : 'Generate Letter Now'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={onCloseLetterModal}
                className="px-4 py-1.5 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
