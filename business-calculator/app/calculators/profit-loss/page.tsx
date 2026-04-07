'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  RotateCcw,
  TrendingUp,
  DollarSign,
  Percent,
  AlertTriangle,
  CheckCircle,
  Info,
  Package,
  Layers
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

export default function ProfitLossCalculator() {
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
  const [costPrice, setCostPrice] = useState('100');
  const [sellingPrice, setSellingPrice] = useState('150');
  const [quantity, setQuantity] = useState('1');
  const [additionalCosts, setAdditionalCosts] = useState('0');

  // Results
  const [results, setResults] = useState<{
    totalCost: number;
    totalSelling: number;
    profitLoss: number;
    profitPercentage: number;
    isProfit: boolean;
  } | null>(null);

  const [error, setError] = useState('');

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);

  const calculate = useCallback(() => {
    setError('');
    const cp = Number(costPrice);
    const sp = Number(sellingPrice);
    const qty = Number(quantity);
    const addCosts = Number(additionalCosts);

    if (isNaN(cp) || cp < 0) {
      setError('Enter a valid Cost Price (≥ 0).');
      return setResults(null);
    }
    if (isNaN(sp) || sp < 0) {
      setError('Enter a valid Selling Price (≥ 0).');
      return setResults(null);
    }
    if (isNaN(qty) || qty <= 0) {
      setError('Enter a valid Quantity (> 0).');
      return setResults(null);
    }
    if (isNaN(addCosts) || addCosts < 0) {
      setError('Enter valid Additional Costs (≥ 0).');
      return setResults(null);
    }

    const cpINR = convertToINR(cp, selectedInputCurrency);
    const spINR = convertToINR(sp, selectedInputCurrency);
    const addCostsINR = convertToINR(addCosts, selectedInputCurrency);

    const totalCost = (cpINR * qty) + addCostsINR;
    const totalSelling = spINR * qty;
    const profitLoss = totalSelling - totalCost;
    const profitPercentage = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

    setResults({
      totalCost,
      totalSelling,
      profitLoss,
      profitPercentage,
      isProfit: profitLoss >= 0
    });
  }, [costPrice, sellingPrice, quantity, additionalCosts, selectedInputCurrency, convertToINR]);

  useEffect(() => {
    calculate();
  }, [calculate, lastUpdatedTime]);

  const handleReset = () => {
    setCostPrice('100');
    setSellingPrice('150');
    setQuantity('1');
    setAdditionalCosts('0');
    setError('');
  };

  const disp = (inr: number) => fmtAmt(convertFromINR(Math.abs(inr), selectedResultCurrency), currSym);

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
    if (results.isProfit && results.profitPercentage > 50) return { text: "Excellent! Your business is highly profitable.", type: "success" };
    if (results.isProfit) return { text: "Your business is profitable.", type: "info" };
    if (!results.isProfit && results.totalSelling === 0) return { text: "No revenue generated. Make sales to see profit.", type: "warning" };
    return { text: "You are selling below cost. Increase price or reduce cost to achieve profitability.", type: "warning" };
  };

  const insight = getInsight();
  const insightStyle = {
    warning: 'bg-red-500/10 border-red-500/30 text-red-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    info: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
  };
  const InsightIcon = insight ? { warning: AlertTriangle, success: CheckCircle, info: Info }[insight.type as keyof typeof insightStyle] : Info;

  const barData = results ? [
    { name: 'Total Cost', value: convertFromINR(results.totalCost, selectedResultCurrency) },
    { name: 'Total Revenue', value: convertFromINR(results.totalSelling, selectedResultCurrency) }
  ] : [];

  const pieData = results ? (
    results.isProfit ? [
      { name: 'Cost', value: convertFromINR(results.totalCost, selectedResultCurrency) },
      { name: 'Profit margin', value: convertFromINR(results.profitLoss, selectedResultCurrency) }
    ] : [
      { name: 'Recovered Cost (Revenue)', value: convertFromINR(results.totalSelling, selectedResultCurrency) },
      { name: 'Loss margin (Unrecovered)', value: convertFromINR(Math.abs(results.profitLoss), selectedResultCurrency) }
    ]
  ) : [];

  const PIE_COLORS = results?.isProfit 
    ? ['#f59e0b', '#10b981'] // amber for cost, emerald for profit
    : ['#f59e0b', '#ef4444']; // amber for recovered, red for loss

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-slate-200 dark:to-slate-900 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-medium mb-4">
          <TrendingUp className="w-4 h-4" />
          Business Calculator
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
          Profit & Loss <span className="text-emerald-400">Calculator</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Determine your profitability, margins, and cost efficiency in real-time.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT — INPUTS */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Cost & Sales Details</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Enter your trade values</p>
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
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
            >
              {availableCurrencies.map(c => (
                <option key={c} value={c} className="bg-white dark:bg-slate-800">{c} ({getCurrencySymbol(c)})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Cost Price (CP)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 font-bold text-sm pointer-events-none">{inputSym}</span>
                <input
                  type="number"
                  value={costPrice}
                  onChange={e => setCostPrice(e.target.value)}
                  placeholder="0.00"
                  min={0}
                  step="any"
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Selling Price (SP)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 font-bold text-sm pointer-events-none">{inputSym}</span>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={e => setSellingPrice(e.target.value)}
                  placeholder="0.00"
                  min={0}
                  step="any"
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Quantity</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 font-bold text-sm pointer-events-none"><Package className="w-4 h-4"/></span>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  placeholder="1"
                  min={1}
                  step="1"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Additional Costs</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 font-bold text-sm pointer-events-none">{inputSym}</span>
                <input
                  type="number"
                  value={additionalCosts}
                  onChange={e => setAdditionalCosts(e.target.value)}
                  placeholder="0.00"
                  min={0}
                  step="any"
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

        </div>

        {/* RIGHT — RESULTS */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Results Analysis</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Updated: <span className="text-emerald-300">{relTime}</span></p>
              </div>
              <button
                onClick={() => updateCurrencyRates()}
                disabled={ratesLoading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${ratesLoading ? 'animate-spin' : ''}`} />
                Update
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
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-emerald-400 hover:text-slate-800 dark:text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {results ? (
              <>
                <div className={`border rounded-2xl p-5 mb-5 text-center ${results.isProfit ? 'bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border-emerald-500/30' : 'bg-gradient-to-r from-red-600/20 to-orange-600/20 border-red-500/30'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${results.isProfit ? 'text-emerald-300' : 'text-red-300'}`}>
                    Net {results.isProfit ? 'Profit 📈' : 'Loss 📉'}
                  </p>
                  <p className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">{disp(results.profitLoss)}</p>
                  <div className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-100 dark:bg-black/20 rounded-full px-3 py-0.5 text-sm">
                    <span className={results.isProfit ? "text-emerald-400" : "text-red-400"}>
                      {results.isProfit ? '+' : '-'}{Math.abs(results.profitPercentage).toFixed(2)}% Margin
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl border bg-gray-50 dark:bg-white dark:bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-gray-100 dark:border-white/5 p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      <Layers className="w-4 h-4" /> Total Cost
                    </div>
                    <p className="font-bold text-xl text-slate-900 dark:text-white">{disp(results.totalCost)}</p>
                  </div>
                  <div className="rounded-xl border bg-gray-50 dark:bg-white dark:bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-gray-100 dark:border-white/5 p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      <DollarSign className="w-4 h-4" /> Total Revenue
                    </div>
                    <p className="font-bold text-xl text-slate-900 dark:text-white">{disp(results.totalSelling)}</p>
                  </div>
                </div>

                <div className="border border-gray-100 dark:border-gray-100 dark:border-white/5 rounded-xl overflow-hidden mb-5">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-semibold">
                      <tr>
                        <th className="px-4 py-3">Component</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                      <tr className="hover:bg-white/5 transition-colors text-xs sm:text-sm">
                        <td className="px-4 py-3">Cost Price × {quantity}</td>
                        <td className="px-4 py-3 text-right">{disp(Number(costPrice) * Number(quantity))}</td>
                      </tr>
                      {Number(additionalCosts) > 0 && (
                        <tr className="hover:bg-white/5 transition-colors text-xs sm:text-sm">
                          <td className="px-4 py-3">Additional Costs</td>
                          <td className="px-4 py-3 text-right">{disp(Number(additionalCosts))}</td>
                        </tr>
                      )}
                      <tr className="hover:bg-white/5 transition-colors text-xs sm:text-sm">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">Revenue (SP × {quantity})</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">{disp(Number(sellingPrice) * Number(quantity))}</td>
                      </tr>
                      <tr className={`font-bold text-xs sm:text-sm ${results.isProfit ? 'bg-emerald-900/20 text-emerald-300' : 'bg-red-900/20 text-red-300'}`}>
                        <td className="px-4 py-3">Gross {results.isProfit ? 'Profit' : 'Loss'}</td>
                        <td className="px-4 py-3 text-right">{disp(results.profitLoss)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {insight && (
                  <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl border-l-4 ${insightStyle[insight.type as keyof typeof insightStyle]}`}>
                    <InsightIcon className="w-5 h-5 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Smart Insight</p>
                      <p className="text-sm mt-0.5 opacity-90">{insight.text}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3 bg-gray-50 dark:bg-gray-50 dark:bg-slate-900/40 rounded-xl border border-gray-100 dark:border-gray-100 dark:border-white/5">
                <TrendingUp className="w-10 h-10 opacity-30" />
                <p className="text-sm">Enter cost and selling details to analyze.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CHARTS SECTION */}
      {results && (
        <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6">Financial Comparison</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${currSym}${value >= 1000 ? (value/1000).toFixed(1)+'k' : value}`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                    formatter={(value: number) => [`${currSym}${value.toLocaleString()}`, 'Amount']}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6 flex flex-col">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Cost vs Return Split</h3>
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
                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                    formatter={(value: number) => [`${currSym}${value.toLocaleString(undefined, {maximumFractionDigits: 2})}`, 'Amount']}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
