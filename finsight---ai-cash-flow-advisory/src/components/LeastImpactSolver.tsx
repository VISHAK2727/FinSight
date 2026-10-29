import React, { useState } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  Check, 
  X, 
  Sliders, 
  DollarSign, 
  ArrowRight, 
  Clock, 
  HelpCircle, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { 
  CompanyProfile, 
  Invoice, 
  Payable, 
  ScenarioConfig, 
  Intervention, 
  SolverResult 
} from '../types/finance';
import { solveLeastImpactSolvency } from '../utils/leastImpactSolver';

interface LeastImpactSolverProps {
  profile: CompanyProfile;
  invoices: Invoice[];
  payables: Payable[];
  currentScenario: ScenarioConfig;
  activeInterventions: Intervention[];
  onApplyInterventions: (interventions: Intervention[]) => void;
  onClearInterventions: () => void;
  onViewForecast: () => void;
}

export const LeastImpactSolver: React.FC<LeastImpactSolverProps> = ({
  profile,
  invoices,
  payables,
  currentScenario,
  activeInterventions,
  onApplyInterventions,
  onClearInterventions,
  onViewForecast,
}) => {
  const [targetBuffer, setTargetBuffer] = useState<number>(profile.targetSafetyBuffer || 25000);
  const [solverResult, setSolverResult] = useState<SolverResult | null>(() => {
    return solveLeastImpactSolvency({
      profile,
      invoices,
      payables,
      scenario: currentScenario,
      targetSafetyBuffer: profile.targetSafetyBuffer || 25000,
    });
  });

  const handleRunSolver = () => {
    const result = solveLeastImpactSolvency({
      profile,
      invoices,
      payables,
      scenario: currentScenario,
      targetSafetyBuffer: targetBuffer,
    });
    setSolverResult(result);
    // Apply recommended interventions by default
    onApplyInterventions(result.recommendedInterventions);
  };

  const handleBufferChange = (newVal: number) => {
    setTargetBuffer(newVal);
    const result = solveLeastImpactSolvency({
      profile,
      invoices,
      payables,
      scenario: currentScenario,
      targetSafetyBuffer: newVal,
    });
    setSolverResult(result);
    onApplyInterventions(result.recommendedInterventions);
  };

  const handleApplyAll = () => {
    onApplyInterventions(activeInterventions.map((i) => ({ ...i, isApplied: true })));
  };

  const handleExcludeAll = () => {
    onApplyInterventions(activeInterventions.map((i) => ({ ...i, isApplied: false })));
  };

  const handleToggleIntervention = (interventionId: string) => {
    const updated = activeInterventions.map((item) => {
      if (item.id === interventionId) {
        return { ...item, isApplied: !item.isApplied };
      }
      return item;
    });
    onApplyInterventions(updated);
  };

  const allAppliedCount = activeInterventions.filter((i) => i.isApplied).length;

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 mb-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
              <Zap className="w-4 h-4 fill-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Least-Impact Crisis Prevention Solver
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Algorithmic optimizer that calculates the minimal, least-disruptive combination of working capital levers 
            (early invoice discounts, supplier term extensions, capex deferrals, and credit facility) to guarantee your cash remains above your selected threshold.
          </p>
        </div>

        {/* Target Buffer Selector Control */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 shrink-0">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-medium">Target Safety Buffer:</span>
            <span className="font-mono tabular-nums font-bold text-emerald-400 text-sm">
              ${targetBuffer.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min="10000"
            max="60000"
            step="5000"
            value={targetBuffer}
            onChange={(e) => handleBufferChange(Number(e.target.value))}
            className="w-48 accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>$10k</span>
            <span>$35k</span>
            <span>$60k</span>
          </div>
        </div>
      </div>

      {/* Solver Action Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRunSolver}
            className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>Re-solve Optimal Plan</span>
          </button>

          <button
            onClick={handleApplyAll}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-medium transition-colors cursor-pointer"
          >
            Apply All ({activeInterventions.length})
          </button>

          <button
            onClick={handleExcludeAll}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium transition-colors cursor-pointer"
          >
            Exclude All
          </button>

          {allAppliedCount > 0 && (
            <button
              onClick={onClearInterventions}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Baseline</span>
            </button>
          )}
        </div>

        <button
          onClick={onViewForecast}
          className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium cursor-pointer"
        >
          <span>View Real-Time Chart Impact</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Solution Comparison Card */}
      {solverResult && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {solverResult.isSolvable ? 'Solvency Solution Computed' : 'Mitigation Plan (Deficit Reduced)'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>Financial Cost: <strong className="text-slate-200 font-mono tabular-nums">${solverResult.totalCost.toLocaleString()}</strong></span>
              <span className="text-slate-600">·</span>
              <span>Disruption Index: <strong className="text-emerald-400 font-mono tabular-nums">{solverResult.totalDisruptionScore} / 10</strong> (Low)</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            {solverResult.summaryExplanation}
          </p>

          {/* Turnaround Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0B0F19] rounded-lg p-3 border border-slate-800/80">
            <div>
              <span className="text-[11px] text-slate-500 block">Baseline Low Point</span>
              <span className={`text-base font-bold font-mono tabular-nums ${
                solverResult.baselineMinBalance < 0 ? 'text-rose-400' : 'text-amber-400'
              }`}>
                {solverResult.baselineMinBalance < 0
                  ? `-$${Math.abs(solverResult.baselineMinBalance).toLocaleString()}`
                  : `$${solverResult.baselineMinBalance.toLocaleString()}`}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block">Post-Intervention Low</span>
              <span className="text-base font-bold font-mono tabular-nums text-emerald-400">
                ${solverResult.postInterventionMinBalance.toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block">Insolvency Day</span>
              <span className="text-base font-bold font-mono tabular-nums text-slate-200">
                {solverResult.baselineShortfallDay ? `Day ${solverResult.baselineShortfallDay} → Averted` : 'None'}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block">Net Liquidity Lift</span>
              <span className="text-base font-bold font-mono tabular-nums text-emerald-400">
                +${(solverResult.postInterventionMinBalance - solverResult.baselineMinBalance).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Interventions Itemized Checklist */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Prescribed Action Levers ({activeInterventions.length} Available)
          </h3>
          <span className="text-xs text-slate-500">
            Toggle checkboxes to customize your intervention package
          </span>
        </div>

        <div className="space-y-2.5">
          {activeInterventions.map((intervention) => {
            const isApplied = intervention.isApplied;
            return (
              <div
                key={intervention.id}
                className={`border rounded-lg p-3.5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isApplied
                    ? 'bg-slate-900/90 border-emerald-500/40 ring-1 ring-emerald-500/20'
                    : 'bg-slate-900/40 border-slate-800/80 opacity-60 hover:opacity-90'
                }`}
              >
                {/* Left: Info */}
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleIntervention(intervention.id)}
                    className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      isApplied ? 'bg-emerald-500 text-slate-950' : 'border border-slate-700 bg-slate-800'
                    }`}
                  >
                    {isApplied && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">
                        {intervention.title}
                      </span>
                      <span className="text-slate-600 text-xs">·</span>
                      <span className="text-[11px] text-slate-400">
                        {intervention.type.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      {intervention.description}
                    </p>

                    {/* Metadata indicators */}
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-400">
                      <span>Liquidity Lift: <strong className="text-emerald-400 font-mono tabular-nums">+${intervention.cashBenefitAmount.toLocaleString()}</strong></span>
                      <span className="text-slate-600">·</span>
                      <span>Cost: <strong className="text-slate-300 font-mono tabular-nums">{intervention.cost === 0 ? '$0 (Free)' : `$${intervention.cost.toLocaleString()}`}</strong></span>
                      <span className="text-slate-600">·</span>
                      <span>Disruption: <strong className="text-slate-300 font-mono tabular-nums">{intervention.disruptionScore} / 10</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right: Status Tag */}
                <div className="shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleToggleIntervention(intervention.id)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                      isApplied
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isApplied ? 'Applied' : 'Exclude'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
