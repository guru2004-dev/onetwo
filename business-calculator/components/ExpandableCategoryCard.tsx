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
import { useTheme } from '@/components/ThemeProvider';

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
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
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
      className={`rounded-2xl border overflow-hidden transition-all duration-300
        ${isDarkMode
          ? 'bg-white/5 border-white/10 hover:border-purple-500/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.2)]'
          : 'card-light'
        }`}
    >
      {/* Card Header */}
      <div className={`p-5 border-b transition-colors
        ${isDarkMode ? 'border-white/10' : 'border-[#E2E8F0]'}`}
      >
        <div className="flex items-start gap-3 mb-2">
          <div className={`p-2 rounded-xl flex-shrink-0 border transition-colors
            ${isDarkMode
              ? 'bg-white/5 border-white/5'
              : 'bg-purple-50 border-purple-200'
            }`}
          >
            <IconComponent className={`w-6 h-6
              ${isDarkMode
                ? 'text-purple-400'
                : 'text-purple-600'
              }`}
            />
          </div>
          <div className="flex-1">
            <h3 className={`text-base font-bold tracking-wide transition-colors
              ${isDarkMode ? 'text-white' : 'text-light-primary'}`}
            >
              {name}
            </h3>
            <p className={`text-sm mt-1 line-clamp-2 transition-colors
              ${isDarkMode ? 'text-gray-400' : 'text-light-secondary'}`}
            >
              {description}
            </p>
          </div>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full border transition-colors
            ${isDarkMode
              ? 'bg-white/5 border-white/10 text-gray-300'
              : 'bg-purple-50 border-purple-200 text-purple-700'
            }`}
          >
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
            className={`w-full text-left px-3 py-2.5 text-sm rounded-xl transition-all font-medium flex items-center group
              ${isDarkMode
                ? 'text-gray-300 hover:text-white hover:bg-white/10'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full mr-3 transition-colors
              ${isDarkMode
                ? 'bg-purple-500/50 group-hover:bg-purple-400'
                : 'bg-purple-400/50 group-hover:bg-purple-600'
              }`}
            />
            {calc.name}
          </button>
        ))}

        {/* Expand/Collapse Button */}
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-full mt-2 text-center px-3 py-2.5 text-sm rounded-xl transition-colors font-medium flex items-center justify-center gap-2
              ${isDarkMode
                ? 'text-purple-400 hover:text-purple-300 hover:bg-white/5'
                : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
              }`}
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
