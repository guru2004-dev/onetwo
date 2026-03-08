'use client';

import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatCalcAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m Chat Calc AI. I can help you understand calculators, explain formulas, and suggest the right calculator for your needs. How can I assist you today?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getAIResponse(input),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  const getAIResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('emi') || lowerQuery.includes('loan')) {
      return 'The EMI Calculator helps you calculate monthly loan payments. You need to enter the loan amount, interest rate, and tenure. The formula is: EMI = [P × r × (1+r)^n] / [(1+r)^n-1], where P is principal, r is monthly rate, and n is tenure in months.';
    } else if (lowerQuery.includes('sip') || lowerQuery.includes('investment')) {
      return 'The SIP Calculator helps you plan systematic investments. Enter your monthly investment amount, expected return rate, and investment period to see potential returns. SIP uses the power of compounding to grow your wealth over time.';
    } else if (lowerQuery.includes('tax') || lowerQuery.includes('gst')) {
      return 'We have several tax calculators: GST Calculator for goods and services tax, Income Tax Calculator for annual tax liability, TDS Calculator for tax deducted at source, and Advance Tax Calculator. Which one would you like to use?';
    } else if (lowerQuery.includes('calculator') && lowerQuery.includes('best')) {
      return 'The best calculator depends on your needs:\n- For loans: EMI or Loan Eligibility Calculator\n- For investments: SIP, Lumpsum, or Compound Interest Calculator\n- For business: Profit & Loss or Break-Even Calculator\n- For taxes: GST or Income Tax Calculator\nWhat\'s your specific requirement?';
    } else {
      return 'I can help you with:\n1. Explaining calculator formulas\n2. Suggesting the right calculator for your needs\n3. Understanding financial concepts\n4. Navigating through different calculators\n\nPlease ask me anything specific about calculators or financial calculations!';
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all z-50 flex items-center space-x-2"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="hidden sm:inline font-medium">Chat Calc AI</span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-indigo-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">Chat Calc AI</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-indigo-700 p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.isUser
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
              />
              <button
                onClick={handleSend}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
