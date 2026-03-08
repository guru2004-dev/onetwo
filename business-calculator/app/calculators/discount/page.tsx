'use client';

import React, { useState, useEffect } from 'react';
import CalculatorLayout from '@/components/CalculatorLayout';
import InputField from '@/components/InputField';
import ResultCard from '@/components/ResultCard';
import { calculateDiscount, formatCurrency } from '@/lib/utils';

export default function DiscountCalculator() {
  const [originalPrice, setOriginalPrice] = useState('1000');
  const [discountPercent, setDiscountPercent] = useState('20');
  
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [savings, setSavings] = useState(0);

  useEffect(() => {
    calculate();
  }, [originalPrice, discountPercent]);

  const calculate = () => {
    const price = parseFloat(originalPrice) || 0;
    const discount = parseFloat(discountPercent) || 0;

    if (price > 0 && discount >= 0) {
      const result = calculateDiscount(price, discount);
      setDiscountAmount(result.discountAmount);
      setFinalPrice(result.finalPrice);
      setSavings(result.discountAmount);
    } else {
      setDiscountAmount(0);
      setFinalPrice(0);
      setSavings(0);
    }
  };

  const results = finalPrice >= 0 && (
    <div className="space-y-4">
      <ResultCard label="Final Price" value={formatCurrency(finalPrice)} highlighted />
      <ResultCard label="Discount Amount" value={formatCurrency(discountAmount)} />
      <ResultCard label="You Save" value={formatCurrency(savings)} />
      <div className="mt-4 p-4 bg-green-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">Original Price</span>
          <span className="font-semibold text-gray-900">{formatCurrency(parseFloat(originalPrice))}</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-700">Discount</span>
          <span className="font-semibold text-green-600">{discountPercent}% OFF</span>
        </div>
      </div>
    </div>
  );

  const explanation = (
    <div className="space-y-4 text-gray-700">
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">What is a Discount?</h3>
        <p>
          A discount is a reduction applied to the regular price of a product or service. 
          Discounts are typically expressed as a percentage off the original price.
        </p>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Formula</h3>
        <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
          Discount Amount = Original Price × (Discount % / 100)
          <br />
          Final Price = Original Price - Discount Amount
          <br />
          <br />
          Example: ₹1000 with 20% discount
          <br />
          Discount = ₹1000 × 0.20 = ₹200
          <br />
          Final Price = ₹1000 - ₹200 = ₹800
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Common Discount Scenarios</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Seasonal sales and clearance</li>
          <li>Volume or bulk purchase discounts</li>
          <li>Early payment discounts</li>
          <li>Loyalty program discounts</li>
          <li>Promotional offers and coupons</li>
        </ul>
      </div>
    </div>
  );

  return (
    <CalculatorLayout
      title="Discount Calculator"
      description="Calculate discounts and final prices"
      results={results}
      explanation={explanation}
    >
      <div className="space-y-4">
        <InputField
          label="Original Price"
          value={originalPrice}
          onChange={setOriginalPrice}
          placeholder="Enter original price"
          prefix="₹"
          required
        />
        <InputField
          label="Discount Percentage"
          value={discountPercent}
          onChange={setDiscountPercent}
          placeholder="Enter discount percentage"
          suffix="%"
          step="0.1"
          min="0"
          max="100"
          required
        />
      </div>
    </CalculatorLayout>
  );
}
