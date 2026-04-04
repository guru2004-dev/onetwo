'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  RotateCcw,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle,
  Info,
  Banknote,
  Percent
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

function calcEMI(p: number, r: number, n: number): number {
  if (p <= 0 || n <= 0) return 0;
  if (r === 0) return p / n;
  const pow = Math.pow(1 + r, n);
  return (p * r * pow) / (pow - 1);
}

export default function RefinanceCalculator() {
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
  const [currentBalance, setCurrentBalance] = useState('300000');
  const [currentRate, setCurrentRate] = useState('6.5');
  const [remainingYears, setRemainingYears] = useState('20');
  
  const [newRate, setNewRate] = useState('5.0');
  const [newTermYears, setNewTermYears] = useState('20');
  const [refinanceFees, setRefinanceFees] = useState('3000'); // closing costs

  // Results
  const [results, setResults] = useState<{
    currentMonthly: number;
    newMonthly: number;
    monthlySavings: number;
    totalSavings: number;
    breakEvenMonths: number;
    currentTotalInterest: number;
    newTotalInterest: number;
  } | null>(null);

  const [error, setError] = useState('');

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);

  const calculate = useCallback(() => {
    setError('');

    const bal = Number(currentBalance);
    const cr = Number(currentRate);
    const ry = Number(remainingYears);
    const nr = Number(newRate);
    const nty = Number(newTermYears);
    const fees = Number(refinanceFees) || 0;

    if (isNaN(bal) || bal <= 0) {
      setError('Current balance must be greater than zero.');
      return setResults(null);
    }
    if (isNaN(cr) || cr <= 0 || cr > 30 || isNaN(nr) || nr <= 0 || nr > 30) {
      setError('Please enter realistic interest rates (0% - 30%).');
      return setResults(null);
    }
    if (isNaN(ry) || ry <= 0 || ry > 50 || isNaN(nty) || nty <= 0 || nty > 50) {
      setError('Tenures must be between 1 and 50 years.');
      return setResults(null);
    }

    const maxMonths = 1200; // 100 years max loop to prevent hang just in case
    const currentMonths = Math.min(ry * 12, maxMonths);
    const newMonths = Math.min(nty * 12, maxMonths);

    const crMonthly = cr / 100 / 12;
    const nrMonthly = nr / 100 / 12;

    const inr = (val: number) => convertToINR(val, selectedInputCurrency);
    const balINR = inr(bal);
    const feesINR = inr(fees);

    const currentEmi = calcEMI(balINR, crMonthly, currentMonths);
    const newEmi = calcEMI(balINR + feesINR, nrMonthly, newMonths); // Assuming fees are rolled into the loan usually for refinance analysis

    const currentTotalPayment = currentEmi * currentMonths;
    const currentTotalInterest = currentTotalPayment - balINR;

    const newTotalPayment = newEmi * newMonths;
    const newTotalInterest = newTotalPayment - (balINR + feesINR);

    const monthlySavings = currentEmi - newEmi;
    // Total savings across the life of the new loan compared to staying on old loan.
    // If the new loan is longer, this might be negative.
    const totalSavings = currentTotalPayment - newTotalPayment;

    // Break even calculation: How many months of monthlySavings does it take to recoup the refinance fees?
    // If monthly savings is negative, there is no breakeven.
    let breakEvenMonths = 0;
    if (monthlySavings > 0 && feesINR > 0) {
      breakEvenMonths = feesINR / monthlySavings;
    } else if (monthlySavings <= 0) {
      breakEvenMonths = -1; // Never
    }

    setResults({
      currentMonthly: currentEmi,
      newMonthly: newEmi,
      monthlySavings,
      totalSavings,
      breakEvenMonths,
      currentTotalInterest,
      newTotalInterest
    });

  }, [currentBalance, currentRate, remainingYears, newRate, newTermYears, refinanceFees, selectedInputCurrency, convertToINR]);

  useEffect(() => {
    calculate();
  }, [calculate, lastUpdatedTime]);

  const handleReset = () => {
    setCurrentBalance('300000');
    setCurrentRate('6.5');
    setRemainingYears('20');
    setNewRate('5.0');
    setNewTermYears('20');
    setRefinanceFees('3000');
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
    if (results.totalSavings < 0) return { text: "Warning: Refinancing to this structure will cost you more over the life of the loan than staying on your current path.", type: "warning" };
    if (results.breakEvenMonths > 60) return { text: `High break-even period. It will take ${results.breakEvenMonths.toFixed(1)} months to recoup closing costs. Refinance only if you plan to stay in the home longer than 5 years.`, type: "warning" };
    if (results.breakEvenMonths > 0) return { text: `Solid Refinance. You will break even in ${results.breakEvenMonths.toFixed(1)} months and save significant interest over the lifetime of the loan.`, type: "success" };
    return { text: "No closing costs indicated, pure rate play. The savings look positive if the term aligns with your goals.", type: "info" };
  };

  const insight = getInsight();
  const insightStyle = {
    warning: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    info: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
  };
  const InsightIcon = insight ? { warning: AlertTriangle, success: CheckCircle, info: Info }[insight.type as keyof typeof insightStyle] : Info;

  const barData = results ? [
    { name: 'Current Loan', 'Monthly EMI': convertFromINR(results.currentMonthly, selectedResultCurrency) },
    { name: 'New Loan', 'Monthly EMI': convertFromINR(results.newMonthly, selectedResultCurrency) }
  ] : [];

  const pieData = results ? [
    { name: 'Current Total Interest', value: convertFromINR(results.currentTotalInterest, selectedResultCurrency) },
    { name: 'New Total Interest', value: convertFromINR(results.newTotalInterest, selectedResultCurrency) }
  ] : [];

  const PIE_COLORS = ['#f43f5e', '#3b82f6'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm font-medium mb-4">
          <ArrowRightLeft className="w-4 h-4" />
          Loan Strategy
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
          Refinance <span className="text-violet-400">Calculator</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Evaluate whether restructuring your debt makes mathematical sense.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT — INPUTS */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Compare Loans</h2>
              <p className="text-slate-400 text-sm">Enter current vs proposed terms</p>
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
            <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
              <Banknote className="w-4 h-4"/> Current Loan
            </h3>
            
            <div>
              <label className="block text-[13px] text-slate-300 mb-1">Current Outstanding Balance</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                <input type="number" min={0} value={currentBalance} onChange={e => setCurrentBalance(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-semibold" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Current Interest Rate</label>
                <div className="relative">
                  <input type="number" min={0} max={100} step={0.1} value={currentRate} onChange={e => setCurrentRate(e.target.value)} className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-semibold" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Remaining Time (Years)</label>
                <input type="number" min={1} max={50} value={remainingYears} onChange={e => setRemainingYears(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-semibold" />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
              <Percent className="w-4 h-4"/> Proposed Loan
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">New Interest Rate</label>
                <div className="relative">
                  <input type="number" min={0} max={100} step={0.1} value={newRate} onChange={e => setNewRate(e.target.value)} className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">New Loan Term (Years)</label>
                <input type="number" min={1} max={50} value={newTermYears} onChange={e => setNewTermYears(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[13px] text-slate-300 mb-1">Refinance Fees (Rolled into loan)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={refinanceFees} onChange={e => setRefinanceFees(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold" />
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
                <h2 className="text-lg font-bold text-white">Savings Projection</h2>
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
                <div className={`border rounded-2xl p-5 mb-5 text-center ${results.monthlySavings > 0 ? 'bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border-emerald-500/30' : 'bg-gradient-to-r from-rose-600/10 to-pink-600/10 border-rose-500/30'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${results.monthlySavings > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    Monthly Payment Difference
                  </p>
                  <p className="text-5xl font-extrabold text-white tracking-tight mb-2">
                    {disp(results.monthlySavings)}
                  </p>
                  <div className="inline-flex items-center justify-center bg-black/20 rounded-full px-4 py-1 text-sm border border-white/5">
                    <span className="text-slate-300 font-semibold mr-2">{results.monthlySavings > 0 ? 'Breakeven Point:' : 'Losing Money:'}</span>
                    <span className={results.monthlySavings > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {results.breakEvenMonths > 0 ? `${results.breakEvenMonths.toFixed(1)} Months` : 'Never'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl border bg-slate-800/50 border-white/5 p-4 flex flex-col gap-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-rose-400 to-red-500" />
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Current Monthly EMI</div>
                    <p className="font-bold text-lg text-white">{disp(results.currentMonthly)}</p>
                  </div>
                  <div className="rounded-xl border bg-slate-800/50 border-white/5 p-4 flex flex-col gap-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-blue-400 to-indigo-500" />
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">New Monthly EMI</div>
                    <p className="font-bold text-lg text-white">{disp(results.newMonthly)}</p>
                  </div>
                </div>
                
                <div className="border border-white/5 rounded-xl overflow-hidden mb-5">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-slate-400 font-semibold text-xs border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3">Lifetime Interest Summary</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300 text-xs shadow-inner">
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-2.5">Total Interest on Current Path</td>
                        <td className="px-4 py-2.5 text-right font-medium text-rose-300">{disp(results.currentTotalInterest)}</td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-2.5">Total Interest on New Path</td>
                        <td className="px-4 py-2.5 text-right font-medium text-blue-300">{disp(results.newTotalInterest)}</td>
                      </tr>
                      <tr className="bg-white/5 font-bold border-t-2 border-white/10">
                        <td className="px-4 py-3 text-white">Net Lifetime Savings Estimate *</td>
                        <td className={`px-4 py-3 text-right ${results.totalSavings > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{disp(results.totalSavings)}</td>
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
                <ArrowRightLeft className="w-10 h-10 opacity-30" />
                <p className="text-sm">Input data to compare loan structures.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CHARTS SECTION */}
      {results && (
        <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-6">Monthly Cashflow Shift</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value >= 1000 ? (value/1000).toFixed(0)+'k' : value}`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '13px' }}
                    formatter={(value: number) => [`${currSym}${value.toLocaleString(undefined, {maximumFractionDigits:0})}`, 'EMI']}
                  />
                  <Bar dataKey="Monthly EMI" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#f43f5e' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col">
            <h3 className="text-base font-bold text-white mb-2">Lifetime Interest Comparison</h3>
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
                    formatter={(value: number) => [`${currSym}${value.toLocaleString(undefined, {maximumFractionDigits: 2})}`, 'Total Interest']}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-[10px] text-slate-500 mt-2">* Note: If extending tenure heavily, the new blue slice may be much larger despite lower monthly payments.</p>
          </div>
          
        </div>
      )}
    </div>
  );
}
