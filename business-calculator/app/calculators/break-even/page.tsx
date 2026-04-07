'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, RotateCcw, TrendingUp, Sparkles, Info, Target } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

function fmtAmt(n: number, sym: string) { if (!isFinite(n) || n < 0) return `${sym}0.00`; return `${sym}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtShort(n: number, sym: string) { if (!isFinite(n)) return `${sym}0`; if (n >= 1_00_00_000) return `${sym}${(n / 1_00_00_000).toFixed(2)} Cr`; if (n >= 1_00_000) return `${sym}${(n / 1_00_000).toFixed(2)} L`; if (n >= 1_000) return `${sym}${(n / 1_000).toFixed(1)} K`; return `${sym}${n.toFixed(2)}`; }

export default function BreakEvenCalculator() {
  const { selectedInputCurrency, setSelectedInputCurrency, selectedResultCurrency, setSelectedResultCurrency, availableCurrencies, loading: ratesLoading, updateCurrencyRates, lastUpdatedTime, getCurrencySymbol, convertToINR, convertFromINR } = useCurrency();
  const [fixedRaw, setFixedRaw] = useState('500000');
  const [varRaw, setVarRaw] = useState('200');
  const [priceRaw, setPriceRaw] = useState('500');
  const [result, setResult] = useState<{ units: number; revenue: number; contribution: number; fixed: number; variable: number; price: number } | null>(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 30000); return () => clearInterval(id); }, []);
  const relTime = useMemo(() => { void tick; if (!lastUpdatedTime) return 'never'; const s = Math.max(1, Math.floor((Date.now() - lastUpdatedTime) / 1000)); if (s < 60) return `${s}s ago`; const m = Math.floor(s / 60); return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`; }, [lastUpdatedTime, tick]);

  const calculate = useCallback(() => {
    setError('');
    const fixed = Number(fixedRaw); const variable = Number(varRaw); const price = Number(priceRaw);
    if (!fixedRaw || isNaN(fixed) || fixed < 0) { setError('Enter a valid fixed cost.'); setResult(null); return; }
    if (!varRaw || isNaN(variable) || variable < 0) { setError('Enter a valid variable cost per unit.'); setResult(null); return; }
    if (!priceRaw || isNaN(price) || price <= 0) { setError('Enter a valid selling price per unit.'); setResult(null); return; }
    const fixedINR = convertToINR(fixed, selectedInputCurrency);
    const variableINR = convertToINR(variable, selectedInputCurrency);
    const priceINR = convertToINR(price, selectedInputCurrency);
    const contribution = priceINR - variableINR;
    if (contribution <= 0) { setError('Selling price must be greater than variable cost.'); setResult(null); return; }
    const units = fixedINR / contribution;
    const revenue = units * priceINR;
    setResult({ units, revenue, contribution, fixed: fixedINR, variable: variableINR, price: priceINR });
  }, [fixedRaw, varRaw, priceRaw, selectedInputCurrency, convertToINR]);

  useEffect(() => { calculate(); }, [calculate, lastUpdatedTime]);
  const handleReset = () => { setFixedRaw('500000'); setVarRaw('200'); setPriceRaw('500'); setResult(null); setError(''); };
  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);
  const disp = (inr: number) => fmtAmt(convertFromINR(inr, selectedResultCurrency), currSym);
  const dispShort = (inr: number) => fmtShort(convertFromINR(inr, selectedResultCurrency), currSym);
  const insight = useMemo(() => {
    if (!result) return null;
    const margin = result.contribution / result.price;
    if (margin < 0.2) return { text: 'Increase selling price or reduce variable costs to reach break-even faster.', type: 'warning' };
    if (result.units > 10000) return { text: 'High break-even point indicates higher business risk. Review your cost structure.', type: 'warning' };
    return { text: 'Good contribution margin! Your break-even point is achievable.', type: 'success' };
  }, [result]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-teal-100 dark:to-teal-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-sm font-medium mb-4">
          <Target className="w-4 h-4" /> Break-Even Analysis
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
          Break-Even <span className="text-teal-400">Calculator</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-600 dark:text-slate-400 text-lg">Find the exact point where your revenue equals your total costs.</motion.p>
      </div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div><h2 className="text-lg font-bold text-slate-900 dark:text-white">Inputs</h2><p className="text-slate-600 dark:text-slate-400 text-sm">Enter your cost structure</p></div>
            <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white bg-white dark:bg-white/5 hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg transition-all"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Input Currency</label>
            <select value={selectedInputCurrency} onChange={e => { if (availableCurrencies.includes(e.target.value as never)) setSelectedInputCurrency(e.target.value as never); }} disabled={ratesLoading} className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all">
              {availableCurrencies.map(c => <option key={c} value={c} className="bg-white dark:bg-slate-800">{c} ({getCurrencySymbol(c)})</option>)}
            </select>
          </div>
          {[
            { label: 'Fixed Costs', val: fixedRaw, set: setFixedRaw, ph: 'e.g. 500000', hint: 'Rent, salaries, utilities' },
            { label: 'Variable Cost per Unit', val: varRaw, set: setVarRaw, ph: 'e.g. 200', hint: 'Cost to produce one unit' },
            { label: 'Selling Price per Unit', val: priceRaw, set: setPriceRaw, ph: 'e.g. 500', hint: 'Price charged per unit' },
          ].map(field => (
            <div key={field.label}>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{field.label}</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 font-bold text-sm pointer-events-none">{inputSym}</span>
                <input type="number" value={field.val} onChange={e => field.set(e.target.value)} placeholder={field.ph} min={0} className="w-full pl-8 pr-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all" /></div>
              <p className="text-xs text-slate-500 mt-1">{field.hint}</p>
            </div>
          ))}
          {error && <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm"><Info className="w-4 h-4 shrink-0" /> {error}</div>}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 mt-auto"><p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Formula</p><p className="text-xs font-mono text-slate-600 dark:text-slate-400">BEP = Fixed Costs / (Price − Variable Cost)</p></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex flex-col gap-6">
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div><h2 className="text-lg font-bold text-slate-900 dark:text-white">Results</h2><p className="text-slate-600 dark:text-slate-400 text-sm">Updated: <span className="text-teal-300">{relTime}</span></p></div>
              <button onClick={() => updateCurrencyRates()} disabled={ratesLoading} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"><RefreshCw className={`w-4 h-4 ${ratesLoading ? 'animate-spin' : ''}`} /> Update</button>
            </div>
            <div className="mb-5"><p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Display Currency</p><div className="flex flex-wrap gap-2">{availableCurrencies.map(c => <button key={c} onClick={() => setSelectedResultCurrency(c as never)} className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${selectedResultCurrency === c ? 'bg-teal-600 border-teal-500 text-white' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-teal-400 hover:text-slate-800 dark:text-slate-800 dark:text-slate-200'}`}>{c}</button>)}</div></div>
            {result ? (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 rounded-xl p-4"><p className="text-xs font-semibold text-teal-300 uppercase tracking-wider mb-1">Break-Even Units</p><p className="text-2xl font-extrabold text-slate-900 dark:text-white">{Math.ceil(result.units).toLocaleString()}</p><p className="text-xs text-slate-600 dark:text-slate-400">units</p></div>
                  <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl p-4"><p className="text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-1">Break-Even Revenue</p><p className="text-2xl font-extrabold text-slate-900 dark:text-white">{dispShort(result.revenue)}</p></div>
                </div>
                <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Contribution per Unit</p><p className="text-xl font-bold text-emerald-300">{disp(result.contribution)}</p><p className="text-xs text-slate-500 mt-1">Price ({disp(result.price)}) − Variable ({disp(result.variable)})</p></div>
                <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">Cost Structure</p>
                  {(() => {
                    const totalAtBEP = result.revenue; const fixedPct = totalAtBEP > 0 ? (result.fixed / totalAtBEP) * 100 : 0;
                    const varTotalAtBEP = result.variable * result.units; const varPct = totalAtBEP > 0 ? (varTotalAtBEP / totalAtBEP) * 100 : 0;
                    return [{ label: 'Fixed Costs', pct: fixedPct, color: 'bg-rose-500', text: 'text-rose-300' }, { label: 'Variable Costs', pct: varPct, color: 'bg-amber-500', text: 'text-amber-300' }].map((bar, i) => (
                      <div key={bar.label} className="mb-2">
                        <div className="flex justify-between text-xs mb-1"><span className={`font-semibold ${bar.text}`}>{bar.label}</span><span className="text-slate-700 dark:text-slate-300">{bar.pct.toFixed(1)}%</span></div>
                        <div className="h-3 bg-white dark:bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${bar.pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className={`h-full ${bar.color} rounded-full`} /></div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-14 text-slate-500 gap-3"><TrendingUp className="w-12 h-12 opacity-20" /><p className="text-sm">Enter values to find break-even point</p></div>
            )}
          </div>
          {insight && result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-3 px-5 py-4 rounded-2xl border-l-4 ${insight.type === 'success' ? 'bg-teal-50/5 border-teal-400 text-teal-200' : 'bg-amber-50/5 border-amber-400 text-amber-200'}`}>
              <Sparkles className="w-5 h-5 mt-0.5 shrink-0" /><div><p className="font-semibold text-sm">Smart Insight</p><p className="text-sm mt-0.5 opacity-90">{insight.text}</p></div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
