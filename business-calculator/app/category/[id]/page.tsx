'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calculator as CalcIcon, Search } from 'lucide-react';
import { getCategoryById } from '@/lib/calculators-data';
import PremiumBreadcrumbNav from '@/components/PremiumBreadcrumbNav';
import CalculatorCard from '@/components/CalculatorCard';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export default function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const category = getCategoryById(id);
  const [searchQuery, setSearchQuery] = useState('');

  if (!category) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] py-16 text-slate-900 dark:text-white flex items-center justify-center transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 p-12 rounded-3xl shadow-sm dark:shadow-none backdrop-blur-xl">
          <Search className="w-12 h-12 text-slate-400 dark:text-gray-600 mb-4 mx-auto" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-200 mb-4">Category Not Found</h1>
          <p className="text-slate-500 dark:text-gray-500 mb-6 max-w-sm mx-auto">We couldn't locate this module within our ecosystem.</p>
          <Link href="/categories" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full transition-colors inline-block font-medium shadow-md">
            Browse All Categories
          </Link>
        </div>
      </main>
    );
  }

  const filteredCalculators = useMemo(() => {
    return category.calculators.filter(calc => 
      calc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      calc.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [category, searchQuery]);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-white transition-colors overflow-hidden relative selection:bg-indigo-500/30">
      
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-100/50 dark:from-[#1e1b4b]/40 to-transparent pointer-events-none z-0 transition-colors" />
      <motion.div 
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0" 
      />
      <motion.div 
        animate={{ opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 12, repeat: Infinity, delay: 2 }}
        className="absolute top-[30%] right-[10%] w-[600px] h-[600px] bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0" 
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-16 py-16 pt-6">
        
        {/* Header */}
        <div className="mb-14 relative">
          <PremiumBreadcrumbNav categoryName={category.name} />
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8">
            <div className="flex items-start space-x-6">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="p-4 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.3)] mt-1"
              >
                <CalcIcon className="w-10 h-10 text-white" />
              </motion.div>
              <div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 dark:from-blue-400 dark:via-purple-400 dark:to-cyan-400"
                >
                  {category.name}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: 0.1 }}
                  className="text-lg md:text-xl text-slate-600 dark:text-gray-400 font-light mb-4 max-w-2xl"
                >
                  {category.description}
                </motion.p>
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ delay: 0.2 }}
                  className="inline-block px-4 py-1.5 rounded-full bg-cyan-100/50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-sm font-bold tracking-wide"
                >
                  {category.calculators.length} Calculators Available
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="relative max-w-xl group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
            </div>
            <input
              type="text"
              className="w-full bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 focus:border-indigo-500/50 rounded-2xl py-4 pl-12 pr-6 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 outline-none backdrop-blur-md transition-all shadow-sm dark:shadow-inner focus:ring-4 focus:ring-indigo-500/10"
              placeholder={`Search ${category.name.toLowerCase()} calculators...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Calculators Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={searchQuery}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 min-h-[400px]"
          >
            {filteredCalculators.length > 0 ? (
              filteredCalculators.map((calculator) => (
                <motion.div key={calculator.id} variants={itemVariants} className="h-full">
                  <CalculatorCard
                    id={calculator.id}
                    name={calculator.name}
                    description={calculator.description}
                    path={calculator.path}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="col-span-full flex flex-col items-center justify-center py-24 border border-gray-200 dark:border-white/5 bg-white dark:bg-white/[0.02] rounded-3xl shadow-sm dark:shadow-none"
              >
                <Search className="w-12 h-12 text-slate-300 dark:text-gray-600 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 dark:text-gray-300 mb-2">No matching calculators</h3>
                <p className="text-slate-500 dark:text-gray-500 max-w-sm text-center mb-6">
                  Try adjusting your search terms or explore other categories.
                </p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="px-6 py-2 bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors font-medium"
                >
                  Clear Search
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

      </div>
    </main>
  );
}
