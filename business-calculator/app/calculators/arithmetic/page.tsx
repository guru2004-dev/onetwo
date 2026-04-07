'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  Calculator,
  AlertTriangle,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function ArithmeticCalculator() {
  // Inputs
  const [number1, setNumber1] = useState('10');
  const [number2, setNumber2] = useState('5');
  const [operation, setOperation] = useState('add');

  // Results
  const [results, setResults] = useState<{
    result: number;
    equation: string;
  } | null>(null);

  const [error, setError] = useState('');

  const getOperationSymbol = (op: string) => {
    switch(op) {
      case 'add': return '+';
      case 'subtract': return '-';
      case 'multiply': return '×';
      case 'divide': return '÷';
      case 'power': return '^';
      case 'modulo': return '%';
      default: return '';
    }
  };

  const calculate = useCallback(() => {
    setError('');

    const n1 = parseFloat(number1);
    const n2 = parseFloat(number2);

    if (isNaN(n1) || isNaN(n2)) {
      setError('Please enter valid numbers for both fields.');
      return setResults(null);
    }

    let rawResult = 0;

    switch (operation) {
      case 'add':
        rawResult = n1 + n2;
        break;
      case 'subtract':
        rawResult = n1 - n2;
        break;
      case 'multiply':
        rawResult = n1 * n2;
        break;
      case 'divide':
        if (n2 === 0) {
          setError('Cannot divide by zero.');
          return setResults(null);
        }
        rawResult = n1 / n2;
        break;
      case 'power':
        rawResult = Math.pow(n1, n2);
        break;
      case 'modulo':
        if (n2 === 0) {
          setError('Cannot modulo by zero.');
          return setResults(null);
        }
        rawResult = n1 % n2;
        break;
    }

    const eq = `${n1} ${getOperationSymbol(operation)} ${n2} = ${Number(rawResult.toPrecision(10))}`;

    setResults({
      result: rawResult,
      equation: eq
    });
  }, [number1, number2, operation]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  const handleReset = () => {
    setNumber1('10');
    setNumber2('5');
    setOperation('add');
    setError('');
  };

  const barData = results && !isNaN(results.result) && isFinite(results.result) ? [
    { name: 'Input 1', value: Number(number1) },
    { name: 'Input 2', value: Number(number2) },
    { name: 'Result', value: results.result }
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-indigo-100 dark:to-indigo-950 py-10 px-4">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium mb-4">
          <Calculator className="w-4 h-4" />
          Basic Operations
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
          Arithmetic <span className="text-blue-400">Calculator</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Perform high-speed mathematical operations instantly with dynamic data visualization.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT — INPUTS */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Equation Setup</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Define your parameters</p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white bg-white dark:bg-white/5 hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <div className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-1">First Number (X)</label>
                <div className="relative">
                   <input type="number" step="any" value={number1} onChange={e => setNumber1(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold" />
                </div>
              </div>
              
              <div>
                <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-1">Second Number (Y)</label>
                <div className="relative">
                  <input type="number" step="any" value={number2} onChange={e => setNumber2(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-transparent dark:bg-transparent dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-1">Operation Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                 {[
                   { val: 'add', label: 'Addition', icon: '+' },
                   { val: 'subtract', label: 'Subtract', icon: '-' },
                   { val: 'multiply', label: 'Multiply', icon: '×' },
                   { val: 'divide', label: 'Divide', icon: '÷' },
                   { val: 'power', label: 'Power', icon: 'xʸ' },
                   { val: 'modulo', label: 'Modulo', icon: '%' }
                 ].map(op => (
                    <button
                      key={op.val}
                      onClick={() => setOperation(op.val)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                        operation === op.val 
                          ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                          : 'bg-gray-50 dark:bg-gray-50 dark:bg-slate-900/40 border-gray-100 dark:border-gray-100 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-blue-500/50 hover:text-slate-900 dark:text-white'
                      }`}
                    >
                      <span className="text-xl font-bold mb-1">{op.icon}</span>
                      <span className="text-[10px] uppercase tracking-wider font-semibold">{op.label}</span>
                    </button>
                 ))}
              </div>
            </div>
            
          </div>

          <div className="mt-auto bg-gray-50 dark:bg-gray-50 dark:bg-slate-900/40 border border-gray-100 dark:border-gray-100 dark:border-white/5 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
             <Info className="w-4 h-4 shrink-0 text-blue-400" />
             <p>Operations follow direct mathematical logic. Use very high or very low numbers with caution to prevent floating-point precision issues or Infinity states.</p>
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
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Calculation Output</h2>
              </div>
            </div>

            {results && !isNaN(results.result) ? (
              <div className="flex flex-col flex-1">
                <div className="border rounded-2xl p-5 mb-5 text-center bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border-blue-500/30">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-blue-300">
                    Final Result
                  </p>
                  <p className={`text-6xl font-extrabold ${!isFinite(results.result) ? 'text-rose-400' : 'text-slate-900 dark:text-white'} tracking-tight mb-4 break-all`}>
                    {Number(results.result.toPrecision(10))}
                  </p>
                  
                  <div className="inline-flex items-center justify-center bg-slate-900/5 dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-3 w-full shadow-inner overflow-hidden">
                     <span className="text-slate-600 dark:text-slate-400 font-mono text-sm mr-3">EQ:</span>
                     <span className="text-emerald-400 font-mono font-bold whitespace-nowrap overflow-x-auto no-scrollbar">{results.equation}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl border bg-gray-50 dark:bg-white dark:bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-gray-100 dark:border-white/5 p-4 flex flex-col gap-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-1 bg-slate-500" />
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Operand X</div>
                    <p className="font-bold text-lg text-slate-900 dark:text-white truncate">{number1}</p>
                  </div>
                  <div className="rounded-xl border bg-gray-50 dark:bg-white dark:bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-gray-100 dark:border-white/5 p-4 flex flex-col gap-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-1 bg-slate-500" />
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Operand Y</div>
                    <p className="font-bold text-lg text-slate-900 dark:text-white truncate">{number2}</p>
                  </div>
                </div>
                
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3 bg-gray-50 dark:bg-gray-50 dark:bg-slate-900/40 rounded-xl border border-gray-100 dark:border-gray-100 dark:border-white/5 flex-1">
                <Layers className="w-10 h-10 opacity-30" />
                <p className="text-sm">Enter operands to render computation.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CHARTS SECTION */}
      {results && !isNaN(results.result) && isFinite(results.result) && barData.some(d => d.value !== 0) && (
        <div className="max-w-6xl mx-auto mt-6">
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-md dark:shadow-2xl rounded-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6">Relative Scaling</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '13px' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 2 ? '#3b82f6' : '#64748b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-slate-500 mt-2">Scale comparison of inputs against resulting value.</p>
          </div>
        </div>
      )}
    </div>
  );
}
