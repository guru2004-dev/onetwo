'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, RotateCcw, Plus, Trash2, Sparkles, Info, Users } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

function fmtAmt(n: number, s: string) { if (!isFinite(n) || n < 0) return `${s}0.00`; return `${s}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtShort(n: number, s: string) { if (!isFinite(n)) return `${s}0`; const a = Math.abs(n); if (a >= 1e7) return `${s}${(a / 1e7).toFixed(2)} Cr`; if (a >= 1e5) return `${s}${(a / 1e5).toFixed(2)} L`; if (a >= 1e3) return `${s}${(a / 1e3).toFixed(1)} K`; return `${s}${a.toFixed(2)}`; }

interface Entry { id: string; name: string; amount: string; }
const mkEntry = (name: string): Entry => ({ id: `${Date.now()}-${Math.random()}`, name, amount: '' });

export default function SalaryCalculator() {
  const { selectedInputCurrency, setSelectedInputCurrency, selectedResultCurrency, setSelectedResultCurrency, availableCurrencies, loading: rL, updateCurrencyRates, lastUpdatedTime, getCurrencySymbol, convertToINR, convertFromINR } = useCurrency();
  const [basicSalaryRaw, setBasicSalaryRaw] = useState('50000');
  const [allowances, setAllowances] = useState<Entry[]>([mkEntry('HRA'), mkEntry('Special Allowance')]);
  const [deductions, setDeductions] = useState<Entry[]>([mkEntry('Provident Fund (PF)'), mkEntry('Professional Tax'), mkEntry('Income Tax')]);
  const [result, setResult] = useState<{ basic: number; totalAllowances: number; grossSalary: number; totalDeductions: number; netSalary: number } | null>(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 30000); return () => clearInterval(id); }, []);
  const relTime = useMemo(() => { void tick; if (!lastUpdatedTime) return 'never'; const s = Math.max(1, Math.floor((Date.now() - lastUpdatedTime) / 1000)); if (s < 60) return `${s}s ago`; const m = Math.floor(s / 60); return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`; }, [lastUpdatedTime, tick]);

  const calculate = useCallback(() => {
    setError('');
    const basic = Number(basicSalaryRaw) || 0;
    if (!basicSalaryRaw || basic < 0) { setError('Enter a valid basic salary.'); setResult(null); return; }
    const basicINR = convertToINR(basic, selectedInputCurrency);
    const sumAll = allowances.reduce((acc, curr) => acc + convertToINR(Number(curr.amount) || 0, selectedInputCurrency), 0);
    const sumDed = deductions.reduce((acc, curr) => acc + convertToINR(Number(curr.amount) || 0, selectedInputCurrency), 0);
    const gross = basicINR + sumAll;
    const net = gross - sumDed;
    setResult({ basic: basicINR, totalAllowances: sumAll, grossSalary: gross, totalDeductions: sumDed, netSalary: net });
  }, [basicSalaryRaw, allowances, deductions, selectedInputCurrency, convertToINR]);

  useEffect(() => { calculate(); }, [calculate, lastUpdatedTime]);

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);
  const disp = (n: number) => fmtAmt(convertFromINR(n, selectedResultCurrency), currSym);
  const dispS = (n: number) => fmtShort(convertFromINR(n, selectedResultCurrency), currSym);

  const updEntry = (list: Entry[], setList: React.Dispatch<React.SetStateAction<Entry[]>>, id: string, field: keyof Entry, val: string) => setList(list.map(e => e.id === id ? { ...e, [field]: val } : e));
  const delEntry = (list: Entry[], setList: React.Dispatch<React.SetStateAction<Entry[]>>, id: string) => setList(list.filter(e => e.id !== id));

  const insight = useMemo(() => {
    if (!result) return null;
    const dedPct = result.grossSalary > 0 ? (result.totalDeductions / result.grossSalary) * 100 : 0;
    if (dedPct > 30) return { text: 'Your deductions exceed 30% of your gross pay. Consider restructuring allowances if possible for tax efficiency.', type: 'warning' };
    if (result.basic / result.grossSalary < 0.4) return { text: 'Basic salary is less than 40% of gross. Confirm if this complies with local wage regulations.', type: 'info' };
    return { text: 'Your salary structure looks healthy with balanced deductions.', type: 'success' };
  }, [result]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-indigo-100 dark:to-indigo-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-4"><Users className="w-4 h-4" /> Payroll & HR</motion.div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-extrabold text-slate-900 dark:text-slate-900 dark:text-white tracking-tight mb-2">Salary <span className="text-indigo-400">Calculator</span></motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-lg">Calculate gross and net take-home salary after taxes and deductions.</motion.p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">Earnings</h2></div>
              <button onClick={() => { setBasicSalaryRaw('50000'); setAllowances([mkEntry('HRA'), mkEntry('Special Allowance')]); setDeductions([mkEntry('Provident Fund (PF)'), mkEntry('Professional Tax'), mkEntry('Income Tax')]); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-slate-900 dark:text-white bg-white dark:bg-white dark:bg-white/5 hover:bg-white/10 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-lg transition-all"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
            </div>
            <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-2">Input Currency</label>
              <select value={selectedInputCurrency} onChange={e => { if (availableCurrencies.includes(e.target.value as never)) setSelectedInputCurrency(e.target.value as never); }} disabled={rL} className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                {availableCurrencies.map(c => <option key={c} value={c} className="bg-white dark:bg-slate-800">{c} ({getCurrencySymbol(c)})</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1.5">Basic Salary</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">{inputSym}</span>
                <input type="number" value={basicSalaryRaw} onChange={e => setBasicSalaryRaw(e.target.value)} min={0} className="w-full pl-8 pr-4 py-3 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" /></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2"><label className="text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300">Allowances</label>
                <button onClick={() => setAllowances(p => [...p, mkEntry('New Allowance')])} className="flex items-center gap-1 px-2.5 py-1 text-xs bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 rounded-lg transition-all"><Plus className="w-3 h-3" /> Add</button>
              </div>
              <AnimatePresence>
                {allowances.map((a, idx) => (
                  <motion.div key={a.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-center gap-2 mb-2">
                    <input type="text" value={a.name} onChange={e => updEntry(allowances, setAllowances, a.id, 'name', e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    <div className="relative w-32"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 text-xs">{inputSym}</span>
                      <input type="number" value={a.amount} onChange={e => updEntry(allowances, setAllowances, a.id, 'amount', e.target.value)} placeholder="0" className="w-full pl-6 pr-2 py-2 rounded-lg bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" /></div>
                    {allowances.length > 1 && <button onClick={() => delEntry(allowances, setAllowances, a.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Deductions */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">Deductions</h2>
              <button onClick={() => setDeductions(p => [...p, mkEntry('New Deduction')])} className="flex items-center gap-1 px-2.5 py-1 text-xs bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-300 rounded-lg transition-all"><Plus className="w-3 h-3" /> Add</button>
            </div>
            <AnimatePresence>
              {deductions.map((d, idx) => (
                <motion.div key={d.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-center gap-2 mb-2">
                  <input type="text" value={d.name} onChange={e => updEntry(deductions, setDeductions, d.id, 'name', e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500" />
                  <div className="relative w-32"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 text-xs">{inputSym}</span>
                    <input type="number" value={d.amount} onChange={e => updEntry(deductions, setDeductions, d.id, 'amount', e.target.value)} placeholder="0" className="w-full pl-6 pr-2 py-2 rounded-lg bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500" /></div>
                  {deductions.length > 1 && <button onClick={() => delEntry(deductions, setDeductions, d.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>}
                </motion.div>
              ))}
            </AnimatePresence>
            {error && <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm"><Info className="w-4 h-4 shrink-0" /> {error}</div>}
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="flex flex-col gap-5">
          <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5"><div><h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">Results</h2><p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">Updated: <span className="text-indigo-300">{relTime}</span></p></div>
              <button onClick={() => updateCurrencyRates()} disabled={rL} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"><RefreshCw className={`w-4 h-4 ${rL ? 'animate-spin' : ''}`} /> Update</button>
            </div>
            <div className="mb-5"><p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Display Currency</p><div className="flex flex-wrap gap-2">{availableCurrencies.map(c => <button key={c} onClick={() => setSelectedResultCurrency(c as never)} className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${selectedResultCurrency === c ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white dark:bg-white dark:bg-white/5 border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-600 dark:text-slate-400 hover:border-indigo-400'}`}>{c}</button>)}</div></div>
            {result ? (
              <div className="flex flex-col gap-3">
                <div className="bg-gradient-to-r from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 rounded-xl p-4"><p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1">Net Take-Home Salary</p><p className="text-3xl font-extrabold text-slate-900 dark:text-slate-900 dark:text-white">{dispS(result.netSalary)}</p><p className="text-xs text-slate-600 dark:text-slate-600 dark:text-slate-400 mt-1">{disp(result.netSalary)}</p></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-3"><p className="text-[10px] font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Gross Salary</p><p className="text-lg font-bold text-emerald-300">{dispS(result.grossSalary)}</p></div>
                  <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-3"><p className="text-[10px] font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Total Deductions</p><p className="text-lg font-bold text-red-300">-{dispS(result.totalDeductions)}</p></div>
                  <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-3"><p className="text-[10px] font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Basic</p><p className="text-base font-bold text-sky-300">{dispS(result.basic)}</p></div>
                  <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-3"><p className="text-[10px] font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Allowances</p><p className="text-base font-bold text-blue-300">+{dispS(result.totalAllowances)}</p></div>
                </div>
                <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">Salary Distribution</p>
                  {[{ label: 'Basic', val: result.basic, color: 'bg-sky-500', text: 'text-sky-300' }, { label: 'Allowances', val: result.totalAllowances, color: 'bg-blue-500', text: 'text-blue-300' }, { label: 'Deductions', val: result.totalDeductions, color: 'bg-red-500', text: 'text-red-300' }, { label: 'Net Pay', val: result.netSalary, color: 'bg-indigo-500', text: 'text-indigo-300' }].map((bar, i) => {
                    const pct = result.grossSalary > 0 ? (bar.val / result.grossSalary) * 100 : 0;
                    return <div key={bar.label} className="mb-2"><div className="flex justify-between text-xs mb-1"><span className={`font-semibold ${bar.text}`}>{bar.label}</span><span className="text-slate-700 dark:text-slate-700 dark:text-slate-300">{pct.toFixed(1)}% of Gross</span></div><div className="h-2.5 bg-white dark:bg-white dark:bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 0.7, delay: i * 0.05 }} className={`h-full ${bar.color} rounded-full`} /></div></div>;
                  })}
                </div>
                <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="bg-emerald-500/10 border-b border-gray-200 dark:border-gray-200 dark:border-white/10"><td colSpan={2} className="px-4 py-2 font-bold text-emerald-400 uppercase text-xs">Gross Earnings</td></tr>
                      <tr className="border-b border-gray-100 dark:border-gray-100 dark:border-white/5"><td className="px-4 py-2.5 text-slate-700 dark:text-slate-700 dark:text-slate-300 text-xs">Basic Salary</td><td className="px-4 py-2.5 text-right text-xs text-slate-900 dark:text-slate-900 dark:text-white">{disp(result.basic)}</td></tr>
                      {allowances.map(a => <tr key={a.id} className="border-b border-gray-100 dark:border-gray-100 dark:border-white/5 bg-white/[0.02]"><td className="px-4 py-2.5 text-slate-700 dark:text-slate-700 dark:text-slate-300 text-xs">{a.name}</td><td className="px-4 py-2.5 text-right text-xs text-emerald-300">+{disp(convertToINR(Number(a.amount) || 0, selectedInputCurrency))}</td></tr>)}
                      <tr className="border-b-2 border-white/20"><td className="px-4 py-2.5 font-bold text-slate-700 dark:text-slate-700 dark:text-slate-300 text-xs">Total Gross</td><td className="px-4 py-2.5 text-right text-sm font-bold text-emerald-400">{disp(result.grossSalary)}</td></tr>
                      <tr className="bg-red-500/10 border-b border-gray-200 dark:border-gray-200 dark:border-white/10"><td colSpan={2} className="px-4 py-2 font-bold text-red-400 uppercase text-xs">Deductions</td></tr>
                      {deductions.map(d => <tr key={d.id} className="border-b border-gray-100 dark:border-gray-100 dark:border-white/5 bg-white/[0.02]"><td className="px-4 py-2.5 text-slate-700 dark:text-slate-700 dark:text-slate-300 text-xs">{d.name}</td><td className="px-4 py-2.5 text-right text-xs text-red-300">-{disp(convertToINR(Number(d.amount) || 0, selectedInputCurrency))}</td></tr>)}
                      <tr className="border-b-2 border-white/20"><td className="px-4 py-2.5 font-bold text-slate-700 dark:text-slate-700 dark:text-slate-300 text-xs">Total Deductions</td><td className="px-4 py-2.5 text-right text-sm font-bold text-red-400">{disp(result.totalDeductions)}</td></tr>
                      <tr className="bg-indigo-500/20"><td className="px-4 py-4 font-bold text-slate-900 dark:text-slate-900 dark:text-white">Net Take-Home Salary</td><td className="px-4 py-4 text-right text-lg font-extrabold text-indigo-300">{disp(result.netSalary)}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : <div className="flex flex-col items-center justify-center py-14 text-slate-500 gap-3"><Users className="w-12 h-12 opacity-20" /><p className="text-sm">Enter salary details to calculate</p></div>}
          </div>
          {insight && result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-3 px-5 py-4 rounded-2xl border-l-4 ${insight.type === 'success' ? 'bg-indigo-50/5 border-indigo-400 text-indigo-200' : insight.type === 'warning' ? 'bg-amber-50/5 border-amber-400 text-amber-200' : 'bg-blue-50/5 border-blue-400 text-blue-200'}`}>
              <Sparkles className="w-5 h-5 mt-0.5 shrink-0" /><div><p className="font-semibold text-sm">Smart Insight</p><p className="text-sm mt-0.5 opacity-90">{insight.text}</p></div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
