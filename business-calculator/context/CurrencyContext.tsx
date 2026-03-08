'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type ExchangeRates = Record<string, number>;

interface CurrencyContextType {
  baseCurrency: 'INR';
  selectedInputCurrency: string;
  setSelectedInputCurrency: (currency: string) => void;
  exchangeRates: ExchangeRates;
  availableCurrencies: string[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  updateRates: () => Promise<void>;
  convertToINR: (amount: number, currency: string) => number;
  getCurrencySymbol: (currency: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const API_URL = 'https://open.er-api.com/v6/latest/INR';

const getCurrencySymbol = (currency: string): string => {
  try {
    const parts = new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);

    const currencyPart = parts.find((part) => part.type === 'currency');
    return currencyPart?.value || currency;
  } catch {
    return currency;
  }
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({ INR: 1 });
  const [selectedInputCurrency, setSelectedInputCurrency] = useState<string>('INR');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const updateRates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_URL, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(`Failed to fetch exchange rates (${response.status})`);
      }

      const data = await response.json();

      if (!data || data.result !== 'success' || !data.rates || typeof data.rates !== 'object') {
        throw new Error('Invalid exchange rate response');
      }

      const normalizedRates: ExchangeRates = { INR: 1 };

      Object.entries(data.rates).forEach(([currency, rate]) => {
        const numericRate = Number(rate);
        if (!Number.isNaN(numericRate) && Number.isFinite(numericRate) && numericRate > 0) {
          normalizedRates[currency] = numericRate;
        }
      });

      setExchangeRates(normalizedRates);
      setLastUpdated(Date.now());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exchange rates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    updateRates();
  }, [updateRates]);

  const availableCurrencies = useMemo(() => {
    const currencies = Object.keys(exchangeRates);
    return currencies.sort((a, b) => {
      if (a === 'INR') return -1;
      if (b === 'INR') return 1;
      return a.localeCompare(b);
    });
  }, [exchangeRates]);

  useEffect(() => {
    if (!availableCurrencies.includes(selectedInputCurrency)) {
      setSelectedInputCurrency('INR');
    }
  }, [availableCurrencies, selectedInputCurrency]);

  const convertToINR = useCallback(
    (amount: number, currency: string): number => {
      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount) || Number.isNaN(numericAmount)) return 0;

      if (!currency || currency === 'INR') return numericAmount;

      const rate = exchangeRates[currency];
      if (!rate || !Number.isFinite(rate) || rate <= 0) return 0;

      return numericAmount / rate;
    },
    [exchangeRates]
  );

  const value: CurrencyContextType = {
    baseCurrency: 'INR',
    selectedInputCurrency,
    setSelectedInputCurrency,
    exchangeRates,
    availableCurrencies,
    loading,
    error,
    lastUpdated,
    updateRates,
    convertToINR,
    getCurrencySymbol,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);

  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }

  return context;
}
