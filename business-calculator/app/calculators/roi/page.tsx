'use client';

import React, { useState, useEffect } from 'react';
import CalculatorLayout from '@/components/CalculatorLayout';
import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import ResultCard from '@/components/ResultCard';
import { useCurrency } from '@/context/CurrencyContext';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function ROICalculator() {
  const { lastUpdatedTime } = useCurrency();
  const [calculationType, setCalculationType] = useState('basic');
  const [initialInvestment, setInitialInvestment] = useState('50000');
  const [finalValue, setFinalValue] = useState('75000');
  const [additionalCosts, setAdditionalCosts] = useState('0');
  const [revenue, setRevenue] = useState('0');
  const [timePeriod, setTimePeriod] = useState('12');
  
  const [roi, setROI] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [annualizedROI, setAnnualizedROI] = useState(0);

  useEffect(() => {
    calculate();
  }, [calculationType, initialInvestment, finalValue, additionalCosts, revenue, timePeriod, lastUpdatedTime]);

  const calculate = () => {
    const initial = parseFloat(initialInvestment) || 0;
    const final = parseFloat(finalValue) || 0;
    const costs = parseFloat(additionalCosts) || 0;
    const rev = parseFloat(revenue) || 0;
    const time = parseFloat(timePeriod) || 1;
    
    let totalInvestment = initial + costs;
    let totalReturn = 0;
    let profit = 0;
    let roiValue = 0;
    let annualROI = 0;

    if (calculationType === 'basic') {
      totalReturn = final;
      profit = totalReturn - totalInvestment;
      roiValue = totalInvestment > 0 ? (profit / totalInvestment) * 100 : 0;
      annualROI = time > 0 ? (roiValue / time) * 12 : 0;
    } else if (calculationType === 'business') {
      totalReturn = rev;
      profit = totalReturn - totalInvestment;
      roiValue = totalInvestment > 0 ? (profit / totalInvestment) * 100 : 0;
      annualROI = time > 0 ? (roiValue / time) * 12 : 0;
    }

    setROI(roiValue);
    setNetProfit(profit);
    setAnnualizedROI(annualROI);
  };

  const pieData = Math.abs(netProfit) > 0 ? [
    { name: 'Investment', value: parseFloat(initialInvestment) || 0 },
    { name: 'Additional Costs', value: parseFloat(additionalCosts) || 0 },
    { name: netProfit >= 0 ? 'Profit' : 'Loss', value: Math.abs(netProfit) },
  ].filter(item => item.value > 0) : [];

  const COLORS = ['#4f46e5', '#f59e0b', netProfit >= 0 ? '#10b981' : '#ef4444'];

  const results = (
    <div className="space-y-4">
      <ResultCard 
        label="Return on Investment (ROI)" 
        value={formatPercentage(roi)} 
        highlighted 
      />
      <ResultCard 
        label="Net Profit/Loss" 
        value={formatCurrency(netProfit)} 
      />
      <ResultCard 
        label="Annualized ROI" 
        value={formatPercentage(annualizedROI)} 
      />
      <div className={`mt-4 p-4 rounded-lg ${netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-700">Total Investment:</span>
            <span className="font-semibold text-indigo-600">
              {formatCurrency((parseFloat(initialInvestment) || 0) + (parseFloat(additionalCosts) || 0))}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">
              {calculationType === 'basic' ? 'Final Value:' : 'Total Revenue:'}
            </span>
            <span className="font-semibold text-blue-600">
              {formatCurrency(calculationType === 'basic' ? (parseFloat(finalValue) || 0) : (parseFloat(revenue) || 0))}
            </span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-gray-700 font-medium">Net {netProfit >= 0 ? 'Profit' : 'Loss'}:</span>
            <span className={`font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netProfit)}
            </span>
          </div>
        </div>
      </div>
      {roi !== 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            {roi > 0 ? (
              <>For every ₹1 invested, you gained <strong>{formatCurrency(roi / 100)}</strong> in returns.</>
            ) : (
              <>For every ₹1 invested, you lost <strong>{formatCurrency(Math.abs(roi) / 100)}</strong>.</>
            )}
          </p>
        </div>
      )}
    </div>
  );

  const chart = pieData.length > 0 && (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(1)}%`}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number | string) => formatCurrency(Number(value))} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );

  const explanation = (
    <div className="space-y-4 text-gray-700">
      <p>
        Return on Investment (ROI) measures the profitability of an investment relative to its cost. 
        It's one of the most important metrics for evaluating investment performance.
      </p>
      <div className="space-y-2">
        <h3 className="font-semibold">Formula:</h3>
        <div className="bg-gray-100 p-3 rounded font-mono text-sm">
          ROI = (Net Profit / Total Investment) × 100
        </div>
        <div className="bg-gray-100 p-3 rounded font-mono text-sm mt-2">
          Net Profit = Final Value - Total Investment
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold">Interpretation:</h3>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong>Positive ROI:</strong> Investment is profitable</li>
          <li><strong>Negative ROI:</strong> Investment resulted in a loss</li>
          <li><strong>Higher ROI:</strong> Better investment performance</li>
          <li><strong>Annualized ROI:</strong> ROI adjusted for time period (useful for comparing different investments)</li>
        </ul>
      </div>
      <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
        <p className="text-sm">
          <strong>Note:</strong> ROI doesn't account for the time value of money or risk factors. 
          Use it alongside other metrics for comprehensive investment analysis.
        </p>
      </div>
    </div>
  );

  return (
    <CalculatorLayout
      title="ROI Calculator"
      description="Calculate Return on Investment for your investments or business ventures"
      results={results}
      chart={chart}
      explanation={explanation}
    >
      <SelectField
        label="Calculation Type"
        value={calculationType}
        onChange={setCalculationType}
        options={[
          { label: 'Basic Investment ROI', value: 'basic' },
          { label: 'Business/Marketing ROI', value: 'business' },
        ]}
      />
      <InputField
        label="Initial Investment"
        type="number"
        value={initialInvestment}
        onChange={setInitialInvestment}
        placeholder="Enter initial investment"
        prefix="₹"
        step="1000"
        min="0"
      />
      <InputField
        label="Additional Costs"
        type="number"
        value={additionalCosts}
        onChange={setAdditionalCosts}
        placeholder="Enter additional costs"
        prefix="₹"
        step="100"
        min="0"
        tooltip="Include maintenance, fees, or other costs"
      />
      {calculationType === 'basic' ? (
        <InputField
          label="Final Value"
          type="number"
          value={finalValue}
          onChange={setFinalValue}
          placeholder="Enter final value"
          prefix="₹"
          step="1000"
          min="0"
        />
      ) : (
        <InputField
          label="Total Revenue"
          type="number"
          value={revenue}
          onChange={setRevenue}
          placeholder="Enter total revenue"
          prefix="₹"
          step="1000"
          min="0"
        />
      )}
      <InputField
        label="Time Period"
        type="number"
        value={timePeriod}
        onChange={setTimePeriod}
        placeholder="Enter time period"
        suffix="months"
        step="1"
        min="1"
        tooltip="Used for calculating annualized ROI"
      />
    </CalculatorLayout>
  );
}
