'use client';

import React, { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import UpdateCurrencyButton from '@/components/UpdateCurrencyButton';
import CurrencyChanger from '@/components/CurrencyChanger';

interface CalculatorLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  results?: ReactNode;
  explanation?: ReactNode;
  chart?: ReactNode;
}

export default function CalculatorLayout({
  title,
  description,
  children,
  results,
  explanation,
  chart,
}: CalculatorLayoutProps) {
  const router = useRouter();

  return (
    <>
      {/* Fixed Back Button - Always Visible */}
      <button
        onClick={() => router.back()}
        className="fixed top-20 left-4 z-30 flex items-center gap-2 px-3 py-2 bg-white text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 group"
        title="Go back"
        aria-label="Go back to previous page"
      >
        <ArrowLeft className="w-5 h-5 group-hover:translate-x-[-2px] transition-transform" />
        <span className="font-medium hidden sm:inline">Back</span>
      </button>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600">{description}</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Input</h2>
            {children}
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Result</h2>
              <UpdateCurrencyButton />
            </div>
            <CurrencyChanger variant="result" />
            {results || (
              <div className="text-gray-500 text-center py-8">
                Enter values to see results
              </div>
            )}
          </div>
        </div>

        {/* Chart Section */}
        {chart && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Visualization</h2>
            {chart}
          </div>
        )}

        {/* Explanation Section */}
        {explanation && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h2>
            {explanation}
          </div>
        )}
      </div>
      </div>
    </>
  );
}
