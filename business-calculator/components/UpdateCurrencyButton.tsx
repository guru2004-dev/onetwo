'use client';

import React, { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

function getRelativeTimeLabel(lastUpdatedTime: number | null): string {
  if (!lastUpdatedTime) {
    return 'never';
  }

  const seconds = Math.max(1, Math.floor((Date.now() - lastUpdatedTime) / 1000));

  if (seconds < 60) {
    return `${seconds} sec ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day ago`;
}

export default function UpdateCurrencyButton() {
  const { updateCurrencyRates, loading, lastUpdatedTime } = useCurrency();

  const relativeLabel = useMemo(() => getRelativeTimeLabel(lastUpdatedTime), [lastUpdatedTime]);

  return (
    <button
      type="button"
      onClick={() => {
        updateCurrencyRates();
      }}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      title={`Last updated: ${relativeLabel}`}
      aria-label="Update exchange rates"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      <span className="text-sm font-medium">Update</span>
    </button>
  );
}
