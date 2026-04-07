'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  Percent,
  AlertTriangle,
  Info,
  Layers,
  BarChart3
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function PercentageCalculator() {
  // Inputs
  const [value, setValue] = useState('50');
  const [total, setTotal] = useState('200');
  const [percentage, setPercentage] = useState('25');
  
  // New/Old for percentage change
  const [oldValue, setOldValue] = useState('100');
  const [newValue, setNewValue] = useState('120');

  // Results
  const [results, setResults] = useState<{
    result1: number; // X is what % of Y
    result2: number; // What is X% of Y
    result3: number; // X is Y% of what
    percentChange: number; // change from old to new
  } | null>(null);

  const calculate = useCallback(() => {
    const val = parseFloat(value) || 0;
    const tot = parseFloat(total) || 0;
    const pct = parseFloat(percentage) || 0;

    const oldV = parseFloat(oldValue) || 0;
    const newV = parseFloat(newValue) || 0;

    let r1 = 0, r2 = 0, r3 = 0, change = 0;

    if (tot !== 0) r1 = (val / tot) * 100;
    r2 = (pct / 100) * tot;
    if (pct !== 0) r3 = (val / pct) * 100;

    if (oldV !== 0) {
      change = ((newV - oldV) / oldV) * 100;
    }

    setResults({
      result1: r1,
      result2: r2,
      result3: r3,
      percentChange: change
    });
  }, [value, total, percentage, oldValue, newValue]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  const handleReset = () => {
    setValue('50');
    setTotal('200');
    setPercentage('25');
    setOldValue('100');
    setNewValue('120');
  };

  const getFormat = (n: number, isPct = false) => {
    if (!isFinite(n) || isNaN(n)) return '0.00';
    if (isPct) {
      return `${n.toFixed(2)}%`;
    }
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const barData = results ? [
    { name: 'X', value: Number(value) },
    { name: 'Y', value: Number(total) },
    { name: 'Z %', value: Number(percentage) }
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-indigo-100 dark:to-indigo-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium mb-4">
          <Percent className="w-4 h-4" />
          Proportional Logic
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
          Percentage <span className="text-blue-400">Calculator</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Calculate multi-directional percentage formulations simultaneously.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT — INPUTS */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Basic Operations</h2>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white bg-white dark:bg-white/5 hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 dark:border-white/10 pb-2">
              <Layers className="w-4 h-4"/> Ratio Values Setup
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-1">Value (X)</label>
                <div className="relative">
                  <input type="number" step="any" value={value} onChange={e => setValue(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold" />
                </div>
              </div>
              
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-1">Total (Y)</label>
                <div className="relative">
                  <input type="number" step="any" value={total} onChange={e => setTotal(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold" />
                </div>
              </div>

              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-1">Percentage (Z)</label>
                <div className="relative">
                  <input type="number" step="any" value={percentage} onChange={e => setPercentage(e.target.value)} className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">Edit X, Y, or Z to update all interconnected answers on the right instantly.</p>
          </div>

          <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-white/10">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 dark:border-white/10 pb-2">
              <BarChart3 className="w-4 h-4"/> Percentage Change
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-1">Old Value</label>
                <div className="relative">
                  <input type="number" step="any" value={oldValue} onChange={e => setOldValue(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold" />
                </div>
              </div>
              
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-1">New Value</label>
                <div className="relative">
                  <input type="number" step="any" value={newValue} onChange={e => setNewValue(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto bg-gray-50 dark:bg-gray-50 dark:bg-slate-900/40 border border-gray-100 dark:border-gray-100 dark:border-white/5 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
             <Info className="w-4 h-4 shrink-0 text-blue-400" />
             <p>A percentage is a number or ratio expressed as a fraction of 100. Useful for calculating discounts, tax amounts, profit margins, and growth metrics.</p>
          </div>

        </div>

        {/* RIGHT — RESULTS */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6 h-full flex flex-col justify-center gap-4">
            
            {results && (
              <>
                <div className="border border-gray-200 dark:border-white/10 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-xl p-5 shadow-inner">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1"><span className="text-slate-900 dark:text-white font-bold">{value}</span> is what % of <span className="text-slate-900 dark:text-white font-bold">{total}</span>?</p>
                  <p className="text-4xl font-extrabold text-blue-400">{getFormat(results.result1, true)}</p>
                </div>

                <div className="border border-gray-200 dark:border-white/10 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 shadow-inner">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">What is <span className="text-slate-900 dark:text-white font-bold">{percentage}%</span> of <span className="text-slate-900 dark:text-white font-bold">{total}</span>?</p>
                  <p className="text-4xl font-extrabold text-slate-900 dark:text-white">{getFormat(results.result2)}</p>
                </div>

                <div className="border border-gray-200 dark:border-white/10 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 shadow-inner">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1"><span className="text-slate-900 dark:text-white font-bold">{value}</span> is <span className="text-slate-900 dark:text-white font-bold">{percentage}%</span> of what number?</p>
                  <p className="text-4xl font-extrabold text-slate-900 dark:text-white">{getFormat(results.result3)}</p>
                </div>

                <div className={`border ${results.percentChange >= 0 ? 'border-emerald-500/30 bg-emerald-900/10' : 'border-rose-500/30 bg-rose-900/10'} rounded-xl p-5 shadow-inner mt-2`}>
                   <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Percentage Change (From <span className="text-slate-900 dark:text-white font-bold">{oldValue}</span> to <span className="text-slate-900 dark:text-white font-bold">{newValue}</span>):</p>
                   <div className="flex items-center gap-2">
                     <p className={`text-4xl font-extrabold ${results.percentChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                       {results.percentChange >= 0 ? '+' : ''}{getFormat(results.percentChange, true)}
                     </p>
                     <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${results.percentChange >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                       {results.percentChange >= 0 ? 'Increase' : 'Decrease'}
                     </span>
                   </div>
                </div>
              </>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
