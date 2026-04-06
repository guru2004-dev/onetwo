'use client';

import React from 'react';
import { useTheme } from '@/components/ThemeProvider';

interface SelectFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  options: { label: string; value: string | number }[];
  required?: boolean;
  tooltip?: string;
}

export default function SelectField({
  label,
  value,
  onChange,
  options,
  required = false,
  tooltip,
}: SelectFieldProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <div className="mb-4">
      <label className={`block text-sm font-medium mb-2
        ${isDarkMode ? 'text-gray-300' : 'text-[#0F172A]'}`}
      >
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
        {tooltip && (
          <span className={`ml-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-[#94A3B8]'}`} title={tooltip}>
            ⓘ
          </span>
        )}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3 rounded-xl focus:ring-2 focus:outline-none transition-colors duration-300
          ${isDarkMode
            ? 'bg-gray-900 border border-gray-700 text-white placeholder-gray-500 hover:border-gray-600 focus:ring-indigo-500/50 focus:border-indigo-500'
            : 'bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] hover:border-[#CBD5E1] focus:ring-purple-500/50 focus:border-purple-500'
          }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
