'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Calculator as CalcIcon, TrendingUp, Sparkles, Building2, Globe, FileText, Receipt, ShoppingCart, BarChart3, Zap, Brain } from 'lucide-react';
import ExpandableCategoryCard from '@/components/ExpandableCategoryCard';
import { OPEN_CHAT_EVENT } from '@/components/ChatCalcAI';
import { calculatorCategories } from '@/lib/calculators-data';
import { motion } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';

export default function Home() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <main className={`min-h-screen overflow-hidden selection:bg-purple-500/30 transition-colors duration-300
      ${isDarkMode 
        ? 'bg-[#0a0a0a]' 
        : 'bg-[#F8FAFC]'
      }`}
    >
      {/* Hero Section - Adaptive to Theme */}
      <section className={`relative h-screen w-full flex items-center justify-center overflow-hidden transition-colors duration-300
        ${isDarkMode ? 'bg-[#0a0a0a]' : 'bg-white'}`}
      >
        {/* Light Mode: Video Background */}
        {!isDarkMode && (
          <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover blur-[1px] brightness-90 contrast-110 z-0"
            >
              <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/20 to-white/30 z-10" />
          </div>
        )}

        {/* Dark Mode: Video Background */}
        {isDarkMode && (
          <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover z-0"
            >
              <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260308_114720_3dabeb9e-2c39-4907-b747-bc3544e2d5b7.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/60 z-10" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a] z-10" />
          </div>
        )}

        {/* Animated Glow Blobs - Dark Mode Only */}
        {isDarkMode && (
          <>
            <motion.div 
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[120px] z-10 pointer-events-none"
            />
            <motion.div 
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[150px] z-10 pointer-events-none"
            />
          </>
        )}

        {/* Hero Content - Adaptive Typography */}
        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto mt-20">
          <div className="transition-all duration-500 rounded-3xl p-8 md:p-14">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className={`text-5xl md:text-7xl lg:text-8xl font-serif font-extrabold tracking-tight mb-8 drop-shadow-md
                ${isDarkMode 
                  ? 'text-white' 
                  : 'text-slate-700'
                }`}
              >
                Advanced <span className={`text-transparent bg-clip-text drop-shadow-sm
                  ${isDarkMode 
                    ? 'bg-gradient-to-r from-purple-400 to-indigo-400' 
                    : 'bg-gradient-to-r from-purple-600 to-blue-600'
                  }`}
                >
                  AI Business
                </span> Intelligence Calculator
              </h1>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <p className={`text-lg md:text-2xl mb-12 mt-6 max-w-2xl mx-auto font-medium tracking-wide leading-relaxed drop-shadow-sm
                ${isDarkMode 
                  ? 'text-gray-300' 
                  : 'text-slate-500'
                }`}
              >
                Fast, accurate, and easy-to-use calculators for business, finance, banking, accounting, taxes, and more.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row justify-center gap-6"
            >
              <Link
                href="/categories"
                className={`px-8 py-4 rounded-full font-semibold hover:-translate-y-1 transition-all duration-300 shadow-lg
                  ${isDarkMode
                    ? 'bg-white text-black hover:bg-gray-100'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 hover:shadow-purple-500/30'
                  }`}
              >
                Browse All Calculators
              </Link>
              <button
                onClick={() => window.dispatchEvent(new Event(OPEN_CHAT_EVENT))}
                className={`px-8 py-4 backdrop-blur-md rounded-full font-semibold hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 group shadow-sm
                ${isDarkMode
                  ? 'bg-white/5 text-white border border-white/20 hover:bg-white/10'
                  : 'bg-white/90 text-[#0F172A] border border-white/50 hover:bg-white hover:shadow-xl'
                }`}
              >
                <Sparkles className={`w-5 h-5 group-hover:animate-pulse
                  ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}
                />
                Try Chat Calc AI
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t
        ${isDarkMode ? 'border-white/5 bg-[#0a0a0a]' : 'border-[#E2E8F0] bg-[#F8FAFC]'}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8">
          {[
            { icon: Zap, title: 'Fast & Accurate', desc: 'Get instant results with precision calculations tailored for enterprise use.' },
            { icon: Brain, title: 'Easy to Use', desc: 'Simple, intuitive interface designed to reduce cognitive load.' },
            { icon: Sparkles, title: 'AI Powered', desc: 'Chat Calc AI intuitively helps you understand and execute complex formulas.' }
          ].map((feature, idx) => (
             <motion.div
               key={idx}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.5, delay: idx * 0.2 }}
               className="flex flex-col items-center text-center group"
             >
               <div className={`p-4 rounded-2xl border mb-6 group-hover:border-purple-500/50 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all duration-500
                 ${isDarkMode 
                   ? 'bg-white/5 border-white/10'
                   : 'bg-purple-50 border-purple-200'
                 }`}
               >
                 <feature.icon className={`w-8 h-8 transition-colors
                   ${isDarkMode 
                     ? 'text-gray-300 group-hover:text-purple-400'
                     : 'text-purple-600 group-hover:text-purple-700'
                   }`}
                 />
               </div>
               <h3 className={`text-xl font-bold mb-3 tracking-wide
                 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}
               >
                 {feature.title}
               </h3>
               <p className={`leading-relaxed max-w-xs
                 ${isDarkMode ? 'text-gray-400' : 'text-[#64748B]'}`}
               >
                 {feature.desc}
               </p>
             </motion.div>
          ))}
        </div>
      </section>

      {/* Calculator Categories - Expandable Section */}
      <section className={`relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t
        ${isDarkMode ? 'border-white/5' : 'border-[#E2E8F0]'}`}
      >
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className={`text-4xl md:text-5xl font-bold mb-6 tracking-tight
            ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}
          >
            Calculator Categories
          </h2>
          <p className={`text-xl max-w-2xl mx-auto font-light
            ${isDarkMode ? 'text-gray-400' : 'text-[#64748B]'}`}
          >
            Browse and explore all our sophisticated tools by category
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {calculatorCategories.map((category, idx) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <ExpandableCategoryCard
                id={category.id}
                name={category.name}
                description={category.description}
                icon={category.icon}
                calculators={category.calculators}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className={`relative z-20 border-t py-16 transition-colors duration-300
        ${isDarkMode 
          ? 'bg-[#050505] border-white/10 text-gray-300'
          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <CalcIcon className={`w-6 h-6
                  ${isDarkMode ? 'text-white' : 'text-purple-600'}`}
                />
                <span className={`text-lg font-bold tracking-tight
                  ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}
                >
                  BusinessCalc
                </span>
              </div>
              <p className={`text-sm leading-relaxed pr-4
                ${isDarkMode ? 'text-gray-500' : 'text-[#64748B]'}`}
              >
                Your one-stop enterprise solution for all business, financial, and analytical calculations.
              </p>
            </div>
            <div>
              <h4 className={`font-semibold mb-6 tracking-wide text-sm uppercase
                ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}
              >
                Quick Links
              </h4>
              <ul className={`space-y-3 text-sm
                ${isDarkMode ? 'text-gray-500' : 'text-[#64748B]'}`}
              >
                <li><Link href="/" className={`transition-colors
                  ${isDarkMode 
                    ? 'hover:text-white' 
                    : 'hover:text-[#0F172A]'
                  }`}
                >
                  Home
                </Link></li>
                <li><Link href="/categories" className={`transition-colors
                  ${isDarkMode 
                    ? 'hover:text-white' 
                    : 'hover:text-[#0F172A]'
                  }`}
                >
                  All Calculators
                </Link></li>
                <li><Link href="/about" className={`transition-colors
                  ${isDarkMode 
                    ? 'hover:text-white' 
                    : 'hover:text-[#0F172A]'
                  }`}
                >
                  About
                </Link></li>
              </ul>
            </div>
            <div>
              <h4 className={`font-semibold mb-6 tracking-wide text-sm uppercase
                ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}
              >
                Popular Tools
              </h4>
              <ul className={`space-y-3 text-sm
                ${isDarkMode ? 'text-gray-500' : 'text-[#64748B]'}`}
              >
                <li><Link href="/category/financial" className={`transition-colors
                  ${isDarkMode 
                    ? 'hover:text-white' 
                    : 'hover:text-[#0F172A]'
                  }`}
                >
                  Financial
                </Link></li>
                <li><Link href="/category/banking" className={`transition-colors
                  ${isDarkMode 
                    ? 'hover:text-white' 
                    : 'hover:text-[#0F172A]'
                  }`}
                >
                  Banking
                </Link></li>
                <li><Link href="/category/tax" className={`transition-colors
                  ${isDarkMode 
                    ? 'hover:text-white' 
                    : 'hover:text-[#0F172A]'
                  }`}
                >
                  Tax
                </Link></li>
              </ul>
            </div>
            <div>
              <h4 className={`font-semibold mb-6 tracking-wide text-sm uppercase
                ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}
              >
                Contact
              </h4>
              <p className={`text-sm leading-relaxed mb-6
                ${isDarkMode ? 'text-gray-500' : 'text-[#64748B]'}`}
              >
                Have questions or need enterprise integration? Reach out to us.
              </p>
              <button className={`px-5 py-2 rounded-full border text-sm transition-all
                ${isDarkMode
                  ? 'border-white/20 text-white hover:bg-white hover:text-black'
                  : 'border-[#E2E8F0] text-[#0F172A] hover:bg-white'
                }`}
              >
                Get in Touch
              </button>
            </div>
          </div>
          <div className={`border-t mt-16 pt-8 text-center text-sm flex flex-col md:flex-row items-center justify-between transition-colors duration-300
            ${isDarkMode 
              ? 'border-white/10 text-gray-600' 
              : 'border-[#E2E8F0] text-[#94A3B8]'
            }`}
          >
            <p>© 2026 BusinessCalc AI. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
               <a href="#" className={`transition-colors
                 ${isDarkMode 
                   ? 'hover:text-white' 
                   : 'hover:text-[#0F172A]'
                 }`}
               >
                 Privacy
               </a>
               <a href="#" className={`transition-colors
                 ${isDarkMode 
                   ? 'hover:text-white' 
                   : 'hover:text-[#0F172A]'
                 }`}
               >
                 Terms
               </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
