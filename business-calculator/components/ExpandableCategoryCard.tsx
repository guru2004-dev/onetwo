'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calculator,
  TrendingUp,
  Building2,
  FileText,
  Receipt,
  ShoppingCart,
  Globe,
  BarChart3,
  ChevronDown,
} from 'lucide-react';
import { Calculator as CalculatorType } from '@/lib/types';
import { motion } from 'framer-motion';

interface ExpandableCategoryCardProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  calculators: CalculatorType[];
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

export default function ExpandableCategoryCard({
  id,
  name,
  description,
  icon,
  calculators,
}: ExpandableCategoryCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const IconComponent = iconMap[icon] || Calculator;
  const displayCalculators = isExpanded ? calculators : calculators.slice(0, 3);
  const hasMore = calculators.length > 3;

  const handleCalculatorClick = (path: string) => {
    router.push(path);
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 hover:border-indigo-400 dark:hover:border-purple-500/50 hover:shadow-[0_0_25px_rgba(99,102,241,0.2)] dark:hover:shadow-[0_0_25px_rgba(168,85,247,0.2)] transition-all duration-300 overflow-hidden backdrop-blur-sm shadow-sm dark:shadow-none"
    >
      {/* Card Header */}
      <div className="p-5 border-b border-gray-100 dark:border-white/10">
        <div className="flex items-start gap-3 mb-2">
          <div className="p-2 bg-indigo-50 dark:bg-white/5 rounded-xl flex-shrink-0 border border-indigo-100 dark:border-white/5">
            <IconComponent className="w-6 h-6 text-indigo-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">{name}</h3>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1 line-clamp-2">{description}</p>
          </div>
          <span className="px-2 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-300 text-xs font-semibold rounded-full">
            {calculators.length}
          </span>
        </div>
      </div>

      {/* Calculator Links */}
      <div className="px-5 py-4 space-y-2">
        {displayCalculators.map((calc) => (
          <button
            key={calc.id}
            onClick={() => handleCalculatorClick(calc.path)}
            className="w-full text-left px-3 py-2.5 text-sm text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/10 rounded-xl transition-all font-medium flex items-center group"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/50 dark:bg-purple-500/50 mr-3 group-hover:bg-indigo-600 dark:group-hover:bg-purple-400 transition-colors" />
            {calc.name}
          </button>
        ))}

        {/* Expand/Collapse Button */}
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-2 text-center px-3 py-2.5 text-sm text-indigo-600 dark:text-purple-400 hover:text-indigo-800 dark:hover:text-purple-300 hover:bg-indigo-50 dark:hover:bg-white/5 rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
          >
            {isExpanded ? (
              <>
                Show Less
                <ChevronDown className="w-4 h-4 transform rotate-180" />
              </>
            ) : (
              <>
                View {calculators.length - 3} More
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}
