'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  RotateCcw,
  Briefcase,
  AlertTriangle,
  CheckCircle,
  Info,
  Banknote,
  User,
  Building
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

export default function EPFCalculator() {
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
  const [basicSalary, setBasicSalary] = useState('50000'); // Monthly Basic + DA
  const [employeeContribution, setEmployeeContribution] = useState('12');
  const [employerContribution, setEmployerContribution] = useState('3.67'); // Standard EPF part
  const [rate, setRate] = useState('8.25'); // Typical EPF rate
  
  const [currentAge, setCurrentAge] = useState('25');
  const [retirementAge, setRetirementAge] = useState('58');
  const [currentBalance, setCurrentBalance] = useState('0');
  const [expectedSalaryHike, setExpectedSalaryHike] = useState('5'); // Annual % hike

  // Results
  const [results, setResults] = useState<{
    totalEmployeeCont: number;
    totalEmployerCont: number;
    totalInterest: number;
    maturityCorpus: number;
    growthData: { age: number, balance: number, employee: number, employer: number }[];
  } | null>(null);

  const [error, setError] = useState('');

  const currSym = getCurrencySymbol(selectedResultCurrency);
  const inputSym = getCurrencySymbol(selectedInputCurrency);

  const calculate = useCallback(() => {
    setError('');

    let basic = Number(basicSalary);
    const eePct = Number(employeeContribution);
    const erPct = Number(employerContribution);
    const r = Number(rate);
    const ageStart = Number(currentAge);
    const ageEnd = Number(retirementAge);
    const initialBal = Number(currentBalance);
    const hike = Number(expectedSalaryHike);

    if (isNaN(basic) || basic <= 0) {
      setError('Basic Salary must be greater than zero.');
      return setResults(null);
    }
    if (isNaN(eePct) || isNaN(erPct) || isNaN(r) || r < 0 || eePct < 0 || erPct < 0) {
      setError('Please enter valid percentages.');
      return setResults(null);
    }
    if (isNaN(ageStart) || isNaN(ageEnd) || ageStart >= ageEnd) {
      setError('Retirement age must be greater than current age.');
      return setResults(null);
    }
    if (ageEnd > 80) {
      setError('Maximum typical retirement projection age is 80 limit for precision.');
      return setResults(null);
    }

    const rateDecimal = r / 100;
    const hikeDecimal = hike / 100;
    const years = ageEnd - ageStart;

    let totalEmployee = 0;
    let totalEmployer = 0;
    let currentBalRaw = initialBal;
    
    // Growth timeline
    const growthData = [{ age: ageStart, balance: convertToINR(initialBal, selectedInputCurrency), employee: 0, employer: 0 }];

    for (let yr = 1; yr <= years; yr++) {
      // Contributions run monthly, but simple yearly modeling is common
      // Let's model monthly loop for higher accuracy:
      const annualBasic = basic * 12;
      const yearlyEE = annualBasic * (eePct / 100);
      const yearlyER = annualBasic * (erPct / 100);

      totalEmployee += yearlyEE;
      totalEmployer += yearlyER;

      // Add deposits and calculate interest.
      // Usually, interest is calculated on monthly running balances, but credited at year-end.
      // For a quick estimation calculator, Year-opening Balance + Mid-year average contribution
      const interestForYear = (currentBalRaw + (yearlyEE + yearlyER) / 2) * rateDecimal;
      currentBalRaw += yearlyEE + yearlyER + interestForYear;

      // Salary jumps for next year
      basic += basic * hikeDecimal;

      growthData.push({
        age: ageStart + yr,
        balance: convertToINR(currentBalRaw, selectedInputCurrency),
        employee: convertToINR(totalEmployee, selectedInputCurrency),
        employer: convertToINR(totalEmployer, selectedInputCurrency)
      });
    }

    const inr = (val: number) => convertToINR(val, selectedInputCurrency);

    setResults({
      totalEmployeeCont: inr(totalEmployee),
      totalEmployerCont: inr(totalEmployer),
      totalInterest: inr(currentBalRaw - initialBal - totalEmployee - totalEmployer),
      maturityCorpus: inr(currentBalRaw),
      growthData
    });
  }, [basicSalary, employeeContribution, employerContribution, rate, currentAge, retirementAge, currentBalance, expectedSalaryHike, selectedInputCurrency, convertToINR]);

  useEffect(() => {
    calculate();
  }, [calculate, lastUpdatedTime]);

  const handleReset = () => {
    setBasicSalary('50000');
    setEmployeeContribution('12');
    setEmployerContribution('3.67');
    setRate('8.25');
    setCurrentAge('25');
    setRetirementAge('58');
    setCurrentBalance('0');
    setExpectedSalaryHike('5');
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
    const isBigCorpus = results.maturityCorpus > convertToINR(10000000, selectedInputCurrency); // above 1 Cr roughly
    if (isBigCorpus) return { text: "Outstanding trajectory. The magic of salary increments paired with compounding EPF rates will generate a massive retirement safety net.", type: "success" };
    return { text: "Steady employer-employee matching effectively builds a resilient retirement corpus.", type: "info" };
  };

  const insight = getInsight();
  const insightStyle = {
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    info: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
  };
  const InsightIcon = insight ? { warning: AlertTriangle, success: CheckCircle, info: Info }[insight.type as keyof typeof insightStyle] : Info;

  const barData = results?.growthData.filter((d, i, arr) => i === 0 || i % 5 === 0 || i === arr.length - 1).map(d => ({
    name: `Age ${d.age}`,
    Total: convertFromINR(d.balance, selectedResultCurrency),
    'Employee Cont.': convertFromINR(d.employee, selectedResultCurrency),
    'Employer Cont.': convertFromINR(d.employer, selectedResultCurrency),
    Interest: convertFromINR(d.balance - d.employee - d.employer - convertToINR(Number(currentBalance), selectedInputCurrency), selectedResultCurrency)
  })) || [];

  const pieData = results ? [
    { name: 'Employee Total', value: convertFromINR(results.totalEmployeeCont, selectedResultCurrency) },
    { name: 'Employer Total', value: convertFromINR(results.totalEmployerCont, selectedResultCurrency) },
    { name: 'Total Compounded Interest', value: convertFromINR(results.totalInterest, selectedResultCurrency) }
  ] : [];

  const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-sm font-medium mb-4">
          <Briefcase className="w-4 h-4" />
          Career & Retirement
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
          EPF <span className="text-cyan-400">Calculator</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Project your ultimate Provident Fund corpus by retirement based on corporate matching and hikes.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT — INPUTS */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Employment Data</h2>
              <p className="text-slate-400 text-sm">Update your current PF standing</p>
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
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all outline-none"
            >
              {availableCurrencies.map(c => (
                <option key={c} value={c} className="bg-slate-800">{c} ({getCurrencySymbol(c)})</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
              <Banknote className="w-4 h-4"/> Salary Base
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Monthly Basic + DA</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                  <input type="number" min={0} value={basicSalary} onChange={e => setBasicSalary(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-semibold" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Expected Salary Hike (p.a.)</label>
                <div className="relative">
                  <input type="number" min={0} max={100} value={expectedSalaryHike} onChange={e => setExpectedSalaryHike(e.target.value)} className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-semibold" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[13px] text-slate-300 mb-1">Current EPF Balance (if any)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{inputSym}</span>
                <input type="number" min={0} value={currentBalance} onChange={e => setCurrentBalance(e.target.value)} className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-semibold" />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
              <User className="w-4 h-4"/> Matching & Horizon
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Employee Share</label>
                <div className="relative">
                  <input type="number" min={0} max={100} step={0.1} value={employeeContribution} onChange={e => setEmployeeContribution(e.target.value)} className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-semibold" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Employer Share (to EPF)</label>
                <div className="relative">
                  <input type="number" min={0} max={100} step={0.01} value={employerContribution} onChange={e => setEmployerContribution(e.target.value)} className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-semibold" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Current Age</label>
                <input type="number" min={18} max={80} value={currentAge} onChange={e => setCurrentAge(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-semibold" />
              </div>
              <div>
                <label className="block text-[13px] text-slate-300 mb-1">Age at Retirement</label>
                <input type="number" min={18} max={80} value={retirementAge} onChange={e => setRetirementAge(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-semibold" />
              </div>
            </div>
            
            <div className="pt-2">
              <label className="block text-[13px] text-slate-300 mb-1">EPF Interest Rate (p.a.)</label>
              <div className="relative sm:w-1/2">
                <input type="number" min={0} max={100} step={0.01} value={rate} onChange={e => setRate(e.target.value)} className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-semibold" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
              </div>
            </div>
          </div>

          <div className="mt-2 bg-slate-900/40 border border-white/5 rounded-xl p-4 text-xs text-slate-400">
            * Note: While typical employer PF contribution is 12%, standard divisions apply 8.33% to the EPS (Pension Scheme) up to a limit, leaving exactly 3.67% directed into this compounding EPF corpus.
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
                <h2 className="text-lg font-bold text-white">Retirement Target Yield</h2>
                <p className="text-slate-400 text-sm">Updated: <span className="text-cyan-300">{relTime}</span></p>
              </div>
              <button
                onClick={() => updateCurrencyRates()}
                disabled={ratesLoading}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
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
                        ? 'bg-cyan-600 border-cyan-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-cyan-400 hover:text-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {results ? (
              <div className="flex flex-col flex-1">
                <div className="border rounded-2xl p-5 mb-5 text-center bg-gradient-to-r from-cyan-600/10 to-blue-600/10 border-cyan-500/30">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-cyan-300">
                    Gross Final EPF Maturity
                  </p>
                  <p className="text-5xl font-extrabold text-white tracking-tight mb-2">
                    {disp(results.maturityCorpus)}
                  </p>
                  <div className="inline-flex items-center justify-center bg-black/20 rounded-full px-4 py-1 text-sm border border-white/5">
                    <span className="text-slate-300 font-semibold mr-2">Est. Active Years:</span>
                    <span className="text-emerald-400 font-bold">
                      {Number(retirementAge) - Number(currentAge)} Years
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl border bg-slate-800/50 border-white/5 p-4 flex flex-col gap-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-blue-400 to-indigo-500" />
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total You Invested</div>
                    <p className="font-bold text-lg text-white">{disp(results.totalEmployeeCont)}</p>
                  </div>
                  <div className="rounded-xl border bg-slate-800/50 border-white/5 p-4 flex flex-col gap-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-purple-400 to-pink-500" />
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Employer Output</div>
                    <p className="font-bold text-lg text-white">{disp(results.totalEmployerCont)}</p>
                  </div>
                </div>

                <div className="rounded-xl border bg-emerald-900/10 border-emerald-500/30 p-4 flex flex-col gap-1 relative overflow-hidden mb-5">
                  <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-emerald-400 to-teal-500" />
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Pure Interest Harvested Over Tenure</div>
                  <p className="font-bold text-xl text-emerald-200">{disp(results.totalInterest)}</p>
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
                <Building className="w-10 h-10 opacity-30" />
                <p className="text-sm">Input basic details to generate EPF pathing.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CHARTS SECTION */}
      {results && (
        <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-6">Stacked Compounding Progress</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value >= 1000 ? (value/1000).toFixed(0)+'k' : value}`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '13px' }}
                    formatter={(value: number, name: string) => [`${currSym}${value.toLocaleString(undefined, {maximumFractionDigits:0})}`, name]}
                  />
                  <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '10px' }} />
                  <Bar dataKey="Employee Cont." stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Employer Cont." stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Interest" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-slate-500 mt-4">* Chart marks intervals of 5 years to show long-term trend</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col">
            <h3 className="text-base font-bold text-white mb-2">Contributions vs Reward</h3>
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
        </div>
      )}
    </div>
  );
}
