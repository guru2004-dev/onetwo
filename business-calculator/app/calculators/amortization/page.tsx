'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, RotateCcw, Sparkles, Info, FileText } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

function fmtAmt(n: number, sym: string) { if (!isFinite(n) || n < 0) return `${sym}0.00`; return `${sym}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtShort(n: number, sym: string) { if (!isFinite(n)) return `${sym}0`; if (n >= 1_00_00_000) return `${sym}${(n / 1_00_00_000).toFixed(2)} Cr`; if (n >= 1_00_000) return `${sym}${(n / 1_00_000).toFixed(2)} L`; if (n >= 1_000) return `${sym}${(n / 1_000).toFixed(1)} K`; return `${sym}${n.toFixed(2)}`; }

interface AmoRow { month: number; emi: number; interest: number; principal: number; balance: number; }

function calcEMI(p: number, r: number, n: number): number {
  if (p <= 0 || n <= 0) return 0;
  if (r === 0) return p / n;
  const pow = Math.pow(1 + r, n);
  return (p * r * pow) / (pow - 1);
}

export default function AmortizationCalculator() {
  const { selectedInputCurrency, setSelectedInputCurrency, selectedResultCurrency, setSelectedResultCurrency, availableCurrencies, loading: ratesLoading, updateCurrencyRates, lastUpdatedTime, getCurrencySymbol, convertToINR, convertFromINR } = useCurrency();
  const [amountRaw, setAmountRaw] = useState('1000000');
  const [rateRaw, setRateRaw] = useState('8.5');
  const [tenureRaw, setTenureRaw] = useState('10');
  const [tenureUnit, setTenureUnit] = useState<'years' | 'months'>('years');
  const [schedule, setSchedule] = useState<AmoRow[]>([]);
  const [summary, setSummary] = useState<{ emi: number; totalInterest: number; totalPayment: number; principal: number } | null>(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 30000); return () => clearInterval(id); }, []);
  const relTime = useMemo(() => { void tick; if (!lastUpdatedTime) return 'never'; const s = Math.max(1, Math.floor((Date.now() - lastUpdatedTime) / 1000)); if (s < 60) return `${s}s ago`; const m = Math.floor(s / 60); return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`; }, [lastUpdatedTime, tick]);

  const calculate = useCallback(() => {
    setError(''); setSchedule([]); setSummary(null);
    const amount = Number(amountRaw); const rate = Number(rateRaw); const tenure = Number(tenureRaw);
    if (!amountRaw || isNaN(amount) || amount <= 0) { setError('Enter a valid loan amount.'); return; }
    if (isNaN(rate) || rate < 0) { setError('Enter a valid interest rate.'); return; }
    if (!tenureRaw || isNaN(tenure) || tenure <= 0) { setError('Enter a valid tenure.'); return; }
    const principal = convertToINR(amount, selectedInputCurrency);
    const months = tenureUnit === 'years' ? Math.round(tenure * 12) : Math.round(tenure);
    const r = rate / 12 / 100;
    const emi = calcEMI(principal, r, months);
    const rows: AmoRow[] = [];
    let balance = principal;
    let totalInterest = 0;
    for (let m = 1; m <= months; m++) {
      const interest = balance * r;
      const prinPart = emi - interest;
      balance = Math.max(0, balance - prinPart);
      totalInterest += interest;
      rows.push({ month: m, emi, interest, principal: prinPart, balance });
    }
    setSchedule(rows);
    setSummary({ emi, totalInterest, totalPayment: emi * months, principal });
  }, [amountRaw, rateRaw, tenureRaw, tenureUnit, selectedInputCurrency, convertToINR]);

  useEffect(() => { calculate(); }, [calculate, lastUpdatedTime]);
  const handleReset = () => { setAmountRaw('1000000'); setRateRaw('8.5'); setTenureRaw('10'); setTenureUnit('years'); setSchedule([]); setSummary(null); setError(''); };
  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);
  const disp = (inr: number) => fmtAmt(convertFromINR(inr, selectedResultCurrency), currSym);
  const dispShort = (inr: number) => fmtShort(convertFromINR(inr, selectedResultCurrency), currSym);

  const principalPct = summary && summary.totalPayment > 0 ? (summary.principal / summary.totalPayment) * 100 : 0;

  const insight = useMemo(() => {
    if (!summary) return null;
    const interestRatio = summary.totalInterest / summary.principal;
    const months = tenureUnit === 'years' ? Number(tenureRaw) * 12 : Number(tenureRaw);
    if (interestRatio > 1) return { text: 'Large portion goes to interest. Consider prepayments to reduce total cost.', type: 'warning' };
    if (months > 240) return { text: 'Longer tenure increases total interest significantly. Consider a shorter tenure if possible.', type: 'warning' };
    return { text: 'Manageable interest burden. Stay on schedule to build equity faster.', type: 'success' };
  }, [summary, tenureRaw, tenureUnit]);

  const exportCSV = () => {
    if (!schedule.length) return;
    const headers = 'Month,EMI,Interest,Principal,Balance\n';
    const rows = schedule.map(r => `${r.month},${r.emi.toFixed(2)},${r.interest.toFixed(2)},${r.principal.toFixed(2)},${r.balance.toFixed(2)}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'amortization_schedule.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium mb-4">
          <FileText className="w-4 h-4" /> Loan Repayment Schedule
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-extrabold text-white tracking-tight mb-2">
          Amortization <span className="text-blue-400">Calculator</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-400 text-lg">Generate a complete month-by-month loan repayment schedule.</motion.p>
      </div>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* INPUTS + SUMMARY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div><h2 className="text-lg font-bold text-white">Inputs</h2><p className="text-slate-400 text-sm">Enter loan details</p></div>
              <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Input Currency</label>
              <select value={selectedInputCurrency} onChange={e => { if (availableCurrencies.includes(e.target.value as never)) setSelectedInputCurrency(e.target.value as never); }} disabled={ratesLoading} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                {availableCurrencies.map(c => <option key={c} value={c} className="bg-slate-800">{c} ({getCurrencySymbol(c)})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Loan Amount</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">{inputSym}</span>
                <input type="number" value={amountRaw} onChange={e => setAmountRaw(e.target.value)} placeholder="e.g. 1000000" min={0} className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" /></div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Annual Interest Rate</label>
              <div className="relative"><input type="number" value={rateRaw} onChange={e => setRateRaw(e.target.value)} placeholder="e.g. 8.5" min={0} max={50} step="0.1" className="w-full pl-4 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">%</span></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-slate-300">Loan Tenure</label>
                <div className="flex items-center gap-0.5 bg-white/5 border border-white/10 rounded-lg p-0.5">
                  {(['years', 'months'] as const).map(u => <button key={u} onClick={() => setTenureUnit(u)} className={`px-2.5 py-1 text-[11px] rounded-md font-semibold transition-all ${tenureUnit === u ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>{u.charAt(0).toUpperCase() + u.slice(1)}</button>)}
                </div>
              </div>
              <div className="relative"><input type="number" value={tenureRaw} onChange={e => setTenureRaw(e.target.value)} placeholder={tenureUnit === 'years' ? 'e.g. 10' : 'e.g. 120'} min={1} className="w-full pl-4 pr-16 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none capitalize">{tenureUnit}</span></div>
            </div>
            {error && <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm"><Info className="w-4 h-4 shrink-0" /> {error}</div>}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 mt-auto"><p className="text-xs font-mono text-slate-400">EMI = [P × R × (1+R)ᴺ] / [(1+R)ᴺ − 1]</p></div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex flex-col gap-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div><h2 className="text-lg font-bold text-white">Summary</h2><p className="text-slate-400 text-sm">Updated: <span className="text-blue-300">{relTime}</span></p></div>
                <button onClick={() => updateCurrencyRates()} disabled={ratesLoading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"><RefreshCw className={`w-4 h-4 ${ratesLoading ? 'animate-spin' : ''}`} /> Update</button>
              </div>
              <div className="mb-5"><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Display Currency</p><div className="flex flex-wrap gap-2">{availableCurrencies.map(c => <button key={c} onClick={() => setSelectedResultCurrency(c as never)} className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${selectedResultCurrency === c ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:border-blue-400 hover:text-slate-200'}`}>{c}</button>)}</div></div>
              {summary ? (
                <div className="flex flex-col gap-3">
                  <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-xl p-4"><p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">Monthly EMI</p><p className="text-3xl font-extrabold text-white">{disp(summary.emi)}</p></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Interest</p><p className="text-xl font-bold text-amber-300">{dispShort(summary.totalInterest)}</p></div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Payment</p><p className="text-xl font-bold text-white">{dispShort(summary.totalPayment)}</p></div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Principal vs Interest</p>
                    {[{ label: 'Principal', pct: principalPct, color: 'bg-blue-500', text: 'text-blue-300' }, { label: 'Interest', pct: 100 - principalPct, color: 'bg-amber-500', text: 'text-amber-300' }].map((bar, i) => (
                      <div key={bar.label} className="mb-2">
                        <div className="flex justify-between text-xs mb-1"><span className={`font-semibold ${bar.text}`}>{bar.label}</span><span className="text-slate-300">{bar.pct.toFixed(1)}%</span></div>
                        <div className="h-3 bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${bar.pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className={`h-full ${bar.color} rounded-full`} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-500 gap-3"><p className="text-sm">Enter values to generate schedule</p></div>
              )}
            </div>
            {insight && summary && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-3 px-5 py-4 rounded-2xl border-l-4 ${insight.type === 'success' ? 'bg-blue-50/5 border-blue-400 text-blue-200' : 'bg-amber-50/5 border-amber-400 text-amber-200'}`}>
                <Sparkles className="w-5 h-5 mt-0.5 shrink-0" /><div><p className="font-semibold text-sm">Smart Insight</p><p className="text-sm mt-0.5 opacity-90">{insight.text}</p></div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* AMORTIZATION TABLE */}
        {schedule.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Amortization Schedule <span className="text-slate-400 text-sm font-normal">({schedule.length} months)</span></h3>
              <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-lg transition-all">
                <FileText className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-white/10 max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0">
                  <tr className="bg-slate-800/90 text-slate-400 font-semibold">
                    <th className="px-4 py-3 text-left">Month</th>
                    <th className="px-4 py-3 text-right">EMI</th>
                    <th className="px-4 py-3 text-right">Interest</th>
                    <th className="px-4 py-3 text-right">Principal</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((row, i) => (
                    <tr key={row.month} className={`border-t border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                      <td className="px-4 py-3 text-slate-300 font-medium">{row.month}</td>
                      <td className="px-4 py-3 text-right text-white font-semibold">{disp(row.emi)}</td>
                      <td className="px-4 py-3 text-right text-amber-300">{disp(row.interest)}</td>
                      <td className="px-4 py-3 text-right text-blue-300">{disp(row.principal)}</td>
                      <td className="px-4 py-3 text-right text-slate-300">{disp(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
