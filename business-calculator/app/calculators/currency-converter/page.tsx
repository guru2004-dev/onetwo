'use client';

import React, { useState, useEffect, useCallback } from 'react';
import CalculatorLayout from '@/components/CalculatorLayout';
import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import ResultCard from '@/components/ResultCard';
import { useCurrency } from '@/context/CurrencyContext';

export default function CurrencyConverter() {
  const { exchangeRates, availableCurrencies, loading, error } = useCurrency();
  const [amount, setAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('INR');
  const [toCurrency, setToCurrency] = useState('INR');
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(0);

  const calculate = useCallback(() => {
    const amt = Number(amount);
    
    if (!Number.isFinite(amt) || Number.isNaN(amt) || amt <= 0 || !fromCurrency || !toCurrency) {
      setConvertedAmount(0);
      setExchangeRate(0);
      return;
    }

    const fromRate = exchangeRates[fromCurrency];
    const toRate = exchangeRates[toCurrency];

    if (!fromRate || !toRate) {
      setConvertedAmount(0);
      setExchangeRate(0);
      return;
    }
      
    const amountInINR = fromCurrency === 'INR' ? amt : amt / fromRate;
    const converted = toCurrency === 'INR' ? amountInINR : amountInINR * toRate;
    const rate = fromCurrency === toCurrency ? 1 : toRate / fromRate;

    setConvertedAmount(converted);
    setExchangeRate(rate);
  }, [amount, fromCurrency, toCurrency, exchangeRates]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  useEffect(() => {
    if (availableCurrencies.length === 0) return;

    if (!availableCurrencies.includes(fromCurrency)) {
      setFromCurrency('INR');
    }

    if (!availableCurrencies.includes(toCurrency)) {
      setToCurrency('INR');
    }
  }, [availableCurrencies, fromCurrency, toCurrency]);

  const results = convertedAmount > 0 && (
    <div className="space-y-4">
      <ResultCard 
        label={`${amount} ${fromCurrency} =`} 
        value={`${convertedAmount.toFixed(2)} ${toCurrency}`} 
        highlighted 
      />
      <ResultCard 
        label="Exchange Rate" 
        value={`1 ${fromCurrency} = ${exchangeRate.toFixed(4)} ${toCurrency}`} 
      />
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <div className="text-sm text-gray-700 mb-2">Conversion Details:</div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">From:</span>
            <span className="font-semibold">{amount} {fromCurrency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">To:</span>
            <span className="font-semibold">{convertedAmount.toFixed(2)} {toCurrency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Rate:</span>
            <span className="font-semibold">1:{exchangeRate.toFixed(4)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const explanation = (
    <div className="space-y-4 text-gray-700">
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">What is Currency Conversion?</h3>
        <p>
          Currency conversion is the process of exchanging one currency for another at a specific exchange rate. 
          Exchange rates fluctuate based on market conditions, economic factors, and geopolitical events.
        </p>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">How It Works</h3>
        <div className="bg-gray-100 p-4 rounded-lg text-sm">
          <p className="mb-2">The conversion formula:</p>
          <p className="font-mono">Converted Amount = Original Amount × Exchange Rate</p>
          <p className="mt-3 mb-2">Example: Convert 100 USD to INR at rate 83.12</p>
          <p className="font-mono">100 USD × 83.12 = 8,312 INR</p>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Common Currencies</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>USD</strong> - United States Dollar</li>
          <li><strong>EUR</strong> - Euro</li>
          <li><strong>GBP</strong> - British Pound</li>
          <li><strong>INR</strong> - Indian Rupee</li>
          <li><strong>JPY</strong> - Japanese Yen</li>
        </ul>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Important Notes</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Exchange rates shown are for illustration purposes only</li>
          <li>Actual rates may vary and change frequently</li>
          <li>Banks and exchange services may charge additional fees</li>
          <li>Always check current rates before making transactions</li>
        </ul>
      </div>
    </div>
  );

  return (
    <CalculatorLayout
      title="Currency Converter"
      description="Convert between different currencies with real-time exchange rates"
      results={results}
      explanation={explanation}
    >
      <InputField
        label="Amount"
        value={amount}
        onChange={setAmount}
        placeholder="Enter amount"
        type="number"
      />
      <SelectField
        label="From Currency"
        value={fromCurrency}
        onChange={setFromCurrency}
        options={availableCurrencies.map(curr => ({ value: curr, label: curr }))}
      />
      <SelectField
        label="To Currency"
        value={toCurrency}
        onChange={setToCurrency}
        options={availableCurrencies.map(curr => ({ value: curr, label: curr }))}
      />
      {loading && <p className="text-sm text-gray-500">Loading latest exchange rates...</p>}
      {error && <p className="text-sm text-red-600">Unable to update rates. Showing available data.</p>}
    </CalculatorLayout>
  );
}
