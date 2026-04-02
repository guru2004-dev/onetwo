// Type definitions for the Business Calculator application

export interface Calculator {
  id: string;
  name: string;
  description: string;
  category: string;
  path: string;
  icon?: string;
}

export interface CalculatorCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  calculators: Calculator[];
}

export interface CalculatorResult {
  label: string;
  value: string | number;
  formatted: string;
  isHighlighted?: boolean;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface CalculatorInput {
  name: string;
  label: string;
  type: 'number' | 'select' | 'date' | 'text';
  value: string | number;
  placeholder?: string;
  tooltip?: string;
  options?: { label: string; value: string | number }[];
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
}
