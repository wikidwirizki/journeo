import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { Expense, Trip } from '../../types';
import { getTripExpenses, saveExpense, deleteExpense } from '../../store/db';
import { useAuth } from '../../contexts/AuthContext';

const EX_RATES: Record<string, number> = {
  USD: 1,
  IDR: 15500,
  JPY: 150,
  EUR: 0.9,
};

const convertCurrency = (amount: number, from: string, to: string) => {
  if (!amount) return 0;
  const inUSD = amount / (EX_RATES[from] || 1);
  return inUSD * (EX_RATES[to] || 1);
};

export default function BudgetTab({ tripId, trip }: { tripId: string, trip: Trip }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [searchParams] = useSearchParams();
  const isViewOnly = searchParams.get('viewOnly') === 'true';
  const { user } = useAuth();

  // Total display currency
  const [displayCurrency, setDisplayCurrency] = useState(trip.currency || 'USD');

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('food');
  const [isPaid, setIsPaid] = useState(false);
  const [expenseCurrency, setExpenseCurrency] = useState(trip.currency || 'USD');

  useEffect(() => {
    loadExpenses();
  }, [tripId]);

  const loadExpenses = async () => {
    const data = await getTripExpenses(tripId);
    setExpenses(data);
  };

  const getSymbol = (curr: string) => {
    switch (curr) {
      case 'IDR': return 'Rp';
      case 'JPY': return '¥';
      case 'EUR': return '€';
      default: return '$';
    }
  };

  const formatMoney = (val: number, currStr: string) => {
    const sym = getSymbol(currStr);
    if (currStr === 'IDR' || currStr === 'JPY') {
      return sym + val.toLocaleString('en-US', {maximumFractionDigits: 0});
    }
    return sym + val.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || (!amount && !budgetAmount) || !date || (!user && !isViewOnly)) return;

    const newExpense: Expense = {
      id: editId || uuidv4(),
      tripId,
      title,
      amount: Number(amount) || 0,
      budgetAmount: Number(budgetAmount) || 0,
      currency: expenseCurrency,
      isPaid,
      date,
      category
    };
    if (user?.uid) newExpense.userId = user.uid;

    await saveExpense(newExpense);
    cancelEdit();
    loadExpenses();
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (editId && confirm('Are you sure you want to delete this expense?')) {
      await deleteExpense(tripId, editId);
      cancelEdit();
      loadExpenses();
    }
  };

  const handleTogglePaid = async (exp: Expense) => {
    if (isViewOnly) return;
    const updated = { ...exp, isPaid: !exp.isPaid };
    await saveExpense(updated);
    loadExpenses();
  };

  const startEdit = (exp: Expense) => {
    if (isViewOnly) return;
    setEditId(exp.id);
    setTitle(exp.title);
    setAmount(exp.amount ? exp.amount.toString() : '');
    setBudgetAmount(exp.budgetAmount ? exp.budgetAmount.toString() : '');
    setDate(exp.date);
    setCategory(exp.category);
    setIsPaid(exp.isPaid || false);
    setExpenseCurrency(exp.currency || trip.currency || 'USD');
    setIsAdding(true);
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditId(null);
    setTitle('');
    setAmount('');
    setBudgetAmount('');
    setIsPaid(false);
    setDate('');
    setExpenseCurrency(trip.currency || 'USD');
  };

  const totalActual = expenses.reduce((sum, exp) => sum + convertCurrency((exp.amount || 0), exp.currency || 'USD', displayCurrency), 0);
  const totalPlanned = expenses.reduce((sum, exp) => sum + convertCurrency((exp.budgetAmount || 0), exp.currency || 'USD', displayCurrency), 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Budget Summary Card */}
      <div className="bg-gradient-to-br from-[#0C2B4E] to-[#1a416e] rounded-3xl p-6 shadow-sm flex flex-col items-center text-center relative border border-[#0C2B4E]/10">
        <select 
          value={displayCurrency} 
          onChange={e => setDisplayCurrency(e.target.value)} 
          className="absolute top-4 right-4 bg-white/10 text-white text-[10px] uppercase tracking-widest font-bold py-1 px-2 border-0 rounded-lg outline-none cursor-pointer hover:bg-white/20 transition-colors"
        >
          <option value="USD" className="text-black">USD</option>
          <option value="IDR" className="text-black">IDR</option>
          <option value="JPY" className="text-black">JPY</option>
          <option value="EUR" className="text-black">EUR</option>
        </select>

        <span className="text-[10px] uppercase text-white/60 tracking-widest font-bold block mb-1">Total Actual Spent</span>
        <h3 className="text-4xl font-serif italic mb-2 text-white">{formatMoney(totalActual, displayCurrency)}</h3>
        <p className="text-[10px] uppercase tracking-widest text-[#288C78] font-bold">Planned: {formatMoney(totalPlanned, displayCurrency)}</p>
      </div>

      <div className="flex items-center justify-between mt-6 mb-2 px-2">
        <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#0C2B4E]/50">Tracker & Ledger</h3>
        {!isViewOnly && (
          <button 
            onClick={() => setIsAdding(true)}
            className="text-[#288C78] text-[10px] uppercase tracking-widest font-bold hover:text-[#0C2B4E] transition-colors"
          >
            + Add Entry
          </button>
        )}
      </div>

      {isAdding && !isViewOnly && (
        <form onSubmit={handleSave} className="bg-white p-5 rounded-2xl border border-[#0C2B4E]/5 shadow-sm flex flex-col gap-4 animate-in slide-in-from-bottom-2 mb-4">
          <h4 className="font-bold text-[#0C2B4E] text-lg font-serif italic mb-1">{editId ? 'Edit Entry' : 'New Expense Entry'}</h4>
          
          <input 
            type="text" 
            placeholder="What is this for?" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 text-sm focus:border-[#288C78] outline-none text-[#0C2B4E]"
            required
          />

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-[9px] font-bold text-[#0C2B4E]/50 uppercase tracking-widest mb-1">Currency</label>
              <select 
                value={expenseCurrency}
                onChange={e => setExpenseCurrency(e.target.value)}
                className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 text-sm focus:border-[#288C78] outline-none text-[#0C2B4E]"
              >
                <option value="USD">USD</option>
                <option value="IDR">IDR</option>
                <option value="JPY">JPY</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div className="col-span-1">
              <label className="block text-[9px] font-bold text-[#0C2B4E]/50 uppercase tracking-widest mb-1">Budget</label>
              <input 
                type="number" 
                placeholder="0" 
                value={budgetAmount}
                onChange={e => setBudgetAmount(e.target.value)}
                className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 text-sm focus:border-[#288C78] outline-none text-[#0C2B4E]"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-[9px] font-bold text-[#0C2B4E]/50 uppercase tracking-widest mb-1">Actual</label>
              <input 
                type="number" 
                placeholder="0" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 text-sm focus:border-[#288C78] outline-none text-[#0C2B4E]"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <input 
              type="date" 
              value={date}
              onChange={e => setDate(e.target.value)}
              className="flex-1 bg-transparent border-b border-[#0C2B4E]/20 py-2 text-sm focus:border-[#288C78] outline-none font-sans text-[#0C2B4E]"
              required
            />
          </div>

          <select 
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 text-sm text-[#0C2B4E] focus:border-[#288C78] outline-none"
          >
            <option value="flight">Flight</option>
            <option value="hotel">Hotel / Stay</option>
            <option value="food">Food & Drinks</option>
            <option value="activity">Activities</option>
            <option value="transport">Transportation</option>
            <option value="other">Other</option>
          </select>

          <label className="flex items-center gap-2 mt-2 cursor-pointer w-fit">
            <div className="relative flex items-center justify-center">
              <input type="checkbox" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} className="peer appearance-none w-5 h-5 border-2 border-[#0C2B4E]/20 rounded-md checked:bg-[#288C78] checked:border-[#288C78] transition-colors cursor-pointer" />
              <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#0C2B4E]">Already Paid</span>
          </label>

          <div className="flex gap-2 mt-4">
            {editId && (
              <button type="button" onClick={handleDelete} className="flex-1 py-3 text-[11px] uppercase tracking-widest font-bold text-red-500 hover:text-white hover:bg-red-500 transition-colors bg-red-50 border border-red-500/20 rounded-xl">Delete</button>
            )}
            <button type="button" onClick={cancelEdit} className="flex-1 py-3 text-[11px] uppercase tracking-widest font-bold text-[#0C2B4E]/50 hover:text-[#0C2B4E] border border-transparent rounded-xl">Cancel</button>
            <button type="submit" className="flex-1 py-3 text-[11px] uppercase tracking-widest font-bold text-white bg-[#0C2B4E] hover:bg-[#1a416e] transition-colors rounded-xl">{editId ? 'Update' : 'Save'}</button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-0 pb-8 bg-white rounded-3xl overflow-hidden border border-[#0C2B4E]/5 shadow-sm">
        {expenses.length === 0 && !isAdding ? (
          <div className="text-center py-12">
            <p className="text-[11px] uppercase tracking-widest font-bold opacity-30 text-[#0C2B4E]">No expenses logged yet.</p>
          </div>
        ) : (
          expenses.map((exp, idx) => (
            <div key={exp.id} className={`flex justify-between items-center p-4 gap-4 ${idx !== expenses.length - 1 ? 'border-b border-[#0C2B4E]/5' : ''}`}>
              <label className="shrink-0 cursor-pointer flex items-center justify-center">
                <div className="relative flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    checked={exp.isPaid || false} 
                    onChange={() => handleTogglePaid(exp)}
                    className="peer appearance-none w-5 h-5 border-2 border-[#0C2B4E]/20 rounded-md checked:bg-[#288C78] checked:border-[#288C78] transition-colors cursor-pointer" 
                  />
                  <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                </div>
              </label>
              
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => startEdit(exp)}>
                <div className={`font-bold text-[#0C2B4E] truncate text-sm ${exp.isPaid ? 'line-through opacity-40 text-[#288C78]' : ''}`}>{exp.title}</div>
                <div className="text-[10px] text-[#0C2B4E]/40 mt-0.5 whitespace-nowrap uppercase tracking-widest font-medium"><span className="text-[#288C78]">{exp.category}</span> • {format(new Date(exp.date), 'MMM d, yy')}</div>
              </div>

              <div className="text-right shrink-0 cursor-pointer" onClick={() => startEdit(exp)}>
                <div className={`text-sm font-mono font-bold ${exp.isPaid ? 'text-[#0C2B4E]/40' : 'text-[#0C2B4E]'}`}>{formatMoney(exp.amount || 0, exp.currency || 'USD')}</div>
                <div className="text-[9px] uppercase tracking-widest font-bold text-[#0C2B4E]/30 mt-1">Bdt: {formatMoney(exp.budgetAmount || 0, exp.currency || 'USD')}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
