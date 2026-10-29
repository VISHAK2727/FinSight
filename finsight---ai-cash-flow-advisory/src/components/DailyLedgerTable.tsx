import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle,
  Calendar,
  Layers
} from 'lucide-react';
import { DailyForecastPoint, CompanyProfile } from '../types/finance';

interface DailyLedgerTableProps {
  forecastPoints: DailyForecastPoint[];
  profile: CompanyProfile;
}

export const DailyLedgerTable: React.FC<DailyLedgerTableProps> = ({
  forecastPoints,
  profile,
}) => {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const toggleExpand = (day: number) => {
    setExpandedDay(expandedDay === day ? null : day);
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden mb-6">
      
      {/* Table Title Bar */}
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-400" />
            30-Day Forward Daily Cash-Balance Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Exact day-by-day cash reconciliation. Click any active row to inspect arriving invoices and outgoing checks.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Solvent
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Under Buffer
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" /> Deficit
          </span>
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono tabular-nums border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-sans uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-4 font-semibold">Day / Date</th>
              <th className="py-2.5 px-4 font-semibold text-right">Start Balance</th>
              <th className="py-2.5 px-4 font-semibold text-right text-emerald-400">Inflows</th>
              <th className="py-2.5 px-4 font-semibold text-right text-rose-400">Outflows</th>
              <th className="py-2.5 px-4 font-semibold text-right">Net Change</th>
              <th className="py-2.5 px-4 font-semibold text-right">Ending Balance</th>
              <th className="py-2.5 px-4 font-semibold text-center font-sans">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {forecastPoints.map((point) => {
              const isExpanded = expandedDay === point.dayIndex;
              const hasItems = point.inflowItems.length > 0 || point.outflowItems.length > 0;
              const isDeficit = point.endingBalance < 0;
              const isBufferBreached = !isDeficit && point.endingBalance < profile.targetSafetyBuffer;

              return (
                <React.Fragment key={point.dayIndex}>
                  <tr
                    onClick={() => hasItems && toggleExpand(point.dayIndex)}
                    className={`transition-colors cursor-pointer ${
                      isDeficit
                        ? 'bg-rose-950/20 hover:bg-rose-950/30'
                        : isBufferBreached
                        ? 'bg-amber-950/10 hover:bg-amber-950/20'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Day / Date */}
                    <td className="py-2 px-4 whitespace-nowrap text-slate-300 font-medium">
                      <div className="flex items-center gap-1.5">
                        {hasItems ? (
                          isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                          )
                        ) : (
                          <span className="w-3.5 h-3.5" />
                        )}
                        <span>Day {point.dayIndex.toString().padStart(2, '0')}</span>
                        <span className="text-slate-500 font-sans">({point.displayDate})</span>
                      </div>
                    </td>

                    {/* Start Balance */}
                    <td className="py-2 px-4 text-right text-slate-400">
                      ${point.startingBalance.toLocaleString()}
                    </td>

                    {/* Inflows */}
                    <td className="py-2 px-4 text-right text-emerald-400 font-semibold">
                      {point.inflows > 0 ? `+$${point.inflows.toLocaleString()}` : '-'}
                    </td>

                    {/* Outflows */}
                    <td className="py-2 px-4 text-right text-rose-400 font-semibold">
                      {point.outflows > 0 ? `-$${point.outflows.toLocaleString()}` : '-'}
                    </td>

                    {/* Net Delta */}
                    <td className={`py-2 px-4 text-right font-medium ${
                      point.netDelta > 0 ? 'text-emerald-400' : point.netDelta < 0 ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {point.netDelta > 0
                        ? `+$${point.netDelta.toLocaleString()}`
                        : point.netDelta < 0
                        ? `-$${Math.abs(point.netDelta).toLocaleString()}`
                        : '$0'}
                    </td>

                    {/* Ending Balance */}
                    <td className={`py-2 px-4 text-right font-bold text-sm ${
                      isDeficit
                        ? 'text-rose-400'
                        : isBufferBreached
                        ? 'text-amber-300'
                        : 'text-emerald-400'
                    }`}>
                      {point.endingBalance < 0
                        ? `-$${Math.abs(point.endingBalance).toLocaleString()}`
                        : `$${point.endingBalance.toLocaleString()}`}
                    </td>

                    {/* Status */}
                    <td className="py-2 px-4 text-center whitespace-nowrap font-sans text-xs">
                      {isDeficit ? (
                        <span className="text-rose-400 font-semibold">Shortage</span>
                      ) : isBufferBreached ? (
                        <span className="text-amber-400 font-medium">Under Buffer</span>
                      ) : (
                        <span className="text-emerald-400/80">Solvent</span>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Itemized Row */}
                  {isExpanded && hasItems && (
                    <tr className="bg-[#090D16] border-b border-slate-800">
                      <td colSpan={7} className="py-2.5 px-6 font-sans">
                        <div className="text-xs text-slate-400 font-medium mb-1.5">
                          Transactions Scheduled on Day {point.dayIndex} ({point.displayDate}):
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {/* Inflows */}
                          <div>
                            <span className="text-emerald-400 font-semibold block mb-1">
                              Inflows ({point.inflowItems.length})
                            </span>
                            {point.inflowItems.length === 0 ? (
                              <span className="text-slate-600 italic">No incoming remittances</span>
                            ) : (
                              <ul className="space-y-1">
                                {point.inflowItems.map((item, idx) => (
                                  <li key={idx} className="flex justify-between text-slate-300 font-mono">
                                    <span className="truncate pr-2 font-sans">{item.title}</span>
                                    <span className="text-emerald-400 shrink-0 font-bold">
                                      +${item.amount.toLocaleString()}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          {/* Outflows */}
                          <div>
                            <span className="text-rose-400 font-semibold block mb-1">
                              Outflows ({point.outflowItems.length})
                            </span>
                            {point.outflowItems.length === 0 ? (
                              <span className="text-slate-600 italic">No scheduled disbursements</span>
                            ) : (
                              <ul className="space-y-1">
                                {point.outflowItems.map((item, idx) => (
                                  <li key={idx} className="flex justify-between text-slate-300 font-mono">
                                    <span className="truncate pr-2 font-sans">{item.title}</span>
                                    <span className="text-rose-400 shrink-0 font-bold">
                                      -${item.amount.toLocaleString()}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};
