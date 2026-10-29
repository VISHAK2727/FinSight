import React from 'react';
import { 
  Building2, 
  RotateCcw, 
  HelpCircle, 
  ShieldCheck, 
  AlertTriangle,
  LayoutDashboard,
  Zap,
  Calendar,
  GitBranch,
  Sliders,
  FileText,
  CreditCard,
  Sparkles
} from 'lucide-react';
import { CompanyProfile } from '../types/finance';

export type ActiveTab = 
  | 'dashboard' 
  | 'solver' 
  | 'forecast' 
  | 'scenarios' 
  | 'whatif' 
  | 'invoices' 
  | 'payables' 
  | 'advisor';

interface NavigationHeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  selectedProfile: CompanyProfile;
  availableProfiles: CompanyProfile[];
  onSelectProfile: (profileId: string) => void;
  onResetData: () => void;
  onOpenMethodology: () => void;
  isSolvent: boolean;
  minBalance: number;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  activeTab,
  onTabChange,
  selectedProfile,
  availableProfiles,
  onSelectProfile,
  onResetData,
  onOpenMethodology,
  isSolvent,
  minBalance,
}) => {
  const tabs: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'solver', label: 'Crisis Solver', icon: Zap },
    { id: 'forecast', label: 'Daily Ledger', icon: Calendar },
    { id: 'scenarios', label: 'Scenarios', icon: GitBranch },
    { id: 'whatif', label: 'What-If Sandbox', icon: Sliders },
    { id: 'invoices', label: 'Receivables', icon: FileText },
    { id: 'payables', label: 'Payables', icon: CreditCard },
    { id: 'advisor', label: 'AI Advisory', icon: Sparkles },
  ];

  return (
    <header className="border-b border-slate-800 bg-[#0B0F19] sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Zone 1: Brand Wordmark */}
          <div 
            onClick={() => onTabChange('dashboard')}
            className="flex items-center gap-2.5 shrink-0 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-slate-950 text-base shadow-sm group-hover:ring-2 group-hover:ring-emerald-400/40 transition-all">
              F
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold tracking-tight text-white uppercase group-hover:text-emerald-300 transition-colors">
                  FINSIGHT
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  v2.0
                </span>
              </div>
              <span className="hidden sm:block text-[11px] text-slate-400 font-medium -mt-0.5">
                AI Cash Flow Advisory
              </span>
            </div>
          </div>

          {/* Zone 2: Fast Desktop Nav Links */}
          <nav className="hidden xl:flex items-center gap-1 overflow-x-auto py-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const isSolverTab = tab.id === 'solver';
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {isSolverTab && !isSolvent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions & Profile Selector */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Solvency Status Pill */}
            <div 
              onClick={() => onTabChange(isSolvent ? 'forecast' : 'solver')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono tabular-nums border cursor-pointer transition-all ${
                isSolvent
                  ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-400 hover:bg-emerald-950/50'
                  : 'bg-rose-950/30 border-rose-800/60 text-rose-400 hover:bg-rose-950/50 animate-pulse'
              }`}
              title={isSolvent ? 'Company is fully solvent' : 'Liquidity shortfall detected - Click to solve'}
            >
              {isSolvent ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold hidden sm:inline">Solvent</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span className="font-semibold hidden sm:inline">Shortfall Alert</span>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-md px-2 py-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:inline" />
              <select
                value={selectedProfile.id}
                onChange={(e) => onSelectProfile(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none font-medium cursor-pointer max-w-[140px] sm:max-w-[180px] truncate"
                title="Select company profile"
              >
                {availableProfiles.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.name.split('LLC')[0].split('Co.')[0]}
                  </option>
                ))}
              </select>
            </div>

            {/* Methodology Button */}
            <button
              onClick={onOpenMethodology}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              title="Methodology, Math & Fed Reserve Research"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Reset Factory Sample Data Button */}
            <button
              onClick={onResetData}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              title="Reset data to factory sample state"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
