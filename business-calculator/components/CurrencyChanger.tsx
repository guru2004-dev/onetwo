'use client';

import React, { useMemo } from 'react';
import { useCurrency } from '@/context/CurrencyContext';

export default function CurrencyChanger() {
  const {
    selectedInputCurrency,
    setSelectedInputCurrency,
    availableCurrencies,
    loading,
    error,
    getCurrencySymbol,
  } = useCurrency();

  const options = useMemo(() => {
    if (availableCurrencies.length === 0) {
      return [{ code: 'INR', label: 'INR' }];
    }

    return availableCurrencies.map((currencyCode) => ({
      code: currencyCode,
      label: `${currencyCode} (${getCurrencySymbol(currencyCode)})`,
    }));
  }, [availableCurrencies, getCurrencySymbol]);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Input Currency
      </label>
      <select
        value={selectedInputCurrency}
        onChange={(event) => setSelectedInputCurrency(event.target.value)}
        disabled={loading}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
        aria-label="Global input currency"
      >
        {loading && <option value="INR">Loading currencies...</option>}
        {!loading && options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-2 text-xs text-red-600">Unable to refresh rates. Using available data.</p>}
    </div>
  );
}