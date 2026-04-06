'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, RotateCcw, Sparkles, Info, ArrowLeftRight, Send } from 'lucide-react';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'SGD', 'AED', 'CNY'];
const SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥', AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'د.إ', CNY: '¥' };
const NAMES: Record<string, string> = { USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', INR: 'Indian Rupee', JPY: 'Japanese Yen', AUD: 'Australian Dollar', CAD: 'Canadian Dollar', SGD: 'Singapore Dollar', AED: 'UAE Dirham', CNY: 'Chinese Yuan' };

function fmtAmt(n: number, s: string) { if (!isFinite(n) || n < 0) return `${s}0.00`; return `${s}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

export default function RemittanceFeeCalculator() {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [amountRaw, setAmountRaw] = useState('1000');
  const [fromCcy, setFromCcy] = useState('USD');
  const [toCcy, setToCcy] = useState('INR');
  const [feeType, setFeeType] = useState<'flat' | 'percentage'>('percentage');
  const [feeValueRaw, setFeeValueRaw] = useState('2');
  const [additionalRaw, setAdditionalRaw] = useState('');
  const [manualRateRaw, setManualRateRaw] = useState('');
  const [result, setResult] = useState<{ fee: number; additionalCharges: number; totalDeductions: number; netAmount: number; receivedAmount: number; rate: number } | null>(null);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 30000); return () => clearInterval(id); }, []);
  const relTime = useMemo(() => { void tick; if (!lastUpdated) return 'never'; const s = Math.max(1, Math.floor((Date.now() - lastUpdated.getTime()) / 1000)); if (s < 60) return `${s}s ago`; const m = Math.floor(s / 60); return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`; }, [lastUpdated, tick]);

  const fetchRates = useCallback(async () => {
    setLoading(true); setApiError('');
    try { const res = await fetch('https://open.er-api.com/v6/latest/USD'); const data = await res.json(); if (data.result !== 'success') throw new Error('API error'); setRates(data.rates); setLastUpdated(new Date()); }
    catch { setApiError('Using cached rates.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchRates(); }, [fetchRates]);

  const liveRate = useMemo(() => { if (!rates[fromCcy] || !rates[toCcy]) return 0; return rates[toCcy] / rates[fromCcy]; }, [rates, fromCcy, toCcy]);
  const effectiveRate = manualRateRaw ? Number(manualRateRaw) : liveRate;

  const calculate = useCallback(() => {
    setError('');
    const amount = Number(amountRaw); const feeVal = Number(feeValueRaw) || 0; const additional = Number(additionalRaw) || 0;
    if (!amountRaw || isNaN(amount) || amount <= 0) { setError('Enter a valid amount to send.'); setResult(null); return; }
    if (effectiveRate <= 0) { setError('Exchange rate not available yet.'); setResult(null); return; }
    const fee = feeType === 'flat' ? feeVal : amount * (feeVal / 100);
    const totalDeductions = fee + additional;
    const netAmount = Math.max(0, amount - totalDeductions);
    const receivedAmount = netAmount * effectiveRate;
    setResult({ fee, additionalCharges: additional, totalDeductions, netAmount, receivedAmount, rate: effectiveRate });
  }, [amountRaw, feeValueRaw, feeType, additionalRaw, effectiveRate]);

  useEffect(() => { calculate(); }, [calculate, liveRate]);

  const fromSym = SYMBOLS[fromCcy] ?? '';
  const toSym = SYMBOLS[toCcy] ?? '';

  const insight = useMemo(() => {
    if (!result || !Number(amountRaw)) return null;
    const feeRatio = result.fee / Number(amountRaw);
    if (feeRatio > 0.05) return { text: 'High transfer fees are reducing your received amount significantly. Compare providers.', type: 'warning' };
    if (result.rate < liveRate * 0.97) return { text: 'Exchange rate is significantly below market rate. Consider a better FX provider.', type: 'warning' };
    return { text: 'Competitive transfer fees and rate. Good deal for this remittance!', type: 'success' };
  }, [result, liveRate, amountRaw]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-green-100 dark:to-green-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-sm font-medium mb-4"><Send className="w-4 h-4" /> International Transfer</motion.div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-extrabold text-slate-900 dark:text-slate-900 dark:text-white tracking-tight mb-2">Remittance Fee <span className="text-green-400">Calculator</span></motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-lg">Calculate transfer fees and know exactly how much your recipient receives.</motion.p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* INPUTS */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">Inputs</h2></div>
            <button onClick={() => { setAmountRaw('1000'); setFeeType('percentage'); setFeeValueRaw('2'); setAdditionalRaw(''); setManualRateRaw(''); setResult(null); setError(''); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-slate-900 dark:text-white bg-white dark:bg-white dark:bg-white/5 hover:bg-white/10 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-lg transition-all"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-2">Currency Pair</label>
            <div className="flex items-center gap-2">
              <select value={fromCcy} onChange={e => setFromCcy(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500">{CURRENCIES.map(c => <option key={c} value={c} className="bg-white dark:bg-slate-800">{c}</option>)}</select>
              <button onClick={() => { setFromCcy(toCcy); setToCcy(fromCcy); }} className="p-2.5 rounded-xl bg-green-600/20 border border-green-500/30 text-green-300 hover:bg-green-600/40 transition-all"><ArrowLeftRight className="w-4 h-4" /></button>
              <select value={toCcy} onChange={e => setToCcy(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500">{CURRENCIES.map(c => <option key={c} value={c} className="bg-white dark:bg-slate-800">{c}</option>)}</select>
            </div>
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1.5">Amount to Send ({NAMES[fromCcy]})</label>
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">{fromSym}</span>
              <input type="number" value={amountRaw} onChange={e => setAmountRaw(e.target.value)} min={0} className="w-full pl-8 pr-4 py-3 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" /></div>
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-2">Transfer Fee Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ id: 'flat', label: 'Flat Fee' }, { id: 'percentage', label: 'Percentage (%)' }].map(t => <button key={t.id} onClick={() => setFeeType(t.id as 'flat' | 'percentage')} className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${feeType === t.id ? 'bg-green-600 border-green-500 text-white' : 'bg-white dark:bg-white dark:bg-white/5 border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-600 dark:text-slate-400 hover:border-green-500/50'}`}>{t.label}</button>)}
            </div>
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1.5">Fee Value {feeType === 'flat' ? `(${fromSym})` : '(%)'}</label>
            <div className="relative"><input type="number" value={feeValueRaw} onChange={e => setFeeValueRaw(e.target.value)} min={0} step={feeType === 'percentage' ? '0.1' : '1'} className="w-full pl-4 pr-10 py-3 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">{feeType === 'percentage' ? '%' : fromSym}</span></div>
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1.5">Additional Charges ({fromSym}) <span className="text-slate-500 font-normal">optional</span></label>
            <input type="number" value={additionalRaw} onChange={e => setAdditionalRaw(e.target.value)} min={0} placeholder="0" className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1.5">Exchange Rate Override <span className="text-slate-500 font-normal">optional — leave blank for live rate</span></label>
            <input type="number" value={manualRateRaw} onChange={e => setManualRateRaw(e.target.value)} min={0} step="0.0001" placeholder={liveRate > 0 ? liveRate.toFixed(4) : 'Loading...'} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
          </div>
          {(error || apiError) && <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm"><Info className="w-4 h-4 shrink-0" /> {error || apiError}</div>}
        </motion.div>

        {/* RESULTS */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex flex-col gap-5">
          <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5"><div><h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">Results</h2><p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">Rates: <span className="text-green-300">{relTime}</span></p></div>
              <button onClick={fetchRates} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Update</button>
            </div>
            {result ? (
              <div className="flex flex-col gap-3">
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4"><p className="text-xs font-semibold text-green-300 uppercase tracking-wider mb-1">Recipient Gets</p><p className="text-3xl font-extrabold text-slate-900 dark:text-slate-900 dark:text-white">{toSym}{result.receivedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p><p className="text-xs text-slate-600 dark:text-slate-600 dark:text-slate-400 mt-1">1 {fromCcy} = {result.rate.toFixed(4)} {toCcy}</p></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Transfer Fee</p><p className="text-xl font-bold text-red-300">{fmtAmt(result.fee, fromSym)}</p></div>
                  <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Total Charges</p><p className="text-xl font-bold text-amber-300">{fmtAmt(result.totalDeductions, fromSym)}</p></div>
                  <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Net Amount Sent</p><p className="text-xl font-bold text-slate-900 dark:text-slate-900 dark:text-white">{fmtAmt(result.netAmount, fromSym)}</p></div>
                  <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Additional</p><p className="text-xl font-bold text-slate-700 dark:text-slate-700 dark:text-slate-300">{fmtAmt(result.additionalCharges, fromSym)}</p></div>
                </div>
                <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">Breakdown</p>
                  {[{ label: 'Net Transfer', val: result.netAmount, total: Number(amountRaw) || 1, color: 'bg-green-500', text: 'text-green-300' }, { label: 'Fees & Charges', val: result.totalDeductions, total: Number(amountRaw) || 1, color: 'bg-red-500', text: 'text-red-300' }].map((bar, i) => {
                    const pct = bar.total > 0 ? (bar.val / bar.total) * 100 : 0;
                    return <div key={bar.label} className="mb-2"><div className="flex justify-between text-xs mb-1"><span className={`font-semibold ${bar.text}`}>{bar.label}</span><span className="text-slate-700 dark:text-slate-700 dark:text-slate-300">{pct.toFixed(1)}%</span></div><div className="h-3 bg-white dark:bg-white dark:bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className={`h-full ${bar.color} rounded-full`} /></div></div>;
                  })}
                </div>
              </div>
            ) : <div className="flex flex-col items-center justify-center py-14 text-slate-500 gap-3"><Send className="w-12 h-12 opacity-20" /><p className="text-sm">Enter values to calculate remittance cost</p></div>}
          </div>
          {insight && result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-3 px-5 py-4 rounded-2xl border-l-4 ${insight.type === 'success' ? 'bg-green-50/5 border-green-400 text-green-200' : 'bg-amber-50/5 border-amber-400 text-amber-200'}`}>
              <Sparkles className="w-5 h-5 mt-0.5 shrink-0" /><div><p className="font-semibold text-sm">Smart Insight</p><p className="text-sm mt-0.5 opacity-90">{insight.text}</p></div>
            </motion.div>
          )}
          {result && (
            <div className="bg-white dark:bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-200 dark:border-white/10"><p className="text-sm font-bold text-slate-900 dark:text-slate-900 dark:text-white">Transfer Breakdown</p></div>
              <table className="w-full text-sm">
                <tbody>
                  {[{ label: 'Sent Amount', val: fmtAmt(Number(amountRaw) || 0, fromSym) }, { label: 'Transfer Fee', val: fmtAmt(result.fee, fromSym) }, { label: 'Additional Charges', val: fmtAmt(result.additionalCharges, fromSym) }, { label: 'Net Sent', val: fmtAmt(result.netAmount, fromSym) }, { label: 'Received Amount', val: `${toSym}${result.receivedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }].map((row, i) => (
                    <tr key={row.label} className={`border-t border-gray-100 dark:border-gray-100 dark:border-white/5 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'} ${i === 4 ? 'bg-green-500/5 font-bold' : ''}`}>
                      <td className="px-4 py-2.5 text-slate-700 dark:text-slate-700 dark:text-slate-300">{row.label}</td><td className={`px-4 py-2.5 text-right ${i === 4 ? 'text-green-400 font-extrabold text-base' : 'text-slate-900 dark:text-slate-900 dark:text-white font-semibold'}`}>{row.val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
