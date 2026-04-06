'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { useTheme } from '@/components/ThemeProvider';
import { SUPPORTED_CURRENCIES, isSupportedCurrency } from '@/lib/currency';
import PremiumCurrencyInput from './PremiumCurrencyInput';

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
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
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

  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

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
          className={`sm:w-32 w-full px-3 py-3 rounded-xl outline-none transition-all duration-300 font-medium tracking-wide cursor-pointer
            ${isDarkMode
              ? 'bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 hover:border-gray-600'
              : 'bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 hover:border-[#D1DDE6]'
            }`}
          aria-label="Input currency"
        >
          {loading && <option value="INR">Loading currencies...</option>}
          {!loading && options.map((option) => (
            <option key={option.code} value={option.code} className="bg-gray-800 text-white">
              {option.label}
            </option>
          ))}
        </select>
      )}

      <PremiumCurrencyInput
        value={displayAmount}
        onAmountChange={(value) => handleAmountChange(value)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        required={required}
        aria-invalid={Boolean(error)}
        className="flex-1"
      />
    </div>
  );
}
