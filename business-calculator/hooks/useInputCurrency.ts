'use client';

import { useEffect, useState } from 'react';
import { useCurrency } from '@/context/CurrencyContext';

export function useInputCurrency(initialValue: number | string = '') {
  const { selectedInputCurrency, convertToINR } = useCurrency();
  const [inputAmount, setInputAmount] = useState<number | string>(initialValue);
  const [convertedAmount, setConvertedAmount] = useState<number>(0);

  useEffect(() => {
    const numeric = Number(inputAmount);

    if (inputAmount === '' || Number.isNaN(numeric) || !Number.isFinite(numeric)) {
      setConvertedAmount(0);
      return;
    }

    setConvertedAmount(convertToINR(numeric, selectedInputCurrency));
  }, [inputAmount, selectedInputCurrency, convertToINR]);

  const handleAmountChange = (value: number | string) => {
    setInputAmount(value);
  };

  return {
    inputAmount,
    handleAmountChange,
    convertedAmount,
    selectedInputCurrency,
  };
}
