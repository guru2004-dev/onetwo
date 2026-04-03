'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  RotateCcw,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Info,
  Banknote,
  MinusCircle
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

function fmtAmt(n: number, symbol: string): string {
  if (!isFinite(n)) return `${symbol}0.00`;
  return `${symbol}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CreditCardInterestCalculator() {
  const {
    selectedInputCurrency,
    setSelectedInputCurrency,
    selectedResultCurrency,
    setSelectedResultCurrency,
    availableCurrencies,
    loading: ratesLoading,
    updateCurrencyRates,
    lastUpdatedTime,
    getCurrencySymbol,
    convertToINR,
    convertFromINR,
  } = useCurrency();

  // Inputs
  const [outstandingBalance, setOutstandingBalance] = useState('50000');
  const [apr, setApr] = useState('36'); // Typically 36% to 42% annually in many places
  const [daysCarried, setDaysCarried] = useState('30');
  const [lateFee, setLateFee] = useState('0');

  // Results
  const [results, setResults] = useState<{
    principal: number;
    interest: number;
    lateFee: number;
    newBalance: number;
    effectiveDailyRate: number;
  } | null>(null);

  const [error, setError] = useState('');

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);

  const calculate = useCallback(() => {
    setError('');

    const bal = Number(outstandingBalance);
    const rate = Number(apr);
    const days = Number(daysCarried);
    const fee = Number(lateFee) || 0;

    if (isNaN(bal) || bal < 0) {
      setError('Outstanding balance must be a valid positive number.');
      return setResults(null);
    }
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setError('APR must be between 0 and 100.');
      return setResults(null);
    }
    if (isNaN(days) || days < 0 || days > 3650) {
      setError('Days carried must be realistic (0-3650).');
      return setResults(null);
    }
    if (fee < 0) {
      setError('Late fee cannot be negative.');
      return setResults(null);
    }

    const inr = (val: number) => convertToINR(val, selectedInputCurrency);

    const balINR = inr(bal);
    const feeINR = inr(fee);

    // Interest formula: (Balance * APR/100 * Days) / 365
    // Daily Periodic Rate = APR / 365
    const dailyRate = rate / 365 / 100;
    const interestINR = balINR * dailyRate * days;
    
    // Sometimes credit cards compound daily, but simple average daily balance is standard for calculators.
    // We will use simple interest for the period.

    const newBalanceINR = balINR + interestINR + feeINR;

    setResults({
      principal: balINR,
      interest: interestINR,
      lateFee: feeINR,
      newBalance: newBalanceINR,
      effectiveDailyRate: dailyRate * 100
    });
  }, [outstandingBalance, apr, daysCarried, lateFee, selectedInputCurrency, convertToINR]);

  useEffect(() => {
    calculate();
  }, [calculate, lastUpdatedTime]);

  const handleReset = () => {
    setOutstandingBalance('50000');
    setApr('36');
    setDaysCarried('30');
    setLateFee('0');
    setError('');
  };

  const disp = (inr: number) => fmtAmt(convertFromINR(inr, selectedResultCurrency), currSym);

  // Time display
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  const relTime = (() => {
    void tick;
    if (!lastUpdatedTime) return 'never';
    const s = Math.max(1, Math.floor((Date.now() - lastUpdatedTime) / 1000));
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  })();

  const getInsight = () => {
    if (!results) return null;
    if (results.interest === 0 && results.lateFee === 0) return { text: "No interest or fees charged. Great job paying in full!", type: "success" };
    if ((results.interest + results.lateFee) > (results.principal * 0.05)) return { text: "High fee burden. The extra costs represent more than 5% of your principal. Consider converting to an EMI strategy or paying it off ASAP.", type: "warning" };
    return { text: "Interest is accruing daily on your balance until fully paid.", type: "info" };
  };

  const insight = getInsight();
  const insightStyle = {
    warning: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    info: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
  };
  const InsightIcon = insight ? { warning: AlertTriangle, success: CheckCircle, info: Info }[insight.type as keyof typeof insightStyle] : Info;

  const barData = results ? [
    { name: 'Original Balance', value: convertFromINR(results.principal, selectedResultCurrency) },
    { name: 'New Balance', value: convertFromINR(results.newBalance, selectedResultCurrency) }
  ] : [];

  const pieData = results ? [
    { name: 'Principal Balance', value: convertFromINR(results.principal, selectedResultCurrency) },
    { name: 'Interest Generated', value: convertFromINR(results.interest, selectedResultCurrency) },
    { name: 'Late Fees', value: convertFromINR(results.lateFee, selectedResultCurrency) }
  ].filter(d => d.value > 0) : [];

  const PIE_COLORS = ['#3b82f6', '#f43f5e', '#f59e0b'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-sm font-medium mb-4">
          <CreditCard className="w-4 h-4" />
          Debt Management
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
          Credit Card <span className="text-rose-400">Interest</span>
        </h1>
        <p className="text-slate-400 text-lg">
          See exactly how much daily interest your carried balance is costing you.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT — INPUTS */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Statement Data</h2>
              <p className="text-slate-400 text-sm">Enter your outstanding balances</p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Input Currency</label>
            <select
              value={selectedInputCurrency}
              onChange={e => setSelectedInputCurrency(e.target.value as never)}
              disabled={ratesLoading}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all outline-none"
            >
              {availableCurrencies.map(c => (
                <option key={c} value={c} className="bg-slate-800">{c} ({getCurrencySymbol(c)})</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
              <Banknote className="w-4 h-4"/> Debt Snapshot
            </h3>
            <div>
              <label className="block text-[13px] text-slate-300 mb-1">Outstanding Balance / Amount Carried</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                <input type="number" min={0} value={outstandingBalance} onChange={e => setOutstandingBalance(e.target.value)} className="w-full pl-8 pr-3 py-3 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-semibold text-lg" />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
              <MinusCircle className="w-4 h-4"/> Rates & Penalties
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">APR (Annual % Rate)</label>
                <div className="relative">
                  <input type="number" min={0} max={100} value={apr} onChange={e => setApr(e.target.value)} className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-semibold" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Days Carried Over</label>
                <div className="relative">
                  <input type="number" min={0} value={daysCarried} onChange={e => setDaysCarried(e.target.value)} className="w-full pl-3 pr-12 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-semibold" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs text-right">days</span>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[13px] text-slate-300 mb-1">Late Payment Fees (If Applicable)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={lateFee} onChange={e => setLateFee(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-semibold" />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm mt-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

        </div>

        {/* RIGHT — RESULTS */}
        <div className="flex flex-col gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">Interest Exposure</h2>
                <p className="text-slate-400 text-sm">Updated: <span className="text-rose-300">{relTime}</span></p>
              </div>
              <button
                onClick={() => updateCurrencyRates()}
                disabled={ratesLoading}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${ratesLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Display Currency</p>
              <div className="flex flex-wrap gap-2">
                {availableCurrencies.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedResultCurrency(c as never)}
                    className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${
                      selectedResultCurrency === c
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-rose-400 hover:text-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {results ? (
              <div className="flex flex-col flex-1">
                <div className="border rounded-2xl p-5 mb-5 text-center bg-gradient-to-r from-red-600/10 to-rose-600/10 border-rose-500/30">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-rose-300">
                    Total Extra Cost (Interest + Fees)
                  </p>
                  <p className="text-5xl font-extrabold text-white tracking-tight mb-2">
                    {disp(results.interest + results.lateFee)}
                  </p>
                  <div className="inline-flex items-center justify-center bg-black/20 rounded-full px-4 py-1 text-sm border border-white/5">
                    <span className="text-slate-300 font-semibold mr-2">Calculated Daily Rate:</span>
                    <span className="text-rose-400 font-bold">
                      {results.effectiveDailyRate.toFixed(4)}% / day
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl border bg-slate-800/50 border-white/5 p-4 flex flex-col gap-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Principal Balance</div>
                    <p className="font-bold text-lg text-white">{disp(results.principal)}</p>
                  </div>
                  <div className="rounded-xl border bg-rose-900/10 border-rose-500/30 p-4 flex flex-col gap-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-rose-400">Total New Balance</div>
                    <p className="font-bold text-lg text-rose-200">{disp(results.newBalance)}</p>
                  </div>
                </div>

                <div className="border border-white/5 rounded-xl overflow-hidden mb-5">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-slate-400 font-semibold text-xs border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3">Component</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300 text-sm">
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-slate-200">Starting Balance</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-200">{disp(results.principal)}</td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-rose-300">+ Interest Accrued ({results.effectiveDailyRate.toFixed(4)}% × {daysCarried} days)</td>
                        <td className="px-4 py-3 text-right font-medium text-rose-300">{disp(results.interest)}</td>
                      </tr>
                      {results.lateFee > 0 && (
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-amber-300">+ Late Penalty Fees</td>
                          <td className="px-4 py-3 text-right font-medium text-amber-300">{disp(results.lateFee)}</td>
                        </tr>
                      )}
                      <tr className="bg-white/5 font-bold border-t-2 border-white/10">
                        <td className="px-4 py-3 text-red-300">Total Due on Next Cycle</td>
                        <td className="px-4 py-3 text-right text-red-300">{disp(results.newBalance)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {insight && (
                  <div className={`mt-auto flex items-start gap-3 px-4 py-3 rounded-2xl border-l-4 ${insightStyle[insight.type as keyof typeof insightStyle]}`}>
                    <InsightIcon className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-xs">Insight</p>
                      <p className="text-xs mt-0.5 opacity-90">{insight.text}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3 bg-slate-900/40 rounded-xl border border-white/5 flex-1">
                <CreditCard className="w-10 h-10 opacity-30" />
                <p className="text-sm">Input credit parameters to reveal hidden interest costs.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CHARTS SECTION */}
      {results && (
        <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-6">Balance Inflation Over Time</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value >= 1000 ? (value/1000).toFixed(0)+'k' : value}`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '13px' }}
                    formatter={(value: number) => [`${currSym}${value.toLocaleString()}`, 'Amount']}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col">
            <h3 className="text-base font-bold text-white mb-2">New Balance Composition</h3>
            <div className="flex-1 min-h-[250px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                    formatter={(value: number) => [`${currSym}${value.toLocaleString(undefined, {maximumFractionDigits: 2})}`, 'Amount']}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
