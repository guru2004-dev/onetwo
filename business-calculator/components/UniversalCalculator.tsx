'use client';

import React, { useMemo, useState } from 'react';

type UniversalCalculatorProps = {
  id: string;
  name: string;
  description: string;
};

type Template = {
  labelA: string;
  labelB: string;
  labelC: string;
  defaultA: number;
  defaultB: number;
  defaultC: number;
  calc: (a: number, b: number, c: number) => { result: number; subtitle: string };
};

const getTemplate = (id: string): Template => {
  if (id.includes('interest') || id.includes('amortization') || id.includes('loan')) {
    return {
      labelA: 'Principal Amount',
      labelB: 'Annual Rate (%)',
      labelC: 'Time (Months)',
      defaultA: 100000,
      defaultB: 18,
      defaultC: 12,
      calc: (a, b, c) => {
        const years = c / 12;
        const interest = a * (b / 100) * years;
        return {
          result: interest,
          subtitle: 'Estimated simple interest',
        };
      },
    };
  }

  if (id.includes('tax') || id.includes('tds') || id.includes('gst') || id.includes('duty')) {
    return {
      labelA: 'Amount',
      labelB: 'Tax Rate (%)',
      labelC: 'Deductions / Exemptions',
      defaultA: 100000,
      defaultB: 18,
      defaultC: 0,
      calc: (a, b, c) => {
        const taxable = Math.max(0, a - c);
        const tax = taxable * (b / 100);
        return {
          result: tax,
          subtitle: 'Estimated tax amount',
        };
      },
    };
  }

  if (
    id.includes('sip') ||
    id.includes('lumpsum') ||
    id.includes('fd') ||
    id.includes('rd') ||
    id.includes('cd') ||
    id.includes('savings') ||
    id.includes('cagr') ||
    id.includes('npv') ||
    id.includes('irr')
  ) {
    return {
      labelA: 'Monthly Contribution',
      labelB: 'Annual Return (%)',
      labelC: 'Years',
      defaultA: 5000,
      defaultB: 12,
      defaultC: 10,
      calc: (a, b, c) => {
        const monthlyRate = b / 1200;
        const months = Math.max(1, Math.floor(c * 12));
        const fv = monthlyRate === 0
          ? a * months
          : a * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));

        return {
          result: fv,
          subtitle: 'Estimated future value',
        };
      },
    };
  }

  if (id.includes('profit') || id.includes('margin') || id.includes('commission') || id.includes('payroll')) {
    return {
      labelA: 'Revenue / Sales',
      labelB: 'Cost / Base Amount',
      labelC: 'Rate (%)',
      defaultA: 100000,
      defaultB: 70000,
      defaultC: 10,
      calc: (a, b, c) => {
        const gross = a - b;
        const variable = a * (c / 100);
        return {
          result: gross - variable,
          subtitle: 'Estimated net result',
        };
      },
    };
  }

  if (id.includes('ratio') || id.includes('score') || id.includes('worth') || id.includes('comparison')) {
    return {
      labelA: 'Value A',
      labelB: 'Value B',
      labelC: 'Weight / Adjustment (%)',
      defaultA: 50,
      defaultB: 30,
      defaultC: 20,
      calc: (a, b, c) => {
        const ratio = b === 0 ? 0 : a / b;
        const adjusted = ratio * (1 + c / 100);
        return {
          result: adjusted,
          subtitle: 'Computed adjusted ratio',
        };
      },
    };
  }

  return {
    labelA: 'Input A',
    labelB: 'Input B',
    labelC: 'Input C',
    defaultA: 100,
    defaultB: 10,
    defaultC: 1,
    calc: (a, b, c) => ({
      result: (a + b) * c,
      subtitle: 'Computed generic result',
    }),
  };
};

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(value);
};

export default function UniversalCalculator({ id, name, description }: UniversalCalculatorProps) {
  const template = useMemo(() => getTemplate(id), [id]);

  const [a, setA] = useState<number>(template.defaultA);
  const [b, setB] = useState<number>(template.defaultB);
  const [c, setC] = useState<number>(template.defaultC);

  const output = useMemo(() => template.calc(a, b, c), [a, b, c, template]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{name}</h1>
        <p className="text-gray-600 mb-6">{description}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{template.labelA}</label>
            <input
              type="number"
              value={a}
              onChange={(e) => setA(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{template.labelB}</label>
            <input
              type="number"
              value={b}
              onChange={(e) => setB(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{template.labelC}</label>
            <input
              type="number"
              value={c}
              onChange={(e) => setC(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Result</h2>
        <div className="p-5 bg-indigo-50 rounded-lg border border-indigo-100">
          <p className="text-sm text-indigo-700 mb-1">{output.subtitle}</p>
          <p className="text-3xl font-bold text-indigo-900">{formatNumber(output.result)}</p>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          This is a quick estimation mode for this calculator route.
        </p>
      </div>
    </div>
  );
}
