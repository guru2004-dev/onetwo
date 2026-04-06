'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, RotateCcw, Sparkles, Info, DollarSign } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

function fmtAmt(n: number, s: string) { if (!isFinite(n) || n < 0) return `${s}0.00`; return `${s}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtShort(n: number, s: string) { if (!isFinite(n)) return `${s}0`; const a = Math.abs(n); if (a >= 1e7) return `${s}${(a / 1e7).toFixed(2)} Cr`; if (a >= 1e5) return `${s}${(a / 1e5).toFixed(2)} L`; if (a >= 1e3) return `${s}${(a / 1e3).toFixed(1)} K`; return `${s}${a.toFixed(2)}`; }

export default function CommissionCalculator() {
  const { selectedInputCurrency, setSelectedInputCurrency, selectedResultCurrency, setSelectedResultCurrency, availableCurrencies, loading: rL, updateCurrencyRates, lastUpdatedTime, getCurrencySymbol, convertToINR, convertFromINR } = useCurrency();
  const [salesRaw, setSalesRaw] = useState('500000');
  const [commType, setCommType] = useState<'percentage' | 'flat'>('percentage');
  const [commValueRaw, setCommValueRaw] = useState('5');
  const [bonusRaw, setBonusRaw] = useState('');
  const [taxRateRaw, setTaxRateRaw] = useState('10');
  const [result, setResult] = useState<{ commission: number; bonus: number; totalComm: number; tax: number; finalEarnings: number; salesAmt: number } | null>(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 30000); return () => clearInterval(id); }, []);
  const relTime = useMemo(() => { void tick; if (!lastUpdatedTime) return 'never'; const s = Math.max(1, Math.floor((Date.now() - lastUpdatedTime) / 1000)); if (s < 60) return `${s}s ago`; const m = Math.floor(s / 60); return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`; }, [lastUpdatedTime, tick]);

  const calculate = useCallback(() => {
    setError('');
    const sales = Number(salesRaw); const commVal = Number(commValueRaw) || 0; const bonus = Number(bonusRaw) || 0; const taxRate = Number(taxRateRaw) || 0;
    if (!salesRaw || isNaN(sales) || sales <= 0) { setError('Enter a valid sales amount.'); setResult(null); return; }
    const salesINR = convertToINR(sales, selectedInputCurrency);
    const bonusINR = convertToINR(bonus, selectedInputCurrency);
    let commission = 0;
    if (commType === 'percentage') commission = salesINR * (commVal / 100);
    else commission = convertToINR(commVal, selectedInputCurrency);
    const totalComm = commission + bonusINR;
    const tax = totalComm * (taxRate / 100);
    const finalEarnings = totalComm - tax;
    setResult({ commission, bonus: bonusINR, totalComm, tax, finalEarnings, salesAmt: salesINR });
  }, [salesRaw, commType, commValueRaw, bonusRaw, taxRateRaw, selectedInputCurrency, convertToINR]);

  useEffect(() => { calculate(); }, [calculate, lastUpdatedTime]);

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);
  const disp = (n: number) => fmtAmt(convertFromINR(n, selectedResultCurrency), currSym);
  const dispS = (n: number) => fmtShort(convertFromINR(n, selectedResultCurrency), currSym);

  const commissionPct = result && result.salesAmt > 0 ? (result.commission / result.salesAmt) * 100 : 0;
  const insight = useMemo(() => {
    if (!result) return null;
    if (commissionPct >= 10) return { text: 'You earned a strong commission! High performance pays off. 🚀', type: 'success' };
    if (result.tax / result.totalComm > 0.3) return { text: 'High tax rate reduces your net earnings. Review tax-saving options.', type: 'warning' };
    return { text: 'Steady commission earnings. Increase sales volume for higher payouts.', type: 'info' };
  }, [result, commissionPct]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-lime-100 dark:to-lime-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-lime-500/20 border border-lime-500/30 text-lime-300 text-sm font-medium mb-4"><DollarSign className="w-4 h-4" /> Sales Commission</motion.div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-extrabold text-slate-900 dark:text-slate-900 dark:text-white tracking-tight mb-2">Commission <span className="text-lime-400">Calculator</span></motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-lg">Calculate your commission, bonuses, and final take-home earnings.</motion.p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">Inputs</h2></div>
            <button onClick={() => { setSalesRaw('500000'); setCommType('percentage'); setCommValueRaw('5'); setBonusRaw(''); setTaxRateRaw('10'); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-slate-900 dark:text-white bg-white dark:bg-white dark:bg-white/5 hover:bg-white/10 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-lg transition-all"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-2">Input Currency</label>
            <select value={selectedInputCurrency} onChange={e => { if (availableCurrencies.includes(e.target.value as never)) setSelectedInputCurrency(e.target.value as never); }} disabled={rL} className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 transition-all">
              {availableCurrencies.map(c => <option key={c} value={c} className="bg-white dark:bg-slate-800">{c} ({getCurrencySymbol(c)})</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1.5">Sales Amount</label>
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">{inputSym}</span>
              <input type="number" value={salesRaw} onChange={e => setSalesRaw(e.target.value)} min={0} className="w-full pl-8 pr-4 py-3 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-lime-500 transition-all" /></div>
            <input type="range" min={1000} max={10000000} step={1000} value={Number(salesRaw) || 0} onChange={e => setSalesRaw(e.target.value)} className="w-full mt-2 accent-lime-500" />
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-2">Commission Type</label>
            <div className="grid grid-cols-2 gap-2">{[{ id: 'percentage', label: 'Percentage (%)' }, { id: 'flat', label: 'Flat Amount' }].map(t => <button key={t.id} onClick={() => setCommType(t.id as 'percentage' | 'flat')} className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${commType === t.id ? 'bg-lime-600 border-lime-500 text-white' : 'bg-white dark:bg-white dark:bg-white/5 border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-600 dark:text-slate-400 hover:border-lime-500/50'}`}>{t.label}</button>)}</div>
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1.5">Commission Value {commType === 'flat' ? `(${inputSym})` : '(%)'}</label>
            <div className="relative"><input type="number" value={commValueRaw} onChange={e => setCommValueRaw(e.target.value)} min={0} max={commType === 'percentage' ? 100 : undefined} step="0.1" className="w-full pl-4 pr-10 py-3 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-lime-500 transition-all" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">{commType === 'percentage' ? '%' : inputSym}</span></div>
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1.5">Bonus Amount ({inputSym}) <span className="text-slate-500 font-normal">optional</span></label>
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">{inputSym}</span>
              <input type="number" value={bonusRaw} onChange={e => setBonusRaw(e.target.value)} min={0} placeholder="0" className="w-full pl-8 pr-4 py-3 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-lime-500 transition-all" /></div>
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1.5">Tax Rate on Commission (%) <span className="text-slate-500 font-normal">optional</span></label>
            <div className="relative"><input type="number" value={taxRateRaw} onChange={e => setTaxRateRaw(e.target.value)} min={0} max={50} step="0.1" className="w-full pl-4 pr-10 py-3 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-lime-500 transition-all" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">%</span></div>
          </div>
          {error && <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm"><Info className="w-4 h-4 shrink-0" /> {error}</div>}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex flex-col gap-5">
          <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5"><div><h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">Results</h2><p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">Updated: <span className="text-lime-300">{relTime}</span></p></div>
              <button onClick={() => updateCurrencyRates()} disabled={rL} className="flex items-center gap-2 px-4 py-2 bg-lime-600 hover:bg-lime-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"><RefreshCw className={`w-4 h-4 ${rL ? 'animate-spin' : ''}`} /> Update</button>
            </div>
            <div className="mb-5"><p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Display Currency</p><div className="flex flex-wrap gap-2">{availableCurrencies.map(c => <button key={c} onClick={() => setSelectedResultCurrency(c as never)} className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${selectedResultCurrency === c ? 'bg-lime-600 border-lime-500 text-white' : 'bg-white dark:bg-white dark:bg-white/5 border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-600 dark:text-slate-400 hover:border-lime-400'}`}>{c}</button>)}</div></div>
            {result ? (
              <div className="flex flex-col gap-3">
                <div className="bg-gradient-to-r from-lime-500/20 to-green-500/20 border border-lime-500/30 rounded-xl p-4"><p className="text-xs font-semibold text-lime-300 uppercase tracking-wider mb-1">Final Earnings</p><p className="text-3xl font-extrabold text-slate-900 dark:text-slate-900 dark:text-white">{dispS(result.finalEarnings)}</p><p className="text-xs text-slate-600 dark:text-slate-600 dark:text-slate-400 mt-1">{disp(result.finalEarnings)}</p></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Commission</p><p className="text-xl font-bold text-lime-400">{dispS(result.commission)}</p><p className="text-xs text-slate-500">{commissionPct.toFixed(1)}% of sales</p></div>
                  <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Bonus</p><p className="text-xl font-bold text-emerald-300">{dispS(result.bonus)}</p></div>
                  <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Total Commission</p><p className="text-xl font-bold text-slate-900 dark:text-slate-900 dark:text-white">{dispS(result.totalComm)}</p></div>
                  <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Tax Deducted</p><p className="text-xl font-bold text-red-300">-{dispS(result.tax)}</p></div>
                </div>
                <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">Breakdown</p>
                  {[{ label: 'Final Earnings', pct: result.totalComm > 0 ? (result.finalEarnings / result.totalComm) * 100 : 100, color: 'bg-lime-500', text: 'text-lime-300' }, { label: 'Tax', pct: result.totalComm > 0 ? (result.tax / result.totalComm) * 100 : 0, color: 'bg-red-500', text: 'text-red-300' }].map((bar, i) => (
                    <div key={bar.label} className="mb-2"><div className="flex justify-between text-xs mb-1"><span className={`font-semibold ${bar.text}`}>{bar.label}</span><span className="text-slate-700 dark:text-slate-700 dark:text-slate-300">{bar.pct.toFixed(1)}%</span></div><div className="h-3 bg-white dark:bg-white dark:bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${bar.pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className={`h-full ${bar.color} rounded-full`} /></div></div>
                  ))}
                </div>
                <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {[{ label: 'Sales Amount', val: disp(result.salesAmt) }, { label: 'Commission', val: disp(result.commission) }, { label: 'Bonus', val: disp(result.bonus) }, { label: 'Total Commission', val: disp(result.totalComm) }, { label: 'Tax Deduction', val: `-${disp(result.tax)}` }, { label: 'Final Earnings', val: disp(result.finalEarnings), highlight: true }].map((row, i) => (
                        <tr key={row.label} className={`border-t border-gray-100 dark:border-gray-100 dark:border-white/5 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'} ${row.highlight ? 'bg-lime-500/5' : ''}`}>
                          <td className="px-4 py-2.5 text-slate-700 dark:text-slate-700 dark:text-slate-300 text-xs">{row.label}</td><td className={`px-4 py-2.5 text-right text-xs ${row.highlight ? 'text-lime-400 font-extrabold text-base' : 'text-slate-900 dark:text-slate-900 dark:text-white font-semibold'}`}>{row.val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : <div className="flex flex-col items-center justify-center py-14 text-slate-500 gap-3"><DollarSign className="w-12 h-12 opacity-20" /><p className="text-sm">Enter values to calculate commission</p></div>}
          </div>
          {insight && result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-3 px-5 py-4 rounded-2xl border-l-4 ${insight.type === 'success' ? 'bg-lime-50/5 border-lime-400 text-lime-200' : insight.type === 'warning' ? 'bg-red-50/5 border-red-400 text-red-200' : 'bg-blue-50/5 border-blue-400 text-blue-200'}`}>
              <Sparkles className="w-5 h-5 mt-0.5 shrink-0" /><div><p className="font-semibold text-sm">Smart Insight</p><p className="text-sm mt-0.5 opacity-90">{insight.text}</p></div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
