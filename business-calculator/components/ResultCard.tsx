'use client';

import React from 'react';
import { useTheme } from '@/components/ThemeProvider';

interface ResultCardProps {
  label: string;
  value: string | number;
  highlighted?: boolean;
  prefix?: string;
  suffix?: string;
}

export default function ResultCard({
  label,
  value,
  highlighted = false,
  prefix = '',
  suffix = '',
}: ResultCardProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <div
      className={`p-4 rounded-3xl transition-colors duration-300 shadow-sm
        ${highlighted
          ? isDarkMode
            ? 'bg-indigo-500/20 border-2 border-indigo-500'
            : 'bg-purple-50 border-2 border-purple-200'
          : isDarkMode
            ? 'bg-white/5 border border-white/10'
            : 'bg-white border border-[#E2E8F0]'
        }`}
    >
      <p className={`text-sm mb-1 tracking-wide
        ${isDarkMode
          ? highlighted ? 'text-indigo-300' : 'text-gray-400'
          : highlighted ? 'text-purple-600' : 'text-[#64748B]'
        }`}
      >
        {label}
      </p>
      <p
        className={`text-2xl font-semibold
          ${isDarkMode
            ? highlighted ? 'text-indigo-300' : 'text-white'
            : highlighted ? 'text-purple-600' : 'text-[#0F172A]'
          }`}
      >
        {prefix}
        {value}
        {suffix}
      </p>
    </div>
  );
}
