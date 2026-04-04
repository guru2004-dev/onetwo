'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10" />;
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative p-2 rounded-full overflow-hidden transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500
                 bg-white/90 dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none hover:bg-gray-50 dark:hover:bg-white/10 group"
      aria-label="Toggle Theme"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ y: -20, opacity: 0, rotate: -90 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: 20, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
              className="absolute"
            >
              <Moon className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ y: -20, opacity: 0, rotate: -90 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: 20, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
              className="absolute"
            >
              <Sun className="w-5 h-5 text-amber-500 group-hover:text-amber-600" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </button>
  );
}
