'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CategoryCard from '@/components/CategoryCard';
import { getImplementedCategories } from '@/lib/calculators-data';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function CategoriesPage() {
  const categories = getImplementedCategories();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  // Derive tabs directly from available categories plus an 'All' option
  const tabs = ['All', ...categories.map(c => c.name)];

  const filteredCategories = useMemo(() => {
    return categories.map(category => {
      // Filter the underlying calculators if there's a search term
      const matchingCalculators = category.calculators.filter(calc => 
        calc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        calc.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return {
        ...category,
        matchingCalculators
      };
    }).filter(category => {
      // Filter by Tab
      if (activeTab !== 'All' && category.name !== activeTab) return false;
      
      // Filter by Search Query
      if (searchQuery) {
        return category.matchingCalculators.length > 0 || 
               category.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [categories, searchQuery, activeTab]);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-white transition-colors overflow-hidden relative selection:bg-indigo-500/30">
      
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-100/50 dark:from-[#1e1b4b]/40 to-transparent pointer-events-none z-0 transition-colors" />
      <motion.div 
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-[10%] left-[20%] w-[600px] h-[600px] bg-purple-300/20 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0" 
      />
      <motion.div 
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, delay: 2 }}
        className="absolute top-[40%] right-[10%] w-[500px] h-[500px] bg-cyan-300/20 dark:bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none z-0" 
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-16 py-20">
        
        {/* Navigation & Header */}
        <div className="mb-14 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex-1">
            <Link
              href="/"
              className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors mb-6 font-medium text-sm border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 rounded-full shadow-sm dark:shadow-none"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back Dashboard
            </Link>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 dark:from-blue-400 dark:via-purple-400 dark:to-cyan-400"
            >
              All Calculator Categories
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-slate-600 dark:text-gray-400 max-w-2xl font-light"
            >
              Browse our powerful suite of business and financial calculators designed for precise, real-time insights.
            </motion.p>
          </div>
        </div>

        {/* Search & Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12 space-y-6"
        >
          <div className="relative max-w-xl group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
            </div>
            <input
              type="text"
              className="w-full bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 focus:border-indigo-500/50 rounded-2xl py-4 pl-12 pr-6 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 outline-none backdrop-blur-md transition-all shadow-sm dark:shadow-inner focus:ring-4 focus:ring-indigo-500/10"
              placeholder="Search calculators by name or purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden md:flex items-center text-slate-500 dark:text-gray-500 mr-2 border-r border-gray-200 dark:border-white/10 pr-4">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              <span className="text-sm font-semibold uppercase tracking-wider">Filter</span>
            </div>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md dark:shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                    : 'bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.08] hover:text-indigo-600 dark:hover:text-gray-200 shadow-sm dark:shadow-none'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Categories Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + searchQuery}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 min-h-[400px]"
          >
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <motion.div key={category.id} variants={itemVariants} className="h-full">
                  <CategoryCard
                    id={category.id}
                    name={category.name}
                    description={category.description}
                    icon={category.icon}
                    calculatorCount={searchQuery ? category.matchingCalculators.length : category.calculators.length}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="col-span-full flex flex-col items-center justify-center py-20 border border-gray-200 dark:border-white/5 bg-white dark:bg-white/[0.02] rounded-3xl shadow-sm dark:shadow-none"
              >
                <Search className="w-12 h-12 text-slate-300 dark:text-gray-600 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 dark:text-gray-300 mb-2">No calculators found</h3>
                <p className="text-slate-500 dark:text-gray-500 max-w-sm text-center">
                  Try adjusting your search query or switching tabs to discover other financial tools.
                </p>
                <button 
                  onClick={() => { setSearchQuery(''); setActiveTab('All'); }}
                  className="mt-6 px-6 py-2 bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors font-medium"
                >
                  Clear Filters
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
