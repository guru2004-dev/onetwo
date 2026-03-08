'use client';

import React from 'react';
import Link from 'next/link';
import { Calculator, TrendingUp, Building2, FileText, Receipt, ShoppingCart, Globe, BarChart3 } from 'lucide-react';

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
    <Link href={`/category/${id}`}>
      <div className="group p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-indigo-500 hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-500 transition-colors">
            <IconComponent className="w-6 h-6 text-indigo-600 group-hover:text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-indigo-600">
              {name}
            </h3>
            <p className="text-sm text-gray-600 mb-2">{description}</p>
            <p className="text-xs text-gray-500">{calculatorCount} calculators</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
