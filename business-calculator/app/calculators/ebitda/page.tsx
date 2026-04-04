'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  RotateCcw,
  BarChart3,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Info,
  Layers,
  ArrowUpRight
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

export default function EBITDACalculator() {
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
  const [totalRevenue, setTotalRevenue] = useState('500000');
  const [netIncome, setNetIncome] = useState('150000');
  const [interestExpense, setInterestExpense] = useState('20000');
  const [taxes, setTaxes] = useState('30000');
  const [depreciation, setDepreciation] = useState('40000');
  const [amortization, setAmortization] = useState('10000');

  // Results
  const [results, setResults] = useState<{
    ebitda: number;
    ebit: number;
    ebitdaMargin: number;
    operatingProfit: number;
    totalRevenueInr: number;
    netIncomeInr: number;
  } | null>(null);

  const [error, setError] = useState('');

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);

  const calculate = useCallback(() => {
    setError('');

    const revenue = Number(totalRevenue);
    const ni = Number(netIncome);
    const it = Number(interestExpense);
    const tx = Number(taxes);
    const dp = Number(depreciation);
    const am = Number(amortization);

    if (isNaN(revenue) || revenue <= 0) {
      setError('Total Revenue must be greater than 0.');
      return setResults(null);
    }
    if (isNaN(ni) || isNaN(it) || isNaN(tx) || isNaN(dp) || isNaN(am)) {
      setError('Enter valid numbers for all fields.');
      return setResults(null);
    }
    if (it < 0 || tx < 0 || dp < 0 || am < 0) {
      setError('Interest, Taxes, Depreciation, and Amortization cannot be negative.');
      return setResults(null);
    }

    const inr = (val: number) => convertToINR(val, selectedInputCurrency);

    const revenueINR = inr(revenue);
    const niINR = inr(ni);
    const itINR = inr(it);
    const txINR = inr(tx);
    const dpINR = inr(dp);
    const amINR = inr(am);

    // EBIT = Net Income + Interest + Taxes
    const ebitINR = niINR + itINR + txINR;
    
    // EBITDA = EBIT + D + A
    const ebitdaINR = ebitINR + dpINR + amINR;

    const margin = (ebitdaINR / revenueINR) * 100;

    setResults({
      ebitda: ebitdaINR,
      ebit: ebitINR,
      ebitdaMargin: margin,
      operatingProfit: ebitINR,
      totalRevenueInr: revenueINR,
      netIncomeInr: niINR
    });
  }, [totalRevenue, netIncome, interestExpense, taxes, depreciation, amortization, selectedInputCurrency, convertToINR]);

  useEffect(() => {
    calculate();
  }, [calculate, lastUpdatedTime]);

  const handleReset = () => {
    setTotalRevenue('500000');
    setNetIncome('150000');
    setInterestExpense('20000');
    setTaxes('30000');
    setDepreciation('40000');
    setAmortization('10000');
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
    if (results.ebitdaMargin > 30) return { text: "Excellent operating profitability! Your EBITDA margin is above standard benchmarks.", type: "success" };
    if (results.ebitdaMargin > 15) return { text: "Healthy operating margins indicate good core business performance.", type: "info" };
    if (results.ebitdaMargin > 5) return { text: "Moderate margins. Look for ways to optimize core operating costs.", type: "warning" };
    return { text: "Low or negative margin. Core operations may need immediate restructuring.", type: "warning" };
  };

  const insight = getInsight();
  const insightStyle = {
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    info: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
  };
  const InsightIcon = insight ? { warning: AlertTriangle, success: CheckCircle, info: Info }[insight.type as keyof typeof insightStyle] : Info;

  const barData = results ? [
    { name: 'Revenue', value: convertFromINR(results.totalRevenueInr, selectedResultCurrency) },
    { name: 'EBITDA', value: convertFromINR(results.ebitda, selectedResultCurrency) },
    { name: 'EBIT', value: convertFromINR(results.ebit, selectedResultCurrency) },
    { name: 'Net Income', value: convertFromINR(results.netIncomeInr, selectedResultCurrency) }
  ] : [];

  const pieData = results ? [
    { name: 'EBITDA', value: convertFromINR(results.ebitda, selectedResultCurrency) },
    { name: 'Other Costs (Non-Core)', value: convertFromINR(results.totalRevenueInr - results.ebitda, selectedResultCurrency) }
  ] : [];

  const PIE_COLORS = ['#10b981', '#334155'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-medium mb-4">
          <BarChart3 className="w-4 h-4" />
          Financial Analysis
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
          EBITDA <span className="text-emerald-400">Calculator</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Evaluate core operational profitability by calculating Earnings Before Interest, Taxes, Depreciation, and Amortization.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT — INPUTS */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Financial Statement Data</h2>
              <p className="text-slate-400 text-sm">Enter your income statement figures</p>
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
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
            >
              {availableCurrencies.map(c => (
                <option key={c} value={c} className="bg-slate-800">{c} ({getCurrencySymbol(c)})</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
              <Layers className="w-4 h-4"/> Key Top & Bottom Line
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Total Revenue</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={totalRevenue} onChange={e => setTotalRevenue(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Net Income</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" step="any" value={netIncome} onChange={e => setNetIncome(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
              <ArrowUpRight className="w-4 h-4"/> Add-backs (ITDA)
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Interest Expense</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={interestExpense} onChange={e => setInterestExpense(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Tax Expense</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={taxes} onChange={e => setTaxes(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Depreciation</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={depreciation} onChange={e => setDepreciation(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Amortization</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={amortization} onChange={e => setAmortization(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold" />
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
                <h2 className="text-lg font-bold text-white">EBITDA Breakdown</h2>
                <p className="text-slate-400 text-sm">Updated: <span className="text-emerald-300">{relTime}</span></p>
              </div>
              <button
                onClick={() => updateCurrencyRates()}
                disabled={ratesLoading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
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
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-emerald-400 hover:text-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {results ? (
              <div className="flex flex-col flex-1">
                <div className="border rounded-2xl p-5 mb-5 text-center bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border-emerald-500/30">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-emerald-300">
                    EBITDA
                  </p>
                  <p className="text-5xl font-extrabold text-white tracking-tight mb-2">
                    {disp(results.ebitda)}
                  </p>
                  <div className="inline-flex items-center justify-center bg-black/20 rounded-full px-4 py-1 text-sm border border-white/5">
                    <span className="text-slate-300 font-semibold mr-2">EBITDA Margin:</span>
                    <span className={results.ebitdaMargin >= 10 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                      {results.ebitdaMargin.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl border bg-slate-800/50 border-white/5 p-4 flex flex-col gap-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Revenue</div>
                    <p className="font-bold text-lg text-white">{disp(results.totalRevenueInr)}</p>
                  </div>
                  <div className="rounded-xl border bg-slate-800/50 border-white/5 p-4 flex flex-col gap-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">EBIT (Op. Profit)</div>
                    <p className="font-bold text-lg text-white">{disp(results.ebit)}</p>
                  </div>
                </div>

                <div className="border border-white/5 rounded-xl overflow-hidden mb-5">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-slate-400 font-semibold text-xs">
                      <tr>
                        <th className="px-4 py-3">Metric</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300 text-sm">
                      <tr className="hover:bg-white/5">
                        <td className="px-4 py-2.5">Net Income</td>
                        <td className="px-4 py-2.5 text-right font-medium">{disp(results.netIncomeInr)}</td>
                      </tr>
                      <tr className="text-indigo-300 hover:bg-white/5">
                        <td className="px-4 py-2.5 pl-6">+ Interest Expense</td>
                        <td className="px-4 py-2.5 text-right">{disp(convertToINR(Number(interestExpense), selectedInputCurrency))}</td>
                      </tr>
                      <tr className="text-indigo-300 hover:bg-white/5">
                        <td className="px-4 py-2.5 pl-6">+ Taxes</td>
                        <td className="px-4 py-2.5 text-right">{disp(convertToINR(Number(taxes), selectedInputCurrency))}</td>
                      </tr>
                      <tr className="font-medium bg-white/5">
                        <td className="px-4 py-2.5">EBIT</td>
                        <td className="px-4 py-2.5 text-right">{disp(results.ebit)}</td>
                      </tr>
                      <tr className="text-amber-300 hover:bg-white/5">
                        <td className="px-4 py-2.5 pl-6">+ Depreciation</td>
                        <td className="px-4 py-2.5 text-right">{disp(convertToINR(Number(depreciation), selectedInputCurrency))}</td>
                      </tr>
                      <tr className="text-amber-300 hover:bg-white/5">
                        <td className="px-4 py-2.5 pl-6">+ Amortization</td>
                        <td className="px-4 py-2.5 text-right">{disp(convertToINR(Number(amortization), selectedInputCurrency))}</td>
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
                <BarChart3 className="w-10 h-10 opacity-30" />
                <p className="text-sm">Input financial data to see EBITDA metrics.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CHARTS SECTION */}
      {results && (
        <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-6">Income Progression</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value >= 1000 ? (value/1000).toFixed(0)+'k' : value}`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                    formatter={(value: number) => [`${currSym}${value.toLocaleString()}`, 'Amount']}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : (index === 1 ? '#10b981' : (index === 2 ? '#f59e0b' : '#6366f1'))} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl cd business-calculatorborder border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col">
            <h3 className="text-base font-bold text-white mb-2">EBITDA to Revenue</h3>
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
