import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Calculator as CalcIcon } from 'lucide-react';
import { getCategoryById } from '@/lib/calculators-data';
import CalculatorCard from '@/components/CalculatorCard';

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = getCategoryById(id);

  if (!category) {
    return (
      <main className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Category Not Found</h1>
          <Link href="/categories" className="text-indigo-600 hover:text-indigo-700">
            Browse All Categories
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/categories"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Categories
          </Link>
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-4 bg-indigo-100 rounded-lg">
              <CalcIcon className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{category.name}</h1>
              <p className="text-lg text-gray-600 mt-1">{category.description}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">{category.calculators.length} calculators available</p>
        </div>

        {/* Calculators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {category.calculators.map((calculator) => (
            <CalculatorCard
              key={calculator.id}
              id={calculator.id}
              name={calculator.name}
              description={calculator.description}
              path={calculator.path}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
