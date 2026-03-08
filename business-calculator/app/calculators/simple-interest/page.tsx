'use client';

import React, { useState, useEffect } from 'react';
import CalculatorLayout from '@/components/CalculatorLayout';
import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import ResultCard from '@/components/ResultCard';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function SimpleInterestCalculator() {
  const [principal, setPrincipal] = useState('10000');
  const [rate, setRate] = useState('8');
  const [time, setTime] = useState('5');
  const [timeUnit, setTimeUnit] = useState('years');
  
  const [interest, setInterest] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    calculate();
  }, [principal, rate, time, timeUnit]);

  const calculate = () => {
    const p = parseFloat(principal) || 0;
    const r = parseFloat(rate) || 0;
    let t = parseFloat(time) || 0;
    
    // Convert time to years if needed
    if (timeUnit === 'months') {
      t = t / 12;
    } else if (timeUnit === 'days') {
      t = t / 365;
    }

    if (p > 0 && r > 0 && t > 0) {
      const si = (p * r * t) / 100;
      const total = p + si;

      setInterest(si);
      setTotalAmount(total);
    } else {
      setInterest(0);
      setTotalAmount(0);
    }
  };

  const chartData = interest > 0 ? [
    {
      name: 'Principal',
      amount: parseFloat(principal) || 0,
    },
    {
      name: 'Interest',
      amount: interest,
    },
  ] : [];

  const results = interest > 0 && (
    <div className="space-y-4">
      <ResultCard label="Simple Interest" value={formatCurrency(interest)} highlighted />
      <ResultCard label="Total Amount" value={formatCurrency(totalAmount)} />
      <ResultCard label="Interest Rate" value={`${rate}% per annum`} />
      <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-700">Principal Amount:</span>
            <span className="font-semibold text-indigo-600">{formatCurrency(parseFloat(principal) || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Interest Earned:</span>
            <span className="font-semibold text-green-600">{formatCurrency(interest)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-gray-700 font-medium">Total Amount:</span>
            <span className="font-bold text-indigo-600">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const chart = chartData.length > 0 && (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value: number | string) => formatCurrency(Number(value))} />
        <Legend />
        <Bar dataKey="amount" fill="#4f46e5" name="Amount" />
      </BarChart>
    </ResponsiveContainer>
  );

  const explanation = (
    <div className="space-y-4 text-gray-700">
      <p>
        Simple Interest is calculated on the original principal amount only. Unlike compound interest, 
        it doesn't add interest to previous interest earned.
      </p>
      <div className="space-y-2">
        <h3 className="font-semibold">Formula:</h3>
        <div className="bg-gray-100 p-3 rounded font-mono text-sm">
          Simple Interest (SI) = (P × R × T) / 100
        </div>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong>P</strong> = Principal Amount</li>
          <li><strong>R</strong> = Rate of Interest per annum</li>
          <li><strong>T</strong> = Time period in years</li>
        </ul>
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold">Total Amount Formula:</h3>
        <div className="bg-gray-100 p-3 rounded font-mono text-sm">
          Total Amount = Principal + Simple Interest
        </div>
      </div>
      <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
        <p className="text-sm">
          <strong>Use Case:</strong> Simple interest is commonly used for short-term loans, 
          bonds, and certain types of savings accounts.
        </p>
      </div>
    </div>
  );

  return (
    <CalculatorLayout
      title="Simple Interest Calculator"
      description="Calculate simple interest on principal amount"
      results={results}
      chart={chart}
      explanation={explanation}
    >
      <InputField
        label="Principal Amount"
        type="number"
        value={principal}
        onChange={setPrincipal}
        placeholder="Enter principal amount"
        prefix="₹"
        step="100"
        min="0"
      />
      <InputField
        label="Rate of Interest"
        type="number"
        value={rate}
        onChange={setRate}
        placeholder="Enter interest rate"
        suffix="% p.a."
        step="0.1"
        min="0"
      />
      <InputField
        label="Time Period"
        type="number"
        value={time}
        onChange={setTime}
        placeholder="Enter time period"
        step="1"
        min="0"
      />
      <SelectField
        label="Time Unit"
        value={timeUnit}
        onChange={setTimeUnit}
        options={[
          { label: 'Years', value: 'years' },
          { label: 'Months', value: 'months' },
          { label: 'Days', value: 'days' },
        ]}
      />
    </CalculatorLayout>
  );
}
