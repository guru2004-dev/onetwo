'use client';

import React from 'react';
import InputCurrencySelector from '@/components/InputCurrencySelector';
import PremiumCurrencyInput from '@/components/PremiumCurrencyInput';
import { useTheme } from '@/components/ThemeProvider';

interface InputFieldProps {
  label: string;
  type?: 'number' | 'text' | 'date';
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  tooltip?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  required?: boolean;
  prefix?: string;
  suffix?: string;
}

export default function InputField({
  label,
  type = 'number',
  value,
  onChange,
  placeholder,
  tooltip,
  min,
  max,
  step,
  required = false,
  prefix,
  suffix,
}: InputFieldProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const rupeeLabelPattern = /(\(₹\)|\(₹\s*per|₹\s*per|\(₹)/i;
  const isGlobalCurrencyInput = type === 'number' && (prefix === '₹' || rupeeLabelPattern.test(label));

  return (
    <div className="mb-4 text-left">
      <label className={`block text-sm font-medium mb-2 drop-shadow-sm flex items-center
        ${isDarkMode ? 'text-gray-300' : 'text-[#0F172A]'}`}
      >
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
        {tooltip && (
          <span className={`ml-2 text-xs cursor-help
            ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}
            title={tooltip}
          >
            ⓘ
          </span>
        )}
      </label>
      {isGlobalCurrencyInput ? (
        <InputCurrencySelector
          amount={value}
          onAmountChange={onChange}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          required={required}
          showCurrencyDropdown
        />
      ) : type === 'number' ? (
        <PremiumCurrencyInput
          value={value}
          onAmountChange={onChange}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          required={required}
          prefix={prefix}
          suffix={suffix}
        />
      ) : (
        <div className="relative">
          {prefix && (
            <span className={`absolute left-4 top-1/2 transform -translate-y-1/2 font-medium z-10 pointer-events-none
              ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}
            >
              {prefix}
            </span>
          )}
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
            required={required}
            className={`w-full py-3 px-4 rounded-xl outline-none 
              transition-all duration-300 shadow-inner font-medium tracking-wide
              ${prefix ? 'pl-10 text-right' : 'text-left'} 
              ${suffix ? 'pr-14 text-right' : ''}
              ${isDarkMode
                ? 'bg-gray-900 border border-gray-700 text-white placeholder-gray-500 hover:border-gray-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500'
                : 'bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] hover:border-[#D1DDE6] focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500'
              }`}
          />
          {suffix && (
            <span className={`absolute right-4 top-1/2 transform -translate-y-1/2 font-medium z-10 pointer-events-none
              ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              {suffix}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
