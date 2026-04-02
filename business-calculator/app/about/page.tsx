import React from 'react';
import Link from 'next/link';
import { Calculator, Mail, ArrowLeft } from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Business Calculator</h1>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              Business Calculator is your one-stop solution for all business and financial calculations. 
              We provide fast, accurate, and easy-to-use calculators that help students, entrepreneurs, 
              small business owners, accountants, and finance professionals make informed decisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">What We Offer</h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">✓</span>
                <span>Over 60+ specialized calculators across 8 categories</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">✓</span>
                <span>Clear explanations and formulas for every calculation</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">✓</span>
                <span>Interactive charts and visualizations</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">✓</span>
                <span>AI-powered assistant (Chat Calc AI) for guidance</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">✓</span>
                <span>Mobile-friendly responsive design</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">✓</span>
                <span>100% free to use with no registration required</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Calculator Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Basic Calculators</h3>
                <p className="text-sm text-gray-600">Essential arithmetic and percentage calculations</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Financial Calculators</h3>
                <p className="text-sm text-gray-600">Loans, investments, and interest calculations</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Banking Calculators</h3>
                <p className="text-sm text-gray-600">Banking products and financial planning</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Accounting Calculators</h3>
                <p className="text-sm text-gray-600">Business accounting and financial statements</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Tax Calculators</h3>
                <p className="text-sm text-gray-600">Tax calculations and planning</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Sales Calculators</h3>
                <p className="text-sm text-gray-600">Sales and commission calculations</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">International Business</h3>
                <p className="text-sm text-gray-600">Currency and international trade</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Analytical Calculators</h3>
                <p className="text-sm text-gray-600">Financial analysis and valuation</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Who We Serve</h2>
            <ul className="space-y-2 text-gray-700">
              <li><strong>Students:</strong> Commerce, Finance, and Management students learning financial concepts</li>
              <li><strong>Entrepreneurs:</strong> Startup founders planning their business finances</li>
              <li><strong>Small Business Owners:</strong> SME owners managing daily financial operations</li>
              <li><strong>Accountants:</strong> Professional accountants performing quick calculations</li>
              <li><strong>Finance Professionals:</strong> Anyone working with numbers and financial data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Our Commitment</h2>
            <p className="text-gray-700 leading-relaxed">
              We are committed to providing accurate, reliable, and user-friendly calculators that simplify 
              complex financial calculations. Our platform is continuously updated with new calculators and 
              features based on user feedback and emerging needs in the business world.
            </p>
          </section>

          <section className="border-t border-gray-200 pt-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              Have questions, suggestions, or feedback? We'd love to hear from you!
            </p>
            <div className="flex items-center space-x-2 text-indigo-600">
              <Mail className="w-5 h-5" />
              <span>contact@businesscalculator.com</span>
            </div>
          </section>

          <div className="flex items-center justify-center space-x-4 pt-6 border-t border-gray-200">
            <Link
              href="/"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Start Calculating
            </Link>
            <Link
              href="/categories"
              className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Browse Categories
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
