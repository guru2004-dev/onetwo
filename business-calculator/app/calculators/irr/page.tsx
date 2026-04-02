'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, RotateCcw, Plus, Trash2, Sparkles, Info } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

function fmtAmt(n: number, s: string) { if (!isFinite(n)) return `${s}0.00`; return `${s}${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

// IRR via binary search
function calcIRR(cashFlows: number[]): number | null {
  if (cashFlows.length < 2) return null;
  const npv = (r: number) => cashFlows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + r, t), 0);
  let lo = -0.999, hi = 10;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (Math.abs(npv(mid)) < 0.01) return mid * 100;
    if (npv(mid) > 0) lo = mid; else hi = mid;
  }
  return ((lo + hi) / 2) * 100;
}

// XIRR via binary search
function calcXIRR(cashFlows: number[], dates: Date[]): number | null {
  if (cashFlows.length < 2 || dates.length !== cashFlows.length) return null;
  const ref = dates[0].getTime();
  const npv = (r: number) => cashFlows.reduce((acc, cf, i) => { const t = (dates[i].getTime() - ref) / (365 * 24 * 3600 * 1000); return acc + cf / Math.pow(1 + r, t); }, 0);
  let lo = -0.999, hi = 10;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (Math.abs(npv(mid)) < 0.01) return mid * 100;
    if (npv(mid) > 0) lo = mid; else hi = mid;
  }
  return ((lo + hi) / 2) * 100;
}

interface CFEntry { id: string; amount: string; date: string; }
const mkCF = (defaultDate?: string): CFEntry => ({ id: `${Date.now()}-${Math.random()}`, amount: '', date: defaultDate ?? new Date().toISOString().split('T')[0] });

export default function IRRCalculator() {
  const { selectedInputCurrency, setSelectedInputCurrency, selectedResultCurrency, setSelectedResultCurrency, availableCurrencies, loading: rL, updateCurrencyRates, lastUpdatedTime, getCurrencySymbol, convertToINR, convertFromINR } = useCurrency();
  const [mode, setMode] = useState<'irr' | 'xirr'>('irr');
  const [investRaw, setInvestRaw] = useState('1000000');
  const [cashFlows, setCashFlows] = useState<CFEntry[]>([mkCF(), mkCF(), mkCF()]);
  const [result, setResult] = useState<{ rate: number; totalInvest: number; totalReturn: number; profit: number } | null>(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 30000); return () => clearInterval(id); }, []);
  const relTime = useMemo(() => { void tick; if (!lastUpdatedTime) return 'never'; const s = Math.max(1, Math.floor((Date.now() - lastUpdatedTime) / 1000)); if (s < 60) return `${s}s ago`; const m = Math.floor(s / 60); return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`; }, [lastUpdatedTime, tick]);

  const calculate = useCallback(() => {
    setError('');
    const invest = Number(investRaw);
    if (!investRaw || isNaN(invest) || invest <= 0) { setError('Enter a valid initial investment.'); setResult(null); return; }
    const investINR = convertToINR(invest, selectedInputCurrency);
    const cfAmounts = cashFlows.map(cf => convertToINR(Number(cf.amount) || 0, selectedInputCurrency));
    const allCFs = [-investINR, ...cfAmounts];
    const totalReturn = cfAmounts.reduce((a, b) => a + b, 0);
    let rate: number | null = null;
    if (mode === 'irr') {
      rate = calcIRR(allCFs);
    } else {
      const allDates = [new Date(), ...cashFlows.map(cf => { try { return new Date(cf.date); } catch { return new Date(); } })];
      rate = calcXIRR(allCFs, allDates);
    }
    if (rate === null) { setError('Could not converge. Check your inputs.'); setResult(null); return; }
    setResult({ rate, totalInvest: investINR, totalReturn, profit: totalReturn - investINR });
  }, [investRaw, cashFlows, mode, selectedInputCurrency, convertToINR]);

  useEffect(() => { calculate(); }, [calculate, lastUpdatedTime]);

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);
  const disp = (n: number) => fmtAmt(convertFromINR(n, selectedResultCurrency), currSym);
  const rateColor = result ? (result.rate > 15 ? 'text-emerald-400' : result.rate >= 8 ? 'text-amber-400' : 'text-red-400') : 'text-white';
  const insight = useMemo(() => {
    if (!result) return null;
    if (result.rate > 15) return { text: 'Excellent investment performance! Well above market returns. 🚀', type: 'success' };
    if (result.rate >= 8) return { text: 'Moderate return. Decent investment with steady growth.', type: 'info' };
    return { text: 'Low return. Consider alternatives with higher potential.', type: 'warning' };
  }, [result]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-medium mb-4">
          <Info className="w-4 h-4" /> Rate of Return Analysis
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-extrabold text-white tracking-tight mb-2">IRR / XIRR <span className="text-emerald-400">Calculator</span></motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-400 text-lg">Measure investment performance with Internal Rate of Return.</motion.p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-white">Inputs</h2></div>
            <button onClick={() => { setInvestRaw('1000000'); setCashFlows([mkCF(), mkCF(), mkCF()]); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[{ id: 'irr', label: 'IRR (Regular)' }, { id: 'xirr', label: 'XIRR (With Dates)' }].map(m => (
              <button key={m.id} onClick={() => setMode(m.id as 'irr' | 'xirr')} className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${mode === m.id ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:border-emerald-500/50 hover:text-slate-200'}`}>{m.label}</button>
            ))}
          </div>
          <div><label className="block text-sm font-semibold text-slate-300 mb-2">Input Currency</label>
            <select value={selectedInputCurrency} onChange={e => { if (availableCurrencies.includes(e.target.value as never)) setSelectedInputCurrency(e.target.value as never); }} disabled={rL} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all">
              {availableCurrencies.map(c => <option key={c} value={c} className="bg-slate-800">{c} ({getCurrencySymbol(c)})</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-semibold text-slate-300 mb-1.5">Initial Investment (Outflow)</label>
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{inputSym}</span>
              <input type="number" value={investRaw} onChange={e => setInvestRaw(e.target.value)} min={0} className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" /></div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2"><label className="text-sm font-semibold text-slate-300">Cash Flows (Inflows)</label>
              <button onClick={() => setCashFlows(p => [...p, mkCF()])} className="flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-300 rounded-lg transition-all"><Plus className="w-3 h-3" /> Add</button>
            </div>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              <AnimatePresence>
                {cashFlows.map((cf, idx) => (
                  <motion.div key={cf.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-12 shrink-0">{mode === 'irr' ? `Year ${idx + 1}` : `CF ${idx + 1}`}</span>
                    <div className="relative flex-1"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{inputSym}</span>
                      <input type="number" value={cf.amount} onChange={e => setCashFlows(p => p.map(x => x.id === cf.id ? { ...x, amount: e.target.value } : x))} placeholder="0" className="w-full pl-6 pr-2 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" /></div>
                    {mode === 'xirr' && <input type="date" value={cf.date} onChange={e => setCashFlows(p => p.map(x => x.id === cf.id ? { ...x, date: e.target.value } : x))} className="w-32 px-2 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500" />}
                    {cashFlows.length > 1 && <button onClick={() => setCashFlows(p => p.filter(x => x.id !== cf.id))} className="p-1.5 text-slate-500 hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
          {error && <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm"><Info className="w-4 h-4 shrink-0" /> {error}</div>}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex flex-col gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5"><div><h2 className="text-lg font-bold text-white">Results</h2><p className="text-slate-400 text-sm">Updated: <span className="text-emerald-300">{relTime}</span></p></div>
              <button onClick={() => updateCurrencyRates()} disabled={rL} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"><RefreshCw className={`w-4 h-4 ${rL ? 'animate-spin' : ''}`} /> Update</button>
            </div>
            <div className="mb-5"><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Display Currency</p><div className="flex flex-wrap gap-2">{availableCurrencies.map(c => <button key={c} onClick={() => setSelectedResultCurrency(c as never)} className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${selectedResultCurrency === c ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:border-emerald-400'}`}>{c}</button>)}</div></div>
            {result ? (
              <div className="flex flex-col gap-3">
                <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl p-4 text-center">
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">{mode.toUpperCase()}</p>
                  <p className={`text-5xl font-extrabold ${rateColor}`}>{result.rate.toFixed(2)}%</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center"><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Invested</p><p className="text-sm font-bold text-white">{disp(result.totalInvest)}</p></div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center"><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Returns</p><p className="text-sm font-bold text-emerald-300">{disp(result.totalReturn)}</p></div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center"><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Profit</p><p className={`text-sm font-bold ${result.profit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{result.profit >= 0 ? '+' : ''}{disp(result.profit)}</p></div>
                </div>
              </div>
            ) : <div className="flex flex-col items-center justify-center py-14 text-slate-500 gap-3"><p className="text-sm">Enter values to calculate {mode.toUpperCase()}</p></div>}
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
