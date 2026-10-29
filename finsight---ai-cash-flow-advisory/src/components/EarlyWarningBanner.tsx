import React from 'react';
import { 
  AlertOctagon, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Clock, 
  Layers 
} from 'lucide-react';
import { ForecastResult } from '../utils/cashFlowEngine';
import { CompanyProfile } from '../types/finance';

interface EarlyWarningBannerProps {
  profile: CompanyProfile;
  forecast: ForecastResult;
  onLaunchSolver: () => void;
  onViewLedger: () => void;
}

export const EarlyWarningBanner: React.FC<EarlyWarningBannerProps> = ({
  profile,
  forecast,
  onLaunchSolver,
  onViewLedger,
}) => {
  const isDeficit = forecast.minimumBalance < 0;
  const isBufferBreached = !isDeficit && forecast.minimumBalance < profile.targetSafetyBuffer;

  if (!isDeficit && !isBufferBreached) {
    return null; // All clear
  }

  const deficitAmount = isDeficit 
    ? Math.abs(forecast.minimumBalance) 
    : profile.targetSafetyBuffer - forecast.minimumBalance;

  return (
    <div className={`mb-6 rounded-xl border p-4 sm:p-5 transition-all ${
      isDeficit 
        ? 'bg-gradient-to-r from-rose-950/40 via-slate-900 to-rose-950/20 border-rose-800/80' 
        : 'bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/10 border-amber-800/80'
    }`}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        
        {/* Left: Headline & Breach Date */}
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
            isDeficit ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
          }`}>
            <AlertOctagon className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold uppercase tracking-wider ${
                isDeficit ? 'text-rose-400' : 'text-amber-400'
              }`}>
                {isDeficit ? 'Impending Liquidity Crisis Detected' : 'Safety Buffer Compression Warning'}
              </span>
              <span className="text-slate-500 text-xs">·</span>
              <span className="text-xs text-slate-300 font-mono tabular-nums">
                Shortfall in {forecast.shortfallDay || forecast.bufferBreachDay} Days ({forecast.shortfallDate || forecast.bufferBreachDate})
              </span>
            </div>

            <h3 className="text-lg font-bold text-white mt-0.5">
              {isDeficit ? (
                <>
                  Projected Cash Shortage of{' '}
                  <span className="text-rose-400 font-mono tabular-nums font-extrabold">
                    -${deficitAmount.toLocaleString()}
                  </span>{' '}
                  Approaching
                </>
              ) : (
                <>
                  Working Capital Buffer Projected to Dip{' '}
                  <span className="text-amber-300 font-mono tabular-nums font-extrabold">
                    ${deficitAmount.toLocaleString()}
                  </span>{' '}
                  Below Safety Threshold
                </>
              )}
            </h3>

            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Paper revenue and booking orders remain profitable, but collection lag on Net-60 accounts 
              collides with fixed bi-weekly payroll and supplier disbursements, creating an acute liquidity blindspot.
            </p>

            {/* Contributing factors chips (Unboxed zero-pill text) */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
              <span className="text-slate-500 font-medium">Primary Drivers:</span>
              {forecast.primaryDeficitDrivers.map((driver, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  <span className="font-medium text-slate-200">{driver.category}</span>
                  <span className="text-slate-400 font-mono tabular-nums">(${driver.impactAmount.toLocaleString()})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Direct Solver Action Callout */}
        <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 w-full sm:w-auto mt-2 lg:mt-0">
          <button
            onClick={onLaunchSolver}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-950 flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer whitespace-nowrap ${
              isDeficit
                ? 'bg-rose-400 hover:bg-rose-300 ring-2 ring-rose-500/50'
                : 'bg-amber-400 hover:bg-amber-300 ring-2 ring-amber-500/50'
            }`}
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>Run Least-Impact Solver</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onViewLedger}
            className="w-full sm:w-auto px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors whitespace-nowrap"
          >
            Inspect Day-by-Day Ledger
          </button>
        </div>

      </div>
    </div>
  );
};
