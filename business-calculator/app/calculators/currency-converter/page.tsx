'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, RotateCcw, Sparkles, Info, ArrowLeftRight } from 'lucide-react';

const SUPPORTED = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'SGD', 'AED', 'CNY'];
const SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥', AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'د.إ', CNY: '¥' };
const NAMES: Record<string, string> = { USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', INR: 'Indian Rupee', JPY: 'Japanese Yen', AUD: 'Australian Dollar', CAD: 'Canadian Dollar', SGD: 'Singapore Dollar', AED: 'UAE Dirham', CNY: 'Chinese Yuan' };

export default function CurrencyConverter() {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('INR');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 30000); return () => clearInterval(id); }, []);

  const fetchRates = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      if (data.result !== 'success') throw new Error('API error');
      setRates(data.rates); setLastUpdated(new Date());
    } catch { setError('Failed to fetch rates. Using cached data.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  const convert = useCallback((amt: number, f: string, t: string): number => {
    if (!rates[f] || !rates[t]) return 0;
    const inUSD = amt / rates[f];
    return inUSD * rates[t];
  }, [rates]);

  const converted = useMemo(() => convert(Number(amount) || 0, from, to), [convert, amount, from, to]);
  const rate = useMemo(() => convert(1, from, to), [convert, from, to]);

  const relTime = useMemo(() => { void tick; if (!lastUpdated) return 'never'; const s = Math.max(1, Math.floor((Date.now() - lastUpdated.getTime()) / 1000)); if (s < 60) return `${s}s ago`; const m = Math.floor(s / 60); return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`; }, [lastUpdated, tick]);

  const popularPairs = [['USD', 'INR'], ['EUR', 'INR'], ['GBP', 'INR'], ['USD', 'EUR'], ['USD', 'AED']];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 py-10 px-4">
      <div className="max-w-4xl mx-auto mb-8 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-300 text-sm font-medium mb-4"><ArrowLeftRight className="w-4 h-4" /> Live Exchange Rates</motion.div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-extrabold text-white tracking-tight mb-2">Currency <span className="text-sky-400">Converter</span></motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-400 text-lg">Real-time currency conversion with live exchange rates.</motion.p>
      </div>

      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div><h2 className="text-lg font-bold text-white">Converter</h2><p className="text-slate-400 text-sm">Updated: <span className="text-sky-300">{relTime}</span></p></div>
            <button onClick={fetchRates} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Update</button>
          </div>

          {/* Amount Input */}
          <div className="mb-6"><label className="block text-sm font-semibold text-slate-300 mb-2">Amount</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="100" min={0} className="w-full px-5 py-4 text-2xl font-bold rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all" />
          </div>

          {/* From/To/Swap */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">From</label>
              <select value={from} onChange={e => setFrom(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-base font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all">
                {SUPPORTED.map(c => <option key={c} value={c} className="bg-slate-800">{c} — {NAMES[c]}</option>)}
              </select>
            </div>
            <button onClick={() => { setFrom(to); setTo(from); }} className="mt-6 p-3 rounded-2xl bg-sky-600/20 hover:bg-sky-600/40 border border-sky-500/30 text-sky-300 transition-all hover:rotate-180 duration-300">
              <ArrowLeftRight className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">To</label>
              <select value={to} onChange={e => setTo(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-base font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all">
                {SUPPORTED.map(c => <option key={c} value={c} className="bg-slate-800">{c} — {NAMES[c]}</option>)}
              </select>
            </div>
          </div>

          {/* Result */}
          <motion.div key={`${converted}-${from}-${to}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 border border-sky-500/30 rounded-2xl p-6 text-center">
            <p className="text-slate-400 text-sm mb-2">{amount || '0'} {from} =</p>
            <p className="text-4xl font-extrabold text-white">{SYMBOLS[to]}{converted.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</p>
            <p className="text-sky-300 font-semibold text-lg mt-1">{to}</p>
            <div className="mt-3 pt-3 border-t border-white/10 text-slate-400 text-sm">
              <span>1 {from} = <span className="text-sky-300 font-bold">{SYMBOLS[to]}{rate.toLocaleString('en-IN', { maximumFractionDigits: 4 })} {to}</span></span>
              <span className="mx-3">|</span>
              <span>1 {to} = <span className="text-sky-300 font-bold">{SYMBOLS[from]}{(1 / rate).toLocaleString('en-IN', { maximumFractionDigits: 4 })} {from}</span></span>
            </div>
          </motion.div>
          {error && <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm"><Info className="w-4 h-4 shrink-0" /> {error}</div>}
        </motion.div>

        {/* Popular Pairs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
          <h3 className="text-base font-bold text-white mb-4">Popular Conversions {rates['INR'] ? `(${new Date().toLocaleDateString()})` : ''}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {popularPairs.map(([f, t]) => {
              const r = convert(1, f, t);
              return (
                <button key={`${f}-${t}`} onClick={() => { setFrom(f); setTo(t); }} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-sky-500/50 transition-all text-left">
                  <span className="text-white font-semibold text-sm">1 {f}</span>
                  <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-sky-300 font-bold text-sm">{r.toLocaleString('en-IN', { maximumFractionDigits: 2 })} {t}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex items-start gap-3 px-5 py-4 rounded-2xl border-l-4 bg-sky-50/5 border-sky-400 text-sky-200">
          <Sparkles className="w-5 h-5 mt-0.5 shrink-0" /><div><p className="font-semibold text-sm">Smart Tip</p><p className="text-sm mt-0.5 opacity-90">Exchange rates fluctuate constantly. Click Update for the latest rates before making transactions.</p></div>
        </motion.div>
      </div>
    </div>
  );
}
