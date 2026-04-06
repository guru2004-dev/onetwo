'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  RotateCcw,
  Target,
  AlertTriangle,
  CheckCircle,
  Info,
  Banknote,
  Crosshair
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import {
  AreaChart,
  Area,
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

export default function GoalSavingsCalculator() {
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
  const [targetAmount, setTargetAmount] = useState('500000');
  const [initialSavings, setInitialSavings] = useState('50000');
  const [yearsToGoal, setYearsToGoal] = useState('5');
  const [expectedReturnRate, setExpectedReturnRate] = useState('7.0');

  // Results
  const [results, setResults] = useState<{
    monthlyContribution: number;
    totalContributions: number;
    totalInterest: number;
    finalAmount: number;
    schedule: { month: number, balance: number, invested: number }[];
  } | null>(null);

  const [error, setError] = useState('');

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);

  const calculate = useCallback(() => {
    setError('');

    const target = Number(targetAmount);
    const initial = Number(initialSavings);
    const years = Number(yearsToGoal);
    const rate = Number(expectedReturnRate);

    if (isNaN(target) || target <= 0) {
      setError('Target amount must be greater than zero.');
      return setResults(null);
    }
    if (isNaN(initial) || initial < 0 || initial >= target) {
      setError('Initial savings must be valid and less than the target amount.');
      return setResults(null);
    }
    if (isNaN(years) || years <= 0 || years > 50) {
      setError('Time horizon must be between 1 and 50 years.');
      return setResults(null);
    }
    if (isNaN(rate) || rate < 0 || rate > 50) {
      setError('Expected return rate must be realistic (0-50%).');
      return setResults(null);
    }

    const inr = (val: number) => convertToINR(val, selectedInputCurrency);
    const targetINR = inr(target);
    const initialINR = inr(initial);
    
    const months = years * 12;
    const rMonthly = rate / 100 / 12;

    // Formula to find PMT (Monthly Contribution) to reach Future Value (FV)
    // FV = PV*(1+r)^n + PMT*[ ((1+r)^n - 1) / r ]
    // PMT = [ FV - PV*(1+r)^n ] / [ ((1+r)^n - 1) / r ]
    
    let pmt = 0;
    if (rMonthly === 0) {
      pmt = (targetINR - initialINR) / months;
    } else {
      const compoundFactor = Math.pow(1 + rMonthly, months);
      const fvOfPv = initialINR * compoundFactor;
      
      const missingFv = targetINR - fvOfPv;
      
      if (missingFv <= 0) {
        // PV alone reaches target
        pmt = 0;
      } else {
        pmt = missingFv / ((compoundFactor - 1) / rMonthly);
      }
    }

    let currentBalance = initialINR;
    let totalInvested = initialINR;
    const scheduleData = [];

    const step = Math.max(1, Math.floor(months / 60)); // Track mostly 60 points for performance

    for (let m = 0; m <= months; m++) {
      if (m > 0) {
        currentBalance = currentBalance * (1 + rMonthly) + pmt;
        totalInvested += pmt;
      }

      if (m % step === 0 || m === months) {
        scheduleData.push({
          month: m,
          balance: convertFromINR(currentBalance, selectedResultCurrency),
          invested: convertFromINR(totalInvested, selectedResultCurrency)
        });
      }
    }

    const totalInterest = targetINR - totalInvested;

    setResults({
      monthlyContribution: pmt,
      totalContributions: totalInvested - initialINR,
      totalInterest: totalInterest > 0 ? totalInterest : 0,
      finalAmount: currentBalance, // Should be approx targetINR
      schedule: scheduleData
    });

  }, [targetAmount, initialSavings, yearsToGoal, expectedReturnRate, selectedInputCurrency, selectedResultCurrency, convertToINR, convertFromINR]);

  useEffect(() => {
    calculate();
  }, [calculate, lastUpdatedTime]);

  const handleReset = () => {
    setTargetAmount('500000');
    setInitialSavings('50000');
    setYearsToGoal('5');
    setExpectedReturnRate('7.0');
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
    if (results.monthlyContribution === 0) return { text: "Your initial savings will reach your target purely through compound interest! No monthly additions required.", type: "success" };
    if (results.monthlyContribution > convertToINR(Number(targetAmount), selectedInputCurrency)) return { text: "Warning: Unrealistic goal parameters detected.", type: "warning" };
    return { text: "Aim for consistency. Automate this monthly contribution to safely hit your long-term target.", type: "info" };
  };

  const insight = getInsight();
  const insightStyle = {
    warning: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    info: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
  };
  const InsightIcon = insight ? { warning: AlertTriangle, success: CheckCircle, info: Info }[insight.type as keyof typeof insightStyle] : Info;


  const pieData = results ? [
    { name: 'Initial Seed', value: convertFromINR(convertToINR(Number(initialSavings), selectedInputCurrency), selectedResultCurrency) },
    { name: 'Monthly Additions', value: convertFromINR(results.totalContributions, selectedResultCurrency) },
    { name: 'Interest Yield', value: convertFromINR(results.totalInterest, selectedResultCurrency) }
  ].filter(x => x.value > 0) : [];

  const PIE_COLORS = ['#8b5cf6', '#3b82f6', '#10b981'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-indigo-100 dark:to-indigo-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-sm font-medium mb-4">
          <Target className="w-4 h-4" />
          Financial Planning
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-900 dark:text-white tracking-tight mb-2">
          Goal <span className="text-pink-400">Savings</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-lg">
          Calculate the exact monthly contribution needed to reach your financial target.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT — INPUTS */}
        <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">Target Parameters</h2>
              <p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">Define what you are saving for</p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-slate-900 dark:text-white bg-white dark:bg-white dark:bg-white/5 hover:bg-white/10 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-lg transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-2">Input Currency</label>
            <select
              value={selectedInputCurrency}
              onChange={e => setSelectedInputCurrency(e.target.value as never)}
              disabled={ratesLoading}
              className="w-full px-4 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all outline-none"
            >
              {availableCurrencies.map(c => (
                <option key={c} value={c} className="bg-white dark:bg-slate-800">{c} ({getCurrencySymbol(c)})</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 dark:border-gray-200 dark:border-white/10 pb-2">
              <Crosshair className="w-4 h-4"/> Goal
            </h3>
            
            <div>
              <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">Target Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                <input type="number" min={0} value={targetAmount} onChange={e => setTargetAmount(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all font-semibold" />
              </div>
            </div>
            
            <div>
              <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">Current Savings Available</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                <input type="number" min={0} value={initialSavings} onChange={e => setInitialSavings(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all font-semibold" />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 dark:border-gray-200 dark:border-white/10 pb-2">
              <Banknote className="w-4 h-4"/> Timeline & Assumed Growth
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">Years to Reach Goal</label>
                <input type="number" min={1} max={50} value={yearsToGoal} onChange={e => setYearsToGoal(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold" />
              </div>
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">Expected Return (p.a.)</label>
                <div className="relative">
                  <input type="number" min={0} max={100} step={0.1} value={expectedReturnRate} onChange={e => setExpectedReturnRate(e.target.value)} className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
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
          <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">Required Commitment</h2>
                <p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">Updated: <span className="text-pink-300">{relTime}</span></p>
              </div>
              <button
                onClick={() => updateCurrencyRates()}
                disabled={ratesLoading}
                className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${ratesLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Display Currency</p>
              <div className="flex flex-wrap gap-2">
                {availableCurrencies.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedResultCurrency(c as never)}
                    className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${
                      selectedResultCurrency === c
                        ? 'bg-pink-600 border-pink-500 text-white'
                        : 'bg-white dark:bg-white dark:bg-white/5 border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-600 dark:text-slate-400 hover:border-pink-400 hover:text-slate-800 dark:text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {results ? (
              <div className="flex flex-col flex-1">
                <div className="border rounded-2xl p-5 mb-5 text-center bg-gradient-to-r from-pink-600/10 to-rose-600/10 border-pink-500/30">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-pink-300">
                    Required Monthly Addition
                  </p>
                  <p className="text-5xl font-extrabold text-slate-900 dark:text-slate-900 dark:text-white tracking-tight mb-2">
                    {disp(results.monthlyContribution)}
                  </p>
                  <div className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-100 dark:bg-black/20 rounded-full px-4 py-1 text-sm border border-gray-100 dark:border-gray-100 dark:border-white/5">
                    <span className="text-slate-700 dark:text-slate-700 dark:text-slate-300 font-semibold mr-2">Goal Target Amount:</span>
                    <span className="text-emerald-400 font-bold">
                      {disp(convertToINR(Number(targetAmount), selectedInputCurrency))}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl border bg-gray-50 dark:bg-white dark:bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-gray-100 dark:border-white/5 p-4 flex flex-col gap-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-blue-400 to-indigo-500" />
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-600 dark:text-slate-400">Total Monthly Contributions</div>
                    <p className="font-bold text-lg text-slate-900 dark:text-slate-900 dark:text-white">{disp(results.totalContributions)}</p>
                  </div>
                  <div className="rounded-xl border bg-emerald-900/10 border-emerald-500/30 p-4 flex flex-col gap-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-emerald-400 to-green-500" />
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Total Interest Yielded</div>
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
                <Target className="w-10 h-10 opacity-30" />
                <p className="text-sm">Input data to calculate your monthly path.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CHARTS SECTION */}
      {results && (
        <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-900 dark:text-white mb-6">Velocity to Target</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={results.schedule} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} tickFormatter={m => `M${m}`} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value >= 1000 ? (value/1000).toFixed(0)+'k' : value}`} />
                  <Tooltip
                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '13px' }}
                    formatter={(value: number, name: string) => [`${currSym}${value.toLocaleString(undefined, {maximumFractionDigits:0})}`, name === 'balance' ? 'Total Value' : 'Actual Invested']}
                    labelFormatter={(label) => `Month ${label}`}
                  />
                  <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="invested" name="Actual Invested" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorInv)" />
                  <Area type="monotone" dataKey="balance" name="Total Value" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorBal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6 flex flex-col">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-900 dark:text-white mb-2">Final Allocation</h3>
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
