'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  RotateCcw,
  Scale,
  AlertTriangle,
  CheckCircle,
  Info,
  Banknote,
  CreditCard
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
  Legend,
  ReferenceLine
} from 'recharts';

function fmtAmt(n: number, symbol: string): string {
  if (!isFinite(n)) return `${symbol}0.00`;
  return `${symbol}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DTICalculator() {
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
  const [grossMonthlyIncome, setGrossMonthlyIncome] = useState('8000');
  const [monthlyHousing, setMonthlyHousing] = useState('2000'); // Rent/Mortgage
  const [monthlyAutoLoans, setMonthlyAutoLoans] = useState('400');
  const [monthlyStudentLoans, setMonthlyStudentLoans] = useState('300');
  const [monthlyCreditCards, setMonthlyCreditCards] = useState('150'); // Minimum payments
  const [otherMonthlyDebt, setOtherMonthlyDebt] = useState('0');

  // Results
  const [results, setResults] = useState<{
    totalIncome: number;
    totalDebt: number;
    frontEndDTI: number;
    backEndDTI: number;
    disposableIncome: number;
  } | null>(null);

  const [error, setError] = useState('');

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);

  const calculate = useCallback(() => {
    setError('');

    const income = Number(grossMonthlyIncome);
    const housing = Number(monthlyHousing) || 0;
    const auto = Number(monthlyAutoLoans) || 0;
    const student = Number(monthlyStudentLoans) || 0;
    const cards = Number(monthlyCreditCards) || 0;
    const other = Number(otherMonthlyDebt) || 0;

    if (isNaN(income) || income <= 0) {
      setError('Gross monthly income must be greater than zero.');
      return setResults(null);
    }

    const inr = (val: number) => convertToINR(val, selectedInputCurrency);

    const totalDebtAmount = housing + auto + student + cards + other;
    
    // Front-end DTI is just housing
    const frontRatio = (housing / income) * 100;
    
    // Back-end DTI is ALL debt including housing
    const backRatio = (totalDebtAmount / income) * 100;

    const disposable = income - totalDebtAmount;

    setResults({
      totalIncome: inr(income),
      totalDebt: inr(totalDebtAmount),
      frontEndDTI: frontRatio,
      backEndDTI: backRatio,
      disposableIncome: inr(disposable)
    });

  }, [grossMonthlyIncome, monthlyHousing, monthlyAutoLoans, monthlyStudentLoans, monthlyCreditCards, otherMonthlyDebt, selectedInputCurrency, convertToINR]);

  useEffect(() => {
    calculate();
  }, [calculate, lastUpdatedTime]);

  const handleReset = () => {
    setGrossMonthlyIncome('8000');
    setMonthlyHousing('2000');
    setMonthlyAutoLoans('400');
    setMonthlyStudentLoans('300');
    setMonthlyCreditCards('150');
    setOtherMonthlyDebt('0');
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
    if (results.backEndDTI <= 35) return { text: "Excellent! Your DTI is under 36%, making you an ideal candidate for most loans and mortgages with plenty of financial breathing room.", type: "success" };
    if (results.backEndDTI <= 43) return { text: "Adequate. Lenders typically look for a DTI under 43%. You have decent approval odds but may want to pay down some debt before taking on more.", type: "info" };
    if (results.backEndDTI <= 50) return { text: "High Risk. Your DTI is reaching limits where many conventional loans will trigger automatic rejection. Consider aggressive debt paydown.", type: "warning" };
    return { text: "Critical Debt Burden. More than half your gross income goes to debt. Strict budgeting or restructuring is highly advised.", type: "warning" };
  };

  const insight = getInsight();
  const insightStyle = {
    warning: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
  };
  const InsightIcon = insight ? { warning: AlertTriangle, success: CheckCircle, info: Info }[insight.type as keyof typeof insightStyle] : Info;

  const getStatusColorClass = (dti: number) => {
    if (dti <= 35) return 'text-emerald-400';
    if (dti <= 43) return 'text-blue-400';
    if (dti <= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  const pieData = [
    { name: 'Housing', value: convertFromINR(convertToINR(Number(monthlyHousing), selectedInputCurrency), selectedResultCurrency) },
    { name: 'Auto', value: convertFromINR(convertToINR(Number(monthlyAutoLoans), selectedInputCurrency), selectedResultCurrency) },
    { name: 'Student', value: convertFromINR(convertToINR(Number(monthlyStudentLoans), selectedInputCurrency), selectedResultCurrency) },
    { name: 'Cards', value: convertFromINR(convertToINR(Number(monthlyCreditCards), selectedInputCurrency), selectedResultCurrency) },
    { name: 'Other', value: convertFromINR(convertToINR(Number(otherMonthlyDebt), selectedInputCurrency), selectedResultCurrency) },
  ].filter(d => d.value > 0);

  const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-indigo-100 dark:to-indigo-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-sm font-medium mb-4">
          <Scale className="w-4 h-4" />
          Financial Health
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-900 dark:text-white tracking-tight mb-2">
          Debt-to-Income <span className="text-orange-400">(DTI) Ratio</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-lg">
          Calculate the most critical metric banks use to determine your borrowing power.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT — INPUTS */}
        <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">Monthly Cashflow</h2>
              <p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">Input your gross income and debt obligations</p>
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
              className="w-full px-4 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all outline-none"
            >
              {availableCurrencies.map(c => (
                <option key={c} value={c} className="bg-white dark:bg-slate-800">{c} ({getCurrencySymbol(c)})</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 dark:border-gray-200 dark:border-white/10 pb-2">
              <Banknote className="w-4 h-4"/> Income Structure
            </h3>
            
            <div>
              <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">Gross Monthly Income (Before Taxes)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                <input type="number" min={0} value={grossMonthlyIncome} onChange={e => setGrossMonthlyIncome(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold" />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 dark:border-gray-200 dark:border-white/10 pb-2">
              <CreditCard className="w-4 h-4"/> Debt Obligations (Monthly)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">Housing (Rent/Mortgage)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={monthlyHousing} onChange={e => setMonthlyHousing(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-semibold" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">Auto Loans</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={monthlyAutoLoans} onChange={e => setMonthlyAutoLoans(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-semibold" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">Student Loans</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={monthlyStudentLoans} onChange={e => setMonthlyStudentLoans(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-semibold" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">Credit Cards (Min. Payment)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={monthlyCreditCards} onChange={e => setMonthlyCreditCards(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-semibold" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">Other Debts (Personal, etc.)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={otherMonthlyDebt} onChange={e => setOtherMonthlyDebt(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-semibold" />
                </div>
              </div>
            </div>
            <div className="mt-2 bg-gray-50 dark:bg-gray-50 dark:bg-slate-900/40 border border-gray-100 dark:border-gray-100 dark:border-white/5 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-600 dark:text-slate-400">
              * Enter your minimum required payments for credit cards, not your full statement balance unless you pay in full. Include any child support or alimony under 'Other'. Do not include utilities or living expenses like groceries.
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
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">Ratio Dashboard</h2>
                <p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">Updated: <span className="text-orange-300">{relTime}</span></p>
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
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Display Currency</p>
              <div className="flex flex-wrap gap-2">
                {availableCurrencies.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedResultCurrency(c as never)}
                    className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${
                      selectedResultCurrency === c
                        ? 'bg-orange-600 border-orange-500 text-white'
                        : 'bg-white dark:bg-white dark:bg-white/5 border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-600 dark:text-slate-400 hover:border-orange-400 hover:text-slate-800 dark:text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {results ? (
              <div className="flex flex-col flex-1">
                <div className="border rounded-2xl p-5 mb-5 text-center bg-gradient-to-r from-orange-600/10 to-amber-600/10 border-orange-500/30">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-orange-300">
                    Total DTI Ratio (Back-End)
                  </p>
                  <p className={`text-5xl font-extrabold tracking-tight mb-2 ${getStatusColorClass(results.backEndDTI)}`}>
                    {results.backEndDTI.toFixed(1)}%
                  </p>
                  <div className="w-full bg-slate-900/5 dark:bg-slate-900 rounded-full h-2 mt-4 overflow-hidden border border-gray-100 dark:border-gray-100 dark:border-white/5">
                    <div 
                      className={`h-full ${results.backEndDTI <= 35 ? 'bg-emerald-500' : results.backEndDTI <= 43 ? 'bg-blue-500' : results.backEndDTI <= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                      style={{ width: `${Math.min(results.backEndDTI, 100)}%` }} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="rounded-xl border bg-gray-50 dark:bg-white dark:bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-gray-100 dark:border-white/5 p-4 flex flex-col gap-1 relative overflow-hidden">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-600 dark:text-slate-400">Total Income</div>
                    <p className="font-bold text-base text-slate-900 dark:text-slate-900 dark:text-white">{disp(results.totalIncome)}</p>
                  </div>
                  <div className="rounded-xl border bg-gray-50 dark:bg-white dark:bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-gray-100 dark:border-white/5 p-4 flex flex-col gap-1 relative overflow-hidden">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-rose-400">Total Debt Load</div>
                    <p className="font-bold text-base text-slate-900 dark:text-slate-900 dark:text-white">{disp(results.totalDebt)}</p>
                  </div>
                  <div className="rounded-xl border bg-gray-50 dark:bg-white dark:bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-gray-100 dark:border-white/5 p-4 flex flex-col gap-1 relative overflow-hidden">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Discretionary</div>
                    <p className="font-bold text-base text-slate-900 dark:text-slate-900 dark:text-white">{disp(results.disposableIncome)}</p>
                  </div>
                </div>

                <div className="border border-gray-100 dark:border-gray-100 dark:border-white/5 rounded-xl overflow-hidden mb-5">
                  <table className="w-full text-sm text-center">
                    <thead className="bg-gray-50 dark:bg-white dark:bg-white/5 text-slate-600 dark:text-slate-600 dark:text-slate-400 font-semibold text-[10px] uppercase border-b border-gray-200 dark:border-gray-200 dark:border-white/10">
                      <tr>
                        <th className="px-4 py-2">Front-End (Housing Only)</th>
                        <th className="px-4 py-2">Target</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-100 dark:divide-white/5 text-slate-700 dark:text-slate-700 dark:text-slate-300 text-sm shadow-inner">
                      <tr className="bg-white/[0.02]">
                        <td className={`px-4 py-3 font-bold ${results.frontEndDTI <= 28 ? 'text-emerald-400' : 'text-rose-400'}`}>{results.frontEndDTI.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-600 dark:text-slate-400">{'<= 28%'}</td>
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
                <Scale className="w-10 h-10 opacity-30" />
                <p className="text-sm">Input data to map out your credit worthiness.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CHARTS SECTION */}
      {results && (
        <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-900 dark:text-white mb-6">DTI Approval Tiers</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: 'Your DTI', value: results.backEndDTI }]} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '13px' }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'DTI Utilization']}
                  />
                  <ReferenceLine y={36} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'top', value: 'Excellent (<36%)', fill: '#10b981', fontSize: 10 }} />
                  <ReferenceLine y={43} stroke="#3b82f6" strokeDasharray="3 3" label={{ position: 'top', value: 'Standard Limit (43%)', fill: '#3b82f6', fontSize: 10 }} />
                  <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: 'High Risk (50%)', fill: '#f59e0b', fontSize: 10 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={100}>
                    <Cell fill={results.backEndDTI <= 35 ? '#10b981' : results.backEndDTI <= 43 ? '#3b82f6' : results.backEndDTI <= 50 ? '#f59e0b' : '#ef4444'} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6 flex flex-col">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-900 dark:text-white mb-2">Debt Composition</h3>
            <div className="flex-1 min-h-[250px] w-full flex items-center justify-center">
              {pieData.length > 0 ? (
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
              ) : (
                <p className="text-sm text-slate-500">No debt data.</p>
              )}
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
