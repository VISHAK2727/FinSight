import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Eye, 
  EyeOff,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';
import { DailyForecastPoint, CompanyProfile } from '../types/finance';

interface CashFlowChartProps {
  baselinePoints: DailyForecastPoint[];
  postInterventionPoints?: DailyForecastPoint[];
  profile: CompanyProfile;
  daysHorizon: number;
  onHorizonChange: (days: number) => void;
  solverActive?: boolean;
  onToggleSolverOverlay?: () => void;
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({
  baselinePoints,
  postInterventionPoints,
  profile,
  daysHorizon,
  onHorizonChange,
  solverActive = false,
  onToggleSolverOverlay,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pinnedDayIndex, setPinnedDayIndex] = useState<number | null>(null);

  // SVG coordinate dimensions
  const width = 1000;
  const height = 340;
  const paddingLeft = 70;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 45;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Compute balance bounds across both series to ensure proper scaling
  const { minVal, maxVal, zeroY, bufferY } = useMemo(() => {
    let allBalances = baselinePoints.map((p) => p.endingBalance);
    if (postInterventionPoints && solverActive) {
      allBalances = allBalances.concat(postInterventionPoints.map((p) => p.endingBalance));
    }
    allBalances.push(profile.targetSafetyBuffer);
    allBalances.push(0);

    const min = Math.min(...allBalances);
    const max = Math.max(...allBalances);

    const range = max - min || 10000;
    const paddedMin = Math.floor((min - range * 0.12) / 5000) * 5000;
    const paddedMax = Math.ceil((max + range * 0.12) / 5000) * 5000;

    const getY = (val: number) => {
      const norm = (val - paddedMin) / (paddedMax - paddedMin);
      return paddingTop + chartHeight * (1 - norm);
    };

    return {
      minVal: paddedMin,
      maxVal: paddedMax,
      zeroY: getY(0),
      bufferY: getY(profile.targetSafetyBuffer),
    };
  }, [baselinePoints, postInterventionPoints, solverActive, profile.targetSafetyBuffer, chartHeight, paddingTop]);

  const getX = (index: number) => {
    return paddingLeft + (index / Math.max(1, baselinePoints.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const norm = (val - minVal) / (maxVal - minVal || 1);
    return paddingTop + chartHeight * (1 - norm);
  };

  // Generate SVG path strings
  const baselinePath = useMemo(() => {
    if (baselinePoints.length === 0) return '';
    return baselinePoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p.endingBalance).toFixed(1)}`)
      .join(' ');
  }, [baselinePoints, minVal, maxVal]);

  const postInterventionPath = useMemo(() => {
    if (!postInterventionPoints || postInterventionPoints.length === 0 || !solverActive) return '';
    return postInterventionPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p.endingBalance).toFixed(1)}`)
      .join(' ');
  }, [postInterventionPoints, solverActive, minVal, maxVal]);

  // Gradient area path for baseline
  const baselineAreaPath = useMemo(() => {
    if (baselinePoints.length === 0) return '';
    const firstX = getX(0);
    const lastX = getX(baselinePoints.length - 1);
    return `${baselinePath} L ${lastX} ${zeroY} L ${firstX} ${zeroY} Z`;
  }, [baselinePath, zeroY, baselinePoints.length]);

  const activeIndex = pinnedDayIndex !== null ? pinnedDayIndex : hoveredIndex;
  const activePoint = activeIndex !== null ? baselinePoints[activeIndex] : null;
  const activeSolverPoint = 
    activeIndex !== null && postInterventionPoints && solverActive 
      ? postInterventionPoints[activeIndex] 
      : null;

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 mb-6">
      
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">
              Daily Cash Trajectory & Solvency Radar
            </h2>
            <span className="text-xs text-slate-500 font-medium">·</span>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {daysHorizon}-Day Continuous Forecast
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any point along the curve to pin and inspect that day&apos;s specific invoices, checks, and ending balances.
          </p>
        </div>

        {/* Legend & Horizon Controls */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          {/* Legend items */}
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-sky-400 rounded-full" />
              <span>Baseline</span>
            </div>

            {postInterventionPoints && (
              <button
                onClick={onToggleSolverOverlay}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                  solverActive 
                    ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/60 font-semibold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle Solver Curve Overlay"
              >
                <span className="w-2.5 h-0.5 bg-emerald-400 rounded-full" />
                <span>Solver Plan {solverActive ? '(On)' : '(Off)'}</span>
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-amber-400" />
              <span className="text-amber-400/90 font-mono tabular-nums">
                Buffer (${(profile.targetSafetyBuffer / 1000).toFixed(0)}k)
              </span>
            </div>
          </div>

          {/* Horizon Selector (30D, 60D, 90D) */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
            {[30, 60, 90].map((days) => (
              <button
                key={days}
                onClick={() => onHorizonChange(days)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  daysHorizon === days
                    ? 'bg-slate-800 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => {
            if (pinnedDayIndex === null) setHoveredIndex(null);
          }}
        >
          <defs>
            <linearGradient id="baselineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
              <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" />
            </linearGradient>

            <linearGradient id="solverGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const val = minVal + pct * (maxVal - minVal);
            const y = getY(val);
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                  textAnchor="end"
                >
                  ${(val / 1000).toFixed(0)}k
                </text>
              </g>
            );
          })}

          {/* Zero Balance Line (Insolvency Danger Line) */}
          {zeroY >= paddingTop && zeroY <= height - paddingBottom && (
            <g>
              <line
                x1={paddingLeft}
                y1={zeroY}
                x2={width - paddingRight}
                y2={zeroY}
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <text
                x={width - paddingRight + 4}
                y={zeroY + 3}
                fill="#f87171"
                fontSize="9"
                fontWeight="bold"
                fontFamily="JetBrains Mono"
              >
                $0 (Insolvency)
              </text>
            </g>
          )}

          {/* Target Safety Buffer Line */}
          {bufferY >= paddingTop && bufferY <= height - paddingBottom && (
            <g>
              <line
                x1={paddingLeft}
                y1={bufferY}
                x2={width - paddingRight}
                y2={bufferY}
                stroke="#f59e0b"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
              <text
                x={width - paddingRight + 4}
                y={bufferY + 3}
                fill="#fbbf24"
                fontSize="9"
                fontFamily="JetBrains Mono"
              >
                Safety Buffer
              </text>
            </g>
          )}

          {/* Baseline Area */}
          <path d={baselineAreaPath} fill="url(#baselineGradient)" />

          {/* Post-intervention curve (if solver active) */}
          {solverActive && postInterventionPoints && (
            <path
              d={postInterventionPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Baseline Curve */}
          <path
            d={baselinePath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover and Click Detection Columns & Points */}
          {baselinePoints.map((p, i) => {
            const x = getX(i);
            const y = getY(p.endingBalance);
            const isHovered = activeIndex === i;
            const isNegative = p.endingBalance < 0;
            const isBelowBuffer = p.endingBalance < profile.targetSafetyBuffer;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onClick={() => setPinnedDayIndex(pinnedDayIndex === i ? null : i)}
              >
                {/* Wide invisible hit area */}
                <rect
                  x={x - chartWidth / (baselinePoints.length * 2)}
                  y={paddingTop}
                  width={chartWidth / baselinePoints.length}
                  height={chartHeight}
                  fill="transparent"
                />

                {/* Vertical cursor guide */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={height - paddingBottom}
                    stroke="#475569"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Balance point circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 5.5 : isNegative ? 3.5 : 2}
                  fill={isNegative ? '#ef4444' : isBelowBuffer ? '#f59e0b' : '#38bdf8'}
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />

                {/* Post-intervention point circle */}
                {solverActive && postInterventionPoints && postInterventionPoints[i] && (
                  <circle
                    cx={x}
                    cy={getY(postInterventionPoints[i].endingBalance)}
                    r={isHovered ? 5 : 2}
                    fill="#10b981"
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />
                )}

                {/* X Axis Labels for key intervals */}
                {(i === 0 || (i + 1) % 5 === 0 || i === baselinePoints.length - 1) && (
                  <text
                    x={x}
                    y={height - paddingBottom + 18}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                  >
                    D{p.dayIndex}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Inspection Card on Hover / Tap */}
        {activePoint && (
          <div
            className="absolute z-20 pointer-events-auto bg-[#0B0F19]/95 border border-slate-700 rounded-lg p-3 shadow-2xl backdrop-blur-md text-xs transition-all"
            style={{
              left: `${Math.min(chartWidth - 220, Math.max(10, (activeIndex! / baselinePoints.length) * 100))}%`,
              top: '12px',
              minWidth: '240px',
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
              <span className="font-semibold text-white">
                Day {activePoint.dayIndex} ({activePoint.displayDate})
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-mono tabular-nums font-bold ${
                    activePoint.endingBalance < 0
                      ? 'text-rose-400'
                      : activePoint.endingBalance < profile.targetSafetyBuffer
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  ${activePoint.endingBalance.toLocaleString()}
                </span>
                {pinnedDayIndex !== null && (
                  <button
                    onClick={() => setPinnedDayIndex(null)}
                    className="text-slate-400 hover:text-white ml-1 p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1 font-mono tabular-nums">
              <div className="flex justify-between text-slate-400">
                <span>Start Balance:</span>
                <span className="text-slate-200">${activePoint.startingBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Inflows:</span>
                <span>+${activePoint.inflows.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Outflows:</span>
                <span>-${activePoint.outflows.toLocaleString()}</span>
              </div>

              {activeSolverPoint && solverActive && (
                <div className="pt-1.5 border-t border-slate-800 flex justify-between text-emerald-300 font-semibold">
                  <span>Solver Outcome:</span>
                  <span>${activeSolverPoint.endingBalance.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Line items for this day */}
            {(activePoint.inflowItems.length > 0 || activePoint.outflowItems.length > 0) ? (
              <div className="mt-2 pt-1.5 border-t border-slate-800 text-[11px] space-y-1">
                {activePoint.inflowItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-emerald-400 font-mono">
                    <span className="truncate pr-1 font-sans font-medium">{item.title}</span>
                    <span className="shrink-0 font-bold">+${item.amount.toLocaleString()}</span>
                  </div>
                ))}
                {activePoint.outflowItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-rose-400 font-mono">
                    <span className="truncate pr-1 font-sans font-medium">{item.title}</span>
                    <span className="shrink-0 font-bold">-${item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-1.5 text-[10px] text-slate-500 italic">
                No active receipts or disbursements on this day
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pinned Day Inspector Strip (When a day is clicked) */}
      {pinnedDayIndex !== null && activePoint && (
        <div className="mt-3 p-3 rounded-lg bg-slate-900/90 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">
              Day {activePoint.dayIndex} Pinned
            </span>
            <span className="text-slate-300 font-medium">
              {activePoint.displayDate}: Ending balance ${activePoint.endingBalance.toLocaleString()} 
              ({activePoint.inflowItems.length} receipts, {activePoint.outflowItems.length} disbursements)
            </span>
          </div>

          <button
            onClick={() => setPinnedDayIndex(null)}
            className="text-slate-400 hover:text-white text-xs underline cursor-pointer shrink-0"
          >
            Unpin & Clear
          </button>
        </div>
      )}

    </div>
  );
};
