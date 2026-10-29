import React from 'react';
import { 
  GitBranch, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Info,
  Check
} from 'lucide-react';
import { 
  ScenarioConfig, 
  ScenarioType, 
  CompanyProfile, 
  Invoice, 
  Payable 
} from '../types/finance';
import { DEFAULT_SCENARIOS } from '../data/sampleData';
import { computeDailyCashFlowForecast } from '../utils/cashFlowEngine';

interface ScenarioMatrixProps {
  profile: CompanyProfile;
  invoices: Invoice[];
  payables: Payable[];
  activeScenarioId: ScenarioType;
  onSelectScenario: (scenarioId: ScenarioType) => void;
}

export const ScenarioMatrix: React.FC<ScenarioMatrixProps> = ({
  profile,
  invoices,
  payables,
  activeScenarioId,
  onSelectScenario,
}) => {
  const scenarioKeys: ScenarioType[] = ['optimistic', 'expected', 'pessimistic'];

  // Precompute forecast preview metrics for all 3 scenarios
  const scenarioMetrics = scenarioKeys.map((key) => {
    const config = DEFAULT_SCENARIOS[key];
    const forecast = computeDailyCashFlowForecast({
      profile,
      invoices,
      payables,
      scenario: config,
    });
    return {
      config,
      forecast,
      isCurrent: activeScenarioId === key,
    };
  });

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 mb-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-sky-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Multi-Scenario Stress Testing & Delay Assumptions
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare cash flow outcomes under varying customer payment delay habits (30 & 60 days) and supply disruptions.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Active: <span className="text-emerald-400 font-semibold">{DEFAULT_SCENARIOS[activeScenarioId].name}</span>
        </div>
      </div>

      {/* 3-Column Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarioMetrics.map(({ config, forecast, isCurrent }) => {
          const isDeficit = forecast.minimumBalance < 0;
          const isOptimistic = config.id === 'optimistic';
          const isPessimistic = config.id === 'pessimistic';

          return (
            <div
              key={config.id}
              className={`rounded-xl border p-4.5 transition-all flex flex-col justify-between ${
                isCurrent
                  ? 'bg-slate-900 border-sky-500/60 ring-1 ring-sky-500/30'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Scenario Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {config.name}
                  </h3>
                  {isCurrent && (
                    <span className="text-[11px] text-sky-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-4 min-h-[36px]">
                  {config.description}
                </p>

                {/* Key Metrics Strip */}
                <div className="bg-[#0B0F19] rounded-lg p-3 border border-slate-800/80 mb-4 space-y-1.5 font-mono tabular-nums text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Min 30-Day Balance:</span>
                    <span className={`font-bold ${
                      isDeficit ? 'text-rose-400' : forecast.minimumBalance < profile.targetSafetyBuffer ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {forecast.minimumBalance < 0 ? `-$${Math.abs(forecast.minimumBalance).toLocaleString()}` : `$${forecast.minimumBalance.toLocaleString()}`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Solvency Status:</span>
                    <span className={`font-medium ${isDeficit ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isDeficit ? `Shortfall Day ${forecast.shortfallDay}` : '30d Solvent'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Net 30-Day Flow:</span>
                    <span className={forecast.netDelta >= 0 ? 'text-emerald-400' : 'text-slate-300'}>
                      {forecast.netDelta >= 0 ? `+$${forecast.netDelta.toLocaleString()}` : `-$${Math.abs(forecast.netDelta).toLocaleString()}`}
                    </span>
                  </div>
                </div>

                {/* Mathematical Assumptions (Unboxed) */}
                <div className="mb-4">
                  <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Key Assumptions:
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-400">
                    {config.assumptions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-slate-600 mt-1">·</span>
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectScenario(config.id)}
                disabled={isCurrent}
                className={`w-full py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-slate-800 text-slate-400 cursor-default'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                }`}
              >
                {isCurrent ? 'Currently Applied in Forecast' : `Switch to ${config.name}`}
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
};
