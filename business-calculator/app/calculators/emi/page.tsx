'use client';

import React, { useState, useEffect } from 'react';
import CalculatorLayout from '@/components/CalculatorLayout';
import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import ResultCard from '@/components/ResultCard';
import { calculateEMI, formatCurrency, formatNumber } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function EMICalculator() {
  const [principal, setPrincipal] = useState('1000000');
  const [rate, setRate] = useState('10');
  const [tenure, setTenure] = useState('120');
  const [tenureType, setTenureType] = useState('months');
  
  const [emi, setEmi] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    calculate();
  }, [principal, rate, tenure, tenureType]);

  const calculate = () => {
    const p = parseFloat(principal) || 0;
    const r = parseFloat(rate) || 0;
    let t = parseInt(tenure) || 0;
    
    if (tenureType === 'years') {
      t = t * 12;
    }

    if (p > 0 && r > 0 && t > 0) {
      const monthlyEMI = calculateEMI(p, r, t);
      const total = monthlyEMI * t;
      const interest = total - p;

      setEmi(monthlyEMI);
      setTotalAmount(total);
      setTotalInterest(interest);

      // Generate chart data
      const data = [];
      let balance = p;
      const monthlyRate = r / 12 / 100;

      for (let i = 1; i <= Math.min(t, 60); i++) {
        const interestPaid = balance * monthlyRate;
        const principalPaid = monthlyEMI - interestPaid;
        balance -= principalPaid;

        if (i % (t <= 12 ? 1 : Math.ceil(t / 12)) === 0 || i === 1) {
          data.push({
            month: `M${i}`,
            principal: Math.round(p - balance),
            interest: Math.round(total - (monthlyEMI * (t - i)) - (p - balance)),
          });
        }
      }
      setChartData(data);
    } else {
      setEmi(0);
      setTotalAmount(0);
      setTotalInterest(0);
      setChartData([]);
    }
  };

  const results = emi > 0 && (
    <div className="space-y-4">
      <ResultCard label="Monthly EMI" value={formatCurrency(emi)} highlighted />
      <ResultCard label="Total Amount Payable" value={formatCurrency(totalAmount)} />
      <ResultCard label="Total Interest" value={formatCurrency(totalInterest)} />
      <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-700">Principal Amount</span>
          <span className="font-semibold text-indigo-600">{formatCurrency(parseFloat(principal))}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">Interest Amount</span>
          <span className="font-semibold text-indigo-600">{formatCurrency(totalInterest)}</span>
        </div>
      </div>
    </div>
  );

  const chart = chartData.length > 0 && (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(value: number | string) => formatCurrency(Number(value))} />
        <Legend />
        <Line type="monotone" dataKey="principal" stroke="#4f46e5" name="Principal Paid" strokeWidth={2} />
        <Line type="monotone" dataKey="interest" stroke="#10b981" name="Interest Paid" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );

  const explanation = (
    <div className="space-y-4 text-gray-700">
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">What is EMI?</h3>
        <p>
          EMI (Equated Monthly Installment) is a fixed payment amount made by a borrower to a lender at a specified date
          each calendar month. EMIs are used to pay off both interest and principal each month.
        </p>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Formula</h3>
        <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
          EMI = [P × r × (1+r)^n] / [(1+r)^n-1]
          <br />
          <br />
          Where:
          <br />
          P = Principal loan amount
          <br />
          r = Monthly interest rate (annual rate / 12 / 100)
          <br />n = Number of monthly installments
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">How to use this calculator?</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Enter the loan amount (principal)</li>
          <li>Enter the annual interest rate in percentage</li>
          <li>Enter the loan tenure in months or years</li>
          <li>The calculator will automatically compute your monthly EMI</li>
        </ol>
      </div>
    </div>
  );

  return (
    <CalculatorLayout
      title="EMI Calculator"
      description="Calculate your Equated Monthly Installment for loans"
      results={results}
      chart={chart}
      explanation={explanation}
    >
      <div className="space-y-4">
        <InputField
          label="Loan Amount"
          value={principal}
          onChange={setPrincipal}
          placeholder="Enter loan amount"
          prefix="₹"
          required
        />
        <InputField
          label="Interest Rate (per annum)"
          value={rate}
          onChange={setRate}
          placeholder="Enter interest rate"
          suffix="%"
          step="0.1"
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Loan Tenure"
            value={tenure}
            onChange={setTenure}
            placeholder="Enter tenure"
            required
          />
          <SelectField
            label="Tenure Type"
            value={tenureType}
            onChange={setTenureType}
            options={[
              { label: 'Months', value: 'months' },
              { label: 'Years', value: 'years' },
            ]}
          />
        </div>
      </div>
    </CalculatorLayout>
  );
}
