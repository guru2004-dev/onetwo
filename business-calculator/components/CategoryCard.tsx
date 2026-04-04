'use client';

import React from 'react';
import Link from 'next/link';
import { Calculator, TrendingUp, Building2, FileText, Receipt, ShoppingCart, Globe, BarChart3, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface CategoryCardProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  calculatorCount: number;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Calculator,
  TrendingUp,
  Building2,
  FileText,
  Receipt,
  ShoppingCart,
  Globe,
  BarChart3,
};

export default function CategoryCard({ id, name, description, icon, calculatorCount }: CategoryCardProps) {
  const IconComponent = iconMap[icon] || Calculator;

  return (
    <Link href={`/category/${id}`} className="block h-full outline-none">
      <motion.div 
        whileHover={{ y: -8 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="group relative h-full p-6 md:p-8 rounded-2xl bg-white dark:bg-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.05] border border-gray-200 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/50 backdrop-blur-xl transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl dark:shadow-2xl flex flex-col"
      >
        {/* Subtle Hover Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-cyan-500/5 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md dark:shadow-[0_0_20px_rgba(99,102,241,0.4)] group-hover:shadow-lg dark:group-hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-all duration-300">
              <IconComponent className="w-6 h-6 md:w-7 md:h-7 text-white transform group-hover:scale-110 transition-transform duration-300" />
            </div>

            <div className="flex items-center px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold tracking-wide shadow-sm dark:shadow-none">
              {calculatorCount} {calculatorCount === 1 ? 'App' : 'Apps'}
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
              {name}
            </h3>
            <p className="text-sm md:text-base text-slate-500 dark:text-gray-400 font-light leading-relaxed mb-6 group-hover:text-slate-700 dark:group-hover:text-gray-300 transition-colors line-clamp-3">
              {description}
            </p>
          </div>

          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-indigo-500 dark:text-indigo-400">
            <span className="text-sm font-semibold tracking-wide">Explore Suite</span>
            <ArrowRight className="w-5 h-5 transform -translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
