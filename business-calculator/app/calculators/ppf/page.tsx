'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Info,
  Banknote,
  Briefcase
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

export default function PPFCalculator() {
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
  const [yearlyDeposit, setYearlyDeposit] = useState('150000');
  const [rate, setRate] = useState('7.1'); // Current PPF rate is generally 7.1%
  const [tenureYears, setTenureYears] = useState('15'); // PPF has a fixed lock-in of 15 years initially via Govt of India rules

  // Results
  const [results, setResults] = useState<{
    totalInvestment: number;
    totalInterest: number;
    maturityValue: number;
    growthData: { year: number, balance: number, invested: number }[];
  } | null>(null);

  const [error, setError] = useState('');

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);

  const calculate = useCallback(() => {
    setError('');

    const yd = Number(yearlyDeposit);
    const r = Number(rate);
    const y = Number(tenureYears);

    if (isNaN(yd) || yd <= 0) {
      setError('Yearly deposit must be greater than zero.');
      return setResults(null);
    }
    if (isNaN(r) || r < 0 || r > 50) {
      setError('Please enter a realistic interest rate (0% - 50%).');
      return setResults(null);
    }
    if (isNaN(y) || y < 15 || y % 5 !== 0) {
      setError('PPF tenure strictly starts at 15 years and can only be extended in blocks of 5 years (15, 20, 25...).');
      return setResults(null);
    }

    const rateDecimal = r / 100;
    let currentBalance = 0;
    let currentInvested = 0;
    const growthData = [{ year: 0, balance: 0, invested: 0 }];

    for (let yr = 1; yr <= y; yr++) {
      currentInvested += yd;
      // PPF calculates interest annually on the lowest balance between the 5th and the end of the month, 
      // but compounding is annual on the accumulated principal. 
      // Simplified: Add deposit at start of year, compute interest for the year.
      currentBalance += yd;
      const interestForYear = currentBalance * rateDecimal;
      currentBalance += interestForYear;

      growthData.push({
        year: yr,
        balance: convertToINR(currentBalance, selectedInputCurrency),
        invested: convertToINR(currentInvested, selectedInputCurrency)
      });
    }

    const inr = (val: number) => convertToINR(val, selectedInputCurrency);

    setResults({
      totalInvestment: inr(currentInvested),
      totalInterest: inr(currentBalance - currentInvested),
      maturityValue: inr(currentBalance),
      growthData
    });
  }, [yearlyDeposit, rate, tenureYears, selectedInputCurrency, convertToINR]);

  useEffect(() => {
    calculate();
  }, [calculate, lastUpdatedTime]);

  const handleReset = () => {
    setYearlyDeposit('150000');
    setRate('7.1');
    setTenureYears('15');
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
    if (Number(yearlyDeposit) > 150000 && selectedInputCurrency === 'INR') {
      return { text: "Warning: The maximum limit for tax deduction under Section 80C for PPF is ₹1,50,000 per financial year.", type: "warning" };
    }
    return { text: "PPF secures long-term wealth beautifully. Remember, PPF falls under the EEE category (Exempt-Exempt-Exempt) in India, meaning your maturity value is tax-free.", type: "success" };
  };

  const insight = getInsight();
  const insightStyle = {
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    info: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
  };
  const InsightIcon = insight ? { warning: AlertTriangle, success: CheckCircle, info: Info }[insight.type as keyof typeof insightStyle] : Info;

  const barData = results?.growthData.filter(d => d.year > 0 && d.year % 5 === 0 || d.year === Number(tenureYears)).map(d => ({
    name: `Year ${d.year}`,
    Total: convertFromINR(d.balance, selectedResultCurrency),
    Principal: convertFromINR(d.invested, selectedResultCurrency),
    Interest: convertFromINR(d.balance - d.invested, selectedResultCurrency)
  })) || [];

  const pieData = results ? [
    { name: 'Total Invested', value: convertFromINR(results.totalInvestment, selectedResultCurrency) },
    { name: 'Interest Accumulated', value: convertFromINR(results.totalInterest, selectedResultCurrency) }
  ] : [];

  const PIE_COLORS = ['#3b82f6', '#10b981'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-indigo-100 dark:to-indigo-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium mb-4">
          <ShieldCheck className="w-4 h-4" />
          Retirement Security
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
          PPF <span className="text-blue-400">Calculator</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Project your long-term tax-free wealth via the Public Provident Fund parameters.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT — INPUTS */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Fund Parameters</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Design your retirement corpus schedule</p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white bg-white dark:bg-white/5 hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Input Currency</label>
            <select
              value={selectedInputCurrency}
              onChange={e => setSelectedInputCurrency(e.target.value as never)}
              disabled={ratesLoading}
              className="w-full px-4 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            >
              {availableCurrencies.map(c => (
                <option key={c} value={c} className="bg-white dark:bg-slate-800">{c} ({getCurrencySymbol(c)})</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 dark:border-white/10 pb-2">
              <Banknote className="w-4 h-4"/> Strategy
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-1">Yearly Deposit Limit</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={yearlyDeposit} onChange={e => setYearlyDeposit(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-1">Interest Rate (p.a.)</label>
                <div className="relative">
                  <input type="number" min={0} max={100} step={0.1} value={rate} onChange={e => setRate(e.target.value)} className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 dark:border-white/10 pb-2">
              <Briefcase className="w-4 h-4"/> Lock-in Period
            </h3>
            
            <div>
              <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-1">Total Tenure (Years)</label>
              <select
                value={tenureYears}
                onChange={e => setTenureYears(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all outline-none"
              >
                <option value="15">15 Years (Base)</option>
                <option value="20">20 Years (Block 1)</option>
                <option value="25">25 Years (Block 2)</option>
                <option value="30">30 Years (Block 3)</option>
                <option value="35">35 Years (Block 4)</option>
              </select>
            </div>
          </div>

          <div className="mt-2 bg-gray-50 dark:bg-gray-50 dark:bg-slate-900/40 border border-gray-100 dark:border-gray-100 dark:border-white/5 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-400">
            * The minimum tenure for PPF is rigidly set at 15 years by default. Further extensions are mathematically applied in precise 5-year blocks. Interest compounds annually.
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
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Retirement Projection</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Updated: <span className="text-blue-300">{relTime}</span></p>
              </div>
              <button
                onClick={() => updateCurrencyRates()}
                disabled={ratesLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${ratesLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Display Currency</p>
              <div className="flex flex-wrap gap-2">
                {availableCurrencies.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedResultCurrency(c as never)}
                    className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${
                      selectedResultCurrency === c
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-blue-400 hover:text-slate-800 dark:text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {results ? (
              <div className="flex flex-col flex-1">
                <div className="border rounded-2xl p-5 mb-5 text-center bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border-blue-500/30">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-blue-300">
                    Total Final Corpus
                  </p>
                  <p className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                    {disp(results.maturityValue)}
                  </p>
                  <div className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-100 dark:bg-black/20 rounded-full px-4 py-1 text-sm border border-gray-100 dark:border-gray-100 dark:border-white/5">
                    <span className="text-slate-700 dark:text-slate-300 font-semibold mr-2">Absolute Return:</span>
                    <span className="text-emerald-400 font-bold">
                      {((results.maturityValue / results.totalInvestment - 1) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl border bg-gray-50 dark:bg-white dark:bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-gray-100 dark:border-white/5 p-4 flex flex-col gap-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-blue-400 to-indigo-500" />
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Total Capital Deployed</div>
                    <p className="font-bold text-lg text-slate-900 dark:text-white">{disp(results.totalInvestment)}</p>
                  </div>
                  <div className="rounded-xl border bg-emerald-900/10 border-emerald-500/30 p-4 flex flex-col gap-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-emerald-400 to-teal-500" />
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Tax-Free Interest Output</div>
                    <p className="font-bold text-lg text-emerald-200">{disp(results.totalInterest)}</p>
                  </div>
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
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3 bg-gray-50 dark:bg-gray-50 dark:bg-slate-900/40 rounded-xl border border-gray-100 dark:border-gray-100 dark:border-white/5 flex-1">
                <ShieldCheck className="w-10 h-10 opacity-30" />
                <p className="text-sm">Input deposits to review PPF safety margins.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CHARTS SECTION */}
      {results && (
        <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6">Corpus Milestone Trajectory</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value >= 1000 ? (value/1000).toFixed(0)+'k' : value}`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '13px' }}
                    formatter={(value: number, name: string) => [`${currSym}${value.toLocaleString(undefined, {maximumFractionDigits:0})}`, name]}
                  />
                  <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '10px' }} />
                  <Bar dataKey="Principal" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Interest" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-slate-500 mt-4">* Chart marks intervals of 5 years</p>
          </div>

          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6 flex flex-col">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Long-Term Compounding Split</h3>
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
                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
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
