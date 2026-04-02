'use client';

import React, { useState, useEffect } from 'react';
import CalculatorLayout from '@/components/CalculatorLayout';
import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import ResultCard from '@/components/ResultCard';
import { useCurrency } from '@/context/CurrencyContext';
import { formatCurrency } from '@/lib/utils';

export default function JewelleryCalculator() {
  const { lastUpdatedTime } = useCurrency();
  const [metalType, setMetalType] = useState('Gold');
  const [purity, setPurity] = useState('22K');
  const [weight, setWeight] = useState('10');
  const [ratePerGram, setRatePerGram] = useState('6000');
  const [makingChargeType, setMakingChargeType] = useState('perGram');
  const [makingChargeValue, setMakingChargeValue] = useState('800');
  const [stoneCharges, setStoneCharges] = useState('2000');
  const [gstPercentage, setGstPercentage] = useState('3');
  
  const [metalCost, setMetalCost] = useState(0);
  const [makingCharges, setMakingCharges] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    calculate();
  }, [weight, ratePerGram, makingChargeType, makingChargeValue, stoneCharges, gstPercentage, lastUpdatedTime]);

  const calculate = () => {
    const wt = parseFloat(weight) || 0;
    const rate = parseFloat(ratePerGram) || 0;
    const makingValue = parseFloat(makingChargeValue) || 0;
    const stone = parseFloat(stoneCharges) || 0;
    const gst = parseFloat(gstPercentage) || 0;

    if (wt > 0 && rate > 0) {
      // 1. Metal Cost = Weight × Rate per gram
      const metalCostCalc = wt * rate;
      
      // 2. Making Charges calculation
      let makingChargesCalc = 0;
      if (makingChargeType === 'perGram') {
        // Making Charges = Weight × Making charge per gram
        makingChargesCalc = wt * makingValue;
      } else {
        // Making Charges = Metal Cost × (Making % ÷ 100)
        makingChargesCalc = metalCostCalc * (makingValue / 100);
      }
      
      // 3. Subtotal = Metal Cost + Making Charges + Stone Charges
      const subtotalCalc = metalCostCalc + makingChargesCalc + stone;
      
      // 4. GST = Subtotal × (GST % ÷ 100)
      const gstAmountCalc = subtotalCalc * (gst / 100);
      
      // 5. Total Jewellery Price = Subtotal + GST
      const totalPriceCalc = subtotalCalc + gstAmountCalc;
      
      setMetalCost(metalCostCalc);
      setMakingCharges(makingChargesCalc);
      setSubtotal(subtotalCalc);
      setGstAmount(gstAmountCalc);
      setTotalPrice(totalPriceCalc);
    } else {
      setMetalCost(0);
      setMakingCharges(0);
      setSubtotal(0);
      setGstAmount(0);
      setTotalPrice(0);
    }
  };

  const metalTypes = [
    { value: 'Gold', label: 'Gold' },
    { value: 'Silver', label: 'Silver' },
    { value: 'Diamond', label: 'Diamond' },
  ];

  const purityOptions = [
    { value: '24K', label: '24K (99.9% Pure)' },
    { value: '22K', label: '22K (91.6% Pure)' },
    { value: '18K', label: '18K (75% Pure)' },
  ];

  const makingChargeTypes = [
    { value: 'perGram', label: '₹ per gram' },
    { value: 'percentage', label: 'Percentage (%)' },
  ];

  const results = totalPrice > 0 && (
    <div className="space-y-4">
      <ResultCard 
        label="Final Jewellery Bill" 
        value={formatCurrency(totalPrice)} 
        highlighted 
      />
      <div className="grid grid-cols-2 gap-4">
        <ResultCard label="Metal Cost" value={formatCurrency(metalCost)} />
        <ResultCard label="Making Charges" value={formatCurrency(makingCharges)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ResultCard label="Stone Charges" value={formatCurrency(parseFloat(stoneCharges) || 0)} />
        <ResultCard label="GST Amount" value={formatCurrency(gstAmount)} />
      </div>
      
      <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
        <h4 className="font-semibold text-gray-900 mb-3">Price Breakdown</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-700">Metal ({metalType} - {purity})</span>
            <span className="font-semibold">{formatCurrency(metalCost)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-700">
              Making Charges 
              {makingChargeType === 'perGram' 
                ? ` (₹${makingChargeValue}/g)` 
                : ` (${makingChargeValue}%)`}
            </span>
            <span className="font-semibold">{formatCurrency(makingCharges)}</span>
          </div>
          {parseFloat(stoneCharges) > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">Stone/Diamond Charges</span>
              <span className="font-semibold">{formatCurrency(parseFloat(stoneCharges))}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm border-t border-yellow-300 pt-2">
            <span className="text-gray-700">Subtotal</span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-700">GST ({gstPercentage}%)</span>
            <span className="font-semibold text-green-600">{formatCurrency(gstAmount)}</span>
          </div>
          <div className="flex justify-between items-center border-t-2 border-yellow-400 pt-2">
            <span className="font-bold text-gray-900">Total Amount</span>
            <span className="font-bold text-lg text-amber-600">{formatCurrency(totalPrice)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-xs text-blue-800">
          <strong>Weight:</strong> {weight}g | 
          <strong> Rate:</strong> {formatCurrency(parseFloat(ratePerGram))}/g | 
          <strong> Total Weight Cost:</strong> {formatCurrency(metalCost)}
        </div>
      </div>
    </div>
  );

  const explanation = (
    <div className="space-y-4 text-gray-700">
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">What is a Jewellery Calculator?</h3>
        <p>
          A jewellery calculator helps you calculate the final bill for jewellery purchases by considering 
          metal cost, making charges, stone charges, and GST. It provides transparency in pricing and helps 
          you understand the complete cost breakdown.
        </p>
      </div>
      
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Calculation Formula</h3>
        <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm space-y-2">
          <p>1. Metal Cost = Weight × Rate per gram</p>
          <p>2. Making Charges:</p>
          <p className="pl-4">• If ₹ per gram: Weight × Charge per gram</p>
          <p className="pl-4">• If Percentage: Metal Cost × (% ÷ 100)</p>
          <p>3. Subtotal = Metal Cost + Making + Stone Charges</p>
          <p>4. GST = Subtotal × (GST % ÷ 100)</p>
          <p>5. Total = Subtotal + GST</p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Example Calculation</h3>
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-sm">
          <p className="font-semibold mb-2">22K Gold Jewellery - 10 grams</p>
          <div className="space-y-1">
            <p>• Metal Rate: ₹6,000/gram</p>
            <p>• Making Charges: ₹800/gram</p>
            <p>• Stone Charges: ₹2,000</p>
            <p>• GST: 3%</p>
          </div>
          <div className="mt-3 space-y-1 border-t border-amber-300 pt-2">
            <p>Metal Cost = 10 × 6,000 = <strong>₹60,000</strong></p>
            <p>Making = 10 × 800 = <strong>₹8,000</strong></p>
            <p>Subtotal = 60,000 + 8,000 + 2,000 = <strong>₹70,000</strong></p>
            <p>GST = 70,000 × 3% = <strong>₹2,100</strong></p>
            <p className="text-base font-bold text-amber-700">Total = ₹72,100</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Gold Purity Levels</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>24K Gold:</strong> 99.9% pure - Softest, most expensive</li>
          <li><strong>22K Gold:</strong> 91.6% pure - Commonly used in Indian jewellery</li>
          <li><strong>18K Gold:</strong> 75% pure - More durable, used in modern designs</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Making Charges</h3>
        <p className="text-sm mb-2">Making charges vary based on:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Design complexity and craftsmanship</li>
          <li>Labour and manufacturing costs</li>
          <li>Brand and jeweller markup</li>
          <li>Weight and size of the jewellery</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-2">GST on Jewellery</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>3% GST:</strong> On gold and silver jewellery</li>
          <li><strong>0.25% GST:</strong> On gold and silver bars/coins</li>
          <li><strong>5% GST:</strong> On diamond jewellery (cut & polished)</li>
        </ul>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Important Notes</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Always verify current gold rates before purchase</li>
          <li>Ask for detailed bill with component-wise breakdown</li>
          <li>Making charges are negotiable with jewellers</li>
          <li>Keep invoices for warranty and resale purposes</li>
          <li>Check hallmark certification for gold purity</li>
        </ul>
      </div>
    </div>
  );

  return (
    <CalculatorLayout
      title="Jewellery Price Calculator"
      description="Calculate the final jewellery bill with metal cost, making charges, stone charges, and GST"
      results={results}
      explanation={explanation}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          label="Metal Type"
          value={metalType}
          onChange={setMetalType}
          options={metalTypes}
        />
        <SelectField
          label="Purity"
          value={purity}
          onChange={setPurity}
          options={purityOptions}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Weight (grams)"
          value={weight}
          onChange={setWeight}
          placeholder="Enter weight"
          type="number"
          tooltip="Total weight of jewellery in grams"
        />
        <InputField
          label="Rate per gram (₹)"
          value={ratePerGram}
          onChange={setRatePerGram}
          placeholder="Enter rate"
          type="number"
          tooltip="Current market rate per gram"
        />
      </div>

      <div className="border-t border-gray-200 pt-4">
        <SelectField
          label="Making Charges Type"
          value={makingChargeType}
          onChange={setMakingChargeType}
          options={makingChargeTypes}
        />
        <InputField
          label={makingChargeType === 'perGram' ? 'Making Charges (₹ per gram)' : 'Making Charges (%)'}
          value={makingChargeValue}
          onChange={setMakingChargeValue}
          placeholder={makingChargeType === 'perGram' ? 'Enter charges per gram' : 'Enter percentage'}
          type="number"
          tooltip={makingChargeType === 'perGram' 
            ? 'Labour charges per gram of jewellery' 
            : 'Making charges as percentage of metal cost'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-200 pt-4">
        <InputField
          label="Stone/Diamond Charges (₹)"
          value={stoneCharges}
          onChange={setStoneCharges}
          placeholder="Enter stone charges (optional)"
          type="number"
          tooltip="Cost of stones or diamonds (if any)"
        />
        <InputField
          label="GST Percentage (%)"
          value={gstPercentage}
          onChange={setGstPercentage}
          placeholder="Enter GST %"
          type="number"
          tooltip="Default is 3% for gold/silver jewellery"
        />
      </div>

      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>💡 Tip:</strong> Making charges typically range from ₹300-₹1000 per gram 
          depending on the design complexity and brand. Always ask for a detailed breakdown 
          before finalizing your purchase.
        </p>
      </div>
    </CalculatorLayout>
  );
}
