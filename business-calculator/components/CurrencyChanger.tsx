'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { CURRENCY_NAMES, SUPPORTED_CURRENCIES, isSupportedCurrency } from '@/lib/currency';

interface CurrencyChangerProps {
  variant?: 'input' | 'result';
}

export default function CurrencyChanger({ variant = 'result' }: CurrencyChangerProps) {
  const {
    selectedInputCurrency,
    setSelectedInputCurrency,
    selectedResultCurrency,
    setSelectedResultCurrency,
    availableCurrencies,
    currencyNames,
    loading,
    error,
    lastUpdatedTime,
    getCurrencySymbol,
  } = useCurrency();

  const [tick, setTick] = useState(0);

  const safeCurrencyNames = currencyNames ?? CURRENCY_NAMES;
  const safeAvailableCurrencies = availableCurrencies?.length ? availableCurrencies : [...SUPPORTED_CURRENCIES];
  const activeInputCurrency = selectedInputCurrency && isSupportedCurrency(selectedInputCurrency)
    ? selectedInputCurrency
    : 'INR';
  const activeResultCurrency = selectedResultCurrency && isSupportedCurrency(selectedResultCurrency)
    ? selectedResultCurrency
    : 'INR';

  const options = useMemo(() => {
    if (safeAvailableCurrencies.length === 0) {
      return [{ code: 'INR', label: 'INR', symbol: '₹' }];
    }

    return safeAvailableCurrencies.map((currencyCode) => ({
      code: currencyCode,
      label: `${currencyCode} - ${safeCurrencyNames[currencyCode] ?? currencyCode}`,
      symbol: getCurrencySymbol(currencyCode),
    }));
  }, [safeAvailableCurrencies, safeCurrencyNames, getCurrencySymbol]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedTime) {
      return 'never';
    }

    const seconds = Math.max(1, Math.floor((Date.now() - lastUpdatedTime) / 1000));

    if (seconds < 60) {
      return `${seconds} sec ago`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hr ago`;
    }

    const days = Math.floor(hours / 24);
    return `${days} day ago`;
  }, [lastUpdatedTime, tick]);

  if (variant === 'input') {
    return (
      <div className="mb-5 p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Amount in Your Currency
        </label>
        <select
          value={activeInputCurrency}
          onChange={(event) => {
            const nextCurrency = event.target.value;
            if (isSupportedCurrency(nextCurrency)) {
              setSelectedInputCurrency(nextCurrency);
            }
          }}
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          aria-label="Input currency"
        >
          {loading && <option value="INR">Loading currencies...</option>}
          {!loading && options.map((option) => (
            <option key={option.code} value={option.code}>
              {option.code} ({option.symbol})
            </option>
          ))}
        </select>
        {error && <p className="mt-2 text-xs text-red-600">Unable to refresh rates. Using available data.</p>}
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        View Result Currency
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = activeResultCurrency === option.code;

          return (
            <button
              key={option.code}
              type="button"
              onClick={() => { if (isSupportedCurrency(option.code)) setSelectedResultCurrency(option.code); }}
              disabled={loading}
              className={`px-3 py-1.5 text-xs sm:text-sm rounded-full border transition-colors ${
                active
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600'
              }`}
              aria-pressed={active}
              title={option.label}
            >
              {option.code}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-gray-500">Last updated: {lastUpdatedLabel}</p>
      {error && <p className="mt-2 text-xs text-red-600">Unable to refresh rates. Using available data.</p>}
    </div>
  );
}