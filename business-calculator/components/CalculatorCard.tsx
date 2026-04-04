'use client';

import React from 'react';
import Link from 'next/link';
import { Calculator, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface CalculatorCardProps {
  id: string;
  name: string;
  description: string;
  path: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export default function CalculatorCard({ id, name, description, path, icon: IconComponent = Calculator }: CalculatorCardProps) {
  return (
    <Link href={path} className="block h-full outline-none">
      <motion.div 
        whileHover={{ y: -8 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="group relative h-full p-6 md:p-8 rounded-2xl bg-white dark:bg-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.05] border border-gray-200 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/50 backdrop-blur-xl transition-all duration-300 overflow-hidden shadow-sm hover:shadow-lg dark:shadow-2xl flex flex-col"
      >
        {/* Subtle Hover Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-cyan-500/5 to-purple-500/5 dark:from-cyan-500/10 dark:via-blue-500/5 dark:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-start items-start mb-6">
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.4)] group-hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all duration-300">
              <IconComponent className="w-6 h-6 md:w-7 md:h-7 text-white transform group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-cyan-300 transition-colors">
              {name}
            </h3>
            <p className="text-sm md:text-base text-slate-500 dark:text-gray-400 font-light leading-relaxed mb-6 group-hover:text-slate-700 dark:group-hover:text-gray-300 transition-colors line-clamp-3">
              {description}
            </p>
          </div>

          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-indigo-500 dark:text-cyan-400">
            <span className="text-sm font-semibold tracking-wide">Launch Tool</span>
            <ArrowRight className="w-5 h-5 transform -translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
