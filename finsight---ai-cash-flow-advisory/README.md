# Finsight: AI-Powered Financial Advisory & Cash-Flow Crisis Prevention

> *"Cash-flow crises are easier to prevent than to service."*
> **Chennai Institute of Technology — B.E. Computer Science & Engineering**

---

## 1. Executive Overview

Small manufacturing and wholesale businesses can appear financially healthy and report solid accounting profits while silently approaching an acute cash-flow crisis. 

Because manufacturing and wholesale businesses sell on credit terms (**Net-30, Net-60, Net-90**) and must procure raw materials and pay labor on fixed, non-negotiable schedules, delayed customer payments create a **dangerous liquidity blindspot**.

**Finsight** bridges the gap between paper profitability and actual cash survival by providing:
1. **Daily Cash-Flow Forecasting Engine**: Calculates future balances day-by-day (1 to 30/60/90 days) using dated inflows and disbursements.
2. **Early-Warning Liquidity Radar**: Alerts founders to impending shortfalls weeks in advance, pinpointing the exact date and primary drivers.
3. **Multi-Scenario Simulation**: Models Optimistic, Expected, and Pessimistic cases with customer invoice payment delays of 30 and 60 days.
4. **Least-Impact Solvency Solver**: An algorithmic optimizer that calculates the minimal, lowest-friction combination of realistic levers (capex postponement, supplier term renegotiation, prompt remittance discounts, factoring, and credit facility) to keep cash above a selected safety buffer.
5. **Customer Payment Reliability Analyzer**: Scores debtor predictability (0–100%) based on payment terms, historical delay habits, and delinquency status.
6. **AI Financial Advisor (Gemini 3.8 Flash)**: Produces executive diagnostic reviews and drafts targeted, relationship-preserving collection letters.

---

## 2. Technical Architecture

Finsight is built as a production-grade full-stack web application:

- **Frontend**: React 19 + TypeScript + Vite, styled with Tailwind CSS v4 in a high-contrast dark fintech command center aesthetic.
- **Backend API**: Express server (`server.ts`) hosting server-side Gemini 3.8 Flash calls using the official `@google/genai` TypeScript SDK with telemetry headers.
- **State Management**: Reactive in-memory financial ledger with preset data profiles and local overrides.
- **Visualization**: Custom SVG time-series charts with zero third-party chart bundle bloat, responsive viewports, and hover inspection tooltips.

---

## 3. Mathematical Methodology & Formulation

### 3.1 Daily Balance Progression
$$\text{Balance}_t = \text{Balance}_{t-1} + \sum_{i \in \text{Inflows}_t} I_i - \sum_{j \in \text{Outflows}_t} O_j$$

Where:
- $\text{Balance}_0 = \text{Current Liquid Bank Balance}$.
- $\text{Inflows}_t$: Accounts receivable due on day $t$, where:
  $$\text{EffectiveDate}_i = \text{DueDate}_i + \text{HistoricalDelayDays}_i + \text{ScenarioDelayShift}$$
- $\text{Outflows}_t$: Scheduled operational disbursements (payroll, raw material payables, equipment leases, utility bills) on day $t$.

### 3.2 Customer Reliability Scoring Model
Reliability score $R_i \in [5, 99]$ is computed empirically:
$$R_i = \text{Base} (95) - f(\text{DelayDays}) - g(\text{PaymentTerms}) - h(\text{DaysPastDue})$$
- **Low Risk ($\ge 80\%$)**: On-time payers with minimal delay history.
- **Moderate Risk ($60\% - 79\%$)**: 7–15 days average delay.
- **High Risk ($40\% - 59\%$)**: Chronic 15–30 day delay cycles.
- **Severe Risk ($< 40\%$)**: Delinquent accounts with $>30$ days lag.

### 3.3 Least-Impact Solver Optimization
When $\min_{t} (\text{Balance}_t) < \text{TargetSafetyBuffer}$, the solver evaluates candidate interventions $x_k \in \{0, 1\}$:
$$\min \sum_k \left( x_k \cdot (\text{DisruptionScore}_k \times 1000 + \text{FinancialCost}_k) \right)$$
$$\text{subject to: } \min_{t \in [1..30]} \text{Balance}_t(\mathbf{x}) \ge \text{TargetSafetyBuffer}$$

The algorithm prioritizes:
1. **Low-impact internal levers** (deferring discretionary capex, negotiating temporary 18-day supplier extensions, offering 2% prompt remittance discounts).
2. **External capital levers** (selective invoice factoring, drawing bank revolving lines of credit) only when internal measures are insufficient.

---

## 4. Grounding in Empirical Research

Finsight incorporates research findings from the **Federal Reserve Banks (2023, 2024, 2025) Small Business Credit Surveys**:
- **Payment Challenges**: Over 64% of small businesses experience payment-related challenges; customer payment delays are the leading cause of unexpected liquidity crunches.
- **Revenue Headwinds**: While business expectations remained stable, more small businesses reported declining revenues than increasing revenues for the first time since 2021.
- **Lender Satisfaction**: Approval rates stayed steady, but businesses reported lower satisfaction with traditional institutional lenders, reinforcing the need for intelligent internal working capital optimization.

---

## 5. Local Setup & Quickstart

### Prerequisites
- Node.js $\ge 20$
- npm or yarn

### Installation
```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables (optional for live Gemini API)
cp .env.example .env
# Edit .env to add your GEMINI_API_KEY if desired.
# Note: Finsight includes robust deterministic fallbacks if no key is provided.

# 3. Start development server
npm run dev

# 4. Open browser
http://localhost:3000
```

---

## 6. Uncertainty Boundaries & Disclaimer

Finsight does not claim absolute real-world predictive certainty without ongoing calibration. All projections are deterministic simulations based on the user's recorded invoices, contractual terms, and explicit scenario parameters. AI strategic insights are decision-support guidelines and do not constitute formal certified accounting or legal counsel.
