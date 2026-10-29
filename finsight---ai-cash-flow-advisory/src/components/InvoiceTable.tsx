import React, { useState } from 'react';
import { 
  Plus, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Percent, 
  Mail, 
  Edit2, 
  Trash2,
  Calendar,
  X,
  Search,
  Check
} from 'lucide-react';
import { Invoice, PaymentTerms, RiskTier } from '../types/finance';
import { calculateReliabilityScore, computeExpectedPaymentDate } from '../utils/reliabilityScorer';

interface InvoiceTableProps {
  invoices: Invoice[];
  onAddInvoice: (invoice: Invoice) => void;
  onUpdateInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onDraftLetter: (invoice: Invoice) => void;
  onOfferDiscount: (invoice: Invoice) => void;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  onAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  onDraftLetter,
  onOfferDiscount,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | 'high' | 'moderate' | 'low' | 'paid'>('all');
  const [notification, setNotification] = useState<string | null>(null);

  // Form states for Add / Edit Invoice
  const [customerName, setCustomerName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('2026-11-15');
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>('Net-30');
  const [historicalDelay, setHistoricalDelay] = useState('5');
  const [industrySegment, setIndustrySegment] = useState('Manufacturing');

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !amount) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const delayDays = parseInt(historicalDelay) || 0;
    const { score, riskTier } = calculateReliabilityScore({
      historicalDelayDays: delayDays,
      paymentTerms,
    });
    const expectedDate = computeExpectedPaymentDate(dueDate, delayDays);

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invoiceNumber || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName,
      amount: numAmount,
      issueDate: '2026-10-15',
      dueDate,
      expectedPaymentDate: expectedDate,
      paymentTerms,
      status: 'pending',
      historicalDelayDays: delayDays,
      reliabilityScore: score,
      riskTier,
      industrySegment,
    };

    onAddInvoice(newInvoice);
    setIsAdding(false);
    showToast(`Added receivable ${newInvoice.invoiceNumber} ($${numAmount.toLocaleString()})`);
    setCustomerName('');
    setAmount('');
    setInvoiceNumber('');
  };

  const handleStartEdit = (inv: Invoice) => {
    setEditingInvoice(inv);
    setCustomerName(inv.customerName);
    setInvoiceNumber(inv.invoiceNumber);
    setAmount(inv.amount.toString());
    setDueDate(inv.dueDate);
    setPaymentTerms(inv.paymentTerms);
    setHistoricalDelay(inv.historicalDelayDays.toString());
    setIndustrySegment(inv.industrySegment);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const delayDays = parseInt(historicalDelay) || 0;
    const { score, riskTier } = calculateReliabilityScore({
      historicalDelayDays: delayDays,
      paymentTerms,
    });
    const expectedDate = computeExpectedPaymentDate(dueDate, delayDays);

    const updated: Invoice = {
      ...editingInvoice,
      customerName,
      invoiceNumber,
      amount: numAmount,
      dueDate,
      expectedPaymentDate: expectedDate,
      paymentTerms,
      historicalDelayDays: delayDays,
      reliabilityScore: score,
      riskTier,
      industrySegment,
    };

    onUpdateInvoice(updated);
    setEditingInvoice(null);
    showToast(`Updated invoice ${updated.invoiceNumber}`);
  };

  const handleMarkPaid = (inv: Invoice) => {
    const nextStatus = inv.status === 'paid' ? 'pending' : 'paid';
    onUpdateInvoice({
      ...inv,
      status: nextStatus,
    });
    showToast(nextStatus === 'paid' ? `Invoice ${inv.invoiceNumber} marked as collected` : `Invoice ${inv.invoiceNumber} set to pending`);
  };

  // Filtered list
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.industrySegment.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTier === 'all') return true;
    if (filterTier === 'paid') return inv.status === 'paid';
    if (filterTier === 'high') return (inv.riskTier === 'high' || inv.riskTier === 'severe') && inv.status !== 'paid';
    if (filterTier === 'moderate') return inv.riskTier === 'moderate' && inv.status !== 'paid';
    if (filterTier === 'low') return inv.riskTier === 'low' && inv.status !== 'paid';
    return true;
  });

  const totalReceivables = invoices
    .filter((i) => i.status !== 'paid')
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden mb-6">
      
      {/* Toast Notification */}
      {notification && (
        <div className="bg-emerald-950/80 border-b border-emerald-800/80 px-4 py-2 text-xs text-emerald-300 font-medium flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">
              Customer Accounts Receivable & Reliability Aging Matrix
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirical reliability scoring calculated from payment terms, customer settlement history, and delay variance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-300 font-mono tabular-nums">
            Total Outstanding:{' '}
            <strong className="text-emerald-400 font-bold">
              ${totalReceivables.toLocaleString()}
            </strong>
          </div>

          <button
            onClick={() => {
              setCustomerName('');
              setInvoiceNumber('');
              setAmount('');
              setDueDate('2026-11-15');
              setPaymentTerms('Net-30');
              setHistoricalDelay('5');
              setIsAdding(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Receivable</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Ribbon */}
      <div className="px-4 py-2.5 bg-slate-900/40 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer, invoice #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-md pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'All Invoices' },
            { id: 'high', label: 'High Risk / Lag' },
            { id: 'moderate', label: 'Moderate' },
            { id: 'low', label: 'Reliable' },
            { id: 'paid', label: 'Collected' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterTier(f.id as any)}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer whitespace-nowrap ${
                filterTier === f.id
                  ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-sans uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-4 font-semibold">Customer / Segment</th>
              <th className="py-2.5 px-4 font-semibold">Invoice #</th>
              <th className="py-2.5 px-4 font-semibold text-right">Amount</th>
              <th className="py-2.5 px-4 font-semibold">Terms</th>
              <th className="py-2.5 px-4 font-semibold">Due Date</th>
              <th className="py-2.5 px-4 font-semibold">Expected Inflow</th>
              <th className="py-2.5 px-4 font-semibold text-center">Delay Track Record</th>
              <th className="py-2.5 px-4 font-semibold text-center">Reliability</th>
              <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
            {filteredInvoices.map((inv) => {
              const isPaid = inv.status === 'paid';
              const isSevere = inv.riskTier === 'severe';
              const isHigh = inv.riskTier === 'high';
              const isLow = inv.riskTier === 'low';

              return (
                <tr
                  key={inv.id}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    isPaid ? 'opacity-50' : isSevere ? 'bg-rose-950/10' : ''
                  }`}
                >
                  {/* Customer */}
                  <td className="py-2.5 px-4 font-sans text-slate-200 font-medium">
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{inv.customerName}</span>
                      <span className="text-[11px] text-slate-400">{inv.industrySegment}</span>
                    </div>
                  </td>

                  {/* Invoice # */}
                  <td className="py-2.5 px-4 text-slate-400 font-mono">
                    {inv.invoiceNumber}
                  </td>

                  {/* Amount */}
                  <td className="py-2.5 px-4 text-right font-bold text-white">
                    ${inv.amount.toLocaleString()}
                  </td>

                  {/* Terms */}
                  <td className="py-2.5 px-4 text-slate-300 font-sans">
                    {inv.paymentTerms}
                  </td>

                  {/* Contract Due Date */}
                  <td className="py-2.5 px-4 text-slate-400">
                    {inv.dueDate}
                  </td>

                  {/* Expected Inflow (Adjusted) */}
                  <td className="py-2.5 px-4 font-semibold text-emerald-400">
                    {inv.expectedPaymentDate}
                  </td>

                  {/* Delay Track Record */}
                  <td className="py-2.5 px-4 text-center font-sans">
                    <span className={inv.historicalDelayDays > 15 ? 'text-rose-400 font-medium' : 'text-slate-300'}>
                      +{inv.historicalDelayDays}d avg lag
                    </span>
                  </td>

                  {/* Reliability Score */}
                  <td className="py-2.5 px-4 text-center">
                    <div className="flex flex-col items-center">
                      <span
                        className={`font-bold text-xs ${
                          isLow ? 'text-emerald-400' : isHigh || isSevere ? 'text-rose-400' : 'text-amber-400'
                        }`}
                      >
                        {inv.reliabilityScore}%
                      </span>
                      <span className="text-[10px] text-slate-500 font-sans">
                        {inv.riskTier}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-4 text-right font-sans">
                    <div className="flex items-center justify-end gap-1">
                      {/* Early Discount Button */}
                      {!isPaid && (
                        <button
                          onClick={() => {
                            onOfferDiscount(inv);
                            showToast(`Applied 2% prompt discount solver lever for ${inv.customerName}`);
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Offer 2% prompt remittance incentive"
                        >
                          <Percent className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* AI Collection Letter Draft */}
                      {!isPaid && (
                        <button
                          onClick={() => onDraftLetter(inv)}
                          className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Generate AI collection/acceleration letter"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Edit Invoice */}
                      <button
                        onClick={() => handleStartEdit(inv)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        title="Edit receivable terms or expected dates"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Mark Paid Toggle */}
                      <button
                        onClick={() => handleMarkPaid(inv)}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${
                          isPaid ? 'text-emerald-400 bg-emerald-950/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                        title={isPaid ? 'Mark Pending' : 'Mark as Collected'}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          onDeleteInvoice(inv.id);
                          showToast(`Deleted invoice ${inv.invoiceNumber}`);
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        title="Delete invoice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-8 text-slate-500 font-sans">
                  No invoices match your current filter. Click &quot;Add Receivable&quot; to log a new invoice.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Invoice Modal */}
      {(isAdding || editingInvoice) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white">
                {editingInvoice ? `Edit Invoice ${editingInvoice.invoiceNumber}` : 'Log New Customer Receivable'}
              </h3>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingInvoice(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingInvoice ? handleSaveEdit : handleCreateInvoice} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Lockheed Aerostructures"
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Invoice Number</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="INV-2026-905"
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Amount ($)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="25000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Contract Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Payment Terms</label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value as PaymentTerms)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Net-15">Net-15</option>
                    <option value="Net-30">Net-30</option>
                    <option value="Net-45">Net-45</option>
                    <option value="Net-60">Net-60</option>
                    <option value="Net-90">Net-90</option>
                    <option value="Due on Receipt">Due on Receipt</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Hist. Avg Delay (Days)</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={historicalDelay}
                    onChange={(e) => setHistoricalDelay(e.target.value)}
                    placeholder="e.g. 14"
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Industry Segment</label>
                  <input
                    type="text"
                    value={industrySegment}
                    onChange={(e) => setIndustrySegment(e.target.value)}
                    placeholder="Aerospace OEM"
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingInvoice(null);
                  }}
                  className="px-3 py-1.5 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer"
                >
                  {editingInvoice ? 'Save Changes' : 'Add Receivable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
