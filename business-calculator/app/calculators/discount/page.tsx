'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, RotateCcw, Sparkles, Info, Tag } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

function fmtAmt(n: number, s: string) { if (!isFinite(n) || n < 0) return `${s}0.00`; return `${s}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtShort(n: number, s: string) { if (!isFinite(n)) return `${s}0`; const a = Math.abs(n); if (a >= 1e7) return `${s}${(a / 1e7).toFixed(2)} Cr`; if (a >= 1e5) return `${s}${(a / 1e5).toFixed(2)} L`; if (a >= 1e3) return `${s}${(a / 1e3).toFixed(1)} K`; return `${s}${a.toFixed(2)}`; }

export default function DiscountCalculator() {
  const { selectedInputCurrency, setSelectedInputCurrency, selectedResultCurrency, setSelectedResultCurrency, availableCurrencies, loading: rL, updateCurrencyRates, lastUpdatedTime, getCurrencySymbol, convertToINR, convertFromINR } = useCurrency();
  const [priceRaw, setPriceRaw] = useState('5000');
  const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('percentage');
  const [discountRaw, setDiscountRaw] = useState('20');
  const [taxRateRaw, setTaxRateRaw] = useState('18');
  const [additionalRaw, setAdditionalRaw] = useState('');
  const [result, setResult] = useState<{ discountAmt: number; priceAfterDiscount: number; tax: number; final: number; savings: number; originalPrice: number } | null>(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 30000); return () => clearInterval(id); }, []);
  const relTime = useMemo(() => { void tick; if (!lastUpdatedTime) return 'never'; const s = Math.max(1, Math.floor((Date.now() - lastUpdatedTime) / 1000)); if (s < 60) return `${s}s ago`; const m = Math.floor(s / 60); return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`; }, [lastUpdatedTime, tick]);

  const calculate = useCallback(() => {
    setError('');
    const price = Number(priceRaw); const discVal = Number(discountRaw) || 0; const taxRate = Number(taxRateRaw) || 0; const additional = Number(additionalRaw) || 0;
    if (!priceRaw || isNaN(price) || price <= 0) { setError('Enter a valid original price.'); setResult(null); return; }
    const priceINR = convertToINR(price, selectedInputCurrency);
    const additionalINR = convertToINR(additional, selectedInputCurrency);
    let discountAmt = 0;
    if (discountType === 'percentage') { if (discVal > 100) { setError('Discount percentage cannot exceed 100%.'); setResult(null); return; } discountAmt = priceINR * (discVal / 100); }
    else { discountAmt = convertToINR(discVal, selectedInputCurrency); if (discountAmt > priceINR) { setError('Flat discount cannot exceed original price.'); setResult(null); return; } }
    const priceAfterDiscount = priceINR - discountAmt;
    const tax = priceAfterDiscount * (taxRate / 100);
    const final = priceAfterDiscount + tax + additionalINR;
    setResult({ discountAmt, priceAfterDiscount, tax, final, savings: priceINR - final, originalPrice: priceINR });
  }, [priceRaw, discountType, discountRaw, taxRateRaw, additionalRaw, selectedInputCurrency, convertToINR]);

  useEffect(() => { calculate(); }, [calculate, lastUpdatedTime]);

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);
  const disp = (n: number) => fmtAmt(convertFromINR(n, selectedResultCurrency), currSym);
  const dispS = (n: number) => fmtShort(convertFromINR(n, selectedResultCurrency), currSym);

  const discountPct = result && result.originalPrice > 0 ? (result.discountAmt / result.originalPrice) * 100 : 0;
  const insight = useMemo(() => {
    if (!result) return null;
    if (discountPct >= 40) return { text: 'Excellent deal! You\'re saving over 40% on this purchase. 🎉', type: 'success' };
    if (Number(taxRateRaw) > 20) return { text: 'High tax rate significantly adds to the final price. Check applicable exemptions.', type: 'warning' };
    return { text: 'Good discount applied. Final price includes all taxes and charges.', type: 'info' };
  }, [result, discountPct, taxRateRaw]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-fuchsia-100 dark:to-fuchsia-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-300 text-sm font-medium mb-4"><Tag className="w-4 h-4" /> Price & Savings</motion.div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">Discount <span className="text-fuchsia-400">Calculator</span></motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-600 dark:text-slate-400 text-lg">Calculate final price after discounts, taxes and additional charges.</motion.p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-900 dark:text-white">Inputs</h2></div>
            <button onClick={() => { setPriceRaw('5000'); setDiscountType('percentage'); setDiscountRaw('20'); setTaxRateRaw('18'); setAdditionalRaw(''); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white bg-white dark:bg-white/5 hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg transition-all"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Input Currency</label>
            <select value={selectedInputCurrency} onChange={e => { if (availableCurrencies.includes(e.target.value as never)) setSelectedInputCurrency(e.target.value as never); }} disabled={rL} className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all">
              {availableCurrencies.map(c => <option key={c} value={c} className="bg-white dark:bg-slate-800">{c} ({getCurrencySymbol(c)})</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Original Price</label>
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 text-sm">{inputSym}</span>
              <input type="number" value={priceRaw} onChange={e => setPriceRaw(e.target.value)} min={0} className="w-full pl-8 pr-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all" /></div>
            <input type="range" min={100} max={500000} step={100} value={Number(priceRaw) || 0} onChange={e => setPriceRaw(e.target.value)} className="w-full mt-2 accent-fuchsia-500" />
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Discount Type</label>
            <div className="grid grid-cols-2 gap-2">{[{ id: 'percentage', label: 'Percentage (%)' }, { id: 'flat', label: 'Flat Amount' }].map(t => <button key={t.id} onClick={() => setDiscountType(t.id as 'percentage' | 'flat')} className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${discountType === t.id ? 'bg-fuchsia-600 border-fuchsia-500 text-white' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-fuchsia-500/50'}`}>{t.label}</button>)}</div>
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Discount Value {discountType === 'flat' ? `(${inputSym})` : '(%)'}</label>
            <div className="relative"><input type="number" value={discountRaw} onChange={e => setDiscountRaw(e.target.value)} min={0} max={discountType === 'percentage' ? 100 : undefined} step="0.1" className="w-full pl-4 pr-10 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 text-sm">{discountType === 'percentage' ? '%' : inputSym}</span></div>
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tax Rate (%) <span className="text-slate-500 font-normal">optional</span></label>
            <div className="relative"><input type="number" value={taxRateRaw} onChange={e => setTaxRateRaw(e.target.value)} min={0} max={50} step="0.1" className="w-full pl-4 pr-10 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 text-sm">%</span></div>
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Additional Charges ({inputSym}) <span className="text-slate-500 font-normal">optional</span></label>
            <input type="number" value={additionalRaw} onChange={e => setAdditionalRaw(e.target.value)} min={0} placeholder="0" className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all" />
          </div>
          {error && <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm"><Info className="w-4 h-4 shrink-0" /> {error}</div>}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex flex-col gap-5">
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5"><div><h2 className="text-lg font-bold text-slate-900 dark:text-white">Results</h2><p className="text-slate-600 dark:text-slate-400 text-sm">Updated: <span className="text-fuchsia-300">{relTime}</span></p></div>
              <button onClick={() => updateCurrencyRates()} disabled={rL} className="flex items-center gap-2 px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"><RefreshCw className={`w-4 h-4 ${rL ? 'animate-spin' : ''}`} /> Update</button>
            </div>
            <div className="mb-5"><p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Display Currency</p><div className="flex flex-wrap gap-2">{availableCurrencies.map(c => <button key={c} onClick={() => setSelectedResultCurrency(c as never)} className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${selectedResultCurrency === c ? 'bg-fuchsia-600 border-fuchsia-500 text-white' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-fuchsia-400'}`}>{c}</button>)}</div></div>
            {result ? (
              <div className="flex flex-col gap-3">
                <div className="bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 border border-fuchsia-500/30 rounded-xl p-4"><p className="text-xs font-semibold text-fuchsia-300 uppercase tracking-wider mb-1">Final Price</p><p className="text-3xl font-extrabold text-slate-900 dark:text-white">{dispS(result.final)}</p><p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{disp(result.final)}</p></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Discount Amount</p><p className="text-xl font-bold text-red-300">-{dispS(result.discountAmt)}</p><p className="text-xs text-slate-500">{discountPct.toFixed(1)}% off</p></div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4"><p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1">You Save</p><p className="text-xl font-bold text-emerald-400">{result.savings > 0 ? dispS(result.savings) : 'N/A'}</p></div>
                  <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">After Discount</p><p className="text-xl font-bold text-slate-900 dark:text-white">{dispS(result.priceAfterDiscount)}</p></div>
                  <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Tax ({taxRateRaw}%)</p><p className="text-xl font-bold text-amber-300">+{dispS(result.tax)}</p></div>
                </div>
                <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">Price Breakdown</p>
                  {[{ label: 'Final Price', pct: result.originalPrice > 0 ? (result.final / result.originalPrice) * 100 : 100, color: 'bg-fuchsia-500', text: 'text-fuchsia-300' }, { label: 'Discount', pct: discountPct, color: 'bg-red-500', text: 'text-red-300' }].map((bar, i) => (
                    <div key={bar.label} className="mb-2"><div className="flex justify-between text-xs mb-1"><span className={`font-semibold ${bar.text}`}>{bar.label}</span><span className="text-slate-700 dark:text-slate-300">{bar.pct.toFixed(1)}%</span></div><div className="h-3 bg-white dark:bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(bar.pct, 100)}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className={`h-full ${bar.color} rounded-full`} /></div></div>
                  ))}
                </div>
              </div>
            ) : <div className="flex flex-col items-center justify-center py-14 text-slate-500 gap-3"><Tag className="w-12 h-12 opacity-20" /><p className="text-sm">Enter values to calculate discount</p></div>}
          </div>
          {insight && result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-3 px-5 py-4 rounded-2xl border-l-4 ${insight.type === 'success' ? 'bg-fuchsia-50/5 border-fuchsia-400 text-fuchsia-200' : insight.type === 'warning' ? 'bg-amber-50/5 border-amber-400 text-amber-200' : 'bg-blue-50/5 border-blue-400 text-blue-200'}`}>
              <Sparkles className="w-5 h-5 mt-0.5 shrink-0" /><div><p className="font-semibold text-sm">Smart Insight</p><p className="text-sm mt-0.5 opacity-90">{insight.text}</p></div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
