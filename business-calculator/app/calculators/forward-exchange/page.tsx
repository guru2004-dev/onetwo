'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, RotateCcw, Sparkles, Info, ArrowLeftRight } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

function fmtAmt(n: number, s: string) { if (!isFinite(n)) return `${s}0.00`; return `${s}${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`; }

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'SGD', 'AED', 'CNY'];

export default function ForwardExchangeCalculator() {
  const { getCurrencySymbol, loading: rL, updateCurrencyRates, lastUpdatedTime } = useCurrency();
  const [spotRaw, setSpotRaw] = useState('83');
  const [domRateRaw, setDomRateRaw] = useState('6.5');
  const [forRateRaw, setForRateRaw] = useState('5');
  const [durationRaw, setDurationRaw] = useState('6');
  const [durationUnit, setDurationUnit] = useState<'days' | 'months' | 'years'>('months');
  const [amountRaw, setAmountRaw] = useState('100000');
  const [baseCcy, setBaseCcy] = useState('USD');
  const [quoteCcy, setQuoteCcy] = useState('INR');
  const [result, setResult] = useState<{ forwardRate: number; premium: number; contractValue: number | null; isPremium: boolean } | null>(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 30000); return () => clearInterval(id); }, []);
  const relTime = useMemo(() => { void tick; if (!lastUpdatedTime) return 'never'; const s = Math.max(1, Math.floor((Date.now() - lastUpdatedTime) / 1000)); if (s < 60) return `${s}s ago`; const m = Math.floor(s / 60); return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`; }, [lastUpdatedTime, tick]);

  const calculate = useCallback(() => {
    setError('');
    const spot = Number(spotRaw); const dom = Number(domRateRaw); const forR = Number(forRateRaw); const dur = Number(durationRaw);
    if (!spotRaw || isNaN(spot) || spot <= 0) { setError('Enter a valid spot rate.'); setResult(null); return; }
    if (isNaN(dom) || dom < 0) { setError('Enter a valid domestic rate.'); setResult(null); return; }
    if (isNaN(forR) || forR < 0) { setError('Enter a valid foreign rate.'); setResult(null); return; }
    if (!durationRaw || isNaN(dur) || dur <= 0) { setError('Enter a valid duration.'); setResult(null); return; }
    let t = dur;
    if (durationUnit === 'days') t = dur / 365;
    else if (durationUnit === 'months') t = dur / 12;
    const forwardRate = spot * (1 + (dom / 100) * t) / (1 + (forR / 100) * t);
    const premium = ((forwardRate - spot) / spot) * 100;
    const amountNum = Number(amountRaw) || 0;
    const contractValue = amountNum > 0 ? amountNum * forwardRate : null;
    setResult({ forwardRate, premium, contractValue, isPremium: forwardRate > spot });
  }, [spotRaw, domRateRaw, forRateRaw, durationRaw, durationUnit, amountRaw]);

  useEffect(() => { calculate(); }, [calculate, lastUpdatedTime]);

  const quoteCcySym = getCurrencySymbol(quoteCcy);
  const baseCcySym = getCurrencySymbol(baseCcy);

  const insight = useMemo(() => {
    if (!result) return null;
    if (result.isPremium) return { text: 'Domestic currency at PREMIUM — higher domestic interest rate attracts forward premium.', type: 'info' };
    return { text: 'Domestic currency at DISCOUNT — foreign interest rate is higher, reducing forward value.', type: 'warning' };
  }, [result]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-sm font-medium mb-4"><ArrowLeftRight className="w-4 h-4" /> Forex Markets</motion.div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-extrabold text-white tracking-tight mb-2">Forward Exchange <span className="text-cyan-400">Calculator</span></motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-400 text-lg">Calculate forward exchange rates for future currency transactions.</motion.p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-white">Inputs</h2></div>
            <button onClick={() => { setSpotRaw('83'); setDomRateRaw('6.5'); setForRateRaw('5'); setDurationRaw('6'); setDurationUnit('months'); setAmountRaw(''); setResult(null); setError(''); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
          </div>
          <div><label className="block text-sm font-semibold text-slate-300 mb-2">Currency Pair</label>
            <div className="flex items-center gap-2">
              <select value={baseCcy} onChange={e => setBaseCcy(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all">{CURRENCIES.map(c => <option key={c} value={c} className="bg-slate-800">{c}</option>)}</select>
              <button onClick={() => { setBaseCcy(quoteCcy); setQuoteCcy(baseCcy); }} className="p-2.5 rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-600/40 transition-all"><ArrowLeftRight className="w-4 h-4" /></button>
              <select value={quoteCcy} onChange={e => setQuoteCcy(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all">{CURRENCIES.map(c => <option key={c} value={c} className="bg-slate-800">{c}</option>)}</select>
            </div>
          </div>
          <div><label className="block text-sm font-semibold text-slate-300 mb-1.5">Spot Rate (1 {baseCcy} = ? {quoteCcy})</label>
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{quoteCcySym}</span>
              <input type="number" value={spotRaw} onChange={e => setSpotRaw(e.target.value)} min={0} step="0.001" className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-semibold text-slate-300 mb-1.5">Domestic Interest Rate</label>
              <div className="relative"><input type="number" value={domRateRaw} onChange={e => setDomRateRaw(e.target.value)} min={0} max={50} step="0.1" className="w-full pl-4 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span></div>
            </div>
            <div><label className="block text-sm font-semibold text-slate-300 mb-1.5">Foreign Interest Rate</label>
              <div className="relative"><input type="number" value={forRateRaw} onChange={e => setForRateRaw(e.target.value)} min={0} max={50} step="0.1" className="w-full pl-4 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5"><label className="text-sm font-semibold text-slate-300">Contract Duration</label>
              <div className="flex items-center gap-0.5 bg-white/5 border border-white/10 rounded-lg p-0.5">{(['days', 'months', 'years'] as const).map(u => <button key={u} onClick={() => setDurationUnit(u)} className={`px-2.5 py-1 text-[11px] rounded-md font-semibold transition-all ${durationUnit === u ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-white'}`}>{u.charAt(0).toUpperCase() + u.slice(1)}</button>)}</div>
            </div>
            <input type="number" value={durationRaw} onChange={e => setDurationRaw(e.target.value)} min={1} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all" />
          </div>
          <div><label className="block text-sm font-semibold text-slate-300 mb-1.5">Contract Amount ({baseCcy}) <span className="text-slate-500 font-normal">optional</span></label>
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{baseCcySym}</span>
              <input type="number" value={amountRaw} onChange={e => setAmountRaw(e.target.value)} min={0} placeholder="e.g. 100000" className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all" /></div>
          </div>
          {error && <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm"><Info className="w-4 h-4 shrink-0" /> {error}</div>}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 mt-auto"><p className="text-xs font-mono text-slate-400">F = S × (1 + rd·t) / (1 + rf·t)</p></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex flex-col gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5"><div><h2 className="text-lg font-bold text-white">Results</h2><p className="text-slate-400 text-sm">Updated: <span className="text-cyan-300">{relTime}</span></p></div>
              <button onClick={() => updateCurrencyRates()} disabled={rL} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"><RefreshCw className={`w-4 h-4 ${rL ? 'animate-spin' : ''}`} /> Update</button>
            </div>
            {result ? (
              <div className="flex flex-col gap-3">
                <div className="bg-gradient-to-r from-cyan-500/20 to-sky-500/20 border border-cyan-500/30 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Spot Rate</p><p className="text-2xl font-bold text-slate-300">{quoteCcySym}{Number(spotRaw).toFixed(4)}</p></div>
                    <div className="text-right"><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Forward Rate</p><p className="text-2xl font-bold text-cyan-300">{quoteCcySym}{result.forwardRate.toFixed(4)}</p></div>
                  </div>
                  <div className={`text-center py-2 rounded-lg ${result.isPremium ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'} font-bold text-sm`}>
                    {result.isPremium ? '⬆ Forward Premium' : '⬇ Forward Discount'} — {Math.abs(result.premium).toFixed(3)}%
                  </div>
                </div>
                {result.contractValue !== null && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Forward Contract Value</p><p className="text-2xl font-bold text-white">{quoteCcySym}{result.contractValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p><p className="text-xs text-slate-500 mt-1">{amountRaw} {baseCcy} × {result.forwardRate.toFixed(4)} = {quoteCcy}</p></div>
                )}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Rate Comparison</p>
                  {[{ label: `Spot (${baseCcy}/${quoteCcy})`, val: Number(spotRaw), max: Math.max(Number(spotRaw), result.forwardRate), color: 'bg-blue-500', text: 'text-blue-300' }, { label: `Forward Rate`, val: result.forwardRate, max: Math.max(Number(spotRaw), result.forwardRate), color: 'bg-cyan-500', text: 'text-cyan-300' }].map((bar, i) => (
                    <div key={bar.label} className="mb-2">
                      <div className="flex justify-between text-xs mb-1"><span className={`font-semibold ${bar.text}`}>{bar.label}</span><span className="text-slate-300">{bar.val.toFixed(4)}</span></div>
                      <div className="h-3 bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${(bar.val / bar.max) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className={`h-full ${bar.color} rounded-full`} /></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div className="flex flex-col items-center justify-center py-14 text-slate-500 gap-3"><ArrowLeftRight className="w-12 h-12 opacity-20" /><p className="text-sm">Enter values to calculate forward rate</p></div>}
          </div>
          {insight && result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-3 px-5 py-4 rounded-2xl border-l-4 ${insight.type === 'info' ? 'bg-cyan-50/5 border-cyan-400 text-cyan-200' : 'bg-amber-50/5 border-amber-400 text-amber-200'}`}>
              <Sparkles className="w-5 h-5 mt-0.5 shrink-0" /><div><p className="font-semibold text-sm">Smart Insight</p><p className="text-sm mt-0.5 opacity-90">{insight.text}</p></div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
