'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  RefreshCw,
  RotateCcw,
  TrendingUp,
  DollarSign,
  Percent,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Results {
  emi: number;           // INR
  totalPayment: number;  // INR
  totalInterest: number; // INR
  principalINR: number;  // INR
  months: number;
}

interface AmortRow {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
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
  if (n >= 1_00_000) return `${symbol}${(n / 1_00_000).toFixed(2)} L`;
  if (n >= 1_000) return `${symbol}${(n / 1_000).toFixed(1)} K`;
  return `${symbol}${n.toFixed(2)}`;
}

function calcEMI(p: number, annualRate: number, months: number): number {
  if (annualRate === 0) return p / months;
  const r = annualRate / 12 / 100;
  const pow = Math.pow(1 + r, months);
  return (p * r * pow) / (pow - 1);
}

function buildAmortisation(p: number, annualRate: number, months: number, emi: number): AmortRow[] {
  const r = annualRate / 12 / 100;
  const rows: AmortRow[] = [];
  let balance = p;
  for (let m = 1; m <= months; m++) {
    const interest = balance * r;
    const principal = emi - interest;
    balance = Math.max(0, balance - principal);
    rows.push({ month: m, emi, principal, interest, balance });
  }
  return rows;
}

function getInsight(rate: number, months: number, interestRatio: number): { text: string; type: 'warning' | 'success' | 'info' } {
  if (interestRatio > 0.5)
    return { text: `You'll pay ${(interestRatio * 100).toFixed(0)}% extra as interest. Consider a shorter tenure to save.`, type: 'warning' };
  if (rate > 15)
    return { text: 'High interest rate detected. Try negotiating with your lender for a better rate.', type: 'warning' };
  if (months > 240)
    return { text: 'Very long tenure. A shorter loan term will significantly reduce total interest.', type: 'info' };
  if (interestRatio < 0.2)
    return { text: 'Great deal! Your interest burden is low. You are in a strong repayment position.', type: 'success' };
  return { text: `Your EMI is well structured. Interest adds ${(interestRatio * 100).toFixed(0)}% over the principal.`, type: 'info' };
}

// ─────────────────────────────────────────────
// Pie Chart (SVG, no external dep)
// ─────────────────────────────────────────────
function PieChart({ principal, interest }: { principal: number; interest: number }) {
  const total = principal + interest;
  if (total <= 0) return null;
  const principalPct = (principal / total) * 100;
  const interestPct = (interest / total) * 100;

  const r = 70;
  const cx = 90;
  const cy = 90;
  const circumference = 2 * Math.PI * r;
  const principalLen = (principalPct / 100) * circumference;
  const interestLen = (interestPct / 100) * circumference;
  const gap = 3;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width="180" height="180" viewBox="0 0 180 180">
        {/* Interest arc */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="28"
          strokeDasharray={`${interestLen - gap} ${circumference - interestLen + gap}`}
          strokeDashoffset={0}
          style={{ transition: 'stroke-dasharray 0.7s ease' }}
        />
        {/* Principal arc */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#6366f1"
          strokeWidth="28"
          strokeDasharray={`${principalLen - gap} ${circumference - principalLen + gap}`}
          strokeDashoffset={-(interestLen - gap)}
          style={{ transition: 'stroke-dasharray 0.7s ease' }}
        />
        <circle cx={cx} cy={cy} r={r - 14} fill="rgba(15,23,42,0.7)" />
        <text x={cx} y={cy - 8} textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="600">Split</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#6366f1" fontSize="13" fontWeight="800">{principalPct.toFixed(0)}%</text>
        <text x={cx} y={cy + 26} textAnchor="middle" fill="#f59e0b" fontSize="11">{interestPct.toFixed(0)}% int.</text>
      </svg>
      <div className="flex gap-5 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" />
          <span className="text-slate-600 dark:text-slate-400">Principal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
          <span className="text-slate-600 dark:text-slate-400">Interest</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function EMICalculator() {
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

  // ── Inputs ───────────────────────────────────
  const [principal, setPrincipal] = useState('500000');
  const [rate, setRate] = useState('8.5');
  const [tenure, setTenure] = useState('5');
  const [tenureUnit, setTenureUnit] = useState<'years' | 'months'>('years');

  // ── Results ──────────────────────────────────
  const [results, setResults] = useState<Results | null>(null);
  const [amort, setAmort] = useState<AmortRow[]>([]);
  const [showAmort, setShowAmort] = useState(false);
  const [error, setError] = useState('');

  // ── Slider ref for max ───────────────────────
  const sliderMax = 10_000_000;

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);

  // ── Relative update time ─────────────────────
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

  // ── Calculation ──────────────────────────────
  const calculate = useCallback(() => {
    setError('');
    const pDisplay = Number(principal);
    const r = Number(rate);
    const t = Number(tenure);

    if (!principal || isNaN(pDisplay) || pDisplay <= 0) {
      setError('Enter a valid Loan Amount greater than 0.');
      setResults(null); return;
    }
    if (isNaN(r) || r < 0) {
      setError('Enter a valid Interest Rate (≥ 0).');
      setResults(null); return;
    }
    if (isNaN(t) || t <= 0) {
      setError('Enter a valid Tenure greater than 0.');
      setResults(null); return;
    }

    const months = tenureUnit === 'years' ? Math.round(t * 12) : Math.round(t);
    const principalINR = convertToINR(pDisplay, selectedInputCurrency);
    const emiVal = calcEMI(principalINR, r, months);
    const totalPayment = emiVal * months;
    const totalInterest = totalPayment - principalINR;

    setResults({ emi: emiVal, totalPayment, totalInterest, principalINR, months });
    setAmort(buildAmortisation(principalINR, r, months, emiVal));
  }, [principal, rate, tenure, tenureUnit, selectedInputCurrency, convertToINR]);

  useEffect(() => { calculate(); }, [calculate, lastUpdatedTime]);

  const handleReset = () => {
    setPrincipal('500000');
    setRate('8.5');
    setTenure('5');
    setTenureUnit('years');
    setResults(null);
    setAmort([]);
    setError('');
  };

  // ── Display helper ───────────────────────────
  const disp = (inr: number) => fmtAmt(convertFromINR(inr, selectedResultCurrency), currSym);
  const dispShort = (inr: number) => fmtShort(convertFromINR(inr, selectedResultCurrency), currSym);

  const insight = results
    ? getInsight(Number(rate), results.months, results.totalInterest / results.principalINR)
    : null;

  const insightStyle = {
    warning: 'bg-amber-50 border-amber-400 text-amber-800',
    success: 'bg-emerald-50 border-emerald-400 text-emerald-800',
    info: 'bg-blue-50 border-blue-400 text-blue-800',
  };
  const InsightIcon = insight ? { warning: AlertTriangle, success: CheckCircle, info: Info }[insight.type] : Info;

  // Amortisation display slice (first 12 months + last 3)
  const amortPreview = amort.length > 15
    ? [...amort.slice(0, 12), { month: -1, emi: 0, principal: 0, interest: 0, balance: 0 }, ...amort.slice(-3)]
    : amort;

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-indigo-100 dark:to-indigo-950 py-10 px-4">

      {/* Title */}
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-4">
          <TrendingUp className="w-4 h-4" />
          Loan Calculator
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
          EMI <span className="text-indigo-400">Calculator</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Plan your loan repayment — know your monthly installment instantly.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ══ LEFT — INPUTS ══ */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6 flex flex-col gap-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Loan Details</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Enter your loan parameters</p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white bg-white dark:bg-white/5 hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          {/* Input Currency */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Input Currency</label>
            <select
              value={selectedInputCurrency}
              onChange={e => { if (availableCurrencies.includes(e.target.value as never)) setSelectedInputCurrency(e.target.value as never); }}
              disabled={ratesLoading}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              {availableCurrencies.map(c => (
                <option key={c} value={c} className="bg-white dark:bg-slate-800">{c} ({getCurrencySymbol(c)})</option>
              ))}
            </select>
          </div>

          {/* Loan Amount + Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Loan Amount</label>
              <span className="text-indigo-300 font-bold text-sm">
                {inputSym}{Number(principal || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="relative mb-3">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 font-bold text-sm pointer-events-none">{inputSym}</span>
              <input
                type="number"
                value={principal}
                onChange={e => setPrincipal(e.target.value)}
                placeholder="e.g. 500000"
                min={0}
                step="1000"
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <input
              type="range"
              min={10000}
              max={sliderMax}
              step={10000}
              value={Math.min(Number(principal) || 10000, sliderMax)}
              onChange={e => setPrincipal(e.target.value)}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>{inputSym}10K</span>
              <span>{inputSym}1Cr</span>
            </div>
          </div>

          {/* Interest Rate */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Interest Rate (% p.a.)</label>
              <span className="text-indigo-300 font-bold text-sm">{rate || 0}%</span>
            </div>
            <div className="relative mb-3">
              <input
                type="number"
                value={rate}
                onChange={e => setRate(e.target.value)}
                placeholder="e.g. 8.5"
                min={0}
                max={50}
                step="0.1"
                className="w-full pl-4 pr-12 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 font-bold text-sm pointer-events-none">%</span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              step={0.1}
              value={Math.min(Number(rate) || 1, 30)}
              onChange={e => setRate(e.target.value)}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>1%</span><span>30%</span>
            </div>
          </div>

          {/* Tenure */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Loan Tenure</label>
              {/* Toggle */}
              <div className="flex items-center gap-1 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-0.5">
                {(['months', 'years'] as const).map(u => (
                  <button
                    key={u}
                    onClick={() => setTenureUnit(u)}
                    className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${tenureUnit === u ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white'}`}
                  >
                    {u.charAt(0).toUpperCase() + u.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative mb-3">
              <input
                type="number"
                value={tenure}
                onChange={e => setTenure(e.target.value)}
                placeholder={tenureUnit === 'years' ? 'e.g. 5' : 'e.g. 60'}
                min={1}
                step={1}
                className="w-full pl-4 pr-20 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 font-bold text-sm pointer-events-none capitalize">{tenureUnit}</span>
            </div>
            <input
              type="range"
              min={1}
              max={tenureUnit === 'years' ? 30 : 360}
              step={1}
              value={Math.min(Number(tenure) || 1, tenureUnit === 'years' ? 30 : 360)}
              onChange={e => setTenure(e.target.value)}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>1 {tenureUnit === 'years' ? 'yr' : 'mo'}</span>
              <span>{tenureUnit === 'years' ? '30 yrs' : '360 mo'}</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Calculate Button */}
          <button
            onClick={calculate}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-slate-900 dark:text-white font-bold text-base shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98]"
          >
            Calculate EMI
          </button>

          {/* Formula box */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">EMI Formula</p>
            <p className="font-mono text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              EMI = [P × R × (1+R)<sup>N</sup>] ÷ [(1+R)<sup>N</sup> − 1]
            </p>
            <ul className="mt-2 space-y-0.5 text-[11px] text-slate-500">
              <li><span className="text-indigo-400">P</span> = Principal loan amount</li>
              <li><span className="text-indigo-400">R</span> = Monthly interest rate (Annual ÷ 12 ÷ 100)</li>
              <li><span className="text-indigo-400">N</span> = Number of monthly installments</li>
            </ul>
          </div>
        </div>

        {/* ══ RIGHT — RESULTS ══ */}
        <div className="flex flex-col gap-6">

          {/* Results card */}
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Results</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Updated: <span className="text-indigo-300">{relTime}</span></p>
              </div>
              <button
                onClick={() => updateCurrencyRates()}
                disabled={ratesLoading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${ratesLoading ? 'animate-spin' : ''}`} />
                Update
              </button>
            </div>

            {/* Display Currency */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Display Currency</p>
              <div className="flex flex-wrap gap-2">
                {availableCurrencies.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedResultCurrency(c as never)}
                    className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${selectedResultCurrency === c
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-indigo-400 hover:text-slate-800 dark:text-slate-800 dark:text-slate-200'
                      }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {results ? (
              <>
                {/* Hero EMI */}
                <div className="bg-gradient-to-r from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 rounded-2xl p-5 mb-4 text-center">
                  <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest mb-1">Monthly EMI</p>
                  <p className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">{disp(results.emi)}</p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                    for {results.months} months
                  </p>
                </div>

                {/* Metric grid */}
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    icon={<DollarSign className="w-5 h-5 text-indigo-400" />}
                    label="Total Payment"
                    value={dispShort(results.totalPayment)}
                    full={disp(results.totalPayment)}
                    accent="indigo"
                  />
                  <MetricCard
                    icon={<Percent className="w-5 h-5 text-amber-400" />}
                    label="Total Interest"
                    value={dispShort(results.totalInterest)}
                    full={disp(results.totalInterest)}
                    accent="amber"
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
                <Calendar className="w-10 h-10 opacity-30" />
                <p className="text-sm">Enter loan details to see EMI</p>
              </div>
            )}
          </div>

          {/* Breakdown + Pie */}
          {results && (
            <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Payment Breakdown</h3>
              <div className="flex flex-col sm:flex-row gap-6 items-center">
                <PieChart
                  principal={results.principalINR}
                  interest={results.totalInterest}
                />
                <div className="flex-1 w-full space-y-3">
                  <BreakdownBar
                    label="Principal"
                    value={disp(results.principalINR)}
                    pct={results.principalINR / results.totalPayment * 100}
                    color="bg-indigo-500"
                    textColor="text-indigo-300"
                  />
                  <BreakdownBar
                    label="Interest"
                    value={disp(results.totalInterest)}
                    pct={results.totalInterest / results.totalPayment * 100}
                    color="bg-amber-500"
                    textColor="text-amber-300"
                  />
                  <div className="border-t border-gray-200 dark:border-white/10 pt-3 flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Total Payable</span>
                    <span className="text-slate-900 dark:text-white font-extrabold text-base">{disp(results.totalPayment)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Smart Insight */}
          {results && insight && (
            <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl border-l-4 ${insightStyle[insight.type]}`}>
              <InsightIcon className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Smart Insight</p>
                <p className="text-sm mt-0.5 opacity-90">{insight.text}</p>
              </div>
            </div>
          )}

          {/* Amortisation Table */}
          {results && amort.length > 0 && (
            <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6">
              <button
                onClick={() => setShowAmort(v => !v)}
                className="flex items-center justify-between w-full group"
              >
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-300 transition-colors">
                  Amortisation Schedule
                  <span className="ml-2 text-xs text-slate-500 font-normal">({amort.length} payments)</span>
                </h3>
                {showAmort ? <ChevronUp className="w-5 h-5 text-slate-600 dark:text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-600 dark:text-slate-400" />}
              </button>

              {showAmort && (
                <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-semibold">
                        <th className="px-3 py-3 text-left">Month</th>
                        <th className="px-3 py-3 text-right">EMI</th>
                        <th className="px-3 py-3 text-right">Principal</th>
                        <th className="px-3 py-3 text-right">Interest</th>
                        <th className="px-3 py-3 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(showAmort ? amort : amortPreview).map((row, i) => {
                        if (row.month === -1) {
                          return (
                            <tr key="dots" className="border-t border-gray-100 dark:border-gray-100 dark:border-white/5">
                              <td colSpan={5} className="px-3 py-2 text-center text-slate-600 text-xs">⋯ {amort.length - 15} more months ⋯</td>
                            </tr>
                          );
                        }
                        return (
                          <tr
                            key={row.month}
                            className={`border-t border-gray-100 dark:border-gray-100 dark:border-white/5 hover:bg-white/5 transition-colors ${row.month === amort.length ? 'bg-emerald-900/10' : ''
                              }`}
                          >
                            <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{row.month}</td>
                            <td className="px-3 py-2.5 text-right text-slate-700 dark:text-slate-300">{disp(row.emi)}</td>
                            <td className="px-3 py-2.5 text-right text-indigo-300">{disp(row.principal)}</td>
                            <td className="px-3 py-2.5 text-right text-amber-300">{disp(row.interest)}</td>
                            <td className="px-3 py-2.5 text-right text-slate-700 dark:text-slate-300">{disp(row.balance)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const accentMap: Record<string, string> = {
  indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
  amber: 'bg-amber-500/10  border-amber-500/20  text-amber-300',
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
};

function MetricCard({ icon, label, value, full, accent }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  full: string;
  accent: string;
}) {
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-2 ${accentMap[accent]}`} title={full}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-75">
        {icon} {label}
      </div>
      <p className="font-extrabold text-xl tracking-tight">{value}</p>
    </div>
  );
}

function BreakdownBar({ label, value, pct, color, textColor }: {
  label: string; value: string; pct: number; color: string; textColor: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className={`font-semibold ${textColor}`}>{label}</span>
        <span className="text-slate-700 dark:text-slate-300 font-bold">{value}</span>
      </div>
      <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="text-[11px] text-slate-500 mt-0.5">{pct.toFixed(1)}% of total</p>
    </div>
  );
}
