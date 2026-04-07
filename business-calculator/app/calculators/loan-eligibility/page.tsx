'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  RotateCcw,
  TrendingUp,
  DollarSign,
  Wallet,
  AlertTriangle,
  CheckCircle,
  Info,
  ShieldCheck,
  BadgePercent,
  ArrowUpRight,
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Results {
  netMonthlyIncome: number; // INR
  eligibleEMI: number;      // INR
  loanAmount: number;       // INR
  months: number;
  debtBurden: number;       // ratio (existing EMIs / gross income)
  foir: number;             // 40% of net
}

// ─────────────────────────────────────────────
// Maths helpers
// ─────────────────────────────────────────────
function reverseLoan(emi: number, annualRate: number, months: number): number {
  if (annualRate === 0) return emi * months;
  const r = annualRate / 12 / 100;
  const pow = Math.pow(1 + r, months);
  return emi * (pow - 1) / (r * pow);
}

// ─────────────────────────────────────────────
// Format helpers
// ─────────────────────────────────────────────
function fmtAmt(n: number, sym: string, dec = 2): string {
  if (!isFinite(n) || n < 0) return `${sym}0.00`;
  return `${sym}${n.toLocaleString('en-IN', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  })}`;
}

function fmtShort(n: number, sym: string): string {
  if (!isFinite(n) || n < 0) return `${sym}0`;
  if (n >= 1_00_00_000) return `${sym}${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000)    return `${sym}${(n / 1_00_000).toFixed(2)} L`;
  if (n >= 1_000)       return `${sym}${(n / 1_000).toFixed(1)} K`;
  return `${sym}${n.toFixed(2)}`;
}

// ─────────────────────────────────────────────
// Smart insight
// ─────────────────────────────────────────────
function getInsight(netIncome: number, eligibleEMI: number, existingEMIs: number, grossIncome: number): {
  text: string; type: 'warning' | 'success' | 'info';
} {
  const ratio = eligibleEMI / grossIncome;
  const existingRatio = existingEMIs / grossIncome;

  if (netIncome <= 0)
    return { text: 'Your expenses exceed your income. Reduce expenses to improve eligibility.', type: 'warning' };
  if (existingRatio > 0.3)
    return { text: 'Existing EMIs are very high. Clearing them first will significantly boost eligibility.', type: 'warning' };
  if (ratio < 0.15)
    return { text: 'Your eligibility is low. Reduce expenses or increase income to qualify for a higher amount.', type: 'warning' };
  if (ratio >= 0.35)
    return { text: 'You are eligible for a higher loan amount. Strong income-to-EMI profile!', type: 'success' };
  return { text: `Good eligibility profile. Your eligible EMI is ${(ratio * 100).toFixed(0)}% of gross income.`, type: 'info' };
}

// ─────────────────────────────────────────────
// Gauge component (SVG)
// ─────────────────────────────────────────────
function Gauge({ pct, label }: { pct: number; label: string }) {
  const clampedPct = Math.min(Math.max(pct, 0), 100);
  // Half circle: stroke-dasharray on a circle of r=60, only top half (180° = πr)
  const r = 54;
  const circ = Math.PI * r; // half circumference
  const filled = (clampedPct / 100) * circ;
  const color = clampedPct < 30 ? '#ef4444' : clampedPct < 60 ? '#f59e0b' : '#22c55e';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="140" height="80" viewBox="0 0 140 80">
        {/* background arc */}
        <path
          d="M 10 75 A 60 60 0 0 1 130 75"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* filled arc */}
        <path
          d="M 10 75 A 60 60 0 0 1 130 75"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.8s ease, stroke 0.4s ease' }}
        />
        <text x="70" y="68" textAnchor="middle" fill={color} fontSize="20" fontWeight="900">
          {clampedPct.toFixed(0)}%
        </text>
      </svg>
      <p className="text-[11px] text-slate-600 dark:text-slate-400">{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────
function SliderInput({
  label,
  value,
  onChange,
  symbol,
  suffix,
  placeholder,
  min = 0,
  max,
  step = 1000,
  sliderMin,
  sliderMax,
  sliderStep,
  displayValue,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  symbol?: string;
  suffix?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
  displayValue?: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>
        {displayValue && <span className="text-indigo-300 font-bold text-sm">{displayValue}</span>}
      </div>
      <div className="relative mb-3">
        {symbol && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 font-bold text-sm pointer-events-none">
            {symbol}
          </span>
        )}
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          className={`w-full py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-600
            focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all
            ${symbol ? 'pl-9 pr-4' : suffix ? 'pl-4 pr-12' : 'px-4'}`}
        />
        {suffix && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 font-bold text-sm pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {sliderMax && (
        <>
          <input
            type="range"
            min={sliderMin ?? 0}
            max={sliderMax}
            step={sliderStep ?? step}
            value={Math.min(Number(value) || 0, sliderMax)}
            onChange={e => onChange(e.target.value)}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>{symbol}{(sliderMin ?? 0).toLocaleString('en-IN')}</span>
            <span>{symbol}{sliderMax.toLocaleString('en-IN')}</span>
          </div>
        </>
      )}
    </div>
  );
}

const accentMap: Record<string, string> = {
  indigo:  'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
  amber:   'bg-amber-500/10  border-amber-500/20  text-amber-300',
  violet:  'bg-violet-500/10 border-violet-500/20 text-violet-300',
};

function MetricCard({ icon, label, value, full, accent, large }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  full?: string;
  accent: string;
  large?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-2 ${accentMap[accent]}`} title={full}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-75">
        {icon} {label}
      </div>
      <p className={`font-extrabold tracking-tight ${large ? 'text-2xl' : 'text-xl'}`}>{value}</p>
      {full && full !== value && (
        <p className="text-[10px] opacity-60">{full}</p>
      )}
    </div>
  );
}

function BreakdownRow({ label, value, color, sub }: {
  label: string; value: string; color: string; sub?: string;
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-100 dark:border-white/5 last:border-0">
      <div>
        <p className="text-sm text-slate-700 dark:text-slate-300">{label}</p>
        {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
      </div>
      <span className={`font-bold text-sm ${color}`}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function LoanEligibilityCalculator() {
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
  const [income, setIncome]         = useState('80000');
  const [expenses, setExpenses]     = useState('25000');
  const [existingEMI, setExistingEMI] = useState('5000');
  const [rate, setRate]             = useState('10');
  const [tenure, setTenure]         = useState('20');
  const [tenureUnit, setTenureUnit] = useState<'years' | 'months'>('years');
  const [foirPct, setFoirPct]       = useState('40'); // adjustable FOIR

  // ── State ────────────────────────────────────
  const [results, setResults]   = useState<Results | null>(null);
  const [error, setError]       = useState('');

  const inputSym  = getCurrencySymbol(selectedInputCurrency);
  const resultSym = getCurrencySymbol(selectedResultCurrency);

  // ── Relative time ─────────────────────────────
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  const relTime = (() => {
    void tick;
    if (!lastUpdatedTime) return 'never';
    const s = Math.max(1, Math.floor((Date.now() - lastUpdatedTime) / 1000));
    if (s < 60)  return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60)  return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  })();

  // ── Calculation ──────────────────────────────
  const calculate = useCallback(() => {
    setError('');

    const incomeDisp  = Number(income);
    const expDisp     = Number(expenses);
    const emiDisp     = Number(existingEMI) || 0;
    const r           = Number(rate);
    const t           = Number(tenure);
    const foir        = Number(foirPct) || 40;

    if (!income || isNaN(incomeDisp) || incomeDisp <= 0) {
      setError('Enter a valid Monthly Income greater than 0.');
      setResults(null); return;
    }
    if (isNaN(expDisp) || expDisp < 0) {
      setError('Expenses cannot be negative.');
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

    const months      = tenureUnit === 'years' ? Math.round(t * 12) : Math.round(t);

    // Convert all monetary inputs to INR
    const grossINR    = convertToINR(incomeDisp, selectedInputCurrency);
    const expINR      = convertToINR(expDisp, selectedInputCurrency);
    const existEMIINR = convertToINR(emiDisp, selectedInputCurrency);

    const netINR      = grossINR - expINR - existEMIINR;
    const eligibleEMI = Math.max(0, netINR * (foir / 100));
    const loanAmt     = eligibleEMI > 0 ? reverseLoan(eligibleEMI, r, months) : 0;

    const debtBurden  = existEMIINR / grossINR;

    setResults({
      netMonthlyIncome: netINR,
      eligibleEMI,
      loanAmount: loanAmt,
      months,
      debtBurden,
      foir: foir / 100,
    });
  }, [income, expenses, existingEMI, rate, tenure, tenureUnit, foirPct, selectedInputCurrency, convertToINR]);

  useEffect(() => { calculate(); }, [calculate, lastUpdatedTime]);

  const handleReset = () => {
    setIncome('80000');
    setExpenses('25000');
    setExistingEMI('5000');
    setRate('10');
    setTenure('20');
    setTenureUnit('years');
    setFoirPct('40');
    setResults(null);
    setError('');
  };

  // ── Display helpers ──────────────────────────
  const disp      = (inr: number) => fmtAmt(convertFromINR(inr, selectedResultCurrency), resultSym);
  const dispShort = (inr: number) => fmtShort(convertFromINR(inr, selectedResultCurrency), resultSym);

  const insight = results
    ? getInsight(results.netMonthlyIncome, results.eligibleEMI,
        convertToINR(Number(existingEMI) || 0, selectedInputCurrency),
        convertToINR(Number(income) || 1, selectedInputCurrency))
    : null;

  const insightStyle: Record<string, string> = {
    warning: 'bg-amber-50 border-amber-400 text-amber-800',
    success: 'bg-emerald-50 border-emerald-400 text-emerald-800',
    info:    'bg-blue-50 border-blue-400 text-blue-800',
  };
  const InsightIcon = insight ? { warning: AlertTriangle, success: CheckCircle, info: Info }[insight.type] : Info;

  // Gauge pct: eligibleEMI as % of gross income (capped at 100)
  const gaugePct = results
    ? Math.min((results.eligibleEMI / convertToINR(Number(income) || 1, selectedInputCurrency)) * 100, 100)
    : 0;

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-indigo-100 dark:to-indigo-950 py-10 px-4">

      {/* Title */}
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-4">
          <ShieldCheck className="w-4 h-4" />
          Loan Planner
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
          Loan <span className="text-indigo-400">Eligibility</span> Calculator
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Find out how much loan you qualify for based on your income &amp; expenses.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ══ LEFT — INPUTS ══ */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6 flex flex-col gap-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Financials</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Enter income, expenses &amp; loan terms</p>
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

          {/* Monthly Income with slider */}
          <SliderInput
            label="Monthly Income"
            value={income}
            onChange={setIncome}
            symbol={inputSym}
            placeholder="e.g. 80000"
            step={1000}
            sliderMin={10000}
            sliderMax={1000000}
            sliderStep={5000}
            displayValue={`${inputSym}${Number(income || 0).toLocaleString('en-IN')}`}
          />

          {/* Monthly Expenses */}
          <SliderInput
            label="Monthly Expenses"
            value={expenses}
            onChange={setExpenses}
            symbol={inputSym}
            placeholder="e.g. 25000"
            step={500}
            sliderMin={0}
            sliderMax={500000}
            sliderStep={1000}
            displayValue={`${inputSym}${Number(expenses || 0).toLocaleString('en-IN')}`}
          />

          {/* Existing EMIs */}
          <SliderInput
            label="Existing EMIs (monthly)"
            value={existingEMI}
            onChange={setExistingEMI}
            symbol={inputSym}
            placeholder="e.g. 5000 (or 0)"
            step={500}
            sliderMin={0}
            sliderMax={200000}
            sliderStep={500}
            displayValue={`${inputSym}${Number(existingEMI || 0).toLocaleString('en-IN')}`}
          />

          {/* Interest Rate */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Interest Rate (% p.a.)</label>
              <span className="text-indigo-300 font-bold text-sm">{rate || 0}%</span>
            </div>
            <div className="relative mb-3">
              <input
                type="number"
                value={rate}
                onChange={e => setRate(e.target.value)}
                placeholder="e.g. 10"
                min={0}
                max={50}
                step={0.1}
                className="w-full pl-4 pr-12 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 font-bold text-sm pointer-events-none">%</span>
            </div>
            <input
              type="range" min={1} max={30} step={0.5}
              value={Math.min(Number(rate) || 1, 30)}
              onChange={e => setRate(e.target.value)}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1"><span>1%</span><span>30%</span></div>
          </div>

          {/* Tenure */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Loan Tenure</label>
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
                placeholder={tenureUnit === 'years' ? 'e.g. 20' : 'e.g. 240'}
                min={1}
                step={1}
                className="w-full pl-4 pr-20 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 font-bold text-sm pointer-events-none capitalize">{tenureUnit}</span>
            </div>
            <input
              type="range" min={1} max={tenureUnit === 'years' ? 30 : 360} step={1}
              value={Math.min(Number(tenure) || 1, tenureUnit === 'years' ? 30 : 360)}
              onChange={e => setTenure(e.target.value)}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>1 {tenureUnit === 'years' ? 'yr' : 'mo'}</span>
              <span>{tenureUnit === 'years' ? '30 yrs' : '360 mo'}</span>
            </div>
          </div>

          {/* FOIR slider */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                EMI-to-Income Ratio (FOIR)
                <span className="ml-1 text-[11px] text-slate-500 font-normal">Banks usually allow 40–50%</span>
              </label>
              <span className="text-indigo-300 font-bold text-sm">{foirPct}%</span>
            </div>
            <input
              type="range" min={20} max={60} step={5}
              value={Number(foirPct) || 40}
              onChange={e => setFoirPct(e.target.value)}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-violet-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1"><span>20%</span><span>60%</span></div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />{error}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={calculate}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-slate-900 dark:text-white font-bold text-base shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98]"
          >
            Check Eligibility
          </button>

          {/* Logic box */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">How It Works</p>
            <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
              <li><span className="text-indigo-400">①</span> Net Income = Income − Expenses − Existing EMIs</li>
              <li><span className="text-indigo-400">②</span> Eligible EMI = Net Income × FOIR%</li>
              <li><span className="text-indigo-400">③</span> Loan = EMI × [(1+R)^N − 1] ÷ [R × (1+R)^N]</li>
            </ul>
          </div>
        </div>

        {/* ══ RIGHT — RESULTS ══ */}
        <div className="flex flex-col gap-6">

          {/* Results card */}
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Eligibility Results</h2>
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
                    className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${
                      selectedResultCurrency === c
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
                {/* Hero Loan Amount */}
                <div className="bg-gradient-to-r from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 rounded-2xl p-5 mb-4 text-center">
                  <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" /> Eligible Loan Amount
                  </p>
                  <p className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {dispShort(results.loanAmount)}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{disp(results.loanAmount)}</p>
                </div>

                {/* Metric grid */}
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    icon={<Wallet className="w-5 h-5 text-emerald-400" />}
                    label="Net Monthly Income"
                    value={dispShort(results.netMonthlyIncome)}
                    full={disp(results.netMonthlyIncome)}
                    accent="emerald"
                  />
                  <MetricCard
                    icon={<BadgePercent className="w-5 h-5 text-violet-400" />}
                    label="Eligible EMI"
                    value={dispShort(results.eligibleEMI)}
                    full={disp(results.eligibleEMI)}
                    accent="violet"
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
                <ShieldCheck className="w-10 h-10 opacity-30" />
                <p className="text-sm">Fill in your details to check eligibility</p>
              </div>
            )}
          </div>

          {/* Gauge + Income Breakdown */}
          {results && (
            <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Income Analysis</h3>
              <div className="flex flex-col sm:flex-row gap-6 items-center">
                {/* Gauge */}
                <div className="flex flex-col items-center gap-2">
                  <Gauge pct={gaugePct} label="EMI affordability score" />
                  <p className="text-[11px] text-slate-500 text-center max-w-[130px]">
                    Eligible EMI as % of gross income
                  </p>
                </div>

                {/* Breakdown */}
                <div className="flex-1 w-full">
                  <BreakdownRow
                    label="Gross Monthly Income"
                    value={disp(convertToINR(Number(income) || 0, selectedInputCurrency))}
                    color="text-slate-800 dark:text-slate-800 dark:text-slate-200"
                  />
                  <BreakdownRow
                    label="Monthly Expenses"
                    value={`− ${disp(convertToINR(Number(expenses) || 0, selectedInputCurrency))}`}
                    color="text-red-400"
                    sub="Living costs, utilities, etc."
                  />
                  <BreakdownRow
                    label="Existing EMIs"
                    value={`− ${disp(convertToINR(Number(existingEMI) || 0, selectedInputCurrency))}`}
                    color="text-amber-400"
                    sub="Ongoing loan repayments"
                  />
                  <BreakdownRow
                    label="Net Disposable Income"
                    value={disp(results.netMonthlyIncome)}
                    color={results.netMonthlyIncome > 0 ? 'text-emerald-400' : 'text-red-400'}
                  />
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-white/10 flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Eligible EMI <span className="text-violet-400">({foirPct}% of net)</span></span>
                    <span className="font-extrabold text-violet-300">{disp(results.eligibleEMI)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Smart Insight */}
          {results && insight && (
            <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl border-l-4 ${insightStyle[insight.type]} transition-all`}>
              <InsightIcon className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Smart Insight</p>
                <p className="text-sm mt-0.5 opacity-90">{insight.text}</p>
              </div>
            </div>
          )}

          {/* Loan Summary Card */}
          {results && results.loanAmount > 0 && (
            <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Loan Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  icon={<DollarSign className="w-5 h-5 text-indigo-400" />}
                  label="Max Loan Amount"
                  value={dispShort(results.loanAmount)}
                  full={disp(results.loanAmount)}
                  accent="indigo"
                  large
                />
                <MetricCard
                  icon={<TrendingUp className="w-5 h-5 text-amber-400" />}
                  label="Loan Tenure"
                  value={`${results.months} mo`}
                  full={`${results.months} months (${(results.months / 12).toFixed(1)} years)`}
                  accent="amber"
                />
              </div>

              {/* Tips */}
              <div className="mt-4 bg-indigo-500/5 border border-indigo-500/15 rounded-xl p-4">
                <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">Tips to Improve Eligibility</p>
                <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <li>✦ Pay off existing EMIs to free up disposable income</li>
                  <li>✦ Reduce discretionary expenses (dining, subscriptions)</li>
                  <li>✦ Add a co-applicant to increase combined income</li>
                  <li>✦ Opt for a longer tenure to lower per-month EMI burden</li>
                  <li>✦ Maintain a credit score above 750 for better rates</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
