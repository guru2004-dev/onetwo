'use client';

import React, { useState, useEffect } from 'react';
import CalculatorLayout from '@/components/CalculatorLayout';
import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import ResultCard from '@/components/ResultCard';
import { useCurrency } from '@/context/CurrencyContext';
import { calculateSIP, formatCurrency } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function SIPCalculator() {
  const { lastUpdatedTime } = useCurrency();
  const [monthlyInvestment, setMonthlyInvestment] = useState('5000');
  const [expectedReturn, setExpectedReturn] = useState('12');
  const [timePeriod, setTimePeriod] = useState('10');
  const [timePeriodType, setTimePeriodType] = useState('years');
  
  const [maturityAmount, setMaturityAmount] = useState(0);
  const [investedAmount, setInvestedAmount] = useState(0);
  const [estimatedReturns, setEstimatedReturns] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    calculate();
  }, [monthlyInvestment, expectedReturn, timePeriod, timePeriodType, lastUpdatedTime]);

  const calculate = () => {
    const monthly = parseFloat(monthlyInvestment) || 0;
    const rate = parseFloat(expectedReturn) || 0;
    let period = parseInt(timePeriod) || 0;
    
    if (timePeriodType === 'years') {
      period = period * 12;
    }

    if (monthly > 0 && rate > 0 && period > 0) {
      const result = calculateSIP(monthly, rate, period);
      
      setMaturityAmount(result.maturityAmount);
      setInvestedAmount(result.invested);
      setEstimatedReturns(result.gains);

      // Generate chart data for growth over time
      const data = [];
      const monthlyRate = rate / 12 / 100;
      
      for (let i = 1; i <= period; i++) {
        if (i % Math.ceil(period / 20) === 0 || i === 1 || i === period) {
          const invested = monthly * i;
          const maturity = monthly * ((Math.pow(1 + monthlyRate, i) - 1) / monthlyRate) * (1 + monthlyRate);
          const returns = maturity - invested;
          
          data.push({
            period: timePeriodType === 'years' ? `Y${Math.ceil(i / 12)}` : `M${i}`,
            invested: Math.round(invested),
            returns: Math.round(returns),
            total: Math.round(maturity),
          });
        }
      }
      setChartData(data);
    } else {
      setMaturityAmount(0);
      setInvestedAmount(0);
      setEstimatedReturns(0);
      setChartData([]);
    }
  };

  const pieData = [
    { name: 'Invested Amount', value: Math.round(investedAmount) },
    { name: 'Estimated Returns', value: Math.round(estimatedReturns) },
  ];

  const COLORS = ['#4f46e5', '#10b981'];

  const results = maturityAmount > 0 && (
    <div className="space-y-4">
      <ResultCard label="Maturity Amount" value={formatCurrency(maturityAmount)} highlighted />
      <ResultCard label="Invested Amount" value={formatCurrency(investedAmount)} />
      <ResultCard label="Estimated Returns" value={formatCurrency(estimatedReturns)} />
      <div className="mt-4 p-4 bg-green-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">Return Rate</span>
          <span className="font-semibold text-green-600">
            {investedAmount > 0 ? ((estimatedReturns / investedAmount) * 100).toFixed(2) : 0}%
          </span>
        </div>
      </div>
    </div>
  );

  const chart = chartData.length > 0 && (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Investment Growth Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip formatter={(value: number | string) => formatCurrency(Number(value))} />
            <Legend />
            <Line type="monotone" dataKey="invested" stroke="#4f46e5" name="Invested" strokeWidth={2} />
            <Line type="monotone" dataKey="returns" stroke="#10b981" name="Returns" strokeWidth={2} />
            <Line type="monotone" dataKey="total" stroke="#f59e0b" name="Total Value" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">Investment Breakdown</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
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
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">What is SIP?</h3>
        <p>
          SIP (Systematic Investment Plan) is a method of investing a fixed sum regularly in mutual funds. 
          SIP allows investors to invest in a disciplined manner without worrying about market volatility and timing the market.
        </p>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Formula</h3>
        <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
          M = P × ((1 + r)^n - 1) / r × (1 + r)
          <br />
          <br />
          Where:
          <br />
          M = Maturity Amount
          <br />
          P = Monthly investment amount
          <br />
          r = Expected monthly return rate (annual rate / 12 / 100)
          <br />
          n = Total number of months
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Benefits of SIP</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Disciplined investing habit</li>
          <li>Rupee cost averaging</li>
          <li>Power of compounding</li>
          <li>Flexibility to increase or pause investments</li>
          <li>Suitable for all income levels</li>
        </ul>
      </div>
    </div>
  );

  return (
    <CalculatorLayout
      title="SIP Calculator"
      description="Calculate returns from Systematic Investment Plan"
      results={results}
      chart={chart}
      explanation={explanation}
    >
      <div className="space-y-4">
        <InputField
          label="Monthly Investment Amount"
          value={monthlyInvestment}
          onChange={setMonthlyInvestment}
          placeholder="Enter monthly amount"
          prefix="₹"
          required
        />
        <InputField
          label="Expected Annual Return Rate"
          value={expectedReturn}
          onChange={setExpectedReturn}
          placeholder="Enter expected return"
          suffix="%"
          step="0.1"
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Time Period"
            value={timePeriod}
            onChange={setTimePeriod}
            placeholder="Enter time period"
            required
          />
          <SelectField
            label="Period Type"
            value={timePeriodType}
            onChange={setTimePeriodType}
            options={[
              { label: 'Years', value: 'years' },
              { label: 'Months', value: 'months' },
            ]}
          />
        </div>
      </div>
    </CalculatorLayout>
  );
}
