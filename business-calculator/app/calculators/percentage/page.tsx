'use client';

import React, { useState, useEffect } from 'react';
import CalculatorLayout from '@/components/CalculatorLayout';
import InputField from '@/components/InputField';
import ResultCard from '@/components/ResultCard';
import { formatPercentage, formatNumber } from '@/lib/utils';

export default function PercentageCalculator() {
  const [value, setValue] = useState('50');
  const [total, setTotal] = useState('200');
  const [percentage, setPercentage] = useState('25');
  
  const [result1, setResult1] = useState(0);  // X is what % of Y
  const [result2, setResult2] = useState(0);  // What is X% of Y
  const [result3, setResult3] = useState(0);  // X is Y% of what

  useEffect(() => {
    calculate();
  }, [value, total, percentage]);

  const calculate = () => {
    const val = parseFloat(value) || 0;
    const tot = parseFloat(total) || 0;
    const pct = parseFloat(percentage) || 0;

    // X is what % of Y
    if (tot !== 0) {
      setResult1((val / tot) * 100);
    } else {
      setResult1(0);
    }

    // What is X% of Y
    setResult2((pct / 100) * tot);

    // X is Y% of what
    if (pct !== 0) {
      setResult3((val / pct) * 100);
    } else {
      setResult3(0);
    }
  };

  const results = (
    <div className="space-y-4">
      <div className="p-4 bg-indigo-50 rounded-lg border-2 border-indigo-500">
        <p className="text-sm text-gray-700 mb-2">{value} is what % of {total}?</p>
        <p className="text-3xl font-bold text-indigo-600">{formatPercentage(result1)}</p>
      </div>
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-700 mb-2">What is {percentage}% of {total}?</p>
        <p className="text-2xl font-bold text-gray-900">{formatNumber(result2)}</p>
      </div>
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-700 mb-2">{value} is {percentage}% of what number?</p>
        <p className="text-2xl font-bold text-gray-900">{formatNumber(result3)}</p>
      </div>
    </div>
  );

  const explanation = (
    <div className="space-y-4 text-gray-700">
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Understanding Percentages</h3>
        <p>
          A percentage is a number or ratio expressed as a fraction of 100. The word "percent" means "per hundred."
          Percentages are used to express how large or small one quantity is relative to another.
        </p>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Common Percentage Formulas</h3>
        <div className="bg-gray-100 p-4 rounded-lg space-y-3 font-mono text-sm">
          <div>
            <strong>1. X is what % of Y?</strong>
            <br />
            Percentage = (X / Y) × 100
            <br />
            Example: 50 is what % of 200? = (50/200) × 100 = 25%
          </div>
          <div className="pt-3 border-t border-gray-300">
            <strong>2. What is X% of Y?</strong>
            <br />
            Result = (X / 100) × Y
            <br />
            Example: What is 25% of 200? = (25/100) × 200 = 50
          </div>
          <div className="pt-3 border-t border-gray-300">
            <strong>3. X is Y% of what?</strong>
            <br />
            Result = (X / Y) × 100
            <br />
            Example: 50 is 25% of what? = (50/25) × 100 = 200
          </div>
          <div className="pt-3 border-t border-gray-300">
            <strong>4. Percentage Change</strong>
            <br />
            % Change = ((New - Old) / Old) × 100
          </div>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Real-World Applications</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Calculating discounts and sales prices</li>
          <li>Computing tax amounts</li>
          <li>Determining profit margins</li>
          <li>Analyzing grade percentages</li>
          <li>Measuring growth rates</li>
          <li>Understanding interest rates</li>
        </ul>
      </div>
    </div>
  );

  return (
    <CalculatorLayout
      title="Percentage Calculator"
      description="Calculate percentages and percentage changes"
      results={results}
      explanation={explanation}
    >
      <div className="space-y-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Basic Values</h3>
          <div className="space-y-4">
            <InputField
              label="Value (X)"
              value={value}
              onChange={setValue}
              placeholder="Enter value"
              required
            />
            <InputField
              label="Total (Y)"
              value={total}
              onChange={setTotal}
              placeholder="Enter total"
              required
            />
            <InputField
              label="Percentage (%)"
              value={percentage}
              onChange={setPercentage}
              placeholder="Enter percentage"
              suffix="%"
              step="0.1"
              required
            />
          </div>
        </div>
        <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
          <p className="font-semibold mb-2">Quick Guide:</p>
          <ul className="space-y-1">
            <li>• Enter any two values to see all percentage calculations</li>
            <li>• Results update automatically as you type</li>
            <li>• All calculations are shown simultaneously</li>
          </ul>
        </div>
      </div>
    </CalculatorLayout>
  );
}
