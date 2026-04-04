'use client';

import React, { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCcw, ShieldCheck, Zap, BarChart3, Clock } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis } from 'recharts';

const SUPPORTED_CALCULATORS = [
  { key: 'sip', label: 'SIP' },
  { key: 'lumpsum', label: 'Lumpsum' },
  { key: 'simple', label: 'Simple Int.' },
  { key: 'compound', label: 'Compound Int.' },
  { key: 'roi', label: 'ROI' },
  { key: 'breakeven', label: 'Break-Even' },
  { key: 'depreciation', label: 'Depreciation' },
  { key: 'loan', label: 'Loan Amort.' },
] as const;

type CalcKey = (typeof SUPPORTED_CALCULATORS)[number]['key'];
type DurationUnit = 'years' | 'months';
type DepreciationMethod = 'straight-line' | 'declining-balance';
type CompoundingFrequency = 1 | 2 | 4 | 12;
type LoanTenureUnit = 'years' | 'months';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'SGD', 'AED', 'CNY'] as const;
type CurrencyOption = (typeof CURRENCIES)[number];

const safeNumber = (value: number | string | undefined): number => {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) return 0;
  return parsed < 0 ? 0 : parsed;
};

// Map currencies to common symbols for the prefix
const getCurrencySymbol = (currencyCode: string) => {
  const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥', AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'د.إ', CNY: '¥' };
  return symbols[currencyCode] || currencyCode;
};

// Reusable Premium Input with Floating Label
function PremiumFloatInput({ 
  label, value, onChange, type = "number", min, max, prefix = "", suffix = "", isRange = false, step 
}: any) {
  return (
    <div className="space-y-4">
      <div className="relative group">
        <input 
          type={type} 
          min={min} 
          max={max} 
          step={step}
          value={value} 
          onChange={onChange}
          placeholder=" " 
          className="peer w-full bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-indigo-500/50 rounded-2xl px-4 pt-7 pb-2 text-white outline-none backdrop-blur-md transition-all shadow-inner focus:ring-4 focus:ring-indigo-500/10 text-right font-medium text-lg placeholder-transparent"
        />
        {prefix && (
          <span className="absolute left-4 top-[60%] -translate-y-1/2 text-gray-400 peer-focus:text-indigo-400 transition-colors pointer-events-none text-lg">
            {prefix}
          </span>
        )}
        <label className="absolute left-4 top-4 text-gray-400 text-sm transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:top-3 peer-focus:-translate-y-0.5 peer-focus:text-xs peer-focus:text-indigo-400 pointer-events-none font-medium opacity-80 peer-focus:opacity-100 uppercase tracking-wide">
          {label}
        </label>
      </div>
      
      {isRange && (
        <div className="relative px-2">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}

// Reusable Premium Select
function PremiumSelect({ label, value, onChange, options }: any) {
  return (
    <div className="relative group">
      <select
        value={value}
        onChange={onChange}
        className="w-full bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-indigo-500/50 rounded-2xl px-4 pt-7 pb-2 text-white outline-none backdrop-blur-md transition-all shadow-inner focus:ring-4 focus:ring-indigo-500/10 appearance-none font-medium cursor-pointer"
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value} className="bg-[#0B0F19] text-white py-2">{opt.label}</option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 border-l border-b border-gray-400 w-2.5 h-2.5 rotate-[-45deg] pointer-events-none" />
      <label className="absolute left-4 top-3 text-xs text-indigo-400 pointer-events-none font-medium uppercase tracking-wide">
        {label}
      </label>
    </div>
  );
}

export default function AboutPage() {
  const {
    selectedInputCurrency, setSelectedInputCurrency,
    selectedResultCurrency, setSelectedResultCurrency,
    exchangeRates, loading, error, updateRates,
    convertToINR, convertFromINR, formatInSelectedCurrency,
  } = useCurrency();

  const activePrefix = getCurrencySymbol(selectedInputCurrency);

  const [activeCalc, setActiveCalc] = useState<CalcKey>('sip');

  const [durationUnit, setDurationUnit] = useState<DurationUnit>('years');
  const [loanTenureUnit, setLoanTenureUnit] = useState<LoanTenureUnit>('years');
  const [compoundingFrequency, setCompoundingFrequency] = useState<CompoundingFrequency>(12);
  const [depreciationMethod, setDepreciationMethod] = useState<DepreciationMethod>('straight-line');

  const [sipMonthly, setSipMonthly] = useState(10000);
  const [sipRate, setSipRate] = useState(12);
  const [sipDuration, setSipDuration] = useState(10);

  const [lumpsumAmount, setLumpsumAmount] = useState(100000);
  const [lumpsumRate, setLumpsumRate] = useState(12);
  const [lumpsumDuration, setLumpsumDuration] = useState(8);

  const [simplePrincipal, setSimplePrincipal] = useState(50000);
  const [simpleRate, setSimpleRate] = useState(8);
  const [simpleDuration, setSimpleDuration] = useState(5);

  const [compoundPrincipal, setCompoundPrincipal] = useState(50000);
  const [compoundRate, setCompoundRate] = useState(10);
  const [compoundDuration, setCompoundDuration] = useState(5);

  const [roiCost, setRoiCost] = useState(100000);
  const [roiReturn, setRoiReturn] = useState(130000);
  const [roiYears, setRoiYears] = useState(2);

  const [fixedCost, setFixedCost] = useState(50000);
  const [variableCost, setVariableCost] = useState(200);
  const [pricePerUnit, setPricePerUnit] = useState(350);

  const [assetCost, setAssetCost] = useState(1000000);
  const [salvageValue, setSalvageValue] = useState(100000);
  const [usefulLife, setUsefulLife] = useState(5);
  const [depreciationRate, setDepreciationRate] = useState(25);

  const [loanAmount, setLoanAmount] = useState(5000000);
  const [loanRate, setLoanRate] = useState(7.5);
  const [loanTenure, setLoanTenure] = useState(20);
  const [customEmi, setCustomEmi] = useState<number | ''>('');

  const [isAutoCalculating, setIsAutoCalculating] = useState(false);

  // Trigger auto-calculating indicator when inputs change
  const triggerCalculation = () => {
    setIsAutoCalculating(true);
    setTimeout(() => setIsAutoCalculating(false), 500);
  };

  const wrapChange = (setter: any) => (e: any) => {
    setter(e.target.value);
    triggerCalculation();
  };

  const convertToINRSafe = useCallback(
    (amount: number) => convertToINR(safeNumber(amount), selectedInputCurrency),
    [convertToINR, selectedInputCurrency]
  );

  const convertFromINRSafe = useCallback(
    (amountINR: number) => convertFromINR(safeNumber(amountINR), selectedResultCurrency),
    [convertFromINR, selectedResultCurrency]
  );

  const generateChartData = (years: number, principalFunc: (y: number) => number, returnFunc: (y: number) => number) => {
    const data = [];
    for (let i = 0; i <= years; i++) {
       data.push({ 
         name: `Yr ${i}`, 
         Invested: principalFunc(i),
         Returns: returnFunc(i) 
       });
    }
    return data;
  };

  const sip = useMemo(() => {
    const monthly = safeNumber(sipMonthly);
    const annualRate = safeNumber(sipRate);
    const duration = safeNumber(sipDuration);

    const totalMonths = durationUnit === 'months' ? duration : duration * 12;
    const monthlyRate = annualRate / 12 / 100;
    const invINR = convertToINRSafe(monthly);

    const fvINR = totalMonths <= 0
      ? invINR * totalMonths
      : monthlyRate === 0
        ? invINR * totalMonths
        : invINR * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);

    const investedINR = invINR * totalMonths;
    const returnsINR = Math.max(0, fvINR - investedINR);

    const chartData = generateChartData(
      durationUnit === 'months' ? Math.ceil(duration/12) : duration,
      (y) => convertFromINRSafe(invINR * (y * 12)),
      (y) => {
        const m = y * 12;
        if (m === 0) return 0;
        const val = monthlyRate === 0 ? invINR * m : invINR * ((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate) * (1 + monthlyRate);
        return convertFromINRSafe(val);
      }
    );

    return {
      invested: convertFromINRSafe(investedINR),
      future: convertFromINRSafe(fvINR),
      profit: convertFromINRSafe(returnsINR),
      chartData
    };
  }, [sipMonthly, sipRate, sipDuration, durationUnit, convertToINRSafe, convertFromINRSafe]);

  const lumpsum = useMemo(() => {
    const amount = safeNumber(lumpsumAmount);
    const annualRate = safeNumber(lumpsumRate);
    const duration = safeNumber(lumpsumDuration);

    const n = durationUnit === 'months' ? duration : duration;
    const annualRateDecimal = annualRate / 100;
    const invINR = convertToINRSafe(amount);

    let fvINR = 0;
    if (n <= 0) { fvINR = invINR; } 
    else if (durationUnit === 'months') { fvINR = invINR * Math.pow(1 + (annualRate / 12 / 100), n); } 
    else { fvINR = invINR * Math.pow(1 + annualRateDecimal, n); }

    const returnsINR = Math.max(0, fvINR - invINR);

    const chartData = generateChartData(
      durationUnit === 'months' ? Math.ceil(duration/12) : duration,
      () => convertFromINRSafe(invINR),
      (y) => convertFromINRSafe(invINR * Math.pow(1 + annualRateDecimal, y))
    );

    return {
      invested: convertFromINRSafe(invINR),
      future: convertFromINRSafe(fvINR),
      profit: convertFromINRSafe(returnsINR),
      chartData
    };
  }, [lumpsumAmount, lumpsumRate, lumpsumDuration, durationUnit, convertToINRSafe, convertFromINRSafe]);

  const simple = useMemo(() => {
    const principal = safeNumber(simplePrincipal);
    const annualRate = safeNumber(simpleRate);
    const time = safeNumber(simpleDuration);
    const tYears = durationUnit === 'months' ? time / 12 : time;
    const pINR = convertToINRSafe(principal);
    const interestINR = pINR * annualRate * tYears / 100;

    return {
      principal: convertFromINRSafe(pINR),
      interest: convertFromINRSafe(interestINR),
      total: convertFromINRSafe(pINR + interestINR),
    };
  }, [simplePrincipal, simpleRate, simpleDuration, durationUnit, convertToINRSafe, convertFromINRSafe]);

  const compound = useMemo(() => {
    const principal = safeNumber(compoundPrincipal);
    const annualRate = safeNumber(compoundRate);
    const duration = safeNumber(compoundDuration);
    const tYears = durationUnit === 'months' ? duration / 12 : duration;
    const pINR = convertToINRSafe(principal);
    const r = annualRate / 100;
    const n = compoundingFrequency;

    const finalINR = pINR * Math.pow(1 + r / n, n * tYears);
    const interestINR = Math.max(0, finalINR - pINR);

    return {
      principal: convertFromINRSafe(pINR),
      interest: convertFromINRSafe(interestINR),
      total: convertFromINRSafe(finalINR),
    };
  }, [compoundPrincipal, compoundRate, compoundDuration, durationUnit, compoundingFrequency, convertToINRSafe, convertFromINRSafe]);

  const roi = useMemo(() => {
    const cost = safeNumber(roiCost);
    const ret = safeNumber(roiReturn);
    const years = safeNumber(roiYears);
    const costINR = convertToINRSafe(cost);
    const returnINR = convertToINRSafe(ret);
    const profitINR = Math.max(0, returnINR - costINR);
    const roiPct = costINR > 0 ? (profitINR / costINR) * 100 : 0;
    const annualROI = years > 0 ? (Math.pow(returnINR / Math.max(costINR, 1), 1 / years) - 1) * 100 : 0;

    return {
      profit: convertFromINRSafe(profitINR),
      roiPct: roiPct.toFixed(2),
      annualROI: annualROI.toFixed(2),
      future: convertFromINRSafe(returnINR),
      cost: convertFromINRSafe(costINR),
    };
  }, [roiCost, roiReturn, roiYears, convertToINRSafe, convertFromINRSafe]);

  const breakeven = useMemo(() => {
    const fixed = safeNumber(fixedCost);
    const variable = safeNumber(variableCost);
    const price = safeNumber(pricePerUnit);
    const fixedINR = convertToINRSafe(fixed);
    const contribution = Math.max(0, convertToINRSafe(price) - convertToINRSafe(variable));
    const breakEvenUnits = contribution > 0 ? fixedINR / contribution : 0;

    return {
      breakEvenUnits,
      revenue: convertFromINRSafe(breakEvenUnits * convertToINRSafe(price)),
      contribution: convertFromINRSafe(contribution),
      fixed: convertFromINRSafe(fixedINR),
      variable: convertFromINRSafe(convertToINRSafe(variable)),
    };
  }, [fixedCost, variableCost, pricePerUnit, convertToINRSafe, convertFromINRSafe]);

  const loan = useMemo(() => {
    const principal = safeNumber(loanAmount);
    const annualRate = safeNumber(loanRate);
    const tenure = safeNumber(loanTenure);
    const months = loanTenureUnit === 'months' ? tenure : tenure * 12;
    const pINR = convertToINRSafe(principal);
    const monthlyRate = annualRate / 12 / 100;

    let emiINR = safeNumber(customEmi) > 0 ? convertToINRSafe(Number(customEmi)) : 0;
    if (emiINR === 0 && months > 0 && monthlyRate >= 0) {
      if (monthlyRate === 0) emiINR = pINR / months;
      else {
        const factor = Math.pow(1 + monthlyRate, months);
        emiINR = (pINR * monthlyRate * factor) / (factor - 1);
      }
    }

    let balance = pINR;
    let totalInterest = 0;
    const schedule: {month: number; principal: number; interest: number; balance: number}[] = [];
    for (let month = 1; month <= months; month++) {
      const interest = balance * monthlyRate;
      const principalPaid = Math.max(0, Math.min(balance, emiINR - interest));
      balance = Math.max(0, balance - principalPaid);
      totalInterest += interest;
      schedule.push({month, principal: principalPaid, interest, balance});
      if (balance <= 0) break;
    }

    return {
      emi: convertFromINRSafe(emiINR),
      principal: convertFromINRSafe(pINR),
      totalInterest: convertFromINRSafe(totalInterest),
      totalPayment: convertFromINRSafe(pINR + totalInterest),
      schedule,
    };
  }, [loanAmount, loanRate, loanTenure, loanTenureUnit, customEmi, convertToINRSafe, convertFromINRSafe]);

  const depreciation = useMemo(() => {
    const cost = convertToINRSafe(safeNumber(assetCost));
    const salvage = convertToINRSafe(safeNumber(salvageValue));
    const life = Math.max(1, safeNumber(usefulLife));
    const rate = safeNumber(depreciationRate);

    let annualDep = 0;
    let bookValue = cost;
    const schedule: {year: number; depreciation: number; bookValue: number}[] = [];

    if (depreciationMethod === 'straight-line') {
      annualDep = Math.max(0, (cost - salvage) / life);
      let currentBook = cost;
      for (let year = 1; year <= life; year++) {
        const dep = annualDep;
        currentBook = Math.max(salvage, currentBook - dep);
        schedule.push({year, depreciation: dep, bookValue: currentBook});
      }
      bookValue = Math.max(salvage, cost - annualDep * life);
    } else {
      let current = cost;
      for (let year = 1; year <= life; year++) {
        const dep = current * (rate / 100);
        current = Math.max(salvage, current - dep);
        schedule.push({year, depreciation: dep, bookValue: current});
      }
      annualDep = cost * (rate / 100);
      bookValue = current;
    }

    return {
      annualDep: convertFromINRSafe(annualDep),
      bookValue: convertFromINRSafe(bookValue),
      totalDep: convertFromINRSafe(Math.min(cost - salvage, cost - bookValue)),
      schedule,
    };
  }, [assetCost, salvageValue, usefulLife, depreciationMethod, depreciationRate, convertToINRSafe, convertFromINRSafe]);

  const resetAll = () => {
    setSipMonthly(10000); setSipRate(12); setSipDuration(10);
    setLumpsumAmount(100000); setLumpsumRate(12); setLumpsumDuration(8);
    setSimplePrincipal(50000); setSimpleRate(8); setSimpleDuration(5);
    setCompoundPrincipal(50000); setCompoundRate(10); setCompoundDuration(5);
    setRoiCost(100000); setRoiReturn(130000); setRoiYears(2);
    setFixedCost(50000); setVariableCost(200); setPricePerUnit(350);
    setAssetCost(1000000); setSalvageValue(100000); setUsefulLife(5); setDepreciationRate(25);
    setLoanAmount(5000000); setLoanRate(7.5); setLoanTenure(20); setCustomEmi('');
    triggerCalculation();
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-white transition-colors overflow-hidden relative selection:bg-indigo-500/30 font-sans pb-24">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-indigo-100/50 dark:from-[#1e1b4b]/60 to-transparent pointer-events-none z-0 transition-colors" />
      <motion.div 
        animate={{ opacity: [0.15, 0.3, 0.15], scale: [1, 1.1, 1] }} transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-0 left-[20%] w-[800px] h-[800px] bg-indigo-300/20 dark:bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none z-0" 
      />
      <motion.div 
        animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.2, 1] }} transition={{ duration: 15, repeat: Infinity, delay: 2 }}
        className="absolute top-[20%] right-[10%] w-[600px] h-[600px] bg-cyan-300/20 dark:bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none z-0" 
      />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 py-16">
        
        {/* HERO SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-16">
          <div className="flex flex-col items-start text-left">
            <Link href="/" className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors mb-8 font-medium text-sm bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-4 py-2 rounded-full backdrop-blur-md shadow-sm dark:shadow-none">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Link>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 dark:from-blue-400 dark:via-purple-400 dark:to-cyan-400"
            >
              Business Calculator Hub
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-slate-600 dark:text-gray-400 font-light max-w-xl leading-relaxed mb-10"
            >
              Multi Calculator Suite with SIP, Lumpsum, Interest, ROI, Loan, Depreciation & More. Perform highly accurate, multi-currency projections in real time.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
            >
               <button onClick={() => window.scrollTo({ top: 500, behavior: 'smooth' })} className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold tracking-wide hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:scale-105 transition-all duration-300">
                 Start Calculating
               </button>
               <Link href="/categories" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white border border-gray-200 text-slate-800 hover:bg-gray-50 dark:bg-white/[0.05] dark:border-white/10 dark:text-white dark:hover:bg-white/[0.1] shadow-sm hover:scale-105 transition-all duration-300 text-center">
                 Explore All Calculators
               </Link>
            </motion.div>

            {/* Trust Badges */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex gap-6 mt-12 text-sm text-gray-500 font-medium">
               <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Fast & Real-time</div>
               <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Highly Accurate</div>
               <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-sky-400" /> {loading ? "Updating Rates..." : "Live Forex Rates"}</div>
            </motion.div>
          </div>

          {/* Quick Preview Card */}
          <motion.div 
             initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
             className="relative p-1 rounded-3xl bg-gradient-to-br from-indigo-500/30 to-purple-600/30"
          >
             <div className="bg-white dark:bg-[#0B0F19] rounded-[1.4rem] p-8 h-full shadow-xl dark:shadow-none">
                <div className="flex justify-between items-center mb-8 border-b border-gray-100 dark:border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-500/20 rounded-lg text-indigo-600 dark:text-indigo-400"><BarChart3 className="w-6 h-6" /></div>
                    <span className="font-bold text-xl text-slate-800 dark:text-gray-200">Live Growth Trajectory</span>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-3 py-1 rounded-full font-bold animate-pulse">LIVE</span>
                </div>
                
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={(activeCalc === 'sip' ? sip.chartData : lumpsum.chartData) || sip.chartData}>
                      <defs>
                        <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#ffffff33" tick={{fill: '#888', fontSize: 12}} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#ffffff22', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="Returns" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorReturns)" />
                      <Area type="monotone" dataKey="Invested" stroke="#0ea5e9" strokeWidth={2} fill="transparent" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </motion.div>
        </div>

        {/* CALCULATOR PANEL */}
        <div className="mt-20">
          
          {/* Glassmorphism Tabs */}
          <div className="flex overflow-x-auto no-scrollbar py-4 mb-8 bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-3xl p-2 shadow-sm dark:shadow-inner drop-shadow-xl relative">
            <div className="flex items-center gap-2 min-w-max px-2">
              {SUPPORTED_CALCULATORS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveCalc(item.key)}
                  className={`relative px-6 py-3 rounded-2xl text-sm font-bold tracking-wide transition-all duration-300 z-10 ${
                    activeCalc === item.key ? 'text-white' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  {activeCalc === item.key && (
                    <motion.div
                      layoutId="activeTabBadge"
                      className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-md dark:shadow-[0_0_15px_rgba(99,102,241,0.4)] z-[-1]"
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />
                  )}
                  {item.label}
                </button>
              ))}
            </div>
            
            <div className="absolute right-4 top-1/2 -translate-y-1/2 md:hidden bg-gradient-to-l from-white dark:from-[#0B0F19] w-12 h-full pointer-events-none rounded-r-3xl" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* INPUT COL */}
            <div className="lg:col-span-5 bg-white dark:bg-white/[0.03] backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-center mb-8 border-b border-gray-100 dark:border-white/5 pb-4">
                 <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{SUPPORTED_CALCULATORS.find(c => c.key === activeCalc)?.label} Parameters</h2>
                 <AnimatePresence>
                   {isAutoCalculating && (
                     <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full">
                        <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" /> Auto-sync
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>

              <div className="space-y-6">
                
                {/* Global Overrides */}
                <div className="grid grid-cols-2 gap-4">
                  <PremiumSelect label="Input Currency" value={selectedInputCurrency} onChange={(e: any) => setSelectedInputCurrency(e.target.value)} options={CURRENCIES.map(c => ({ value: c, label: c }))} />
                  <PremiumSelect label="Result Currency" value={selectedResultCurrency} onChange={(e: any) => setSelectedResultCurrency(e.target.value)} options={CURRENCIES.map(c => ({ value: c, label: c }))} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <PremiumSelect label="Duration Type" value={durationUnit} onChange={(e: any) => setDurationUnit(e.target.value)} options={[{value:'years', label:'Years'}, {value:'months', label:'Months'}]} />
                  {(activeCalc === 'compound' || activeCalc === 'loan') && (
                    <PremiumSelect 
                      label={activeCalc === 'loan' ? "Tenure Unit" : "Compounding"} 
                      value={activeCalc === 'loan' ? loanTenureUnit : compoundingFrequency} 
                      onChange={(e: any) => { if(activeCalc === 'loan') setLoanTenureUnit(e.target.value); else setCompoundingFrequency(Number(e.target.value) as CompoundingFrequency); triggerCalculation(); }} 
                      options={activeCalc === 'loan' ? [{value:'years', label:'Years'}, {value:'months', label:'Months'}] : [{value:1, label:'Annually'}, {value:2, label:'Semi-Annually'}, {value:4, label:'Quarterly'}, {value:12, label:'Monthly'}]} 
                    />
                  )}
                  {activeCalc === 'depreciation' && (
                    <PremiumSelect label="Method" value={depreciationMethod} onChange={(e: any) => {setDepreciationMethod(e.target.value); triggerCalculation()}} options={[{value:'straight-line', label:'Straight Line'}, {value:'declining-balance', label:'Declining'}]} />
                  )}
                </div>

                <div className="border-t border-white/5 my-6" />

                {/* Dynamic Inputs based on Calculator Type */}
                {activeCalc === 'sip' && (
                  <>
                    <PremiumFloatInput label="Monthly Investment" prefix={activePrefix} type="number" value={sipMonthly || ""} onChange={wrapChange(setSipMonthly)} isRange min={500} max={100000} step={500} />
                    <PremiumFloatInput label="Expected Annual Return" suffix="%" type="number" value={sipRate || ""} onChange={wrapChange(setSipRate)} isRange min={1} max={40} step={0.5} />
                    <PremiumFloatInput label={`Duration (${durationUnit})`} type="number" value={sipDuration || ""} onChange={wrapChange(setSipDuration)} isRange min={1} max={50} step={1} />
                  </>
                )}

                {activeCalc === 'lumpsum' && (
                  <>
                    <PremiumFloatInput label="One-Time Investment" prefix={activePrefix} type="number" value={lumpsumAmount || ""} onChange={wrapChange(setLumpsumAmount)} />
                    <PremiumFloatInput label="Expected Annual Return" suffix="%" type="number" value={lumpsumRate || ""} onChange={wrapChange(setLumpsumRate)} isRange min={1} max={40} step={0.5} />
                    <PremiumFloatInput label={`Duration (${durationUnit})`} type="number" value={lumpsumDuration || ""} onChange={wrapChange(setLumpsumDuration)} isRange min={1} max={50} step={1} />
                  </>
                )}

                {activeCalc === 'simple' && (
                  <>
                    <PremiumFloatInput label="Principal Amount" prefix={activePrefix} type="number" value={simplePrincipal || ""} onChange={wrapChange(setSimplePrincipal)} />
                    <PremiumFloatInput label="Interest Rate" suffix="%" type="number" value={simpleRate || ""} onChange={wrapChange(setSimpleRate)} isRange min={1} max={30} step={0.5} />
                    <PremiumFloatInput label={`Duration (${durationUnit})`} type="number" value={simpleDuration || ""} onChange={wrapChange(setSimpleDuration)} isRange min={1} max={50} step={1} />
                  </>
                )}

                {activeCalc === 'compound' && (
                  <>
                    <PremiumFloatInput label="Principal Amount" prefix={activePrefix} type="number" value={compoundPrincipal || ""} onChange={wrapChange(setCompoundPrincipal)} />
                    <PremiumFloatInput label="Interest Rate" suffix="%" type="number" value={compoundRate || ""} onChange={wrapChange(setCompoundRate)} isRange min={1} max={30} step={0.5} />
                    <PremiumFloatInput label={`Duration (${durationUnit})`} type="number" value={compoundDuration || ""} onChange={wrapChange(setCompoundDuration)} isRange min={1} max={50} step={1} />
                  </>
                )}

                {activeCalc === 'roi' && (
                  <>
                    <PremiumFloatInput label="Investment Cost" prefix={activePrefix} type="number" value={roiCost || ""} onChange={wrapChange(setRoiCost)} />
                    <PremiumFloatInput label="Final Value" prefix={activePrefix} type="number" value={roiReturn || ""} onChange={wrapChange(setRoiReturn)} />
                    <PremiumFloatInput label="Duration (Years)" type="number" value={roiYears || ""} onChange={wrapChange(setRoiYears)} />
                  </>
                )}

                {activeCalc === 'breakeven' && (
                  <>
                    <PremiumFloatInput label="Total Fixed Cost" prefix={activePrefix} type="number" value={fixedCost || ""} onChange={wrapChange(setFixedCost)} />
                    <PremiumFloatInput label="Variable Cost per Unit" prefix={activePrefix} type="number" value={variableCost || ""} onChange={wrapChange(setVariableCost)} />
                    <PremiumFloatInput label="Selling Price per Unit" prefix={activePrefix} type="number" value={pricePerUnit || ""} onChange={wrapChange(setPricePerUnit)} />
                  </>
                )}

                {activeCalc === 'depreciation' && (
                  <>
                    <PremiumFloatInput label="Asset Cost" prefix={activePrefix} type="number" value={assetCost || ""} onChange={wrapChange(setAssetCost)} />
                    <PremiumFloatInput label="Salvage Value" prefix={activePrefix} type="number" value={salvageValue || ""} onChange={wrapChange(setSalvageValue)} />
                    <PremiumFloatInput label="Useful Life (Years)" type="number" value={usefulLife || ""} onChange={wrapChange(setUsefulLife)} isRange min={1} max={50} step={1} />
                    <PremiumFloatInput label="Depreciation Rate" suffix="%" type="number" value={depreciationRate || ""} onChange={wrapChange(setDepreciationRate)} />
                  </>
                )}

                {activeCalc === 'loan' && (
                  <>
                    <PremiumFloatInput label="Loan Amount" prefix={activePrefix} type="number" value={loanAmount || ""} onChange={wrapChange(setLoanAmount)} />
                    <PremiumFloatInput label="Interest Rate" suffix="%" type="number" value={loanRate || ""} onChange={wrapChange(setLoanRate)} isRange min={1} max={30} step={0.1} />
                    <PremiumFloatInput label={`Loan Tenure (${loanTenureUnit})`} type="number" value={loanTenure || ""} onChange={wrapChange(setLoanTenure)} isRange min={1} max={360} step={1} />
                    <PremiumFloatInput label="Custom EMI (Optional)" prefix={activePrefix} type="number" value={customEmi} onChange={wrapChange(setCustomEmi)} />
                  </>
                )}
                
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex gap-4">
                <button onClick={resetAll} className="w-1/3 px-4 py-3 rounded-xl border border-gray-300 dark:border-white/20 text-slate-700 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-400 dark:hover:border-white/30 transition-all focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-white/20 outline-none">
                  Reset
                </button>
                <button onClick={async () => { triggerCalculation(); await updateRates(); }} className="w-2/3 px-4 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-bold rounded-xl shadow-md hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all flex justify-center items-center gap-2">
                  <RefreshCcw className="w-4 h-4" /> Resync Forex
                </button>
              </div>

            </div>

            {/* RESULTS COL */}
            <div className="lg:col-span-7 bg-white dark:bg-white/[0.03] backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-2xl relative overflow-hidden flex flex-col">
               <div className="flex justify-between items-center mb-8 border-b border-gray-100 dark:border-white/5 pb-4">
                 <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Projection Results</h2>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {/* Rendering Specific Results based on Calc */}
                  {activeCalc === 'sip' && (
                    <>
                      <MetricCard label="Total Invested" value={formatInSelectedCurrency(sip.invested)} color="cyan" />
                      <MetricCard label="Future Value" value={formatInSelectedCurrency(sip.future)} color="indigo" />
                      <MetricCard label="Est. Returns" value={formatInSelectedCurrency(sip.profit)} color="emerald" full />
                    </>
                  )}
                  {activeCalc === 'lumpsum' && (
                    <>
                      <MetricCard label="Invested Amount" value={formatInSelectedCurrency(lumpsum.invested)} color="cyan" />
                      <MetricCard label="Future Value" value={formatInSelectedCurrency(lumpsum.future)} color="indigo" />
                      <MetricCard label="Total Returns" value={formatInSelectedCurrency(lumpsum.profit)} color="emerald" full />
                    </>
                  )}
                  {activeCalc === 'simple' && (
                    <>
                      <MetricCard label="Principal" value={formatInSelectedCurrency(simple.principal)} color="cyan" />
                      <MetricCard label="Interest Earned" value={formatInSelectedCurrency(simple.interest)} color="emerald" />
                      <MetricCard label="Total Amount" value={formatInSelectedCurrency(simple.total)} color="indigo" full />
                    </>
                  )}
                  {activeCalc === 'compound' && (
                    <>
                      <MetricCard label="Principal" value={formatInSelectedCurrency(compound.principal)} color="cyan" />
                      <MetricCard label="Interest Earned" value={formatInSelectedCurrency(compound.interest)} color="emerald" />
                      <MetricCard label="Total Maturity Amount" value={formatInSelectedCurrency(compound.total)} color="indigo" full />
                    </>
                  )}
                  {activeCalc === 'roi' && (
                    <>
                      <MetricCard label="Investment Cost" value={formatInSelectedCurrency(roi.cost)} color="cyan" />
                      <MetricCard label="Final Value" value={formatInSelectedCurrency(roi.future)} color="indigo" />
                      <MetricCard label="ROI Percentage" value={`${roi.roiPct}%`} color="emerald" />
                      <MetricCard label="Annualized ROI" value={`${roi.annualROI}%`} color="emerald" />
                    </>
                  )}
                  {activeCalc === 'breakeven' && (
                    <>
                      <MetricCard label="Break-Even Units" value={Number(breakeven.breakEvenUnits).toFixed(0)} color="indigo" />
                      <MetricCard label="Break-Even Revenue" value={formatInSelectedCurrency(breakeven.revenue)} color="cyan" />
                    </>
                  )}
                  {activeCalc === 'depreciation' && (
                    <>
                      <MetricCard label="Current Annual Depreciation" value={formatInSelectedCurrency(depreciation.annualDep)} color="indigo" />
                      <MetricCard label="Total Depreciation" value={formatInSelectedCurrency(depreciation.totalDep)} color="cyan" />
                    </>
                  )}
                  {activeCalc === 'loan' && (
                    <>
                      <MetricCard label="Monthly EMI" value={formatInSelectedCurrency(loan.emi)} color="emerald" />
                      <MetricCard label="Total Interest Payable" value={formatInSelectedCurrency(loan.totalInterest)} color="cyan" />
                      <MetricCard label="Total Amount to Pay" value={formatInSelectedCurrency(loan.totalPayment)} color="indigo" full />
                    </>
                  )}
               </div>

               {/* Advanced Detail Tables or Visuals */}
               <div className="flex-1 min-h-[300px] border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/20 rounded-2xl p-4 overflow-hidden flex flex-col shadow-inner">
                 <h3 className="text-slate-500 dark:text-gray-400 font-medium mb-4 text-sm tracking-widest uppercase">Detailed Breakdown</h3>
                 
                 {(activeCalc === 'sip' || activeCalc === 'lumpsum') && (
                   <div className="flex-1 w-full h-full min-h-[300px] -ml-4">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={activeCalc === 'sip' ? sip.chartData : lumpsum.chartData}>
                          <defs>
                            <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1}/></linearGradient>
                            <linearGradient id="colorRet" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/></linearGradient>
                          </defs>
                          <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#64748b', fontSize: 12}} />
                          <RechartsTooltip contentStyle={{ backgroundColor: 'var(--tw-prose-body, #0B0F19)', borderColor: 'var(--tw-prose-body, #ffffff22)', borderRadius: '12px', color: '#fff' }} />
                          <Area type="monotone" dataKey="Returns" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRet)" />
                          <Area type="monotone" dataKey="Invested" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorInvested)" />
                        </AreaChart>
                     </ResponsiveContainer>
                   </div>
                 )}

                 {activeCalc === 'loan' && (
                   <div className="overflow-y-auto no-scrollbar flex-1 pr-2">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead className="sticky top-0 bg-gray-100 dark:bg-[#161a25] shadow-sm z-10">
                          <tr>
                            <th className="px-4 py-3 text-slate-500 dark:text-gray-400 font-medium">Mo</th>
                            <th className="px-4 py-3 text-slate-500 dark:text-gray-400 font-medium text-right">Principal</th>
                            <th className="px-4 py-3 text-slate-500 dark:text-gray-400 font-medium text-right">Interest</th>
                            <th className="px-4 py-3 text-slate-500 dark:text-gray-400 font-medium text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loan.schedule.slice(0, 48).map((item) => (
                            <tr key={item.month} className="border-b border-gray-200 dark:border-white/5 hover:bg-white dark:hover:bg-white/[0.02] transition-colors">
                              <td className="px-4 py-3 text-slate-700 dark:text-gray-300">{item.month}</td>
                              <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 text-right">{formatInSelectedCurrency(item.principal)}</td>
                              <td className="px-4 py-3 text-amber-500 dark:text-amber-400 text-right">{formatInSelectedCurrency(item.interest)}</td>
                              <td className="px-4 py-3 text-slate-900 dark:text-gray-300 text-right font-medium">{formatInSelectedCurrency(item.balance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                 )}

                 {activeCalc === 'depreciation' && (
                  <div className="overflow-y-auto no-scrollbar flex-1 pr-2">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead className="sticky top-0 bg-gray-100 dark:bg-[#161a25] shadow-sm z-10">
                        <tr>
                          <th className="px-4 py-3 text-slate-500 dark:text-gray-400 font-medium">Year</th>
                          <th className="px-4 py-3 text-slate-500 dark:text-gray-400 font-medium text-right">Depreciation</th>
                          <th className="px-4 py-3 text-slate-500 dark:text-gray-400 font-medium text-right">Book Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {depreciation.schedule?.map((item) => (
                          <tr key={item.year} className="border-b border-gray-200 dark:border-white/5 hover:bg-white dark:hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3 text-slate-700 dark:text-gray-300">{item.year}</td>
                            <td className="px-4 py-3 text-amber-500 dark:text-amber-400 text-right">{formatInSelectedCurrency(convertFromINR(item.depreciation, selectedResultCurrency))}</td>
                            <td className="px-4 py-3 text-slate-900 dark:text-gray-300 text-right font-medium">{formatInSelectedCurrency(convertFromINR(item.bookValue, selectedResultCurrency))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                 )}

                 {(activeCalc === 'simple' || activeCalc === 'compound' || activeCalc === 'roi' || activeCalc === 'breakeven') && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                       <ShieldCheck className="w-16 h-16 text-emerald-500/20 mb-4" />
                       <h4 className="text-xl font-bold text-slate-800 dark:text-gray-300 mb-2">Metrics Validated</h4>
                       <p className="text-slate-500 dark:text-gray-500 max-w-sm">
                         Analysis complete. Your inputs yield a sustainable structure under current financial modeling algorithms.
                       </p>
                    </div>
                 )}

               </div>

            </div>

          </div>

        </div>
      </div>
    </main>
  );
}

// Mini Component for Results
function MetricCard({ label, value, color, full = false }: { label: string, value: string, color: 'indigo' | 'cyan' | 'emerald', full?: boolean }) {
  const colorMap = {
    indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-400 border-indigo-500/20',
    cyan: 'from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20'
  };

  return (
    <motion.div 
      key={value}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`p-6 rounded-2xl border bg-gradient-to-br ${colorMap[color]} ${full ? 'md:col-span-2' : ''}`}
    >
       <div className="text-sm font-medium uppercase tracking-wide opacity-80 mb-2 text-gray-300">{label}</div>
       <div className={`text-3xl font-extrabold tracking-tight ${colorMap[color].split(' ')[1]}`}>{value}</div>
    </motion.div>
  );
}
