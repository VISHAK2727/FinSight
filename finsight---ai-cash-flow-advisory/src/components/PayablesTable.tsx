import React, { useState } from 'react';
import { 
  Plus, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  Trash2, 
  X, 
  Calendar,
  AlertTriangle,
  Edit2,
  Search,
  Check
} from 'lucide-react';
import { Payable, PayableCategory, PayablePriority } from '../types/finance';

interface PayablesTableProps {
  payables: Payable[];
  onAddPayable: (payable: Payable) => void;
  onUpdatePayable: (payable: Payable) => void;
  onDeletePayable: (payableId: string) => void;
  onExtendTerms: (payable: Payable) => void;
}

export const PayablesTable: React.FC<PayablesTableProps> = ({
  payables,
  onAddPayable,
  onUpdatePayable,
  onDeletePayable,
  onExtendTerms,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingPayable, setEditingPayable] = useState<Payable | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<'all' | 'critical' | 'standard' | 'flexible' | 'paid'>('all');
  const [notification, setNotification] = useState<string | null>(null);

  // Form states
  const [vendorName, setVendorName] = useState('');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('2026-11-20');
  const [category, setCategory] = useState<PayableCategory>('raw_materials');
  const [priority, setPriority] = useState<PayablePriority>('standard');
  const [notes, setNotes] = useState('');

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreatePayable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName || !amount) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const newPayable: Payable = {
      id: `pay-${Date.now()}`,
      reference: reference || `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
      vendorName,
      amount: numAmount,
      dueDate,
      category,
      priority,
      status: 'scheduled',
      notes,
    };

    onAddPayable(newPayable);
    setIsAdding(false);
    showToast(`Scheduled payable ${newPayable.reference} ($${numAmount.toLocaleString()})`);
    setVendorName('');
    setAmount('');
    setReference('');
    setNotes('');
  };

  const handleStartEdit = (pay: Payable) => {
    setEditingPayable(pay);
    setVendorName(pay.vendorName);
    setReference(pay.reference);
    setAmount(pay.amount.toString());
    setDueDate(pay.dueDate);
    setCategory(pay.category);
    setPriority(pay.priority);
    setNotes(pay.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayable) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const updated: Payable = {
      ...editingPayable,
      vendorName,
      reference,
      amount: numAmount,
      dueDate,
      category,
      priority,
      notes,
    };

    onUpdatePayable(updated);
    setEditingPayable(null);
    showToast(`Updated obligation ${updated.reference}`);
  };

  const handleTogglePaid = (p: Payable) => {
    const nextStatus = p.status === 'paid' ? 'scheduled' : 'paid';
    onUpdatePayable({
      ...p,
      status: nextStatus,
    });
    showToast(nextStatus === 'paid' ? `Disbursement ${p.reference} marked as paid` : `Disbursement ${p.reference} set to scheduled`);
  };

  const handleExtend = (pay: Payable) => {
    onExtendTerms(pay);
    showToast(`Negotiated +18 day extension for ${pay.vendorName.split('(')[0]}`);
  };

  // Filtered list
  const filteredPayables = payables.filter((p) => {
    const matchesSearch =
      p.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterPriority === 'all') return true;
    if (filterPriority === 'paid') return p.status === 'paid';
    if (filterPriority === 'critical') return p.priority === 'critical' && p.status !== 'paid';
    if (filterPriority === 'standard') return p.priority === 'standard' && p.status !== 'paid';
    if (filterPriority === 'flexible') return p.priority === 'flexible' && p.status !== 'paid';
    return true;
  });

  const totalPayables = payables
    .filter((p) => p.status !== 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

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
            <CreditCard className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">
              Accounts Payable & Operational Disbursement Ledger
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Classified obligations by statutory priority (critical payroll, standard vendor invoices, flexible capex).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-300 font-mono tabular-nums">
            Total Scheduled:{' '}
            <strong className="text-rose-400 font-bold">
              ${totalPayables.toLocaleString()}
            </strong>
          </div>

          <button
            onClick={() => {
              setVendorName('');
              setReference('');
              setAmount('');
              setDueDate('2026-11-20');
              setCategory('raw_materials');
              setPriority('standard');
              setNotes('');
              setIsAdding(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Payable</span>
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
            placeholder="Search vendor, reference #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-md pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'All Payables' },
            { id: 'critical', label: 'Critical (Payroll/Utility)' },
            { id: 'standard', label: 'Standard (Vendors)' },
            { id: 'flexible', label: 'Flexible (Capex)' },
            { id: 'paid', label: 'Settled' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterPriority(f.id as any)}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer whitespace-nowrap ${
                filterPriority === f.id
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
              <th className="py-2.5 px-4 font-semibold">Vendor / Obligation</th>
              <th className="py-2.5 px-4 font-semibold">Ref #</th>
              <th className="py-2.5 px-4 font-semibold">Category</th>
              <th className="py-2.5 px-4 font-semibold text-right">Amount</th>
              <th className="py-2.5 px-4 font-semibold">Due Date</th>
              <th className="py-2.5 px-4 font-semibold text-center">Priority</th>
              <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
            {filteredPayables.map((pay) => {
              const isPaid = pay.status === 'paid';
              const isDeferred = pay.status === 'deferred';
              const isCritical = pay.priority === 'critical';
              const isFlexible = pay.priority === 'flexible';

              return (
                <tr
                  key={pay.id}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    isPaid ? 'opacity-50' : isCritical ? 'bg-slate-900/40' : ''
                  }`}
                >
                  {/* Vendor */}
                  <td className="py-2.5 px-4 font-sans text-slate-200 font-medium">
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{pay.vendorName}</span>
                      {pay.notes && (
                        <span className="text-[11px] text-slate-400 truncate max-w-xs">{pay.notes}</span>
                      )}
                    </div>
                  </td>

                  {/* Ref # */}
                  <td className="py-2.5 px-4 text-slate-400 font-mono">
                    {pay.reference}
                  </td>

                  {/* Category */}
                  <td className="py-2.5 px-4 text-slate-300 font-sans">
                    {pay.category.replace('_', ' ')}
                  </td>

                  {/* Amount */}
                  <td className="py-2.5 px-4 text-right font-bold text-rose-400">
                    ${pay.amount.toLocaleString()}
                  </td>

                  {/* Due Date */}
                  <td className="py-2.5 px-4 text-slate-300">
                    {pay.dueDate}
                    {isDeferred && (
                      <span className="text-[10px] text-amber-400 ml-1.5 font-sans">
                        (Extended)
                      </span>
                    )}
                  </td>

                  {/* Priority */}
                  <td className="py-2.5 px-4 text-center font-sans">
                    <span
                      className={`text-xs font-semibold ${
                        isCritical
                          ? 'text-rose-400'
                          : isFlexible
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {pay.priority}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-4 text-right font-sans">
                    <div className="flex items-center justify-end gap-1">
                      {/* Term Extension */}
                      {!isPaid && !isCritical && (
                        <button
                          onClick={() => handleExtend(pay)}
                          className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium transition-colors cursor-pointer"
                          title="Simulate +18-day supplier payment term extension"
                        >
                          +18d Term
                        </button>
                      )}

                      {/* Edit Payable */}
                      <button
                        onClick={() => handleStartEdit(pay)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        title="Edit payable details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Mark Paid Toggle */}
                      <button
                        onClick={() => handleTogglePaid(pay)}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${
                          isPaid ? 'text-emerald-400 bg-emerald-950/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                        title={isPaid ? 'Mark Scheduled' : 'Mark as Paid / Disbursed'}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          onDeletePayable(pay.id);
                          showToast(`Deleted obligation ${pay.reference}`);
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        title="Delete payable entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredPayables.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-500 font-sans">
                  No disbursements match your current filter. Click &quot;Add Payable&quot; to log a scheduled payment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Payable Modal */}
      {(isAdding || editingPayable) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white">
                {editingPayable ? `Edit Obligation ${editingPayable.reference}` : 'Schedule New Operational Payable'}
              </h3>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingPayable(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingPayable ? handleSaveEdit : handleCreatePayable} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Vendor / Obligation Name</label>
                <input
                  type="text"
                  required
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="e.g. Kaiser Specialty Metals"
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Reference / PO #</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="PO-4059"
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
                    placeholder="18000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PayableCategory)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="raw_materials">Raw Materials</option>
                    <option value="payroll">Payroll (Statutory)</option>
                    <option value="equipment_lease">Equipment Lease</option>
                    <option value="facility_utilities">Facility Utilities</option>
                    <option value="freight_logistics">Freight & Logistics</option>
                    <option value="general_overhead">General Overhead</option>
                    <option value="debt_service">Debt Service</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PayablePriority)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="critical">Critical (Non-negotiable, e.g. Payroll)</option>
                  <option value="standard">Standard (Vendor invoice, amenable to term stretch)</option>
                  <option value="flexible">Flexible (Discretionary maintenance / capex)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Operational Notes (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Net-30 term; amenable to 15-day extension"
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingPayable(null);
                  }}
                  className="px-3 py-1.5 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer"
                >
                  {editingPayable ? 'Save Changes' : 'Schedule Payable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
