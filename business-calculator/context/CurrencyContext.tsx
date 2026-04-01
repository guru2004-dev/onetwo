'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  CURRENCY_NAMES,
  ExchangeRates,
  SUPPORTED_CURRENCIES,
  SupportedCurrency,
  convertFromINR,
  convertToINR,
  formatAmountInCurrency,
  getCurrencySymbol,
  getInitialSupportedRates,
  isSupportedCurrency,
  normalizeSupportedRates,
  setGlobalCurrencyState,
} from '@/lib/currency';

interface CurrencyContextType {
  baseCurrency: 'INR';
  selectedInputCurrency: SupportedCurrency;
  setSelectedInputCurrency: (currency: SupportedCurrency) => void;
  selectedResultCurrency: SupportedCurrency;
  setSelectedResultCurrency: (currency: SupportedCurrency) => void;
  exchangeRates: ExchangeRates;
  availableCurrencies: SupportedCurrency[];
  currencyNames: Record<SupportedCurrency, string>;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  lastUpdatedTime: number | null;
  updateRates: () => Promise<void>;
  updateCurrencyRates: () => Promise<void>;
  convertToINR: (amount: number, currency: string) => number;
  convertFromINR: (amountINR: number, currency: string) => number;
  formatInSelectedCurrency: (amountINR: number) => string;
  getCurrencySymbol: (currency: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const API_URLS = [
  'https://open.er-api.com/v6/latest/INR',
  'https://api.frankfurter.app/latest?from=INR',
  'https://api.exchangerate-api.com/v4/latest/INR',
];

function extractRatesFromResponse(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const parsed = data as Record<string, unknown>;

  if (parsed.rates && typeof parsed.rates === 'object') {
    return parsed.rates as Record<string, unknown>;
  }

  return null;
}

async function fetchRatesFromAnyApi(): Promise<Record<string, unknown>> {
  const errors: string[] = [];

  for (const apiUrl of API_URLS) {
    try {
      const response = await fetch(apiUrl, { cache: 'no-store' });

      if (!response.ok) {
        errors.push(`${apiUrl} (${response.status})`);
        continue;
      }

      const data = await response.json();
      const rates = extractRatesFromResponse(data);

      if (rates) {
        return rates;
      }

      errors.push(`${apiUrl} (invalid format)`);
    } catch {
      errors.push(`${apiUrl} (request failed)`);
    }
  }

  throw new Error(`Failed to fetch exchange rates from all providers: ${errors.join(', ')}`);
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(getInitialSupportedRates());
  const [selectedInputCurrency, setSelectedInputCurrency] = useState<SupportedCurrency>('INR');
  const [selectedResultCurrency, setSelectedResultCurrency] = useState<SupportedCurrency>('INR');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const updateRates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const latestRates = await fetchRatesFromAnyApi();
      setExchangeRates((previousRates) => normalizeSupportedRates(latestRates, previousRates));
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

  const availableCurrencies = useMemo<SupportedCurrency[]>(() => [...SUPPORTED_CURRENCIES], []);

  useEffect(() => {
    if (!isSupportedCurrency(selectedInputCurrency)) {
      setSelectedInputCurrency('INR');
    }
  }, [availableCurrencies, selectedInputCurrency]);

  useEffect(() => {
    if (!isSupportedCurrency(selectedResultCurrency)) {
      setSelectedResultCurrency('INR');
    }
  }, [availableCurrencies, selectedResultCurrency]);

  useEffect(() => {
    setGlobalCurrencyState({
      selectedInputCurrency,
      selectedResultCurrency,
      exchangeRates,
    });
  }, [selectedInputCurrency, selectedResultCurrency, exchangeRates]);

  const convertToINRValue = useCallback(
    (amount: number, currency: string): number => convertToINR(amount, currency, exchangeRates),
    [exchangeRates]
  );

  const convertFromINRValue = useCallback(
    (amountINR: number, currency: string): number => convertFromINR(amountINR, currency, exchangeRates),
    [exchangeRates]
  );

  const formatInSelectedCurrency = useCallback(
    (amountINR: number): string =>
      formatAmountInCurrency(amountINR, selectedResultCurrency, exchangeRates),
    [selectedResultCurrency, exchangeRates]
  );

  const value: CurrencyContextType = {
    baseCurrency: 'INR',
    selectedInputCurrency,
    setSelectedInputCurrency,
    selectedResultCurrency,
    setSelectedResultCurrency,
    exchangeRates,
    availableCurrencies,
    currencyNames: CURRENCY_NAMES,
    loading,
    error,
    lastUpdated,
    lastUpdatedTime: lastUpdated,
    updateRates,
    updateCurrencyRates: updateRates,
    convertToINR: convertToINRValue,
    convertFromINR: convertFromINRValue,
    formatInSelectedCurrency,
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
