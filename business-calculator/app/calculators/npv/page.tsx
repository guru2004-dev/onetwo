'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, RotateCcw, Plus, Trash2, Sparkles, Info } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

function fmtAmt(n: number, s: string) { if (!isFinite(n)) return `${s}0.00`; return `${s}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtShort(n: number, s: string) { if (!isFinite(n)) return `${s}0`; const a = Math.abs(n); if (a >= 1e7) return `${s}${(a / 1e7).toFixed(2)} Cr`; if (a >= 1e5) return `${s}${(a / 1e5).toFixed(2)} L`; if (a >= 1e3) return `${s}${(a / 1e3).toFixed(1)} K`; return `${s}${a.toFixed(2)}`; }

interface CFEntry { id: string; amount: string; }
const mkCF = (): CFEntry => ({ id: `${Date.now()}-${Math.random()}`, amount: '' });

interface NPVRow { year: number; cf: number; pv: number; df: number; }

export default function NPVCalculator() {
  const { selectedInputCurrency, setSelectedInputCurrency, selectedResultCurrency, setSelectedResultCurrency, availableCurrencies, loading: rL, updateCurrencyRates, lastUpdatedTime, getCurrencySymbol, convertToINR, convertFromINR } = useCurrency();
  const [investRaw, setInvestRaw] = useState('1000000');
  const [rateRaw, setRateRaw] = useState('10');
  const [cashFlows, setCashFlows] = useState<CFEntry[]>([mkCF(), mkCF(), mkCF()]);
  const [rows, setRows] = useState<NPVRow[]>([]);
  const [npv, setNPV] = useState<number | null>(null);
  const [sumPV, setSumPV] = useState(0);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 30000); return () => clearInterval(id); }, []);
  const relTime = useMemo(() => { void tick; if (!lastUpdatedTime) return 'never'; const s = Math.max(1, Math.floor((Date.now() - lastUpdatedTime) / 1000)); if (s < 60) return `${s}s ago`; const m = Math.floor(s / 60); return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`; }, [lastUpdatedTime, tick]);

  const calculate = useCallback(() => {
    setError('');
    const invest = Number(investRaw); const rate = Number(rateRaw);
    if (!investRaw || isNaN(invest) || invest <= 0) { setError('Enter a valid initial investment.'); setNPV(null); return; }
    if (isNaN(rate) || rate < 0) { setError('Enter a valid discount rate.'); setNPV(null); return; }
    const r = rate / 100;
    const investINR = convertToINR(invest, selectedInputCurrency);
    let totalPV = 0;
    const newRows: NPVRow[] = [];
    cashFlows.forEach((cf, idx) => {
      const cfVal = Number(cf.amount) || 0;
      const cfINR = convertToINR(cfVal, selectedInputCurrency);
      const t = idx + 1;
      const df = 1 / Math.pow(1 + r, t);
      const pv = cfINR * df;
      totalPV += pv;
      newRows.push({ year: t, cf: cfINR, pv, df });
    });
    setRows(newRows);
    setSumPV(totalPV);
    setNPV(totalPV - investINR);
  }, [investRaw, rateRaw, cashFlows, selectedInputCurrency, convertToINR]);

  useEffect(() => { calculate(); }, [calculate, lastUpdatedTime]);

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);
  const disp = (n: number) => fmtAmt(convertFromINR(n, selectedResultCurrency), currSym);
  const dispS = (n: number) => fmtShort(convertFromINR(Math.abs(n), selectedResultCurrency), currSym);

  const maxCF = Math.max(...rows.map(r => Math.abs(r.cf)), 1);
  const insight = useMemo(() => {
    if (npv === null) return null;
    if (npv > 0 && npv / convertToINR(Number(investRaw) || 1, selectedInputCurrency) > 0.5) return { text: 'This investment has very strong potential. Highly recommended! 🚀', type: 'success' };
    if (npv > 0) return { text: 'NPV is positive — investment is profitable. Accept the project.', type: 'success' };
    return { text: 'NPV is negative. Consider reducing costs or increasing projected returns.', type: 'warning' };
  }, [npv, investRaw, selectedInputCurrency, convertToINR]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-indigo-100 dark:to-indigo-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-4">
          <Info className="w-4 h-4" /> Investment Analysis
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-extrabold text-slate-900 dark:text-slate-900 dark:text-white tracking-tight mb-2">NPV <span className="text-indigo-400">Calculator</span></motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-lg">Evaluate investment profitability using discounted cash flow analysis.</motion.p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* INPUTS */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">Inputs</h2><p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">Enter investment details</p></div>
            <button onClick={() => { setInvestRaw('1000000'); setRateRaw('10'); setCashFlows([mkCF(), mkCF(), mkCF()]); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-slate-900 dark:text-white bg-white dark:bg-white dark:bg-white/5 hover:bg-white/10 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-lg transition-all"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-2">Input Currency</label>
            <select value={selectedInputCurrency} onChange={e => { if (availableCurrencies.includes(e.target.value as never)) setSelectedInputCurrency(e.target.value as never); }} disabled={rL} className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
              {availableCurrencies.map(c => <option key={c} value={c} className="bg-white dark:bg-slate-800">{c} ({getCurrencySymbol(c)})</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1.5">Initial Investment</label>
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">{inputSym}</span>
              <input type="number" value={investRaw} onChange={e => setInvestRaw(e.target.value)} min={0} className="w-full pl-8 pr-4 py-3 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" /></div>
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1.5">Discount Rate (% per year)</label>
            <div className="relative"><input type="number" value={rateRaw} onChange={e => setRateRaw(e.target.value)} min={0} max={100} step="0.1" className="w-full pl-4 pr-10 py-3 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">%</span></div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2"><label className="text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300">Yearly Cash Flows</label>
              <button onClick={() => setCashFlows(p => [...p, mkCF()])} className="flex items-center gap-1 px-2.5 py-1 text-xs bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 rounded-lg transition-all"><Plus className="w-3 h-3" /> Add Year</button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <AnimatePresence>
                {cashFlows.map((cf, idx) => (
                  <motion.div key={cf.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-12 shrink-0">Year {idx + 1}</span>
                    <div className="relative flex-1"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 text-xs">{inputSym}</span>
                      <input type="number" value={cf.amount} onChange={e => setCashFlows(p => p.map(x => x.id === cf.id ? { ...x, amount: e.target.value } : x))} placeholder="0" className="w-full pl-6 pr-2 py-2 rounded-lg bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" /></div>
                    {cashFlows.length > 1 && <button onClick={() => setCashFlows(p => p.filter(x => x.id !== cf.id))} className="p-1.5 text-slate-500 hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
          {error && <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm"><Info className="w-4 h-4 shrink-0" /> {error}</div>}
          <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-3"><p className="text-xs font-mono text-slate-600 dark:text-slate-600 dark:text-slate-400">NPV = Σ[CF/(1+r)ᵗ] − Initial Investment</p></div>
        </motion.div>

        {/* RESULTS */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex flex-col gap-6">
          <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5"><div><h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">Results</h2><p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">Updated: <span className="text-indigo-300">{relTime}</span></p></div>
              <button onClick={() => updateCurrencyRates()} disabled={rL} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"><RefreshCw className={`w-4 h-4 ${rL ? 'animate-spin' : ''}`} /> Update</button>
            </div>
            <div className="mb-5"><p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Display Currency</p><div className="flex flex-wrap gap-2">{availableCurrencies.map(c => <button key={c} onClick={() => setSelectedResultCurrency(c as never)} className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${selectedResultCurrency === c ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white dark:bg-white dark:bg-white/5 border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-600 dark:text-slate-400 hover:border-indigo-400'}`}>{c}</button>)}</div></div>
            {npv !== null ? (
              <div className="flex flex-col gap-3">
                <div className={`${npv >= 0 ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-red-500/20 border-red-500/30'} border rounded-xl p-4 text-center`}>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Net Present Value</p>
                  <p className={`text-3xl font-extrabold ${npv >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{npv >= 0 ? '+' : '-'}{dispS(npv)}</p>
                  <p className={`text-xs mt-1 font-semibold ${npv >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{npv >= 0 ? '✅ Profitable — Accept Project' : '❌ Not Profitable — Reject Project'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Total PV of CFs</p><p className="text-xl font-bold text-indigo-300">{dispS(sumPV)}</p></div>
                  <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Initial Investment</p><p className="text-xl font-bold text-slate-700 dark:text-slate-700 dark:text-slate-300">{dispS(convertToINR(Number(investRaw) || 0, selectedInputCurrency))}</p></div>
                </div>
                <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">Cash Flow Bars</p>
                  {rows.map((r, i) => (
                    <div key={r.year} className="mb-2">
                      <div className="flex justify-between text-xs mb-1"><span className="text-slate-600 dark:text-slate-600 dark:text-slate-400">Year {r.year}</span><span className="text-indigo-300">{disp(r.cf)}</span></div>
                      <div className="h-2.5 bg-white dark:bg-white dark:bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.abs(r.cf) / maxCF * 100}%` }} transition={{ duration: 0.7, delay: i * 0.05 }} className="h-full bg-indigo-500 rounded-full" /></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div className="flex flex-col items-center justify-center py-14 text-slate-500 gap-3"><p className="text-sm">Enter values to calculate NPV</p></div>}
          </div>
          {insight && npv !== null && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-3 px-5 py-4 rounded-2xl border-l-4 ${insight.type === 'success' ? 'bg-emerald-50/5 border-emerald-400 text-emerald-200' : 'bg-red-50/5 border-red-400 text-red-200'}`}>
              <Sparkles className="w-5 h-5 mt-0.5 shrink-0" /><div><p className="font-semibold text-sm">Smart Insight</p><p className="text-sm mt-0.5 opacity-90">{insight.text}</p></div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* NPV Table */}
      {rows.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="max-w-6xl mx-auto mt-6 bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-900 dark:text-white mb-4">NPV Breakdown Table</h3>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-200 dark:border-white/10">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 dark:bg-white dark:bg-white/5 text-slate-600 dark:text-slate-600 dark:text-slate-400 font-semibold"><th className="px-4 py-3 text-left">Year</th><th className="px-4 py-3 text-right">Cash Flow</th><th className="px-4 py-3 text-right">Discount Factor</th><th className="px-4 py-3 text-right">Present Value</th></tr></thead>
              <tbody>
                {rows.map((r, i) => <tr key={r.year} className={`border-t border-gray-100 dark:border-gray-100 dark:border-white/5 hover:bg-white dark:bg-white dark:bg-white/5 transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-700 dark:text-slate-300 font-medium">Year {r.year}</td>
                  <td className="px-4 py-3 text-right text-slate-900 dark:text-slate-900 dark:text-white font-semibold">{disp(r.cf)}</td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-600 dark:text-slate-400">{r.df.toFixed(4)}</td>
                  <td className="px-4 py-3 text-right text-indigo-300 font-semibold">{disp(r.pv)}</td>
                </tr>)}
                <tr className="border-t-2 border-white/20 bg-white dark:bg-white dark:bg-white/5"><td colSpan={3} className="px-4 py-3 font-bold text-slate-900 dark:text-slate-900 dark:text-white">Total PV</td><td className="px-4 py-3 text-right font-extrabold text-indigo-400">{disp(sumPV)}</td></tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
