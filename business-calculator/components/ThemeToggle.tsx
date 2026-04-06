'use client';

import { useTheme } from '@/components/ThemeProvider';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 dark:border-white/10" />;
  }

  const isDark = theme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="w-10 h-10 flex items-center justify-center
        bg-white/10 dark:bg-white/5 
        backdrop-blur-md border border-white/20 dark:border-white/10
        rounded-full text-lg font-semibold
        hover:bg-white/20 dark:hover:bg-white/10
        transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500
        text-gray-800 dark:text-white"
      aria-label="Toggle Theme"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? '☀️' : '🌙'}
    </motion.button>
  );
}
