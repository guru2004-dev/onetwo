'use client';

import React from 'react';
import InputCurrencySelector from '@/components/InputCurrencySelector';
import PremiumCurrencyInput from '@/components/PremiumCurrencyInput';

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
  const rupeeLabelPattern = /(\(₹\)|\(₹\s*per|₹\s*per|\(₹)/i;
  const isGlobalCurrencyInput = type === 'number' && (prefix === '₹' || rupeeLabelPattern.test(label));

  return (
    <div className="mb-4 text-left">
      <label className="block text-sm font-medium text-gray-300 mb-2 drop-shadow-sm flex items-center">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
        {tooltip && (
          <span className="ml-2 text-gray-500 text-xs cursor-help" title={tooltip}>
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
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-400 font-medium z-10 pointer-events-none">
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
            className={`w-full py-3 px-4 bg-gray-900 border border-gray-700 rounded-xl text-white outline-none 
              transition-all duration-300 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 
              hover:border-gray-600 shadow-inner font-medium tracking-wide placeholder-gray-500
              ${prefix ? 'pl-10 text-right' : 'text-left'} 
              ${suffix ? 'pr-14 text-right' : ''}`}
          />
          {suffix && (
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium z-10 pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
