'use client';

import React, { useState } from 'react';
import CalculatorLayout from '@/components/CalculatorLayout';
import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import ResultCard from '@/components/ResultCard';
import { formatNumber } from '@/lib/utils';

export default function ArithmeticCalculator() {
  const [number1, setNumber1] = useState('10');
  const [number2, setNumber2] = useState('5');
  const [operation, setOperation] = useState('add');
  
  const calculate = () => {
    const num1 = parseFloat(number1) || 0;
    const num2 = parseFloat(number2) || 0;
    
    switch (operation) {
      case 'add':
        return num1 + num2;
      case 'subtract':
        return num1 - num2;
      case 'multiply':
        return num1 * num2;
      case 'divide':
        return num2 !== 0 ? num1 / num2 : 0;
      case 'power':
        return Math.pow(num1, num2);
      case 'modulo':
        return num2 !== 0 ? num1 % num2 : 0;
      default:
        return 0;
    }
  };

  const result = calculate();

  const results = (
    <div className="space-y-4">
      <ResultCard 
        label="Result" 
        value={formatNumber(result)} 
        highlighted 
      />
      <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
        <div className="text-sm text-gray-700">
          <strong>Equation:</strong> {number1} {getOperationSymbol(operation)} {number2} = {formatNumber(result)}
        </div>
      </div>
    </div>
  );

  const explanation = (
    <div className="space-y-4 text-gray-700">
      <p>
        The arithmetic calculator performs basic mathematical operations including addition, 
        subtraction, multiplication, division, power (exponentiation), and modulo (remainder).
      </p>
      <div className="space-y-2">
        <h3 className="font-semibold">Operations:</h3>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong>Addition (+):</strong> Adds two numbers together</li>
          <li><strong>Subtraction (-):</strong> Subtracts the second number from the first</li>
          <li><strong>Multiplication (×):</strong> Multiplies two numbers</li>
          <li><strong>Division (÷):</strong> Divides the first number by the second</li>
          <li><strong>Power (^):</strong> Raises first number to the power of second</li>
          <li><strong>Modulo (%):</strong> Returns remainder of division</li>
        </ul>
      </div>
    </div>
  );

  return (
    <CalculatorLayout
      title="Arithmetic Calculator"
      description="Perform basic mathematical operations on numbers"
      results={results}
      explanation={explanation}
    >
      <InputField
        label="First Number"
        type="number"
        value={number1}
        onChange={setNumber1}
        placeholder="Enter first number"
        step="any"
      />
      <InputField
        label="Second Number"
        type="number"
        value={number2}
        onChange={setNumber2}
        placeholder="Enter second number"
        step="any"
      />
      <SelectField
        label="Operation"
        value={operation}
        onChange={setOperation}
        options={[
          { label: 'Addition (+)', value: 'add' },
          { label: 'Subtraction (-)', value: 'subtract' },
          { label: 'Multiplication (×)', value: 'multiply' },
          { label: 'Division (÷)', value: 'divide' },
          { label: 'Power (^)', value: 'power' },
          { label: 'Modulo (%)', value: 'modulo' },
        ]}
      />
    </CalculatorLayout>
  );
}

function getOperationSymbol(operation: string): string {
  const symbols: { [key: string]: string } = {
    add: '+',
    subtract: '-',
    multiply: '×',
    divide: '÷',
    power: '^',
    modulo: '%',
  };
  return symbols[operation] || '';
}
