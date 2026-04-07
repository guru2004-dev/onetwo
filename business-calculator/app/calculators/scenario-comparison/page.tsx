'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, RotateCcw, Plus, Trash2, Sparkles, Info, Award } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

function fmtShort(n: number, s: string) { if (!isFinite(n)) return `${s}0`; const a = Math.abs(n); if (a >= 1e7) return `${s}${(a / 1e7).toFixed(2)} Cr`; if (a >= 1e5) return `${s}${(a / 1e5).toFixed(2)} L`; if (a >= 1e3) return `${s}${(a / 1e3).toFixed(1)} K`; return `${s}${a.toFixed(2)}`; }

interface Scenario { id: string; name: string; initial: string; monthly: string; rate: string; duration: string; unit: 'years' | 'months'; }
const mkScenario = (name: string): Scenario => ({ id: `${Date.now()}-${Math.random()}`, name, initial: '', monthly: '', rate: '12', duration: '5', unit: 'years' });

function calcFV(s: Scenario, convertToINR: (n: number, c: never) => number, currency: never) {
  const init = convertToINR(Number(s.initial) || 0, currency);
  const monthly = convertToINR(Number(s.monthly) || 0, currency);
  const rate = Number(s.rate) || 0;
  const dur = Number(s.duration) || 0;
  const months = s.unit === 'years' ? dur * 12 : dur;
  const r = rate / 12 / 100;
  let fv = init * Math.pow(1 + r, months);
  if (monthly > 0 && r > 0) fv += monthly * (((Math.pow(1 + r, months) - 1) / r) * (1 + r));
  else if (monthly > 0) fv += monthly * months;
  const totalInvest = init + monthly * months;
  const years = months / 12;
  const cagr = totalInvest > 0 && years > 0 ? (Math.pow(fv / totalInvest, 1 / years) - 1) * 100 : 0;
  return { fv, totalInvest, profit: fv - totalInvest, cagr };
}

export default function ScenarioComparisonCalculator() {
  const { selectedInputCurrency, setSelectedInputCurrency, selectedResultCurrency, setSelectedResultCurrency, availableCurrencies, loading: rL, updateCurrencyRates, lastUpdatedTime, getCurrencySymbol, convertToINR, convertFromINR } = useCurrency();
  const [scenarios, setScenarios] = useState<Scenario[]>([mkScenario('Scenario A'), mkScenario('Scenario B'), mkScenario('Scenario C')]);
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 30000); return () => clearInterval(id); }, []);
  const relTime = useMemo(() => { void tick; if (!lastUpdatedTime) return 'never'; const s = Math.max(1, Math.floor((Date.now() - lastUpdatedTime) / 1000)); if (s < 60) return `${s}s ago`; const m = Math.floor(s / 60); return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`; }, [lastUpdatedTime, tick]);

  const results = useMemo(() => scenarios.map(s => ({ ...s, ...calcFV(s, convertToINR, selectedInputCurrency as never) })), [scenarios, selectedInputCurrency, convertToINR, lastUpdatedTime]);
  const maxFV = Math.max(...results.map(r => r.fv), 1);
  const bestIdx = results.reduce((bi, r, i) => r.fv > results[bi].fv ? i : bi, 0);

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const d = (n: number) => fmtShort(convertFromINR(Math.abs(n), selectedResultCurrency), currSym);
  const COLORS = [{ bg: 'from-indigo-600/20 to-violet-600/20', border: 'border-indigo-500/30', accent: 'bg-indigo-500', text: 'text-indigo-400' }, { bg: 'from-emerald-600/20 to-teal-600/20', border: 'border-emerald-500/30', accent: 'bg-emerald-500', text: 'text-emerald-400' }, { bg: 'from-amber-600/20 to-orange-600/20', border: 'border-amber-500/30', accent: 'bg-amber-500', text: 'text-amber-400' }, { bg: 'from-rose-600/20 to-pink-600/20', border: 'border-rose-500/30', accent: 'bg-rose-500', text: 'text-rose-400' }];
  const upd = (id: string, field: keyof Scenario, val: string) => setScenarios(p => p.map(s => s.id === id ? { ...s, [field]: val } : s));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-purple-100 dark:to-purple-950 py-10 px-4">
      <div className="max-w-7xl mx-auto mb-8 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium mb-4"><Award className="w-4 h-4" /> Multi-Scenario Analysis</motion.div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">Scenario <span className="text-purple-400">Comparison</span></motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-600 dark:text-slate-400 text-lg">Compare multiple financial scenarios to find the best investment strategy.</motion.p>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Controls */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3"><label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Input Currency</label>
            <select value={selectedInputCurrency} onChange={e => { if (availableCurrencies.includes(e.target.value as never)) setSelectedInputCurrency(e.target.value as never); }} disabled={rL} className="px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
              {availableCurrencies.map(c => <option key={c} value={c} className="bg-white dark:bg-slate-800">{c} ({getCurrencySymbol(c)})</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            {scenarios.length < 4 && <button onClick={() => setScenarios(p => [...p, mkScenario(`Scenario ${String.fromCharCode(65 + p.length)}`)])} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-300 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 rounded-lg transition-all"><Plus className="w-3.5 h-3.5" /> Add Scenario</button>}
            <button onClick={() => setScenarios([mkScenario('Scenario A'), mkScenario('Scenario B'), mkScenario('Scenario C')])} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-white/5 hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg transition-all"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
            <button onClick={() => updateCurrencyRates()} disabled={rL} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"><RefreshCw className={`w-4 h-4 ${rL ? 'animate-spin' : ''}`} /> Update</button>
          </div>
        </motion.div>

        {/* Scenario Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {scenarios.map((s, idx) => {
              const c = COLORS[idx % COLORS.length];
              return (
                <motion.div key={s.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={`bg-gradient-to-br ${c.bg} backdrop-blur-xl border ${c.border} rounded-2xl shadow-2xl p-5 flex flex-col gap-3`}>
                  <div className="flex items-center justify-between">
                    <input type="text" value={s.name} onChange={e => upd(s.id, 'name', e.target.value)} className="bg-transparent border-none text-slate-900 dark:text-white font-bold text-base focus:outline-none w-32" maxLength={20} />
                    {scenarios.length > 2 && <button onClick={() => setScenarios(p => p.filter(x => x.id !== s.id))} className="p-1.5 text-slate-500 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                  {[{ label: 'Initial Investment', field: 'initial' as keyof Scenario, ph: 'e.g. 100000' }, { label: 'Monthly Investment', field: 'monthly' as keyof Scenario, ph: 'Optional' }].map(f => (
                    <div key={f.field}><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{f.label}</label>
                      <input type="number" value={s[f.field] as string} onChange={e => upd(s.id, f.field, e.target.value)} placeholder={f.ph} min={0} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all" /></div>
                  ))}
                  <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Expected Return (%)</label>
                    <input type="number" value={s.rate} onChange={e => upd(s.id, 'rate', e.target.value)} min={0} max={50} step="0.1" className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all" /></div>
                  <div><div className="flex items-center justify-between mb-1"><label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Duration</label>
                    <div className="flex gap-0.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-md p-0.5">{(['years', 'months'] as const).map(u => <button key={u} onClick={() => upd(s.id, 'unit', u)} className={`px-2 py-0.5 text-[10px] rounded font-semibold transition-all ${s.unit === u ? `${c.accent} text-slate-900 dark:text-white` : 'text-slate-500'}`}>{u.charAt(0).toUpperCase() + u.slice(1)}</button>)}</div>
                  </div>
                    <input type="number" value={s.duration} onChange={e => upd(s.id, 'duration', e.target.value)} min={1} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all" /></div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Comparison Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-slate-900 dark:text-white">Comparison Results</h2>
            <div><p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Display Currency</p><div className="flex flex-wrap gap-1.5">{availableCurrencies.map(c => <button key={c} onClick={() => setSelectedResultCurrency(c as never)} className={`px-2 py-0.5 text-[10px] rounded-full border font-medium transition-all ${selectedResultCurrency === c ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-purple-400'}`}>{c}</button>)}</div></div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-semibold"><th className="px-4 py-3 text-left">Scenario</th><th className="px-4 py-3 text-right">Final Value</th><th className="px-4 py-3 text-right">Total Invested</th><th className="px-4 py-3 text-right">Profit</th><th className="px-4 py-3 text-right">CAGR</th><th className="px-4 py-3 text-center">Rank</th></tr></thead>
              <tbody>
                {results.map((r, i) => {
                  const c = COLORS[i % COLORS.length];
                  const isBest = i === bestIdx;
                  return <tr key={r.id} className={`border-t border-gray-100 dark:border-gray-100 dark:border-white/5 hover:bg-white/5 transition-colors ${isBest ? 'bg-emerald-500/5' : ''}`}>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${c.accent}`} /><span className={`font-semibold ${c.text}`}>{r.name}</span></div></td>
                    <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-bold">{d(r.fv)}</td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{d(r.totalInvest)}</td>
                    <td className={`px-4 py-3 text-right font-bold ${r.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{r.profit >= 0 ? '+' : ''}{d(r.profit)}</td>
                    <td className={`px-4 py-3 text-right font-bold ${r.cagr > 15 ? 'text-emerald-400' : r.cagr >= 8 ? 'text-amber-400' : 'text-red-400'}`}>{r.cagr.toFixed(2)}%</td>
                    <td className="px-4 py-3 text-center">{isBest ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold"><Award className="w-3 h-3" /> Best</span> : <span className="text-slate-600">—</span>}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-5 space-y-3">
            {results.map((r, i) => { const c = COLORS[i % COLORS.length]; const pct = maxFV > 0 ? (r.fv / maxFV) * 100 : 0; return <div key={r.id}><div className="flex justify-between text-xs mb-1"><span className={`font-semibold ${c.text}`}>{r.name}</span><span className="text-slate-700 dark:text-slate-300">{d(r.fv)}</span></div><div className="h-3 bg-white dark:bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className={`h-full ${c.accent} rounded-full`} /></div></div>; })}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="flex items-start gap-3 px-5 py-4 rounded-2xl border-l-4 bg-purple-50/5 border-purple-400 text-purple-200">
          <Sparkles className="w-5 h-5 mt-0.5 shrink-0" /><div><p className="font-semibold text-sm">Smart Insight</p>
            <p className="text-sm mt-0.5 opacity-90">{results[bestIdx]?.name} gives the highest return of {d(results[bestIdx]?.fv ?? 0)} with a CAGR of {(results[bestIdx]?.cagr ?? 0).toFixed(2)}%. Long-term investments consistently outperform short-term strategies.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
