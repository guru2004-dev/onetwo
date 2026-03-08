'use client';

import React, { useState, useEffect } from 'react';
import CalculatorLayout from '@/components/CalculatorLayout';
import InputField from '@/components/InputField';
import ResultCard from '@/components/ResultCard';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function BreakEvenCalculator() {
  const [fixedCosts, setFixedCosts] = useState('100000');
  const [variableCostPerUnit, setVariableCostPerUnit] = useState('50');
  const [sellingPricePerUnit, setSellingPricePerUnit] = useState('100');
  
  const [breakEvenUnits, setBreakEvenUnits] = useState(0);
  const [breakEvenRevenue, setBreakEvenRevenue] = useState(0);
  const [contributionMargin, setContributionMargin] = useState(0);
  const [contributionMarginRatio, setContributionMarginRatio] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    calculate();
  }, [fixedCosts, variableCostPerUnit, sellingPricePerUnit]);

  const calculate = () => {
    const fc = parseFloat(fixedCosts) || 0;
    const vc = parseFloat(variableCostPerUnit) || 0;
    const sp = parseFloat(sellingPricePerUnit) || 0;
    
    if (fc > 0 && sp > vc && sp > 0) {
      // Contribution Margin per unit = Selling Price - Variable Cost
      const cm = sp - vc;
      
      // Break-Even Point (units) = Fixed Costs / Contribution Margin
      const beu = fc / cm;
      
      // Break-Even Revenue = Break-Even Units × Selling Price
      const ber = beu * sp;
      
      // Contribution Margin Ratio = (Contribution Margin / Selling Price) × 100
      const cmr = (cm / sp) * 100;

      setBreakEvenUnits(beu);
      setBreakEvenRevenue(ber);
      setContributionMargin(cm);
      setContributionMarginRatio(cmr);

      // Generate chart data
      const data = [];
      const maxUnits = Math.ceil(beu * 2);
      const step = Math.ceil(maxUnits / 10);

      for (let units = 0; units <= maxUnits; units += step) {
        const revenue = units * sp;
        const totalCost = fc + (units * vc);
        const profit = revenue - totalCost;

        data.push({
          units: units,
          revenue: revenue,
          totalCost: totalCost,
          profit: profit,
        });
      }

      // Add break-even point to chart
      const breakEvenPoint = {
        units: Math.round(beu),
        revenue: ber,
        totalCost: ber,
        profit: 0,
      };
      data.push(breakEvenPoint);
      data.sort((a, b) => a.units - b.units);

      setChartData(data);
    } else {
      setBreakEvenUnits(0);
      setBreakEvenRevenue(0);
      setContributionMargin(0);
      setContributionMarginRatio(0);
      setChartData([]);
    }
  };

  const results = breakEvenUnits > 0 && (
    <div className="space-y-4">
      <ResultCard 
        label="Break-Even Point (Units)" 
        value={formatNumber(breakEvenUnits)} 
        highlighted 
      />
      <ResultCard 
        label="Break-Even Revenue" 
        value={formatCurrency(breakEvenRevenue)} 
      />
      <ResultCard 
        label="Contribution Margin per Unit" 
        value={formatCurrency(contributionMargin)} 
      />
      <ResultCard 
        label="Contribution Margin Ratio" 
        value={`${contributionMarginRatio.toFixed(2)}%`} 
      />
      <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-700">Fixed Costs:</span>
            <span className="font-semibold text-indigo-600">{formatCurrency(parseFloat(fixedCosts) || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Variable Cost per Unit:</span>
            <span className="font-semibold text-orange-600">{formatCurrency(parseFloat(variableCostPerUnit) || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Selling Price per Unit:</span>
            <span className="font-semibold text-green-600">{formatCurrency(parseFloat(sellingPricePerUnit) || 0)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-gray-700 font-medium">Units to Break Even:</span>
            <span className="font-bold text-indigo-600">{formatNumber(breakEvenUnits)}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-gray-700">
          You need to sell <strong>{Math.ceil(breakEvenUnits)} units</strong> to cover all costs 
          and reach your break-even point. Any sales beyond this will generate profit.
        </p>
      </div>
    </div>
  );

  const chart = chartData.length > 0 && (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="units" label={{ value: 'Units Sold', position: 'insideBottom', offset: -5 }} />
        <YAxis label={{ value: 'Amount (₹)', angle: -90, position: 'insideLeft' }} />
        <Tooltip formatter={(value: number | string) => formatCurrency(Number(value))} />
        <Legend />
        <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue" strokeWidth={2} />
        <Line type="monotone" dataKey="totalCost" stroke="#ef4444" name="Total Cost" strokeWidth={2} />
        <Line type="monotone" dataKey="profit" stroke="#4f46e5" name="Profit/Loss" strokeWidth={2} strokeDasharray="5 5" />
      </LineChart>
    </ResponsiveContainer>
  );

  const explanation = (
    <div className="space-y-4 text-gray-700">
      <p>
        The Break-Even Point is where total revenue equals total costs, meaning the business 
        neither makes a profit nor a loss. It's crucial for pricing, planning, and decision-making.
      </p>
      <div className="space-y-2">
        <h3 className="font-semibold">Key Formulas:</h3>
        <div className="space-y-2">
          <div className="bg-gray-100 p-3 rounded font-mono text-sm">
            Contribution Margin = Selling Price - Variable Cost
          </div>
          <div className="bg-gray-100 p-3 rounded font-mono text-sm">
            Break-Even Units = Fixed Costs / Contribution Margin
          </div>
          <div className="bg-gray-100 p-3 rounded font-mono text-sm">
            Break-Even Revenue = Break-Even Units × Selling Price
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold">Components:</h3>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong>Fixed Costs:</strong> Costs that don't change with production (rent, salaries, insurance)</li>
          <li><strong>Variable Costs:</strong> Costs that vary with production volume (materials, labor per unit)</li>
          <li><strong>Contribution Margin:</strong> Amount each unit contributes to covering fixed costs</li>
        </ul>
      </div>
      <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
        <p className="text-sm">
          <strong>Business Insight:</strong> Lower break-even point means less risk. You can reduce 
          it by cutting fixed costs, reducing variable costs, or increasing selling price.
        </p>
      </div>
    </div>
  );

  return (
    <CalculatorLayout
      title="Break-Even Calculator"
      description="Calculate the break-even point for your business"
      results={results}
      chart={chart}
      explanation={explanation}
    >
      <InputField
        label="Fixed Costs"
        type="number"
        value={fixedCosts}
        onChange={setFixedCosts}
        placeholder="Enter fixed costs"
        prefix="₹"
        step="1000"
        min="0"
        tooltip="Costs that remain constant regardless of production (rent, salaries, etc.)"
      />
      <InputField
        label="Variable Cost per Unit"
        type="number"
        value={variableCostPerUnit}
        onChange={setVariableCostPerUnit}
        placeholder="Enter variable cost per unit"
        prefix="₹"
        step="1"
        min="0"
        tooltip="Costs that change with each unit produced (materials, labor per unit, etc.)"
      />
      <InputField
        label="Selling Price per Unit"
        type="number"
        value={sellingPricePerUnit}
        onChange={setSellingPricePerUnit}
        placeholder="Enter selling price per unit"
        prefix="₹"
        step="1"
        min="0"
      />
    </CalculatorLayout>
  );
}
