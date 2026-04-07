'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  RotateCcw,
  TrendingUp,
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

export default function GrossProfitCalculator() {
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
  const [grossSales, setGrossSales] = useState('100000');
  const [salesReturns, setSalesReturns] = useState('5000');

  const [directMaterials, setDirectMaterials] = useState('30000');
  const [directLabor, setDirectLabor] = useState('15000');
  const [manufacturingOverhead, setManufacturingOverhead] = useState('10000');

  // Results
  const [results, setResults] = useState<{
    netSales: number;
    totalCogs: number;
    grossProfit: number;
    grossMargin: number;
    markup: number;
  } | null>(null);

  const [error, setError] = useState('');

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);

  const calculate = useCallback(() => {
    setError('');

    const gs = Number(grossSales);
    const sr = Number(salesReturns);
    const dm = Number(directMaterials);
    const dl = Number(directLabor);
    const mo = Number(manufacturingOverhead);

    if (isNaN(gs) || isNaN(sr) || isNaN(dm) || isNaN(dl) || isNaN(mo)) {
      setError('Please enter valid numeric values.');
      return setResults(null);
    }

    if (gs < 0 || sr < 0 || dm < 0 || dl < 0 || mo < 0) {
      setError('Values cannot be negative.');
      return setResults(null);
    }

    if (sr > gs) {
      setError('Sales returns cannot exceed gross sales.');
      return setResults(null);
    }

    const inr = (val: number) => convertToINR(val, selectedInputCurrency);

    const netSalesINR = inr(gs - sr);
    const totalCogsINR = inr(dm + dl + mo);
    const grossProfitINR = netSalesINR - totalCogsINR;
    
    const grossMargin = netSalesINR > 0 ? (grossProfitINR / netSalesINR) * 100 : 0;
    const markup = totalCogsINR > 0 ? (grossProfitINR / totalCogsINR) * 100 : 0;

    setResults({
      netSales: netSalesINR,
      totalCogs: totalCogsINR,
      grossProfit: grossProfitINR,
      grossMargin: grossMargin,
      markup: markup
    });
  }, [grossSales, salesReturns, directMaterials, directLabor, manufacturingOverhead, selectedInputCurrency, convertToINR]);

  useEffect(() => {
    calculate();
  }, [calculate, lastUpdatedTime]);

  const handleReset = () => {
    setGrossSales('100000');
    setSalesReturns('5000');
    setDirectMaterials('30000');
    setDirectLabor('15000');
    setManufacturingOverhead('10000');
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
    if (results.grossProfit < 0) return { text: "You are operating at a gross loss. COGS exceeds revenue.", type: "warning" };
    if (results.grossMargin > 60) return { text: "Excellent gross margin. Your direct costs are well managed.", type: "success" };
    if (results.grossMargin >= 30) return { text: "Healthy gross margin.", type: "info" };
    return { text: "Low gross margin. Analyze direct costs or consider price increases.", type: "warning" };
  };

  const insight = getInsight();
  const insightStyle = {
    warning: 'bg-red-500/10 border-red-500/30 text-red-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
  };
  const InsightIcon = insight ? { warning: AlertTriangle, success: CheckCircle, info: Info }[insight.type as keyof typeof insightStyle] : Info;

  const barData = results ? [
    { name: 'Net Sales', value: convertFromINR(results.netSales, selectedResultCurrency) },
    { name: 'COGS', value: convertFromINR(results.totalCogs, selectedResultCurrency) },
    { name: 'Gross Profit', value: convertFromINR(results.grossProfit, selectedResultCurrency) }
  ] : [];

  const pieData = results ? [
    { name: 'Material Cost', value: convertFromINR(convertToINR(Number(directMaterials), selectedInputCurrency), selectedResultCurrency) },
    { name: 'Labor Cost', value: convertFromINR(convertToINR(Number(directLabor), selectedInputCurrency), selectedResultCurrency) },
    { name: 'Overhead', value: convertFromINR(convertToINR(Number(manufacturingOverhead), selectedInputCurrency), selectedResultCurrency) }
  ] : [];

  const PIE_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-slate-200 dark:to-slate-900 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium mb-4">
          <TrendingUp className="w-4 h-4" />
          Financial Metrics
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
          Gross Profit <span className="text-blue-400">Calculator</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Determine your gross profit, margin, and markup by analyzing direct costs.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT — INPUTS */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Revenue & COGS</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Enter sales and direct production costs</p>
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
              <Banknote className="w-4 h-4"/> Revenue
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-1">Gross Sales</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={grossSales} onChange={e => setGrossSales(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-1">Sales Returns & Discounts</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={salesReturns} onChange={e => setSalesReturns(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 dark:border-white/10 pb-2">
              <MinusCircle className="w-4 h-4"/> Cost of Goods Sold (COGS)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-1">Direct Materials</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={directMaterials} onChange={e => setDirectMaterials(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-1">Direct Labor</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={directLabor} onChange={e => setDirectLabor(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-1">Manufacturing Overhead</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={manufacturingOverhead} onChange={e => setManufacturingOverhead(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold" />
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
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Profitability Analysis</h2>
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
                <div className={`border rounded-2xl p-5 mb-5 text-center ${results.grossProfit >= 0 ? 'bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border-emerald-500/30' : 'bg-gradient-to-r from-red-600/10 to-rose-600/10 border-red-500/30'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${results.grossProfit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    Gross {results.grossProfit >= 0 ? 'Profit' : 'Loss'}
                  </p>
                  <p className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                    {results.grossProfit < 0 ? '-' : ''}{disp(results.grossProfit)}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="bg-gray-100 dark:bg-gray-100 dark:bg-black/20 rounded-full px-3 py-1 text-xs border border-gray-100 dark:border-gray-100 dark:border-white/5">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold mr-1">Margin:</span>
                      <span className={results.grossMargin > 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                        {results.grossMargin.toFixed(2)}%
                      </span>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-100 dark:bg-black/20 rounded-full px-3 py-1 text-xs border border-gray-100 dark:border-gray-100 dark:border-white/5">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold mr-1">Markup:</span>
                      <span className={results.markup > 0 ? "text-blue-400 font-bold" : "text-red-400 font-bold"}>
                        {results.markup.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl border bg-gray-50 dark:bg-white dark:bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-gray-100 dark:border-white/5 p-4 flex flex-col gap-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Net Sales</div>
                    <p className="font-bold text-lg text-slate-900 dark:text-white">{disp(results.netSales)}</p>
                  </div>
                  <div className="rounded-xl border bg-gray-50 dark:bg-white dark:bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-gray-100 dark:border-white/5 p-4 flex flex-col gap-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-red-400">Total COGS</div>
                    <p className="font-bold text-lg text-slate-900 dark:text-white">{disp(results.totalCogs)}</p>
                  </div>
                </div>

                <div className="border border-gray-100 dark:border-gray-100 dark:border-white/5 rounded-xl overflow-hidden mb-5">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                      <tr>
                        <th className="px-4 py-2.5">Category</th>
                        <th className="px-4 py-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-100 dark:divide-white/5 text-slate-700 dark:text-slate-300 text-sm">
                      <tr className="hover:bg-white/5">
                        <td className="px-4 py-2.5 text-emerald-200">Net Sales</td>
                        <td className="px-4 py-2.5 text-right font-medium text-emerald-200">{disp(results.netSales)}</td>
                      </tr>
                      <tr className="hover:bg-white/5">
                        <td className="px-4 py-2.5 text-red-200">Total COGS</td>
                        <td className="px-4 py-2.5 text-right font-medium text-red-200">-{disp(results.totalCogs)}</td>
                      </tr>
                      <tr className="font-bold bg-white dark:bg-white/5">
                        <td className="px-4 py-3 text-slate-900 dark:text-white">Gross Profit</td>
                        <td className="px-4 py-3 text-right text-slate-900 dark:text-white">{results.grossProfit < 0 ? '-' : ''}{disp(results.grossProfit)}</td>
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
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3 bg-gray-50 dark:bg-gray-50 dark:bg-slate-900/40 rounded-xl border border-gray-100 dark:border-gray-100 dark:border-white/5 flex-1">
                <TrendingUp className="w-10 h-10 opacity-30" />
                <p className="text-sm">Input sales and COGS data to analyze.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CHARTS SECTION */}
      {results && (
        <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6">Revenue vs Cost</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value >= 1000 ? (value/1000).toFixed(0)+'k' : value}`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                    formatter={(value: number) => [`${currSym}${value.toLocaleString()}`, 'Amount']}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : (index === 1 ? '#ef4444' : '#3b82f6')} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6 flex flex-col">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">COGS Composition</h3>
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
