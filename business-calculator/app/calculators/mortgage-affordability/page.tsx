'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  RotateCcw,
  Home,
  AlertTriangle,
  CheckCircle,
  Info,
  Banknote,
  PiggyBank
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

export default function MortgageAffordabilityCalculator() {
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
  const [annualIncome, setAnnualIncome] = useState('120000');
  const [monthlyDebts, setMonthlyDebts] = useState('500');
  const [downPayment, setDownPayment] = useState('40000');
  const [interestRate, setInterestRate] = useState('6.5');
  const [loanTerm, setLoanTerm] = useState('30');
  const [propertyTaxRate, setPropertyTaxRate] = useState('1.2');
  const [homeInsurance, setHomeInsurance] = useState('1000');
  const [hoaFees, setHoaFees] = useState('0');

  // Results
  const [results, setResults] = useState<{
    maxHomePrice: number;
    maxLoanAmount: number;
    monthlyPayment: number;
    monthlyPrincipalInterest: number;
    monthlyTaxes: number;
    monthlyInsurance: number;
    monthlyHOA: number;
    frontEndRatio: number;
    backEndRatio: number;
  } | null>(null);

  const [error, setError] = useState('');

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);

  const calculate = useCallback(() => {
    setError('');

    const income = Number(annualIncome);
    const debts = Number(monthlyDebts) || 0;
    const down = Number(downPayment) || 0;
    const rate = Number(interestRate);
    const years = Number(loanTerm);
    const taxRate = Number(propertyTaxRate) || 0;
    const insurance = Number(homeInsurance) || 0;
    const hoa = Number(hoaFees) || 0;

    if (isNaN(income) || income <= 0) {
      setError('Annual income must be greater than zero.');
      return setResults(null);
    }
    if (isNaN(rate) || rate < 0 || rate > 30) {
      setError('Please enter a realistic interest rate (0% - 30%).');
      return setResults(null);
    }
    if (isNaN(years) || years <= 0 || years > 50) {
      setError('Tenure must be between 1 and 50 years.');
      return setResults(null);
    }

    const inr = (val: number) => convertToINR(val, selectedInputCurrency);

    const monthlyIncome = income / 12;
    // Standard lending rules: 28% front-end (housing cost), 36% back-end (total debts)
    const maxFrontendDTI = 0.28;
    const maxBackendDTI = 0.36;

    const maxHousingByFrontend = monthlyIncome * maxFrontendDTI;
    const maxHousingByBackend = (monthlyIncome * maxBackendDTI) - debts;

    const maxMonthlyHousingCost = Math.min(maxHousingByFrontend, maxHousingByBackend);

    if (maxMonthlyHousingCost <= (hoa + (insurance / 12))) {
      setError('Your income is too low or debts/fixed costs are too high to afford a mortgage under standard lending rules.');
      return setResults(null);
    }

    // Solve for max home price: 
    // Housing Cost = P&I + Taxes + Insurance/12 + HOA
    // P&I = maxMonthlyHousingCost - Taxes - Insurance/12 - HOA
    // Let HP = Home Price.
    // Loan Amount = HP - DownPayment
    // Taxes = HP * (taxRate / 100) / 12
    // Let R = maxMonthlyHousingCost - (insurance / 12) - hoa
    // R = P&I + Taxes
    // R = (HP - DownPayment) * EMI_Factor + HP * (taxRate / 100) / 12
    // R + DownPayment * EMI_Factor = HP * (EMI_Factor + (taxRate / 100) / 12)
    // HP = (R + DownPayment * EMI_Factor) / (EMI_Factor + (taxRate / 100) / 12)

    const monthlyRate = rate / 100 / 12;
    const numPayments = years * 12;
    const emiFactor = monthlyRate > 0 ? (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1) : (1 / numPayments);
    const monthlyTaxFactor = (taxRate / 100) / 12;

    const remainingForPIAndTax = maxMonthlyHousingCost - (insurance / 12) - hoa;

    const maxHomePriceRaw = (remainingForPIAndTax + down * emiFactor) / (emiFactor + monthlyTaxFactor);
    const maxLoanAmountRaw = maxHomePriceRaw - down;

    if (maxLoanAmountRaw <= 0) {
      setError('With the given parameters and down payment, a loan is not feasible or necessary.');
      return setResults(null);
    }

    const monthlyPI = maxLoanAmountRaw * emiFactor;
    const monthlyTaxesRaw = maxHomePriceRaw * monthlyTaxFactor;

    setResults({
      maxHomePrice: inr(maxHomePriceRaw),
      maxLoanAmount: inr(maxLoanAmountRaw),
      monthlyPayment: inr(maxMonthlyHousingCost),
      monthlyPrincipalInterest: inr(monthlyPI),
      monthlyTaxes: inr(monthlyTaxesRaw),
      monthlyInsurance: inr(insurance / 12),
      monthlyHOA: inr(hoa),
      frontEndRatio: (maxMonthlyHousingCost / monthlyIncome) * 100,
      backEndRatio: ((maxMonthlyHousingCost + debts) / monthlyIncome) * 100
    });

  }, [annualIncome, monthlyDebts, downPayment, interestRate, loanTerm, propertyTaxRate, homeInsurance, hoaFees, selectedInputCurrency, convertToINR]);

  useEffect(() => {
    calculate();
  }, [calculate, lastUpdatedTime]);

  const handleReset = () => {
    setAnnualIncome('120000');
    setMonthlyDebts('500');
    setDownPayment('40000');
    setInterestRate('6.5');
    setLoanTerm('30');
    setPropertyTaxRate('1.2');
    setHomeInsurance('1000');
    setHoaFees('0');
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
    if (results.frontEndRatio < 20 && results.backEndRatio < 30) return { text: "Your income easily supports this mortgage with plenty of buffer. You qualify comfortably within conservative lending limits.", type: "success" };
    if (results.backEndRatio > 36) return { text: "Debt pressure! You are pushing the upper limits of backend DTI (Debt-to-Income) approval. Try lowering debts or increasing the down payment.", type: "warning" };
    return { text: "Standard affordability. Your estimates follow the standard 28/36 mortgage qualifying ratios.", type: "info" };
  };

  const insight = getInsight();
  const insightStyle = {
    warning: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    info: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
  };
  const InsightIcon = insight ? { warning: AlertTriangle, success: CheckCircle, info: Info }[insight.type as keyof typeof insightStyle] : Info;


  const pieData = results ? [
    { name: 'Principal & Interest', value: convertFromINR(results.monthlyPrincipalInterest, selectedResultCurrency) },
    { name: 'Property Taxes', value: convertFromINR(results.monthlyTaxes, selectedResultCurrency) },
    { name: 'Home Insurance', value: convertFromINR(results.monthlyInsurance, selectedResultCurrency) },
    { name: 'HOA Fees', value: convertFromINR(results.monthlyHOA, selectedResultCurrency) }
  ].filter(d => d.value > 0) : [];

  const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-medium mb-4">
          <Home className="w-4 h-4" />
          Real Estate
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
          Mortgage <span className="text-emerald-400">Affordability</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Determine how much house you can afford based on the 28/36 lending rule.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT — INPUTS */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Financial Profile</h2>
              <p className="text-slate-400 text-sm">Enter your income and planned mortgage parameters</p>
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
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
            >
              {availableCurrencies.map(c => (
                <option key={c} value={c} className="bg-slate-800">{c} ({getCurrencySymbol(c)})</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
              <Banknote className="w-4 h-4"/> Income & Debt
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Annual Gross Income</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={annualIncome} onChange={e => setAnnualIncome(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Monthly Debts (Car, Cards)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={monthlyDebts} onChange={e => setMonthlyDebts(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold" />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-[13px] text-slate-300 mb-1">Down Payment Available</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                <input type="number" min={0} value={downPayment} onChange={e => setDownPayment(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold" />
              </div>
            </div>

          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
              <PiggyBank className="w-4 h-4"/> Terms & Costs
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Interest Rate (p.a.)</label>
                <div className="relative">
                  <input type="number" min={0} max={100} step={0.1} value={interestRate} onChange={e => setInterestRate(e.target.value)} className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Loan Tenure (Years)</label>
                <input type="number" min={1} max={50} value={loanTerm} onChange={e => setLoanTerm(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold" />
              </div>
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Property Tax Rate (p.a.)</label>
                <div className="relative">
                  <input type="number" min={0} max={10} step={0.1} value={propertyTaxRate} onChange={e => setPropertyTaxRate(e.target.value)} className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Annual Home Insurance</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={homeInsurance} onChange={e => setHomeInsurance(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[13px] text-slate-300 mb-1">Monthly HOA / Maintenance Fees</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={hoaFees} onChange={e => setHoaFees(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold" />
                </div>
              </div>
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
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">Purchase Budget</h2>
                <p className="text-slate-400 text-sm">Updated: <span className="text-emerald-300">{relTime}</span></p>
              </div>
              <button
                onClick={() => updateCurrencyRates()}
                disabled={ratesLoading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
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
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-emerald-400 hover:text-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {results ? (
              <div className="flex flex-col flex-1">
                <div className="border rounded-2xl p-5 mb-5 text-center bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border-emerald-500/30">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-emerald-300">
                    Maximum Home Price
                  </p>
                  <p className="text-5xl font-extrabold text-white tracking-tight mb-2">
                    {disp(results.maxHomePrice)}
                  </p>
                  <div className="inline-flex items-center justify-center bg-black/20 rounded-full px-4 py-1 text-sm border border-white/5">
                    <span className="text-slate-300 font-semibold mr-2">Est. Monthly Payment:</span>
                    <span className="text-emerald-400 font-bold">
                      {disp(results.monthlyPayment)} / mo
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl border bg-slate-800/50 border-white/5 p-4 flex flex-col gap-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-blue-400 to-indigo-500" />
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Max Loan Amount</div>
                    <p className="font-bold text-lg text-white">{disp(results.maxLoanAmount)}</p>
                  </div>
                  <div className="rounded-xl border bg-slate-800/50 border-white/5 p-4 flex flex-col gap-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-rose-400 to-pink-500" />
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Borrowing DTI</div>
                    <p className="font-bold text-lg text-white">{results.backEndRatio.toFixed(1)}%</p>
                  </div>
                </div>
                
                <div className="border border-white/5 rounded-xl overflow-hidden mb-5">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-slate-400 font-semibold text-xs border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3">Monthly Cost Breakdown</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300 text-xs shadow-inner">
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-2.5">Principal & Interest</td>
                        <td className="px-4 py-2.5 text-right font-medium">{disp(results.monthlyPrincipalInterest)}</td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-2.5">Property Taxes</td>
                        <td className="px-4 py-2.5 text-right font-medium">{disp(results.monthlyTaxes)}</td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-2.5">Home Insurance</td>
                        <td className="px-4 py-2.5 text-right font-medium">{disp(results.monthlyInsurance)}</td>
                      </tr>
                      {results.monthlyHOA > 0 && (
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-2.5">HOA / Maintenance</td>
                          <td className="px-4 py-2.5 text-right font-medium">{disp(results.monthlyHOA)}</td>
                        </tr>
                      )}
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
                <Home className="w-10 h-10 opacity-30" />
                <p className="text-sm">Input data to calculate your purchasing power.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CHARTS SECTION */}
      {results && (
        <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col">
            <h3 className="text-base font-bold text-white mb-2">Monthly Payment Breakdown</h3>
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
                    formatter={(value: number) => [`${currSym}${value.toLocaleString(undefined, {maximumFractionDigits: 2})}`, 'Amount']}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-6">Debt-to-Income (DTI) Guardrails</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: 'Front-End (Housing)', value: results.frontEndRatio }, { name: 'Back-End (Total Debt)', value: results.backEndRatio }]} margin={{ top: 10, right: 10, left: 0, bottom: 20 }} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={130} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '13px' }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'DTI Utilization']}
                  />
                  <ReferenceLine x={28} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'top', value: '28% Max Front', fill: '#10b981', fontSize: 10 }} />
                  <ReferenceLine x={36} stroke="#f43f5e" strokeDasharray="3 3" label={{ position: 'bottom', value: '36% Max Back', fill: '#f43f5e', fontSize: 10 }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                    {[{ name: 'Front-End (Housing)', value: results.frontEndRatio }, { name: 'Back-End (Total Debt)', value: results.backEndRatio }].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#8b5cf6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-slate-500 mt-4">* Based on standard 28/36 rule</p>
          </div>
          
        </div>
      )}
    </div>
  );
}
