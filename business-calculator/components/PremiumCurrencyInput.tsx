'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';

interface PremiumCurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string | number;
  onAmountChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
}

export default function PremiumCurrencyInput({
  value,
  onAmountChange,
  prefix,
  suffix,
  className = '',
  ...props
}: PremiumCurrencyInputProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalValue, setInternalValue] = useState<string>('');
  const [cursorPos, setCursorPos] = useState<number | null>(null);

  // Format using Indian Numbering System
  const formatValue = (val: string | number) => {
    if (val === null || val === undefined || val === '') return '';
    
    // Remove all non-numeric and non-decimal characters
    const cleanString = String(val).replace(/[^0-9.]/g, '');
    if (!cleanString) return '';

    // Handle multiple decimals
    const parts = cleanString.split('.');
    let intPart = parts[0];
    const decPart = parts.length > 1 ? `.${parts[1]}` : '';

    if (intPart === '') {
      return cleanString.startsWith('.') ? '0.' : '';
    }

    try {
      // BigInt prevents precision loss on large numbers
      const formattedInt = new Intl.NumberFormat('en-IN').format(BigInt(intPart));
      return formattedInt + decPart;
    } catch {
      return intPart + decPart;
    }
  };

  useEffect(() => {
    // Only update internal format if raw value changes significantly from what we typed
    // to avoid layout thrashing during typing
    const rawNumeric = String(value).replace(/[^0-9.]/g, '');
    const currentNumeric = internalValue.replace(/[^0-9.]/g, '');
    
    if (rawNumeric !== currentNumeric) {
      setInternalValue(formatValue(value));
    }
  }, [value]);

  // Restore cursor position after render if needed
  useEffect(() => {
    if (inputRef.current && cursorPos !== null) {
      inputRef.current.setSelectionRange(cursorPos, cursorPos);
    }
  }, [internalValue, cursorPos]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const oldSelection = e.target.selectionStart || 0;
    
    // Calculate digits before cursor in the newly typed raw string
    const oldDigitCount = rawValue.slice(0, oldSelection).replace(/[^0-9.]/g, '').length;
    
    // Allow empty
    if (rawValue.trim() === '') {
      setInternalValue('');
      onAmountChange('');
      return;
    }

    // Only allow digits and decimal and comma
    if (/[^0-9.,]/.test(rawValue)) {
      return; // Ignore invalid char
    }

    const newFormatted = formatValue(rawValue);
    setInternalValue(newFormatted);
    
    // Push clean numerical value to parent
    const pureNumber = rawValue.replace(/[^0-9.]/g, '');
    onAmountChange(pureNumber);

    // Calculate new cursor position based on keeping it after the same digit
    let newCursorPos = 0;
    let digitsSeen = 0;
    for (let i = 0; i < newFormatted.length; i++) {
      if (/[0-9.]/.test(newFormatted[i])) {
        digitsSeen++;
      }
      if (digitsSeen === oldDigitCount) {
        newCursorPos = i + 1;
        break;
      }
    }
    
    // Edge case if user deleted comma before a digit or similar
    if (newFormatted.length > internalValue.length && newFormatted.replace(/[^0-9.]/g, '').length === internalValue.replace(/[^0-9.]/g, '').length) {
       // length grew but digits didn't (added a comma organically)
       newCursorPos += 1;
    }

    setCursorPos(newCursorPos);
  };

  return (
    <div className="relative flex items-center w-full">
      {prefix && (
        <span className={`absolute left-4 font-medium z-10 pointer-events-none
          ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}
        >
          {prefix}
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={internalValue}
        onChange={handleChange}
        className={`w-full py-3 px-4 border rounded-xl outline-none 
          transition-all duration-300 shadow-inner font-medium tracking-wide
          text-right ${prefix ? 'pl-10' : ''} ${suffix ? 'pr-12' : ''} ${className}
          ${isDarkMode
            ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 hover:border-gray-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500'
            : 'bg-white border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] hover:border-[#D1DDE6] focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500'
          }`}
        {...props}
      />
      {suffix && (
        <span className={`absolute right-4 font-medium z-10 pointer-events-none
          ${isDarkMode ? 'text-gray-400' : 'text-[#64748B]'}`}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}
