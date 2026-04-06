'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  RotateCcw,
  Briefcase,
  DollarSign,
  User,
  Clock,
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

export default function PayrollCalculator() {
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
  const [employeeName, setEmployeeName] = useState('');
  
  // Salary Component Inputs
  const [basicSalary, setBasicSalary] = useState('50000');
  const [hra, setHra] = useState('15000');
  const [da, setDa] = useState('5000');
  const [bonus, setBonus] = useState('0');
  const [otherAllowances, setOtherAllowances] = useState('3000');

  // Deductions
  const [pfPercent, setPfPercent] = useState('12');
  const [incomeTaxPercent, setIncomeTaxPercent] = useState('10');
  const [professionalTax, setProfessionalTax] = useState('200');
  const [insurance, setInsurance] = useState('1500');
  const [otherDeductions, setOtherDeductions] = useState('0');

  // Work Details
  const [workingDays, setWorkingDays] = useState('22');
  const [overtimeHours, setOvertimeHours] = useState('0');
  const [overtimeRate, setOvertimeRate] = useState('500');

  // Results
  const [results, setResults] = useState<{
    grossSalary: number;
    allowances: number;
    overtimePay: number;
    totalEarnings: number;
    pfAmount: number;
    taxAmount: number;
    totalDeductions: number;
    netSalary: number;
  } | null>(null);

  const [error, setError] = useState('');

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);

  const calculate = useCallback(() => {
    setError('');
    
    // Parse
    const basic = Number(basicSalary) || 0;
    const h = Number(hra) || 0;
    const d = Number(da) || 0;
    const b = Number(bonus) || 0;
    const othersA = Number(otherAllowances) || 0;

    const pfP = Number(pfPercent) || 0;
    const taxP = Number(incomeTaxPercent) || 0;
    const pTax = Number(professionalTax) || 0;
    const ins = Number(insurance) || 0;
    const othersD = Number(otherDeductions) || 0;

    const otH = Number(overtimeHours) || 0;
    const otR = Number(overtimeRate) || 0;

    if (basic < 0 || h < 0 || d < 0 || b < 0 || othersA < 0 || pTax < 0 || ins < 0 || othersD < 0 || otH < 0 || otR < 0 || pfP < 0 || taxP < 0) {
      setError('Values cannot be negative.');
      return setResults(null);
    }

    if (basic === 0) {
      setError('Basic Salary must be greater than 0.');
      return setResults(null);
    }

    // Convert inputs to INR for consistent calculation logic
    const inr = (val: number) => convertToINR(val, selectedInputCurrency);

    const grossSalaryINR = inr(basic + h + d + b + othersA);
    const allowancesINR = inr(h + d + b + othersA);
    
    const overtimePayINR = inr(otH * otR);
    const pfAmountINR = inr(basic * (pfP / 100));
    const taxAmountINR = grossSalaryINR * (taxP / 100); // tax applied to gross
    const totalDeductionsINR = pfAmountINR + taxAmountINR + inr(pTax + ins + othersD);
    
    const netSalaryINR = grossSalaryINR + overtimePayINR - totalDeductionsINR;

    setResults({
      grossSalary: grossSalaryINR,
      allowances: allowancesINR,
      overtimePay: overtimePayINR,
      totalEarnings: grossSalaryINR + overtimePayINR,
      pfAmount: pfAmountINR,
      taxAmount: taxAmountINR,
      totalDeductions: totalDeductionsINR,
      netSalary: netSalaryINR
    });
  }, [
    basicSalary, hra, da, bonus, otherAllowances,
    pfPercent, incomeTaxPercent, professionalTax, insurance, otherDeductions,
    overtimeHours, overtimeRate,
    selectedInputCurrency, convertToINR
  ]);

  useEffect(() => {
    calculate();
  }, [calculate, lastUpdatedTime]);

  const handleReset = () => {
    setEmployeeName('');
    setBasicSalary('50000');
    setHra('15000');
    setDa('5000');
    setBonus('0');
    setOtherAllowances('3000');
    setPfPercent('12');
    setIncomeTaxPercent('10');
    setProfessionalTax('200');
    setInsurance('1500');
    setOtherDeductions('0');
    setWorkingDays('22');
    setOvertimeHours('0');
    setOvertimeRate('500');
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
    const deductionRatio = results.totalDeductions / results.totalEarnings;
    if (deductionRatio > 0.4) return { text: "High deductions are significantly reducing take-home pay.", type: "warning" };
    if (results.netSalary > results.grossSalary * 0.8) return { text: "Employee has a healthy salary structure with low tax/deduction burden.", type: "success" };
    return { text: "Salary structure is balanced.", type: "info" };
  };

  const insight = getInsight();
  const insightStyle = {
    warning: 'bg-red-500/10 border-red-500/30 text-red-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    info: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
  };
  const InsightIcon = insight ? { warning: AlertTriangle, success: CheckCircle, info: Info }[insight.type as keyof typeof insightStyle] : Info;

  const barData = results ? [
    { name: 'Basic', value: convertFromINR(convertToINR(Number(basicSalary), selectedInputCurrency), selectedResultCurrency) },
    { name: 'Allowances', value: convertFromINR(results.allowances, selectedResultCurrency) },
    { name: 'Overtime', value: convertFromINR(results.overtimePay, selectedResultCurrency) },
    { name: 'Deductions', value: convertFromINR(results.totalDeductions, selectedResultCurrency) }
  ] : [];

  const pieData = results ? [
    { name: 'Total Earnings', value: convertFromINR(results.totalEarnings, selectedResultCurrency) },
    { name: 'Total Deductions', value: convertFromINR(results.totalDeductions, selectedResultCurrency) }
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-indigo-100 dark:to-indigo-950 py-10 px-4">
      <div className="max-w-7xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-4">
          <Briefcase className="w-4 h-4" />
          HR Dashboard
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-900 dark:text-white tracking-tight mb-2">
          Payroll <span className="text-indigo-400">Calculator</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-lg">
          Calculate employee salary, deductions, and take-home pay efficiently.
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT — INPUTS */}
        <div className="lg:col-span-7 bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">Salary Components</h2>
              <p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">Enter earnings and deductions</p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-slate-900 dark:text-white bg-white dark:bg-white dark:bg-white/5 hover:bg-white/10 border border-gray-200 dark:border-gray-200 dark:border-white/10 rounded-lg transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-2">Input Currency</label>
              <select
                value={selectedInputCurrency}
                onChange={e => setSelectedInputCurrency(e.target.value as never)}
                disabled={ratesLoading}
                className="w-full px-4 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              >
                {availableCurrencies.map(c => (
                  <option key={c} value={c} className="bg-white dark:bg-slate-800">{c} ({getCurrencySymbol(c)})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-2">Employee Name (Optional)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400"><User className="w-4 h-4"/></span>
                <input
                  type="text"
                  value={employeeName}
                  onChange={e => setEmployeeName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Allowances */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 dark:border-gray-200 dark:border-white/10 pb-2">
                <Banknote className="w-4 h-4"/> Earnings
              </h3>
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">Basic Salary</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 font-bold text-xs">{inputSym}</span>
                  <input type="number" min={0} value={basicSalary} onChange={e => setBasicSalary(e.target.value)} className="w-full pl-8 pr-3 py-2 rounded-lg bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">HRA</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 font-bold text-xs">{inputSym}</span>
                  <input type="number" min={0} value={hra} onChange={e => setHra(e.target.value)} className="w-full pl-8 pr-3 py-2 rounded-lg bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">DA</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 font-bold text-xs">{inputSym}</span>
                    <input type="number" min={0} value={da} onChange={e => setDa(e.target.value)} className="w-full pl-8 pr-3 py-2 rounded-lg bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">Bonus</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 font-bold text-xs">{inputSym}</span>
                    <input type="number" min={0} value={bonus} onChange={e => setBonus(e.target.value)} className="w-full pl-8 pr-3 py-2 rounded-lg bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">Other Allowances</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 font-bold text-xs">{inputSym}</span>
                  <input type="number" min={0} value={otherAllowances} onChange={e => setOtherAllowances(e.target.value)} className="w-full pl-8 pr-3 py-2 rounded-lg bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none" />
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-red-300 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 dark:border-gray-200 dark:border-white/10 pb-2">
                <MinusCircle className="w-4 h-4"/> Deductions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">PF (%)</label>
                  <div className="relative">
                    <input type="number" min={0} max={100} value={pfPercent} onChange={e => setPfPercent(e.target.value)} className="w-full pl-3 pr-8 py-2 rounded-lg bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 font-bold text-xs">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">Tax (%)</label>
                  <div className="relative">
                    <input type="number" min={0} max={100} value={incomeTaxPercent} onChange={e => setIncomeTaxPercent(e.target.value)} className="w-full pl-3 pr-8 py-2 rounded-lg bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 font-bold text-xs">%</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">Insurance</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 font-bold text-xs">{inputSym}</span>
                  <input type="number" min={0} value={insurance} onChange={e => setInsurance(e.target.value)} className="w-full pl-8 pr-3 py-2 rounded-lg bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">Prof. Tax</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 font-bold text-xs">{inputSym}</span>
                    <input type="number" min={0} value={professionalTax} onChange={e => setProfessionalTax(e.target.value)} className="w-full pl-8 pr-3 py-2 rounded-lg bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">Other</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 font-bold text-xs">{inputSym}</span>
                    <input type="number" min={0} value={otherDeductions} onChange={e => setOtherDeductions(e.target.value)} className="w-full pl-8 pr-3 py-2 rounded-lg bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Work Details */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 dark:border-gray-200 dark:border-white/10 pb-2">
                <Clock className="w-4 h-4"/> Work & Overtime Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">Working Days</label>
                  <input type="number" min={0} value={workingDays} onChange={e => setWorkingDays(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">Overtime Hrs</label>
                  <input type="number" min={0} value={overtimeHours} onChange={e => setOvertimeHours(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-[13px] text-slate-700 dark:text-slate-700 dark:text-slate-300 mb-1">OT Rate / Hr</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-600 dark:text-slate-400 font-bold text-xs">{inputSym}</span>
                    <input type="number" min={0} value={overtimeRate} onChange={e => setOvertimeRate(e.target.value)} className="w-full pl-8 pr-3 py-2 rounded-lg bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none" />
                  </div>
                </div>
              </div>
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
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">Salary Slip</h2>
                <p className="text-slate-600 dark:text-slate-600 dark:text-slate-400 text-sm">Updated: <span className="text-indigo-300">{relTime}</span></p>
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
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Display Currency</p>
              <div className="flex flex-wrap gap-2">
                {availableCurrencies.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedResultCurrency(c as never)}
                    className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${
                      selectedResultCurrency === c
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-white dark:bg-white dark:bg-white/5 border-gray-200 dark:border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-600 dark:text-slate-400 hover:border-indigo-400 hover:text-slate-800 dark:text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {results ? (
              <div className="flex flex-col flex-1">
                {employeeName && (
                  <div className="mb-3">
                    <p className="text-xs text-slate-600 dark:text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">Employee</p>
                    <p className="text-lg text-slate-900 dark:text-slate-900 dark:text-white font-bold">{employeeName}</p>
                  </div>
                )}
                <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-2xl p-6 mb-4 text-center">
                  <p className="text-xs font-semibold text-emerald-300 uppercase tracking-widest mb-1">
                    Net Take-Home 💰
                  </p>
                  <p className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-900 dark:text-white tracking-tight mb-1">{disp(results.netSalary)}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl border bg-gray-50 dark:bg-white dark:bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-gray-100 dark:border-white/5 p-4 flex flex-col gap-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-600 dark:text-slate-400">Total Gross</div>
                    <p className="font-bold text-lg text-slate-900 dark:text-slate-900 dark:text-white">{disp(results.grossSalary)}</p>
                  </div>
                  <div className="rounded-xl border bg-red-900/20 border-red-500/20 p-4 flex flex-col gap-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-red-300">Deductions</div>
                    <p className="font-bold text-lg text-red-100">{disp(results.totalDeductions)}</p>
                  </div>
                </div>

                <div className="border border-gray-100 dark:border-gray-100 dark:border-white/5 rounded-xl overflow-hidden mb-5">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-white dark:bg-white/5 text-slate-600 dark:text-slate-600 dark:text-slate-400 font-semibold text-xs">
                      <tr>
                        <th className="px-3 py-2">Component</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-100 dark:divide-white/5 text-slate-700 dark:text-slate-700 dark:text-slate-300 text-xs">
                      <tr className="hover:bg-white dark:bg-white dark:bg-white/5">
                        <td className="px-3 py-2">Basic + Allowances</td>
                        <td className="px-3 py-2 text-right text-indigo-200">{disp(results.grossSalary)}</td>
                      </tr>
                      {results.overtimePay > 0 && (
                        <tr className="hover:bg-white dark:bg-white dark:bg-white/5">
                          <td className="px-3 py-2">Overtime Pay</td>
                          <td className="px-3 py-2 text-right text-emerald-200">{disp(results.overtimePay)}</td>
                        </tr>
                      )}
                      <tr className="bg-red-900/10">
                        <td className="px-3 py-2">Total Deductions</td>
                        <td className="px-3 py-2 text-right text-red-300">-{disp(results.totalDeductions)}</td>
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
                <Briefcase className="w-10 h-10 opacity-30" />
                <p className="text-sm">Enter salary details to compute.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      {results && (
        <div className="max-w-7xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-900 dark:text-white mb-6">Salary Breakdown</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value >= 1000 ? (value/1000).toFixed(0)+'k' : value}`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                    formatter={(value: number) => [`${currSym}${value.toLocaleString()}`, 'Amount']}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Deductions' ? '#ef4444' : (entry.name === 'Basic' ? '#6366f1' : '#10b981')} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-200 dark:border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl p-6 flex flex-col">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-900 dark:text-white mb-2">Earnings vs Deductions</h3>
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
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
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
