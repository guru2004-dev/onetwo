'use client';

import React, { useState, useEffect } from 'react';
import CalculatorLayout from '@/components/CalculatorLayout';
import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import ResultCard from '@/components/ResultCard';
import { useCurrency } from '@/context/CurrencyContext';
import { calculateCompoundInterest, formatCurrency } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function CompoundInterestCalculator() {
  const { lastUpdatedTime } = useCurrency();
  const [principal, setPrincipal] = useState('100000');
  const [rate, setRate] = useState('8');
  const [time, setTime] = useState('5');
  const [frequency, setFrequency] = useState('1');
  
  const [totalAmount, setTotalAmount] = useState(0);
  const [compoundInterest, setCompoundInterest] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    calculate();
  }, [principal, rate, time, frequency, lastUpdatedTime]);

  const calculate = () => {
    const p = parseFloat(principal) || 0;
    const r = parseFloat(rate) || 0;
    const t = parseFloat(time) || 0;
    const n = parseInt(frequency) || 1;

    if (p > 0 && r > 0 && t > 0) {
      const interest = calculateCompoundInterest(p, r, t, n);
      const total = p + interest;
      
      setCompoundInterest(interest);
      setTotalAmount(total);

      // Generate chart data
      const data = [];
      const years = Math.ceil(t);
      for (let i = 0; i <= years; i++) {
        const yearInterest = calculateCompoundInterest(p, r, i, n);
        data.push({
          year: `Y${i}`,
          principal: p,
          interest: Math.round(yearInterest),
          total: Math.round(p + yearInterest),
        });
      }
      setChartData(data);
    } else {
      setCompoundInterest(0);
      setTotalAmount(0);
      setChartData([]);
    }
  };

  const results = totalAmount > 0 && (
    <div className="space-y-4">
      <ResultCard label="Total Amount" value={formatCurrency(totalAmount)} highlighted />
      <ResultCard label="Principal Amount" value={formatCurrency(parseFloat(principal))} />
      <ResultCard label="Compound Interest" value={formatCurrency(compoundInterest)} />
      <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">Interest Earned</span>
          <span className="font-semibold text-indigo-600">
            {((compoundInterest / parseFloat(principal)) * 100).toFixed(2)}% of Principal
          </span>
        </div>
      </div>
    </div>
  );

  const chart = chartData.length > 0 && (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip formatter={(value: number | string) => formatCurrency(Number(value))} />
        <Legend />
        <Line type="monotone" dataKey="principal" stroke="#6b7280" name="Principal" strokeWidth={2} />
        <Line type="monotone" dataKey="interest" stroke="#10b981" name="Interest" strokeWidth={2} />
        <Line type="monotone" dataKey="total" stroke="#4f46e5" name="Total Amount" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );

  const explanation = (
    <div className="space-y-4 text-gray-700">
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">What is Compound Interest?</h3>
        <p>
          Compound interest is the interest calculated on the initial principal and also on the accumulated interest 
          from previous periods. It's essentially "interest on interest" and causes wealth to grow at a faster rate 
          than simple interest.
        </p>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Formula</h3>
        <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
          A = P(1 + r/n)^(nt)
          <br />
          CI = A - P
          <br />
          <br />
          Where:
          <br />
          A = Final Amount
          <br />
          P = Principal amount
          <br />
          r = Annual interest rate (in decimal)
          <br />
          n = Number of times interest is compounded per year
          <br />
          t = Time in years
          <br />
          CI = Compound Interest
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Compounding Frequency</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Annually (n=1): Interest compounded once per year</li>
          <li>Semi-annually (n=2): Interest compounded twice per year</li>
          <li>Quarterly (n=4): Interest compounded four times per year</li>
          <li>Monthly (n=12): Interest compounded twelve times per year</li>
          <li>Daily (n=365): Interest compounded every day</li>
        </ul>
        <p className="mt-2 text-sm text-gray-600">
          Higher compounding frequency results in more interest earned.
        </p>
      </div>
    </div>
  );

  return (
    <CalculatorLayout
      title="Compound Interest Calculator"
      description="Calculate compound interest on investments"
      results={results}
      chart={chart}
      explanation={explanation}
    >
      <div className="space-y-4">
        <InputField
          label="Principal Amount"
          value={principal}
          onChange={setPrincipal}
          placeholder="Enter principal amount"
          prefix="₹"
          required
        />
        <InputField
          label="Annual Interest Rate"
          value={rate}
          onChange={setRate}
          placeholder="Enter interest rate"
          suffix="%"
          step="0.1"
          required
        />
        <InputField
          label="Time Period (Years)"
          value={time}
          onChange={setTime}
          placeholder="Enter time period"
          suffix="years"
          step="0.1"
          required
        />
        <SelectField
          label="Compounding Frequency"
          value={frequency}
          onChange={setFrequency}
          options={[
            { label: 'Annually', value: '1' },
            { label: 'Semi-annually', value: '2' },
            { label: 'Quarterly', value: '4' },
            { label: 'Monthly', value: '12' },
            { label: 'Daily', value: '365' },
          ]}
          required
        />
      </div>
    </CalculatorLayout>
  );
}
