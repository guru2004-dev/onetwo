'use client';

import React from 'react';

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
  return (
    <div
      className={`p-4 rounded-lg ${
        highlighted
          ? 'bg-indigo-50 border-2 border-indigo-500'
          : 'bg-gray-50 border border-gray-200'
      }`}
    >
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p
        className={`text-2xl font-bold ${
          highlighted ? 'text-indigo-600' : 'text-gray-900'
        }`}
      >
        {prefix}
        {value}
        {suffix}
      </p>
    </div>
  );
}
