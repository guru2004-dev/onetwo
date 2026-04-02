'use client';

import React, { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

const SUPPORTED_CALCULATORS = [
  { key: 'sip', label: 'SIP' },
  { key: 'lumpsum', label: 'Lumpsum' },
  { key: 'simple', label: 'Simple Interest' },
  { key: 'compound', label: 'Compound Interest' },
  { key: 'roi', label: 'ROI' },
  { key: 'breakeven', label: 'Break-Even' },
  { key: 'depreciation', label: 'Depreciation' },
  { key: 'loan', label: 'Loan Amortization' },
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

export default function AboutPage() {
  const {
    selectedInputCurrency,
    setSelectedInputCurrency,
    selectedResultCurrency,
    setSelectedResultCurrency,
    exchangeRates,
    loading,
    error,
    updateRates,
    convertToINR,
    convertFromINR,
    formatInSelectedCurrency,
  } = useCurrency();

  const [activeCalc, setActiveCalc] = useState<CalcKey>('sip');

  const [durationUnit, setDurationUnit] = useState<DurationUnit>('years');
  const [loanTenureUnit, setLoanTenureUnit] = useState<LoanTenureUnit>('years');
  const [compoundingFrequency, setCompoundingFrequency] = useState<CompoundingFrequency>(12);
  const [depreciationMethod, setDepreciationMethod] = useState<DepreciationMethod>('straight-line');

  const [sipMonthly, setSipMonthly] = useState(1000);
  const [sipRate, setSipRate] = useState(12);
  const [sipDuration, setSipDuration] = useState(10);

  const [lumpsumAmount, setLumpsumAmount] = useState(5000);
  const [lumpsumRate, setLumpsumRate] = useState(12);
  const [lumpsumDuration, setLumpsumDuration] = useState(8);

  const [simplePrincipal, setSimplePrincipal] = useState(10000);
  const [simpleRate, setSimpleRate] = useState(8);
  const [simpleDuration, setSimpleDuration] = useState(5);

  const [compoundPrincipal, setCompoundPrincipal] = useState(10000);
  const [compoundRate, setCompoundRate] = useState(10);
  const [compoundDuration, setCompoundDuration] = useState(5);

  const [roiCost, setRoiCost] = useState(10000);
  const [roiReturn, setRoiReturn] = useState(13000);
  const [roiYears, setRoiYears] = useState(2);

  const [fixedCost, setFixedCost] = useState(5000);
  const [variableCost, setVariableCost] = useState(20);
  const [pricePerUnit, setPricePerUnit] = useState(35);

  const [assetCost, setAssetCost] = useState(100000);
  const [salvageValue, setSalvageValue] = useState(10000);
  const [usefulLife, setUsefulLife] = useState(5);
  const [depreciationRate, setDepreciationRate] = useState(25);

  const [loanAmount, setLoanAmount] = useState(500000);
  const [loanRate, setLoanRate] = useState(7.5);
  const [loanTenure, setLoanTenure] = useState(20);
  const [customEmi, setCustomEmi] = useState<number | ''>('');

  const [statusMessage, setStatusMessage] = useState('Performing instant calculation for selected calculator');

  const convertToINRSafe = useCallback(
    (amount: number) => convertToINR(safeNumber(amount), selectedInputCurrency),
    [convertToINR, selectedInputCurrency]
  );

  const convertFromINRSafe = useCallback(
    (amountINR: number) => convertFromINR(safeNumber(amountINR), selectedResultCurrency),
    [convertFromINR, selectedResultCurrency]
  );

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

    const analysis = returnsINR < investedINR * 0.15
      ? 'Increase duration or investment to get better returns.'
      : 'Your investment plan shows strong growth potential.';

    return {
      invested: convertFromINRSafe(investedINR),
      future: convertFromINRSafe(fvINR),
      profit: convertFromINRSafe(returnsINR),
      analysis,
      totalMonths,
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
    if (n <= 0) {
      fvINR = invINR;
    } else if (durationUnit === 'months') {
      const monthlyRate = annualRate / 12 / 100;
      fvINR = invINR * Math.pow(1 + monthlyRate, n);
    } else {
      fvINR = invINR * Math.pow(1 + annualRateDecimal, n);
    }

    const returnsINR = Math.max(0, fvINR - invINR);

    const analysis = n < 3
      ? 'Increase investment duration to maximize returns.'
      : returnsINR > invINR * 0.3
        ? 'Your investment shows strong long-term growth.'
        : 'Consider higher rate or longer duration for stronger returns.';

    return {
      invested: convertFromINRSafe(invINR),
      future: convertFromINRSafe(fvINR),
      profit: convertFromINRSafe(returnsINR),
      analysis,
      years: durationUnit === 'months' ? (n / 12).toFixed(2) : n,
    };
  }, [lumpsumAmount, lumpsumRate, lumpsumDuration, durationUnit, convertToINRSafe, convertFromINRSafe]);

  const simple = useMemo(() => {
    const principal = safeNumber(simplePrincipal);
    const annualRate = safeNumber(simpleRate);
    const time = safeNumber(simpleDuration);

    const tYears = durationUnit === 'months' ? time / 12 : time;
    const pINR = convertToINRSafe(principal);
    const interestINR = pINR * annualRate * tYears / 100;
    const totalINR = pINR + interestINR;

    const analysis = tYears < 1
      ? 'Longer investment duration can increase returns.'
      : annualRate > 10
        ? 'This investment gives good returns.'
        : 'This is a conservative return profile.';

    return {
      principal: convertFromINRSafe(pINR),
      interest: convertFromINRSafe(interestINR),
      total: convertFromINRSafe(totalINR),
      analysis,
      years: tYears,
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

    const analysis = tYears < 1
      ? 'Longer investment duration significantly increases returns.'
      : n >= 12
        ? 'More frequent compounding increases your returns.'
        : 'Consider increasing frequency for better growth.';

    return {
      principal: convertFromINRSafe(pINR),
      interest: convertFromINRSafe(interestINR),
      total: convertFromINRSafe(finalINR),
      analysis,
      n,
      tYears,
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

    const analysis = roiPct < 10
      ? 'Low return. Consider better investment options.'
      : roiPct <= 25
        ? 'Moderate return.'
        : 'High return. Good investment.';

    return {
      profit: convertFromINRSafe(profitINR),
      roiPct: roiPct.toFixed(2),
      annualROI: annualROI.toFixed(2),
      future: convertFromINRSafe(returnINR),
      cost: convertFromINRSafe(costINR),
      analysis,
    };
  }, [roiCost, roiReturn, roiYears, convertToINRSafe, convertFromINRSafe]);

  const breakeven = useMemo(() => {
    const fixed = safeNumber(fixedCost);
    const variable = safeNumber(variableCost);
    const price = safeNumber(pricePerUnit);

    const fixedINR = convertToINRSafe(fixed);
    const variableINR = convertToINRSafe(variable);
    const priceINR = convertToINRSafe(price);
    const contribution = Math.max(0, priceINR - variableINR);
    const breakEvenUnits = contribution > 0 ? fixedINR / contribution : 0;
    const revenue = breakEvenUnits * priceINR;

    const analysis = contribution <= 0
      ? 'Increase selling price or reduce costs to reach break-even faster.'
      : breakEvenUnits > 10000
        ? 'High break-even point indicates higher risk.'
        : 'Break-even looks achievable with current inputs.';

    return {
      breakEvenUnits,
      revenue: convertFromINRSafe(revenue),
      contribution: convertFromINRSafe(contribution),
      analysis,
      fixed: convertFromINRSafe(fixedINR),
      variable: convertFromINRSafe(variableINR),
    };
  }, [fixedCost, variableCost, pricePerUnit, convertToINRSafe, convertFromINRSafe]);

  const depreciation = useMemo(() => {
    const cost = safeNumber(assetCost);
    const salvage = safeNumber(salvageValue);
    const life = Math.max(1, safeNumber(usefulLife));
    const rate = safeNumber(depreciationRate);

    const costINR = convertToINRSafe(cost);
    const salvageINR = convertToINRSafe(salvage);

    let annualDep = 0;
    let bookValue = costINR;
    const schedule: Array<{ year: number; depreciation: number; bookValue: number }> = [];

    if (depreciationMethod === 'straight-line') {
      annualDep = Math.max(0, (costINR - salvageINR) / life);
      for (let year = 1; year <= life; year++) {
        bookValue = Math.max(salvageINR, costINR - annualDep * year);
        schedule.push({ year, depreciation: annualDep, bookValue });
      }
    } else {
      let current = costINR;
      for (let year = 1; year <= life; year++) {
        const dep = current * (rate / 100);
        current = Math.max(salvageINR, current - dep);
        schedule.push({ year, depreciation: dep, bookValue: current });
      }
      annualDep = schedule[0]?.depreciation ?? 0;
      bookValue = schedule[schedule.length - 1]?.bookValue ?? salvageINR;
    }

    const totalDep = Math.min(costINR - salvageINR, annualDep * life);

    const analysis = totalDep > costINR * 0.7
      ? 'Asset value is decreasing quickly.'
      : salvageINR > costINR * 0.5
        ? 'Asset retains good value over time.'
        : 'Moderate depreciation profile.';

    return {
      annualDep: convertFromINRSafe(annualDep),
      bookValue: convertFromINRSafe(bookValue),
      totalDep: convertFromINRSafe(totalDep),
      schedule,
      analysis,
    };
  }, [assetCost, salvageValue, usefulLife, depreciationMethod, depreciationRate, convertToINRSafe, convertFromINRSafe]);

  const loan = useMemo(() => {
    const principal = safeNumber(loanAmount);
    const annualRate = safeNumber(loanRate);
    const tenure = safeNumber(loanTenure);

    const months = loanTenureUnit === 'months' ? tenure : tenure * 12;
    const pINR = convertToINRSafe(principal);
    const monthlyRate = annualRate / 12 / 100;

    let emiINR = safeNumber(customEmi) > 0 ? convertToINRSafe(Number(customEmi)) : 0;
    if (emiINR === 0 && months > 0 && monthlyRate >= 0) {
      if (monthlyRate === 0) {
        emiINR = months > 0 ? pINR / months : 0;
      } else {
        const factor = Math.pow(1 + monthlyRate, months);
        emiINR = (pINR * monthlyRate * factor) / (factor - 1);
      }
    }

    const schedule = [] as Array<{ month: number; emi: number; interest: number; principal: number; remaining: number }>;
    let balance = pINR;
    let totalInterest = 0;

    for (let month = 1; month <= months; month++) {
      const interest = balance * monthlyRate;
      const principalPaid = Math.max(0, Math.min(balance, emiINR - interest));
      balance = Math.max(0, balance - principalPaid);
      totalInterest += interest;

      schedule.push({ month, emi: emiINR, interest, principal: principalPaid, remaining: balance });
      if (balance <= 0) break;
    }

    const totalPayment = pINR + totalInterest;

    const analysis = annualRate > 12
      ? 'Large portion of payment goes to interest initially.'
      : months > 240
        ? 'Longer tenure increases total interest cost.'
        : 'Balanced loan schedule.';

    return {
      emi: convertFromINRSafe(emiINR),
      principal: convertFromINRSafe(pINR),
      totalInterest: convertFromINRSafe(totalInterest),
      totalPayment: convertFromINRSafe(totalPayment),
      schedule,
      analysis,
      months,
    };
  }, [loanAmount, loanRate, loanTenure, loanTenureUnit, customEmi, convertToINRSafe, convertFromINRSafe]);

  const rebuildPageAnalysis = useMemo(() => {
    if (!exchangeRates || Object.keys(exchangeRates).length === 0) {
      return 'Waiting for exchange rate data...';
    }
    return statusMessage;
  }, [exchangeRates, statusMessage]);

  const resetAll = () => {
    setSipMonthly(1000); setSipRate(12); setSipDuration(10);
    setLumpsumAmount(5000); setLumpsumRate(12); setLumpsumDuration(8);
    setSimplePrincipal(10000); setSimpleRate(8); setSimpleDuration(5);
    setCompoundPrincipal(10000); setCompoundRate(10); setCompoundDuration(5);
    setRoiCost(10000); setRoiReturn(13000); setRoiYears(2);
    setFixedCost(5000); setVariableCost(20); setPricePerUnit(35);
    setAssetCost(100000); setSalvageValue(10000); setUsefulLife(5); setDepreciationRate(25);
    setLoanAmount(500000); setLoanRate(7.5); setLoanTenure(20); setCustomEmi('');
  };

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-3 md:px-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/" className="inline-flex items-center text-sky-600 hover:text-sky-800 font-semibold">
              <ArrowLeft className="w-4 h-4 mr-2" /> Home
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold mt-2">Business Calculator Hub</h1>
            <p className="text-sm text-gray-500 mt-1">Multi Calculator Suite with SIP, Lumpsum, Interest, ROI, Loan, Depreciation & More.</p>
          </div>

          <button
            onClick={async () => {
              setStatusMessage('Updating forex rates and recalculating...');
              await updateRates();
              setStatusMessage('Rates refreshed, calculations are updated.');
            }}
            className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg shadow-md transition"
          >
            <RefreshCcw className="w-4 h-4" /> Update Rates
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white rounded-xl shadow-md p-3 overflow-x-auto">
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_CALCULATORS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveCalc(item.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${activeCalc === item.key ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
              <h2 className="text-xl font-bold">{SUPPORTED_CALCULATORS.find(c => c.key === activeCalc)?.label} Input</h2>
              <div className="grid grid-cols-1 gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-sm font-medium">Input Currency</label>
                  <select
                    value={selectedInputCurrency}
                    onChange={(e) => setSelectedInputCurrency(e.target.value as CurrencyOption)}
                    className="border rounded-lg px-3 py-2"
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="text-sm font-medium">Result Currency</label>
                  <select
                    value={selectedResultCurrency}
                    onChange={(e) => setSelectedResultCurrency(e.target.value as CurrencyOption)}
                    className="border rounded-lg px-3 py-2"
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="text-sm font-medium">Duration Unit</label>
                  <select
                    value={durationUnit}
                    onChange={(e) => setDurationUnit(e.target.value as DurationUnit)}
                    className="border rounded-lg px-3 py-2"
                  >
                    <option value="years">Years</option>
                    <option value="months">Months</option>
                  </select>
                </div>

                {(activeCalc === 'compound' || activeCalc === 'loan') && (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-sm font-medium">Compounding / Tenure Unit</label>
                    <select
                      value={activeCalc === 'loan' ? loanTenureUnit : compoundingFrequency}
                      onChange={(e) => {
                        if (activeCalc === 'loan') {
                          setLoanTenureUnit(e.target.value as LoanTenureUnit);
                        } else {
                          setCompoundingFrequency(Number(e.target.value) as CompoundingFrequency);
                        }
                      }}
                      className="border rounded-lg px-3 py-2"
                    >
                      {activeCalc === 'loan' ? (
                        <> <option value="years">Years</option><option value="months">Months</option> </>
                      ) : (
                        <>
                          <option value={1}>Annually</option>
                          <option value={2}>Semi-Annually</option>
                          <option value={4}>Quarterly</option>
                          <option value={12}>Monthly</option>
                        </>
                      )}
                    </select>
                  </div>
                )}

                {activeCalc === 'depreciation' && (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-sm font-medium">Depreciation Method</label>
                    <select
                      value={depreciationMethod}
                      onChange={(e) => setDepreciationMethod(e.target.value as DepreciationMethod)}
                      className="border rounded-lg px-3 py-2"
                    >
                      <option value="straight-line">Straight-Line</option>
                      <option value="declining-balance">Declining Balance</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Display fields depending on stage */}
              {activeCalc === 'sip' && (
                <>
                  <div className="space-y-2">
                    <label>Monthly Investment Amount</label>
                    <input
                      type="number"
                      min={0}
                      value={sipMonthly}
                      onChange={(e) => setSipMonthly(safeNumber(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                    <input
                      type="range"
                      min={0}
                      max={100000}
                      value={sipMonthly}
                      onChange={(e) => setSipMonthly(safeNumber(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label>Expected Annual Return Rate (%)</label>
                    <input
                      type="number"
                      min={0}
                      value={sipRate}
                      onChange={(e) => setSipRate(safeNumber(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <label>Investment Duration ({durationUnit})</label>
                    <input
                      type="number"
                      min={0}
                      value={sipDuration}
                      onChange={(e) => setSipDuration(safeNumber(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </>
              )}

              {activeCalc === 'lumpsum' && (
                <>
                  <div className="space-y-2">
                    <label>Investment Amount (one-time)</label>
                    <input
                      type="number"
                      min={0}
                      value={lumpsumAmount}
                      onChange={(e) => setLumpsumAmount(safeNumber(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Expected Annual Return Rate (%)</label>
                    <input
                      type="number"
                      min={0}
                      value={lumpsumRate}
                      onChange={(e) => setLumpsumRate(safeNumber(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Investment Duration ({durationUnit})</label>
                    <input
                      type="number"
                      min={0}
                      value={lumpsumDuration}
                      onChange={(e) => setLumpsumDuration(safeNumber(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </>
              )}

              {activeCalc === 'simple' && (
                <>
                  <div className="space-y-2">
                    <label>Principal Amount</label>
                    <input
                      type="number"
                      min={0}
                      value={simplePrincipal}
                      onChange={(e) => setSimplePrincipal(safeNumber(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Interest Rate (%)</label>
                    <input
                      type="number"
                      min={0}
                      value={simpleRate}
                      onChange={(e) => setSimpleRate(safeNumber(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Time Period ({durationUnit})</label>
                    <input
                      type="number"
                      min={0}
                      value={simpleDuration}
                      onChange={(e) => setSimpleDuration(safeNumber(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </>
              )}

              {activeCalc === 'compound' && (
                <>
                  <div className="space-y-2">
                    <label>Principal Amount</label>
                    <input
                      type="number"
                      min={0}
                      value={compoundPrincipal}
                      onChange={(e) => setCompoundPrincipal(safeNumber(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Interest Rate (%)</label>
                    <input
                      type="number"
                      min={0}
                      value={compoundRate}
                      onChange={(e) => setCompoundRate(safeNumber(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Time Period ({durationUnit})</label>
                    <input
                      type="number"
                      min={0}
                      value={compoundDuration}
                      onChange={(e) => setCompoundDuration(safeNumber(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </>
              )}

              {activeCalc === 'roi' && (
                <>
                  <div className="space-y-2">
                    <label>Investment Cost</label>
                    <input
                      type="number"
                      min={0}
                      value={roiCost}
                      onChange={(e) => setRoiCost(safeNumber(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Final Value</label>
                    <input
                      type="number"
                      min={0}
                      value={roiReturn}
                      onChange={(e) => setRoiReturn(safeNumber(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Duration (Years)</label>
                    <input
                      type="number"
                      min={0}
                      value={roiYears}
                      onChange={(e) => setRoiYears(safeNumber(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </>
              )}

              {activeCalc === 'breakeven' && (
                <>
                  <div className="space-y-2">
                    <label>Fixed Cost</label>
                    <input
                      type="number"
                      min={0}
                      value={fixedCost}
                      onChange={(e) => setFixedCost(safeNumber(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Variable Cost per Unit</label>
                    <input
                      type="number"
                      min={0}
                      value={variableCost}
                      onChange={(e) => setVariableCost(safeNumber(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Selling Price per Unit</label>
                    <input
                      type="number"
                      min={0}
                      value={pricePerUnit}
                      onChange={(e) => setPricePerUnit(safeNumber(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </>
              )}

              {activeCalc === 'depreciation' && (
                <>
                  <div className="space-y-2">
                    <label>Asset Cost</label>
                    <input
                      type="number"
                      min={0}
                      value={assetCost}
                      onChange={(e) => setAssetCost(safeNumber(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Salvage Value</label>
                    <input
                      type="number"
                      min={0}
                      value={salvageValue}
                      onChange={(e) => setSalvageValue(safeNumber(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Useful Life (Years)</label>
                    <input
                      type="number"
                      min={1}
                      value={usefulLife}
                      onChange={(e) => setUsefulLife(safeNumber(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Depreciation Rate (%)</label>
                    <input
                      type="number"
                      min={0}
                      value={depreciationRate}
                      onChange={(e) => setDepreciationRate(safeNumber(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </>
              )}

              {activeCalc === 'loan' && (
                <>
                  <div className="space-y-2">
                    <label>Loan Amount</label>
                    <input
                      type="number"
                      min={0}
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(safeNumber(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Interest Rate (%)</label>
                    <input
                      type="number"
                      min={0}
                      value={loanRate}
                      onChange={(e) => setLoanRate(safeNumber(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Loan Tenure ({loanTenureUnit})</label>
                    <input
                      type="number"
                      min={0}
                      value={loanTenure}
                      onChange={(e) => setLoanTenure(safeNumber(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label>EMI (optional)</label>
                    <input
                      type="number"
                      min={0}
                      value={customEmi}
                      onChange={(e) => setCustomEmi(e.target.value === '' ? '' : safeNumber(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="auto-calculate when empty"
                    />
                  </div>
                </>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={resetAll}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
                >
                  Reset
                </button>
                <button
                  onClick={() => updateRates()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                >
                  Refresh Rates
                </button>
              </div>

              <div className="text-xs text-gray-500">
                {loading ? 'Loading exchange rates...' : `Rates last updated: ${new Date().toLocaleTimeString()}`}
                {error ? ` | Error: ${error}` : ''}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-bold">{SUPPORTED_CALCULATORS.find((c) => c.key === activeCalc)?.label} Result</h2>
                <span className="text-xs text-gray-500">{rebuildPageAnalysis}</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {activeCalc === 'sip' && (
                  <>
                    <p>Total Invested: <strong>{formatInSelectedCurrency(typeof sip.invested === 'number' ? safeNumber(sip.invested) : 0)}</strong></p>
                    <p>Future Value: <strong>{formatInSelectedCurrency(typeof sip.future === 'number' ? safeNumber(sip.future) : 0)}</strong></p>
                    <p>Estimated Returns: <strong>{formatInSelectedCurrency(typeof sip.profit === 'number' ? safeNumber(sip.profit) : 0)}</strong></p>
                    <p className="text-sm text-emerald-700">{sip.analysis}</p>
                  </>
                )}

                {activeCalc === 'lumpsum' && (
                  <>
                    <p>Invested Amount: <strong>{formatInSelectedCurrency(typeof lumpsum.invested === 'number' ? safeNumber(lumpsum.invested) : 0)}</strong></p>
                    <p>Future Value: <strong>{formatInSelectedCurrency(typeof lumpsum.future === 'number' ? safeNumber(lumpsum.future) : 0)}</strong></p>
                    <p>Returns: <strong>{formatInSelectedCurrency(typeof lumpsum.profit === 'number' ? safeNumber(lumpsum.profit) : 0)}</strong></p>
                    <p className="text-sm text-emerald-700">{lumpsum.analysis}</p>
                  </>
                )}

                {activeCalc === 'simple' && (
                  <>
                    <p>Principal: <strong>{formatInSelectedCurrency(typeof simple.principal === 'number' ? safeNumber(simple.principal) : 0)}</strong></p>
                    <p>Simple Interest: <strong>{formatInSelectedCurrency(typeof simple.interest === 'number' ? safeNumber(simple.interest) : 0)}</strong></p>
                    <p>Total Amount: <strong>{formatInSelectedCurrency(typeof simple.total === 'number' ? safeNumber(simple.total) : 0)}</strong></p>
                    <p className="text-sm text-emerald-700">{simple.analysis}</p>
                  </>
                )}

                {activeCalc === 'compound' && (
                  <>
                    <p>Principal: <strong>{formatInSelectedCurrency(typeof compound.principal === 'number' ? safeNumber(compound.principal) : 0)}</strong></p>
                    <p>Final Amount: <strong>{formatInSelectedCurrency(typeof compound.total === 'number' ? safeNumber(compound.total) : 0)}</strong></p>
                    <p>Interest Earned: <strong>{formatInSelectedCurrency(typeof compound.interest === 'number' ? safeNumber(compound.interest) : 0)}</strong></p>
                    <p className="text-sm text-emerald-700">{compound.analysis}</p>
                  </>
                )}

                {activeCalc === 'roi' && (
                  <>
                    <p>Investment Cost: <strong>{formatInSelectedCurrency(typeof roi.cost === 'number' ? safeNumber(roi.cost) : 0)}</strong></p>
                    <p>Final Value: <strong>{formatInSelectedCurrency(typeof roi.future === 'number' ? safeNumber(roi.future) : 0)}</strong></p>
                    <p>Profit: <strong>{formatInSelectedCurrency(typeof roi.profit === 'number' ? safeNumber(roi.profit) : 0)}</strong></p>
                    <p>ROI: <strong>{roi.roiPct}%</strong></p>
                    <p>Annual ROI: <strong>{roi.annualROI}%</strong></p>
                    <p className="text-sm text-emerald-700">{roi.analysis}</p>
                  </>
                )}

                {activeCalc === 'breakeven' && (
                  <>
                    <p>Contribution per Unit: <strong>{formatInSelectedCurrency(typeof breakeven.contribution === 'number' ? safeNumber(breakeven.contribution) : 0)}</strong></p>
                    <p>Break-even Units: <strong>{Number(breakeven.breakEvenUnits).toFixed(0)}</strong></p>
                    <p>Break-even Revenue: <strong>{breakeven.revenue}</strong></p>
                    <p className="text-sm text-emerald-700">{breakeven.analysis}</p>
                  </>
                )}

                {activeCalc === 'depreciation' && (
                  <>
                    <p>Annual Depreciation: <strong>{formatInSelectedCurrency(typeof depreciation.annualDep === 'number' ? safeNumber(depreciation.annualDep) : 0)}</strong></p>
                    <p>Current Book Value: <strong>{formatInSelectedCurrency(typeof depreciation.bookValue === 'number' ? safeNumber(depreciation.bookValue) : 0)}</strong></p>
                    <p>Total Depreciation: <strong>{formatInSelectedCurrency(typeof depreciation.totalDep === 'number' ? safeNumber(depreciation.totalDep) : 0)}</strong></p>
                    <p className="text-sm text-emerald-700">{depreciation.analysis}</p>
                    <div className="overflow-x-auto mt-2">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-t border-b bg-slate-100">
                            <th className="px-2 py-1">Year</th>
                            <th className="px-2 py-1">Depreciation</th>
                            <th className="px-2 py-1">Book Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {depreciation.schedule?.map((item) => (
                            <tr key={item.year} className="border-b">
                              <td className="px-2 py-1">{item.year}</td>
                              <td className="px-2 py-1">{formatInSelectedCurrency(convertFromINR(item.depreciation, selectedResultCurrency))}</td>
                              <td className="px-2 py-1">{formatInSelectedCurrency(convertFromINR(item.bookValue, selectedResultCurrency))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {activeCalc === 'loan' && (
                  <>
                    <p>EMI: <strong>{loan.emi}</strong></p>
                    <p>Total Interest: <strong>{loan.totalInterest}</strong></p>
                    <p>Total Payment: <strong>{loan.totalPayment}</strong></p>
                    <p className="text-sm text-emerald-700">{loan.analysis}</p>
                    <div className="overflow-x-auto max-h-64 mt-2">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-t border-b bg-slate-100">
                            <th className="px-2 py-1">Month</th>
                            <th className="px-2 py-1">EMI</th>
                            <th className="px-2 py-1">Interest</th>
                            <th className="px-2 py-1">Principal</th>
                            <th className="px-2 py-1">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loan.schedule.slice(0, 24).map((item) => (
                            <tr key={item.month} className="border-b">
                              <td className="px-2 py-1">{item.month}</td>
                              <td className="px-2 py-1">{formatInSelectedCurrency(item.emi)}</td>
                              <td className="px-2 py-1">{formatInSelectedCurrency(item.interest)}</td>
                              <td className="px-2 py-1">{formatInSelectedCurrency(item.principal)}</td>
                              <td className="px-2 py-1">{formatInSelectedCurrency(item.remaining)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {loan.schedule.length > 24 && <p className="text-xs text-gray-500 mt-2">Showing first 24 months of {loan.schedule.length} entries.</p>}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
