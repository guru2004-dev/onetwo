'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, RotateCcw, Sparkles, Info, Package } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

function fmtAmt(n: number, s: string) { if (!isFinite(n) || n < 0) return `${s}0.00`; return `${s}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtShort(n: number, s: string) { if (!isFinite(n)) return `${s}0`; const a = Math.abs(n); if (a >= 1e7) return `${s}${(a / 1e7).toFixed(2)} Cr`; if (a >= 1e5) return `${s}${(a / 1e5).toFixed(2)} L`; if (a >= 1e3) return `${s}${(a / 1e3).toFixed(1)} K`; return `${s}${a.toFixed(2)}`; }

export default function ImportExportDutyCalculator() {
  const { selectedInputCurrency, setSelectedInputCurrency, selectedResultCurrency, setSelectedResultCurrency, availableCurrencies, loading: rL, updateCurrencyRates, lastUpdatedTime, getCurrencySymbol, convertToINR, convertFromINR } = useCurrency();
  const [productValueRaw, setProductValueRaw] = useState('500000');
  const [shippingRaw, setShippingRaw] = useState('20000');
  const [insuranceRaw, setInsuranceRaw] = useState('5000');
  const [dutyRateRaw, setDutyRateRaw] = useState('10');
  const [handlingRaw, setHandlingRaw] = useState('0');
  const [portRaw, setPortRaw] = useState('0');
  const [docRaw, setDocRaw] = useState('0');
  const [taxType, setTaxType] = useState<'GST' | 'VAT' | 'Other'>('GST');
  const [taxRateRaw, setTaxRateRaw] = useState('18');
  const [result, setResult] = useState<{ cif: number; duty: number; additional: number; tax: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 30000); return () => clearInterval(id); }, []);
  const relTime = useMemo(() => { void tick; if (!lastUpdatedTime) return 'never'; const s = Math.max(1, Math.floor((Date.now() - lastUpdatedTime) / 1000)); if (s < 60) return `${s}s ago`; const m = Math.floor(s / 60); return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`; }, [lastUpdatedTime, tick]);

  const calculate = useCallback(() => {
    setError('');
    const pv = Number(productValueRaw); const sh = Number(shippingRaw) || 0; const ins = Number(insuranceRaw) || 0; const dr = Number(dutyRateRaw); const tr = Number(taxRateRaw);
    if (!productValueRaw || isNaN(pv) || pv <= 0) { setError('Enter a valid product value.'); setResult(null); return; }
    if (isNaN(dr) || dr < 0) { setError('Enter a valid duty rate.'); setResult(null); return; }
    const pvINR = convertToINR(pv, selectedInputCurrency);
    const shINR = convertToINR(sh, selectedInputCurrency);
    const insINR = convertToINR(ins, selectedInputCurrency);
    const cif = pvINR + shINR + insINR;
    const duty = cif * (dr / 100);
    const additional = convertToINR((Number(handlingRaw) || 0) + (Number(portRaw) || 0) + (Number(docRaw) || 0), selectedInputCurrency);
    const subtotal = cif + duty + additional;
    const tax = subtotal * ((Number(taxRateRaw) || 0) / 100);
    const total = subtotal + tax;
    setResult({ cif, duty, additional, tax, total });
  }, [productValueRaw, shippingRaw, insuranceRaw, dutyRateRaw, handlingRaw, portRaw, docRaw, taxRateRaw, selectedInputCurrency, convertToINR]);

  useEffect(() => { calculate(); }, [calculate, lastUpdatedTime]);
  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);
  const disp = (n: number) => fmtAmt(convertFromINR(n, selectedResultCurrency), currSym);
  const dispS = (n: number) => fmtShort(convertFromINR(n, selectedResultCurrency), currSym);

  const insight = useMemo(() => {
    if (!result) return null;
    if (result.duty / result.total > 0.3) return { text: 'High import duty significantly increases your landed cost. Explore duty exemptions.', type: 'warning' };
    if (result.tax / result.total > 0.2) return { text: `${taxType} contributes a large portion of total cost. Check applicable exemptions.`, type: 'warning' };
    return { text: 'Your landed cost breakdown looks manageable. Review for optimization.', type: 'success' };
  }, [result, taxType]);

  const components = result ? [
    { label: 'Product Value', val: convertFromINR(convertToINR(Number(productValueRaw) || 0, selectedInputCurrency), selectedResultCurrency) },
    { label: 'Shipping', val: convertFromINR(convertToINR(Number(shippingRaw) || 0, selectedInputCurrency), selectedResultCurrency) },
    { label: 'Insurance', val: convertFromINR(convertToINR(Number(insuranceRaw) || 0, selectedInputCurrency), selectedResultCurrency) },
    { label: 'Import Duty', val: convertFromINR(result.duty, selectedResultCurrency) },
    { label: `${taxType} Tax`, val: convertFromINR(result.tax, selectedResultCurrency) },
    { label: 'Additional Charges', val: convertFromINR(result.additional, selectedResultCurrency) },
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-violet-100 dark:to-violet-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm font-medium mb-4"><Package className="w-4 h-4" /> Trade & Customs</motion.div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">Import / Export <span className="text-violet-400">Duty Calculator</span></motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-600 dark:text-slate-400 text-lg">Calculate total landed cost including customs duty, taxes and charges.</motion.p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* INPUTS */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-900 dark:text-white">Inputs</h2><p className="text-slate-600 dark:text-slate-400 text-sm">Enter shipment details</p></div>
            <button onClick={() => { setProductValueRaw('500000'); setShippingRaw('20000'); setInsuranceRaw('5000'); setDutyRateRaw('10'); setHandlingRaw('0'); setPortRaw('0'); setDocRaw('0'); setTaxRateRaw('18'); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white bg-white dark:bg-white/5 hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg transition-all"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Input Currency</label>
            <select value={selectedInputCurrency} onChange={e => { if (availableCurrencies.includes(e.target.value as never)) setSelectedInputCurrency(e.target.value as never); }} disabled={rL} className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all">
              {availableCurrencies.map(c => <option key={c} value={c} className="bg-white dark:bg-slate-800">{c} ({getCurrencySymbol(c)})</option>)}
            </select>
          </div>
          {[{ label: 'Product Value (Invoice)', val: productValueRaw, set: setProductValueRaw }, { label: 'Shipping Cost', val: shippingRaw, set: setShippingRaw }, { label: 'Insurance Cost', val: insuranceRaw, set: setInsuranceRaw }].map(f => (
            <div key={f.label}><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{f.label}</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 text-sm">{inputSym}</span>
                <input type="number" value={f.val} onChange={e => f.set(e.target.value)} min={0} className="w-full pl-8 pr-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" /></div>
            </div>
          ))}
          <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Customs Duty Rate (%)</label>
            <div className="relative"><input type="number" value={dutyRateRaw} onChange={e => setDutyRateRaw(e.target.value)} min={0} max={200} step="0.1" className="w-full pl-4 pr-10 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 text-sm">%</span></div>
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Additional Charges</label>
            <div className="grid grid-cols-3 gap-2">
              {[{ label: 'Handling', val: handlingRaw, set: setHandlingRaw }, { label: 'Port', val: portRaw, set: setPortRaw }, { label: 'Docs', val: docRaw, set: setDocRaw }].map(f => (
                <div key={f.label}><label className="block text-xs text-slate-500 mb-1">{f.label}</label>
                  <div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 text-xs">{inputSym}</span>
                    <input type="number" value={f.val} onChange={e => f.set(e.target.value)} min={0} className="w-full pl-6 pr-2 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" /></div>
                </div>
              ))}
            </div>
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tax Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['GST', 'VAT', 'Other'] as const).map(t => <button key={t} onClick={() => setTaxType(t)} className={`py-2 rounded-xl border text-xs font-semibold transition-all ${taxType === t ? 'bg-violet-600 border-violet-500 text-white' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-violet-500/50'}`}>{t}</button>)}
            </div>
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{taxType} Rate (%)</label>
            <div className="relative"><input type="number" value={taxRateRaw} onChange={e => setTaxRateRaw(e.target.value)} min={0} max={100} step="0.1" className="w-full pl-4 pr-10 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 text-sm">%</span></div>
          </div>
          {error && <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm"><Info className="w-4 h-4 shrink-0" /> {error}</div>}
        </motion.div>

        {/* RESULTS */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex flex-col gap-5">
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5"><div><h2 className="text-lg font-bold text-slate-900 dark:text-white">Results</h2><p className="text-slate-600 dark:text-slate-400 text-sm">Updated: <span className="text-violet-300">{relTime}</span></p></div>
              <button onClick={() => updateCurrencyRates()} disabled={rL} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"><RefreshCw className={`w-4 h-4 ${rL ? 'animate-spin' : ''}`} /> Update</button>
            </div>
            <div className="mb-5"><p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Display Currency</p><div className="flex flex-wrap gap-2">{availableCurrencies.map(c => <button key={c} onClick={() => setSelectedResultCurrency(c as never)} className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${selectedResultCurrency === c ? 'bg-violet-600 border-violet-500 text-white' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-violet-400'}`}>{c}</button>)}</div></div>
            {result ? (
              <div className="flex flex-col gap-3">
                <div className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 rounded-xl p-4"><p className="text-xs font-semibold text-violet-300 uppercase tracking-wider mb-1">Total Landed Cost</p><p className="text-3xl font-extrabold text-slate-900 dark:text-white">{dispS(result.total)}</p><p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{disp(result.total)}</p></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">CIF Value</p><p className="text-lg font-bold text-blue-300">{dispS(result.cif)}</p></div>
                  <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Import Duty</p><p className="text-lg font-bold text-amber-300">{dispS(result.duty)}</p></div>
                  <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">{taxType} Amount</p><p className="text-lg font-bold text-red-300">{dispS(result.tax)}</p></div>
                  <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Add. Charges</p><p className="text-lg font-bold text-slate-700 dark:text-slate-300">{dispS(result.additional)}</p></div>
                </div>
                <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">Cost Breakdown</p>
                  {components.filter(c => c.val > 0).map((c, i) => { const pct = result.total > 0 ? (convertToINR(c.val, selectedResultCurrency as never) / result.total) * 100 : 0; const colors = ['bg-blue-500', 'bg-sky-500', 'bg-cyan-500', 'bg-amber-500', 'bg-red-500', 'bg-slate-500']; return <div key={c.label} className="mb-2"><div className="flex justify-between text-xs mb-1"><span className="text-slate-600 dark:text-slate-400">{c.label}</span><span className="text-slate-700 dark:text-slate-300">{pct.toFixed(1)}%</span></div><div className="h-2.5 bg-white dark:bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, delay: i * 0.05 }} className={`h-full ${colors[i % colors.length]} rounded-full`} /></div></div>; })}
                </div>
              </div>
            ) : <div className="flex flex-col items-center justify-center py-14 text-slate-500 gap-3"><Package className="w-12 h-12 opacity-20" /><p className="text-sm">Enter values to calculate landed cost</p></div>}
          </div>
          {insight && result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-3 px-5 py-4 rounded-2xl border-l-4 ${insight.type === 'success' ? 'bg-violet-50/5 border-violet-400 text-violet-200' : 'bg-amber-50/5 border-amber-400 text-amber-200'}`}>
              <Sparkles className="w-5 h-5 mt-0.5 shrink-0" /><div><p className="font-semibold text-sm">Smart Insight</p><p className="text-sm mt-0.5 opacity-90">{insight.text}</p></div>
            </motion.div>
          )}

          {result && (
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200 dark:border-white/10"><p className="text-sm font-bold text-slate-900 dark:text-white">Cost Breakdown Table</p></div>
              <table className="w-full text-sm">
                <tbody>
                  {components.map((c, i) => <tr key={c.label} className={`border-t border-gray-100 dark:border-gray-100 dark:border-white/5 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}><td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{c.label}</td><td className="px-4 py-2.5 text-right text-slate-900 dark:text-white font-semibold">{fmtAmt(c.val, currSym)}</td></tr>)}
                  <tr className="border-t-2 border-white/20 bg-violet-500/5"><td className="px-4 py-3 font-bold text-slate-900 dark:text-white">Total Landed Cost</td><td className="px-4 py-3 text-right font-extrabold text-violet-400">{disp(result.total)}</td></tr>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
