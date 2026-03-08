'use client';

import React, { useState, useEffect } from 'react';
import CalculatorLayout from '@/components/CalculatorLayout';
import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import ResultCard from '@/components/ResultCard';
import { formatCurrency, formatPercentage } from '@/lib/utils';

export default function MarkupMarginCalculator() {
  const [calculationType, setCalculationType] = useState('markup-to-margin');
  const [cost, setCost] = useState('100');
  const [markup, setMarkup] = useState('50');
  const [margin, setMargin] = useState('33.33');
  const [sellingPrice, setSellingPrice] = useState('');
  
  const [calculatedMargin, setCalculatedMargin] = useState(0);
  const [calculatedMarkup, setCalculatedMarkup] = useState(0);
  const [calculatedSellingPrice, setCalculatedSellingPrice] = useState(0);
  const [profit, setProfit] = useState(0);

  useEffect(() => {
    calculate();
  }, [calculationType, cost, markup, margin, sellingPrice]);

  const calculate = () => {
    const costValue = parseFloat(cost) || 0;
    
    if (calculationType === 'markup-to-margin') {
      const markupValue = parseFloat(markup) || 0;
      const sp = costValue * (1 + markupValue / 100);
      const marginValue = ((sp - costValue) / sp) * 100;
      const profitValue = sp - costValue;
      
      setCalculatedSellingPrice(sp);
      setCalculatedMargin(marginValue);
      setCalculatedMarkup(markupValue);
      setProfit(profitValue);
    } else if (calculationType === 'margin-to-markup') {
      const marginValue = parseFloat(margin) || 0;
      const sp = costValue / (1 - marginValue / 100);
      const markupValue = ((sp - costValue) / costValue) * 100;
      const profitValue = sp - costValue;
      
      setCalculatedSellingPrice(sp);
      setCalculatedMargin(marginValue);
      setCalculatedMarkup(markupValue);
      setProfit(profitValue);
    } else if (calculationType === 'price-to-both') {
      const spValue = parseFloat(sellingPrice) || 0;
      const markupValue = ((spValue - costValue) / costValue) * 100;
      const marginValue = ((spValue - costValue) / spValue) * 100;
      const profitValue = spValue - costValue;
      
      setCalculatedSellingPrice(spValue);
      setCalculatedMargin(marginValue);
      setCalculatedMarkup(markupValue);
      setProfit(profitValue);
    }
  };

  const results = (
    <div className="space-y-4">
      <ResultCard 
        label="Selling Price" 
        value={formatCurrency(calculatedSellingPrice)} 
        highlighted 
      />
      <ResultCard 
        label="Markup Percentage" 
        value={formatPercentage(calculatedMarkup)} 
      />
      <ResultCard 
        label="Margin Percentage" 
        value={formatPercentage(calculatedMargin)} 
      />
      <ResultCard 
        label="Profit Amount" 
        value={formatCurrency(profit)} 
      />
      <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-700">Cost Price:</span>
            <span className="font-semibold text-indigo-600">{formatCurrency(parseFloat(cost) || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Profit:</span>
            <span className="font-semibold text-green-600">{formatCurrency(profit)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-gray-700 font-medium">Selling Price:</span>
            <span className="font-bold text-indigo-600">{formatCurrency(calculatedSellingPrice)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const explanation = (
    <div className="space-y-4 text-gray-700">
      <p>
        Understanding the difference between markup and margin is crucial for pricing and profitability.
      </p>
      <div className="space-y-2">
        <h3 className="font-semibold">Key Concepts:</h3>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong>Markup:</strong> Percentage added to cost to get selling price (Profit / Cost × 100)</li>
          <li><strong>Margin:</strong> Percentage of profit in selling price (Profit / Selling Price × 100)</li>
          <li><strong>Formulas:</strong></li>
          <ul className="list-circle list-inside ml-6 mt-1">
            <li>Markup = (Selling Price - Cost) / Cost × 100</li>
            <li>Margin = (Selling Price - Cost) / Selling Price × 100</li>
            <li>Selling Price = Cost × (1 + Markup/100)</li>
            <li>Selling Price = Cost / (1 - Margin/100)</li>
          </ul>
        </ul>
      </div>
      <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
        <p className="text-sm">
          <strong>Note:</strong> Markup is always higher than margin for the same profit amount. 
          For example, a 50% markup equals a 33.33% margin.
        </p>
      </div>
    </div>
  );

  return (
    <CalculatorLayout
      title="Markup & Margin Calculator"
      description="Calculate markup, margin, and selling price for products"
      results={results}
      explanation={explanation}
    >
      <SelectField
        label="Calculation Type"
        value={calculationType}
        onChange={setCalculationType}
        options={[
          { label: 'Calculate Margin from Markup', value: 'markup-to-margin' },
          { label: 'Calculate Markup from Margin', value: 'margin-to-markup' },
          { label: 'Calculate Both from Price', value: 'price-to-both' },
        ]}
      />
      <InputField
        label="Cost Price"
        type="number"
        value={cost}
        onChange={setCost}
        placeholder="Enter cost price"
        prefix="₹"
        step="0.01"
        min="0"
      />
      {calculationType === 'markup-to-margin' && (
        <InputField
          label="Markup Percentage"
          type="number"
          value={markup}
          onChange={setMarkup}
          placeholder="Enter markup %"
          suffix="%"
          step="0.01"
          min="0"
        />
      )}
      {calculationType === 'margin-to-markup' && (
        <InputField
          label="Margin Percentage"
          type="number"
          value={margin}
          onChange={setMargin}
          placeholder="Enter margin %"
          suffix="%"
          step="0.01"
          min="0"
          max="100"
        />
      )}
      {calculationType === 'price-to-both' && (
        <InputField
          label="Selling Price"
          type="number"
          value={sellingPrice}
          onChange={setSellingPrice}
          placeholder="Enter selling price"
          prefix="₹"
          step="0.01"
          min="0"
        />
      )}
    </CalculatorLayout>
  );
}
