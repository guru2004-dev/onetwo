'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  RotateCcw,
  Archive,
  Plus,
  Trash2,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Info,
  Package,
  Layers
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

interface Batch {
  id: string;
  qty: string;
  cost: string;
}

interface BatchResult {
  id: string;
  originalQty: number;
  costPerUnit: number;
  remainingQty: number;
}

export default function InventoryCostCalculator() {
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
  const [batches, setBatches] = useState<Batch[]>([
    { id: '1', qty: '100', cost: '50' },
    { id: '2', qty: '150', cost: '55' }
  ]);
  const [quantitySold, setQuantitySold] = useState('180');

  // Results
  const [results, setResults] = useState<{
    cogs: number;
    remainingQty: number;
    remainingValue: number;
    totalPurchasedQty: number;
    batchDetails: BatchResult[];
  } | null>(null);

  const [error, setError] = useState('');

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);

  const addBatch = () => {
    setBatches([...batches, { id: Date.now().toString(), qty: '', cost: '' }]);
  };

  const removeBatch = (id: string) => {
    if (batches.length > 1) {
      setBatches(batches.filter(b => b.id !== id));
    }
  };

  const updateBatch = (id: string, field: keyof typeof batches[0], value: string) => {
    setBatches(batches.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const calculate = useCallback(() => {
    setError('');

    let hasError = false;
    const parsedBatches = batches.map(b => {
      const q = Number(b.qty);
      const c = Number(b.cost);
      if (isNaN(q) || q < 0 || isNaN(c) || c < 0) hasError = true;
      return { id: b.id, qty: q, cost: c };
    });

    const sold = Number(quantitySold);

    if (hasError) {
      setError('Enter valid quantities and costs for all batches (≥ 0).');
      return setResults(null);
    }
    if (isNaN(sold) || sold < 0) {
      setError('Enter a valid Quantity Sold (≥ 0).');
      return setResults(null);
    }

    const totalPurchasedQty = parsedBatches.reduce((sum, b) => sum + b.qty, 0);

    if (sold > totalPurchasedQty) {
      setError(`Cannot sell more than total inventory (${totalPurchasedQty} units).`);
      return setResults(null);
    }

    let remainingToSell = sold;
    let cogsINR = 0;
    let remainingValueINR = 0;
    let remainingQtyTotal = 0;

    const batchDetails: BatchResult[] = [];

    for (const batch of parsedBatches) {
      const batchCostINR = convertToINR(batch.cost, selectedInputCurrency);
      let remainingInBatch = batch.qty;

      if (remainingToSell > 0) {
        const soldFromBatch = Math.min(remainingInBatch, remainingToSell);
        cogsINR += soldFromBatch * batchCostINR;
        remainingInBatch -= soldFromBatch;
        remainingToSell -= soldFromBatch;
      }

      remainingValueINR += remainingInBatch * batchCostINR;
      remainingQtyTotal += remainingInBatch;

      batchDetails.push({
        id: batch.id,
        originalQty: batch.qty,
        costPerUnit: batchCostINR,
        remainingQty: remainingInBatch,
      });
    }

    setResults({
      cogs: cogsINR,
      remainingQty: remainingQtyTotal,
      remainingValue: remainingValueINR,
      totalPurchasedQty,
      batchDetails
    });
  }, [batches, quantitySold, selectedInputCurrency, convertToINR]);

  useEffect(() => {
    calculate();
  }, [calculate, lastUpdatedTime]);

  const handleReset = () => {
    setBatches([
      { id: '1', qty: '100', cost: '50' },
      { id: '2', qty: '150', cost: '55' }
    ]);
    setQuantitySold('180');
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
    const soldRatio = Number(quantitySold) / results.totalPurchasedQty;

    if (soldRatio > 0.9) return { text: "Inventory levels are critically low. Consider restocking soon.", type: "warning" };
    if (soldRatio > 0.7) return { text: "Inventory levels are getting low.", type: "info" };
    if (soldRatio < 0.2) return { text: "You have high remaining inventory. Ensure turnover to reduce holding costs.", type: "success" };
    return { text: "Healthy inventory turnover rate.", type: "info" };
  };

  const insight = getInsight();
  const insightStyle = {
    warning: 'bg-red-500/10 border-red-500/30 text-red-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    info: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
  };
  const InsightIcon = insight ? { warning: AlertTriangle, success: CheckCircle, info: Info }[insight.type as keyof typeof insightStyle] : Info;

  const barData = results ? [
    { name: 'Purchased', value: results.totalPurchasedQty },
    { name: 'Sold', value: Number(quantitySold) },
    { name: 'Remaining', value: results.remainingQty }
  ] : [];

  const pieData = results ? [
    { name: 'COGS', value: convertFromINR(results.cogs, selectedResultCurrency) },
    { name: 'Remaining Inventory Value', value: convertFromINR(results.remainingValue, selectedResultCurrency) }
  ] : [];

  const PIE_COLORS = ['#ef4444', '#10b981'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-4">
          <Archive className="w-4 h-4" />
          Accounting
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
          Inventory Cost <span className="text-indigo-400">(FIFO)</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Calculate Cost of Goods Sold and remaining inventory value using the First-In, First-Out method.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT — INPUTS */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Purchase & Sales</h2>
              <p className="text-slate-400 text-sm">Enter batches in chronological order</p>
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
              <Package className="w-4 h-4"/> Purchase Entries (In)
            </h3>
            
            <div className="space-y-3">
              {batches.map((batch, index) => (
                <div key={batch.id} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-400 mb-1">Qty (Batch {index + 1})</label>
                    <input
                      type="number"
                      value={batch.qty}
                      onChange={e => updateBatch(batch.id, 'qty', e.target.value)}
                      placeholder="0"
                      min={0}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-400 mb-1">Cost / Unit</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{inputSym}</span>
                      <input
                        type="number"
                        value={batch.cost}
                        onChange={e => updateBatch(batch.id, 'cost', e.target.value)}
                        placeholder="0.00"
                        min={0}
                        step="any"
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeBatch(batch.id)}
                    disabled={batches.length === 1}
                    className="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addBatch}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-xl hover:bg-indigo-500/30 transition-colors text-sm font-semibold w-full justify-center mt-2 border border-indigo-500/30"
            >
              <Plus className="w-4 h-4" /> Add Purchase Batch
            </button>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
              <Layers className="w-4 h-4"/> Sales / Usage (Out)
            </h3>
            <div>
              <label className="block text-[13px] text-slate-300 mb-1">Quantity Sold</label>
              <input
                type="number"
                value={quantitySold}
                onChange={e => setQuantitySold(e.target.value)}
                placeholder="0"
                min={0}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-lg font-semibold"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

        </div>

        {/* RIGHT — RESULTS */}
        <div className="flex flex-col gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">FIFO Analysis</h2>
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
              <>
                <div className="border border-red-500/30 rounded-2xl p-5 mb-4 text-center bg-gradient-to-r from-red-600/10 to-rose-600/10">
                  <p className="text-xs font-semibold text-red-300 uppercase tracking-widest mb-1">
                    Cost of Goods Sold (COGS)
                  </p>
                  <p className="text-4xl font-extrabold text-white tracking-tight">{disp(results.cogs)}</p>
                  <p className="text-slate-400 text-sm mt-1">
                    for {quantitySold} units sold
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl border bg-slate-800/50 border-white/5 p-4 flex flex-col gap-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1"><Package className="w-3 h-3"/> Remaining Qty</div>
                    <p className="font-bold text-xl text-white">{results.remainingQty} <span className="text-sm font-normal text-slate-500">units</span></p>
                  </div>
                  <div className="rounded-xl border bg-emerald-900/20 border-emerald-500/30 p-4 flex flex-col gap-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300 flex items-center gap-1"><DollarSign className="w-3 h-3"/> Inventory Value</div>
                    <p className="font-bold text-xl text-emerald-100">{disp(results.remainingValue)}</p>
                  </div>
                </div>

                {/* FIFO TABLE */}
                <h3 className="text-sm font-bold text-white mb-3">Batch Status (Remaining)</h3>
                <div className="border border-white/5 rounded-xl overflow-hidden mb-5">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-slate-400 font-semibold text-xs">
                      <tr>
                        <th className="px-3 py-2">Batch</th>
                        <th className="px-3 py-2 text-right">Cost</th>
                        <th className="px-3 py-2 text-right">Remaining</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300 text-xs">
                      {results.batchDetails.map((b, i) => (
                        <tr key={b.id} className={`hover:bg-white/5 ${b.remainingQty === 0 ? 'opacity-50' : ''}`}>
                          <td className="px-3 py-2.5">
                            Batch {i + 1}
                            {b.remainingQty === 0 && <span className="ml-2 px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[9px] uppercase tracking-wider">Sold Out</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right">{disp(b.costPerUnit)}</td>
                          <td className="px-3 py-2.5 text-right font-medium">
                            {b.remainingQty} <span className="text-slate-500">/ {b.originalQty}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {insight && (
                  <div className={`flex items-start gap-3 px-4 py-3 rounded-2xl border-l-4 ${insightStyle[insight.type as keyof typeof insightStyle]}`}>
                    <InsightIcon className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-xs">Insight</p>
                      <p className="text-xs mt-0.5 opacity-90">{insight.text}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3 bg-slate-900/40 rounded-xl border border-white/5">
                <Archive className="w-10 h-10 opacity-30" />
                <p className="text-sm">Enter purchase batches and sold quantity to analyze.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CHARTS SECTION */}
      {results && (
        <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-6">Quantity Flow</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                    formatter={(value: number) => [value, 'Units']}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Sold' ? '#3b82f6' : (entry.name === 'Purchased' ? '#6366f1' : '#10b981')} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col">
            <h3 className="text-base font-bold text-white mb-2">Cost Breakdown</h3>
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
                    formatter={(value: number) => [`${currSym}${value.toLocaleString(undefined, {maximumFractionDigits: 2})}`, 'Value']}
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
