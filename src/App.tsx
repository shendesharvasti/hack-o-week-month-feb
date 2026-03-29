import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, User, Bot, Loader2, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const SYSTEM_INSTRUCTION = `You are a helpful assistant for Symbiosis International University (SIU). 
You MUST answer in exactly one line. 
If a user's question is ambiguous (like 'when is sem end'), ask a clarifying question (like 'Do you mean end semester exams?'). 
If they confirm, ask for more details (like 'Which semester, odd or even?'). 
Keep responses concise and limited to one line. 
If you don't know the exact date, provide a general timeframe based on typical SIU academic calendars (e.g., 'Even semester exams usually start in April/May').`;

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your SIU Assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  // Initialize chat session
  useEffect(() => {
    chatRef.current = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: input });
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text || "I'm sorry, I couldn't process that.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting. Please try again.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        text: "Hello! I'm your SIU Assistant. How can I help you today?",
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
    chatRef.current = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#800000] rounded-full flex items-center justify-center text-white shadow-md">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-[#800000]">SIU Assistant</h1>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Symbiosis International University</p>
          </div>
        </div>
        <button 
          onClick={resetChat}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          title="Reset Chat"
        >
          <RefreshCcw size={20} />
        </button>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-3xl mx-auto w-full space-y-6">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                  msg.sender === 'user' ? 'bg-[#800000] text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-[#800000] text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="flex gap-3 items-center text-gray-400 text-sm italic">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Loader2 size={16} className="animate-spin" />
              </div>
              <span>Assistant is typing...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-gray-200 p-4 md:p-6 sticky bottom-0">
        <div className="max-w-3xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about semesters, exams, or SIU..."
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 pr-14 focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] transition-all text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-[#800000] text-white rounded-xl hover:bg-[#600000] disabled:opacity-50 disabled:hover:bg-[#800000] transition-all shadow-sm"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-center text-gray-400 mt-3 uppercase tracking-widest font-semibold">
          One-line responses • Official SIU Assistant
        </p>
      </footer>
    </div>
  );
}

