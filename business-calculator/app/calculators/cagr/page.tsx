'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, RotateCcw, TrendingUp, Sparkles, Info } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

function fmtAmt(n: number, s: string) { if (!isFinite(n) || n < 0) return `${s}0.00`; return `${s}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtShort(n: number, s: string) { if (!isFinite(n)) return `${s}0`; const a = Math.abs(n); if (a >= 1e7) return `${s}${(a / 1e7).toFixed(2)} Cr`; if (a >= 1e5) return `${s}${(a / 1e5).toFixed(2)} L`; if (a >= 1e3) return `${s}${(a / 1e3).toFixed(1)} K`; return `${s}${a.toFixed(2)}`; }

export default function CAGRCalculator() {
  const { selectedInputCurrency, setSelectedInputCurrency, selectedResultCurrency, setSelectedResultCurrency, availableCurrencies, loading: rL, updateCurrencyRates, lastUpdatedTime, getCurrencySymbol, convertToINR, convertFromINR } = useCurrency();
  const [initialRaw, setInitialRaw] = useState('100000');
  const [finalRaw, setFinalRaw] = useState('200000');
  const [durationRaw, setDurationRaw] = useState('5');
  const [durationUnit, setDurationUnit] = useState<'years' | 'months'>('years');
  const [result, setResult] = useState<{ cagr: number; totalGrowth: number; profit: number; initial: number; final: number } | null>(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 30000); return () => clearInterval(id); }, []);
  const relTime = useMemo(() => { void tick; if (!lastUpdatedTime) return 'never'; const s = Math.max(1, Math.floor((Date.now() - lastUpdatedTime) / 1000)); if (s < 60) return `${s}s ago`; const m = Math.floor(s / 60); return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`; }, [lastUpdatedTime, tick]);

  const calculate = useCallback(() => {
    setError('');
    const init = Number(initialRaw); const fin = Number(finalRaw); const dur = Number(durationRaw);
    if (!initialRaw || isNaN(init) || init <= 0) { setError('Enter a valid initial value.'); setResult(null); return; }
    if (!finalRaw || isNaN(fin) || fin <= 0) { setError('Enter a valid final value.'); setResult(null); return; }
    if (!durationRaw || isNaN(dur) || dur <= 0) { setError('Enter a valid duration.'); setResult(null); return; }
    const initINR = convertToINR(init, selectedInputCurrency); const finINR = convertToINR(fin, selectedInputCurrency);
    const years = durationUnit === 'years' ? dur : dur / 12;
    const cagr = (Math.pow(finINR / initINR, 1 / years) - 1) * 100;
    const totalGrowth = ((finINR - initINR) / initINR) * 100;
    setResult({ cagr, totalGrowth, profit: finINR - initINR, initial: initINR, final: finINR });
  }, [initialRaw, finalRaw, durationRaw, durationUnit, selectedInputCurrency, convertToINR]);

  useEffect(() => { calculate(); }, [calculate, lastUpdatedTime]);
  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);
  const disp = (n: number) => fmtAmt(convertFromINR(n, selectedResultCurrency), currSym);
  const dispS = (n: number) => fmtShort(convertFromINR(n, selectedResultCurrency), currSym);
  const cagrColor = result ? (result.cagr > 15 ? 'text-emerald-400' : result.cagr >= 8 ? 'text-amber-400' : 'text-red-400') : 'text-white';
  const insight = useMemo(() => {
    if (!result) return null;
    if (result.cagr > 15) return { text: 'Excellent growth rate! Well above benchmark returns. 🚀', type: 'success' };
    if (result.cagr >= 8) return { text: 'Moderate growth. Solid performance tracking market rates.', type: 'info' };
    return { text: 'Low growth rate. Consider moving to better-performing assets.', type: 'warning' };
  }, [result]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-green-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-sm font-medium mb-4"><TrendingUp className="w-4 h-4" /> Annual Growth Rate</motion.div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-extrabold text-white tracking-tight mb-2">CAGR <span className="text-green-400">Calculator</span></motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-400 text-lg">Calculate compound annual growth rate of your investment.</motion.p>
      </div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-white">Inputs</h2><p className="text-slate-400 text-sm">Enter investment values</p></div>
            <button onClick={() => { setInitialRaw('100000'); setFinalRaw('200000'); setDurationRaw('5'); setDurationUnit('years'); setResult(null); setError(''); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
          </div>
          <div><label className="block text-sm font-semibold text-slate-300 mb-2">Input Currency</label>
            <select value={selectedInputCurrency} onChange={e => { if (availableCurrencies.includes(e.target.value as never)) setSelectedInputCurrency(e.target.value as never); }} disabled={rL} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all">
              {availableCurrencies.map(c => <option key={c} value={c} className="bg-slate-800">{c} ({getCurrencySymbol(c)})</option>)}
            </select>
          </div>
          {[{ label: 'Initial Investment Value', val: initialRaw, set: setInitialRaw }, { label: 'Final Investment Value', val: finalRaw, set: setFinalRaw }].map(f => (
            <div key={f.label}><label className="block text-sm font-semibold text-slate-300 mb-1.5">{f.label}</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{inputSym}</span>
                <input type="number" value={f.val} onChange={e => f.set(e.target.value)} min={0} className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" /></div>
              <input type="range" min={1000} max={10000000} step={1000} value={Number(f.val) || 0} onChange={e => f.set(e.target.value)} className="w-full mt-2 accent-green-500" />
            </div>
          ))}
          <div>
            <div className="flex items-center justify-between mb-1.5"><label className="text-sm font-semibold text-slate-300">Investment Duration</label>
              <div className="flex items-center gap-0.5 bg-white/5 border border-white/10 rounded-lg p-0.5">{(['years', 'months'] as const).map(u => <button key={u} onClick={() => setDurationUnit(u)} className={`px-2.5 py-1 text-[11px] rounded-md font-semibold transition-all ${durationUnit === u ? 'bg-green-600 text-white' : 'text-slate-500 hover:text-white'}`}>{u.charAt(0).toUpperCase() + u.slice(1)}</button>)}</div>
            </div>
            <div className="relative"><input type="number" value={durationRaw} onChange={e => setDurationRaw(e.target.value)} min={1} className="w-full pl-4 pr-16 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none capitalize">{durationUnit}</span></div>
          </div>
          {error && <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm"><Info className="w-4 h-4 shrink-0" /> {error}</div>}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 mt-auto"><p className="text-xs font-mono text-slate-400">CAGR = (Final/Initial)^(1/n) − 1</p></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex flex-col gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5"><div><h2 className="text-lg font-bold text-white">Results</h2><p className="text-slate-400 text-sm">Updated: <span className="text-green-300">{relTime}</span></p></div>
              <button onClick={() => updateCurrencyRates()} disabled={rL} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"><RefreshCw className={`w-4 h-4 ${rL ? 'animate-spin' : ''}`} /> Update</button>
            </div>
            <div className="mb-5"><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Display Currency</p><div className="flex flex-wrap gap-2">{availableCurrencies.map(c => <button key={c} onClick={() => setSelectedResultCurrency(c as never)} className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${selectedResultCurrency === c ? 'bg-green-600 border-green-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:border-green-400'}`}>{c}</button>)}</div></div>
            {result ? (
              <div className="flex flex-col gap-3">
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4 text-center">
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">CAGR</p>
                  <p className={`text-5xl font-extrabold ${cagrColor}`}>{result.cagr.toFixed(2)}%</p>
                  <p className="text-xs text-slate-400 mt-1">per year</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Growth</p><p className="text-xl font-bold text-green-300">{result.totalGrowth.toFixed(2)}%</p></div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Absolute Profit</p><p className="text-xl font-bold text-emerald-300">{dispS(result.profit)}</p></div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Initial vs Final</p>
                  {[{ label: 'Initial Value', val: result.initial, pct: (result.initial / result.final) * 100, color: 'bg-blue-500', text: 'text-blue-300' }, { label: 'Final Value', val: result.final, pct: 100, color: 'bg-green-500', text: 'text-green-300' }].map((bar, i) => (
                    <div key={bar.label} className="mb-2">
                      <div className="flex justify-between text-xs mb-1"><span className={`font-semibold ${bar.text}`}>{bar.label}</span><span className="text-slate-300">{disp(bar.val)}</span></div>
                      <div className="h-3 bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${bar.pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className={`h-full ${bar.color} rounded-full`} /></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div className="flex flex-col items-center justify-center py-14 text-slate-500 gap-3"><TrendingUp className="w-12 h-12 opacity-20" /><p className="text-sm">Enter values to calculate CAGR</p></div>}
          </div>
          {insight && result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-3 px-5 py-4 rounded-2xl border-l-4 ${insight.type === 'success' ? 'bg-green-50/5 border-green-400 text-green-200' : insight.type === 'warning' ? 'bg-red-50/5 border-red-400 text-red-200' : 'bg-blue-50/5 border-blue-400 text-blue-200'}`}>
              <Sparkles className="w-5 h-5 mt-0.5 shrink-0" /><div><p className="font-semibold text-sm">Smart Insight</p><p className="text-sm mt-0.5 opacity-90">{insight.text}</p></div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
