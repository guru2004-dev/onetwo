'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, RotateCcw, Sparkles, Info } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

function fmtAmt(n: number, sym: string) { if (!isFinite(n) || n < 0) return `${sym}0.00`; return `${sym}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtShort(n: number, sym: string) { if (!isFinite(n)) return `${sym}0`; if (n >= 1_00_00_000) return `${sym}${(n / 1_00_00_000).toFixed(2)} Cr`; if (n >= 1_00_000) return `${sym}${(n / 1_00_000).toFixed(2)} L`; if (n >= 1_000) return `${sym}${(n / 1_000).toFixed(1)} K`; return `${sym}${n.toFixed(2)}`; }

interface DepRow { year: number; depreciation: number; bookValue: number; }

export default function DepreciationCalculator() {
  const { selectedInputCurrency, setSelectedInputCurrency, selectedResultCurrency, setSelectedResultCurrency, availableCurrencies, loading: ratesLoading, updateCurrencyRates, lastUpdatedTime, getCurrencySymbol, convertToINR, convertFromINR } = useCurrency();
  const [costRaw, setCostRaw] = useState('500000');
  const [salvageRaw, setSalvageRaw] = useState('50000');
  const [lifeRaw, setLifeRaw] = useState('5');
  const [method, setMethod] = useState<'straight-line' | 'declining'>('straight-line');
  const [rateRaw, setRateRaw] = useState('20');
  const [schedule, setSchedule] = useState<DepRow[]>([]);
  const [result, setResult] = useState<{ annualDep: number; totalDep: number; bookValue: number } | null>(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 30000); return () => clearInterval(id); }, []);
  const relTime = useMemo(() => { void tick; if (!lastUpdatedTime) return 'never'; const s = Math.max(1, Math.floor((Date.now() - lastUpdatedTime) / 1000)); if (s < 60) return `${s}s ago`; const m = Math.floor(s / 60); return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`; }, [lastUpdatedTime, tick]);

  const calculate = useCallback(() => {
    setError(''); setSchedule([]); setResult(null);
    const cost = Number(costRaw); const salvage = Number(salvageRaw); const life = Number(lifeRaw); const rate = Number(rateRaw);
    if (!costRaw || isNaN(cost) || cost <= 0) { setError('Enter a valid asset cost.'); return; }
    if (isNaN(salvage) || salvage < 0) { setError('Enter a valid salvage value.'); return; }
    if (!lifeRaw || isNaN(life) || life <= 0 || !Number.isInteger(life)) { setError('Enter a valid useful life in whole years.'); return; }
    if (salvage >= cost) { setError('Salvage value must be less than asset cost.'); return; }
    const costINR = convertToINR(cost, selectedInputCurrency);
    const salvageINR = convertToINR(salvage, selectedInputCurrency);
    const rows: DepRow[] = [];
    if (method === 'straight-line') {
      const annualDep = (costINR - salvageINR) / life;
      let bv = costINR;
      for (let y = 1; y <= life; y++) { bv = Math.max(salvageINR, bv - annualDep); rows.push({ year: y, depreciation: annualDep, bookValue: bv }); }
      setResult({ annualDep, totalDep: costINR - salvageINR, bookValue: salvageINR });
    } else {
      if (isNaN(rate) || rate <= 0 || rate >= 100) { setError('Enter a valid declining balance rate (1–99%).'); return; }
      let bv = costINR; let totalDep = 0;
      for (let y = 1; y <= life; y++) {
        let dep = bv * (rate / 100);
        if (bv - dep < salvageINR) dep = Math.max(0, bv - salvageINR);
        bv -= dep; totalDep += dep;
        rows.push({ year: y, depreciation: dep, bookValue: bv });
      }
      setResult({ annualDep: rows[0]?.depreciation ?? 0, totalDep, bookValue: bv });
    }
    setSchedule(rows);
  }, [costRaw, salvageRaw, lifeRaw, method, rateRaw, selectedInputCurrency, convertToINR]);

  useEffect(() => { calculate(); }, [calculate, lastUpdatedTime]);
  const handleReset = () => { setCostRaw('500000'); setSalvageRaw('50000'); setLifeRaw('5'); setMethod('straight-line'); setRateRaw('20'); setSchedule([]); setResult(null); setError(''); };
  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);
  const disp = (inr: number) => fmtAmt(convertFromINR(inr, selectedResultCurrency), currSym);
  const dispShort = (inr: number) => fmtShort(convertFromINR(inr, selectedResultCurrency), currSym);
  const insight = useMemo(() => {
    if (!result || !costRaw) return null;
    const costINR = convertToINR(Number(costRaw), selectedInputCurrency);
    if (result.annualDep / costINR > 0.25) return { text: 'Asset value is decreasing quickly. Plan for replacement early.', type: 'warning' };
    if (result.bookValue / costINR > 0.3) return { text: 'Asset retains good residual value over its useful life.', type: 'success' };
    return { text: 'Standard depreciation rate. Review annually for budget planning.', type: 'info' };
  }, [result, costRaw, selectedInputCurrency, convertToINR]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-orange-100 dark:to-orange-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-sm font-medium mb-4">
          <RefreshCw className="w-4 h-4" /> Asset Depreciation
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-extrabold text-slate-900 dark:text-slate-900 dark:text-white tracking-tight mb-2">
          Depreciation <span className="text-orange-400">Calculator</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-lg">Calculate asset depreciation using Straight-Line or Declining Balance methods.</motion.p>
      </div>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* TOP — INPUTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div><h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">Inputs</h2><p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">Enter asset details</p></div>
              <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-slate-900 dark:text-white bg-white dark:bg-white dark:bg-white/5 hover:bg-white/10 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-lg transition-all"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-2">Input Currency</label>
              <select value={selectedInputCurrency} onChange={e => { if (availableCurrencies.includes(e.target.value as never)) setSelectedInputCurrency(e.target.value as never); }} disabled={ratesLoading} className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all">
                {availableCurrencies.map(c => <option key={c} value={c} className="bg-white dark:bg-slate-800">{c} ({getCurrencySymbol(c)})</option>)}
              </select>
            </div>
            {[{ label: 'Asset Cost', val: costRaw, set: setCostRaw }, { label: 'Salvage Value', val: salvageRaw, set: setSalvageRaw }].map(f => (
              <div key={f.label}>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1.5">{f.label}</label>
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 font-bold text-sm pointer-events-none">{inputSym}</span>
                  <input type="number" value={f.val} onChange={e => f.set(e.target.value)} min={0} className="w-full pl-8 pr-4 py-3 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all" /></div>
              </div>
            ))}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1.5">Useful Life (Years)</label>
              <input type="number" value={lifeRaw} onChange={e => setLifeRaw(e.target.value)} placeholder="e.g. 5" min={1} step={1} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-2">Depreciation Method</label>
              <div className="grid grid-cols-2 gap-2">
                {[{ id: 'straight-line', label: 'Straight-Line' }, { id: 'declining', label: 'Declining Balance' }].map(m => (
                  <button key={m.id} onClick={() => setMethod(m.id as 'straight-line' | 'declining')} className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${method === m.id ? 'bg-orange-600 border-orange-500 text-white' : 'bg-white dark:bg-white dark:bg-white/5 border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-600 dark:text-slate-400 hover:border-orange-500/50 hover:text-slate-800 dark:text-slate-800 dark:text-slate-200'}`}>{m.label}</button>
                ))}
              </div>
            </div>
            {method === 'declining' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1.5">Depreciation Rate (%)</label>
                <div className="relative"><input type="number" value={rateRaw} onChange={e => setRateRaw(e.target.value)} min={1} max={99} className="w-full pl-4 pr-10 py-3 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 font-bold text-sm pointer-events-none">%</span></div>
              </div>
            )}
            {error && <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm"><Info className="w-4 h-4 shrink-0" /> {error}</div>}
          </motion.div>

          {/* RESULTS */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex flex-col gap-6">
            <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div><h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">Results</h2><p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">Updated: <span className="text-orange-300">{relTime}</span></p></div>
                <button onClick={() => updateCurrencyRates()} disabled={ratesLoading} className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"><RefreshCw className={`w-4 h-4 ${ratesLoading ? 'animate-spin' : ''}`} /> Update</button>
              </div>
              <div className="mb-5"><p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Display Currency</p><div className="flex flex-wrap gap-2">{availableCurrencies.map(c => <button key={c} onClick={() => setSelectedResultCurrency(c as never)} className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${selectedResultCurrency === c ? 'bg-orange-600 border-orange-500 text-white' : 'bg-white dark:bg-white dark:bg-white/5 border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-600 dark:text-slate-400 hover:border-orange-400 hover:text-slate-800 dark:text-slate-800 dark:text-slate-200'}`}>{c}</button>)}</div></div>
              {result ? (
                <div className="grid grid-cols-1 gap-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-center"><p className="text-[10px] font-semibold text-orange-300 uppercase tracking-wider mb-1">Year 1 Dep.</p><p className="text-base font-bold text-slate-900 dark:text-slate-900 dark:text-white">{dispShort(result.annualDep)}</p></div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center"><p className="text-[10px] font-semibold text-red-300 uppercase tracking-wider mb-1">Total Dep.</p><p className="text-base font-bold text-slate-900 dark:text-slate-900 dark:text-white">{dispShort(result.totalDep)}</p></div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center"><p className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider mb-1">Final Book Value</p><p className="text-base font-bold text-slate-900 dark:text-slate-900 dark:text-white">{dispShort(result.bookValue)}</p></div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-500 gap-3"><p className="text-sm">Enter values to see depreciation results</p></div>
              )}
            </div>
            {insight && result && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-3 px-5 py-4 rounded-2xl border-l-4 ${insight.type === 'success' ? 'bg-orange-50/5 border-orange-400 text-orange-200' : insight.type === 'warning' ? 'bg-red-50/5 border-red-400 text-red-200' : 'bg-blue-50/5 border-blue-400 text-blue-200'}`}>
                <Sparkles className="w-5 h-5 mt-0.5 shrink-0" /><div><p className="font-semibold text-sm">Smart Insight</p><p className="text-sm mt-0.5 opacity-90">{insight.text}</p></div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* DEPRECIATION SCHEDULE TABLE */}
        {schedule.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-900 dark:text-white mb-4">Depreciation Schedule</h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-200 dark:border-white/10 max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0">
                  <tr className="bg-white dark:bg-slate-800/90 text-slate-600 dark:text-slate-600 dark:text-slate-400 font-semibold">
                    <th className="px-4 py-3 text-left">Year</th>
                    <th className="px-4 py-3 text-right">Depreciation</th>
                    <th className="px-4 py-3 text-right">Book Value</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((row, i) => (
                    <tr key={row.year} className={`border-t border-gray-100 dark:border-gray-100 dark:border-white/5 hover:bg-white dark:bg-white dark:bg-white/5 transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-700 dark:text-slate-300 font-medium">Year {row.year}</td>
                      <td className="px-4 py-3 text-right text-red-300 font-semibold">−{disp(row.depreciation)}</td>
                      <td className="px-4 py-3 text-right text-emerald-300 font-semibold">{disp(row.bookValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
