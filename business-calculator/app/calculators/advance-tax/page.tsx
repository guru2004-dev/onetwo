'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  RotateCcw,
  CalendarDays,
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

export default function AdvanceTaxCalculator() {
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
  const [estimatedTax, setEstimatedTax] = useState('150000');
  const [tdsDeducted, setTdsDeducted] = useState('40000');
  const [tcsCollected, setTcsCollected] = useState('0');

  // Results
  const [results, setResults] = useState<{
    totalLiability: number;
    totalDeducted: number;
    advanceTaxPayable: number;
    requiresAdvanceTax: boolean;
    installments: { date: string, percentStr: string, cumulative: number, payable: number }[];
  } | null>(null);

  const [error, setError] = useState('');

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);

  const calculate = useCallback(() => {
    setError('');

    const estTx = Number(estimatedTax);
    const tds = Number(tdsDeducted) || 0;
    const tcs = Number(tcsCollected) || 0;

    if (isNaN(estTx) || estTx < 0) {
      setError('Please enter a valid estimated tax liability (≥ 0).');
      return setResults(null);
    }
    if (tds < 0 || tcs < 0) {
      setError('TDS and TCS cannot be negative.');
      return setResults(null);
    }

    const inr = (val: number) => convertToINR(val, selectedInputCurrency);

    const estTxINR = inr(estTx);
    const tdsINR = inr(tds);
    const tcsINR = inr(tcs);

    const totalDeductedINR = tdsINR + tcsINR;
    const advanceTaxPayableINR = Math.max(0, estTxINR - totalDeductedINR);

    // Standard rule: if advance tax is >= 10,000 INR (or roughly equivalent based on generic rule), it must be paid.
    // We will use 10000 INR threshold inside the context, then convert back. 
    // Since currency is arbitrary, we use 10,000 fixed inside INR context.
    const requiresAdvanceTax = advanceTaxPayableINR >= 10000;

    const installments = [];
    if (requiresAdvanceTax) {
      installments.push({ date: 'On or before 15 Jun', percentStr: '15%', cumulative: advanceTaxPayableINR * 0.15, payable: advanceTaxPayableINR * 0.15 });
      installments.push({ date: 'On or before 15 Sep', percentStr: '45%', cumulative: advanceTaxPayableINR * 0.45, payable: advanceTaxPayableINR * 0.30 });
      installments.push({ date: 'On or before 15 Dec', percentStr: '75%', cumulative: advanceTaxPayableINR * 0.75, payable: advanceTaxPayableINR * 0.30 });
      installments.push({ date: 'On or before 15 Mar', percentStr: '100%', cumulative: advanceTaxPayableINR * 1.00, payable: advanceTaxPayableINR * 0.25 });
    }

    setResults({
      totalLiability: estTxINR,
      totalDeducted: totalDeductedINR,
      advanceTaxPayable: advanceTaxPayableINR,
      requiresAdvanceTax,
      installments
    });
  }, [estimatedTax, tdsDeducted, tcsCollected, selectedInputCurrency, convertToINR]);

  useEffect(() => {
    calculate();
  }, [calculate, lastUpdatedTime]);

  const handleReset = () => {
    setEstimatedTax('150000');
    setTdsDeducted('40000');
    setTcsCollected('0');
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
    if (!results.requiresAdvanceTax) return { text: "Advance tax liability is below the threshold. You can pay tax directly during final filing.", type: "success" };
    return { text: "You must pay advance tax in 4 quarterly installments to avoid late payment interest under Sections 234B and 234C.", type: "warning" };
  };

  const insight = getInsight();
  const insightStyle = {
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    info: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
  };
  const InsightIcon = insight ? { warning: AlertTriangle, success: CheckCircle, info: Info }[insight.type as keyof typeof insightStyle] : Info;

  const barData = results?.installments.map((inst, idx) => ({
    name: `Q${idx + 1}`,
    value: convertFromINR(inst.payable, selectedResultCurrency),
    date: inst.date
  })) || [];

  const pieData = results ? [
    { name: 'TDS/TCS (Already Paid)', value: convertFromINR(results.totalDeducted, selectedResultCurrency) },
    { name: 'Advance Tax Due', value: convertFromINR(results.advanceTaxPayable, selectedResultCurrency) }
  ] : [];

  const PIE_COLORS = ['#3b82f6', '#f59e0b'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-indigo-100 dark:to-indigo-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-medium mb-4">
          <CalendarDays className="w-4 h-4" />
          Tax Compliance
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-900 dark:text-white tracking-tight mb-2">
          Advance Tax <span className="text-amber-400">Calculator</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-lg">
          Determine your advance tax installments and ensure compliance across the fiscal year.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT — INPUTS */}
        <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">Tax Estimation</h2>
              <p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">Enter expected tax bounds</p>
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
              className="w-full px-4 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all outline-none"
            >
              {availableCurrencies.map(c => (
                <option key={c} value={c} className="bg-white dark:bg-slate-800">{c} ({getCurrencySymbol(c)})</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 dark:border-gray-200 dark:border-white/10 pb-2">
              <Banknote className="w-4 h-4"/> Estimated Base
            </h3>
            <div>
              <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">Total Estimated Tax Liability (Yearly)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                <input type="number" min={0} value={estimatedTax} onChange={e => setEstimatedTax(e.target.value)} className="w-full pl-8 pr-3 py-3 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-semibold text-lg" />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 dark:border-gray-200 dark:border-white/10 pb-2">
              <MinusCircle className="w-4 h-4"/> Existing Credits
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">TDS Deducted (Est.)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={tdsDeducted} onChange={e => setTdsDeducted(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-semibold" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">TCS Collected</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={tcsCollected} onChange={e => setTcsCollected(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-semibold" />
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
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">Payment Schedule</h2>
                <p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">Updated: <span className="text-amber-300">{relTime}</span></p>
              </div>
              <button
                onClick={() => updateCurrencyRates()}
                disabled={ratesLoading}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
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
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-white dark:bg-white dark:bg-white/5 border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-600 dark:text-slate-400 hover:border-amber-400 hover:text-slate-800 dark:text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {results ? (
              <div className="flex flex-col flex-1">
                <div className={`border rounded-2xl p-5 mb-5 text-center ${results.requiresAdvanceTax ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30' : 'bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border-emerald-500/30'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${results.requiresAdvanceTax ? 'text-amber-300' : 'text-emerald-300'}`}>
                    Net Advance Tax Payable
                  </p>
                  <p className="text-5xl font-extrabold text-slate-900 dark:text-slate-900 dark:text-white tracking-tight mb-2">
                    {disp(results.advanceTaxPayable)}
                  </p>
                  <div className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-100 dark:bg-black/20 rounded-full px-4 py-1 text-sm border border-gray-100 dark:border-gray-100 dark:border-white/5">
                    <span className="text-slate-700 dark:text-slate-700 dark:text-slate-300 font-semibold mr-2">TDS/TCS Credits:</span>
                    <span className="text-blue-400 font-bold">
                      {disp(results.totalDeducted)}
                    </span>
                  </div>
                </div>

                {!results.requiresAdvanceTax ? (
                  <div className="flex flex-col items-center justify-center py-8 text-emerald-400 gap-3 bg-emerald-900/10 rounded-xl border border-emerald-500/20 mb-5">
                    <CheckCircle className="w-8 h-8 opacity-80" />
                    <p className="text-sm px-6 text-center">Liability is below the minimum threshold. No quarterly advance tax installments are required.</p>
                  </div>
                ) : (
                  <div className="border border-gray-100 dark:border-gray-100 dark:border-white/5 rounded-xl overflow-hidden mb-5">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 dark:bg-white dark:bg-white/5 text-slate-600 dark:text-slate-600 dark:text-slate-400 font-semibold text-xs border-b border-gray-200 dark:border-gray-200 dark:border-white/10">
                        <tr>
                          <th className="px-4 py-2.5">Due Date (Rules)</th>
                          <th className="px-4 py-2.5 text-center">Share</th>
                          <th className="px-4 py-2.5 text-right bg-white dark:bg-white dark:bg-white/5">Installment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-100 dark:divide-white/5 text-slate-700 dark:text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                        {results.installments.map((inst, i) => (
                          <tr key={i} className="hover:bg-white dark:bg-white dark:bg-white/5 transition-colors">
                            <td className="px-4 py-3 text-slate-800 dark:text-slate-800 dark:text-slate-200">
                              <div className="font-semibold">{inst.date}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">Cumulative: {inst.percentStr}</div>
                            </td>
                            <td className="px-4 py-3 text-center font-medium text-amber-200">
                              {i === 0 ? '15%' : (i === 3 ? '25%' : '30%')}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-orange-300 bg-white dark:bg-white dark:bg-white/5">
                              {disp(inst.payable)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

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
                <CalendarDays className="w-10 h-10 opacity-30" />
                <p className="text-sm">Input tax metrics to predict advance installments.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CHARTS SECTION */}
      {results && results.requiresAdvanceTax && (
        <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-900 dark:text-white mb-6">Installment Schedule</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value >= 1000 ? (value/1000).toFixed(0)+'k' : value}`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '13px' }}
                    labelFormatter={(label) => {
                      const found = barData.find(d => d.name === label);
                      return found ? `${label} (${found.date})` : label;
                    }}
                    formatter={(value: number) => [`${currSym}${value.toLocaleString()}`, 'Amount Due']}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={'#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6 flex flex-col">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-900 dark:text-white mb-2">Total Tax Liability Split</h3>
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
