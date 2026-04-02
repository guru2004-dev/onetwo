'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, RotateCcw, TrendingUp, Sparkles, Info } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

function fmtAmt(n: number, sym: string) { if (!isFinite(n) || n < 0) return `${sym}0.00`; return `${sym}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtShort(n: number, sym: string) { if (!isFinite(n)) return `${sym}0`; if (n >= 1_00_00_000) return `${sym}${(n / 1_00_00_000).toFixed(2)} Cr`; if (n >= 1_00_000) return `${sym}${(n / 1_00_000).toFixed(2)} L`; if (n >= 1_000) return `${sym}${(n / 1_000).toFixed(1)} K`; return `${sym}${n.toFixed(2)}`; }

export default function SimpleInterestCalculator() {
  const { selectedInputCurrency, setSelectedInputCurrency, selectedResultCurrency, setSelectedResultCurrency, availableCurrencies, loading: ratesLoading, updateCurrencyRates, lastUpdatedTime, getCurrencySymbol, convertToINR, convertFromINR } = useCurrency();
  const [principalRaw, setPrincipalRaw] = useState('100000');
  const [rateRaw, setRateRaw] = useState('8');
  const [timeRaw, setTimeRaw] = useState('5');
  const [timeUnit, setTimeUnit] = useState<'years' | 'months'>('years');
  const [result, setResult] = useState<{ si: number; total: number; principal: number } | null>(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 30000); return () => clearInterval(id); }, []);
  const relTime = useMemo(() => { void tick; if (!lastUpdatedTime) return 'never'; const s = Math.max(1, Math.floor((Date.now() - lastUpdatedTime) / 1000)); if (s < 60) return `${s}s ago`; const m = Math.floor(s / 60); return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`; }, [lastUpdatedTime, tick]);

  const calculate = useCallback(() => {
    setError('');
    const p = Number(principalRaw); const r = Number(rateRaw); const t = Number(timeRaw);
    if (!principalRaw || isNaN(p) || p <= 0) { setError('Enter a valid principal amount.'); setResult(null); return; }
    if (isNaN(r) || r < 0) { setError('Enter a valid interest rate.'); setResult(null); return; }
    if (!timeRaw || isNaN(t) || t <= 0) { setError('Enter a valid time period.'); setResult(null); return; }
    const pINR = convertToINR(p, selectedInputCurrency);
    const years = timeUnit === 'years' ? t : t / 12;
    const si = (pINR * r * years) / 100;
    setResult({ si, total: pINR + si, principal: pINR });
  }, [principalRaw, rateRaw, timeRaw, timeUnit, selectedInputCurrency, convertToINR]);

  useEffect(() => { calculate(); }, [calculate, lastUpdatedTime]);
  const handleReset = () => { setPrincipalRaw('100000'); setRateRaw('8'); setTimeRaw('5'); setTimeUnit('years'); setResult(null); setError(''); };
  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);
  const disp = (inr: number) => fmtAmt(convertFromINR(inr, selectedResultCurrency), currSym);
  const dispShort = (inr: number) => fmtShort(convertFromINR(inr, selectedResultCurrency), currSym);
  const principalPct = result && result.total > 0 ? (result.principal / result.total) * 100 : 0;
  const insight = useMemo(() => {
    if (!result) return null;
    const years = timeUnit === 'years' ? Number(timeRaw) : Number(timeRaw) / 12;
    if (years < 2) return { text: 'Longer investment duration can significantly increase your returns.', type: 'warning' };
    const ratio = result.si / result.principal;
    if (ratio > 0.4) return { text: 'This investment gives excellent returns! 🎉', type: 'success' };
    return { text: 'Steady returns. Consider longer tenure for better gains.', type: 'info' };
  }, [result, timeRaw, timeUnit]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-sm font-medium mb-4">
          <TrendingUp className="w-4 h-4" /> Simple Interest
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-extrabold text-white tracking-tight mb-2">
          Simple Interest <span className="text-cyan-400">Calculator</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-400 text-lg">Calculate interest earned on your principal amount effortlessly.</motion.p>
      </div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div><h2 className="text-lg font-bold text-white">Inputs</h2><p className="text-slate-400 text-sm">Enter your investment details</p></div>
            <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Input Currency</label>
            <select value={selectedInputCurrency} onChange={e => { if (availableCurrencies.includes(e.target.value as never)) setSelectedInputCurrency(e.target.value as never); }} disabled={ratesLoading} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all">
              {availableCurrencies.map(c => <option key={c} value={c} className="bg-slate-800">{c} ({getCurrencySymbol(c)})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Principal Amount (P)</label>
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">{inputSym}</span>
              <input type="number" value={principalRaw} onChange={e => setPrincipalRaw(e.target.value)} placeholder="e.g. 100000" min={0} className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all" /></div>
            <input type="range" min={1000} max={5000000} step={1000} value={Number(principalRaw) || 0} onChange={e => setPrincipalRaw(e.target.value)} className="w-full mt-2 accent-cyan-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Interest Rate (% per year)</label>
            <div className="relative"><input type="number" value={rateRaw} onChange={e => setRateRaw(e.target.value)} placeholder="e.g. 8" min={0} max={50} step="0.1" className="w-full pl-4 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">%</span></div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-slate-300">Time Period</label>
              <div className="flex items-center gap-0.5 bg-white/5 border border-white/10 rounded-lg p-0.5">
                {(['years', 'months'] as const).map(u => <button key={u} onClick={() => setTimeUnit(u)} className={`px-2.5 py-1 text-[11px] rounded-md font-semibold transition-all ${timeUnit === u ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-white'}`}>{u.charAt(0).toUpperCase() + u.slice(1)}</button>)}
              </div>
            </div>
            <div className="relative"><input type="number" value={timeRaw} onChange={e => setTimeRaw(e.target.value)} placeholder={timeUnit === 'years' ? 'e.g. 5' : 'e.g. 60'} min={1} className="w-full pl-4 pr-16 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none capitalize">{timeUnit}</span></div>
          </div>
          {error && <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm"><Info className="w-4 h-4 shrink-0" /> {error}</div>}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-auto"><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Formula</p><p className="text-xs font-mono text-slate-400">SI = (P × R × T) / 100</p><p className="text-xs text-slate-500 mt-1">T in years | Total = P + SI</p></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex flex-col gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div><h2 className="text-lg font-bold text-white">Results</h2><p className="text-slate-400 text-sm">Updated: <span className="text-cyan-300">{relTime}</span></p></div>
              <button onClick={() => updateCurrencyRates()} disabled={ratesLoading} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"><RefreshCw className={`w-4 h-4 ${ratesLoading ? 'animate-spin' : ''}`} /> Update</button>
            </div>
            <div className="mb-5"><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Display Currency</p><div className="flex flex-wrap gap-2">{availableCurrencies.map(c => <button key={c} onClick={() => setSelectedResultCurrency(c as never)} className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${selectedResultCurrency === c ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:border-cyan-400 hover:text-slate-200'}`}>{c}</button>)}</div></div>
            {result ? (
              <div className="flex flex-col gap-3">
                <div className="bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 rounded-xl p-4"><p className="text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-1">Total Amount</p><p className="text-3xl font-extrabold text-white">{dispShort(result.total)}</p><p className="text-xs text-slate-400 mt-1">{disp(result.total)}</p></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Principal</p><p className="text-xl font-bold text-blue-300">{dispShort(result.principal)}</p></div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Simple Interest</p><p className="text-xl font-bold text-cyan-300">{dispShort(result.si)}</p></div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Breakdown</p>
                  {[{ label: 'Principal', pct: principalPct, color: 'bg-blue-500', text: 'text-blue-300' }, { label: 'Interest', pct: 100 - principalPct, color: 'bg-cyan-500', text: 'text-cyan-300' }].map((bar, i) => (
                    <div key={bar.label} className="mb-2">
                      <div className="flex justify-between text-xs mb-1"><span className={`font-semibold ${bar.text}`}>{bar.label}</span><span className="text-slate-300">{bar.pct.toFixed(1)}%</span></div>
                      <div className="h-3 bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${bar.pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className={`h-full ${bar.color} rounded-full`} /></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-14 text-slate-500 gap-3"><TrendingUp className="w-12 h-12 opacity-20" /><p className="text-sm">Enter values to calculate simple interest</p></div>
            )}
          </div>
          {insight && result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-3 px-5 py-4 rounded-2xl border-l-4 ${insight.type === 'success' ? 'bg-cyan-50/5 border-cyan-400 text-cyan-200' : insight.type === 'warning' ? 'bg-amber-50/5 border-amber-400 text-amber-200' : 'bg-blue-50/5 border-blue-400 text-blue-200'}`}>
              <Sparkles className="w-5 h-5 mt-0.5 shrink-0" /><div><p className="font-semibold text-sm">Smart Insight</p><p className="text-sm mt-0.5 opacity-90">{insight.text}</p></div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
