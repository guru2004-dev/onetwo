'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useCurrency } from '@/context/CurrencyContext';

interface InputCurrencySelectorProps {
  amount: number | string;
  onAmountChange: (amount: string) => void;
  placeholder?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  required?: boolean;
  showCurrencyDropdown?: boolean;
}

export default function InputCurrencySelector({
  amount,
  onAmountChange,
  placeholder,
  min,
  max,
  step,
  required,
  showCurrencyDropdown = true,
}: InputCurrencySelectorProps) {
  const {
    selectedInputCurrency,
    setSelectedInputCurrency,
    availableCurrencies,
    convertToINR,
    loading,
    error,
    getCurrencySymbol,
  } = useCurrency();

  const [displayAmount, setDisplayAmount] = useState<string>(String(amount ?? ''));

  useEffect(() => {
    if (amount === '' || amount === null || amount === undefined) {
      setDisplayAmount('');
    }
  }, [amount]);

  const options = useMemo(() => {
    if (availableCurrencies.length === 0) {
      return [{ code: 'INR', label: 'INR' }];
    }

    return availableCurrencies.map((currencyCode) => ({
      code: currencyCode,
      label: `${currencyCode} (${getCurrencySymbol(currencyCode)})`,
    }));
  }, [availableCurrencies, getCurrencySymbol]);

  const convertAndPush = (rawInput: string, currencyCode: string) => {
    if (rawInput.trim() === '') {
      onAmountChange('');
      return;
    }

    const numericValue = Number(rawInput);
    if (Number.isNaN(numericValue) || !Number.isFinite(numericValue)) {
      onAmountChange('');
      return;
    }

    const converted = convertToINR(numericValue, currencyCode);
    onAmountChange(Number.isFinite(converted) ? String(converted) : '');
  };

  const handleAmountChange = (value: string) => {
    setDisplayAmount(value);
    convertAndPush(value, selectedInputCurrency);
  };

  const handleCurrencyChange = (currencyCode: string) => {
    setSelectedInputCurrency(currencyCode);
    convertAndPush(displayAmount, currencyCode);
  };

  useEffect(() => {
    convertAndPush(displayAmount, selectedInputCurrency);
  }, [selectedInputCurrency]);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {showCurrencyDropdown && (
        <select
          value={selectedInputCurrency}
          onChange={(event) => handleCurrencyChange(event.target.value)}
          disabled={loading}
          className="sm:w-52 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          aria-label="Input currency"
        >
          {loading && <option value="INR">Loading currencies...</option>}
          {!loading && options.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      <input
        type="number"
        value={displayAmount}
        onChange={(event) => handleAmountChange(event.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        required={required}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        aria-invalid={Boolean(error)}
      />
    </div>
  );
}
