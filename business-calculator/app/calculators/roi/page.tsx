'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, RotateCcw, TrendingUp, Sparkles, Info } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

function fmtAmt(n: number, sym: string) { if (!isFinite(n) || n < 0) return `${sym}0.00`; return `${sym}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtShort(n: number, sym: string) { if (!isFinite(n)) return `${sym}0`; if (n >= 1_00_00_000) return `${sym}${(n / 1_00_00_000).toFixed(2)} Cr`; if (n >= 1_00_000) return `${sym}${(n / 1_00_000).toFixed(2)} L`; if (n >= 1_000) return `${sym}${(n / 1_000).toFixed(1)} K`; return `${sym}${n.toFixed(2)}`; }

export default function ROICalculator() {
  const { selectedInputCurrency, setSelectedInputCurrency, selectedResultCurrency, setSelectedResultCurrency, availableCurrencies, loading: ratesLoading, updateCurrencyRates, lastUpdatedTime, getCurrencySymbol, convertToINR, convertFromINR } = useCurrency();
  const [costRaw, setCostRaw] = useState('100000');
  const [finalRaw, setFinalRaw] = useState('150000');
  const [yearsRaw, setYearsRaw] = useState('');
  const [result, setResult] = useState<{ roi: number; profit: number; annualROI: number | null; cost: number; finalVal: number } | null>(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 30000); return () => clearInterval(id); }, []);
  const relTime = useMemo(() => { void tick; if (!lastUpdatedTime) return 'never'; const s = Math.max(1, Math.floor((Date.now() - lastUpdatedTime) / 1000)); if (s < 60) return `${s}s ago`; const m = Math.floor(s / 60); return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`; }, [lastUpdatedTime, tick]);

  const calculate = useCallback(() => {
    setError('');
    const cost = Number(costRaw); const finalVal = Number(finalRaw);
    if (!costRaw || isNaN(cost) || cost <= 0) { setError('Enter a valid investment cost.'); setResult(null); return; }
    if (!finalRaw || isNaN(finalVal) || finalVal < 0) { setError('Enter a valid final value.'); setResult(null); return; }
    const costINR = convertToINR(cost, selectedInputCurrency);
    const finalINR = convertToINR(finalVal, selectedInputCurrency);
    const profit = finalINR - costINR;
    const roi = ((finalINR - costINR) / costINR) * 100;
    let annualROI: number | null = null;
    const years = Number(yearsRaw);
    if (yearsRaw && !isNaN(years) && years > 0) { annualROI = (Math.pow(finalINR / costINR, 1 / years) - 1) * 100; }
    setResult({ roi, profit, annualROI, cost: costINR, finalVal: finalINR });
  }, [costRaw, finalRaw, yearsRaw, selectedInputCurrency, convertToINR]);

  useEffect(() => { calculate(); }, [calculate, lastUpdatedTime]);
  const handleReset = () => { setCostRaw('100000'); setFinalRaw('150000'); setYearsRaw(''); setResult(null); setError(''); };
  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);
  const disp = (inr: number) => fmtAmt(convertFromINR(inr, selectedResultCurrency), currSym);
  const dispShort = (inr: number) => fmtShort(convertFromINR(inr, selectedResultCurrency), currSym);
  const investedPct = result && result.finalVal > 0 ? (result.cost / result.finalVal) * 100 : 0;
  const insight = useMemo(() => {
    if (!result) return null;
    if (result.roi < 10) return { text: 'Low return. Consider exploring better investment options.', type: 'warning' };
    if (result.roi <= 25) return { text: 'Moderate return. Solid performance with room to grow.', type: 'info' };
    return { text: 'High return! This is an excellent investment. 🚀', type: 'success' };
  }, [result]);

  const roiColor = result ? (result.roi < 10 ? 'text-red-400' : result.roi <= 25 ? 'text-amber-400' : 'text-emerald-400') : 'text-slate-900 dark:text-slate-900 dark:text-white';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-rose-100 dark:to-rose-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-sm font-medium mb-4">
          <TrendingUp className="w-4 h-4" /> Return on Investment
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-extrabold text-slate-900 dark:text-slate-900 dark:text-white tracking-tight mb-2">
          ROI <span className="text-rose-400">Calculator</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-lg">Measure the profitability of your investment or business venture.</motion.p>
      </div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div><h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">Inputs</h2><p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">Enter your investment details</p></div>
            <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-slate-900 dark:text-white bg-white dark:bg-white dark:bg-white/5 hover:bg-white/10 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-lg transition-all"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-2">Input Currency</label>
            <select value={selectedInputCurrency} onChange={e => { if (availableCurrencies.includes(e.target.value as never)) setSelectedInputCurrency(e.target.value as never); }} disabled={ratesLoading} className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all">
              {availableCurrencies.map(c => <option key={c} value={c} className="bg-white dark:bg-slate-800">{c} ({getCurrencySymbol(c)})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1.5">Investment Cost</label>
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 font-bold text-sm pointer-events-none">{inputSym}</span>
              <input type="number" value={costRaw} onChange={e => setCostRaw(e.target.value)} placeholder="e.g. 100000" min={0} className="w-full pl-8 pr-4 py-3 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all" /></div>
            <input type="range" min={1000} max={10000000} step={1000} value={Number(costRaw) || 0} onChange={e => setCostRaw(e.target.value)} className="w-full mt-2 accent-rose-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1.5">Final Value (Return)</label>
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 font-bold text-sm pointer-events-none">{inputSym}</span>
              <input type="number" value={finalRaw} onChange={e => setFinalRaw(e.target.value)} placeholder="e.g. 150000" min={0} className="w-full pl-8 pr-4 py-3 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all" /></div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1.5">Investment Duration <span className="text-slate-500 font-normal">(optional, for annualized ROI)</span></label>
            <div className="relative"><input type="number" value={yearsRaw} onChange={e => setYearsRaw(e.target.value)} placeholder="e.g. 3" min={0} className="w-full pl-4 pr-16 py-3 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 font-bold text-xs pointer-events-none">years</span></div>
          </div>
          {error && <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm"><Info className="w-4 h-4 shrink-0" /> {error}</div>}
          <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-4 mt-auto"><p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Formula</p><p className="text-xs font-mono text-slate-600 dark:text-slate-600 dark:text-slate-400">ROI = [(Final − Cost) / Cost] × 100</p></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex flex-col gap-6">
          <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div><h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">Results</h2><p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">Updated: <span className="text-rose-300">{relTime}</span></p></div>
              <button onClick={() => updateCurrencyRates()} disabled={ratesLoading} className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"><RefreshCw className={`w-4 h-4 ${ratesLoading ? 'animate-spin' : ''}`} /> Update</button>
            </div>
            <div className="mb-5"><p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Display Currency</p><div className="flex flex-wrap gap-2">{availableCurrencies.map(c => <button key={c} onClick={() => setSelectedResultCurrency(c as never)} className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${selectedResultCurrency === c ? 'bg-rose-600 border-rose-500 text-white' : 'bg-white dark:bg-white dark:bg-white/5 border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-600 dark:text-slate-400 hover:border-rose-400 hover:text-slate-800 dark:text-slate-800 dark:text-slate-200'}`}>{c}</button>)}</div></div>
            {result ? (
              <div className="flex flex-col gap-3">
                <div className="bg-gradient-to-r from-rose-500/20 to-pink-500/20 border border-rose-500/30 rounded-xl p-4 text-center">
                  <p className="text-xs font-semibold text-rose-300 uppercase tracking-wider mb-1">ROI</p>
                  <p className={`text-5xl font-extrabold ${roiColor}`}>{result.roi.toFixed(2)}%</p>
                  {result.annualROI !== null && <p className="text-xs text-slate-600 dark:text-slate-600 dark:text-slate-400 mt-1">Annualized: <span className="text-rose-300 font-semibold">{result.annualROI.toFixed(2)}% / yr</span></p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Total Profit</p><p className={`text-xl font-bold ${result.profit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{result.profit >= 0 ? '+' : ''}{dispShort(result.profit)}</p></div>
                  <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Final Value</p><p className="text-xl font-bold text-slate-900 dark:text-slate-900 dark:text-white">{dispShort(result.finalVal)}</p></div>
                </div>
                <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">Breakdown</p>
                  {[{ label: 'Invested', pct: investedPct, color: 'bg-blue-500', text: 'text-blue-300' }, { label: 'Profit', pct: 100 - investedPct, color: 'bg-rose-500', text: 'text-rose-300' }].map((bar, i) => (
                    <div key={bar.label} className="mb-2">
                      <div className="flex justify-between text-xs mb-1"><span className={`font-semibold ${bar.text}`}>{bar.label}</span><span className="text-slate-700 dark:text-slate-700 dark:text-slate-300">{bar.pct.toFixed(1)}%</span></div>
                      <div className="h-3 bg-white dark:bg-white dark:bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${bar.pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className={`h-full ${bar.color} rounded-full`} /></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-14 text-slate-500 gap-3"><TrendingUp className="w-12 h-12 opacity-20" /><p className="text-sm">Enter values to calculate ROI</p></div>
            )}
          </div>
          {insight && result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-3 px-5 py-4 rounded-2xl border-l-4 ${insight.type === 'success' ? 'bg-emerald-50/5 border-emerald-400 text-emerald-200' : insight.type === 'warning' ? 'bg-red-50/5 border-red-400 text-red-200' : 'bg-blue-50/5 border-blue-400 text-blue-200'}`}>
              <Sparkles className="w-5 h-5 mt-0.5 shrink-0" /><div><p className="font-semibold text-sm">Smart Insight</p><p className="text-sm mt-0.5 opacity-90">{insight.text}</p></div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
