'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  RotateCcw,
  Scale,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowUpCircle,
  ArrowDownCircle,
  PieChart as PieChartIcon
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

interface FinItem {
  id: string;
  name: string;
  amount: string;
}

export default function WorkingCapitalCalculator() {
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
  const [assets, setAssets] = useState<FinItem[]>([
    { id: 'a1', name: 'Cash', amount: '50000' },
    { id: 'a2', name: 'Accounts Receivable', amount: '35000' },
    { id: 'a3', name: 'Inventory', amount: '40000' },
    { id: 'a4', name: 'Short-term Investments', amount: '15000' },
  ]);

  const [liabilities, setLiabilities] = useState<FinItem[]>([
    { id: 'l1', name: 'Accounts Payable', amount: '25000' },
    { id: 'l2', name: 'Short-term Loans', amount: '20000' },
    { id: 'l3', name: 'Outstanding Expenses', amount: '10000' },
    { id: 'l4', name: 'Taxes Payable', amount: '5000' },
  ]);

  // Results
  const [results, setResults] = useState<{
    totalAssets: number;
    totalLiabilities: number;
    workingCapital: number;
    currentRatio: number;
  } | null>(null);

  const [error, setError] = useState('');

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);

  const addAsset = () => setAssets([...assets, { id: Date.now().toString(), name: 'New Asset', amount: '' }]);
  const removeAsset = (id: string) => {
    if (assets.length > 1) setAssets(assets.filter(a => a.id !== id));
  };
  const updateAsset = (id: string, field: keyof FinItem, value: string) => {
    setAssets(assets.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const addLiability = () => setLiabilities([...liabilities, { id: Date.now().toString(), name: 'New Liability', amount: '' }]);
  const removeLiability = (id: string) => {
    if (liabilities.length > 1) setLiabilities(liabilities.filter(l => l.id !== id));
  };
  const updateLiability = (id: string, field: keyof FinItem, value: string) => {
    setLiabilities(liabilities.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const calculate = useCallback(() => {
    setError('');

    let tAssetsINR = 0;
    let hasError = false;
    for (const a of assets) {
      const v = Number(a.amount);
      if (isNaN(v) || v < 0) hasError = true;
      else tAssetsINR += convertToINR(v, selectedInputCurrency);
    }

    let tLiabilitiesINR = 0;
    for (const l of liabilities) {
      const v = Number(l.amount);
      if (isNaN(v) || v < 0) hasError = true;
      else tLiabilitiesINR += convertToINR(v, selectedInputCurrency);
    }

    if (hasError) {
      setError('Please enter valid positive amounts for all assets and liabilities.');
      return setResults(null);
    }

    const workingCapitalINR = tAssetsINR - tLiabilitiesINR;
    const currentRatio = tLiabilitiesINR > 0 ? (tAssetsINR / tLiabilitiesINR) : 0;

    setResults({
      totalAssets: tAssetsINR,
      totalLiabilities: tLiabilitiesINR,
      workingCapital: workingCapitalINR,
      currentRatio
    });
  }, [assets, liabilities, selectedInputCurrency, convertToINR]);

  useEffect(() => {
    calculate();
  }, [calculate, lastUpdatedTime]);

  const handleReset = () => {
    setAssets([
      { id: 'a1', name: 'Cash', amount: '50000' },
      { id: 'a2', name: 'Accounts Receivable', amount: '35000' },
      { id: 'a3', name: 'Inventory', amount: '40000' },
      { id: 'a4', name: 'Short-term Investments', amount: '15000' },
    ]);
    setLiabilities([
      { id: 'l1', name: 'Accounts Payable', amount: '25000' },
      { id: 'l2', name: 'Short-term Loans', amount: '20000' },
      { id: 'l3', name: 'Outstanding Expenses', amount: '10000' },
      { id: 'l4', name: 'Taxes Payable', amount: '5000' },
    ]);
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
    if (results.currentRatio > 2) return { text: "Very strong liquidity position. You have ample assets to cover liabilities.", type: "success" };
    if (results.currentRatio >= 1.2) return { text: "Healthy liquidity position.", type: "info" };
    if (results.currentRatio >= 1) return { text: "Adequate liquidity, but monitoring required.", type: "warning" };
    return { text: "Liquidity risk detected. Short-term obligations may be difficult to meet.", type: "warning" };
  };

  const insight = getInsight();
  const insightStyle = {
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    info: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
  };
  const InsightIcon = insight ? { warning: AlertTriangle, success: CheckCircle, info: Info }[insight.type as keyof typeof insightStyle] : Info;

  const barData = assets.map(a => ({
    name: a.name,
    value: convertFromINR(convertToINR(Number(a.amount) || 0, selectedInputCurrency), selectedResultCurrency)
  })).sort((a, b) => b.value - a.value);

  const pieData = results ? [
    { name: 'Current Assets', value: convertFromINR(results.totalAssets, selectedResultCurrency) },
    { name: 'Current Liabilities', value: convertFromINR(results.totalLiabilities, selectedResultCurrency) }
  ] : [];

  const PIE_COLORS = ['#10b981', '#ef4444'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-indigo-100 dark:to-indigo-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-4">
          <Scale className="w-4 h-4" />
          Accounting
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-900 dark:text-white tracking-tight mb-2">
          Working Capital <span className="text-indigo-400">Calculator</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-lg">
          Analyze business liquidity by calculating your working capital and current ratio.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT — INPUTS */}
        <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">Assets & Liabilities</h2>
              <p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">Enter short-term financial details</p>
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
              className="w-full px-4 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            >
              {availableCurrencies.map(c => (
                <option key={c} value={c} className="bg-white dark:bg-slate-800">{c} ({getCurrencySymbol(c)})</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 dark:border-gray-200 dark:border-white/10 pb-2">
              <ArrowUpCircle className="w-4 h-4"/> Current Assets
            </h3>
            <div className="space-y-3">
              {assets.map((asset) => (
                <div key={asset.id} className="flex gap-3 items-center">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={asset.name}
                      onChange={e => updateAsset(asset.id, 'name', e.target.value)}
                      placeholder="Asset Name"
                      className="w-full px-3 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                    />
                  </div>
                  <div className="w-1/3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                      <input
                        type="number"
                        value={asset.amount}
                        onChange={e => updateAsset(asset.id, 'amount', e.target.value)}
                        placeholder="0"
                        min={0}
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
                      />
                    </div>
                  </div>
                  <button onClick={() => removeAsset(asset.id)} disabled={assets.length === 1} className="p-2.5 text-red-400/70 hover:text-red-400 bg-red-500/5 border border-red-500/10 rounded-xl hover:bg-red-500/20 disabled:opacity-50 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addAsset} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-colors text-sm font-semibold border border-emerald-500/20">
              <Plus className="w-4 h-4" /> Add Asset
            </button>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 dark:border-gray-200 dark:border-white/10 pb-2">
              <ArrowDownCircle className="w-4 h-4"/> Current Liabilities
            </h3>
            <div className="space-y-3">
              {liabilities.map((liability) => (
                <div key={liability.id} className="flex gap-3 items-center">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={liability.name}
                      onChange={e => updateLiability(liability.id, 'name', e.target.value)}
                      placeholder="Liability Name"
                      className="w-full px-3 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm"
                    />
                  </div>
                  <div className="w-1/3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                      <input
                        type="number"
                        value={liability.amount}
                        onChange={e => updateLiability(liability.id, 'amount', e.target.value)}
                        placeholder="0"
                        min={0}
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-semibold"
                      />
                    </div>
                  </div>
                  <button onClick={() => removeLiability(liability.id)} disabled={liabilities.length === 1} className="p-2.5 text-red-400/70 hover:text-red-400 bg-red-500/5 border border-red-500/10 rounded-xl hover:bg-red-500/20 disabled:opacity-50 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addLiability} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors text-sm font-semibold border border-red-500/20">
              <Plus className="w-4 h-4" /> Add Liability
            </button>
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
          <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">Working Capital Analysis</h2>
                <p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">Updated: <span className="text-indigo-300">{relTime}</span></p>
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
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Display Currency</p>
              <div className="flex flex-wrap gap-2">
                {availableCurrencies.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedResultCurrency(c as never)}
                    className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${
                      selectedResultCurrency === c
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-white dark:bg-white dark:bg-white/5 border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-600 dark:text-slate-400 hover:border-indigo-400 hover:text-slate-800 dark:text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {results ? (
              <>
                <div className={`border rounded-2xl p-5 mb-5 text-center ${results.workingCapital >= 0 ? 'bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border-emerald-500/30' : 'bg-gradient-to-r from-red-600/10 to-rose-600/10 border-red-500/30'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${results.workingCapital >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    Net Working Capital
                  </p>
                  <p className="text-5xl font-extrabold text-slate-900 dark:text-slate-900 dark:text-white tracking-tight mb-2">
                    {results.workingCapital < 0 ? '-' : ''}{disp(Math.abs(results.workingCapital))}
                  </p>
                  <div className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-100 dark:bg-black/20 rounded-full px-3 py-1 text-sm border border-gray-100 dark:border-gray-100 dark:border-white/5">
                    <span className="text-slate-700 dark:text-slate-700 dark:text-slate-300 font-semibold mr-2">Current Ratio:</span>
                    <span className={results.currentRatio >= 1 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                      {results.currentRatio.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl border bg-emerald-900/10 border-emerald-500/20 p-4 flex flex-col gap-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1">Total Assets</div>
                    <p className="font-bold text-lg text-emerald-100">{disp(results.totalAssets)}</p>
                  </div>
                  <div className="rounded-xl border bg-red-900/10 border-red-500/20 p-4 flex flex-col gap-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-red-400 flex items-center gap-1">Total Liabilities</div>
                    <p className="font-bold text-lg text-red-100">{disp(results.totalLiabilities)}</p>
                  </div>
                </div>

                <div className="border border-gray-100 dark:border-gray-100 dark:border-white/5 rounded-xl overflow-hidden mb-5">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-white dark:bg-white/5 text-slate-600 dark:text-slate-600 dark:text-slate-400 font-semibold text-xs">
                      <tr>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-100 dark:divide-white/5 text-slate-700 dark:text-slate-700 dark:text-slate-300 text-sm">
                      <tr className="hover:bg-white dark:bg-white dark:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-emerald-200">Current Assets</td>
                        <td className="px-4 py-3 text-right text-emerald-200">{disp(results.totalAssets)}</td>
                      </tr>
                      <tr className="hover:bg-white dark:bg-white dark:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-red-200">Current Liabilities</td>
                        <td className="px-4 py-3 text-right text-red-200">-{disp(results.totalLiabilities)}</td>
                      </tr>
                      <tr className={`font-bold ${results.workingCapital >= 0 ? 'bg-emerald-900/20 text-emerald-300' : 'bg-red-900/20 text-red-300'}`}>
                        <td className="px-4 py-3">Working Capital</td>
                        <td className="px-4 py-3 text-right">{results.workingCapital < 0 ? '-' : ''}{disp(Math.abs(results.workingCapital))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {insight && (
                  <div className={`flex items-start gap-3 px-4 py-3 rounded-2xl border-l-4 ${insightStyle[insight.type as keyof typeof insightStyle]}`}>
                    <InsightIcon className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-xs">Insight</p>
                      <p className="text-xs mt-0.5 opacity-90">{insight.text}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3 bg-gray-50 dark:bg-gray-50 dark:bg-slate-900/40 rounded-xl border border-gray-100 dark:border-gray-100 dark:border-white/5">
                <PieChartIcon className="w-10 h-10 opacity-30" />
                <p className="text-sm">Add assets and liabilities to calculate.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CHARTS SECTION */}
      {results && (
        <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-900 dark:text-white mb-6">Asset Composition</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value >= 1000 ? (value/1000).toFixed(0)+'k' : value}`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                    formatter={(value: number) => [`${currSym}${value.toLocaleString()}`, 'Amount']}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6 flex flex-col">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-900 dark:text-white mb-2">Assets vs Liabilities</h3>
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
                    formatter={(value: number) => [`${currSym}${value.toLocaleString(undefined, {maximumFractionDigits: 2})}`, 'Total']}
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
