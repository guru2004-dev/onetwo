'use client';

import React, { useState, useEffect } from 'react';
import CalculatorLayout from '@/components/CalculatorLayout';
import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import ResultCard from '@/components/ResultCard';
import { calculateGST, formatCurrency } from '@/lib/utils';

export default function GSTCalculator() {
  const [amount, setAmount] = useState('10000');
  const [gstRate, setGstRate] = useState('18');
  const [calculationType, setCalculationType] = useState('exclusive');
  
  const [originalAmount, setOriginalAmount] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [cgst, setCgst] = useState(0);
  const [sgst, setSgst] = useState(0);

  useEffect(() => {
    calculate();
  }, [amount, gstRate, calculationType]);

  const calculate = () => {
    const amt = parseFloat(amount) || 0;
    const rate = parseFloat(gstRate) || 0;

    if (amt > 0 && rate >= 0) {
      const isInclusive = calculationType === 'inclusive';
      const result = calculateGST(amt, rate, isInclusive);
      
      setOriginalAmount(result.originalAmount);
      setGstAmount(result.gstAmount);
      setTotalAmount(result.totalAmount);
      setCgst(result.gstAmount / 2);
      setSgst(result.gstAmount / 2);
    } else {
      setOriginalAmount(0);
      setGstAmount(0);
      setTotalAmount(0);
      setCgst(0);
      setSgst(0);
    }
  };

  const results = totalAmount > 0 && (
    <div className="space-y-4">
      <ResultCard 
        label={calculationType === 'exclusive' ? 'Total Amount (with GST)' : 'Original Amount (without GST)'} 
        value={formatCurrency(calculationType === 'exclusive' ? totalAmount : originalAmount)} 
        highlighted 
      />
      <ResultCard label="GST Amount" value={formatCurrency(gstAmount)} />
      <div className="grid grid-cols-2 gap-4">
        <ResultCard label="CGST" value={formatCurrency(cgst)} suffix={` (${parseFloat(gstRate) / 2}%)`} />
        <ResultCard label="SGST" value={formatCurrency(sgst)} suffix={` (${parseFloat(gstRate) / 2}%)`} />
      </div>
      <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Base Amount</span>
            <span className="font-semibold text-indigo-600">{formatCurrency(originalAmount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">GST ({gstRate}%)</span>
            <span className="font-semibold text-indigo-600">{formatCurrency(gstAmount)}</span>
          </div>
          <div className="border-t border-indigo-200 pt-2 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-900">Total Amount</span>
            <span className="font-bold text-indigo-600">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const explanation = (
    <div className="space-y-4 text-gray-700">
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">What is GST?</h3>
        <p>
          GST (Goods and Services Tax) is an indirect tax levied on the supply of goods and services in India. 
          It has replaced many indirect taxes like VAT, service tax, excise duty, etc.
        </p>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">GST Rates in India</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>0% - Essential goods like milk, fresh vegetables, etc.</li>
          <li>5% - Household necessities</li>
          <li>12% - Processed food and standard goods</li>
          <li>18% - Most goods and services (standard rate)</li>
          <li>28% - Luxury items and sin goods</li>
        </ul>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">GST Components</h3>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="mb-2"><strong>CGST (Central GST):</strong> Tax collected by Central Government</p>
          <p className="mb-2"><strong>SGST (State GST):</strong> Tax collected by State Government</p>
          <p className="mb-2"><strong>IGST (Integrated GST):</strong> For inter-state transactions</p>
          <p className="text-sm text-gray-600 mt-3">
            Note: CGST and SGST together make up the total GST, each being 50% of the total GST rate.
          </p>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Calculation Methods</h3>
        <div className="space-y-2">
          <p><strong>GST Exclusive:</strong> GST is added to the base amount</p>
          <div className="bg-gray-100 p-2 rounded font-mono text-sm">
            Total = Base Amount + (Base Amount × GST Rate / 100)
          </div>
          <p className="mt-2"><strong>GST Inclusive:</strong> Amount already includes GST</p>
          <div className="bg-gray-100 p-2 rounded font-mono text-sm">
            Base = Total Amount / (1 + GST Rate / 100)
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <CalculatorLayout
      title="GST Calculator"
      description="Calculate GST amount and total value"
      results={results}
      explanation={explanation}
    >
      <div className="space-y-4">
        <SelectField
          label="Calculation Type"
          value={calculationType}
          onChange={setCalculationType}
          options={[
            { label: 'GST Exclusive (Add GST to amount)', value: 'exclusive' },
            { label: 'GST Inclusive (Remove GST from amount)', value: 'inclusive' },
          ]}
          required
        />
        <InputField
          label={calculationType === 'exclusive' ? 'Amount (without GST)' : 'Amount (with GST)'}
          value={amount}
          onChange={setAmount}
          placeholder="Enter amount"
          prefix="₹"
          required
        />
        <SelectField
          label="GST Rate"
          value={gstRate}
          onChange={setGstRate}
          options={[
            { label: '0%', value: '0' },
            { label: '5%', value: '5' },
            { label: '12%', value: '12' },
            { label: '18%', value: '18' },
            { label: '28%', value: '28' },
            { label: 'Custom', value: 'custom' },
          ]}
          required
        />
        {gstRate === 'custom' && (
          <InputField
            label="Custom GST Rate"
            value={gstRate}
            onChange={setGstRate}
            placeholder="Enter custom rate"
            suffix="%"
            step="0.1"
          />
        )}
      </div>
    </CalculatorLayout>
  );
}
