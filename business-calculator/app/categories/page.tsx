import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import CategoryCard from '@/components/CategoryCard';
import { calculatorCategories } from '@/lib/calculators-data';

export default function CategoriesPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">All Calculator Categories</h1>
          <p className="text-lg text-gray-600">
            Browse our comprehensive collection of business and financial calculators
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {calculatorCategories.map((category) => (
            <CategoryCard
              key={category.id}
              id={category.id}
              name={category.name}
              description={category.description}
              icon={category.icon}
              calculatorCount={category.calculators.length}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
