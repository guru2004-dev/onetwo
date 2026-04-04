'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  RotateCcw,
  Activity,
  AlertTriangle,
  CheckCircle,
  Info,
  CreditCard,
  History
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext'; // Using context for consistent UI, though currency amounts might not be strictly needed, some boundaries could use it.
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ReferenceLine
} from 'recharts';

export default function CreditScoreSimulator() {
  // Using context just to match rest of app, though credit scores are mostly currency-agnostic internally
  const { availableCurrencies, lastUpdatedTime } = useCurrency();

  // Current Credit Profile Inputs
  const [currentScore, setCurrentScore] = useState('650');
  const [paymentHistory, setPaymentHistory] = useState('95'); // % of on-time payments
  const [creditUtilization, setCreditUtilization] = useState('45'); // %
  const [creditAge, setCreditAge] = useState('3'); // years
  const [totalAccounts, setTotalAccounts] = useState('4');
  const [hardInquiries, setHardInquiries] = useState('3');

  // Simulation Actions
  const [simPayDownDebt, setSimPayDownDebt] = useState('0'); // % to reduce utilization by
  const [simMissPayment, setSimMissPayment] = useState(false);
  const [simOpenAccount, setSimOpenAccount] = useState(false);
  const [simCloseAccount, setSimCloseAccount] = useState(false);
  const [simAgeIncrease, setSimAgeIncrease] = useState('1'); // years to wait

  // Results
  const [results, setResults] = useState<{
    newScore: number;
    scoreChange: number;
    factors: {
      paymentHistoryImpact: number;
      utilizationImpact: number;
      ageImpact: number;
      mixImpact: number;
      inquiryImpact: number;
    }
  } | null>(null);

  const [error, setError] = useState('');

  const calculate = useCallback(() => {
    setError('');

    const score = Number(currentScore);
    const hist = Number(paymentHistory);
    const util = Number(creditUtilization);
    const age = Number(creditAge);
    const accounts = Number(totalAccounts);
    const inq = Number(hardInquiries);

    if (isNaN(score) || score < 300 || score > 850) {
      setError('Base score must be realistically between 300 and 850.');
      return setResults(null);
    }
    
    // Simulate impacts (Rough FICO approximations)
    let newScore = score;
    let paymentImpact = 0;
    let utilImpact = 0;
    let ageImpact = 0;
    let mixImpact = 0;
    let inqImpact = 0;

    // Simulation: Pay Down Debt (Utilization)
    const utilizationReduction = Number(simPayDownDebt) || 0;
    if (utilizationReduction > 0) {
      const newUtil = Math.max(0, util - utilizationReduction);
      // Rough rule: Every 10% drop under 30% adds points. Dropping from high util to low is big.
      if (util > 30 && newUtil <= 30) utilImpact += 30;
      else if (util > 10 && newUtil <= 10) utilImpact += 15;
      else if (util > 50 && newUtil < 50) utilImpact += 20;
      else utilImpact += Math.floor(utilizationReduction / 5);
      
      newScore += utilImpact;
    }

    // Simulation: Miss a payment
    if (simMissPayment) {
      // Missing a payment drops score drastically, more so if score is high
      paymentImpact = score > 750 ? -80 : score > 650 ? -50 : -30;
      newScore += paymentImpact;
    }

    // Simulation: Open new account
    if (simOpenAccount) {
      // Hard inquiry drop + lowered average age
      inqImpact -= 5;
      ageImpact -= 10;
      newScore += inqImpact + ageImpact;
    }

    // Simulation: Close an account
    if (simCloseAccount) {
      // Might hurt utilization (if it had a limit), might hurt mix. Modest drop.
      utilImpact -= 10; // Assume utilization ratio worsens
      newScore += utilImpact;
    }

    // Simulation: Aging
    const ageBonus = Number(simAgeIncrease) || 0;
    if (ageBonus > 0 && !simMissPayment) {
      // Good behavior over time adds points steadily
      ageImpact += ageBonus * 5; 
      paymentImpact += ageBonus * 2; // Dilutes bad history slightly
      newScore += (ageBonus * 5) + (ageBonus * 2);
    }

    // Cap
    if (newScore > 850) newScore = 850;
    if (newScore < 300) newScore = 300;

    setResults({
      newScore: Math.round(newScore),
      scoreChange: Math.round(newScore - score),
      factors: {
        paymentHistoryImpact: paymentImpact,
        utilizationImpact: utilImpact,
        ageImpact,
        mixImpact,
        inquiryImpact: inqImpact
      }
    });

  }, [currentScore, paymentHistory, creditUtilization, creditAge, totalAccounts, hardInquiries, simPayDownDebt, simMissPayment, simOpenAccount, simCloseAccount, simAgeIncrease]);

  useEffect(() => {
    calculate();
  }, [calculate, lastUpdatedTime]);

  const handleReset = () => {
    setCurrentScore('650');
    setPaymentHistory('95');
    setCreditUtilization('45');
    setCreditAge('3');
    setTotalAccounts('4');
    setHardInquiries('3');
    
    setSimPayDownDebt('0');
    setSimMissPayment(false);
    setSimOpenAccount(false);
    setSimCloseAccount(false);
    setSimAgeIncrease('1');
    setError('');
  };

  const getInsight = () => {
    if (!results) return null;
    if (results.newScore >= 740) return { text: "Excellent Credit Tier. You will qualify for the best interest rates.", type: "success" };
    if (results.newScore >= 670) return { text: "Good Credit Tier. You have solid approval odds, but rates may vary.", type: "info" };
    if (results.newScore >= 580) return { text: "Fair Credit Tier. Approvals are possible but likely come with higher interest rates.", type: "warning" };
    return { text: "Poor Credit Tier. Focus heavily on on-time payments and paying down balances to rebuild.", type: "warning" };
  };

  const insight = getInsight();
  const insightStyle = {
    warning: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
  };
  const InsightIcon = insight ? { warning: AlertTriangle, success: CheckCircle, info: Info }[insight.type as keyof typeof insightStyle] : Info;

  const barData = results ? [
    { name: 'Current', Score: Number(currentScore) },
    { name: 'Simulated', Score: results.newScore }
  ] : [];

  // FICO rough breakdown
  const pieData = [
    { name: 'Payment History', value: 35 },
    { name: 'Amounts Owed (Utilization)', value: 30 },
    { name: 'Length of History', value: 15 },
    { name: 'Credit Mix', value: 10 },
    { name: 'New Credit (Inquiries)', value: 10 }
  ];

  const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

  const getScoreColor = (score: number) => {
    if (score >= 740) return 'text-emerald-400';
    if (score >= 670) return 'text-blue-400';
    if (score >= 580) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 740) return 'bg-emerald-500';
    if (score >= 670) return 'bg-blue-500';
    if (score >= 580) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-sm font-medium mb-4">
          <Activity className="w-4 h-4" />
          Financial Identity
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
          Credit Score <span className="text-cyan-400">Simulator</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Estimate how different financial decisions impact your creditworthiness.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT — INPUTS */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Current Profile</h2>
              <p className="text-slate-400 text-sm">Baseline metrics</p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] text-slate-300 mb-1">Current Score (300-850)</label>
              <input type="number" min={300} max={850} value={currentScore} onChange={e => setCurrentScore(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-semibold" />
            </div>
            <div>
              <label className="block text-[13px] text-slate-300 mb-1">Credit Utilization (%)</label>
              <div className="relative">
                <input type="number" min={0} max={100} value={creditUtilization} onChange={e => setCreditUtilization(e.target.value)} className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-semibold" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
              </div>
            </div>
            <div>
              <label className="block text-[13px] text-slate-300 mb-1">Avg. Age of Accounts (Yrs)</label>
              <input type="number" min={0} max={50} value={creditAge} onChange={e => setCreditAge(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-semibold" />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2 pb-2">
              <History className="w-4 h-4"/> Simulation Sandbox
            </h3>
            
            <div className="space-y-4 bg-slate-900/40 border border-white/5 rounded-xl p-4">
              
              <div>
                <label className="text-[13px] text-slate-300 block mb-2">Reduce Credit Utilization By:</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="0" max={creditUtilization} value={simPayDownDebt} onChange={(e) => setSimPayDownDebt(e.target.value)} className="flex-1 accent-cyan-500" />
                  <span className="text-white font-bold w-12 text-right">{simPayDownDebt}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <span className="text-[13px] text-slate-300">Miss a payment?</span>
                <button onClick={() => setSimMissPayment(!simMissPayment)} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${simMissPayment ? 'bg-rose-500 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}>
                  {simMissPayment ? 'Yes' : 'No'}
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <span className="text-[13px] text-slate-300">Open a new credit card?</span>
                <button onClick={() => setSimOpenAccount(!simOpenAccount)} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${simOpenAccount ? 'bg-amber-500 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}>
                  {simOpenAccount ? 'Yes' : 'No'}
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-3 mb-2">
                <span className="text-[13px] text-slate-300">Fast forward time without misses:</span>
                <select value={simAgeIncrease} onChange={e => setSimAgeIncrease(e.target.value)} className="bg-slate-800 text-white border border-white/10 rounded-md px-2 py-1 text-xs outline-none">
                  <option value="0">0 Years</option>
                  <option value="1">1 Year</option>
                  <option value="3">3 Years</option>
                  <option value="5">5 Years</option>
                </select>
              </div>

            </div>
          </div>

          <div className="mt-auto bg-slate-900/40 border border-white/5 rounded-xl p-4 text-xs text-slate-400">
            * Note: These are rough approximations based on standard FICO scoring logic. Actual scores vary heavily based on specific credit bureau models.
          </div>

          {error && (
            <div className="flex items-start gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm mt-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

        </div>

        {/* RIGHT — RESULTS */}
        <div className="flex flex-col gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">Projection Engine</h2>
              </div>
            </div>

            {results ? (
              <div className="flex flex-col flex-1">
                <div className="border rounded-2xl p-5 mb-5 text-center bg-gradient-to-r from-slate-900 to-slate-800 border-white/10">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-slate-400">
                    Simulated Score
                  </p>
                  <p className={`text-6xl font-extrabold tracking-tight mb-2 ${getScoreColor(results.newScore)}`}>
                    {results.newScore}
                  </p>
                  <div className="inline-flex items-center justify-center bg-black/20 rounded-full px-4 py-1.5 text-sm border border-white/5 mt-2">
                    <span className="text-slate-300 font-semibold mr-2">Impact:</span>
                    <span className={results.scoreChange >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {results.scoreChange >= 0 ? '+' : ''}{results.scoreChange} Pts
                    </span>
                  </div>
                  
                  {/* Visual gauge */}
                  <div className="w-full h-2 bg-slate-900 rounded-full mt-6 flex overflow-hidden border border-white/5">
                    <div className="h-full bg-rose-500" style={{ width: '28%' }}></div>    {/* 300-579 */}
                    <div className="h-full bg-amber-500" style={{ width: '16%' }}></div>   {/* 580-669 */}
                    <div className="h-full bg-blue-500" style={{ width: '13%' }}></div>    {/* 670-739 */}
                    <div className="h-full bg-emerald-500" style={{ width: '20%' }}></div> {/* 740-850 */}
                  </div>
                  <div className="relative w-full h-4 mt-1">
                    <div className="absolute top-0 w-2 h-2 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] -ml-1 transition-all duration-700" style={{ left: `${((results.newScore - 300) / 550) * 100}%` }}></div>
                  </div>
                </div>

                <div className="border border-white/5 rounded-xl overflow-hidden mb-5">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-slate-400 font-semibold text-[10px] uppercase border-b border-white/10">
                      <tr>
                        <th className="px-4 py-2">Action / Factor Impact</th>
                        <th className="px-4 py-2 text-right">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300 text-sm shadow-inner">
                      {results.factors.utilizationImpact !== 0 && (
                        <tr className="bg-white/[0.02]">
                          <td className="px-4 py-3">Paying Down Debt</td>
                          <td className={`px-4 py-3 text-right font-bold ${results.factors.utilizationImpact > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{results.factors.utilizationImpact > 0 ? '+' : ''}{results.factors.utilizationImpact}</td>
                        </tr>
                      )}
                      {results.factors.paymentHistoryImpact !== 0 && (
                        <tr className="bg-white/[0.02]">
                          <td className="px-4 py-3">Missed Payment / Payment Hist</td>
                          <td className={`px-4 py-3 text-right font-bold ${results.factors.paymentHistoryImpact > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{results.factors.paymentHistoryImpact > 0 ? '+' : ''}{results.factors.paymentHistoryImpact}</td>
                        </tr>
                      )}
                      {results.factors.inquiryImpact !== 0 && (
                        <tr className="bg-white/[0.02]">
                          <td className="px-4 py-3">New Accounts / Inquiries</td>
                          <td className={`px-4 py-3 text-right font-bold ${results.factors.inquiryImpact > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{results.factors.inquiryImpact > 0 ? '+' : ''}{results.factors.inquiryImpact}</td>
                        </tr>
                      )}
                       {results.factors.ageImpact !== 0 && (
                        <tr className="bg-white/[0.02]">
                          <td className="px-4 py-3">Age of Credit Shift</td>
                          <td className={`px-4 py-3 text-right font-bold ${results.factors.ageImpact > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{results.factors.ageImpact > 0 ? '+' : ''}{results.factors.ageImpact}</td>
                        </tr>
                      )}
                      {results.scoreChange === 0 && (
                        <tr className="bg-white/[0.02]">
                          <td className="px-4 py-3 text-slate-500 italic">No significant changes simulated.</td>
                          <td className="px-4 py-3 text-right text-slate-500">0</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {insight && (
                  <div className={`mt-auto flex items-start gap-3 px-4 py-3 rounded-2xl border-l-4 ${insightStyle[insight.type as keyof typeof insightStyle]}`}>
                    <InsightIcon className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-xs">Insight</p>
                      <p className="text-xs mt-0.5 opacity-90">{insight.text}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3 bg-slate-900/40 rounded-xl border border-white/5 flex-1">
                <Activity className="w-10 h-10 opacity-30" />
                <p className="text-sm">Run a simulation to see results.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CHARTS SECTION */}
      {results && (
        <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-6">Before & After Setup</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis type="number" domain={[300, 850]} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '13px' }}
                  />
                  <ReferenceLine y={670} stroke="#3b82f6" strokeDasharray="3 3" label={{ position: 'top', value: 'Good Threshold (670)', fill: '#3b82f6', fontSize: 10 }} />
                  <Bar dataKey="Score" radius={[4, 4, 0, 0]} maxBarSize={100}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#64748b' : getScoreBgColor(entry.Score)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col">
            <h3 className="text-base font-bold text-white mb-2">FICO Calculation Weights</h3>
            <div className="flex-1 min-h-[250px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                    formatter={(value: number) => [`${value}%`, 'Weight']}
                  />
                  <Legend verticalAlign="bottom" height={45} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
