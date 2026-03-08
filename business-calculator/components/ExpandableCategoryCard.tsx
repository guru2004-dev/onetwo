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
    <div className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Card Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-start gap-3 mb-2">
          <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
            <IconComponent className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
          <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded">
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
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
          >
            {calc.name}
          </button>
        ))}

        {/* Expand/Collapse Button */}
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors font-semibold flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                Show Less
                <ChevronDown className="w-4 h-4 transform rotate-180" />
              </>
            ) : (
              <>
                + {calculators.length - 3} More
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
