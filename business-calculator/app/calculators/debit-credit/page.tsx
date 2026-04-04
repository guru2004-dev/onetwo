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
  ArrowRightLeft
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';

function fmtAmt(n: number, symbol: string): string {
  if (!isFinite(n)) return `${symbol}0.00`;
  return `${symbol}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface Entry {
  id: string;
  account: string;
  amount: string;
}

export default function DebitCreditCalculator() {
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
  const [debits, setDebits] = useState<Entry[]>([
    { id: 'd1', account: 'Cash', amount: '10000' },
    { id: 'd2', account: 'Equipment', amount: '15000' }
  ]);

  const [credits, setCredits] = useState<Entry[]>([
    { id: 'c1', account: 'Bank Loan', amount: '20000' },
    { id: 'c2', account: 'Owner Equity', amount: '5000' }
  ]);

  // Results
  const [results, setResults] = useState<{
    totalDebits: number;
    totalCredits: number;
    difference: number;
    isBalanced: boolean;
  } | null>(null);

  const [error, setError] = useState('');

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);

  const addDebit = () => setDebits([...debits, { id: Date.now().toString(), account: '', amount: '' }]);
  const removeDebit = (id: string) => {
    if (debits.length > 1) setDebits(debits.filter(d => d.id !== id));
  };
  const updateDebit = (id: string, field: keyof Entry, value: string) => {
    setDebits(debits.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const addCredit = () => setCredits([...credits, { id: Date.now().toString(), account: '', amount: '' }]);
  const removeCredit = (id: string) => {
    if (credits.length > 1) setCredits(credits.filter(c => c.id !== id));
  };
  const updateCredit = (id: string, field: keyof Entry, value: string) => {
    setCredits(credits.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const calculate = useCallback(() => {
    setError('');

    let tDebitsINR = 0;
    let hasError = false;
    for (const d of debits) {
      const v = Number(d.amount);
      if (isNaN(v) || v < 0) hasError = true;
      else tDebitsINR += convertToINR(v, selectedInputCurrency);
    }

    let tCreditsINR = 0;
    for (const c of credits) {
      const v = Number(c.amount);
      if (isNaN(v) || v < 0) hasError = true;
      else tCreditsINR += convertToINR(v, selectedInputCurrency);
    }

    if (hasError) {
      setError('Please enter valid positive amounts for all entries.');
      return setResults(null);
    }

    // Floating point precision fix for balancing
    const differenceINR = Math.abs(tDebitsINR - tCreditsINR);
    const isBalanced = differenceINR < 0.01;

    setResults({
      totalDebits: tDebitsINR,
      totalCredits: tCreditsINR,
      difference: differenceINR,
      isBalanced
    });
  }, [debits, credits, selectedInputCurrency, convertToINR]);

  useEffect(() => {
    calculate();
  }, [calculate, lastUpdatedTime]);

  const handleReset = () => {
    setDebits([
      { id: 'd1', account: 'Cash', amount: '10000' },
      { id: 'd2', account: 'Equipment', amount: '15000' }
    ]);
    setCredits([
      { id: 'c1', account: 'Bank Loan', amount: '20000' },
      { id: 'c2', account: 'Owner Equity', amount: '5000' }
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
    if (results.isBalanced) return { text: "Journal entry is perfectly balanced.", type: "success" };
    return { text: `Entry is out of balance by ${disp(results.difference)}. Adjust accounts to equalize debits and credits before posting.`, type: "warning" };
  };

  const insight = getInsight();
  const insightStyle = {
    warning: 'bg-red-500/10 border-red-500/30 text-red-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    info: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
  };
  const InsightIcon = insight ? { warning: AlertTriangle, success: CheckCircle, info: Info }[insight.type as keyof typeof insightStyle] : Info;

  const barData = results ? [
    { name: 'Debits', value: convertFromINR(results.totalDebits, selectedResultCurrency) },
    { name: 'Credits', value: convertFromINR(results.totalCredits, selectedResultCurrency) }
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-4">
          <Scale className="w-4 h-4" />
          Accounting Editor
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
          Debit & Credit <span className="text-indigo-400">Validator</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Validate journal entries by ensuring your debits and credits balance perfectly.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT — INPUTS */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Journal Entry</h2>
              <p className="text-slate-400 text-sm">Add accounts and amounts</p>
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
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            >
              {availableCurrencies.map(c => (
                <option key={c} value={c} className="bg-slate-800">{c} ({getCurrencySymbol(c)})</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
              <ArrowRightLeft className="w-4 h-4"/> Debits (Dr.)
            </h3>
            <div className="space-y-3">
              {debits.map((debit) => (
                <div key={debit.id} className="flex gap-3 items-center">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={debit.account}
                      onChange={e => updateDebit(debit.id, 'account', e.target.value)}
                      placeholder="Account Name"
                      className="w-full px-3 py-2.5 rounded-xl bg-emerald-900/10 border border-emerald-500/20 text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                    />
                  </div>
                  <div className="w-1/3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/70 text-sm">{inputSym}</span>
                      <input
                        type="number"
                        value={debit.amount}
                        onChange={e => updateDebit(debit.id, 'amount', e.target.value)}
                        placeholder="0"
                        min={0}
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-emerald-900/10 border border-emerald-500/20 text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
                      />
                    </div>
                  </div>
                  <button onClick={() => removeDebit(debit.id)} disabled={debits.length === 1} className="p-2.5 text-emerald-400/70 hover:text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 rounded-xl hover:bg-emerald-500/20 disabled:opacity-50 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addDebit} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-300 rounded-xl hover:bg-emerald-500/20 transition-colors text-sm font-semibold border border-emerald-500/20">
              <Plus className="w-4 h-4" /> Add Debit
            </button>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
              <ArrowRightLeft className="w-4 h-4"/> Credits (Cr.)
            </h3>
            <div className="space-y-3">
              {credits.map((credit) => (
                <div key={credit.id} className="flex gap-3 items-center">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={credit.account}
                      onChange={e => updateCredit(credit.id, 'account', e.target.value)}
                      placeholder="Account Name"
                      className="w-full px-3 py-2.5 rounded-xl bg-indigo-900/10 border border-indigo-500/20 text-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm ml-6"
                    />
                  </div>
                  <div className="w-1/3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500/70 text-sm">{inputSym}</span>
                      <input
                        type="number"
                        value={credit.amount}
                        onChange={e => updateCredit(credit.id, 'amount', e.target.value)}
                        placeholder="0"
                        min={0}
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-indigo-900/10 border border-indigo-500/20 text-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
                      />
                    </div>
                  </div>
                  <button onClick={() => removeCredit(credit.id)} disabled={credits.length === 1} className="p-2.5 text-indigo-400/70 hover:text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 rounded-xl hover:bg-indigo-500/20 disabled:opacity-50 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addCredit} className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-300 rounded-xl hover:bg-indigo-500/20 transition-colors text-sm font-semibold border border-indigo-500/20 ml-6">
              <Plus className="w-4 h-4" /> Add Credit
            </button>
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
                <h2 className="text-lg font-bold text-white">Validation Results</h2>
                <p className="text-slate-400 text-sm">Updated: <span className="text-indigo-300">{relTime}</span></p>
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
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Display Currency</p>
              <div className="flex flex-wrap gap-2">
                {availableCurrencies.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedResultCurrency(c as never)}
                    className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${
                      selectedResultCurrency === c
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-indigo-400 hover:text-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {results ? (
              <div className="flex flex-col flex-1">
                <div className={`border rounded-2xl p-6 mb-5 text-center ${results.isBalanced ? 'bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border-emerald-500/30' : 'bg-gradient-to-r from-red-600/10 to-rose-600/10 border-red-500/30'}`}>
                  {results.isBalanced ? (
                    <>
                      <div className="inline-flex items-center justify-center p-3 bg-emerald-500/20 text-emerald-400 rounded-full mb-3">
                        <Scale className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-bold uppercase tracking-widest text-emerald-300 mb-1">
                        Balanced
                      </p>
                      <p className="text-3xl font-extrabold text-white tracking-tight">
                        {disp(results.totalDebits)}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="inline-flex items-center justify-center p-3 bg-red-500/20 text-red-400 rounded-full mb-3">
                        <AlertTriangle className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-bold uppercase tracking-widest text-red-300 mb-1">
                        Out of Balance
                      </p>
                      <div className="text-white mb-2">
                        <span className="text-red-300 text-sm mr-2">Difference:</span>
                        <span className="text-2xl font-bold">{disp(results.difference)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl border bg-emerald-900/10 border-emerald-500/20 p-4 flex flex-col gap-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Total Debits</div>
                    <p className="font-bold text-lg text-emerald-100">{disp(results.totalDebits)}</p>
                  </div>
                  <div className="rounded-xl border bg-indigo-900/10 border-indigo-500/20 p-4 flex flex-col gap-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">Total Credits</div>
                    <p className="font-bold text-lg text-indigo-100">{disp(results.totalCredits)}</p>
                  </div>
                </div>

                <div className="border border-white/5 rounded-xl overflow-hidden mb-5">
                  <table className="w-full text-sm text-left line-clamp-none">
                    <thead className="bg-white/5 text-slate-400 font-semibold text-xs border-b border-white/10">
                      <tr>
                        <th className="px-4 py-2.5">Account</th>
                        <th className="px-4 py-2.5 text-right w-1/4 border-l border-white/5">Debit</th>
                        <th className="px-4 py-2.5 text-right w-1/4 border-l border-white/5">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300 text-sm">
                      {debits.filter(d => Number(d.amount)>0).map((d, i) => (
                        <tr key={`res-d-${i}`} className="hover:bg-white/5 bg-emerald-900/5">
                          <td className="px-4 py-2.5 text-emerald-100">{d.account || 'Unknown Account'}</td>
                          <td className="px-4 py-2.5 text-right font-medium text-emerald-200 border-l border-white/5">{disp(convertToINR(Number(d.amount), selectedInputCurrency))}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600 border-l border-white/5">-</td>
                        </tr>
                      ))}
                      {credits.filter(c => Number(c.amount)>0).map((c, i) => (
                        <tr key={`res-c-${i}`} className="hover:bg-white/5 bg-indigo-900/5">
                          <td className="px-4 py-2.5 pl-8 text-indigo-100">{c.account || 'Unknown Account'}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600 border-l border-white/5">-</td>
                          <td className="px-4 py-2.5 text-right font-medium text-indigo-200 border-l border-white/5">{disp(convertToINR(Number(c.amount), selectedInputCurrency))}</td>
                        </tr>
                      ))}
                      <tr className="font-extrabold bg-white/10 border-t-2 border-white/20">
                        <td className="px-4 py-3 text-white">TOTALS</td>
                        <td className={`px-4 py-3 text-right border-l border-white/5 ${!results.isBalanced ? 'text-red-400' : 'text-emerald-400'}`}>{disp(results.totalDebits)}</td>
                        <td className={`px-4 py-3 text-right border-l border-white/5 ${!results.isBalanced ? 'text-red-400' : 'text-indigo-400'}`}>{disp(results.totalCredits)}</td>
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
                <Scale className="w-10 h-10 opacity-30" />
                <p className="text-sm">Input journal entries to validate balance.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CHARTS SECTION */}
      {results && (
        <div className="max-w-6xl mx-auto mt-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-6">Debit vs Credit Comparison</h3>
            <div className="h-[250px] w-full max-w-lg mx-auto">
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
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {!results.isBalanced && (
              <p className="text-center text-red-400 text-sm mt-4 font-semibold">
                Difference: {disp(results.difference)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
