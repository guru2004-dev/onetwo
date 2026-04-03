'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  RotateCcw,
  ReceiptText,
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

export default function TDSCalculator() {
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
  const [totalPayment, setTotalPayment] = useState('50000');
  const [paymentType, setPaymentType] = useState('10'); // maps to TDS rate %
  const [customRate, setCustomRate] = useState('0');

  // Results
  const [results, setResults] = useState<{
    grossAmount: number;
    tdsAmount: number;
    netPayable: number;
    effectiveRate: number;
  } | null>(null);

  const [error, setError] = useState('');

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);

  const calculate = useCallback(() => {
    setError('');

    const tp = Number(totalPayment);
    let rate = Number(paymentType);

    if (paymentType === 'custom') {
      rate = Number(customRate);
    }

    if (isNaN(tp) || tp < 0) {
      setError('Please enter a valid payment amount (≥ 0).');
      return setResults(null);
    }
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setError('Please enter a valid TDS percentage (0 - 100).');
      return setResults(null);
    }

    const inr = (val: number) => convertToINR(val, selectedInputCurrency);

    const grossAmountINR = inr(tp);
    const tdsAmountINR = grossAmountINR * (rate / 100);
    const netPayableINR = grossAmountINR - tdsAmountINR;

    setResults({
      grossAmount: grossAmountINR,
      tdsAmount: tdsAmountINR,
      netPayable: netPayableINR,
      effectiveRate: rate
    });
  }, [totalPayment, paymentType, customRate, selectedInputCurrency, convertToINR]);

  useEffect(() => {
    calculate();
  }, [calculate, lastUpdatedTime]);

  const handleReset = () => {
    setTotalPayment('50000');
    setPaymentType('10');
    setCustomRate('0');
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
    if (results.tdsAmount === 0) return { text: "No TDS deducted. Ensure that this payment nature is exempt from TDS rules.", type: "success" };
    if (results.effectiveRate >= 20) return { text: "High TDS deduction. Typically seen in cases without PAN provided (Indian context).", type: "warning" };
    return { text: "TDS properly applied. Prepare to issue a TDS certificate (Form 16/16A) to the payee.", type: "info" };
  };

  const insight = getInsight();
  const insightStyle = {
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    info: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
  };
  const InsightIcon = insight ? { warning: AlertTriangle, success: CheckCircle, info: Info }[insight.type as keyof typeof insightStyle] : Info;

  const barData = results ? [
    { name: 'Gross Payment', value: convertFromINR(results.grossAmount, selectedResultCurrency) },
    { name: 'Net Payable', value: convertFromINR(results.netPayable, selectedResultCurrency) }
  ] : [];

  const pieData = results ? [
    { name: 'TDS Deducted', value: convertFromINR(results.tdsAmount, selectedResultCurrency) },
    { name: 'Net Paid to Vendor', value: convertFromINR(results.netPayable, selectedResultCurrency) }
  ] : [];

  const PIE_COLORS = ['#fb923c', '#10b981'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-sm font-medium mb-4">
          <ReceiptText className="w-4 h-4" />
          Tax Compliance
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
          TDS <span className="text-orange-400">Calculator</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Calculate Tax Deducted at Source (TDS) and net payable vendor amounts.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT — INPUTS */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Payment Details</h2>
              <p className="text-slate-400 text-sm">Enter the gross amount and applicable rule</p>
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
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all outline-none"
            >
              {availableCurrencies.map(c => (
                <option key={c} value={c} className="bg-slate-800">{c} ({getCurrencySymbol(c)})</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
              <Banknote className="w-4 h-4"/> Invoice Amount
            </h3>
            <div>
              <label className="block text-[13px] text-slate-300 mb-1">Gross Payment / Invoice Total</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                <input type="number" min={0} value={totalPayment} onChange={e => setTotalPayment(e.target.value)} className="w-full pl-8 pr-3 py-3 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-semibold text-lg" />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
              <MinusCircle className="w-4 h-4"/> Applicable TDS Rate
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Nature of Payment</label>
                <select
                  value={paymentType}
                  onChange={e => setPaymentType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                >
                  <option value="1">1% - Contract (Individual/HUF)</option>
                  <option value="2">2% - Contract (Others)</option>
                  <option value="5">5% - Commission / Brokerage</option>
                  <option value="10">10% - Rent / Professional Tech Fees</option>
                  <option value="20">20% - No PAN Provided</option>
                  <option value="custom">Custom Rate</option>
                </select>
              </div>
              {paymentType === 'custom' && (
                <div>
                  <label className="block text-[13px] text-slate-300 mb-1">Custom Rate (%)</label>
                  <div className="relative">
                    <input type="number" min={0} max={100} value={customRate} onChange={e => setCustomRate(e.target.value)} className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-semibold" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                  </div>
                </div>
              )}
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
                <h2 className="text-lg font-bold text-white">Deduction Summary</h2>
                <p className="text-slate-400 text-sm">Updated: <span className="text-orange-300">{relTime}</span></p>
              </div>
              <button
                onClick={() => updateCurrencyRates()}
                disabled={ratesLoading}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
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
                        ? 'bg-orange-600 border-orange-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-orange-400 hover:text-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {results ? (
              <div className="flex flex-col flex-1">
                <div className="border rounded-2xl p-5 mb-5 text-center bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-orange-300">
                    Net Payable to Payee
                  </p>
                  <p className="text-5xl font-extrabold text-white tracking-tight mb-2">
                    {disp(results.netPayable)}
                  </p>
                  <div className="inline-flex items-center justify-center bg-black/20 rounded-full px-4 py-1 text-sm border border-white/5">
                    <span className="text-slate-300 font-semibold mr-2">TDS Deducted:</span>
                    <span className="text-orange-400 font-bold">
                      {disp(results.tdsAmount)} ({results.effectiveRate}%)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl border bg-slate-800/50 border-white/5 p-4 flex flex-col gap-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Gross Invoice Amount</div>
                    <p className="font-bold text-lg text-white">{disp(results.grossAmount)}</p>
                  </div>
                  <div className="rounded-xl border bg-orange-900/10 border-orange-500/30 p-4 flex flex-col gap-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-orange-400">Total TDS Liability</div>
                    <p className="font-bold text-lg text-orange-200">{disp(results.tdsAmount)}</p>
                  </div>
                </div>

                <div className="border border-white/5 rounded-xl overflow-hidden mb-5">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-slate-400 font-semibold text-xs border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300 text-sm">
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-slate-200">Total Invoice Base</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-200">{disp(results.grossAmount)}</td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-orange-300">TDS Deduction (@{results.effectiveRate}%)</td>
                        <td className="px-4 py-3 text-right font-medium text-orange-300">-{disp(results.tdsAmount)}</td>
                      </tr>
                      <tr className="bg-white/5 font-bold">
                        <td className="px-4 py-3 text-emerald-300">Final Net Payment</td>
                        <td className="px-4 py-3 text-right text-emerald-300">{disp(results.netPayable)}</td>
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
                <ReceiptText className="w-10 h-10 opacity-30" />
                <p className="text-sm">Input payment specifics to calculate TDS.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CHARTS SECTION */}
      {results && (
        <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-6">Gross vs Net Value</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value >= 1000 ? (value/1000).toFixed(0)+'k' : value}`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '13px' }}
                    formatter={(value: number) => [`${currSym}${value.toLocaleString()}`, 'Amount']}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col">
            <h3 className="text-base font-bold text-white mb-2">TDS Deduction Split</h3>
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
