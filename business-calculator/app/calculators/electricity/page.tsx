'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  Zap,
  AlertTriangle,
  Info,
  Layers,
  Battery
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

export default function ElectricityCalculator() {
  const {
    selectedInputCurrency,
    setSelectedInputCurrency,
    selectedResultCurrency,
    setSelectedResultCurrency,
    availableCurrencies,
    loading: ratesLoading,
    updateCurrencyRates,
    getCurrencySymbol,
    convertToINR,
    convertFromINR,
  } = useCurrency();

  // Inputs
  const [devicePower, setDevicePower] = useState('1500'); // in Watts by default
  const [powerUnit, setPowerUnit] = useState('W'); // 'W' or 'kW'
  const [hoursPerDay, setHoursPerDay] = useState('8');
  const [ratePerKwh, setRatePerKwh] = useState('0.15');

  // Results
  const [results, setResults] = useState<{
    dailyKwh: number;
    monthlyKwh: number;
    yearlyKwh: number;
    dailyCost: number;
    monthlyCost: number;
    yearlyCost: number;
  } | null>(null);

  const [error, setError] = useState('');

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);

  const calculate = useCallback(() => {
    setError('');

    const power = Number(devicePower);
    const hours = Number(hoursPerDay);
    const rate = Number(ratePerKwh);

    if (isNaN(power) || power < 0) {
      setError('Appliance power must be zero or positive.');
      return setResults(null);
    }
    if (isNaN(hours) || hours < 0 || hours > 24) {
      setError('Hours used per day must be between 0 and 24.');
      return setResults(null);
    }
    if (isNaN(rate) || rate < 0) {
      setError('Energy rate must be positive.');
      return setResults(null);
    }

    // Convert power to kW first
    const powerKw = powerUnit === 'W' ? power / 1000 : power;

    // Energy calculations
    const dailyKwh = powerKw * hours;
    const monthlyKwh = dailyKwh * 30; // approx
    const yearlyKwh = dailyKwh * 365;

    // Cost calculations on INR normalized rate if we assume rate is in input currency
    const inr = (val: number) => convertToINR(val, selectedInputCurrency);
    const rateInr = inr(rate);

    const dailyCost = dailyKwh * rateInr;
    const monthlyCost = monthlyKwh * rateInr;
    const yearlyCost = yearlyKwh * rateInr;

    setResults({
      dailyKwh,
      monthlyKwh,
      yearlyKwh,
      dailyCost,
      monthlyCost,
      yearlyCost
    });

  }, [devicePower, powerUnit, hoursPerDay, ratePerKwh, selectedInputCurrency, convertToINR]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  const handleReset = () => {
    setDevicePower('1500');
    setPowerUnit('W');
    setHoursPerDay('8');
    setRatePerKwh('0.15');
    setError('');
  };

  const disp = (inr: number) => fmtAmt(convertFromINR(inr, selectedResultCurrency), currSym);

  const barData = results ? [
    { name: 'Daily', Cost: convertFromINR(results.dailyCost, selectedResultCurrency) },
    { name: 'Monthly', Cost: convertFromINR(results.monthlyCost, selectedResultCurrency) },
    { name: 'Yearly', Cost: convertFromINR(results.yearlyCost, selectedResultCurrency) }
  ] : [];

  const pieData = results ? [
    { name: 'Usage Frame (Daily)', value: results.dailyKwh },
    { name: 'Idle Frame (Monthly Scale Approx)', value: results.monthlyKwh / 30 }
  ] : [];

  const PIE_COLORS = ['#eab308', '#3b82f6'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-indigo-100 dark:to-indigo-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-sm font-medium mb-4">
          <Zap className="w-4 h-4" />
          Utility Efficiency
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-900 dark:text-white tracking-tight mb-2">
          Electricity <span className="text-yellow-400">Calculator</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-lg">
          Determine the power consumption and estimated running costs of your appliances.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT — INPUTS */}
        <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-200 dark:border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">Appliance Details</h2>
              <p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">Input power specifications</p>
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
              className="w-full px-4 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all outline-none"
            >
              {availableCurrencies.map(c => (
                <option key={c} value={c} className="bg-white dark:bg-slate-800">{c} ({getCurrencySymbol(c)})</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 dark:border-gray-200 dark:border-white/10 pb-2">
              <Battery className="w-4 h-4"/> Hardware Data
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">Appliance Power</label>
                <div className="flex relative">
                   <input type="number" min={0} value={devicePower} onChange={e => setDevicePower(e.target.value)} className="w-2/3 px-4 py-2.5 rounded-l-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 border-r-0 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:border-yellow-500 transition-all font-semibold" />
                   <select value={powerUnit} onChange={e => setPowerUnit(e.target.value)} className="w-1/3 px-2 py-2.5 rounded-r-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-700 dark:text-slate-700 dark:text-slate-300 focus:outline-none focus:border-yellow-500 transition-all">
                     <option value="W">Watts</option>
                     <option value="kW">Kilowatts</option>
                   </select>
                </div>
              </div>
              
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">Usage (Hours per Day)</label>
                <div className="relative">
                  <input type="number" min={0} max={24} value={hoursPerDay} onChange={e => setHoursPerDay(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all font-semibold" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">Electricity Rate (per kWh)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                <input type="number" min={0} step="any" value={ratePerKwh} onChange={e => setRatePerKwh(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all font-semibold" />
              </div>
            </div>
            
          </div>

          <div className="mt-auto bg-gray-50 dark:bg-gray-50 dark:bg-slate-900/40 border border-gray-100 dark:border-gray-100 dark:border-white/5 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-600 dark:text-slate-400 flex items-start gap-3">
             <Info className="w-4 h-4 shrink-0 text-yellow-400" />
             <p>A typical AC unit might use 1000-2000W, a TV 100W, and an LED bulb 10W. Check your device's label or manual for exact wattage metrics.</p>
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
          <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6 h-full flex flex-col justify-center gap-4">
            
            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Display Currency</p>
              <div className="flex flex-wrap gap-2">
                {availableCurrencies.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedResultCurrency(c as never)}
                    className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${
                      selectedResultCurrency === c
                        ? 'bg-yellow-600 border-yellow-500 text-white'
                        : 'bg-white dark:bg-white dark:bg-white/5 border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-600 dark:text-slate-400 hover:border-yellow-400 hover:text-slate-800 dark:text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {results ? (
              <>
                <div className="border border-gray-200 dark:border-gray-200 dark:border-white/10 bg-gradient-to-r from-yellow-900/30 to-amber-900/30 rounded-xl p-5 shadow-inner text-center">
                  <p className="text-sm text-yellow-300 font-semibold mb-1 uppercase tracking-widest">Monthly Estimated Cost</p>
                  <p className="text-5xl font-extrabold text-slate-900 dark:text-slate-900 dark:text-white mb-2">{disp(results.monthlyCost)}</p>
                  <div className="inline-flex bg-gray-100 dark:bg-gray-100 dark:bg-black/20 rounded-full px-4 py-1 text-sm border border-gray-100 dark:border-gray-100 dark:border-white/5">
                    <span className="text-slate-700 dark:text-slate-700 dark:text-slate-300">Energy Run Rate:</span>
                    <span className="text-yellow-400 font-bold ml-2">{results.monthlyKwh.toFixed(1)} kWh/mo</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="rounded-xl border bg-gray-50 dark:bg-white dark:bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-gray-100 dark:border-white/5 p-4 flex flex-col items-center text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-600 dark:text-slate-400">Daily Cost</div>
                    <p className="font-bold text-lg text-slate-900 dark:text-slate-900 dark:text-white mb-1">{disp(results.dailyCost)}</p>
                    <p className="text-xs text-yellow-500/70">{results.dailyKwh.toFixed(2)} kWh</p>
                  </div>
                  <div className="rounded-xl border bg-gray-50 dark:bg-white dark:bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-gray-100 dark:border-white/5 p-4 flex flex-col items-center text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-600 dark:text-slate-400">Yearly Cost</div>
                    <p className="font-bold text-lg text-slate-900 dark:text-slate-900 dark:text-white mb-1">{disp(results.yearlyCost)}</p>
                    <p className="text-xs text-amber-500/70">{results.yearlyKwh.toFixed(0)} kWh</p>
                  </div>
                </div>
              </>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3 bg-gray-50 dark:bg-gray-50 dark:bg-slate-900/40 rounded-xl border border-gray-100 dark:border-gray-100 dark:border-white/5 flex-1">
                  <Layers className="w-10 h-10 opacity-30" />
                  <p className="text-sm">Supply telemetry data to render energy estimates.</p>
                </div>
            )}

          </div>
        </div>

      </div>

      {/* CHARTS SECTION */}
      {results && (
        <div className="max-w-6xl mx-auto mt-6">
          <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-900 dark:text-white mb-6">Financial Scale of Operation</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value >= 1000 ? (value/1000).toFixed(0)+'k' : value}`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '13px' }}
                    formatter={(value: number) => [`${currSym}${value.toLocaleString(undefined, {maximumFractionDigits:2})}`, 'Cost']}
                  />
                  <Bar dataKey="Cost" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#3b82f6' : '#eab308'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-slate-500 mt-2">Visual comparison of energy expenditure over time durations.</p>
          </div>
        </div>
      )}
    </div>
  );
}
