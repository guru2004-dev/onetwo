'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, RotateCcw, TrendingUp, Sparkles, Info } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

function fmtAmt(n: number, symbol: string): string {
  if (!isFinite(n) || n < 0) return `${symbol}0.00`;
  return `${symbol}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtShort(n: number, symbol: string): string {
  if (!isFinite(n)) return `${symbol}0`;
  if (n >= 1_00_00_000) return `${symbol}${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `${symbol}${(n / 1_00_000).toFixed(2)} L`;
  if (n >= 1_000) return `${symbol}${(n / 1_000).toFixed(1)} K`;
  return `${symbol}${n.toFixed(2)}`;
}

export default function LumpsumCalculator() {
  const { selectedInputCurrency, setSelectedInputCurrency, selectedResultCurrency, setSelectedResultCurrency, availableCurrencies, loading: ratesLoading, updateCurrencyRates, lastUpdatedTime, getCurrencySymbol, convertToINR, convertFromINR } = useCurrency();
  const [amountRaw, setAmountRaw] = useState('100000');
  const [rateRaw, setRateRaw] = useState('12');
  const [durationRaw, setDurationRaw] = useState('10');
  const [durationUnit, setDurationUnit] = useState<'years' | 'months'>('years');
  const [result, setResult] = useState<{ fv: number; invested: number; returns: number } | null>(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 30000); return () => clearInterval(id); }, []);
  const relTime = useMemo(() => { void tick; if (!lastUpdatedTime) return 'never'; const s = Math.max(1, Math.floor((Date.now() - lastUpdatedTime) / 1000)); if (s < 60) return `${s}s ago`; const m = Math.floor(s / 60); return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`; }, [lastUpdatedTime, tick]);

  const calculate = useCallback(() => {
    setError('');
    const amount = Number(amountRaw); const rate = Number(rateRaw); const duration = Number(durationRaw);
    if (!amountRaw || isNaN(amount) || amount <= 0) { setError('Enter a valid investment amount.'); setResult(null); return; }
    if (isNaN(rate) || rate < 0) { setError('Enter a valid annual return rate.'); setResult(null); return; }
    if (!durationRaw || isNaN(duration) || duration <= 0) { setError('Enter a valid investment duration.'); setResult(null); return; }
    const p = convertToINR(amount, selectedInputCurrency);
    let fv: number;
    if (rate === 0) { fv = p; } else if (durationUnit === 'years') { fv = p * Math.pow(1 + rate / 100, duration); } else { fv = p * Math.pow(1 + rate / 12 / 100, duration); }
    setResult({ fv, invested: p, returns: fv - p });
  }, [amountRaw, rateRaw, durationRaw, durationUnit, selectedInputCurrency, convertToINR]);

  useEffect(() => { calculate(); }, [calculate, lastUpdatedTime]);
  const handleReset = () => { setAmountRaw('100000'); setRateRaw('12'); setDurationRaw('10'); setDurationUnit('years'); setResult(null); setError(''); };
  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);
  const disp = (inr: number) => fmtAmt(convertFromINR(inr, selectedResultCurrency), currSym);
  const dispShort = (inr: number) => fmtShort(convertFromINR(inr, selectedResultCurrency), currSym);
  const investedPct = result && result.fv > 0 ? (result.invested / result.fv) * 100 : 0;
  const insight = useMemo(() => {
    if (!result) return null;
    const years = durationUnit === 'years' ? Number(durationRaw) : Number(durationRaw) / 12;
    if (years < 3) return { text: 'Increase investment duration to maximize returns significantly.', type: 'warning' };
    if (result.returns / result.invested > 1) return { text: 'Your investment shows exceptional long-term growth! 🚀', type: 'success' };
    return { text: 'Your investment shows strong long-term growth potential.', type: 'success' };
  }, [result, durationRaw, durationUnit]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-violet-100 dark:to-violet-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm font-medium mb-4">
          <TrendingUp className="w-4 h-4" /> One-Time Investment
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-extrabold text-slate-900 dark:text-slate-900 dark:text-white tracking-tight mb-2">
          Lumpsum <span className="text-violet-400">Calculator</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-lg">Estimate future value of your one-time investment with compound growth.</motion.p>
      </div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div><h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">Inputs</h2><p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">Enter your investment details</p></div>
            <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-slate-900 dark:text-white bg-white dark:bg-white dark:bg-white/5 hover:bg-white/10 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-lg transition-all"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-2">Input Currency</label>
            <select value={selectedInputCurrency} onChange={e => { if (availableCurrencies.includes(e.target.value as never)) setSelectedInputCurrency(e.target.value as never); }} disabled={ratesLoading} className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all">
              {availableCurrencies.map(c => <option key={c} value={c} className="bg-white dark:bg-slate-800">{c} ({getCurrencySymbol(c)})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1.5">Investment Amount</label>
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 font-bold text-sm pointer-events-none">{inputSym}</span>
              <input type="number" value={amountRaw} onChange={e => setAmountRaw(e.target.value)} placeholder="e.g. 100000" min={0} className="w-full pl-8 pr-4 py-3 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" /></div>
            <input type="range" min={1000} max={10000000} step={1000} value={Number(amountRaw) || 0} onChange={e => setAmountRaw(e.target.value)} className="w-full mt-2 accent-violet-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1.5">Expected Annual Return (%)</label>
            <div className="relative"><input type="number" value={rateRaw} onChange={e => setRateRaw(e.target.value)} placeholder="e.g. 12" min={0} max={50} step="0.1" className="w-full pl-4 pr-10 py-3 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 font-bold text-sm pointer-events-none">%</span></div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300">Investment Duration</label>
              <div className="flex items-center gap-0.5 bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-lg p-0.5">
                {(['years', 'months'] as const).map(u => <button key={u} onClick={() => setDurationUnit(u)} className={`px-2.5 py-1 text-[11px] rounded-md font-semibold transition-all ${durationUnit === u ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-900 dark:text-white'}`}>{u.charAt(0).toUpperCase() + u.slice(1)}</button>)}
              </div>
            </div>
            <div className="relative"><input type="number" value={durationRaw} onChange={e => setDurationRaw(e.target.value)} placeholder={durationUnit === 'years' ? 'e.g. 10' : 'e.g. 120'} min={1} className="w-full pl-4 pr-16 py-3 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 font-bold text-xs pointer-events-none capitalize">{durationUnit}</span></div>
          </div>
          {error && <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm"><Info className="w-4 h-4 shrink-0" /> {error}</div>}
          <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-4 mt-auto"><p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Formula</p><p className="text-xs font-mono text-slate-600 dark:text-slate-600 dark:text-slate-400">FV = P × (1 + r)ⁿ</p></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex flex-col gap-6">
          <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div><h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">Results</h2><p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">Updated: <span className="text-violet-300">{relTime}</span></p></div>
              <button onClick={() => updateCurrencyRates()} disabled={ratesLoading} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"><RefreshCw className={`w-4 h-4 ${ratesLoading ? 'animate-spin' : ''}`} /> Update</button>
            </div>
            <div className="mb-5"><p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Display Currency</p><div className="flex flex-wrap gap-2">{availableCurrencies.map(c => <button key={c} onClick={() => setSelectedResultCurrency(c as never)} className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${selectedResultCurrency === c ? 'bg-violet-600 border-violet-500 text-white' : 'bg-white dark:bg-white dark:bg-white/5 border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-600 dark:text-slate-400 hover:border-violet-400 hover:text-slate-800 dark:text-slate-800 dark:text-slate-200'}`}>{c}</button>)}</div></div>
            {result ? (
              <div className="flex flex-col gap-3">
                <div className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 rounded-xl p-4"><p className="text-xs font-semibold text-violet-300 uppercase tracking-wider mb-1">Future Value</p><p className="text-3xl font-extrabold text-slate-900 dark:text-slate-900 dark:text-white">{dispShort(result.fv)}</p><p className="text-xs text-slate-600 dark:text-slate-600 dark:text-slate-400 mt-1">{disp(result.fv)}</p></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Total Invested</p><p className="text-xl font-bold text-blue-300">{dispShort(result.invested)}</p></div>
                  <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Est. Returns</p><p className="text-xl font-bold text-violet-300">{dispShort(result.returns)}</p></div>
                </div>
                <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">Breakdown</p>
                  {[{ label: 'Invested', pct: investedPct, color: 'bg-blue-500', text: 'text-blue-300' }, { label: 'Returns', pct: 100 - investedPct, color: 'bg-violet-500', text: 'text-violet-300' }].map((bar, i) => (
                    <div key={bar.label} className="mb-2">
                      <div className="flex justify-between text-xs mb-1"><span className={`font-semibold ${bar.text}`}>{bar.label}</span><span className="text-slate-700 dark:text-slate-700 dark:text-slate-300">{bar.pct.toFixed(1)}%</span></div>
                      <div className="h-3 bg-white dark:bg-white dark:bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${bar.pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className={`h-full ${bar.color} rounded-full`} /></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-14 text-slate-500 gap-3"><TrendingUp className="w-12 h-12 opacity-20" /><p className="text-sm">Enter values to see your projection</p></div>
            )}
          </div>
          {insight && result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-3 px-5 py-4 rounded-2xl border-l-4 ${insight.type === 'success' ? 'bg-violet-50/5 border-violet-400 text-violet-200' : 'bg-amber-50/5 border-amber-400 text-amber-200'}`}>
              <Sparkles className="w-5 h-5 mt-0.5 shrink-0" /><div><p className="font-semibold text-sm">Smart Insight</p><p className="text-sm mt-0.5 opacity-90">{insight.text}</p></div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
