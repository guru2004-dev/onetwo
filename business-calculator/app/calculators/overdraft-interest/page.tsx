'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  RotateCcw,
  Landmark,
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

export default function OverdraftInterestCalculator() {
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
  const [overdraftLimit, setOverdraftLimit] = useState('100000');
  const [overdrawnAmount, setOverdrawnAmount] = useState('25000');
  const [interestRate, setInterestRate] = useState('12.5'); // Typically 10-18% annually
  const [daysOverdrawn, setDaysOverdrawn] = useState('15');

  // Results
  const [results, setResults] = useState<{
    limit: number;
    principal: number;
    interest: number;
    totalDue: number;
    dailyInterest: number;
    utilization: number;
  } | null>(null);

  const [error, setError] = useState('');

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);

  const calculate = useCallback(() => {
    setError('');

    const limit = Number(overdraftLimit);
    const amt = Number(overdrawnAmount);
    const rate = Number(interestRate);
    const days = Number(daysOverdrawn);

    if (isNaN(amt) || amt < 0) {
      setError('Overdrawn amount must be a valid positive number.');
      return setResults(null);
    }
    if (isNaN(rate) || rate <= 0 || rate > 100) {
      setError('Interest rate must be between >0 and 100.');
      return setResults(null);
    }
    if (isNaN(days) || days <= 0 || days > 365) {
      setError('Days overdrawn must be a practical duration (1-365).');
      return setResults(null);
    }
    if (amt > limit && limit > 0) {
      setError('Warning: Overdrawn amount exceeds stated overdraft limit, which may incur massive penalty fees beyond standard interest.');
    }

    const inr = (val: number) => convertToINR(val, selectedInputCurrency);

    const limitINR = inr(limit);
    const amtINR = inr(amt);

    // Overdraft is usually calculated on daily balance: Interest = Principal * (Rate / 365 / 100) * Days
    const dailyRate = rate / 365 / 100;
    const interestINR = amtINR * dailyRate * days;
    const dailyInterestINR = amtINR * dailyRate;

    const totalDueINR = amtINR + interestINR;
    const utilization = limitINR > 0 ? (amtINR / limitINR) * 100 : 0;

    setResults({
      limit: limitINR,
      principal: amtINR,
      interest: interestINR,
      totalDue: totalDueINR,
      dailyInterest: dailyInterestINR,
      utilization
    });
  }, [overdraftLimit, overdrawnAmount, interestRate, daysOverdrawn, selectedInputCurrency, convertToINR]);

  useEffect(() => {
    calculate();
  }, [calculate, lastUpdatedTime]);

  const handleReset = () => {
    setOverdraftLimit('100000');
    setOverdrawnAmount('25000');
    setInterestRate('12.5');
    setDaysOverdrawn('15');
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
    if (results.utilization > 90) return { text: "Critical Utilization! You are dangerously close to or exceeding your overdraft limit.", type: "warning" };
    if (results.utilization > 50) return { text: "High Utilization. Consider paying down the overdraft soon to avoid large aggregate interest charges.", type: "info" };
    return { text: "Healthy overdraft utilization. Ensure funds are deposited soon to keep interest costs minimal.", type: "success" };
  };

  const insight = getInsight();
  const insightStyle = {
    warning: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    info: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
  };
  const InsightIcon = insight ? { warning: AlertTriangle, success: CheckCircle, info: Info }[insight.type as keyof typeof insightStyle] : Info;

  const barData = results ? [
    { name: 'Overdrawn Amt', value: convertFromINR(results.principal, selectedResultCurrency) },
    { name: 'Total Repayment', value: convertFromINR(results.totalDue, selectedResultCurrency) }
  ] : [];

  const pieData = results ? [
    { name: 'Original Principal', value: convertFromINR(results.principal, selectedResultCurrency) },
    { name: 'Interest Cost', value: convertFromINR(results.interest, selectedResultCurrency) },
  ].filter(d => d.value > 0) : [];

  const PIE_COLORS = ['#8b5cf6', '#f43f5e'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm font-medium mb-4">
          <Landmark className="w-4 h-4" />
          Banking Operations
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
          Overdraft <span className="text-violet-400">Interest</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Determine exactly what an overdrawn bank account is costing you in daily interest.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT — INPUTS */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Facility Details</h2>
              <p className="text-slate-400 text-sm">Enter your overdraft facility limits and usage</p>
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
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all outline-none"
            >
              {availableCurrencies.map(c => (
                <option key={c} value={c} className="bg-slate-800">{c} ({getCurrencySymbol(c)})</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
              <Banknote className="w-4 h-4"/> Facility Usage
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Total Overdraft Limit</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={overdraftLimit} onChange={e => setOverdraftLimit(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all font-semibold" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Overdrawn Balance (Current)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={overdrawnAmount} onChange={e => setOverdrawnAmount(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all font-semibold" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-violet-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
              <MinusCircle className="w-4 h-4"/> Interest Conditions
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Interest Rate (Annual %)</label>
                <div className="relative">
                  <input type="number" min={0} max={100} step={0.1} value={interestRate} onChange={e => setInterestRate(e.target.value)} className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all font-semibold" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Days Overdrawn</label>
                <div className="relative">
                  <input type="number" min={0} value={daysOverdrawn} onChange={e => setDaysOverdrawn(e.target.value)} className="w-full pl-3 pr-12 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all font-semibold" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs text-right">days</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 bg-slate-900/40 border border-white/5 rounded-xl p-4 text-xs text-slate-400">
            * This calculates simple daily interest, which is how most financial institutions assess overdrafts at the end of every business day. If left unpaid across months, simple interest balances may compound.
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
                <p className="text-slate-400 text-sm">Updated: <span className="text-violet-300">{relTime}</span></p>
              </div>
              <button
                onClick={() => updateCurrencyRates()}
                disabled={ratesLoading}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
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
                        ? 'bg-violet-600 border-violet-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-violet-400 hover:text-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {results ? (
              <div className="flex flex-col flex-1">
                <div className="border rounded-2xl p-5 mb-5 text-center bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 border-violet-500/30">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-violet-300">
                    Calculated Overdraft Interest
                  </p>
                  <p className="text-5xl font-extrabold text-white tracking-tight mb-2">
                    {disp(results.interest)}
                  </p>
                  <div className="inline-flex items-center justify-center bg-black/20 rounded-full px-4 py-1 text-sm border border-white/5">
                    <span className="text-slate-300 font-semibold mr-2">Interest Per Day:</span>
                    <span className="text-violet-400 font-bold">
                      {disp(results.dailyInterest)} / day
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl border bg-slate-800/50 border-white/5 p-4 flex flex-col gap-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-blue-400 to-indigo-500" />
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Limit Utilization</div>
                    <p className="font-bold text-lg text-white">{results.utilization.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-xl border bg-violet-900/10 border-violet-500/30 p-4 flex flex-col gap-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-violet-400 to-fuchsia-500" />
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-violet-400">Total Due to Bank</div>
                    <p className="font-bold text-lg text-violet-200">{disp(results.totalDue)}</p>
                  </div>
                </div>

                <div className="border border-white/5 rounded-xl overflow-hidden mb-5">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-slate-400 font-semibold text-xs border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3">Accounting Item</th>
                        <th className="px-4 py-3 text-right">Financial Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300 text-sm">
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-slate-200">Overdrawn Original Balance</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-200">{disp(results.principal)}</td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-rose-300">Calculated Interest ({daysOverdrawn} days)</td>
                        <td className="px-4 py-3 text-right font-medium text-rose-300">{disp(results.interest)}</td>
                      </tr>
                      <tr className="bg-white/5 font-bold border-t-2 border-white/10">
                        <td className="px-4 py-3 text-violet-300">Total Liability</td>
                        <td className="px-4 py-3 text-right text-violet-300">{disp(results.totalDue)}</td>
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
                <Landmark className="w-10 h-10 opacity-30" />
                <p className="text-sm">Input operational limits to calculate exposure.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CHARTS SECTION */}
      {results && (
        <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-6">Facility Limit Tracking</h3>
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
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#8b5cf6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col">
            <h3 className="text-base font-bold text-white mb-2">Liability Composition</h3>
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
