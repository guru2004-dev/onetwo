import React from 'react';
import Link from 'next/link';
import { Search, Calculator as CalcIcon, TrendingUp, Sparkles } from 'lucide-react';
import CategoryCard from '@/components/CategoryCard';
import ExpandableCategoryCard from '@/components/ExpandableCategoryCard';
import { calculatorCategories } from '@/lib/calculators-data';

export default function Home() {
  const popularCalculators = [
    { name: 'EMI Calculator', path: '/calculators/emi', description: 'Calculate monthly loan payments' },
    { name: 'SIP Calculator', path: '/calculators/sip', description: 'Plan your investments' },
    { name: 'GST Calculator', path: '/calculators/gst', description: 'Calculate GST amounts' },
    { name: 'Compound Interest', path: '/calculators/compound-interest', description: 'Calculate investment returns' },
    { name: 'Income Tax', path: '/calculators/income-tax', description: 'Calculate tax liability' },
    { name: 'Discount Calculator', path: '/calculators/discount', description: 'Calculate discounts' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              All Business Calculators
              <br />
              <span className="text-indigo-200">in One Place</span>
            </h1>
            <p className="text-xl md:text-2xl text-indigo-100 mb-8 max-w-3xl mx-auto">
              Fast, accurate, and easy-to-use calculators for business, finance, banking, accounting, taxes, and more.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <Link
                href="/categories"
                className="px-8 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors shadow-lg"
              >
                Browse All Calculators
              </Link>
              <button className="px-8 py-3 bg-indigo-700 text-white rounded-lg font-semibold hover:bg-indigo-800 transition-colors border-2 border-indigo-500 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                Try Chat Calc AI
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gray-50 rounded-2xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Calculator Categories</h2>
          <p className="text-lg text-gray-600">
            Explore our comprehensive collection organized by category
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast & Accurate</h3>
            <p className="text-gray-600">
              Get instant results with precision calculations
            </p>
          </div>
          <div className="text-center p-6">
            <div className="inline-block p-4 bg-indigo-100 rounded-full mb-4">
              <CalcIcon className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy to Use</h3>
            <p className="text-gray-600">
              Simple interface designed for everyone
            </p>
          </div>
          <div className="text-center p-6">
            <div className="inline-block p-4 bg-purple-100 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Powered</h3>
            <p className="text-gray-600">
              Chat Calc AI helps you understand and calculate
            </p>
          </div>
        </div>
      </section>

      {/* Calculator Categories - Expandable Section at Bottom */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mb-4">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Calculator Categories</h2>
          <p className="text-lg text-gray-600 text-center">
            Browse and explore all our calculators by category
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {calculatorCategories.map((category) => (
            <ExpandableCategoryCard
              key={category.id}
              id={category.id}
              name={category.name}
              description={category.description}
              icon={category.icon}
              calculators={category.calculators}
            />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <CalcIcon className="w-6 h-6" />
                <span className="text-lg font-bold">Business Calculator</span>
              </div>
              <p className="text-gray-400 text-sm">
                Your one-stop solution for all business and financial calculations.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/" className="hover:text-white">Home</Link></li>
                <li><Link href="/categories" className="hover:text-white">All Calculators</Link></li>
                <li><Link href="/about" className="hover:text-white">About</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Popular Categories</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/category/financial" className="hover:text-white">Financial</Link></li>
                <li><Link href="/category/banking" className="hover:text-white">Banking</Link></li>
                <li><Link href="/category/tax" className="hover:text-white">Tax</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-sm text-gray-400">
                Have questions or suggestions?
                <br />
                Reach out to us anytime.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>© 2026 Business Calculator. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
