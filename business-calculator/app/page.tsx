'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Calculator as CalcIcon, TrendingUp, Sparkles, Building2, Globe, FileText, Receipt, ShoppingCart, BarChart3, Zap, Brain } from 'lucide-react';
import ExpandableCategoryCard from '@/components/ExpandableCategoryCard';
import { calculatorCategories } from '@/lib/calculators-data';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] overflow-hidden selection:bg-indigo-500/30">
      {/* Hero Section */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 w-full h-full z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260308_114720_3dabeb9e-2c39-4907-b747-bc3544e2d5b7.mp4" type="video/mp4" />
          </video>
        </div>
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-black/70 z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50 dark:to-[#0a0a0a] z-10 transition-colors" />
        
        {/* Animated Glow Blobs */}
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[120px] z-10"
        />
        <motion.div 
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[150px] z-10"
        />

        {/* Hero Content */}
        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto mt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white tracking-tight mb-8 drop-shadow-2xl">
              Advanced <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">AI Business</span> Intelligence
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <p className="text-lg md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
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
              className="px-8 py-4 bg-white text-black rounded-full font-semibold hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.3)]"
            >
              Browse All Calculators
            </Link>
            <button className="px-8 py-4 bg-white/5 backdrop-blur-md text-white border border-white/20 rounded-full font-semibold hover:bg-white/10 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 group">
              <Sparkles className="w-5 h-5 text-purple-400 group-hover:animate-pulse" />
              Try Chat Calc AI
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-gray-200 dark:border-white/5">
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
               <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 mb-6 group-hover:border-indigo-400 dark:group-hover:border-purple-500/50 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] dark:group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all duration-500 shadow-sm dark:shadow-none">
                 <feature.icon className="w-8 h-8 text-slate-400 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-purple-400 transition-colors" />
               </div>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 tracking-wide">{feature.title}</h3>
               <p className="text-slate-600 dark:text-gray-400 leading-relaxed max-w-xs">{feature.desc}</p>
             </motion.div>
          ))}
        </div>
      </section>

      {/* Calculator Categories - Expandable Section */}
      <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-gray-200 dark:border-white/5">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Calculator Categories</h2>
          <p className="text-xl text-slate-600 dark:text-gray-400 max-w-2xl mx-auto font-light">
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
      <footer className="relative z-20 bg-gray-100 dark:bg-[#050505] border-t border-gray-200 dark:border-white/10 text-slate-600 dark:text-gray-300 py-16 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <CalcIcon className="w-6 h-6 text-indigo-600 dark:text-white" />
                <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">BusinessCalc</span>
              </div>
              <p className="text-slate-500 dark:text-gray-500 text-sm leading-relaxed pr-4">
                Your one-stop enterprise solution for all business, financial, and analytical calculations.
              </p>
            </div>
            <div>
              <h4 className="text-slate-900 dark:text-white font-semibold mb-6 tracking-wide text-sm uppercase">Quick Links</h4>
              <ul className="space-y-3 text-sm text-slate-500 dark:text-gray-500">
                <li><Link href="/" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/categories" className="hover:text-indigo-600 dark:hover:text-white transition-colors">All Calculators</Link></li>
                <li><Link href="/about" className="hover:text-indigo-600 dark:hover:text-white transition-colors">About</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-900 dark:text-white font-semibold mb-6 tracking-wide text-sm uppercase">Popular Tools</h4>
              <ul className="space-y-3 text-sm text-slate-500 dark:text-gray-500">
                <li><Link href="/category/financial" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Financial</Link></li>
                <li><Link href="/category/banking" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Banking</Link></li>
                <li><Link href="/category/tax" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Tax</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-900 dark:text-white font-semibold mb-6 tracking-wide text-sm uppercase">Contact</h4>
              <p className="text-sm text-slate-500 dark:text-gray-500 leading-relaxed mb-6">
                Have questions or need enterprise integration? Reach out to us.
              </p>
              <button className="px-5 py-2 rounded-full border border-gray-300 dark:border-white/20 text-sm text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white dark:hover:text-black transition-all font-medium">
                Get in Touch
              </button>
            </div>
          </div>
          <div className="border-t border-gray-300 dark:border-white/10 mt-16 pt-8 text-center text-sm text-slate-500 dark:text-gray-600 flex flex-col md:flex-row items-center justify-between">
            <p>© 2026 BusinessCalc AI. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
               <a href="#" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Privacy</a>
               <a href="#" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
