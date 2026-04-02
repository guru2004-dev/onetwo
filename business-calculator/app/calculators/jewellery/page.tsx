'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, RotateCcw, Sparkles, Info } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

function fmtAmt(n: number, s: string) { if (!isFinite(n) || n < 0) return `${s}0.00`; return `${s}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtShort(n: number, s: string) { if (!isFinite(n)) return `${s}0`; const a = Math.abs(n); if (a >= 1e7) return `${s}${(a / 1e7).toFixed(2)} Cr`; if (a >= 1e5) return `${s}${(a / 1e5).toFixed(2)} L`; if (a >= 1e3) return `${s}${(a / 1e3).toFixed(1)} K`; return `${s}${a.toFixed(2)}`; }

export default function JewelleryCalculator() {
  const { selectedInputCurrency, setSelectedInputCurrency, selectedResultCurrency, setSelectedResultCurrency, availableCurrencies, loading: rL, updateCurrencyRates, lastUpdatedTime, getCurrencySymbol, convertToINR, convertFromINR } = useCurrency();
  const [metalType, setMetalType] = useState<'gold' | 'silver' | 'platinum'>('gold');
  const [weightRaw, setWeightRaw] = useState('10');
  const [rateRaw, setRateRaw] = useState('6500');
  const [makingType, setMakingType] = useState<'pergram' | 'percentage'>('percentage');
  const [makingValueRaw, setMakingValueRaw] = useState('15');
  const [stoneRaw, setStoneRaw] = useState('');
  const [wastageRaw, setWastageRaw] = useState('2');
  const [gstRaw, setGstRaw] = useState('3');
  const [result, setResult] = useState<{ metalCost: number; wastage: number; making: number; stone: number; subtotal: number; gst: number; finalPrice: number } | null>(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 30000); return () => clearInterval(id); }, []);
  const relTime = useMemo(() => { void tick; if (!lastUpdatedTime) return 'never'; const s = Math.max(1, Math.floor((Date.now() - lastUpdatedTime) / 1000)); if (s < 60) return `${s}s ago`; const m = Math.floor(s / 60); return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`; }, [lastUpdatedTime, tick]);

  const calculate = useCallback(() => {
    setError('');
    const weight = Number(weightRaw); const rate = Number(rateRaw); const makingVal = Number(makingValueRaw) || 0;
    const stone = Number(stoneRaw) || 0; const wastage = Number(wastageRaw) || 0; const gst = Number(gstRaw) || 3;
    if (!weightRaw || isNaN(weight) || weight <= 0) { setError('Enter a valid weight.'); setResult(null); return; }
    if (!rateRaw || isNaN(rate) || rate <= 0) { setError('Enter a valid rate per gram.'); setResult(null); return; }
    const metalCostINR = convertToINR(weight * rate, selectedInputCurrency);
    const wastageCostINR = metalCostINR * (wastage / 100);
    let makingINR = 0;
    if (makingType === 'pergram') makingINR = convertToINR(weight * makingVal, selectedInputCurrency);
    else makingINR = metalCostINR * (makingVal / 100);
    const stoneINR = convertToINR(stone, selectedInputCurrency);
    const subtotal = metalCostINR + wastageCostINR + makingINR + stoneINR;
    const gstAmt = subtotal * (gst / 100);
    const finalPrice = subtotal + gstAmt;
    setResult({ metalCost: metalCostINR, wastage: wastageCostINR, making: makingINR, stone: stoneINR, subtotal, gst: gstAmt, finalPrice });
  }, [weightRaw, rateRaw, makingType, makingValueRaw, stoneRaw, wastageRaw, gstRaw, selectedInputCurrency, convertToINR]);

  useEffect(() => { calculate(); }, [calculate, lastUpdatedTime]);

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);
  const disp = (n: number) => fmtAmt(convertFromINR(n, selectedResultCurrency), currSym);
  const dispS = (n: number) => fmtShort(convertFromINR(n, selectedResultCurrency), currSym);

  const METAL_DEFAULTS: Record<string, { rate: string; gst: string }> = { gold: { rate: '6500', gst: '3' }, silver: { rate: '80', gst: '3' }, platinum: { rate: '3000', gst: '18' } };

  const insight = useMemo(() => {
    if (!result) return null;
    const makingPct = result.finalPrice > 0 ? (result.making / result.finalPrice) * 100 : 0;
    if (makingPct > 20) return { text: 'Making charges are significantly high. Negotiate if possible.', type: 'warning' };
    if (result.gst / result.finalPrice > 0.1) return { text: 'GST adds notably to the final price. Keep invoice for input tax credit.', type: 'info' };
    return { text: 'Reasonable cost breakdown. Good deal on this jewellery piece! ✨', type: 'success' };
  }, [result]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-yellow-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-sm font-medium mb-4">✨ Jewellery Billing</motion.div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-extrabold text-white tracking-tight mb-2">Jewellery Price <span className="text-yellow-400">Calculator</span></motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-400 text-lg">Calculate final jewellery bill with metal cost, making charges, and GST.</motion.p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-white">Inputs</h2></div>
            <button onClick={() => { setMetalType('gold'); setWeightRaw('10'); setRateRaw('6500'); setMakingType('percentage'); setMakingValueRaw('15'); setStoneRaw(''); setWastageRaw('2'); setGstRaw('3'); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
          </div>
          <div><label className="block text-sm font-semibold text-slate-300 mb-2">Input Currency</label>
            <select value={selectedInputCurrency} onChange={e => { if (availableCurrencies.includes(e.target.value as never)) setSelectedInputCurrency(e.target.value as never); }} disabled={rL} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all">
              {availableCurrencies.map(c => <option key={c} value={c} className="bg-slate-800">{c} ({getCurrencySymbol(c)})</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-semibold text-slate-300 mb-2">Metal Type</label>
            <div className="grid grid-cols-3 gap-2">{[{ id: 'gold', label: '🥇 Gold' }, { id: 'silver', label: '🥈 Silver' }, { id: 'platinum', label: '💎 Platinum' }].map(m => <button key={m.id} onClick={() => { setMetalType(m.id as 'gold' | 'silver' | 'platinum'); const d = METAL_DEFAULTS[m.id]; setRateRaw(d.rate); setGstRaw(d.gst); }} className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${metalType === m.id ? 'bg-yellow-600 border-yellow-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:border-yellow-500/50'}`}>{m.label}</button>)}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-semibold text-slate-300 mb-1.5">Weight (grams)</label>
              <input type="number" value={weightRaw} onChange={e => setWeightRaw(e.target.value)} min={0} step="0.001" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all" />
            </div>
            <div><label className="block text-sm font-semibold text-slate-300 mb-1.5">Rate per gram ({inputSym})</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{inputSym}</span>
                <input type="number" value={rateRaw} onChange={e => setRateRaw(e.target.value)} min={0} className="w-full pl-6 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all" /></div>
            </div>
          </div>
          <div><label className="block text-sm font-semibold text-slate-300 mb-2">Making Charges Type</label>
            <div className="grid grid-cols-2 gap-2">{[{ id: 'percentage', label: 'Percentage (%)' }, { id: 'pergram', label: 'Per Gram' }].map(t => <button key={t.id} onClick={() => setMakingType(t.id as 'pergram' | 'percentage')} className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${makingType === t.id ? 'bg-yellow-600 border-yellow-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:border-yellow-500/50'}`}>{t.label}</button>)}</div>
          </div>
          <div><label className="block text-sm font-semibold text-slate-300 mb-1.5">Making Charges {makingType === 'percentage' ? '(%)' : `(${inputSym}/g)`}</label>
            <div className="relative"><input type="number" value={makingValueRaw} onChange={e => setMakingValueRaw(e.target.value)} min={0} step="0.1" className="w-full pl-4 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{makingType === 'percentage' ? '%' : '/g'}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-semibold text-slate-300 mb-1.5">Stone Charges ({inputSym})</label>
              <div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{inputSym}</span>
                <input type="number" value={stoneRaw} onChange={e => setStoneRaw(e.target.value)} min={0} placeholder="0" className="w-full pl-6 pr-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500" /></div>
            </div>
            <div><label className="block text-sm font-semibold text-slate-300 mb-1.5">Wastage (%)</label>
              <div className="relative"><input type="number" value={wastageRaw} onChange={e => setWastageRaw(e.target.value)} min={0} max={20} step="0.1" className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span></div>
            </div>
          </div>
          <div><label className="block text-sm font-semibold text-slate-300 mb-1.5">GST Rate (%)</label>
            <div className="relative"><input type="number" value={gstRaw} onChange={e => setGstRaw(e.target.value)} min={0} max={28} step="0.5" className="w-full pl-4 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span></div>
          </div>
          {error && <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm"><Info className="w-4 h-4 shrink-0" /> {error}</div>}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex flex-col gap-5">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5"><div><h2 className="text-lg font-bold text-white">Results</h2><p className="text-slate-400 text-sm">Updated: <span className="text-yellow-300">{relTime}</span></p></div>
              <button onClick={() => updateCurrencyRates()} disabled={rL} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"><RefreshCw className={`w-4 h-4 ${rL ? 'animate-spin' : ''}`} /> Update</button>
            </div>
            <div className="mb-5"><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Display Currency</p><div className="flex flex-wrap gap-2">{availableCurrencies.map(c => <button key={c} onClick={() => setSelectedResultCurrency(c as never)} className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${selectedResultCurrency === c ? 'bg-yellow-600 border-yellow-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:border-yellow-400'}`}>{c}</button>)}</div></div>
            {result ? (
              <div className="flex flex-col gap-3">
                <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-xl p-4"><p className="text-xs font-semibold text-yellow-300 uppercase tracking-wider mb-1">Final Bill Amount</p><p className="text-3xl font-extrabold text-white">{dispS(result.finalPrice)}</p><p className="text-xs text-slate-400 mt-1">{disp(result.finalPrice)}</p></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3"><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Metal Cost</p><p className="text-base font-bold text-yellow-300">{dispS(result.metalCost)}</p></div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3"><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Making Charges</p><p className="text-base font-bold text-amber-300">{dispS(result.making)}</p></div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3"><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Wastage</p><p className="text-base font-bold text-orange-300">{dispS(result.wastage)}</p></div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3"><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">GST ({gstRaw}%)</p><p className="text-base font-bold text-red-300">{dispS(result.gst)}</p></div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Cost Distribution</p>
                  {[{ label: 'Metal', val: result.metalCost, color: 'bg-yellow-500', text: 'text-yellow-300' }, { label: 'Making', val: result.making, color: 'bg-amber-500', text: 'text-amber-300' }, { label: 'Wastage', val: result.wastage, color: 'bg-orange-500', text: 'text-orange-300' }, { label: 'Stone', val: result.stone, color: 'bg-sky-500', text: 'text-sky-300' }, { label: 'GST', val: result.gst, color: 'bg-red-500', text: 'text-red-300' }].filter(b => b.val > 0).map((bar, i) => {
                    const pct = result.finalPrice > 0 ? (bar.val / result.finalPrice) * 100 : 0;
                    return <div key={bar.label} className="mb-2"><div className="flex justify-between text-xs mb-1"><span className={`font-semibold ${bar.text}`}>{bar.label}</span><span className="text-slate-300">{pct.toFixed(1)}%</span></div><div className="h-2.5 bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, delay: i * 0.05 }} className={`h-full ${bar.color} rounded-full`} /></div></div>;
                  })}
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {[{ label: 'Metal Cost', val: disp(result.metalCost) }, { label: 'Wastage', val: disp(result.wastage) }, { label: 'Making Charges', val: disp(result.making) }, { label: 'Stone Charges', val: disp(result.stone) }, { label: 'GST', val: disp(result.gst) }, { label: 'Final Price', val: disp(result.finalPrice), h: true }].map((row, i) => (
                        <tr key={row.label} className={`border-t border-white/5 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'} ${row.h ? 'bg-yellow-500/5' : ''}`}>
                          <td className="px-4 py-2.5 text-slate-300 text-xs">{row.label}</td><td className={`px-4 py-2.5 text-right text-xs ${row.h ? 'text-yellow-400 font-extrabold text-base' : 'text-white font-semibold'}`}>{row.val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : <div className="flex flex-col items-center justify-center py-14 text-slate-500 gap-3"><p className="text-2xl">💍</p><p className="text-sm">Enter details to calculate jewellery price</p></div>}
          </div>
          {insight && result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-3 px-5 py-4 rounded-2xl border-l-4 ${insight.type === 'success' ? 'bg-yellow-50/5 border-yellow-400 text-yellow-200' : insight.type === 'warning' ? 'bg-red-50/5 border-red-400 text-red-200' : 'bg-blue-50/5 border-blue-400 text-blue-200'}`}>
              <Sparkles className="w-5 h-5 mt-0.5 shrink-0" /><div><p className="font-semibold text-sm">Smart Insight</p><p className="text-sm mt-0.5 opacity-90">{insight.text}</p></div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
