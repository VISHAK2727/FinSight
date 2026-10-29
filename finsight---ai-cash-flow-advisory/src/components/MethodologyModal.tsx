import React from 'react';
import { 
  X, 
  BookOpen, 
  HelpCircle, 
  Scale, 
  ShieldCheck, 
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#111827] border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl my-8 max-h-[85vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Finsight Methodology, Mathematical Models & Reliability Governance
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
          
          {/* Section 1: Core Problem & The Blindspot */}
          <div>
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              1. The Blindspot Between Profit and Survival
            </h3>
            <p className="text-slate-400">
              Small manufacturing and wholesale businesses routinely record positive net accounting profit on paper 
              while silently approaching liquidity insolvency. Unlike retail businesses with instant Point-of-Sale cash settlement, 
              B2B manufacturers operate with Net-30 and Net-60 credit terms. When high-value customers delay remittance by 20 to 45 days, 
              unfunded working capital deficits emerge directly ahead of non-negotiable statutory payroll and raw material commitments.
            </p>
          </div>

          {/* Section 2: Mathematical Formulation */}
          <div>
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              2. Daily Cash-Flow Balance Equation
            </h3>
            <p className="text-slate-400 mb-2">
              The daily cash-flow trajectory is modeled deterministically day-by-day across a 30-to-90 day forward horizon:
            </p>
            <div className="bg-[#0B0F19] border border-slate-800 rounded-lg p-3 font-mono text-emerald-400 text-xs">
              Balance(t) = Balance(t - 1) + ∑ Inflows(t) - ∑ Outflows(t)
            </div>
            <p className="text-slate-400 mt-2">
              Where <strong className="text-slate-200">Inflows(t)</strong> represent receivables whose expected payment date 
              (contractual due date adjusted for historical debtor delay habits) equals day <span className="font-mono">t</span>, 
              and <strong className="text-slate-200">Outflows(t)</strong> represent scheduled operational disbursements.
            </p>
          </div>

          {/* Section 3: Customer Reliability Scoring Logic */}
          <div>
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              3. Empirical Reliability Scoring Formula
            </h3>
            <p className="text-slate-400 mb-2">
              Customer reliability scores (0–100%) quantify payment predictability based on:
            </p>
            <ul className="space-y-1 list-disc pl-4 text-slate-400">
              <li><strong className="text-slate-200">Historical Delay Penalty:</strong> Penalizes chronic lag (&gt;15 days delay reduces score by 30+ points).</li>
              <li><strong className="text-slate-200">Payment Terms Risk:</strong> Net-60 and Net-90 agreements carry higher variance adjustments.</li>
              <li><strong className="text-slate-200">Delinquency Velocity:</strong> Applies real-time score degradation as invoices age past contractual due dates.</li>
            </ul>
          </div>

          {/* Section 4: Least-Impact Solver Optimization */}
          <div>
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              4. Least-Impact Intervention Solver Algorithm
            </h3>
            <p className="text-slate-400 mb-2">
              When the baseline forecast projects a cash deficit or safety buffer breach (<span className="font-mono">Balance(t) &lt; TargetBuffer</span>), 
              the solver evaluates candidate working capital levers to minimize total disruption:
            </p>
            <div className="bg-[#0B0F19] border border-slate-800 rounded-lg p-3 font-mono text-xs text-sky-400">
              Minimize Objective = ∑ (DisruptionScore_i × 1000) + TotalFinancialCost_i
              <br />
              Subject to: Minimum_Balance(1..30) ≥ TargetSafetyBuffer
            </div>
            <p className="text-slate-400 mt-2">
              The algorithm evaluates low-friction internal levers (capex postponement, supplier term renegotiation, 2% early payment customer discounts) 
              before resorting to high-cost invoice factoring or debt facility draws.
            </p>
          </div>

          {/* Section 5: Federal Reserve Research Grounding */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              Research Citations: Federal Reserve Small Business Credit Surveys
            </h3>
            <p className="text-slate-400 text-xs mb-2">
              Finsight&apos;s models are grounded in empirical findings from the <strong>Federal Reserve Banks (2023, 2024, 2025) Small Business Credit Surveys</strong>:
            </p>
            <ul className="space-y-1 text-slate-400 text-xs list-disc pl-4">
              <li>Over 64% of small businesses report payment-related challenges, with delayed customer payments as the single largest contributor to unexpected liquidity crunches.</li>
              <li>While business expectations remained stable from 2023 to 2024, more small businesses reported declining revenues than increasing revenues for the first time since 2021.</li>
              <li>Loan approval rates remained steady, but small business owners reported decreasing satisfaction with traditional commercial lenders, highlighting the vital need for non-dilutive, internal working capital management.</li>
            </ul>
          </div>

          {/* Section 6: Limitations & Boundaries Disclaimer */}
          <div className="border-t border-slate-800 pt-4 text-slate-400 text-xs">
            <h4 className="font-bold text-white mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Uncertainty Boundaries & Ethical AI Governance
            </h4>
            <p>
              Finsight does not claim absolute real-world statistical prediction accuracy without continuous empirical validation. 
              All cash calculations are deterministic simulations based explicitly on the user&apos;s recorded invoices, terms, and scenario parameters. 
              The AI advisory engine serves as strategic decision support and does not replace certified public accountants or legal counsel.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-5 border-t border-slate-800 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>

      </div>
    </div>
  );
};
