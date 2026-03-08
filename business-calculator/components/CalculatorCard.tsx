'use client';

import React from 'react';
import Link from 'next/link';
import { Calculator } from 'lucide-react';

interface CalculatorCardProps {
  id: string;
  name: string;
  description: string;
  path: string;
}

export default function CalculatorCard({ id, name, description, path }: CalculatorCardProps) {
  return (
    <Link href={path}>
      <div className="group p-5 bg-white rounded-lg border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all duration-200 cursor-pointer h-full">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-gray-100 rounded group-hover:bg-indigo-100 transition-colors">
            <Calculator className="w-5 h-5 text-gray-600 group-hover:text-indigo-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-base font-semibold text-gray-900 mb-1 group-hover:text-indigo-600">
              {name}
            </h4>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
