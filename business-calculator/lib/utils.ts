// Utility functions for formatting and calculations

import { formatAmountInCurrency, getGlobalCurrencyState, getInitialSupportedRates } from '@/lib/currency';

export const formatCurrency = (amount: number, currency: string = '₹'): string => {
  if (currency !== '₹') {
    return `${currency}${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  const globalCurrency = getGlobalCurrencyState();
  const rates = {
    ...getInitialSupportedRates(),
    ...globalCurrency.exchangeRates,
  };

  return formatAmountInCurrency(amount, globalCurrency.selectedInputCurrency, rates);
};

export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const parseNumber = (value: string): number => {
  return parseFloat(value.replace(/,/g, '')) || 0;
};

export const validateNumber = (value: string | number): boolean => {
  const num = typeof value === 'string' ? parseNumber(value) : value;
  return !isNaN(num) && isFinite(num);
};

export const calculateEMI = (
  principal: number,
  annualRate: number,
  tenureMonths: number
): number => {
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) return principal / tenureMonths;
  
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  
  return emi;
};

export const calculateSimpleInterest = (
  principal: number,
  rate: number,
  time: number
): number => {
  return (principal * rate * time) / 100;
};

export const calculateCompoundInterest = (
  principal: number,
  rate: number,
  time: number,
  frequency: number = 1
): number => {
  const amount = principal * Math.pow(1 + rate / (100 * frequency), frequency * time);
  return amount - principal;
};

export const calculateSIP = (
  monthlyInvestment: number,
  annualRate: number,
  months: number
): { maturityAmount: number; invested: number; gains: number } => {
  const monthlyRate = annualRate / 12 / 100;
  const maturityAmount =
    monthlyInvestment *
    ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) *
    (1 + monthlyRate);
  const invested = monthlyInvestment * months;
  const gains = maturityAmount - invested;
  
  return { maturityAmount, invested, gains };
};

export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

export const calculatePercentageChange = (
  oldValue: number,
  newValue: number
): number => {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
};

export const calculateMarkup = (cost: number, sellingPrice: number): number => {
  if (cost === 0) return 0;
  return ((sellingPrice - cost) / cost) * 100;
};

export const calculateMargin = (cost: number, sellingPrice: number): number => {
  if (sellingPrice === 0) return 0;
  return ((sellingPrice - cost) / sellingPrice) * 100;
};

export const calculateGST = (
  amount: number,
  gstRate: number,
  inclusive: boolean = false
): { originalAmount: number; gstAmount: number; totalAmount: number } => {
  if (inclusive) {
    const originalAmount = amount / (1 + gstRate / 100);
    const gstAmount = amount - originalAmount;
    return { originalAmount, gstAmount, totalAmount: amount };
  } else {
    const gstAmount = (amount * gstRate) / 100;
    const totalAmount = amount + gstAmount;
    return { originalAmount: amount, gstAmount, totalAmount };
  }
};

export const calculateDiscount = (
  originalPrice: number,
  discountPercent: number
): { discountAmount: number; finalPrice: number } => {
  const discountAmount = (originalPrice * discountPercent) / 100;
  const finalPrice = originalPrice - discountAmount;
  return { discountAmount, finalPrice };
};

export const calculateROI = (
  initialInvestment: number,
  finalValue: number
): number => {
  if (initialInvestment === 0) return 0;
  return ((finalValue - initialInvestment) / initialInvestment) * 100;
};

export const calculateCAGR = (
  beginningValue: number,
  endingValue: number,
  years: number
): number => {
  if (beginningValue === 0 || years === 0) return 0;
  return (Math.pow(endingValue / beginningValue, 1 / years) - 1) * 100;
};

export const calculateBreakEven = (
  fixedCosts: number,
  pricePerUnit: number,
  variableCostPerUnit: number
): number => {
  const contributionMargin = pricePerUnit - variableCostPerUnit;
  if (contributionMargin === 0) return 0;
  return fixedCosts / contributionMargin;
};

export const generateAmortizationSchedule = (
  principal: number,
  annualRate: number,
  tenureMonths: number
): Array<{
  month: number;
  emi: number;
  principalPaid: number;
  interestPaid: number;
  balance: number;
}> => {
  const emi = calculateEMI(principal, annualRate, tenureMonths);
  const monthlyRate = annualRate / 12 / 100;
  let balance = principal;
  const schedule = [];

  for (let month = 1; month <= tenureMonths; month++) {
    const interestPaid = balance * monthlyRate;
    const principalPaid = emi - interestPaid;
    balance -= principalPaid;

    schedule.push({
      month,
      emi,
      principalPaid,
      interestPaid,
      balance: Math.max(0, balance),
    });
  }

  return schedule;
};
