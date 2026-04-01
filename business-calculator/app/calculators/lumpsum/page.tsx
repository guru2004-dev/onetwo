'use client';

import React, { useState, useEffect } from 'react';
import CalculatorLayout from '@/components/CalculatorLayout';
import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import ResultCard from '@/components/ResultCard';
import { useCurrency } from '@/context/CurrencyContext';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function LumpsumCalculator() {
  const { lastUpdatedTime } = useCurrency();
  const [investment, setInvestment] = useState('100000');
  const [rate, setRate] = useState('12');
  const [tenure, setTenure] = useState('10');
  const [tenureType, setTenureType] = useState('years');
  
  const [futureValue, setFutureValue] = useState(0);
  const [totalGain, setTotalGain] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    calculate();
  }, [investment, rate, tenure, tenureType, lastUpdatedTime]);

  const calculate = () => {
    const p = parseFloat(investment) || 0;
    const r = parseFloat(rate) || 0;
    let t = parseFloat(tenure) || 0;
    
    // Convert tenure to years
    if (tenureType === 'months') {
      t = t / 12;
    }

    if (p > 0 && r > 0 && t > 0) {
      // Future Value = P * (1 + r/100)^t
      const fv = p * Math.pow(1 + r / 100, t);
      const gain = fv - p;

      setFutureValue(fv);
      setTotalGain(gain);

      // Generate year-wise chart data
      const data = [];
      const years = tenureType === 'years' ? Math.ceil(t) : Math.ceil(t);
      const dataPoints = Math.min(years, 20);
      const step = years / dataPoints;

      for (let i = 0; i <= dataPoints; i++) {
        const year = i * step;
        const value = p * Math.pow(1 + r / 100, year);
        data.push({
          year: tenureType === 'years' ? `Year ${Math.round(year)}` : `${Math.round(year * 12)} Mo`,
          value: Math.round(value),
          investment: p,
        });
      }
      setChartData(data);
    } else {
      setFutureValue(0);
      setTotalGain(0);
      setChartData([]);
    }
  };

  const pieData = futureValue > 0 ? [
    { name: 'Invested Amount', value: parseFloat(investment) || 0 },
    { name: 'Total Returns', value: totalGain },
  ] : [];

  const COLORS = ['#4f46e5', '#10b981'];

  const results = futureValue > 0 && (
    <div className="space-y-4">
      <ResultCard label="Future Value" value={formatCurrency(futureValue)} highlighted />
      <ResultCard label="Total Returns" value={formatCurrency(totalGain)} />
      <ResultCard label="Invested Amount" value={formatCurrency(parseFloat(investment) || 0)} />
      <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-700">Principal Investment:</span>
            <span className="font-semibold text-indigo-600">{formatCurrency(parseFloat(investment) || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Total Gain:</span>
            <span className="font-semibold text-green-600">{formatCurrency(totalGain)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Return on Investment:</span>
            <span className="font-semibold text-blue-600">
              {((totalGain / parseFloat(investment)) * 100).toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-gray-700 font-medium">Final Amount:</span>
            <span className="font-bold text-indigo-600">{formatCurrency(futureValue)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const chart = chartData.length > 0 && (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Growth Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip formatter={(value: number | string) => formatCurrency(Number(value))} />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#4f46e5" name="Future Value" strokeWidth={2} />
            <Line type="monotone" dataKey="investment" stroke="#94a3b8" name="Investment" strokeWidth={2} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">Investment Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number | string) => formatCurrency(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const explanation = (
    <div className="space-y-4 text-gray-700">
      <p>
        A lumpsum investment calculator helps you calculate the future value of a one-time investment 
        with compound returns over a specified period.
      </p>
      <div className="space-y-2">
        <h3 className="font-semibold">Formula:</h3>
        <div className="bg-gray-100 p-3 rounded font-mono text-sm">
          FV = P × (1 + r/100)^t
        </div>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong>FV</strong> = Future Value</li>
          <li><strong>P</strong> = Principal Amount (Lumpsum Investment)</li>
          <li><strong>r</strong> = Expected Annual Return Rate (%)</li>
          <li><strong>t</strong> = Time Period (in years)</li>
        </ul>
      </div>
      <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
        <p className="text-sm">
          <strong>Best For:</strong> Lumpsum investments work well when you have a large amount to invest 
          upfront and can benefit from compound growth over time. Ideal for windfalls, bonuses, or savings.
        </p>
      </div>
    </div>
  );

  return (
    <CalculatorLayout
      title="Lumpsum Calculator"
      description="Calculate future value of one-time investment"
      results={results}
      chart={chart}
      explanation={explanation}
    >
      <InputField
        label="Investment Amount"
        type="number"
        value={investment}
        onChange={setInvestment}
        placeholder="Enter investment amount"
        prefix="₹"
        step="1000"
        min="0"
      />
      <InputField
        label="Expected Return Rate"
        type="number"
        value={rate}
        onChange={setRate}
        placeholder="Enter expected return %"
        suffix="% p.a."
        step="0.1"
        min="0"
      />
      <InputField
        label="Investment Period"
        type="number"
        value={tenure}
        onChange={setTenure}
        placeholder="Enter investment period"
        step="1"
        min="0"
      />
      <SelectField
        label="Period Unit"
        value={tenureType}
        onChange={setTenureType}
        options={[
          { label: 'Years', value: 'years' },
          { label: 'Months', value: 'months' },
        ]}
      />
    </CalculatorLayout>
  );
}
