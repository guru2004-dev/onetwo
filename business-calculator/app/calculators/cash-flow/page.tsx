'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, RotateCcw, Plus, Trash2, Sparkles, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

function fmtAmt(n: number, s: string) { if (!isFinite(n) || n < 0) return `${s}0.00`; return `${s}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtShort(n: number, s: string) { if (!isFinite(n)) return `${s}0`; if (n >= 1e7) return `${s}${(n / 1e7).toFixed(2)} Cr`; if (n >= 1e5) return `${s}${(n / 1e5).toFixed(2)} L`; if (n >= 1e3) return `${s}${(n / 1e3).toFixed(1)} K`; return `${s}${Math.abs(n).toFixed(2)}`; }

interface Entry { id: string; label: string; amount: string; }
const mkEntry = (label: string): Entry => ({ id: `${Date.now()}-${Math.random()}`, label, amount: '' });

export default function CashFlowCalculator() {
  const { selectedInputCurrency, setSelectedInputCurrency, selectedResultCurrency, setSelectedResultCurrency, availableCurrencies, loading: rL, updateCurrencyRates, lastUpdatedTime, getCurrencySymbol, convertToINR, convertFromINR } = useCurrency();
  const [inflows, setInflows] = useState<Entry[]>([mkEntry('Sales Revenue'), mkEntry('Investment Income')]);
  const [outflows, setOutflows] = useState<Entry[]>([mkEntry('Rent'), mkEntry('Salaries'), mkEntry('Utilities')]);
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 30000); return () => clearInterval(id); }, []);
  const relTime = useMemo(() => { void tick; if (!lastUpdatedTime) return 'never'; const s = Math.max(1, Math.floor((Date.now() - lastUpdatedTime) / 1000)); if (s < 60) return `${s}s ago`; const m = Math.floor(s / 60); return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`; }, [lastUpdatedTime, tick]);

  const totalInflow = useMemo(() => inflows.reduce((acc, e) => { const v = convertToINR(Number(e.amount) || 0, selectedInputCurrency); return acc + (v >= 0 ? v : 0); }, 0), [inflows, selectedInputCurrency, convertToINR]);
  const totalOutflow = useMemo(() => outflows.reduce((acc, e) => { const v = convertToINR(Number(e.amount) || 0, selectedInputCurrency); return acc + (v >= 0 ? v : 0); }, 0), [outflows, selectedInputCurrency, convertToINR]);
  const netCF = totalInflow - totalOutflow;

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);
  const disp = (n: number) => fmtAmt(convertFromINR(n, selectedResultCurrency), currSym);
  const dispS = (n: number) => fmtShort(convertFromINR(Math.abs(n), selectedResultCurrency), currSym);

  const updEntry = (list: Entry[], setList: React.Dispatch<React.SetStateAction<Entry[]>>, id: string, field: keyof Entry, val: string) => setList(list.map(e => e.id === id ? { ...e, [field]: val } : e));
  const delEntry = (list: Entry[], setList: React.Dispatch<React.SetStateAction<Entry[]>>, id: string) => setList(list.filter(e => e.id !== id));

  const maxBar = Math.max(totalInflow, totalOutflow, 1);
  const insight = useMemo(() => {
    if (netCF > 0 && netCF / totalInflow > 0.3) return { text: 'Your cash flow is healthy! Strong profitability.', type: 'success' };
    if (netCF < 0) return { text: totalOutflow > totalInflow * 1.5 ? 'Expenses are very high. Reduce costs urgently.' : 'Increase revenue sources to improve cash flow.', type: 'warning' };
    return { text: 'Cash flow is tight. Look for ways to increase income.', type: 'info' };
  }, [netCF, totalInflow, totalOutflow]);

  const handleReset = () => { setInflows([mkEntry('Sales Revenue'), mkEntry('Investment Income')]); setOutflows([mkEntry('Rent'), mkEntry('Salaries')]); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-teal-100 dark:to-teal-950 py-10 px-4">
      <div className="max-w-7xl mx-auto mb-8 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-sm font-medium mb-4">
          <TrendingUp className="w-4 h-4" /> Cash Flow Analysis
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">Cash Flow <span className="text-teal-400">Calculator</span></motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-600 dark:text-slate-400 text-lg">Track your inflows and outflows to understand your financial health.</motion.p>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Controls */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Input Currency</label>
            <select value={selectedInputCurrency} onChange={e => { if (availableCurrencies.includes(e.target.value as never)) setSelectedInputCurrency(e.target.value as never); }} disabled={rL} className="px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
              {availableCurrencies.map(c => <option key={c} value={c} className="bg-white dark:bg-slate-800">{c} ({getCurrencySymbol(c)})</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-0.5">
              {(['monthly', 'yearly'] as const).map(p => <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 text-xs rounded-md font-semibold transition-all ${period === p ? 'bg-teal-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:text-white'}`}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>)}
            </div>
            <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white bg-white dark:bg-white/5 hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg transition-all"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
            <button onClick={() => updateCurrencyRates()} disabled={rL} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"><RefreshCw className={`w-4 h-4 ${rL ? 'animate-spin' : ''}`} /> Update</button>
          </div>
        </motion.div>

        {/* Inputs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inflows */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-white dark:bg-white/5 backdrop-blur-xl border border-emerald-500/20 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-400" /><h2 className="text-lg font-bold text-slate-900 dark:text-white">Cash Inflows</h2></div>
              <button onClick={() => setInflows(prev => [...prev, mkEntry('Income Source')])} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-300 rounded-lg transition-all"><Plus className="w-3.5 h-3.5" /> Add Income</button>
            </div>
            <AnimatePresence>
              {inflows.map((e, i) => (
                <motion.div key={e.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 mb-3">
                  <input type="text" value={e.label} onChange={ev => updEntry(inflows, setInflows, e.id, 'label', ev.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                  <div className="relative w-36"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 text-xs">{inputSym}</span>
                    <input type="number" value={e.amount} onChange={ev => updEntry(inflows, setInflows, e.id, 'amount', ev.target.value)} placeholder="0" min={0} className="w-full pl-6 pr-2 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" /></div>
                  {inflows.length > 1 && <button onClick={() => delEntry(inflows, setInflows, e.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>}
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-white/10 flex justify-between"><span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Total Inflow</span><span className="text-lg font-bold text-emerald-400">{disp(totalInflow)}</span></div>
          </motion.div>

          {/* Outflows */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-white dark:bg-white/5 backdrop-blur-xl border border-red-500/20 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><TrendingDown className="w-5 h-5 text-red-400" /><h2 className="text-lg font-bold text-slate-900 dark:text-white">Cash Outflows</h2></div>
              <button onClick={() => setOutflows(prev => [...prev, mkEntry('Expense')])} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-300 rounded-lg transition-all"><Plus className="w-3.5 h-3.5" /> Add Expense</button>
            </div>
            <AnimatePresence>
              {outflows.map(e => (
                <motion.div key={e.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 mb-3">
                  <input type="text" value={e.label} onChange={ev => updEntry(outflows, setOutflows, e.id, 'label', ev.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500" />
                  <div className="relative w-36"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 text-xs">{inputSym}</span>
                    <input type="number" value={e.amount} onChange={ev => updEntry(outflows, setOutflows, e.id, 'amount', ev.target.value)} placeholder="0" min={0} className="w-full pl-6 pr-2 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500" /></div>
                  {outflows.length > 1 && <button onClick={() => delEntry(outflows, setOutflows, e.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>}
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-white/10 flex justify-between"><span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Total Outflow</span><span className="text-lg font-bold text-red-400">{disp(totalOutflow)}</span></div>
          </motion.div>
        </div>

        {/* Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2"><h2 className="text-lg font-bold text-slate-900 dark:text-white">Cash Flow Summary</h2><span className="text-xs text-slate-500">Updated: <span className="text-teal-300">{relTime}</span></span></div>
          <div className="mb-4"><p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Display Currency</p><div className="flex flex-wrap gap-2">{availableCurrencies.map(c => <button key={c} onClick={() => setSelectedResultCurrency(c as never)} className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${selectedResultCurrency === c ? 'bg-teal-600 border-teal-500 text-white' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-teal-400'}`}>{c}</button>)}</div></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center"><p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1">Total Inflow</p><p className="text-2xl font-extrabold text-emerald-400">{dispS(totalInflow)}</p></div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center"><p className="text-xs font-semibold text-red-300 uppercase tracking-wider mb-1">Total Outflow</p><p className="text-2xl font-extrabold text-red-400">{dispS(totalOutflow)}</p></div>
            <div className={`${netCF >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'} border rounded-xl p-4 text-center`}>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Net Cash Flow</p>
              <p className={`text-2xl font-extrabold ${netCF >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{netCF >= 0 ? '+' : '-'}{dispS(netCF)}</p>
              <p className={`text-xs mt-1 font-semibold ${netCF >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{netCF >= 0 ? '✅ Positive Cash Flow' : '⚠️ Negative Cash Flow'}</p>
            </div>
          </div>
          {/* Visual bars */}
          <div className="space-y-3 mb-4">
            {[{ label: 'Inflows', val: totalInflow, pct: (totalInflow / maxBar) * 100, color: 'bg-emerald-500', text: 'text-emerald-300' }, { label: 'Outflows', val: totalOutflow, pct: (totalOutflow / maxBar) * 100, color: 'bg-red-500', text: 'text-red-300' }].map((bar, i) => (
              <div key={bar.label}>
                <div className="flex justify-between text-xs mb-1"><span className={`font-semibold ${bar.text}`}>{bar.label}</span><span className="text-slate-700 dark:text-slate-300">{disp(bar.val)}</span></div>
                <div className="h-4 bg-white dark:bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${bar.pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className={`h-full ${bar.color} rounded-full`} /></div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Table + Insight */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Cash Flow Table ({period})</h3>
            <div className="overflow-auto rounded-xl border border-gray-200 dark:border-white/10 max-h-72">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-semibold"><th className="px-4 py-3 text-left">Category</th><th className="px-4 py-3 text-right">Amount</th></tr></thead>
                <tbody>
                  <tr className="border-t border-emerald-500/20 bg-emerald-500/5"><td colSpan={2} className="px-4 py-2 text-xs font-bold text-emerald-400 uppercase">Inflows</td></tr>
                  {inflows.map(e => <tr key={e.id} className="border-t border-gray-100 dark:border-gray-100 dark:border-white/5 hover:bg-white/5"><td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{e.label}</td><td className="px-4 py-2.5 text-right text-emerald-300 font-medium">+{disp(convertFromINR(convertToINR(Number(e.amount) || 0, selectedInputCurrency), selectedResultCurrency) > 0 ? convertToINR(Number(e.amount) || 0, selectedInputCurrency) : 0)}</td></tr>)}
                  <tr className="border-t border-red-500/20 bg-red-500/5"><td colSpan={2} className="px-4 py-2 text-xs font-bold text-red-400 uppercase">Outflows</td></tr>
                  {outflows.map(e => <tr key={e.id} className="border-t border-gray-100 dark:border-gray-100 dark:border-white/5 hover:bg-white/5"><td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{e.label}</td><td className="px-4 py-2.5 text-right text-red-300 font-medium">-{disp(convertToINR(Number(e.amount) || 0, selectedInputCurrency))}</td></tr>)}
                  <tr className="border-t-2 border-white/20 bg-white dark:bg-white/5"><td className="px-4 py-3 font-bold text-slate-900 dark:text-white">Net Cash Flow</td><td className={`px-4 py-3 text-right font-extrabold ${netCF >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{netCF >= 0 ? '+' : '-'}{disp(Math.abs(netCF))}</td></tr>
                </tbody>
              </table>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="flex flex-col gap-4">
            <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl border-l-4 ${insight.type === 'success' ? 'bg-teal-50/5 border-teal-400 text-teal-200' : insight.type === 'warning' ? 'bg-red-50/5 border-red-400 text-red-200' : 'bg-blue-50/5 border-blue-400 text-blue-200'}`}>
              <Sparkles className="w-5 h-5 mt-0.5 shrink-0" /><div><p className="font-semibold text-sm">Smart Insight</p><p className="text-sm mt-0.5 opacity-90">{insight.text}</p></div>
            </div>
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">Expense Breakdown</p>
              {outflows.filter(e => Number(e.amount) > 0).map((e, i) => {
                const val = convertToINR(Number(e.amount) || 0, selectedInputCurrency);
                const pct = totalOutflow > 0 ? (val / totalOutflow) * 100 : 0;
                const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-pink-500', 'bg-rose-500'];
                return <div key={e.id} className="mb-2"><div className="flex justify-between text-xs mb-1"><span className="text-slate-600 dark:text-slate-400">{e.label}</span><span className="text-slate-700 dark:text-slate-300">{pct.toFixed(1)}%</span></div><div className="h-2.5 bg-white dark:bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, delay: i * 0.05 }} className={`h-full ${colors[i % colors.length]} rounded-full`} /></div></div>;
              })}
              {totalOutflow === 0 && <p className="text-xs text-slate-500 text-center py-4">Enter expense amounts to see breakdown</p>}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
