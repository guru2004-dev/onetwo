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

export default function IncomeTaxCalculator() {
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
  const [grossIncome, setGrossIncome] = useState('1200000');
  const [standardDeduction, setStandardDeduction] = useState('50000');
  const [otherDeductions, setOtherDeductions] = useState('150000');

  // Results
  const [results, setResults] = useState<{
    grossIncome: number;
    totalDeductions: number;
    taxableIncome: number;
    taxLiability: number;
    effectiveTaxRate: number;
    takeHome: number;
    slabBreakdown: { limit: string, rate: string, taxForSlab: number }[];
  } | null>(null);

  const [error, setError] = useState('');

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);

  const calculate = useCallback(() => {
    setError('');

    const gi = Number(grossIncome);
    const sd = Number(standardDeduction) || 0;
    const od = Number(otherDeductions) || 0;

    if (isNaN(gi) || gi < 0) {
      setError('Please enter a valid gross income (≥ 0).');
      return setResults(null);
    }
    if (sd < 0 || od < 0) {
      setError('Deductions cannot be negative.');
      return setResults(null);
    }

    const totalDeductionsRaw = sd + od;
    const taxableIncomeRaw = Math.max(0, gi - totalDeductionsRaw);

    // Calculate tax using standardized generic slabs (using raw inputs before currency conversion for relative math, 
    // but tax structures are usually bound to local currency. To make it universally "play", we treat inputs as the base).
    // Let's use a standard progressive tax scale mimicking generic global scales.
    // 0 - 300,000 : 0%
    // 300,001 - 600,000 : 5%
    // 600,001 - 900,000 : 10%
    // 900,001 - 1,200,000 : 15%
    // 1,200,001 - 1,500,000 : 20%
    // > 1,500,000 : 30%
    
    let taxRaw = 0;
    let remainingIncome = taxableIncomeRaw;
    const slabBreakdown: { limit: string, rate: string, taxForSlab: number }[] = [];

    const slabs = [
      { limit: 300000, rate: 0, label: 'Up to 3L' },
      { limit: 300000, rate: 0.05, label: '3L - 6L' },
      { limit: 300000, rate: 0.10, label: '6L - 9L' },
      { limit: 300000, rate: 0.15, label: '9L - 12L' },
      { limit: 300000, rate: 0.20, label: '12L - 15L' },
      { limit: Infinity, rate: 0.30, label: 'Above 15L' },
    ];

    for (const slab of slabs) {
      if (remainingIncome <= 0) break;
      const amountInSlab = Math.min(remainingIncome, slab.limit);
      const taxForSlab = amountInSlab * slab.rate;
      taxRaw += taxForSlab;
      remainingIncome -= amountInSlab;

      if (taxForSlab > 0 || slab.rate === 0) {
        slabBreakdown.push({
          limit: slab.label,
          rate: `${(slab.rate * 100)}%`,
          taxForSlab: convertToINR(taxForSlab, selectedInputCurrency)
        });
      }
    }

    // Rebate under 87A (usually if taxable income <= 7L, tax is 0). Let's implement generic logic: if less than 700k, 0 tax.
    if (taxableIncomeRaw <= 700000) {
      taxRaw = 0;
      slabBreakdown.push({ limit: 'Rebate < 7L', rate: '-100%', taxForSlab: 0 });
    }

    const inr = (val: number) => convertToINR(val, selectedInputCurrency);

    const grossInr = inr(gi);
    const deductionsInr = inr(totalDeductionsRaw);
    const taxableInr = inr(taxableIncomeRaw);
    const taxInr = inr(taxRaw);
    const takeHomeInr = grossInr - taxInr;

    const effectiveRate = grossInr > 0 ? (taxInr / grossInr) * 100 : 0;

    setResults({
      grossIncome: grossInr,
      totalDeductions: deductionsInr,
      taxableIncome: taxableInr,
      taxLiability: taxInr,
      effectiveTaxRate: effectiveRate,
      takeHome: takeHomeInr,
      slabBreakdown
    });
  }, [grossIncome, standardDeduction, otherDeductions, selectedInputCurrency, convertToINR]);

  useEffect(() => {
    calculate();
  }, [calculate, lastUpdatedTime]);

  const handleReset = () => {
    setGrossIncome('1200000');
    setStandardDeduction('50000');
    setOtherDeductions('150000');
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
    if (results.taxLiability === 0) return { text: "No tax liability! Your income is fully exempt or within rebate limits.", type: "success" };
    if (results.effectiveTaxRate <= 10) return { text: "You are in a low effective tax bracket.", type: "info" };
    if (results.effectiveTaxRate > 20) return { text: "High tax burden. Consider maximizing tax-saving investments to reduce taxable income.", type: "warning" };
    return { text: "Moderate tax liability.", type: "info" };
  };

  const insight = getInsight();
  const insightStyle = {
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    info: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
  };
  const InsightIcon = insight ? { warning: AlertTriangle, success: CheckCircle, info: Info }[insight.type as keyof typeof insightStyle] : Info;

  const barData = results ? [
    { name: 'Gross Income', value: convertFromINR(results.grossIncome, selectedResultCurrency) },
    { name: 'Taxable Income', value: convertFromINR(results.taxableIncome, selectedResultCurrency) },
    { name: 'Take Home', value: convertFromINR(results.takeHome, selectedResultCurrency) }
  ] : [];

  const pieData = results ? [
    { name: 'Tax Liability', value: convertFromINR(results.taxLiability, selectedResultCurrency) },
    { name: 'Net Take-Home', value: convertFromINR(results.takeHome, selectedResultCurrency) }
  ] : [];

  const PIE_COLORS = ['#ef4444', '#10b981'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm font-medium mb-4">
          <Receipt className="w-4 h-4" />
          Tax Planning
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
          Income Tax <span className="text-violet-400">Calculator</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Estimate your tax liability, effective tax rate, and take-home pay via progressive slabs.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT — INPUTS */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Income Details</h2>
              <p className="text-slate-400 text-sm">Enter annual earnings & deductions</p>
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
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
              <Banknote className="w-4 h-4"/> Earnings
            </h3>
            <div>
              <label className="block text-[13px] text-slate-300 mb-1">Gross Annual Income</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                <input type="number" min={0} value={grossIncome} onChange={e => setGrossIncome(e.target.value)} className="w-full pl-8 pr-3 py-3 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all font-semibold text-lg" />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
              <MinusCircle className="w-4 h-4"/> Exemptions & Deductions
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Standard Deduction</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={standardDeduction} onChange={e => setStandardDeduction(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all font-semibold" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Other Deductions (80C, etc)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={otherDeductions} onChange={e => setOtherDeductions(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all font-semibold" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 bg-slate-900/40 border border-white/5 rounded-xl p-4 text-xs text-slate-400">
            * Uses a generalized progressive tax slab mapping up to 30% above 15L, along with rebate logic for incomes up to 7L, mimicking standardized New Regime norms.
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
                <h2 className="text-lg font-bold text-white">Tax Summary</h2>
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
                <div className={`border rounded-2xl p-5 mb-5 text-center ${results.taxLiability > 0 ? 'bg-gradient-to-r from-red-600/10 to-rose-600/10 border-red-500/30' : 'bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border-emerald-500/30'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${results.taxLiability > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                    Total Tax Liability
                  </p>
                  <p className="text-5xl font-extrabold text-white tracking-tight mb-2">
                    {disp(results.taxLiability)}
                  </p>
                  <div className="inline-flex items-center justify-center bg-black/20 rounded-full px-4 py-1 text-sm border border-white/5">
                    <span className="text-slate-300 font-semibold mr-2">Effective Tax Rate:</span>
                    <span className={results.effectiveTaxRate <= 10 ? "text-emerald-400 font-bold" : (results.effectiveTaxRate <= 25 ? "text-amber-400 font-bold" : "text-red-400 font-bold")}>
                      {results.effectiveTaxRate.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl border bg-slate-800/50 border-white/5 p-4 flex flex-col gap-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Taxable Income</div>
                    <p className="font-bold text-lg text-white">{disp(results.taxableIncome)}</p>
                  </div>
                  <div className="rounded-xl border bg-emerald-900/10 border-emerald-500/20 p-4 flex flex-col gap-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Net Take-Home Yield</div>
                    <p className="font-bold text-lg text-emerald-100">{disp(results.takeHome)}</p>
                  </div>
                </div>

                <div className="border border-white/5 rounded-xl overflow-hidden mb-5">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-slate-400 font-semibold text-xs border-b border-white/10">
                      <tr>
                        <th className="px-4 py-2.5">Slab Limit</th>
                        <th className="px-4 py-2.5 text-center">Rate</th>
                        <th className="px-4 py-2.5 text-right">Tax Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300 text-xs">
                      {results.slabBreakdown.map((slab, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-2.5 text-slate-200">{slab.limit}</td>
                          <td className="px-4 py-2.5 text-center font-medium text-amber-200">{slab.rate}</td>
                          <td className="px-4 py-2.5 text-right font-medium text-red-200">{slab.taxForSlab === 0 && slab.rate !== '-100%' ? 'Nil' : disp(slab.taxForSlab)}</td>
                        </tr>
                      ))}
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
                <Receipt className="w-10 h-10 opacity-30" />
                <p className="text-sm">Input income to estimate taxes.</p>
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
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : (index === 1 ? '#f59e0b' : '#10b981')} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col">
            <h3 className="text-base font-bold text-white mb-2">Take-Home Split</h3>
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
