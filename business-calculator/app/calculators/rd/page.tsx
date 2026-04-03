'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  RotateCcw,
  History,
  AlertTriangle,
  CheckCircle,
  Info,
  Banknote,
  Calendar
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

export default function RDCalculator() {
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
  const [monthlyDeposit, setMonthlyDeposit] = useState('5000');
  const [rate, setRate] = useState('7.0');
  const [tenureYears, setTenureYears] = useState('5');
  const [tenureMonths, setTenureMonths] = useState('0');

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

    const md = Number(monthlyDeposit);
    const r = Number(rate);
    const y = Number(tenureYears) || 0;
    const m = Number(tenureMonths) || 0;

    if (isNaN(md) || md <= 0) {
      setError('Monthly deposit must be greater than zero.');
      return setResults(null);
    }
    if (isNaN(r) || r < 0 || r > 50) {
      setError('Please enter a realistic interest rate (0% - 50%).');
      return setResults(null);
    }
    if (y === 0 && m === 0) {
      setError('Tenure must be greater than zero.');
      return setResults(null);
    }

    const totalMonths = (y * 12) + m;
    const quarterlyRate = (r / 400);

    let currentBalance = 0;
    let currentInvested = 0;
    
    // Most standard RDs compound quarterly. Let's trace it month by month.
    let balanceForInterestCalculation = 0;
    const growthData = [{ year: 0, balance: 0, invested: 0 }];

    for (let month = 1; month <= totalMonths; month++) {
      currentInvested += md;
      currentBalance += md;
      balanceForInterestCalculation += md;

      // Quarterly Compounding check
      if (month % 3 === 0) {
        const interestForQuarter = balanceForInterestCalculation * quarterlyRate;
        currentBalance += interestForQuarter;
        // The newly added interest now becomes part of the basis for the next quarter's interest.
        balanceForInterestCalculation = currentBalance;
      }

      if (month % 12 === 0 || month === totalMonths) {
        growthData.push({
          year: month / 12, // Allow floating point year markers for end of tenure if not exact yr
          balance: convertToINR(currentBalance, selectedInputCurrency),
          invested: convertToINR(currentInvested, selectedInputCurrency)
        });
      }
    }

    const inr = (val: number) => convertToINR(val, selectedInputCurrency);

    const maturityValueRaw = currentBalance;
    const totalInvestmentRaw = currentInvested;
    const totalInterestRaw = maturityValueRaw - totalInvestmentRaw;

    setResults({
      totalInvestment: inr(totalInvestmentRaw),
      totalInterest: inr(totalInterestRaw),
      maturityValue: inr(maturityValueRaw),
      growthData
    });
  }, [monthlyDeposit, rate, tenureYears, tenureMonths, selectedInputCurrency, convertToINR]);

  useEffect(() => {
    calculate();
  }, [calculate, lastUpdatedTime]);

  const handleReset = () => {
    setMonthlyDeposit('5000');
    setRate('7.0');
    setTenureYears('5');
    setTenureMonths('0');
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
    const isLongTerm = Number(tenureYears) >= 5;
    if (isLongTerm) return { text: "Long-term RDs efficiently utilize the power of quarterly compounding. Your scheduled savings are maximizing compounding value.", type: "success" };
    return { text: "Structured consistent saving is the key to building preliminary wealth.", type: "info" };
  };

  const insight = getInsight();
  const insightStyle = {
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    info: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
  };
  const InsightIcon = insight ? { warning: AlertTriangle, success: CheckCircle, info: Info }[insight.type as keyof typeof insightStyle] : Info;

  const barData = results?.growthData.map(d => ({
    name: `Year ${d.year % 1 === 0 ? d.year : d.year.toFixed(1)}`,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-4">
          <History className="w-4 h-4" />
          Systematic Saving
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
          Recurring Deposit <span className="text-indigo-400">Calculator</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Evaluate wealth generation through steady, periodic banking deposits tracking quarterly compound returns.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT — INPUTS */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">RD Parameters</h2>
              <p className="text-slate-400 text-sm">Schedule your recurring contributions</p>
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
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            >
              {availableCurrencies.map(c => (
                <option key={c} value={c} className="bg-slate-800">{c} ({getCurrencySymbol(c)})</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
              <Banknote className="w-4 h-4"/> Schedule
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Monthly Deposit</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={monthlyDeposit} onChange={e => setMonthlyDeposit(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Interest Rate (p.a.)</label>
                <div className="relative">
                  <input type="number" min={0} max={100} step={0.1} value={rate} onChange={e => setRate(e.target.value)} className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
              <Calendar className="w-4 h-4"/> Duration
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Years</label>
                <input type="number" min={0} value={tenureYears} onChange={e => setTenureYears(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-semibold" />
              </div>
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Months</label>
                <input type="number" min={0} max={11} value={tenureMonths} onChange={e => setTenureMonths(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-semibold" />
              </div>
            </div>
          </div>

          <div className="mt-2 bg-slate-900/40 border border-white/5 rounded-xl p-4 text-xs text-slate-400">
            * Consistent with global standards and Indian banking practices, this calculator processes compounding strictly at the end of every quarter (every 3 months) based on cumulative monthly inputs.
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
                <h2 className="text-lg font-bold text-white">Maturity Returns</h2>
                <p className="text-slate-400 text-sm">Updated: <span className="text-indigo-300">{relTime}</span></p>
              </div>
              <button
                onClick={() => updateCurrencyRates()}
                disabled={ratesLoading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
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
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-indigo-400 hover:text-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {results ? (
              <div className="flex flex-col flex-1">
                <div className="border rounded-2xl p-5 mb-5 text-center bg-gradient-to-r from-indigo-600/10 to-blue-600/10 border-indigo-500/30">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-indigo-300">
                    Expected Maturity Value
                  </p>
                  <p className="text-5xl font-extrabold text-white tracking-tight mb-2">
                    {disp(results.maturityValue)}
                  </p>
                  <div className="inline-flex items-center justify-center bg-black/20 rounded-full px-4 py-1 text-sm border border-white/5">
                    <span className="text-slate-300 font-semibold mr-2">Net Portfolio Yield:</span>
                    <span className="text-emerald-400 font-bold">
                      {((results.maturityValue / results.totalInvestment - 1) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl border bg-slate-800/50 border-white/5 p-4 flex flex-col gap-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-blue-400 to-indigo-500" />
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Built Principal</div>
                    <p className="font-bold text-lg text-white">{disp(results.totalInvestment)}</p>
                  </div>
                  <div className="rounded-xl border bg-emerald-900/10 border-emerald-500/30 p-4 flex flex-col gap-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-emerald-400 to-teal-500" />
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Compounded Interest Earned</div>
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
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3 bg-slate-900/40 rounded-xl border border-white/5 flex-1">
                <History className="w-10 h-10 opacity-30" />
                <p className="text-sm">Enter schedule settings to map your RD accumulation.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CHARTS SECTION */}
      {results && (
        <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-6">Yearly Compounding Scale</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value >= 1000 ? (value/1000).toFixed(0)+'k' : value}`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '13px' }}
                    formatter={(value: number, name: string) => [`${currSym}${value.toLocaleString(undefined, {maximumFractionDigits:0})}`, name]}
                  />
                  <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '10px' }} />
                  <Bar dataKey="Principal" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Interest" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col">
            <h3 className="text-base font-bold text-white mb-2">Final Maturity Makeup</h3>
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
