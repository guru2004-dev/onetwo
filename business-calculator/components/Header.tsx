'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Calculator, Menu, X, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { getAllCalculators, calculatorCategories } from '@/lib/calculators-data';
import ThemeToggle from '@/components/ThemeToggle';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);

  const calculators = getAllCalculators();
  const filteredCalculators = searchQuery
    ? calculators.filter(
        (calc) =>
          calc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          calc.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Close drawer when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        setIsDrawerOpen(false);
      }
    };

    if (isDrawerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isDrawerOpen]);

  // Close drawer on navigation
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  // Handle keyboard accessibility (Escape key)
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isDrawerOpen]);

  const handleSearchSelect = (path: string) => {
    setSearchQuery('');
    setShowSearchResults(false);
    router.push(path);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCalculatorClick = (path: string) => {
    setIsDrawerOpen(false);
    router.push(path);
  };

  return (
    <>
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="bg-white/80 dark:bg-black/20 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-full shadow-lg dark:shadow-2xl transition-colors duration-300">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            {/* Hamburger Menu Button - Left Side */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="p-2 text-slate-700 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                aria-label="View all calculators"
                title="View all calculators"
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2">
                <Calculator className="w-8 h-8 text-indigo-600 dark:text-white" />
                <span className="text-xl font-bold text-slate-900 dark:text-white hidden sm:inline tracking-tight">BusinessCalc</span>
              </Link>
            </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-6 mx-4">
            <Link href="/" className="text-slate-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white text-sm font-medium transition-colors">
              Home
            </Link>
            <Link href="/categories" className="text-slate-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white text-sm font-medium transition-colors">
              All Calculators
            </Link>
            <Link href="/about" className="text-slate-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white text-sm font-medium transition-colors">
              About
            </Link>
          </nav>

          {/* Right Side: Search and CTA - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                placeholder="Search..."
                className="w-48 lg:w-64 pl-9 pr-4 py-1.5 bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-white/20 focus:border-transparent outline-none text-sm text-slate-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all hover:bg-black/5 dark:hover:bg-white/10"
              />
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchQuery && (
              <div className="absolute top-12 right-0 w-80 bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl max-h-96 overflow-y-auto z-50">
                {filteredCalculators.length > 0 ? (
                  filteredCalculators.map((calc) => (
                    <button
                      key={calc.id}
                      onClick={() => handleSearchSelect(calc.path)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-100 dark:border-white/5 last:border-b-0 transition-colors"
                    >
                      <p className="font-medium text-slate-900 dark:text-white text-sm">{calc.name}</p>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">{calc.description}</p>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-slate-500 dark:text-gray-500 text-center text-sm">
                    No calculators found
                  </div>
                )}
              </div>
            )}
            
            <ThemeToggle />
            
            <button className="px-5 py-2 text-sm font-medium text-white dark:text-black bg-indigo-600 dark:bg-white rounded-full hover:bg-indigo-700 dark:hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-[0_0_15px_rgba(79,70,229,0.3)] dark:shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button className="p-2 text-white hover:bg-white/10 rounded-full">
              <Search className="w-5 h-5" onClick={() => setIsMenuOpen(!isMenuOpen)} />
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden mt-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10">
              <input
                type="text"
                placeholder="Search calculators..."
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-white/20 outline-none text-white text-sm"
              />
               {/* Search Results Mobile */}
              {showSearchResults && searchQuery && (
                <div className="mt-2 bg-[#121212] border border-white/10 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredCalculators.map((calc) => (
                      <button
                        key={calc.id}
                        onClick={() => handleSearchSelect(calc.path)}
                        className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5"
                      >
                        <p className="font-medium text-white text-sm">{calc.name}</p>
                      </button>
                    ))}
                </div>
              )}
            </div>
            <nav className="flex flex-col">
              <Link
                href="/"
                className="px-6 py-4 text-gray-300 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/categories"
                className="px-6 py-4 text-gray-300 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5"
                onClick={() => setIsMenuOpen(false)}
              >
                All Calculators
              </Link>
              <Link
                href="/about"
                className="px-6 py-4 text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
            </nav>
          </div>
        )}
        </div>

      {/* Overlay for search results */}
      {showSearchResults && searchQuery && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowSearchResults(false)}
        />
      )}
      </header>

      {/* Side Drawer Overlay - Click to Close */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-40 transition-opacity duration-300 cursor-pointer"
          aria-hidden="true"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Side Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-label="Calculator menu"
        aria-modal="true"
      >
        {/* Drawer Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calculator className="w-6 h-6 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">All Calculators</h2>
          </div>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content - Calculators by Category */}
        <div className="px-2 py-4">
          {calculatorCategories.map((category) => (
            <div key={category.id} className="mb-2">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-expanded={expandedCategories.includes(category.id)}
              >
                <div className="flex items-center space-x-2">
                  {expandedCategories.includes(category.id) ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="font-semibold text-gray-900">{category.name}</span>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {category.calculators.length}
                </span>
              </button>

              {/* Calculator List */}
              {expandedCategories.includes(category.id) && (
                <div className="mt-1 ml-6 space-y-1">
                  {category.calculators.map((calc) => (
                    <button
                      key={calc.id}
                      onClick={() => handleCalculatorClick(calc.path)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        pathname === calc.path
                          ? 'bg-indigo-50 text-indigo-700 font-medium border-l-2 border-indigo-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {calc.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Drawer Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 py-3">
          <div className="text-xs text-gray-600 text-center">
            <p className="mb-2">
              <strong>{calculators.length}</strong> calculators available
            </p>
            <Link
              href="/categories"
              onClick={() => setIsDrawerOpen(false)}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View All Categories →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
