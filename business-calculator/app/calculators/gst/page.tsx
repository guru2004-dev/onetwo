'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  RotateCcw,
  Receipt,
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

export default function GSTCalculator() {
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
  const [amount, setAmount] = useState('10000');
  const [gstRate, setGstRate] = useState('18');
  const [calculationType, setCalculationType] = useState('exclusive');

  // Results
  const [results, setResults] = useState<{
    originalAmount: number;
    gstAmount: number;
    totalAmount: number;
    cgst: number;
    sgst: number;
  } | null>(null);

  const [error, setError] = useState('');

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);

  const calculate = useCallback(() => {
    setError('');

    const amt = Number(amount);
    let rate = Number(gstRate);

    if (isNaN(amt) || amt < 0) {
      setError('Amount must be zero or positive.');
      return setResults(null);
    }
    if (isNaN(rate) || rate < 0) {
      setError('GST rate must be zero or positive.');
      return setResults(null);
    }

    const inr = (val: number) => convertToINR(val, selectedInputCurrency);
    const amtINR = inr(amt);

    let originalAmount = 0;
    let gstAmount = 0;
    let totalAmount = 0;

    if (calculationType === 'inclusive') {
      originalAmount = amtINR / (1 + rate / 100);
      gstAmount = amtINR - originalAmount;
      totalAmount = amtINR;
    } else {
      originalAmount = amtINR;
      gstAmount = amtINR * (rate / 100);
      totalAmount = amtINR + gstAmount;
    }

    setResults({
      originalAmount,
      gstAmount,
      totalAmount,
      cgst: gstAmount / 2,
      sgst: gstAmount / 2
    });

  }, [amount, gstRate, calculationType, selectedInputCurrency, convertToINR]);

  useEffect(() => {
    calculate();
  }, [calculate, lastUpdatedTime]);

  const handleReset = () => {
    setAmount('10000');
    setGstRate('18');
    setCalculationType('exclusive');
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


  const barData = results ? [
    { name: 'Base', value: convertFromINR(results.originalAmount, selectedResultCurrency) },
    { name: 'Tax', value: convertFromINR(results.gstAmount, selectedResultCurrency) },
    { name: 'Total', value: convertFromINR(results.totalAmount, selectedResultCurrency) },
  ] : [];

  const pieData = results && results.gstAmount > 0 ? [
    { name: 'Base Amount', value: convertFromINR(results.originalAmount, selectedResultCurrency) },
    { name: 'CGST', value: convertFromINR(results.cgst, selectedResultCurrency) },
    { name: 'SGST', value: convertFromINR(results.sgst, selectedResultCurrency) }
  ] : results ? [
    { name: 'Base Amount', value: convertFromINR(results.originalAmount, selectedResultCurrency) }
  ] : [];

  const PIE_COLORS = ['#3b82f6', '#f59e0b', '#ec4899'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-indigo-100 dark:to-indigo-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm font-medium mb-4">
          <Receipt className="w-4 h-4" />
          Tax Assessment
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
          GST <span className="text-violet-400">Calculator</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Calculate the Goods and Services Tax (GST) inclusive and exclusive amounts.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT — INPUTS */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Invoice Details</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Define tax structure</p>
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
              className="w-full px-4 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all outline-none"
            >
              {availableCurrencies.map(c => (
                <option key={c} value={c} className="bg-white dark:bg-slate-800">{c} ({getCurrencySymbol(c)})</option>
              ))}
            </select>
          </div>

          <div className="space-y-4 pt-2">
            
            <div>
               <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-1">Calculation Type</label>
               <select
                  value={calculationType}
                  onChange={e => setCalculationType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all outline-none"
                >
                  <option value="exclusive">Add GST (Exclusive)</option>
                  <option value="inclusive">Remove GST (Inclusive)</option>
                </select>
            </div>

            <div>
              <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-1">{calculationType === 'exclusive' ? 'Base Amount (Excluding Tax)' : 'Total Amount (Including Tax)'}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                <input type="number" min={0} value={amount} onChange={e => setAmount(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all font-semibold" />
              </div>
            </div>

            <div>
              <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-1">GST Rate Bracket (%)</label>
              <select
                  value={gstRate}
                  onChange={e => setGstRate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all outline-none"
                >
                  <option value="0">0% — Essential</option>
                  <option value="5">5% — Necessities</option>
                  <option value="12">12% — Standard</option>
                  <option value="18">18% — Standard (Most Items)</option>
                  <option value="28">28% — Luxury</option>
                  <option value="custom">Custom Rate</option>
              </select>
            </div>
            
            {gstRate === 'custom' && (
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-1">Custom GST Rate (%)</label>
                <div className="relative">
                  <input type="number" min={0} value={gstRate} onChange={e => setGstRate(e.target.value)} className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all font-semibold" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                </div>
              </div>
            )}
            
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
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tax Summary</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Updated: <span className="text-violet-300">{relTime}</span></p>
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
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Display Currency</p>
              <div className="flex flex-wrap gap-2">
                {availableCurrencies.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedResultCurrency(c as never)}
                    className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${
                      selectedResultCurrency === c
                        ? 'bg-violet-600 border-violet-500 text-white'
                        : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-violet-400 hover:text-slate-800 dark:text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {results ? (
              <div className="flex flex-col flex-1">
                <div className="border rounded-2xl p-5 mb-5 text-center bg-gradient-to-r from-violet-600/10 to-purple-600/10 border-violet-500/30">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-violet-300">
                    Grand Total (With GST)
                  </p>
                  <p className="text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                    {disp(results.totalAmount)}
                  </p>
                  <div className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-100 dark:bg-black/20 rounded-full px-4 py-1 text-sm border border-gray-100 dark:border-gray-100 dark:border-white/5 mt-2">
                    <span className="text-slate-700 dark:text-slate-300 font-semibold mr-2">Tax Component:</span>
                    <span className="text-amber-400 font-bold">
                      {disp(results.gstAmount)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl border bg-gray-50 dark:bg-white dark:bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-gray-100 dark:border-white/5 p-4 flex flex-col gap-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-blue-400 to-indigo-500" />
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Base Pre-Tax Amount</div>
                    <p className="font-bold text-lg text-blue-300">{disp(results.originalAmount)}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                     <div className="rounded-xl border bg-gray-50 dark:bg-white dark:bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-gray-100 dark:border-white/5 p-2 flex justify-between items-center relative overflow-hidden">
                       <div className="absolute top-0 right-0 h-full w-1 bg-amber-500" />
                       <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 pl-2">CGST {(Number(gstRate || 0)/2)}%</div>
                       <p className="font-bold text-sm text-slate-900 dark:text-white pr-2">{disp(results.cgst)}</p>
                     </div>
                     <div className="rounded-xl border bg-gray-50 dark:bg-white dark:bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-gray-100 dark:border-white/5 p-2 flex justify-between items-center relative overflow-hidden">
                       <div className="absolute top-0 right-0 h-full w-1 bg-pink-500" />
                       <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 pl-2">SGST {(Number(gstRate || 0)/2)}%</div>
                       <p className="font-bold text-sm text-slate-900 dark:text-white pr-2">{disp(results.sgst)}</p>
                     </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3 bg-gray-50 dark:bg-gray-50 dark:bg-slate-900/40 rounded-xl border border-gray-100 dark:border-gray-100 dark:border-white/5 flex-1">
                <Receipt className="w-10 h-10 opacity-30" />
                <p className="text-sm">Input data to resolve tax liabilities.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CHARTS SECTION */}
      {results && (
        <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6">Price Composition</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value >= 1000 ? (value/1000).toFixed(0)+'k' : value}`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '13px' }}
                    formatter={(value: number) => [`${currSym}${value.toLocaleString(undefined, {maximumFractionDigits:0})}`, 'Value']}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                     {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : index === 1 ? '#f59e0b' : '#a855f7'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6 flex flex-col">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Invoice Split</h3>
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
