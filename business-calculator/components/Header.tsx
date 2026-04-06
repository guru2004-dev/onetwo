'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Calculator,
  Menu,
  X,
  Search,
  ChevronDown,
  TrendingUp,
  Building2,
  FileText,
  Receipt,
  ShoppingCart,
  Globe,
  BarChart3,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { getAllCalculators, calculatorCategories } from '@/lib/calculators-data';

// ─── Category icon + color map ───────────────────────────────────────────────
const CATEGORY_META: Record<
  string,
  { icon: React.ReactNode; color: string; glow: string }
> = {
  basic: {
    icon: <Calculator className="w-4 h-4" />,
    color: 'from-violet-500 to-purple-600',
    glow: 'shadow-violet-500/30',
  },
  financial: {
    icon: <TrendingUp className="w-4 h-4" />,
    color: 'from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/30',
  },
  banking: {
    icon: <Building2 className="w-4 h-4" />,
    color: 'from-indigo-500 to-blue-600',
    glow: 'shadow-indigo-500/30',
  },
  accounting: {
    icon: <FileText className="w-4 h-4" />,
    color: 'from-emerald-500 to-teal-500',
    glow: 'shadow-emerald-500/30',
  },
  tax: {
    icon: <Receipt className="w-4 h-4" />,
    color: 'from-orange-500 to-amber-500',
    glow: 'shadow-orange-500/30',
  },
  sales: {
    icon: <ShoppingCart className="w-4 h-4" />,
    color: 'from-pink-500 to-rose-500',
    glow: 'shadow-pink-500/30',
  },
  international: {
    icon: <Globe className="w-4 h-4" />,
    color: 'from-sky-500 to-blue-400',
    glow: 'shadow-sky-500/30',
  },
  analytical: {
    icon: <BarChart3 className="w-4 h-4" />,
    color: 'from-purple-500 to-violet-600',
    glow: 'shadow-purple-500/30',
  },
};

// ─── Framer Motion variants ───────────────────────────────────────────────────
const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const sidebarVariants: Variants = {
  hidden: { x: '-100%', opacity: 0.5 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  exit: {
    x: '-100%',
    opacity: 0.5,
    transition: { type: 'tween', ease: 'easeInOut', duration: 0.25 },
  },
};

const accordionVariants: Variants = {
  hidden: { height: 0, opacity: 0 },
  visible: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
  },
};

const itemVariants: Variants = {
  hidden: { x: -10, opacity: 0 },
  visible: (i: number) => ({
    x: 0,
    opacity: 1,
    transition: { delay: i * 0.04, duration: 0.2, ease: 'easeOut' },
  }),
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Header() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const calculators = getAllCalculators();
  const filteredCalculators = searchQuery
    ? calculators.filter(
        (calc) =>
          calc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          calc.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when sidebar open
  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen]);

  // Escape key closes sidebar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSidebarOpen(false);
        setShowSearchResults(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Click outside search results
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSearchSelect = (path: string) => {
    setSearchQuery('');
    setShowSearchResults(false);
    router.push(path);
  };

  const handleCalcClick = (path: string, id: string) => {
    setActiveItem(id);
    setIsSidebarOpen(false);
    router.push(path);
  };

  const totalCalcs = calculators.length;

  return (
    <>
      {/* ── Top Navbar ─────────────────────────────────────────────────────── */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div
          className="bg-black/20 backdrop-blur-md border border-white/10 rounded-full shadow-2xl"
          style={{ boxShadow: '0 0 30px rgba(139,92,246,0.08)' }}
        >
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            {/* Left: Hamburger + Logo */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-white hover:bg-white/10 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                aria-label="Open navigation menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              <Link href="/" className="flex items-center space-x-2 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-violet-500/40 transition-shadow duration-300">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold hidden sm:inline tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  BusinessCalc
                </span>
              </Link>
            </div>

            {/* Center: Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-1">
              {[
                { label: 'Home', href: '/' },
                { label: 'Calculators', href: '/categories' },
                { label: 'About', href: '/about' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    pathname === item.href
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right: Search (desktop) */}
            <div className="hidden md:flex items-center space-x-3">
              <div ref={searchRef} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  placeholder="Search calculators..."
                  className="w-52 lg:w-64 pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all hover:bg-white/8"
                />

                {/* Search results dropdown */}
                <AnimatePresence>
                  {showSearchResults && searchQuery && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-12 right-0 w-80 bg-[#0d1021]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto z-50"
                      style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(139,92,246,0.1)' }}
                    >
                      {filteredCalculators.length > 0 ? (
                        filteredCalculators.map((calc) => (
                          <button
                            key={calc.id}
                            onClick={() => handleSearchSelect(calc.path)}
                            className="w-full text-left px-4 py-3 hover:bg-violet-500/10 border-b border-white/5 last:border-0 transition-colors group"
                          >
                            <p className="font-medium text-white text-sm group-hover:text-violet-300 transition-colors">{calc.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{calc.description}</p>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-gray-500 text-sm">
                          No calculators found for &ldquo;{searchQuery}&rdquo;
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile right: search icon + hamburger */}
            <div className="md:hidden flex items-center space-x-1">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden overflow-hidden border-t border-white/10 rounded-b-3xl"
              >
                <div className="p-4 space-y-2">
                  <input
                    type="text"
                    placeholder="Search calculators..."
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                  {[
                    { label: 'Home', href: '/' },
                    { label: 'All Calculators', href: '/categories' },
                    { label: 'About', href: '/about' },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-sm font-medium"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ── Overlay ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            key="overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Premium Sidebar ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            key="sidebar"
            ref={sidebarRef}
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-0 left-0 h-full z-50 flex flex-col"
            style={{
              width: '300px',
              background: 'rgba(10, 15, 30, 0.92)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRight: '1px solid rgba(139,92,246,0.2)',
              borderTopRightRadius: '1rem',
              borderBottomRightRadius: '1rem',
              boxShadow:
                '4px 0 40px rgba(0,0,0,0.6), 0 0 60px rgba(139,92,246,0.15), inset 0 0 1px rgba(255,255,255,0.05)',
            }}
            role="dialog"
            aria-label="Navigation sidebar"
            aria-modal="true"
          >
            {/* Neon border glow strip */}
            <div
              className="absolute top-0 left-0 w-[2px] h-full rounded-l-2xl pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, transparent, rgba(139,92,246,0.8), rgba(59,130,246,0.8), transparent)',
                filter: 'blur(2px)',
              }}
            />

            {/* ── Sidebar Header ───────────────────────────────────────────── */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
              style={{ borderColor: 'rgba(139,92,246,0.15)' }}
            >
              <Link
                href="/"
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center space-x-3 group"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                    boxShadow: '0 0 20px rgba(124,58,237,0.4)',
                  }}
                >
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p
                    className="text-base font-bold leading-tight tracking-tight"
                    style={{
                      background: 'linear-gradient(90deg, #fff, #a78bfa)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    BusinessCalc
                  </p>
                  <p className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">
                    Pro Suite
                  </p>
                </div>
              </Link>

              <button
                onClick={() => setIsSidebarOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 hover:scale-110 focus:outline-none"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Sidebar Search ───────────────────────────────────────────── */}
            <div className="px-4 py-3 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  placeholder="Quick search..."
                  className="w-full pl-8 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/30 transition-all"
                />
              </div>

              {/* Inline search results */}
              <AnimatePresence>
                {showSearchResults && searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 rounded-xl overflow-hidden border border-white/10"
                    style={{ background: 'rgba(15,20,40,0.95)' }}
                  >
                    {filteredCalculators.length > 0 ? (
                      filteredCalculators.slice(0, 6).map((calc) => (
                        <button
                          key={calc.id}
                          onClick={() => handleCalcClick(calc.path, calc.id)}
                          className="w-full text-left px-3 py-2.5 hover:bg-violet-500/15 border-b border-white/5 last:border-0 transition-colors"
                        >
                          <p className="text-sm font-medium text-gray-200">{calc.name}</p>
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 px-3 py-3 text-center">No results found</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Category List (Accordion) ────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {calculatorCategories.map((category, catIndex) => {
                const meta = CATEGORY_META[category.id] ?? CATEGORY_META.basic;
                const isExpanded = expandedCategories.includes(category.id);
                const count = category.calculators.length;

                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: catIndex * 0.05, duration: 0.25 }}
                  >
                    {/* Category header button */}
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group hover:bg-white/5"
                      style={
                        isExpanded
                          ? {
                              background: 'rgba(139,92,246,0.08)',
                              borderLeft: '2px solid rgba(139,92,246,0.6)',
                            }
                          : {}
                      }
                      aria-expanded={isExpanded}
                    >
                      <div className="flex items-center space-x-3">
                        {/* Icon pill */}
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br ${meta.color} text-white shadow-md ${meta.glow} transition-all duration-200 group-hover:scale-110`}
                        >
                          {meta.icon}
                        </div>

                        <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">
                          {category.name}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Count badge */}
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(139,92,246,0.2)',
                            color: '#a78bfa',
                            border: '1px solid rgba(139,92,246,0.3)',
                          }}
                        >
                          {count}
                        </span>

                        {/* Chevron */}
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 transition-colors" />
                        </motion.div>
                      </div>
                    </button>

                    {/* Accordion sub-items */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          variants={accordionVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="overflow-hidden"
                        >
                          <div className="ml-4 mt-1 space-y-0.5 pb-1 pl-3 border-l border-white/8">
                            {category.calculators.map((calc, i) => {
                              const isActive =
                                pathname === calc.path || activeItem === calc.id;

                              return (
                                <motion.button
                                  key={calc.id}
                                  custom={i}
                                  variants={itemVariants}
                                  initial="hidden"
                                  animate="visible"
                                  onClick={() => handleCalcClick(calc.path, calc.id)}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 group/item flex items-center justify-between ${
                                    isActive
                                      ? 'text-white'
                                      : 'text-gray-400 hover:text-gray-200'
                                  }`}
                                  style={
                                    isActive
                                      ? {
                                          background:
                                            'linear-gradient(90deg, rgba(139,92,246,0.25), rgba(59,130,246,0.12))',
                                          boxShadow: '0 0 12px rgba(139,92,246,0.15)',
                                        }
                                      : {}
                                  }
                                  whileHover={{ x: 3, scale: 1.01 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <span className="leading-snug">{calc.name}</span>
                                  {isActive && (
                                    <Zap className="w-3 h-3 text-violet-400 flex-shrink-0" />
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* ── Sidebar Footer ───────────────────────────────────────────── */}
            <div
              className="flex-shrink-0 px-5 py-4 border-t"
              style={{
                borderColor: 'rgba(139,92,246,0.15)',
                background: 'rgba(139,92,246,0.04)',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">
                    <span className="text-violet-400 font-bold">{totalCalcs}</span> calculators available
                  </p>
                </div>
                <Link
                  href="/categories"
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex items-center space-x-1 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors group/footer"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3 group-hover/footer:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {/* Neon underline bar */}
              <div
                className="mt-3 h-[1px] w-full rounded-full"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(139,92,246,0.6), rgba(59,130,246,0.6), transparent)',
                }}
              />
              <p className="text-center text-[10px] text-gray-600 mt-2 tracking-widest uppercase">
                BusinessCalc Pro Suite
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
