'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  RotateCcw,
  TrendingUp,
  Plus,
  Trash2,
  Award,
  AlertTriangle,
  CheckCircle,
  Info,
  Sparkles,
  Scale,
  ArrowDown,
  Building2,
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface LoanInput {
  id: string;
  name: string;
  amount: string;
  rate: string;
  tenure: string;
  tenureUnit: 'months' | 'years';
  processingFee: string;
}

interface LoanResult {
  id: string;
  name: string;
  emi: number;
  totalPayment: number;
  totalInterest: number;
  totalCost: number;
  principalINR: number;
  processingFeeINR: number;
  months: number;
  rate: number;
  isBestEMI: boolean;
  isBestCost: boolean;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function fmtAmt(n: number, symbol: string): string {
  if (!isFinite(n) || n < 0) return `${symbol}0.00`;
  return `${symbol}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtShort(n: number, symbol: string): string {
  if (!isFinite(n)) return `${symbol}0`;
  if (n >= 1_00_00_000) return `${symbol}${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000)    return `${symbol}${(n / 1_00_000).toFixed(2)} L`;
  if (n >= 1_000)       return `${symbol}${(n / 1_000).toFixed(1)} K`;
  return `${symbol}${n.toFixed(2)}`;
}

function calcEMI(p: number, annualRate: number, months: number): number {
  if (p <= 0 || months <= 0) return 0;
  if (annualRate === 0) return p / months;
  const r = annualRate / 12 / 100;
  const pow = Math.pow(1 + r, months);
  return (p * r * pow) / (pow - 1);
}

const LOAN_COLORS = [
  { bg: 'from-indigo-600/20 to-violet-600/20', border: 'border-indigo-500/30', text: 'text-indigo-400', accent: 'bg-indigo-500', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { bg: 'from-emerald-600/20 to-teal-600/20', border: 'border-emerald-500/30', text: 'text-emerald-400', accent: 'bg-emerald-500', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { bg: 'from-amber-600/20 to-orange-600/20', border: 'border-amber-500/30', text: 'text-amber-400', accent: 'bg-amber-500', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { bg: 'from-rose-600/20 to-pink-600/20', border: 'border-rose-500/30', text: 'text-rose-400', accent: 'bg-rose-500', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  { bg: 'from-cyan-600/20 to-blue-600/20', border: 'border-cyan-500/30', text: 'text-cyan-400', accent: 'bg-cyan-500', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
];

const LOAN_LABELS = ['A', 'B', 'C', 'D', 'E'];

function createLoan(index: number): LoanInput {
  return {
    id: `loan-${Date.now()}-${index}`,
    name: `Loan ${LOAN_LABELS[index] || String.fromCharCode(65 + index)}`,
    amount: '',
    rate: '',
    tenure: '',
    tenureUnit: 'years',
    processingFee: '0',
  };
}

function generateInsights(results: LoanResult[]): string[] {
  if (results.length < 2) return [];
  const insights: string[] = [];

  const bestEMI = results.find(r => r.isBestEMI);
  const bestCost = results.find(r => r.isBestCost);

  if (bestEMI && bestCost && bestEMI.id === bestCost.id) {
    insights.push(`🏆 ${bestEMI.name} is the clear winner — lowest EMI and lowest total cost.`);
  } else if (bestEMI && bestCost) {
    insights.push(`💡 ${bestEMI.name} has the lowest EMI, but ${bestCost.name} has the lowest total cost. Consider your priority: monthly budget vs overall savings.`);
  }

  const lowestRate = results.reduce((a, b) => a.rate < b.rate ? a : b);
  const highestRate = results.reduce((a, b) => a.rate > b.rate ? a : b);
  if (lowestRate.id !== highestRate.id) {
    const diff = (highestRate.rate - lowestRate.rate).toFixed(2);
    insights.push(`📊 ${lowestRate.name} offers ${diff}% lower interest rate than ${highestRate.name}.`);
  }

  if (bestCost) {
    const secondBest = results.filter(r => r.id !== bestCost.id).reduce((a, b) => a.totalCost < b.totalCost ? a : b);
    const savings = secondBest.totalCost - bestCost.totalCost;
    if (savings > 0) {
      insights.push(`💰 Choosing ${bestCost.name} saves you ${fmtShort(savings, '₹')} compared to ${secondBest.name}.`);
    }
  }

  const shortestTenure = results.reduce((a, b) => a.months < b.months ? a : b);
  const longestTenure = results.reduce((a, b) => a.months > b.months ? a : b);
  if (shortestTenure.id !== longestTenure.id && shortestTenure.months !== longestTenure.months) {
    insights.push(`⏱️ ${shortestTenure.name} has a shorter tenure (${shortestTenure.months} months) — you'll be debt-free faster.`);
  }

  return insights;
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function LoanComparisonCalculator() {
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

  // ── State ────────────────────────────────────
  const [loans, setLoans] = useState<LoanInput[]>([createLoan(0), createLoan(1)]);
  const [results, setResults] = useState<LoanResult[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);

  // ── Relative update time ────────────────────
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

  // ── Loan CRUD ───────────────────────────────
  const addLoan = () => {
    if (loans.length >= 5) return;
    setLoans(prev => [...prev, createLoan(prev.length)]);
  };

  const removeLoan = (id: string) => {
    if (loans.length <= 2) return;
    setLoans(prev => prev.filter(l => l.id !== id));
    setErrors(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateLoan = (id: string, field: keyof LoanInput, value: string) => {
    setLoans(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
    // Clear error for this loan when user types
    if (errors[id]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  // ── Calculation ─────────────────────────────
  const calculate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    const newResults: LoanResult[] = [];

    for (const loan of loans) {
      const amount = Number(loan.amount);
      const rate = Number(loan.rate);
      const tenure = Number(loan.tenure);
      const fee = Number(loan.processingFee) || 0;

      if (!loan.amount || isNaN(amount) || amount <= 0) {
        newErrors[loan.id] = 'Enter a valid loan amount';
        continue;
      }
      if (isNaN(rate) || rate < 0 || !loan.rate) {
        newErrors[loan.id] = 'Enter a valid interest rate';
        continue;
      }
      if (isNaN(tenure) || tenure <= 0 || !loan.tenure) {
        newErrors[loan.id] = 'Enter a valid tenure';
        continue;
      }

      const months = loan.tenureUnit === 'years' ? Math.round(tenure * 12) : Math.round(tenure);
      const principalINR = convertToINR(amount, selectedInputCurrency);
      const processingFeeINR = convertToINR(fee, selectedInputCurrency);
      const emi = calcEMI(principalINR, rate, months);
      const totalPayment = emi * months;
      const totalInterest = totalPayment - principalINR;
      const totalCost = totalPayment + processingFeeINR;

      newResults.push({
        id: loan.id,
        name: loan.name,
        emi,
        totalPayment,
        totalInterest,
        totalCost,
        principalINR,
        processingFeeINR,
        months,
        rate,
        isBestEMI: false,
        isBestCost: false,
      });
    }

    // Mark best
    if (newResults.length >= 2) {
      const minEMI = Math.min(...newResults.map(r => r.emi));
      const minCost = Math.min(...newResults.map(r => r.totalCost));
      newResults.forEach(r => {
        r.isBestEMI = r.emi === minEMI;
        r.isBestCost = r.totalCost === minCost;
      });
    }

    setErrors(newErrors);
    setResults(newResults);
  }, [loans, selectedInputCurrency, convertToINR]);

  useEffect(() => { calculate(); }, [calculate, lastUpdatedTime]);

  const handleReset = () => {
    setLoans([createLoan(0), createLoan(1)]);
    setResults([]);
    setErrors({});
  };

  // ── Display helpers ─────────────────────────
  const disp = (inr: number) => fmtAmt(convertFromINR(inr, selectedResultCurrency), currSym);
  const dispShort = (inr: number) => fmtShort(convertFromINR(inr, selectedResultCurrency), currSym);

  const insights = useMemo(() => generateInsights(results), [results]);

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 py-10 px-4">

      {/* Title */}
      <div className="max-w-7xl mx-auto mb-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-4"
        >
          <Scale className="w-4 h-4" />
          Compare & Save
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl font-extrabold text-white tracking-tight mb-2"
        >
          Loan <span className="text-indigo-400">Comparison</span> Calculator
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-400 text-lg"
        >
          Compare multiple loan offers side-by-side — find the best deal instantly.
        </motion.p>
      </div>

      <div className="max-w-7xl mx-auto">

        {/* ══ TOP BAR — Currency + Controls ══ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Input Currency */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-slate-300 whitespace-nowrap">Input Currency</label>
              <select
                value={selectedInputCurrency}
                onChange={e => { if (availableCurrencies.includes(e.target.value as never)) setSelectedInputCurrency(e.target.value as never); }}
                disabled={ratesLoading}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                {availableCurrencies.map(c => (
                  <option key={c} value={c} className="bg-slate-800">{c} ({getCurrencySymbol(c)})</option>
                ))}
              </select>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
              <button
                onClick={() => updateCurrencyRates()}
                disabled={ratesLoading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${ratesLoading ? 'animate-spin' : ''}`} />
                Update
              </button>
              <span className="text-xs text-slate-500">Updated: <span className="text-indigo-300">{relTime}</span></span>
            </div>
          </div>
        </motion.div>

        {/* ══ LOAN INPUT CARDS ══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          <AnimatePresence mode="popLayout">
            {loans.map((loan, index) => {
              const color = LOAN_COLORS[index % LOAN_COLORS.length];
              return (
                <motion.div
                  key={loan.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={`bg-gradient-to-br ${color.bg} backdrop-blur-xl border ${color.border} rounded-2xl shadow-2xl p-5 flex flex-col gap-4`}
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg ${color.accent} flex items-center justify-center`}>
                        <Building2 className="w-4 h-4 text-white" />
                      </div>
                      <input
                        type="text"
                        value={loan.name}
                        onChange={e => updateLoan(loan.id, 'name', e.target.value)}
                        className="bg-transparent border-none text-white font-bold text-lg focus:outline-none focus:ring-0 w-28"
                        maxLength={20}
                      />
                    </div>
                    {loans.length > 2 && (
                      <button
                        onClick={() => removeLoan(loan.id)}
                        className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Remove this loan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Loan Amount */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Loan Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm pointer-events-none">{inputSym}</span>
                      <input
                        type="number"
                        value={loan.amount}
                        onChange={e => updateLoan(loan.id, 'amount', e.target.value)}
                        placeholder="e.g. 500000"
                        min={0}
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Interest Rate */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Interest Rate (% p.a.)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={loan.rate}
                        onChange={e => updateLoan(loan.id, 'rate', e.target.value)}
                        placeholder="e.g. 8.5"
                        min={0}
                        max={50}
                        step="0.1"
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm pointer-events-none">%</span>
                    </div>
                  </div>

                  {/* Tenure */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-400">Loan Tenure</label>
                      <div className="flex items-center gap-0.5 bg-white/5 border border-white/10 rounded-lg p-0.5">
                        {(['months', 'years'] as const).map(u => (
                          <button
                            key={u}
                            onClick={() => updateLoan(loan.id, 'tenureUnit', u)}
                            className={`px-2.5 py-1 text-[11px] rounded-md font-semibold transition-all ${
                              loan.tenureUnit === u ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'
                            }`}
                          >
                            {u.charAt(0).toUpperCase() + u.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={loan.tenure}
                        onChange={e => updateLoan(loan.id, 'tenure', e.target.value)}
                        placeholder={loan.tenureUnit === 'years' ? 'e.g. 5' : 'e.g. 60'}
                        min={1}
                        className="w-full pl-4 pr-16 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs pointer-events-none capitalize">{loan.tenureUnit}</span>
                    </div>
                  </div>

                  {/* Processing Fee */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Processing Fee <span className="text-slate-600">(optional)</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm pointer-events-none">{inputSym}</span>
                      <input
                        type="number"
                        value={loan.processingFee}
                        onChange={e => updateLoan(loan.id, 'processingFee', e.target.value)}
                        placeholder="0"
                        min={0}
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Error */}
                  {errors[loan.id] && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {errors[loan.id]}
                    </motion.div>
                  )}

                  {/* Quick result preview */}
                  {results.find(r => r.id === loan.id) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`bg-white/5 border border-white/10 rounded-xl p-3 space-y-1`}
                    >
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Monthly EMI</span>
                        <span className="text-white font-bold">{dispShort(results.find(r => r.id === loan.id)!.emi)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Total Interest</span>
                        <span className="text-amber-300 font-medium">{dispShort(results.find(r => r.id === loan.id)!.totalInterest)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Total Cost</span>
                        <span className="text-white font-bold">{dispShort(results.find(r => r.id === loan.id)!.totalCost)}</span>
                      </div>
                      {(results.find(r => r.id === loan.id)!.isBestEMI || results.find(r => r.id === loan.id)!.isBestCost) && (
                        <div className="flex gap-1.5 mt-1.5">
                          {results.find(r => r.id === loan.id)!.isBestEMI && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold">
                              <ArrowDown className="w-2.5 h-2.5" /> Lowest EMI
                            </span>
                          )}
                          {results.find(r => r.id === loan.id)!.isBestCost && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold">
                              <Award className="w-2.5 h-2.5" /> Best Cost
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Add Loan Button */}
          {loans.length < 5 && (
            <motion.button
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={addLoan}
              className="border-2 border-dashed border-white/10 hover:border-indigo-500/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-indigo-400 transition-all group min-h-[300px]"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-indigo-500/10 flex items-center justify-center transition-all">
                <Plus className="w-7 h-7" />
              </div>
              <span className="font-semibold text-sm">Add Another Loan</span>
              <span className="text-xs text-slate-600">Compare up to 5 loans</span>
            </motion.button>
          )}
        </div>

        {/* ══ COMPARISON TABLE ══ */}
        {results.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Comparison Table</h2>
                  <p className="text-slate-400 text-sm">Side-by-side analysis</p>
                </div>
              </div>
              {/* Display Currency */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 hidden sm:inline">Display:</span>
                <div className="flex flex-wrap gap-1.5">
                  {availableCurrencies.map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedResultCurrency(c as never)}
                      className={`px-2.5 py-1 text-[11px] rounded-full border font-medium transition-all ${
                        selectedResultCurrency === c
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-white/5 border-white/10 text-slate-500 hover:border-indigo-400 hover:text-slate-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/5 text-slate-400 font-semibold">
                    <th className="px-4 py-3.5 text-left">Loan</th>
                    <th className="px-4 py-3.5 text-right">Principal</th>
                    <th className="px-4 py-3.5 text-right">Rate</th>
                    <th className="px-4 py-3.5 text-right">Tenure</th>
                    <th className="px-4 py-3.5 text-right">EMI</th>
                    <th className="px-4 py-3.5 text-right">Total Interest</th>
                    <th className="px-4 py-3.5 text-right">Total Payment</th>
                    <th className="px-4 py-3.5 text-right">Processing Fee</th>
                    <th className="px-4 py-3.5 text-right">Total Cost</th>
                    <th className="px-4 py-3.5 text-center">Best</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => {
                    const color = LOAN_COLORS[loans.findIndex(l => l.id === r.id) % LOAN_COLORS.length];
                    const isBest = r.isBestEMI && r.isBestCost;
                    return (
                      <tr
                        key={r.id}
                        className={`border-t border-white/5 hover:bg-white/5 transition-colors ${
                          isBest ? 'bg-emerald-500/5' : ''
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${color.accent}`}></div>
                            <span className="text-white font-semibold">{r.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right text-slate-300">{dispShort(r.principalINR)}</td>
                        <td className="px-4 py-3.5 text-right text-slate-300">{r.rate}%</td>
                        <td className="px-4 py-3.5 text-right text-slate-300">{r.months} mo</td>
                        <td className={`px-4 py-3.5 text-right font-bold ${r.isBestEMI ? 'text-emerald-400' : 'text-white'}`}>
                          {disp(r.emi)}
                          {r.isBestEMI && <span className="ml-1.5 text-[10px] text-emerald-400">▼</span>}
                        </td>
                        <td className="px-4 py-3.5 text-right text-amber-300">{disp(r.totalInterest)}</td>
                        <td className="px-4 py-3.5 text-right text-slate-200 font-medium">{disp(r.totalPayment)}</td>
                        <td className="px-4 py-3.5 text-right text-slate-400">{r.processingFeeINR > 0 ? disp(r.processingFeeINR) : '—'}</td>
                        <td className={`px-4 py-3.5 text-right font-bold ${r.isBestCost ? 'text-emerald-400' : 'text-white'}`}>
                          {disp(r.totalCost)}
                          {r.isBestCost && <span className="ml-1.5 text-[10px] text-emerald-400">▼</span>}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {isBest ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                              <Award className="w-3.5 h-3.5" /> Best
                            </span>
                          ) : r.isBestEMI ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[11px] font-semibold">
                              Low EMI
                            </span>
                          ) : r.isBestCost ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[11px] font-semibold">
                              Low Cost
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ══ VISUAL COMPARISON BARS ══ */}
        {results.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
          >
            {/* EMI Comparison */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                EMI Comparison
              </h3>
              <div className="space-y-4">
                {results.map((r, i) => {
                  const maxEMI = Math.max(...results.map(x => x.emi));
                  const pct = maxEMI > 0 ? (r.emi / maxEMI) * 100 : 0;
                  const color = LOAN_COLORS[loans.findIndex(l => l.id === r.id) % LOAN_COLORS.length];
                  return (
                    <div key={r.id}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className={`font-semibold ${color.text}`}>{r.name}</span>
                        <span className={`font-bold ${r.isBestEMI ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {disp(r.emi)}/mo
                          {r.isBestEMI && <span className="ml-1 text-emerald-400 text-[10px]">★</span>}
                        </span>
                      </div>
                      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.1 }}
                          className={`h-full rounded-full ${color.accent}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Cost Comparison */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Total Cost Comparison
              </h3>
              <div className="space-y-4">
                {results.map((r, i) => {
                  const maxCost = Math.max(...results.map(x => x.totalCost));
                  const pct = maxCost > 0 ? (r.totalCost / maxCost) * 100 : 0;
                  const color = LOAN_COLORS[loans.findIndex(l => l.id === r.id) % LOAN_COLORS.length];
                  return (
                    <div key={r.id}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className={`font-semibold ${color.text}`}>{r.name}</span>
                        <span className={`font-bold ${r.isBestCost ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {dispShort(r.totalCost)}
                          {r.isBestCost && <span className="ml-1 text-emerald-400 text-[10px]">★</span>}
                        </span>
                      </div>
                      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.1 }}
                          className={`h-full rounded-full ${color.accent}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ SMART INSIGHTS ══ */}
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Smart Insights</h3>
                <p className="text-slate-400 text-xs">AI-powered analysis of your loan options</p>
              </div>
            </div>
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.1 }}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5"
                >
                  <Info className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-300 leading-relaxed">{insight}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ══ BEST OPTION HERO ══ */}
        {results.length >= 2 && (() => {
          const bestOverall = results.find(r => r.isBestEMI && r.isBestCost);
          const bestCostOnly = results.find(r => r.isBestCost);
          const winner = bestOverall || bestCostOnly;
          if (!winner) return null;
          const color = LOAN_COLORS[loans.findIndex(l => l.id === winner.id) % LOAN_COLORS.length];

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-gradient-to-r from-emerald-600/20 via-teal-600/15 to-cyan-600/20 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-2xl p-6 mb-6"
            >
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Award className="w-10 h-10 text-emerald-400" />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                    <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                      ✨ Best Option
                    </span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white mb-1">{winner.name}</h3>
                  <p className="text-slate-400 text-sm">
                    {bestOverall
                      ? 'Lowest EMI and lowest total cost — the clear winner!'
                      : 'Offers the lowest total cost among all options.'}
                  </p>
                </div>
                <div className="flex gap-6 text-center">
                  <div>
                    <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Monthly EMI</p>
                    <p className="text-2xl font-extrabold text-white">{dispShort(winner.emi)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Total Cost</p>
                    <p className="text-2xl font-extrabold text-white">{dispShort(winner.totalCost)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* ══ FORMULA BOX ══ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6"
        >
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">EMI Formula Used</p>
          <p className="font-mono text-sm text-slate-300 leading-relaxed mb-3">
            EMI = [P × R × (1+R)<sup>N</sup>] ÷ [(1+R)<sup>N</sup> − 1]
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
            <ul className="space-y-1 text-xs text-slate-500">
              <li><span className="text-indigo-400 font-semibold">P</span> = Principal loan amount</li>
              <li><span className="text-indigo-400 font-semibold">R</span> = Monthly interest rate (Annual ÷ 12 ÷ 100)</li>
              <li><span className="text-indigo-400 font-semibold">N</span> = Number of monthly installments</li>
            </ul>
            <ul className="space-y-1 text-xs text-slate-500">
              <li><span className="text-amber-400 font-semibold">Total Payment</span> = EMI × N</li>
              <li><span className="text-amber-400 font-semibold">Total Interest</span> = Total Payment − Loan Amount</li>
              <li><span className="text-amber-400 font-semibold">Total Cost</span> = Total Payment + Processing Fee</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
