'use client';

import React from 'react';

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
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {tooltip && (
          <span className="ml-2 text-gray-400 text-xs" title={tooltip}>
            ⓘ
          </span>
        )}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
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
          className={`w-full py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${
            prefix ? 'pl-10 pr-4' : 'px-4'
          } ${suffix ? 'pr-14' : ''}`}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
