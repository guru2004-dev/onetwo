'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Sparkles, AlertCircle } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Custom event name used to open the chat from anywhere
export const OPEN_CHAT_EVENT = 'open-chat-calc-ai';

export default function ChatCalcAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm Chat Calc AI, powered by Claude. I can help you understand calculators, explain formulas, suggest the right calculator, and even perform quick calculations. How can I assist you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Listen for the custom "open chat" event dispatched from the hero button
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener(OPEN_CHAT_EVENT, handleOpenChat);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, handleOpenChat);
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  const sendToAPI = useCallback(async (userMessage: string, history: ChatMessage[]): Promise<string> => {
    const updatedHistory = [...history, { role: 'user' as const, content: userMessage }];

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: updatedHistory }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to get response');
    }

    return data.reply;
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      const reply = await sendToAPI(userText, chatHistory);

      // Update chat history for context
      setChatHistory((prev) => [
        ...prev,
        { role: 'user', content: userText },
        { role: 'assistant', content: reply },
      ]);

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: reply,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMsg);

      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `Sorry, I couldn't process that request. ${errorMsg}`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, chatHistory, sendToAPI]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Backdrop Overlay — click to close */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Toggle Button — always visible */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 flex items-center gap-2 group
          ${isOpen
            ? isDark
              ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
              : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
            : 'bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600 hover:shadow-purple-500/30 hover:shadow-xl'
          }`}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
            <span className="hidden sm:inline font-semibold text-sm">Chat Calc AI</span>
          </>
        )}
      </button>

      {/* Chat Container — stops propagation so clicks inside don't close */}
      <div
        className={`fixed bottom-24 right-6 w-[380px] h-[520px] z-50 flex flex-col overflow-hidden transition-all duration-200 ease-out
          ${isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'}
          rounded-2xl shadow-2xl
          ${isDark
            ? 'bg-[#0B0F1A] border border-white/10'
            : 'bg-white border border-slate-200 shadow-xl'
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-4 py-3 rounded-t-2xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-sm">Chat Calc AI</span>
              <p className="text-[10px] text-white/70 leading-tight">Powered by Claude AI</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className={`px-3 py-2 flex items-center gap-2 text-xs shrink-0
            ${isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-50 text-red-600'}`}
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto shrink-0 hover:opacity-70">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Chat Body */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-3
          ${isDark ? 'bg-[#111827]' : 'bg-slate-50'}`}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-xl text-sm leading-relaxed
                  ${message.isUser
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-br-sm'
                    : isDark
                      ? 'bg-[#1F2937] text-gray-200 rounded-bl-sm'
                      : 'bg-slate-200 text-slate-800 rounded-bl-sm'
                  }`}
              >
                <p className="whitespace-pre-line">{message.text}</p>
                <p className={`text-[10px] mt-1.5 text-right
                  ${message.isUser
                    ? 'text-white/60'
                    : isDark ? 'text-gray-500' : 'text-slate-400'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className={`px-4 py-3 rounded-xl rounded-bl-sm
                ${isDark ? 'bg-[#1F2937]' : 'bg-slate-200'}`}
              >
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full animate-bounce [animation-delay:0ms]
                    ${isDark ? 'bg-purple-400' : 'bg-purple-500'}`} />
                  <span className={`w-2 h-2 rounded-full animate-bounce [animation-delay:150ms]
                    ${isDark ? 'bg-purple-400' : 'bg-purple-500'}`} />
                  <span className={`w-2 h-2 rounded-full animate-bounce [animation-delay:300ms]
                    ${isDark ? 'bg-purple-400' : 'bg-purple-500'}`} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`p-3 flex gap-2 shrink-0 border-t
          ${isDark ? 'border-white/10 bg-[#0B0F1A]' : 'border-slate-200 bg-white'}`}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            disabled={isTyping}
            className={`flex-1 px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-200
              ${isDark
                ? 'bg-[#1F2937] text-white placeholder:text-gray-500 border border-white/10 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500'
                : 'bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500'
              }
              ${isTyping ? 'opacity-60 cursor-not-allowed' : ''}`}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className={`px-3 py-2.5 rounded-xl text-white transition-all duration-200 flex items-center justify-center
              ${input.trim() && !isTyping
                ? 'bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 shadow-md hover:shadow-lg'
                : isDark
                  ? 'bg-white/10 text-white/30 cursor-not-allowed'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
