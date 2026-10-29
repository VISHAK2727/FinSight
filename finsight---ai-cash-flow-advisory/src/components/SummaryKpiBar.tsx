import React from 'react';
import { 
  Wallet, 
  TrendingDown, 
  TrendingUp, 
  CalendarClock, 
  ShieldAlert, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import { ForecastResult } from '../utils/cashFlowEngine';
import { CompanyProfile } from '../types/finance';

interface SummaryKpiBarProps {
  profile: CompanyProfile;
  forecast: ForecastResult;
  onOpenSolver?: () => void;
}

export const SummaryKpiBar: React.FC<SummaryKpiBarProps> = ({
  profile,
  forecast,
  onOpenSolver,
}) => {
  const isDeficit = forecast.minimumBalance < 0;
  const isBufferBreached = !isDeficit && forecast.minimumBalance < profile.targetSafetyBuffer;
  const isPositiveNet = forecast.netDelta >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      
      {/* KPI 1: Current Liquid Cash */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 transition-all">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span className="font-medium">Current Cash Balance</span>
          <Wallet className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-white tracking-tight">
          ${profile.currentCash.toLocaleString()}
        </div>
        <div className="mt-2 flex items-center text-xs text-slate-400 gap-1.5">
          <span>Target Buffer:</span>
          <span className="font-mono tabular-nums text-slate-300 font-medium">
            ${profile.targetSafetyBuffer.toLocaleString()}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">{profile.currency}</span>
        </div>
      </div>

      {/* KPI 2: 30-Day Forward Minimum (Crisis Point) */}
      <div 
        className={`border rounded-xl p-4 transition-all ${
          isDeficit 
            ? 'bg-rose-950/20 border-rose-800/80' 
            : isBufferBreached 
            ? 'bg-amber-950/20 border-amber-800/80' 
            : 'bg-[#111827] border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span className="font-medium">30-Day Projected Low Point</span>
          {isDeficit ? (
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          ) : isBufferBreached ? (
            <TrendingDown className="w-4 h-4 text-amber-400" />
          ) : (
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          )}
        </div>
        <div 
          className={`text-2xl font-bold font-mono tabular-nums tracking-tight ${
            isDeficit 
              ? 'text-rose-400' 
              : isBufferBreached 
              ? 'text-amber-300' 
              : 'text-emerald-400'
          }`}
        >
          {forecast.minimumBalance < 0 
            ? `-$${Math.abs(forecast.minimumBalance).toLocaleString()}` 
            : `$${forecast.minimumBalance.toLocaleString()}`
          }
        </div>
        <div className="mt-2 flex items-center text-xs text-slate-400 gap-1.5">
          {isDeficit ? (
            <>
              <span className="text-rose-400 font-semibold">Shortfall on Day {forecast.shortfallDay}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">{forecast.shortfallDate}</span>
            </>
          ) : isBufferBreached ? (
            <>
              <span className="text-amber-400 font-medium">Buffer breached Day {forecast.bufferBreachDay}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">{forecast.bufferBreachDate}</span>
            </>
          ) : (
            <>
              <span className="text-emerald-400 font-medium">Solvent throughout 30d</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">Lowest Day {forecast.minimumBalanceDay}</span>
            </>
          )}
        </div>
      </div>

      {/* KPI 3: Net Cash Flow (Inflows vs Outflows) */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 transition-all">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span className="font-medium">30-Day Net Cash Flow</span>
          {isPositiveNet ? (
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          )}
        </div>
        <div 
          className={`text-2xl font-bold font-mono tabular-nums tracking-tight ${
            isPositiveNet ? 'text-emerald-400' : 'text-slate-200'
          }`}
        >
          {isPositiveNet ? `+$${forecast.netDelta.toLocaleString()}` : `-$${Math.abs(forecast.netDelta).toLocaleString()}`}
        </div>
        <div className="mt-2 flex items-center text-xs text-slate-400 gap-1.5">
          <span className="text-emerald-400 font-mono tabular-nums">+${forecast.totalInflows.toLocaleString()} in</span>
          <span className="text-slate-600">·</span>
          <span className="text-rose-400 font-mono tabular-nums">-${forecast.totalOutflows.toLocaleString()} out</span>
        </div>
      </div>

      {/* KPI 4: Cash Runway */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 transition-all">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span className="font-medium">Liquidity Runway</span>
          <CalendarClock className="w-4 h-4 text-sky-400" />
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-white tracking-tight">
          {forecast.shortfallDay ? `${forecast.shortfallDay} Days` : '30+ Days'}
        </div>
        <div className="mt-2 flex items-center text-xs text-slate-400 gap-1.5">
          <span>Est. Daily Burn:</span>
          <span className="font-mono tabular-nums text-slate-300 font-medium">
            ${forecast.burnRatePerDay.toLocaleString()}/day
          </span>
          {forecast.shortfallDay && onOpenSolver && (
            <>
              <span className="text-slate-600">·</span>
              <button 
                onClick={onOpenSolver}
                className="text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
              >
                Solve
              </button>
            </>
          )}
        </div>
      </div>

    </div>
  );
};
