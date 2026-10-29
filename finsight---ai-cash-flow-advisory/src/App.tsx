import React, { useState, useMemo, useEffect } from 'react';
import { 
  APEX_PROFILE, 
  APEX_INVOICES, 
  APEX_PAYABLES, 
  VANGUARD_PROFILE, 
  VANGUARD_INVOICES, 
  VANGUARD_PAYABLES, 
  SOLVENT_PROFILE, 
  SOLVENT_INVOICES, 
  SOLVENT_PAYABLES,
  DEFAULT_SCENARIOS,
  BASE_DATE
} from './data/sampleData';
import { 
  CompanyProfile, 
  Invoice, 
  Payable, 
  ScenarioType, 
  Intervention, 
  SolverResult 
} from './types/finance';
import { computeDailyCashFlowForecast } from './utils/cashFlowEngine';
import { solveLeastImpactSolvency } from './utils/leastImpactSolver';

import { NavigationHeader, ActiveTab } from './components/NavigationHeader';
import { SummaryKpiBar } from './components/SummaryKpiBar';
import { EarlyWarningBanner } from './components/EarlyWarningBanner';
import { CashFlowChart } from './components/CashFlowChart';
import { LeastImpactSolver } from './components/LeastImpactSolver';
import { ScenarioMatrix } from './components/ScenarioMatrix';
import { WhatIfSimulator, WhatIfParams } from './components/WhatIfSimulator';
import { DailyLedgerTable } from './components/DailyLedgerTable';
import { InvoiceTable } from './components/InvoiceTable';
import { PayablesTable } from './components/PayablesTable';
import { AiAdvisorPanel } from './components/AiAdvisorPanel';
import { MethodologyModal } from './components/MethodologyModal';

import { 
  LayoutDashboard, 
  Zap, 
  Calendar, 
  GitBranch, 
  Sliders, 
  FileText, 
  CreditCard, 
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Percent,
  Mail,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

export default function App() {
  // Profiles available for testing
  const profiles = [APEX_PROFILE, VANGUARD_PROFILE, SOLVENT_PROFILE];

  // Active Profile
  const [profileId, setProfileId] = useState<string>('apex-metalworks');
  const activeProfile = useMemo(() => {
    return profiles.find((p) => p.id === profileId) || APEX_PROFILE;
  }, [profileId]);

  // Active view tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Days horizon (30, 60, or 90 days)
  const [daysHorizon, setDaysHorizon] = useState<number>(30);

  // Overlay state for chart
  const [showSolverOverlay, setShowSolverOverlay] = useState<boolean>(true);

  // Core Data States
  const [invoices, setInvoices] = useState<Invoice[]>(APEX_INVOICES);
  const [payables, setPayables] = useState<Payable[]>(APEX_PAYABLES);

  // Scenario
  const [activeScenarioId, setActiveScenarioId] = useState<ScenarioType>('expected');
  const currentScenario = DEFAULT_SCENARIOS[activeScenarioId];

  // Applied Interventions (from Solver or user toggles)
  const [activeInterventions, setActiveInterventions] = useState<Intervention[]>([]);

  // What-If Simulator Parameters
  const [whatIfParams, setWhatIfParams] = useState<WhatIfParams>({
    extraDelayDays: 0,
    expenseSurgePercent: 0,
    emergencyCashInjection: 0,
    targetBuffer: APEX_PROFILE.targetSafetyBuffer,
    customInvoiceDelays: {},
    customPayableAmounts: {},
  });

  // Modal states
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);
  const [activeLetterInvoice, setActiveLetterInvoice] = useState<Invoice | null>(null);

  // Switch profile handler
  const handleSelectProfile = (id: string) => {
    setProfileId(id);
    setActiveInterventions([]);
    if (id === 'apex-metalworks') {
      setInvoices(APEX_INVOICES);
      setPayables(APEX_PAYABLES);
      setWhatIfParams({
        extraDelayDays: 0,
        expenseSurgePercent: 0,
        emergencyCashInjection: 0,
        targetBuffer: APEX_PROFILE.targetSafetyBuffer,
        customInvoiceDelays: {},
        customPayableAmounts: {},
      });
    } else if (id === 'vanguard-wholesale') {
      setInvoices(VANGUARD_INVOICES);
      setPayables(VANGUARD_PAYABLES);
      setWhatIfParams({
        extraDelayDays: 0,
        expenseSurgePercent: 0,
        emergencyCashInjection: 0,
        targetBuffer: VANGUARD_PROFILE.targetSafetyBuffer,
        customInvoiceDelays: {},
        customPayableAmounts: {},
      });
    } else {
      setInvoices(SOLVENT_INVOICES);
      setPayables(SOLVENT_PAYABLES);
      setWhatIfParams({
        extraDelayDays: 0,
        expenseSurgePercent: 0,
        emergencyCashInjection: 0,
        targetBuffer: SOLVENT_PROFILE.targetSafetyBuffer,
        customInvoiceDelays: {},
        customPayableAmounts: {},
      });
    }
  };

  // Reset to factory sample data
  const handleResetData = () => {
    handleSelectProfile(profileId);
  };

  // Compute Baseline Forecast
  const baselineForecast = useMemo(() => {
    return computeDailyCashFlowForecast({
      profile: activeProfile,
      invoices,
      payables,
      scenario: currentScenario,
      interventions: [],
      daysHorizon,
    });
  }, [activeProfile, invoices, payables, currentScenario, daysHorizon]);

  // Compute Active Forecast (With currently applied interventions)
  const activeForecast = useMemo(() => {
    return computeDailyCashFlowForecast({
      profile: activeProfile,
      invoices,
      payables,
      scenario: currentScenario,
      interventions: activeInterventions,
      daysHorizon,
    });
  }, [activeProfile, invoices, payables, currentScenario, activeInterventions, daysHorizon]);

  // Compute What-If Simulated Forecast
  const simulatedForecast = useMemo(() => {
    const simProfile: CompanyProfile = {
      ...activeProfile,
      currentCash: activeProfile.currentCash + whatIfParams.emergencyCashInjection,
      targetSafetyBuffer: whatIfParams.targetBuffer,
    };

    const simScenario = {
      ...currentScenario,
      invoiceDelayShiftDays: currentScenario.invoiceDelayShiftDays + whatIfParams.extraDelayDays,
      unplannedExpenseMultiplier:
        currentScenario.unplannedExpenseMultiplier * (1 + whatIfParams.expenseSurgePercent / 100),
    };

    // Apply per-invoice and per-payable overrides
    const adjustedInvoices = invoices.map((inv) => {
      const extra = whatIfParams.customInvoiceDelays[inv.id];
      if (extra !== undefined) {
        const d = new Date(inv.expectedPaymentDate || inv.dueDate);
        d.setDate(d.getDate() + extra);
        return { ...inv, expectedPaymentDate: d.toISOString().split('T')[0] };
      }
      return inv;
    });

    const adjustedPayables = payables.map((pay) => {
      const customAmt = whatIfParams.customPayableAmounts[pay.id];
      if (customAmt !== undefined) {
        return { ...pay, amount: customAmt };
      }
      return pay;
    });

    return computeDailyCashFlowForecast({
      profile: simProfile,
      invoices: adjustedInvoices,
      payables: adjustedPayables,
      scenario: simScenario,
      interventions: activeInterventions,
      daysHorizon,
    });
  }, [activeProfile, invoices, payables, currentScenario, activeInterventions, whatIfParams, daysHorizon]);

  // Compute Solver Recommendation
  const solverResult = useMemo(() => {
    return solveLeastImpactSolvency({
      profile: activeProfile,
      invoices,
      payables,
      scenario: currentScenario,
      targetSafetyBuffer: activeProfile.targetSafetyBuffer,
    });
  }, [activeProfile, invoices, payables, currentScenario]);

  // Initial population of solver interventions if empty
  useEffect(() => {
    if (activeInterventions.length === 0 && solverResult.recommendedInterventions.length > 0) {
      setActiveInterventions(solverResult.recommendedInterventions);
    }
  }, [solverResult]);

  // CRUD Handlers for Invoices
  const handleAddInvoice = (newInv: Invoice) => {
    setInvoices((prev) => [newInv, ...prev]);
  };

  const handleUpdateInvoice = (updated: Invoice) => {
    setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  };

  // CRUD Handlers for Payables
  const handleAddPayable = (newPay: Payable) => {
    setPayables((prev) => [newPay, ...prev]);
  };

  const handleUpdatePayable = (updated: Payable) => {
    setPayables((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeletePayable = (id: string) => {
    setPayables((prev) => prev.filter((p) => p.id !== id));
  };

  const handleExtendPayable = (pay: Payable) => {
    const d = new Date(pay.dueDate);
    d.setDate(d.getDate() + 18);
    const newDueDate = d.toISOString().split('T')[0];
    handleUpdatePayable({
      ...pay,
      dueDate: newDueDate,
      status: 'deferred',
      notes: `${pay.notes ? pay.notes + ' · ' : ''}Extended 18 days for liquidity management`,
    });
  };

  const handleOfferDiscount = (inv: Invoice) => {
    const existing = activeInterventions.find((i) => i.relatedEntityId === inv.id);
    if (!existing) {
      const discountCost = Math.round(inv.amount * 0.02);
      const newIntervention: Intervention = {
        id: `discount-${inv.id}`,
        type: 'early_discount',
        title: `Offer 2% Early Pay Discount to ${inv.customerName}`,
        description: `Incentivize prompt remittance within 5 days for invoice ${inv.invoiceNumber} in exchange for 2% ($${discountCost.toLocaleString()}) discount.`,
        relatedEntityId: inv.id,
        cashBenefitAmount: inv.amount * 0.98,
        effectiveDayIndex: 5,
        cost: discountCost,
        disruptionScore: 1.5,
        isApplied: true,
        feasibility: 'high',
      };
      setActiveInterventions((prev) => [newIntervention, ...prev]);
    } else {
      setActiveInterventions((prev) =>
        prev.map((i) => (i.id === existing.id ? { ...i, isApplied: true } : i))
      );
    }
    setActiveTab('solver');
  };

  const hasAppliedInterventions = activeInterventions.some((i) => i.isApplied);

  const workspaceTabs: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }>; count?: number }[] = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'solver', label: 'Crisis Solver', icon: Zap, count: activeInterventions.filter((i) => i.isApplied).length },
    { id: 'forecast', label: 'Daily Ledger', icon: Calendar, count: 30 },
    { id: 'scenarios', label: 'Scenarios', icon: GitBranch, count: 3 },
    { id: 'whatif', label: 'What-If Sandbox', icon: Sliders },
    { id: 'invoices', label: 'Receivables', icon: FileText, count: invoices.filter((i) => i.status !== 'paid').length },
    { id: 'payables', label: 'Payables', icon: CreditCard, count: payables.filter((p) => p.status !== 'paid').length },
    { id: 'advisor', label: 'AI Advisory', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* 1. Header Navigation */}
      <NavigationHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedProfile={activeProfile}
        availableProfiles={profiles}
        onSelectProfile={handleSelectProfile}
        onResetData={handleResetData}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        isSolvent={activeForecast.isSolvent}
        minBalance={activeForecast.minimumBalance}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full flex-1">
        
        {/* Company Header & Ribbon */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {activeProfile.name}
              </h1>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 font-medium">
                {activeProfile.industry}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
              {activeProfile.description}
            </p>
          </div>

          {/* Quick Scenario & Horizon Tag */}
          <div className="flex items-center gap-2 self-start md:self-auto text-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className="text-slate-400">Scenario:</span>
              <button
                onClick={() => setActiveTab('scenarios')}
                className="font-semibold text-emerald-400 hover:underline cursor-pointer"
              >
                {currentScenario.name}
              </button>
            </div>

            {hasAppliedInterventions && (
              <div 
                onClick={() => setActiveTab('solver')}
                className="bg-emerald-950/40 border border-emerald-800/80 rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-emerald-300 font-medium cursor-pointer hover:bg-emerald-950/60 transition-colors"
                title="Click to view solver details"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Solver Overlay Active ({activeInterventions.filter((i) => i.isApplied).length})</span>
              </div>
            )}
          </div>
        </div>

        {/* PROMINENT WORKSPACE TAB BAR (Always Visible & Highly Interactive) */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 mb-5 border-b border-slate-800/80 bg-slate-900/40 p-1.5 rounded-xl no-scrollbar">
          {workspaceTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            const isSolverTab = tab.id === 'solver';
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-md border border-slate-700 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums ${
                    isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {isSolverTab && !activeForecast.isSolvent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* 2. Executive KPI Cards */}
        <SummaryKpiBar
          profile={activeProfile}
          forecast={hasAppliedInterventions ? activeForecast : baselineForecast}
          onOpenSolver={() => setActiveTab('solver')}
        />

        {/* 3. Early Warning Crisis Radar Banner */}
        <EarlyWarningBanner
          profile={activeProfile}
          forecast={baselineForecast}
          onLaunchSolver={() => setActiveTab('solver')}
          onViewLedger={() => setActiveTab('forecast')}
        />

        {/* 4. Tab Views Coordinator */}
        
        {/* TAB A: Executive Radar / Main Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Interactive Timeline SVG Chart */}
            <CashFlowChart
              baselinePoints={baselineForecast.forecastPoints}
              postInterventionPoints={hasAppliedInterventions ? activeForecast.forecastPoints : undefined}
              profile={activeProfile}
              daysHorizon={daysHorizon}
              onHorizonChange={setDaysHorizon}
              solverActive={hasAppliedInterventions && showSolverOverlay}
              onToggleSolverOverlay={() => setShowSolverOverlay(!showSolverOverlay)}
            />

            {/* Quick Live What-If Micro-Slider Strip on Dashboard */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <div>
                  <h4 className="text-xs font-bold text-white">Live Forecast Sensitivity Simulator</h4>
                  <p className="text-[11px] text-slate-400">Slide debtor delays or expense fluctuations to see immediate chart reaction.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-wrap w-full md:w-auto">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 text-[11px]">Debtor Delay:</span>
                  <input
                    type="range"
                    min="-15"
                    max="45"
                    step="5"
                    value={whatIfParams.extraDelayDays}
                    onChange={(e) =>
                      setWhatIfParams({ ...whatIfParams, extraDelayDays: Number(e.target.value) })
                    }
                    className="w-24 accent-emerald-500 cursor-pointer"
                  />
                  <span className="font-mono text-emerald-400 text-xs w-12 font-bold">
                    {whatIfParams.extraDelayDays > 0 ? `+${whatIfParams.extraDelayDays}d` : `${whatIfParams.extraDelayDays}d`}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 text-[11px]">Cost Surge:</span>
                  <input
                    type="range"
                    min="-20"
                    max="30"
                    step="5"
                    value={whatIfParams.expenseSurgePercent}
                    onChange={(e) =>
                      setWhatIfParams({ ...whatIfParams, expenseSurgePercent: Number(e.target.value) })
                    }
                    className="w-24 accent-amber-500 cursor-pointer"
                  />
                  <span className="font-mono text-amber-400 text-xs w-10 font-bold">
                    {whatIfParams.expenseSurgePercent}%
                  </span>
                </div>

                <button
                  onClick={() => setActiveTab('whatif')}
                  className="px-2.5 py-1 text-xs text-sky-400 hover:text-sky-300 font-semibold cursor-pointer underline whitespace-nowrap"
                >
                  Full Sandbox →
                </button>
              </div>
            </div>

            {/* Side-by-Side Quick Views */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Quick Solver Snapshot */}
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      Least-Impact Crisis Solver Preview
                    </h3>
                    <button
                      onClick={() => setActiveTab('solver')}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                    >
                      Open Full Solver →
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    {solverResult.summaryExplanation}
                  </p>

                  <div className="space-y-2">
                    {activeInterventions.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setActiveInterventions((prev) =>
                            prev.map((i) => (i.id === item.id ? { ...i, isApplied: !i.isApplied } : i))
                          );
                        }}
                        className={`border rounded-lg p-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          item.isApplied
                            ? 'bg-slate-900 border-emerald-500/40'
                            : 'bg-slate-900/40 border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={item.isApplied}
                            readOnly
                            className="accent-emerald-500 cursor-pointer"
                          />
                          <span className="font-medium text-slate-200 truncate pr-2">
                            {item.title}
                          </span>
                        </div>
                        <span className="font-mono text-emerald-400 font-bold shrink-0">
                          +${item.cashBenefitAmount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Disruption Score: <strong className="text-emerald-400 font-mono">{solverResult.totalDisruptionScore} / 10</strong></span>
                  <button
                    onClick={() => setActiveTab('solver')}
                    className="text-xs text-emerald-400 hover:underline font-bold"
                  >
                    Customize Plan
                  </button>
                </div>
              </div>

              {/* High-Risk Invoices Preview */}
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-sky-400" />
                      Top Accounts Receivable Delay Risks
                    </h3>
                    <button
                      onClick={() => setActiveTab('invoices')}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                    >
                      View All Receivables →
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Customer invoices with extended payment terms and historical delay tendencies creating forward liquidity pressure.
                  </p>

                  <div className="space-y-2">
                    {invoices
                      .filter((i) => i.status !== 'paid')
                      .slice(0, 3)
                      .map((inv) => (
                        <div
                          key={inv.id}
                          className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-white block">
                              {inv.customerName}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {inv.paymentTerms} · +{inv.historicalDelayDays}d avg lag
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <span className="font-mono font-bold text-white block">
                                ${inv.amount.toLocaleString()}
                              </span>
                              <span className={`text-[11px] font-mono font-semibold ${
                                inv.riskTier === 'high' || inv.riskTier === 'severe' ? 'text-rose-400' : 'text-amber-400'
                              }`}>
                                {inv.reliabilityScore}% Reliability
                              </span>
                            </div>
                            <button
                              onClick={() => handleOfferDiscount(inv)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400"
                              title="Offer 2% early prompt discount"
                            >
                              <Percent className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setActiveLetterInvoice(inv);
                                setActiveTab('advisor');
                              }}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400"
                              title="Draft AI collection letter"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>AI Advisor Copilot:</span>
                  <button
                    onClick={() => setActiveTab('advisor')}
                    className="text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
                  >
                    Generate Executive Briefing →
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB B: Dedicated Least-Impact Crisis Prevention Solver */}
        {activeTab === 'solver' && (
          <div className="space-y-6">
            <LeastImpactSolver
              profile={activeProfile}
              invoices={invoices}
              payables={payables}
              currentScenario={currentScenario}
              activeInterventions={activeInterventions}
              onApplyInterventions={setActiveInterventions}
              onClearInterventions={() => setActiveInterventions([])}
              onViewForecast={() => setActiveTab('dashboard')}
            />

            {/* Real-time comparison chart */}
            <CashFlowChart
              baselinePoints={baselineForecast.forecastPoints}
              postInterventionPoints={hasAppliedInterventions ? activeForecast.forecastPoints : undefined}
              profile={activeProfile}
              daysHorizon={daysHorizon}
              onHorizonChange={setDaysHorizon}
              solverActive={hasAppliedInterventions}
              onToggleSolverOverlay={() => setShowSolverOverlay(!showSolverOverlay)}
            />
          </div>
        )}

        {/* TAB C: Daily Cash Ledger */}
        {activeTab === 'forecast' && (
          <DailyLedgerTable
            forecastPoints={hasAppliedInterventions ? activeForecast.forecastPoints : baselineForecast.forecastPoints}
            profile={activeProfile}
          />
        )}

        {/* TAB D: Multi-Scenario Matrix */}
        {activeTab === 'scenarios' && (
          <ScenarioMatrix
            profile={activeProfile}
            invoices={invoices}
            payables={payables}
            activeScenarioId={activeScenarioId}
            onSelectScenario={(scen) => {
              setActiveScenarioId(scen);
              setActiveTab('dashboard');
            }}
          />
        )}

        {/* TAB E: What-If Sandbox */}
        {activeTab === 'whatif' && (
          <div className="space-y-6">
            <WhatIfSimulator
              params={whatIfParams}
              onChangeParams={setWhatIfParams}
              onResetParams={() =>
                setWhatIfParams({
                  extraDelayDays: 0,
                  expenseSurgePercent: 0,
                  emergencyCashInjection: 0,
                  targetBuffer: activeProfile.targetSafetyBuffer,
                  customInvoiceDelays: {},
                  customPayableAmounts: {},
                })
              }
              baselineForecast={baselineForecast}
              simulatedForecast={simulatedForecast}
              profile={activeProfile}
              invoices={invoices}
              payables={payables}
            />

            {/* Real-Time Visual Reaction Curve */}
            <CashFlowChart
              baselinePoints={baselineForecast.forecastPoints}
              postInterventionPoints={simulatedForecast.forecastPoints}
              profile={{ ...activeProfile, targetSafetyBuffer: whatIfParams.targetBuffer }}
              daysHorizon={daysHorizon}
              onHorizonChange={setDaysHorizon}
              solverActive={true}
            />
          </div>
        )}

        {/* TAB F: Accounts Receivable & Aging Matrix */}
        {activeTab === 'invoices' && (
          <InvoiceTable
            invoices={invoices}
            onAddInvoice={handleAddInvoice}
            onUpdateInvoice={handleUpdateInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onDraftLetter={(inv) => {
              setActiveLetterInvoice(inv);
              setActiveTab('advisor');
            }}
            onOfferDiscount={handleOfferDiscount}
          />
        )}

        {/* TAB G: Accounts Payable & Operational Disbursements */}
        {activeTab === 'payables' && (
          <PayablesTable
            payables={payables}
            onAddPayable={handleAddPayable}
            onUpdatePayable={handleUpdatePayable}
            onDeletePayable={handleDeletePayable}
            onExtendTerms={handleExtendPayable}
          />
        )}

        {/* TAB H: AI Financial Advisor */}
        {activeTab === 'advisor' && (
          <AiAdvisorPanel
            profile={activeProfile}
            forecast={hasAppliedInterventions ? activeForecast : baselineForecast}
            solverResult={solverResult}
            invoices={invoices}
            payables={payables}
            activeLetterInvoice={activeLetterInvoice}
            onCloseLetterModal={() => setActiveLetterInvoice(null)}
          />
        )}

      </main>

      {/* 5. Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0B0F19] py-5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white tracking-wider">FINSIGHT</span>
            <span>·</span>
            <span>AI-Powered Financial Advisory for Small Manufacturing & Wholesale</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMethodologyOpen(true)}
              className="hover:text-slate-300 transition-colors cursor-pointer underline"
            >
              Methodology & Research Governance
            </button>
            <span>·</span>
            <span>Chennai Institute of Technology</span>
          </div>
        </div>
      </footer>

      {/* 6. Methodology & Research Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />

    </div>
  );
}
