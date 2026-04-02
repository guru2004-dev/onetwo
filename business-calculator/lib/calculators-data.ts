import { CalculatorCategory } from './types';

const IMPLEMENTED_CALCULATOR_IDS = new Set([
  'arithmetic',
  'break-even',
  'compound-interest',
  'currency-converter',
  'discount',
  'emi',
  'gst',
  'jewellery',
  'loan-comparison',
  'loan-eligibility',
  'lumpsum',
  'markup-margin',
  'npv',
  'percentage',
  'roi',
  'simple-interest',
  'sip',
]);

export const calculatorCategories: CalculatorCategory[] = [
  {
    id: 'basic',
    name: 'Basic Calculators',
    description: 'Essential arithmetic and percentage calculations',
    icon: 'Calculator',
    calculators: [
      {
        id: 'arithmetic',
        name: 'Arithmetic Calculator',
        description: 'Basic arithmetic operations',
        category: 'basic',
        path: '/calculators/arithmetic',
      },
      {
        id: 'percentage',
        name: 'Percentage Calculator',
        description: 'Calculate percentages and percentage changes',
        category: 'basic',
        path: '/calculators/percentage',
      },
      {
        id: 'markup-margin',
        name: 'Markup vs Margin Calculator',
        description: 'Compare markup and margin — understand the real difference',
        category: 'basic',
        path: '/calculators/markup-margin',
      },
    ],
  },
  {
    id: 'financial',
    name: 'Financial Calculators',
    description: 'Loans, investments, and interest calculations',
    icon: 'TrendingUp',
    calculators: [
      {
        id: 'emi',
        name: 'EMI Calculator',
        description: 'Calculate Equated Monthly Installments',
        category: 'financial',
        path: '/calculators/emi',
      },
      {
        id: 'loan-eligibility',
        name: 'Loan Eligibility Calculator',
        description: 'Check your loan eligibility',
        category: 'financial',
        path: '/calculators/loan-eligibility',
      },

      {
        id: 'loan-comparison',
        name: 'Loan Comparison Calculator',
        description: 'Compare different loan offers',
        category: 'financial',
        path: '/calculators/loan-comparison',
      },
      {
        id: 'sip',
        name: 'SIP Calculator',
        description: 'Calculate Systematic Investment Plan returns',
        category: 'financial',
        path: '/calculators/sip',
      },
      {
        id: 'lumpsum',
        name: 'Lumpsum Calculator',
        description: 'Calculate lump sum investment returns',
        category: 'financial',
        path: '/calculators/lumpsum',
      },
      {
        id: 'simple-interest',
        name: 'Simple Interest Calculator',
        description: 'Calculate simple interest on principal',
        category: 'financial',
        path: '/calculators/simple-interest',
      },
      {
        id: 'compound-interest',
        name: 'Compound Interest Calculator',
        description: 'Calculate compound interest on investments',
        category: 'financial',
        path: '/calculators/compound-interest',
      },
      {
        id: 'roi',
        name: 'ROI Calculator',
        description: 'Calculate Return on Investment',
        category: 'financial',
        path: '/calculators/roi',
      },
      {
        id: 'break-even',
        name: 'Break-Even Calculator',
        description: 'Calculate break-even point',
        category: 'financial',
        path: '/calculators/break-even',
      },
      {
        id: 'depreciation',
        name: 'Depreciation Calculator',
        description: 'Calculate asset depreciation',
        category: 'financial',
        path: '/calculators/depreciation',
      },
      {
        id: 'amortization',
        name: 'Amortization Schedule',
        description: 'Generate loan amortization schedule',
        category: 'financial',
        path: '/calculators/amortization',
      },
    ],
  },
  {
    id: 'banking',
    name: 'Banking Calculators',
    description: 'Banking products and financial planning',
    icon: 'Building2',
    calculators: [
      {
        id: 'credit-card-interest',
        name: 'Credit Card Interest Calculator',
        description: 'Calculate credit card interest charges',
        category: 'banking',
        path: '/calculators/credit-card-interest',
      },
      {
        id: 'overdraft-interest',
        name: 'Overdraft Interest Calculator',
        description: 'Calculate overdraft interest',
        category: 'banking',
        path: '/calculators/overdraft-interest',
      },
      {
        id: 'mortgage-affordability',
        name: 'Mortgage Affordability Calculator',
        description: 'Calculate home loan affordability',
        category: 'banking',
        path: '/calculators/mortgage-affordability',
      },
      {
        id: 'refinance',
        name: 'Refinance Calculator',
        description: 'Evaluate loan refinancing options',
        category: 'banking',
        path: '/calculators/refinance',
      },
      {
        id: 'fd',
        name: 'Fixed Deposit (FD) Calculator',
        description: 'Calculate FD maturity amount',
        category: 'banking',
        path: '/calculators/fd',
      },
      {
        id: 'rd',
        name: 'Recurring Deposit (RD) Calculator',
        description: 'Calculate RD maturity amount',
        category: 'banking',
        path: '/calculators/rd',
      },
      {
        id: 'cd',
        name: 'Certificate of Deposit (CD) Calculator',
        description: 'Calculate CD returns',
        category: 'banking',
        path: '/calculators/cd',
      },
      {
        id: 'goal-savings',
        name: 'Goal-Based Savings Calculator',
        description: 'Plan savings for specific goals',
        category: 'banking',
        path: '/calculators/goal-savings',
      },
      {
        id: 'debt-to-income',
        name: 'Debt-to-Income Ratio Calculator',
        description: 'Calculate your DTI ratio',
        category: 'banking',
        path: '/calculators/debt-to-income',
      },
      {
        id: 'credit-score',
        name: 'Credit Score Simulator',
        description: 'Simulate credit score changes',
        category: 'banking',
        path: '/calculators/credit-score',
      },
      {
        id: 'net-worth',
        name: 'Net Worth Calculator',
        description: 'Calculate your net worth',
        category: 'banking',
        path: '/calculators/net-worth',
      },
    ],
  },
  {
    id: 'accounting',
    name: 'Accounting Calculators',
    description: 'Business accounting and financial statements',
    icon: 'FileText',
    calculators: [
      {
        id: 'profit-loss',
        name: 'Profit & Loss Calculator',
        description: 'Calculate profit or loss',
        category: 'accounting',
        path: '/calculators/profit-loss',
      },
      {
        id: 'payroll',
        name: 'Payroll Calculator',
        description: 'Calculate employee payroll',
        category: 'accounting',
        path: '/calculators/payroll',
      },
      {
        id: 'inventory-cost',
        name: 'Inventory Cost Calculator (FIFO)',
        description: 'Calculate inventory costs using FIFO',
        category: 'accounting',
        path: '/calculators/inventory-cost',
      },
      {
        id: 'working-capital',
        name: 'Working Capital Calculator',
        description: 'Calculate working capital',
        category: 'accounting',
        path: '/calculators/working-capital',
      },
      {
        id: 'ebitda',
        name: 'EBITDA Calculator',
        description: 'Calculate EBITDA',
        category: 'accounting',
        path: '/calculators/ebitda',
      },
      {
        id: 'gross-profit',
        name: 'Gross Profit Calculator',
        description: 'Calculate gross profit margin',
        category: 'accounting',
        path: '/calculators/gross-profit',
      },
      {
        id: 'debit-credit',
        name: 'Debit & Credit Calculator',
        description: 'Validate journal entries',
        category: 'accounting',
        path: '/calculators/debit-credit',
      },
    ],
  },
  {
    id: 'tax',
    name: 'Tax Calculators',
    description: 'Tax calculations and planning',
    icon: 'Receipt',
    calculators: [
      {
        id: 'gst',
        name: 'GST Calculator',
        description: 'Calculate GST amount',
        category: 'tax',
        path: '/calculators/gst',
      },
      {
        id: 'income-tax',
        name: 'Income Tax Calculator',
        description: 'Calculate income tax liability',
        category: 'tax',
        path: '/calculators/income-tax',
      },
      {
        id: 'tds',
        name: 'TDS Calculator',
        description: 'Calculate Tax Deducted at Source',
        category: 'tax',
        path: '/calculators/tds',
      },
      {
        id: 'advance-tax',
        name: 'Advance Tax Calculator',
        description: 'Calculate advance tax liability',
        category: 'tax',
        path: '/calculators/advance-tax',
      },
    ],
  },
  {
    id: 'sales',
    name: 'Sales Calculators',
    description: 'Sales and commission calculations',
    icon: 'ShoppingCart',
    calculators: [
      {
        id: 'discount',
        name: 'Discount Calculator',
        description: 'Calculate discounts and final prices',
        category: 'sales',
        path: '/calculators/discount',
      },
      {
        id: 'commission',
        name: 'Commission Calculator',
        description: 'Calculate sales commission',
        category: 'sales',
        path: '/calculators/commission',
      },
      {
        id: 'jewellery',
        name: 'Jewellery Price Calculator',
        description: 'Calculate jewellery bill with metal, making, and GST',
        category: 'sales',
        path: '/calculators/jewellery',
      },
    ],
  },
  {
    id: 'international',
    name: 'International Business',
    description: 'Currency and international trade calculators',
    icon: 'Globe',
    calculators: [
      {
        id: 'currency-converter',
        name: 'Currency Converter',
        description: 'Convert between currencies',
        category: 'international',
        path: '/calculators/currency-converter',
      },
      {
        id: 'import-export-duty',
        name: 'Import/Export Duty Calculator',
        description: 'Calculate import/export duties',
        category: 'international',
        path: '/calculators/import-export-duty',
      },
      {
        id: 'forward-exchange',
        name: 'Forward Exchange Contract Calculator',
        description: 'Calculate forward exchange contracts',
        category: 'international',
        path: '/calculators/forward-exchange',
      },
      {
        id: 'remittance-fee',
        name: 'Remittance Fee Calculator',
        description: 'Calculate remittance fees',
        category: 'international',
        path: '/calculators/remittance-fee',
      },
    ],
  },
  {
    id: 'analytical',
    name: 'Analytical Calculators',
    description: 'Financial analysis and valuation',
    icon: 'BarChart3',
    calculators: [
      {
        id: 'cash-flow',
        name: 'Cash Flow Calculator',
        description: 'Calculate and analyze cash flows',
        category: 'analytical',
        path: '/calculators/cash-flow',
      },
      {
        id: 'npv',
        name: 'NPV Calculator',
        description: 'Calculate Net Present Value',
        category: 'analytical',
        path: '/calculators/npv',
      },
      {
        id: 'irr',
        name: 'IRR Calculator',
        description: 'Calculate Internal Rate of Return',
        category: 'analytical',
        path: '/calculators/irr',
      },

      {
        id: 'cagr',
        name: 'CAGR Calculator',
        description: 'Calculate Compound Annual Growth Rate',
        category: 'analytical',
        path: '/calculators/cagr',
      },
      {
        id: 'scenario-comparison',
        name: 'Scenario Comparison Calculator',
        description: 'Compare different financial scenarios',
        category: 'analytical',
        path: '/calculators/scenario-comparison',
      },
    ],
  },
];

export const getAllCalculators = () => {
  return calculatorCategories.flatMap(category => category.calculators);
};

export const isCalculatorImplemented = (id: string) => {
  return IMPLEMENTED_CALCULATOR_IDS.has(id);
};

export const getImplementedCategories = () => {
  return calculatorCategories
    .map((category) => ({
      ...category,
      calculators: category.calculators.filter((calc) => isCalculatorImplemented(calc.id)),
    }))
    .filter((category) => category.calculators.length > 0);
};

export const getImplementedCategoryById = (id: string) => {
  return getImplementedCategories().find((category) => category.id === id);
};

export const getCalculatorById = (id: string) => {
  return getAllCalculators().find(calc => calc.id === id);
};

export const getCategoryById = (id: string) => {
  return calculatorCategories.find(category => category.id === id);
};
