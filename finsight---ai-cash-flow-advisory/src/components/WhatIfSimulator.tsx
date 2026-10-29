import React, { useState } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  DollarSign,
  Plus,
  Minus
} from 'lucide-react';
import { CompanyProfile, Invoice, Payable } from '../types/finance';
import { ForecastResult } from '../utils/cashFlowEngine';

export interface WhatIfParams {
  extraDelayDays: number;         // -15 to +45
  expenseSurgePercent: number;    // -20 to +30
  emergencyCashInjection: number; // 0 to 50000
  targetBuffer: number;           // 10000 to 60000
  // Custom per-invoice delay overrides: invoiceId -> extraDays
  customInvoiceDelays: Record<string, number>;
  // Custom per-payable amount overrides: payableId -> newAmount
  customPayableAmounts: Record<string, number>;
}

interface WhatIfSimulatorProps {
  params: WhatIfParams;
  onChangeParams: (params: WhatIfParams) => void;
  onResetParams: () => void;
  baselineForecast: ForecastResult;
  simulatedForecast: ForecastResult;
  profile: CompanyProfile;
  invoices: Invoice[];
  payables: Payable[];
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  params,
  onChangeParams,
  onResetParams,
  baselineForecast,
  simulatedForecast,
  profile,
  invoices,
  payables,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'macro' | 'invoices' | 'payables'>('macro');

  const hasInvoiceOverrides = Object.keys(params.customInvoiceDelays || {}).length > 0;
  const hasPayableOverrides = Object.keys(params.customPayableAmounts || {}).length > 0;

  const isChanged =
    params.extraDelayDays !== 0 ||
    params.expenseSurgePercent !== 0 ||
    params.emergencyCashInjection !== 0 ||
    params.targetBuffer !== profile.targetSafetyBuffer ||
    hasInvoiceOverrides ||
    hasPayableOverrides;

  const minDelta = simulatedForecast.minimumBalance - baselineForecast.minimumBalance;
  const isSimulatedSolvent = simulatedForecast.minimumBalance >= 0;

  // Invoice delay override handler
  const handleSetInvoiceDelay = (invoiceId: string, days: number) => {
    const updated = { ...params.customInvoiceDelays, [invoiceId]: days };
    if (days === 0) delete updated[invoiceId];
    onChangeParams({ ...params, customInvoiceDelays: updated });
  };

  // Payable amount override handler
  const handleSetPayableAmount = (payableId: string, amount: number) => {
    const updated = { ...params.customPayableAmounts, [payableId]: amount };
    onChangeParams({ ...params, customPayableAmounts: updated });
  };

  const handleResetPayableAmount = (payableId: string) => {
    const updated = { ...params.customPayableAmounts };
    delete updated[payableId];
    onChangeParams({ ...params, customPayableAmounts: updated });
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 mb-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Interactive What-If Scenario & Stress Simulator
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Modify any customer payment date, expense amount, or global macroeconomic variable. Watch the daily cash trajectory recalculate instantly.
          </p>
        </div>

        {isChanged && (
          <button
            onClick={onResetParams}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Adjustments</span>
          </button>
        )}
      </div>

      {/* Sub-navigation tabs: Macro Sliders vs Specific Invoices vs Specific Payables */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 mb-5">
        <button
          onClick={() => setActiveSubTab('macro')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'macro'
              ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Global Macro Levers
        </button>

        <button
          onClick={() => setActiveSubTab('invoices')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'invoices'
              ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Tune Individual Invoices</span>
          {hasInvoiceOverrides && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('payables')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'payables'
              ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Tune Specific Payables</span>
          {hasPayableOverrides && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          )}
        </button>
      </div>

      {/* SUB-VIEW 1: Global Macro Sliders */}
      {activeSubTab === 'macro' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          
          {/* Slider 1: Customer Payment Delay Shift */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-semibold text-white">Receivable Delay Shift (All Accounts)</span>
              <span className="font-mono tabular-nums font-bold text-emerald-400">
                {params.extraDelayDays === 0
                  ? 'Baseline (0 Days)'
                  : params.extraDelayDays > 0
                  ? `+${params.extraDelayDays} Days (Delayed)`
                  : `${params.extraDelayDays} Days (Accelerated)`}
              </span>
            </div>
            <input
              type="range"
              min="-15"
              max="45"
              step="5"
              value={params.extraDelayDays}
              onChange={(e) =>
                onChangeParams({ ...params, extraDelayDays: Number(e.target.value) })
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>-15d (Prompt)</span>
              <span>0d (Baseline)</span>
              <span>+45d (Severe Lag)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Shifts all expected customer payment inflows earlier or later across the 30-day projection.
            </p>
          </div>

          {/* Slider 2: Operating Expenses & Supplier Price Fluctuation */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-semibold text-white">Operational & Supply Cost Shift</span>
              <span className="font-mono tabular-nums font-bold text-amber-400">
                {params.expenseSurgePercent === 0
                  ? '0% (Standard Budget)'
                  : params.expenseSurgePercent > 0
                  ? `+${params.expenseSurgePercent}% Inflation`
                  : `${params.expenseSurgePercent}% Savings`}
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="30"
              step="5"
              value={params.expenseSurgePercent}
              onChange={(e) =>
                onChangeParams({ ...params, expenseSurgePercent: Number(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>-20% (Cuts)</span>
              <span>0%</span>
              <span>+30% (Surge)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Simulates raw material inflation (copper, steel, titanium) or energy and freight rate hikes.
            </p>
          </div>

          {/* Slider 3: Emergency Cash Injection / Equity */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-semibold text-white">Emergency Cash Injection</span>
              <span className="font-mono tabular-nums font-bold text-sky-400">
                +${params.emergencyCashInjection.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50000"
              step="5000"
              value={params.emergencyCashInjection}
              onChange={(e) =>
                onChangeParams({ ...params, emergencyCashInjection: Number(e.target.value) })
              }
              className="w-full accent-sky-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>$0</span>
              <span>$25,000</span>
              <span>$50,000</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Tests impact of an immediate founder equity contribution or angel loan into the opening balance.
            </p>
          </div>

          {/* Slider 4: Safety Buffer Threshold */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-semibold text-white">Target Safety Reserve Buffer</span>
              <span className="font-mono tabular-nums font-bold text-emerald-400">
                ${params.targetBuffer.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="10000"
              max="60000"
              step="5000"
              value={params.targetBuffer}
              onChange={(e) =>
                onChangeParams({ ...params, targetBuffer: Number(e.target.value) })
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>$10,000</span>
              <span>$35,000</span>
              <span>$60,000</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Threshold below which Finsight alerts management to an impending liquidity crunch.
            </p>
          </div>

        </div>
      )}

      {/* SUB-VIEW 2: Specific Invoices Timing Sandbox */}
      {activeSubTab === 'invoices' && (
        <div className="mb-6 space-y-3">
          <div className="text-xs text-slate-400 mb-2">
            Change specific customer payment dates. For example, test: &quot;What if Titan Industrial pays on Day 14 instead of Day 38?&quot;
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {invoices.filter((i) => i.status !== 'paid').map((inv) => {
              const currentOffset = params.customInvoiceDelays[inv.id] || 0;
              return (
                <div
                  key={inv.id}
                  className={`p-3.5 rounded-lg border text-xs transition-all ${
                    currentOffset !== 0
                      ? 'bg-slate-900 border-emerald-500/50 ring-1 ring-emerald-500/20'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold text-white block">{inv.customerName}</span>
                      <span className="text-[11px] text-slate-400">
                        {inv.invoiceNumber} · Due {inv.dueDate}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-white">
                      ${inv.amount.toLocaleString()}
                    </span>
                  </div>

                  {/* Delay Stepper / Buttons */}
                  <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-800">
                    <span className="text-[11px] text-slate-400">Payment Timing:</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <button
                        onClick={() => handleSetInvoiceDelay(inv.id, currentOffset - 7)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold"
                        title="Accelerate by 7 days"
                      >
                        -7d
                      </button>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        currentOffset === 0 ? 'text-slate-400' : currentOffset < 0 ? 'text-emerald-400 bg-emerald-950/40' : 'text-amber-400 bg-amber-950/40'
                      }`}>
                        {currentOffset === 0 ? 'Base' : currentOffset > 0 ? `+${currentOffset}d` : `${currentOffset}d`}
                      </span>
                      <button
                        onClick={() => handleSetInvoiceDelay(inv.id, currentOffset + 7)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold"
                        title="Delay by 7 days"
                      >
                        +7d
                      </button>
                      {currentOffset !== 0 && (
                        <button
                          onClick={() => handleSetInvoiceDelay(inv.id, 0)}
                          className="text-[11px] text-slate-500 hover:text-slate-300 ml-1 underline cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: Specific Payables Amount Sandbox */}
      {activeSubTab === 'payables' && (
        <div className="mb-6 space-y-3">
          <div className="text-xs text-slate-400 mb-2">
            Simulate negotiating discounts or price increases on specific obligations.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {payables.filter((p) => p.status !== 'paid').map((pay) => {
              const currentAmount = params.customPayableAmounts[pay.id] ?? pay.amount;
              const isModified = currentAmount !== pay.amount;
              return (
                <div
                  key={pay.id}
                  className={`p-3.5 rounded-lg border text-xs transition-all ${
                    isModified
                      ? 'bg-slate-900 border-amber-500/50 ring-1 ring-amber-500/20'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold text-white block">{pay.vendorName}</span>
                      <span className="text-[11px] text-slate-400">
                        {pay.category.replace('_', ' ')} · Due {pay.dueDate}
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold text-rose-400 block">
                        ${currentAmount.toLocaleString()}
                      </span>
                      {isModified && (
                        <span className="text-[10px] text-slate-500 line-through">
                          Orig: ${pay.amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Adjust Amount Controls */}
                  <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-800">
                    <span className="text-[11px] text-slate-400">Adjust Amount:</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <button
                        onClick={() => handleSetPayableAmount(pay.id, Math.round(currentAmount * 0.9))}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold"
                        title="Reduce by 10%"
                      >
                        -10%
                      </button>
                      <button
                        onClick={() => handleSetPayableAmount(pay.id, Math.round(currentAmount * 1.1))}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold"
                        title="Increase by 10%"
                      >
                        +10%
                      </button>
                      {isModified && (
                        <button
                          onClick={() => handleResetPayableAmount(pay.id)}
                          className="text-[11px] text-slate-500 hover:text-slate-300 ml-1 underline cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Real-Time Outcome Comparison Strip */}
      <div className="bg-[#0B0F19] rounded-xl p-4 border border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3 border-b border-slate-800/80 pb-2 flex-wrap gap-2">
          <span className="font-bold text-white uppercase tracking-wider">
            Simulated Outcome vs Baseline
          </span>
          <span className="font-mono tabular-nums">
            {isSimulatedSolvent ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Solvent in Simulation
              </span>
            ) : (
              <span className="text-rose-400 font-semibold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Deficit of ${Math.abs(simulatedForecast.minimumBalance).toLocaleString()}
              </span>
            )}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono tabular-nums">
          <div>
            <span className="text-[11px] text-slate-500 block">Baseline Min</span>
            <span className={`text-base font-bold ${
              baselineForecast.minimumBalance < 0 ? 'text-rose-400' : 'text-slate-200'
            }`}>
              {baselineForecast.minimumBalance < 0
                ? `-$${Math.abs(baselineForecast.minimumBalance).toLocaleString()}`
                : `$${baselineForecast.minimumBalance.toLocaleString()}`}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 block">Simulated Min</span>
            <span className={`text-base font-bold ${
              simulatedForecast.minimumBalance < 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {simulatedForecast.minimumBalance < 0
                ? `-$${Math.abs(simulatedForecast.minimumBalance).toLocaleString()}`
                : `$${simulatedForecast.minimumBalance.toLocaleString()}`}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 block">Net Difference</span>
            <span className={`text-base font-bold ${minDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {minDelta >= 0 ? `+$${minDelta.toLocaleString()}` : `-$${Math.abs(minDelta).toLocaleString()}`}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 block">Simulated Runway</span>
            <span className="text-base font-bold text-white">
              {simulatedForecast.shortfallDay ? `${simulatedForecast.shortfallDay} Days` : '30+ Days (Solvent)'}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
