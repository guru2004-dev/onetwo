export const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'INR',
  'JPY',
  'AUD',
  'CAD',
  'SGD',
  'AED',
  'CNY',
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];
export type ExchangeRates = Record<string, number>;

const GLOBAL_CURRENCY_KEY = '__BUSINESS_CALC_CURRENCY__';

export const CURRENCY_NAMES: Record<SupportedCurrency, string> = {
  USD: 'United States Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  INR: 'Indian Rupee',
  JPY: 'Japanese Yen',
  AUD: 'Australian Dollar',
  CAD: 'Canadian Dollar',
  SGD: 'Singapore Dollar',
  AED: 'UAE Dirham',
  CNY: 'Chinese Yuan',
};

export function isSupportedCurrency(currency: string): currency is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(currency as SupportedCurrency);
}

export function getCurrencySymbol(currency: string): string {
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
}

export function getInitialSupportedRates(): ExchangeRates {
  const rates: ExchangeRates = {};

  SUPPORTED_CURRENCIES.forEach((currency) => {
    rates[currency] = currency === 'INR' ? 1 : 0;
  });

  return rates;
}

export function normalizeSupportedRates(
  rawRates: Record<string, unknown>,
  previousRates?: ExchangeRates
): ExchangeRates {
  const fallbackRates = previousRates ?? getInitialSupportedRates();
  const normalized: ExchangeRates = { ...fallbackRates, INR: 1 };

  SUPPORTED_CURRENCIES.forEach((currency) => {
    if (currency === 'INR') {
      normalized[currency] = 1;
      return;
    }

    const numericRate = Number(rawRates[currency]);
    if (Number.isFinite(numericRate) && numericRate > 0) {
      normalized[currency] = numericRate;
    }
  });

  return normalized;
}

export function convertToINR(amount: number, selectedCurrency: string, exchangeRates: ExchangeRates): number {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return 0;
  }

  if (selectedCurrency === 'INR') {
    return numericAmount;
  }

  const rate = exchangeRates[selectedCurrency];
  if (!Number.isFinite(rate) || rate <= 0) {
    return 0;
  }

  return numericAmount / rate;
}

export function convertFromINR(amountINR: number, targetCurrency: string, exchangeRates: ExchangeRates): number {
  const numericAmount = Number(amountINR);

  if (!Number.isFinite(numericAmount)) {
    return 0;
  }

  if (targetCurrency === 'INR') {
    return numericAmount;
  }

  const rate = exchangeRates[targetCurrency];
  if (!Number.isFinite(rate) || rate <= 0) {
    return 0;
  }

  return numericAmount * rate;
}

export function formatAmountInCurrency(
  amountINR: number,
  targetCurrency: string,
  exchangeRates: ExchangeRates,
  locale: string = 'en-IN'
): string {
  const convertedAmount = convertFromINR(amountINR, targetCurrency, exchangeRates);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: targetCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(convertedAmount);
}

type GlobalCurrencyState = {
  selectedInputCurrency: string;
  exchangeRates: ExchangeRates;
};

function getSafeWindow(): (Window & typeof globalThis) | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window;
}

export function setGlobalCurrencyState(state: GlobalCurrencyState): void {
  const safeWindow = getSafeWindow();
  if (!safeWindow) {
    return;
  }

  (safeWindow as unknown as Record<string, unknown>)[GLOBAL_CURRENCY_KEY] = state;
}

export function getGlobalCurrencyState(): GlobalCurrencyState {
  const safeWindow = getSafeWindow();
  const defaultState: GlobalCurrencyState = {
    selectedInputCurrency: 'INR',
    exchangeRates: getInitialSupportedRates(),
  };

  if (!safeWindow) {
    return defaultState;
  }

  const rawState = (safeWindow as unknown as Record<string, unknown>)[GLOBAL_CURRENCY_KEY] as
    | GlobalCurrencyState
    | undefined;

  if (!rawState || typeof rawState !== 'object') {
    return defaultState;
  }

  return {
    selectedInputCurrency: isSupportedCurrency(rawState.selectedInputCurrency)
      ? rawState.selectedInputCurrency
      : 'INR',
    exchangeRates: {
      ...defaultState.exchangeRates,
      ...(rawState.exchangeRates || {}),
    },
  };
}
