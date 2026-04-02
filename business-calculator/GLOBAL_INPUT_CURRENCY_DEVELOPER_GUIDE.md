# Global Input Currency System - Developer Integration Guide

## Quick Start for Developers

### 1. Using the System in Your Component

```typescript
import { useCurrency } from '../context/CurrencyContext';

export function MyComponent() {
  const { 
    selectedInputCurrency,
    convertToINR,
    availableCurrencies,
    getCurrencySymbol 
  } = useCurrency();
  
  // Convert any amount to INR
  const inrAmount = convertToINR(1000, selectedInputCurrency);
  
  return <div>₹{inrAmount}</div>;
}
```

### 2. Using the InputCurrencySelector

```typescript
import InputCurrencySelector from '../components/InputCurrencySelector';
import { useState } from 'react';

export function MyForm() {
  const [amount, setAmount] = useState<number | string>(0);
  
  return (
    <InputCurrencySelector 
      amount={amount}
      onAmountChange={setAmount}
    />
  );
}
```

### 3. Manual Conversion Hook

```typescript
import { useInputCurrency } from '../hooks/useInputCurrency';

export function Calculator() {
  const { inputAmount, handleAmountChange, convertedAmount } = 
    useInputCurrency(0);
  
  // convertedAmount is automatically in INR
  return (
    <>
      <input value={inputAmount} onChange={(e) => 
        handleAmountChange(e.target.value)} />
      <p>INR: ₹{convertedAmount}</p>
    </>
  );
}
```

## API Reference

### CurrencyContext

#### `useCurrency(): CurrencyContextType`

Main hook to access currency context.

**Returns**:
```typescript
{
  baseCurrency: 'INR',
  selectedCurrency: string;              // Output currency
  setSelectedCurrency: (currency) => void;
  selectedInputCurrency: string;         // Input currency
  setSelectedInputCurrency: (currency) => void;
  exchangeRates: { [key: string]: number };
  updateRates: () => Promise<void>;
  convertCurrency: (amount: number) => number;  // INR to selected output
  formatCurrency: (amount: number) => string;
  getCurrencySymbol: (currency: string) => string;
  convertToINR: (amount: number, currency: string) => number;  // ← KEY FUNCTION
  lastUpdated: number;
  loading: boolean;
  error: string | null;
  availableCurrencies: string[];
}
```

### convertToINR Function

**Signature**:
```typescript
convertToINR(amount: number, currency: string): number
```

**Parameters**:
- `amount` (number): Amount in the specified currency
- `currency` (string): Currency code (e.g., 'USD', 'EUR', 'INR')

**Returns**: Amount in INR (number)

**Examples**:
```typescript
const { convertToINR } = useCurrency();

// USD to INR
convertToINR(1000, 'USD')  // Returns: ~90,748 INR

// EUR to INR
convertToINR(500, 'EUR')   // Returns: ~53,721 INR

// INR to INR (no conversion)
convertToINR(50000, 'INR') // Returns: 50,000 INR

// JPY to INR
convertToINR(100000, 'JPY'); // Returns: ~59,084 INR
```

### InputCurrencySelector Component

**Props**:
```typescript
interface InputCurrencySelectorProps {
  amount: number | string;
  onAmountChange: (amount: number | string) => void;
}
```

**Example**:
```typescript
<InputCurrencySelector
  amount={userInput}
  onAmountChange={(val) => setUserInput(val)}
/>
```

## Exchange Rate Details

### Rate Meanings

All rates are stored as: **1 INR = X foreign currency**

```typescript
exchangeRates = {
  USD: 0.011022,  // 1 INR = 0.011022 USD
  EUR: 0.009305,  // 1 INR = 0.009305 EUR
  GBP: 0.008091,  // 1 INR = 0.008091 GBP
  JPY: 1.692008,  // 1 INR = 1.692008 JPY
  // ...
}
```

### Conversion Formula

```
INR = Foreign_Amount / Exchange_Rate

Examples:
- 100 USD → 100 / 0.011022 = 9,074.95 INR
- 50 EUR → 50 / 0.009305 = 5,372.11 INR
- 1000 JPY → 1000 / 1.692008 = 591.01 INR
```

## Calculator Integration

### In CalculatorPanel.tsx

The system is already integrated! Here's how:

```typescript
// 1. Get the conversion function
const { convertToINR, selectedInputCurrency } = useCurrency();

// 2. Store user input
const [currencyInputAmount, setCurrencyInputAmount] = useState(0);

// 3. Convert automatically
useEffect(() => {
  const currencyField = calculator.fields.find(f => f.type === 'currency');
  if (currencyField) {
    const convertedAmount = convertToINR(currencyInputAmount, selectedInputCurrency);
    setInputs(prev => ({
      ...prev,
      [currencyField.key]: convertedAmount,  // ← INR value
    }));
  }
}, [currencyInputAmount, selectedInputCurrency]);

// 4. Calculator receives INR value
const results = calculateResults(calculator, inputs); // inputs[key] is in INR
```

## Real-World Example: Home Loan EMI

```typescript
import { useCurrency } from './context/CurrencyContext';

function HomeLoanCalculator() {
  const { convertToINR, selectedInputCurrency } = useCurrency();
  const [loanAmount, setLoanAmount] = useState<number | string>(0);
  
  // When user enters 250,000 USD
  const inrLoanAmount = convertToINR(Number(loanAmount), selectedInputCurrency);
  
  // Calculate EMI using INR amount
  const rate = 7; // per annum
  const years = 20;
  
  const monthlyRate = rate / 100 / 12;
  const months = years * 12;
  
  const emi = (inrLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
              (Math.pow(1 + monthlyRate, months) - 1);
  
  return (
    <div>
      <p>Loan Amount: ${loanAmount}</p>
      <p>In INR: ₹{inrLoanAmount.toLocaleString()}</p>
      <p>Monthly EMI: ₹{emi.toLocaleString()}</p>
    </div>
  );
}
```

## Common Patterns

### Pattern 1: Amount Input with Conversion

```typescript
const [userInput, setUserInput] = useState('');
const { convertToINR, selectedInputCurrency } = useCurrency();

const convertedAmount = convertToINR(parseFloat(userInput) || 0, selectedInputCurrency);

// Use convertedAmount in calculations
const tax = convertedAmount * 0.18; // 18% tax in INR
```

### Pattern 2: Display Original + Converted

```typescript
export function AmountDisplay({ originalAmount, currency }) {
  const { convertToINR, formatCurrency } = useCurrency();
  const inrAmount = convertToINR(originalAmount, currency);
  
  return (
    <div>
      <p>{currency}: {originalAmount}</p>
      <p>INR: ₹{inrAmount}</p>
      <p>Formatted: {formatCurrency(inrAmount)}</p>
    </div>
  );
}
```

### Pattern 3: Calculator Workflow

```typescript
export function Calculator({ calculator }) {
  const { convertToINR, selectedInputCurrency } = useCurrency();
  
  // Get first currency field
  const currencyField = calculator.fields.find(f => f.type === 'currency');
  
  // When amount changes
  const handleAmountChange = (amount: number) => {
    // Convert to INR
    const inrAmount = convertToINR(amount, selectedInputCurrency);
    
    // Set as input
    setInputs(prev => ({
      ...prev,
      [currencyField.key]: inrAmount
    }));
    
    // Calculate results
    const results = calculateResults(calculator, inputs);
    setResults(results);
  };
}
```

## Testing Your Integration

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCurrency } from './context/CurrencyContext';

describe('Currency Conversion', () => {
  it('should convert USD to INR', () => {
    const { result } = renderHook(() => useCurrency(), { 
      wrapper: CurrencyProvider 
    });
    
    act(() => {
      const inr = result.current.convertToINR(1000, 'USD');
      expect(inr).toBeGreaterThan(90000);
      expect(inr).toBeLessThan(100000);
    });
  });
});
```

## Troubleshooting

### Issue: convertToINR returning undefined

**Solution**: Make sure component is wrapped in CurrencyProvider:
```typescript
import { CurrencyProvider } from './context/CurrencyContext';

function App() {
  return (
    <CurrencyProvider>
      <YourComponent />
    </CurrencyProvider>
  );
}
```

### Issue: Exchange rates not loading

**Solution**: Check network tab for API errors. Falls back to default rates automatically.

```typescript
const { error, loading } = useCurrency();
if (error) console.log('Rate update failed:', error);
if (loading) console.log('Rates loading...');
```

### Issue: Conversion seems off by 1-2%

**Possible causes**:
- Exchange rates update hourly
- Using test/demo rates (not live)
- Rounding differences in calculations

## Performance Tips

1. **Memoize converted values**:
   ```typescript
   const convertedAmount = useMemo(
     () => convertToINR(amount, currency),
     [amount, currency, convertToINR]
   );
   ```

2. **Avoid unnecessary conversions**:
   ```typescript
   // Bad: converts on every render
   <div>{convertToINR(amount, currency)}</div>
   
   // Good: memoize or calculate once
   const converted = useMemo(() => 
     convertToINR(amount, currency), 
     [amount, currency, convertToINR]
   );
   ```

3. **Batch updates**:
   ```typescript
   // Update multiple fields at once
   setInputs(prev => ({
     ...prev,
     amount: convertedAmount,
     tax: convertedAmount * 0.18,
     total: convertedAmount * 1.18
   }));
   ```

## Migration from Old System

If you had manual currency handling:

**Before**:
```typescript
const inrAmount = userInputUSD * exchangeRate;  // Manual
```

**After**:
```typescript
const inrAmount = convertToINR(userInputUSD, 'USD');  // Automatic
```

## Best Practices

1. ✅ Always use `convertToINR` for input conversion
2. ✅ Always use `convertCurrency` for output conversion
3. ✅ Never hardcode exchange rates
4. ✅ Always access currency via `useCurrency()` hook
5. ✅ Keep calculator inputs in INR internally
6. ✅ Display in selected output currency
7. ✅ Test conversion logic for edge cases
8. ✅ Use TypeScript for type safety

## Support & Issues

For questions or issues:
1. Check [GLOBAL_CURRENCY_SYSTEM.md](./GLOBAL_CURRENCY_SYSTEM.md) for overview
2. Review test file: `inputCurrencyConversion.test.ts`
3. Check `CurrencyContext.tsx` for implementation
4. Review `InputCurrencySelector.tsx` for UI patterns
