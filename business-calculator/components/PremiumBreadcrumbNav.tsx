'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PremiumBreadcrumbNavProps {
  categoryName: string;
}

export default function PremiumBreadcrumbNav({ categoryName }: PremiumBreadcrumbNavProps) {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Transition to sticky mode after 100px of scrolling
      setIsSticky(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Spacer to prevent layout jumps when the original element becomes fixed */}
      <div className="h-14 mb-8 w-full block" />

      <AnimatePresence>
        <motion.div
          initial={false}
          animate={{
            position: isSticky ? 'fixed' : 'absolute',
            top: isSticky ? '1.5rem' : '4rem', // matches standard padding start
            left: isSticky ? '1.5rem' : 'auto', 
            zIndex: 50,
            scale: isSticky ? 0.95 : 1,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={`
            flex items-center
            ${
              isSticky 
              ? 'bg-white/80 dark:bg-white/[0.08] backdrop-blur-2xl border border-gray-200 dark:border-white/20 shadow-xl dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] rounded-full px-5 py-3' 
              : 'bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 backdrop-blur-md rounded-full px-5 py-2.5'
            }
            transition-colors duration-300
          `}
          style={!isSticky ? { left: 'auto' } : undefined}
        >
          {/* Main Action Block */}
          <Link
            href="/categories"
            className="flex items-center group outline-none"
          >
            <div className={`p-1.5 rounded-full mr-3 transition-all duration-300 ${isSticky ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md dark:shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-transparent text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20'}`}>
               <ArrowLeft className="w-4 h-4" />
            </div>
            
            {/* Desktop Full Breadcrumb Text */}
            <div className={`hidden sm:flex items-center space-x-2 font-medium tracking-wide ${isSticky ? 'text-slate-600 dark:text-gray-200' : 'text-indigo-800 dark:text-indigo-200'}`}>
               <span className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</span>
               <ChevronRight className={`w-3.5 h-3.5 ${isSticky ? 'text-slate-400 dark:text-gray-500' : 'text-indigo-300 dark:text-indigo-400/50'}`} />
               <span className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Categories</span>
               <ChevronRight className={`w-3.5 h-3.5 ${isSticky ? 'text-slate-400 dark:text-gray-500' : 'text-indigo-300 dark:text-indigo-400/50'}`} />
               <span className={`font-semibold ${isSticky ? 'text-slate-900 dark:text-white' : 'text-indigo-600 dark:text-indigo-400'}`}>{categoryName}</span>
            </div>

            {/* Mobile Compact Text */}
            <div className={`flex sm:hidden font-semibold tracking-wide ${isSticky ? 'text-slate-900 dark:text-white' : 'text-indigo-600 dark:text-indigo-400'}`}>
              Back
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
