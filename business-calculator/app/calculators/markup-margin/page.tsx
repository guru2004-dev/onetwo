'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, RotateCcw, TrendingUp, DollarSign, Percent, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Mode = 'cp-sp' | 'cp-markup' | 'cp-margin';

interface Results {
  sellingPrice: number;
  profit: number;
  markupPct: number;
  marginPct: number;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function fmt(n: number, symbol: string, decimals = 2): string {
  if (!isFinite(n)) return `${symbol}—`;
  return `${symbol}${n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

function fmtPct(n: number, decimals = 2): string {
  if (!isFinite(n)) return '—%';
  return `${n.toFixed(decimals)}%`;
}

function getInsight(marginPct: number): {
  text: string;
  type: 'warning' | 'success' | 'info';
} {
  if (!isFinite(marginPct) || marginPct <= 0)
    return { text: 'Enter valid values to see your margin insight.', type: 'info' };
  if (marginPct < 10)
    return { text: 'Your margin is very thin. Consider revising your pricing strategy.', type: 'warning' };
  if (marginPct < 20)
    return { text: 'Your margin is low. Consider increasing the selling price.', type: 'warning' };
  if (marginPct >= 40)
    return { text: 'Your profit margin is strong. Excellent pricing!', type: 'success' };
  return { text: `A ${marginPct.toFixed(1)}% margin is healthy. Keep monitoring your costs.`, type: 'info' };
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function MarkupMarginCalculator() {
  const {
    selectedInputCurrency,
    setSelectedInputCurrency,
    selectedResultCurrency,
    setSelectedResultCurrency,
    availableCurrencies,
    exchangeRates,
    loading: ratesLoading,
    updateCurrencyRates,
    lastUpdatedTime,
    getCurrencySymbol,
    convertToINR,
    convertFromINR,
    formatInSelectedCurrency,
  } = useCurrency();

  // ── State ────────────────────────────────────
  const [mode, setMode] = useState<Mode>('cp-markup');
  const [cpRaw, setCpRaw] = useState('1000');
  const [spRaw, setSpRaw] = useState('1500');
  const [markupRaw, setMarkupRaw] = useState('50');
  const [marginRaw, setMarginRaw] = useState('25');
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState('');

  const currencySymbol = getCurrencySymbol(selectedResultCurrency);

  // ── Calculation ──────────────────────────────
  const calculate = useCallback(() => {
    setError('');
    const cpDisplay = Number(cpRaw);
    if (!cpRaw || isNaN(cpDisplay) || cpDisplay <= 0) {
      setError('Please enter a valid Cost Price greater than 0.');
      setResults(null);
      return;
    }

    // Convert CP from display currency → INR for internal math
    const cp = convertToINR(cpDisplay, selectedInputCurrency);

    let sp = 0;

    if (mode === 'cp-sp') {
      const spDisplay = Number(spRaw);
      if (!spRaw || isNaN(spDisplay) || spDisplay <= 0) {
        setError('Please enter a valid Selling Price greater than 0.');
        setResults(null);
        return;
      }
      if (spDisplay <= cpDisplay) {
        setError('Selling Price must be greater than Cost Price.');
        setResults(null);
        return;
      }
      sp = convertToINR(spDisplay, selectedInputCurrency);
    } else if (mode === 'cp-markup') {
      const markup = Number(markupRaw);
      if (isNaN(markup) || markup < 0) {
        setError('Please enter a valid Markup % (≥ 0).');
        setResults(null);
        return;
      }
      sp = cp * (1 + markup / 100);
    } else {
      // cp-margin
      const margin = Number(marginRaw);
      if (isNaN(margin) || margin <= 0 || margin >= 100) {
        setError('Margin % must be between 0 and 100 (exclusive).');
        setResults(null);
        return;
      }
      sp = cp / (1 - margin / 100);
    }

    const profit = sp - cp;
    const markupPct = ((sp - cp) / cp) * 100;
    const marginPct = ((sp - cp) / sp) * 100;

    setResults({ sellingPrice: sp, profit, markupPct, marginPct });
  }, [mode, cpRaw, spRaw, markupRaw, marginRaw, selectedInputCurrency, convertToINR]);

  useEffect(() => {
    calculate();
  }, [calculate, lastUpdatedTime]);

  const handleReset = () => {
    setCpRaw('1000');
    setSpRaw('1500');
    setMarkupRaw('50');
    setMarginRaw('25');
    setMode('cp-markup');
    setResults(null);
    setError('');
  };

  // ── Display helpers ──────────────────────────
  const displayAmount = (inr: number) => {
    const converted = convertFromINR(inr, selectedResultCurrency);
    return fmt(converted, currencySymbol);
  };

  const insight = results ? getInsight(results.marginPct) : getInsight(-1);

  const insightColors = {
    warning: 'bg-amber-50 border-amber-400 text-amber-800',
    success: 'bg-emerald-50 border-emerald-400 text-emerald-800',
    info: 'bg-blue-50 border-blue-400 text-blue-800',
  };
  const InsightIcon = {
    warning: AlertTriangle,
    success: CheckCircle,
    info: Info,
  }[insight.type];

  // ── Relative update time ─────────────────────
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);
  const relativeTime = (() => {
    if (!lastUpdatedTime) return 'never';
    const sec = Math.max(1, Math.floor((Date.now() - lastUpdatedTime) / 1000));
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    return `${Math.floor(min / 60)}h ago`;
  })();
  void tick;

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 py-10 px-4">
      {/* ── Page Title ── */}
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-4">
          <TrendingUp className="w-4 h-4" />
          Business Calculator
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
          Markup <span className="text-indigo-400">vs</span> Margin
        </h1>
        <p className="text-slate-400 text-lg">
          Understand the real difference between Markup &amp; Margin — instantly.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ══════════════════════════════════════
            LEFT — INPUT CARD
        ══════════════════════════════════════ */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Inputs</h2>
              <p className="text-slate-400 text-sm">Select a mode and enter values</p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200"
              title="Reset all inputs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Calculation Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'cp-sp', label: 'Cost + Price', sub: 'CP & SP' },
                  { id: 'cp-markup', label: 'Markup Mode', sub: 'CP & Markup %' },
                  { id: 'cp-margin', label: 'Margin Mode', sub: 'CP & Margin %' },
                ] as { id: Mode; label: string; sub: string }[]
              ).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex flex-col items-center px-3 py-3 rounded-xl border text-center transition-all duration-200 ${
                    mode === m.id
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:border-indigo-500/50 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-bold leading-tight">{m.label}</span>
                  <span className="text-[10px] opacity-70 mt-0.5">{m.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Currency Selector for Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Input Currency</label>
            <select
              value={selectedInputCurrency}
              onChange={(e) => {
                const val = e.target.value;
                if (availableCurrencies.includes(val as never)) {
                  setSelectedInputCurrency(val as never);
                }
              }}
              disabled={ratesLoading}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              {availableCurrencies.map((c) => (
                <option key={c} value={c} className="bg-slate-800">
                  {c} ({getCurrencySymbol(c)})
                </option>
              ))}
            </select>
          </div>

          {/* Inputs */}
          <div className="flex flex-col gap-4">
            {/* Cost Price – always visible */}
            <NumberInput
              label="Cost Price (CP)"
              value={cpRaw}
              onChange={setCpRaw}
              symbol={getCurrencySymbol(selectedInputCurrency)}
              placeholder="e.g. 1000"
              min={0.01}
            />

            {/* SP – cp-sp mode */}
            {mode === 'cp-sp' && (
              <NumberInput
                label="Selling Price (SP)"
                value={spRaw}
                onChange={setSpRaw}
                symbol={getCurrencySymbol(selectedInputCurrency)}
                placeholder="e.g. 1500"
                min={0.01}
              />
            )}

            {/* Markup – cp-markup mode */}
            {mode === 'cp-markup' && (
              <NumberInput
                label="Markup (%)"
                value={markupRaw}
                onChange={setMarkupRaw}
                suffix="%"
                placeholder="e.g. 50"
                min={0}
              />
            )}

            {/* Margin – cp-margin mode */}
            {mode === 'cp-margin' && (
              <NumberInput
                label="Margin (%)"
                value={marginRaw}
                onChange={setMarginRaw}
                suffix="%"
                placeholder="e.g. 25"
                min={0.01}
                max={99.99}
              />
            )}
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
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-base shadow-lg shadow-indigo-500/30 transition-all duration-200 active:scale-[0.98]"
          >
            Calculate
          </button>

          {/* Formulas Reference */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Formula Reference</p>
            <ul className="space-y-1 text-xs text-slate-400">
              <li><span className="text-indigo-400 font-mono">Markup %</span> = (SP − CP) ÷ CP × 100</li>
              <li><span className="text-emerald-400 font-mono">Margin %</span> = (SP − CP) ÷ SP × 100</li>
              <li><span className="text-slate-300 font-mono">SP (from Markup)</span> = CP × (1 + Markup/100)</li>
              <li><span className="text-slate-300 font-mono">SP (from Margin)</span> = CP ÷ (1 − Margin/100)</li>
            </ul>
          </div>
        </div>

        {/* ══════════════════════════════════════
            RIGHT — RESULTS CARD
        ══════════════════════════════════════ */}
        <div className="flex flex-col gap-6">

          {/* Results Header */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">Results</h2>
                <p className="text-slate-400 text-sm">
                  Rates updated: <span className="text-indigo-300">{relativeTime}</span>
                </p>
              </div>
              <button
                onClick={() => updateCurrencyRates()}
                disabled={ratesLoading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all duration-200"
                title="Fetch latest exchange rates"
              >
                <RefreshCw className={`w-4 h-4 ${ratesLoading ? 'animate-spin' : ''}`} />
                Update
              </button>
            </div>

            {/* Result Currency Selector */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Display Currency</p>
              <div className="flex flex-wrap gap-2">
                {availableCurrencies.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedResultCurrency(c as never)}
                    className={`px-3 py-1 text-xs rounded-full border font-medium transition-all duration-200 ${
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

            {/* Metric Cards */}
            {results ? (
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  icon={<DollarSign className="w-5 h-5 text-indigo-400" />}
                  label="Selling Price"
                  value={displayAmount(results.sellingPrice)}
                  accent="indigo"
                  large
                />
                <MetricCard
                  icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
                  label="Profit"
                  value={displayAmount(results.profit)}
                  accent="emerald"
                  large
                />
                <MetricCard
                  icon={<Percent className="w-5 h-5 text-blue-400" />}
                  label="Markup %"
                  value={fmtPct(results.markupPct)}
                  accent="blue"
                />
                <MetricCard
                  icon={<Percent className="w-5 h-5 text-green-400" />}
                  label="Margin %"
                  value={fmtPct(results.marginPct)}
                  accent="green"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500 gap-3">
                <Percent className="w-10 h-10 opacity-30" />
                <p className="text-sm">Enter values and press Calculate</p>
              </div>
            )}
          </div>

          {/* Comparison Table */}
          {results && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
              <h3 className="text-base font-bold text-white mb-4">Markup vs Margin — Side-by-Side</h3>

              <div className="overflow-hidden rounded-xl border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="text-left px-4 py-3 text-slate-400 font-semibold w-1/3">Type</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-semibold w-1/3">Formula</th>
                      <th className="text-right px-4 py-3 text-slate-400 font-semibold w-1/3">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-2 font-bold text-blue-400">
                          <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                          Markup
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-500 font-mono text-xs">(SP−CP)÷CP×100</td>
                      <td className="px-4 py-4 text-right">
                        <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-extrabold text-base border border-blue-500/30">
                          {fmtPct(results.markupPct)}
                        </span>
                      </td>
                    </tr>
                    <tr className="border-t border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-2 font-bold text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                          Margin
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-500 font-mono text-xs">(SP−CP)÷SP×100</td>
                      <td className="px-4 py-4 text-right">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-base border border-emerald-500/30">
                          {fmtPct(results.marginPct)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Visual Bar Comparison */}
              <div className="mt-4 space-y-3">
                <BarCompare
                  label="Markup"
                  value={results.markupPct}
                  max={Math.max(results.markupPct, results.marginPct, 1)}
                  color="bg-blue-500"
                  textColor="text-blue-300"
                />
                <BarCompare
                  label="Margin"
                  value={results.marginPct}
                  max={Math.max(results.markupPct, results.marginPct, 1)}
                  color="bg-emerald-500"
                  textColor="text-emerald-300"
                />
              </div>

              {/* Note */}
              <p className="mt-3 text-[11px] text-slate-500 italic">
                * Markup is always higher than Margin for the same profit. e.g. 50% Markup = 33.33% Margin.
              </p>
            </div>
          )}

          {/* Smart Insight */}
          {results && (
            <div
              className={`flex items-start gap-3 px-5 py-4 rounded-2xl border-l-4 ${insightColors[insight.type]} transition-all duration-300`}
            >
              <InsightIcon className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Smart Insight</p>
                <p className="text-sm mt-0.5 opacity-90">{insight.text}</p>
              </div>
            </div>
          )}

          {/* Breakdown Summary */}
          {results && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
              <h3 className="text-base font-bold text-white mb-4">Price Breakdown</h3>
              <div className="space-y-3 text-sm">
                <BreakdownRow
                  label="Cost Price"
                  value={displayAmount(convertToINR(Number(cpRaw) || 0, selectedInputCurrency))}
                  color="text-slate-300"
                />
                <BreakdownRow
                  label="Profit"
                  value={displayAmount(results.profit)}
                  color="text-emerald-400"
                  positive
                />
                <div className="border-t border-white/10 pt-3">
                  <BreakdownRow
                    label="Selling Price"
                    value={displayAmount(results.sellingPrice)}
                    color="text-indigo-300"
                    large
                  />
                </div>
              </div>
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

interface NumberInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  symbol?: string;
  suffix?: string;
  placeholder?: string;
  min?: number;
  max?: number;
}

function NumberInput({ label, value, onChange, symbol, suffix, placeholder, min, max }: NumberInputProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        {symbol && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">
            {symbol}
          </span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step="any"
          className={`w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
            symbol ? 'pl-9 pr-4' : suffix ? 'pl-4 pr-12' : 'px-4'
          }`}
        />
        {suffix && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: 'indigo' | 'emerald' | 'blue' | 'green';
  large?: boolean;
}

const accentMap = {
  indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
  blue: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
  green: 'bg-green-500/10 border-green-500/20 text-green-300',
};

function MetricCard({ icon, label, value, accent, large }: MetricCardProps) {
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-2 ${accentMap[accent]}`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-80">
        {icon}
        {label}
      </div>
      <p className={`font-extrabold tracking-tight ${large ? 'text-2xl' : 'text-xl'}`}>{value}</p>
    </div>
  );
}

interface BarCompareProps {
  label: string;
  value: number;
  max: number;
  color: string;
  textColor: string;
}

function BarCompare({ label, value, max, color, textColor }: BarCompareProps) {
  const pct = isFinite(value) && isFinite(max) && max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-bold w-14 shrink-0 ${textColor}`}>{label}</span>
      <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-extrabold w-14 text-right ${textColor}`}>{isFinite(value) ? `${value.toFixed(2)}%` : '—'}</span>
    </div>
  );
}

interface BreakdownRowProps {
  label: string;
  value: string;
  color: string;
  positive?: boolean;
  large?: boolean;
}

function BreakdownRow({ label, value, color, positive, large }: BreakdownRowProps) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className={`font-bold ${large ? 'text-lg' : 'text-sm'} ${color} flex items-center gap-1`}>
        {positive && <span className="text-emerald-500">+</span>}
        {value}
      </span>
    </div>
  );
}
