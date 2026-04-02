'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { SUPPORTED_CURRENCIES, isSupportedCurrency } from '@/lib/currency';

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
    convertFromINR,
    loading,
    error,
    getCurrencySymbol,
  } = useCurrency();

  const [displayAmount, setDisplayAmount] = useState<string>('');
  const safeAvailableCurrencies = availableCurrencies?.length ? availableCurrencies : [...SUPPORTED_CURRENCIES];
  const safeSelectedCurrency = isSupportedCurrency(selectedInputCurrency) ? selectedInputCurrency : 'INR';

  const formatForInput = (value: number): string => {
    if (!Number.isFinite(value)) {
      return '';
    }

    if (Number.isInteger(value)) {
      return String(value);
    }

    return value.toFixed(6).replace(/\.?0+$/, '');
  };

  useEffect(() => {
    if (amount === '' || amount === null || amount === undefined) {
      setDisplayAmount('');
      return;
    }

    const amountInINR = Number(amount);
    if (!Number.isFinite(amountInINR)) {
      setDisplayAmount('');
      return;
    }

    const convertedDisplayAmount = convertFromINR(amountInINR, safeSelectedCurrency);
    setDisplayAmount(formatForInput(convertedDisplayAmount));
  }, [amount, safeSelectedCurrency, convertFromINR]);

  const options = useMemo(() => {
    if (safeAvailableCurrencies.length === 0) {
      return [{ code: 'INR', label: 'INR' }];
    }

    return safeAvailableCurrencies.map((currencyCode) => ({
      code: currencyCode,
      label: `${currencyCode} (${getCurrencySymbol(currencyCode)})`,
    }));
  }, [safeAvailableCurrencies, getCurrencySymbol]);

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
    convertAndPush(value, safeSelectedCurrency);
  };

  const handleCurrencyChange = (currencyCode: string) => {
    if (!isSupportedCurrency(currencyCode)) {
      return;
    }

    setSelectedInputCurrency(currencyCode);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {showCurrencyDropdown && (
        <select
          value={safeSelectedCurrency}
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
