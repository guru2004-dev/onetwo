'use client';

import React, { useEffect, useMemo, useState } from 'react';
import CalculatorLayout from '@/components/CalculatorLayout';
import InputField from '@/components/InputField';
import ResultCard from '@/components/ResultCard';
import { useCurrency } from '@/context/CurrencyContext';
import { formatCurrency, formatNumber } from '@/lib/utils';

type NpvDecision = 'profitable' | 'not-profitable' | 'neutral';

const DEFAULT_YEARS = 5;
const MIN_YEARS = 1;
const MAX_YEARS = 20;

function getInitialCashFlows(years: number): string[] {
  return Array.from({ length: years }, () => '30000');
}

export default function NPVCalculator() {
  const { lastUpdatedTime } = useCurrency();

  const [initialInvestment, setInitialInvestment] = useState('100000');
  const [discountRate, setDiscountRate] = useState('10');
  const [years, setYears] = useState(String(DEFAULT_YEARS));
  const [cashFlows, setCashFlows] = useState<string[]>(getInitialCashFlows(DEFAULT_YEARS));

  const [totalPresentValue, setTotalPresentValue] = useState(0);
  const [npv, setNpv] = useState(0);
  const [decision, setDecision] = useState<NpvDecision>('neutral');
  const [error, setError] = useState<string>('');

  const parsedYears = useMemo(() => {
    const value = Math.floor(Number(years));
    if (!Number.isFinite(value)) {
      return MIN_YEARS;
    }

    return Math.min(MAX_YEARS, Math.max(MIN_YEARS, value));
  }, [years]);

  useEffect(() => {
    setCashFlows((previous) => {
      if (previous.length === parsedYears) {
        return previous;
      }

      if (previous.length > parsedYears) {
        return previous.slice(0, parsedYears);
      }

      return [...previous, ...Array.from({ length: parsedYears - previous.length }, () => '')];
    });
  }, [parsedYears]);

  useEffect(() => {
    const investment = Number(initialInvestment);
    const ratePercent = Number(discountRate);

    if (!Number.isFinite(investment) || investment <= 0) {
      setError('Initial investment must be greater than 0.');
      setTotalPresentValue(0);
      setNpv(0);
      setDecision('neutral');
      return;
    }

    if (!Number.isFinite(ratePercent) || ratePercent < 0) {
      setError('Discount rate must be 0 or greater.');
      setTotalPresentValue(0);
      setNpv(0);
      setDecision('neutral');
      return;
    }

    const rate = ratePercent / 100;

    let pvSum = 0;

    for (let yearIndex = 0; yearIndex < parsedYears; yearIndex += 1) {
      const flow = Number(cashFlows[yearIndex] ?? 0);

      if (!Number.isFinite(flow)) {
        setError(`Year ${yearIndex + 1} cash flow is invalid.`);
        setTotalPresentValue(0);
        setNpv(0);
        setDecision('neutral');
        return;
      }

      const presentValue = flow / Math.pow(1 + rate, yearIndex + 1);
      pvSum += presentValue;
    }

    const npvValue = pvSum - investment;

    setTotalPresentValue(pvSum);
    setNpv(npvValue);
    setError('');

    if (npvValue > 0) {
      setDecision('profitable');
    } else if (npvValue < 0) {
      setDecision('not-profitable');
    } else {
      setDecision('neutral');
    }
  }, [initialInvestment, discountRate, parsedYears, cashFlows, lastUpdatedTime]);

  const updateCashFlow = (index: number, value: string) => {
    setCashFlows((previous) => {
      const next = [...previous];
      next[index] = value;
      return next;
    });
  };

  const resetCalculator = () => {
    setInitialInvestment('100000');
    setDiscountRate('10');
    setYears(String(DEFAULT_YEARS));
    setCashFlows(getInitialCashFlows(DEFAULT_YEARS));
    setError('');
  };

  const decisionText =
    decision === 'profitable'
      ? 'Project is Profitable'
      : decision === 'not-profitable'
        ? 'Project is Not Profitable'
        : 'Project is Break-even';

  const decisionClass =
    decision === 'profitable'
      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
      : decision === 'not-profitable'
        ? 'text-red-600 bg-red-50 border-red-200'
        : 'text-amber-700 bg-amber-50 border-amber-200';

  const results = (
    <div className="space-y-4">
      <ResultCard label="Net Present Value (NPV)" value={formatCurrency(npv)} highlighted />
      <ResultCard label="Total Present Value of Cash Flows" value={formatCurrency(totalPresentValue)} />

      <div className={`p-4 rounded-lg border ${decisionClass}`}>
        <p className="text-sm font-medium">Investment Decision</p>
        <p className="text-xl font-bold mt-1">{decisionText}</p>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Discount Rate</span>
          <span className="font-semibold text-slate-900">{formatNumber(Number(discountRate) || 0)}%</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-slate-600">Years</span>
          <span className="font-semibold text-slate-900">{parsedYears}</span>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );

  const explanation = (
    <div className="space-y-3 text-gray-700">
      <p>
        Net Present Value (NPV) estimates how much value a project adds today by discounting future cash flows.
      </p>
      <div className="bg-gray-100 p-3 rounded text-sm font-mono">
        NPV = Sigma(Cash Flow / (1 + r)^t) - Initial Investment
      </div>
      <ul className="list-disc list-inside text-sm space-y-1">
        <li>Positive NPV indicates value creation.</li>
        <li>Negative NPV indicates the project may destroy value.</li>
        <li>Discount rate reflects required return or cost of capital.</li>
      </ul>
    </div>
  );

  return (
    <CalculatorLayout
      title="Net Present Value (NPV) Calculator"
      description="Evaluate investment profitability by discounting future cash flows"
      results={results}
      explanation={explanation}
    >
      <div className="space-y-4">
        <InputField
          label="Initial Investment"
          type="number"
          value={initialInvestment}
          onChange={setInitialInvestment}
          placeholder="Enter initial investment"
          prefix="₹"
          min="0"
          step="100"
          required
        />

        <InputField
          label="Discount Rate (%)"
          type="number"
          value={discountRate}
          onChange={setDiscountRate}
          placeholder="Enter discount rate"
          suffix="%"
          min="0"
          step="0.1"
          required
        />

        <InputField
          label="Number of Years"
          type="number"
          value={years}
          onChange={setYears}
          placeholder="Enter number of years"
          min={String(MIN_YEARS)}
          max={String(MAX_YEARS)}
          step="1"
          required
        />

        <div className="pt-2">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Cash Flows</h3>
          <div className="space-y-3 max-h-72 overflow-auto pr-1">
            {Array.from({ length: parsedYears }).map((_, index) => (
              <InputField
                key={`cash-flow-${index + 1}`}
                label={`Year ${index + 1} Cash Flow`}
                type="number"
                value={cashFlows[index] ?? ''}
                onChange={(value) => updateCashFlow(index, value)}
                placeholder={`Enter year ${index + 1} cash flow`}
                prefix="₹"
                step="100"
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={resetCalculator}
          className="w-full mt-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
        >
          Reset
        </button>
      </div>
    </CalculatorLayout>
  );
}
