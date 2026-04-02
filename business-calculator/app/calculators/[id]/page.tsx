import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getCalculatorById } from '@/lib/calculators-data';
import UniversalCalculator from '@/components/UniversalCalculator';

export default async function CalculatorFallbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const calculator = getCalculatorById(id);

  if (!calculator) {
    return (
      <main className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Calculator Not Found</h1>
          <p className="text-gray-600 mb-8">
            The calculator you are trying to access does not exist.
          </p>
          <Link
            href="/categories"
            className="inline-flex items-center px-5 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Browse All Calculators
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href={`/category/${calculator.category}`}
          className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {calculator.category} calculators
        </Link>
        <UniversalCalculator
          id={calculator.id}
          name={calculator.name}
          description={calculator.description}
        />
      </div>
    </main>
  );
}