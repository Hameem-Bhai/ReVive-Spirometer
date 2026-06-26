import React from "react";
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Wind,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

const QUICK_REPLIES = [
  "What is a healthy FEV1/FVC ratio?",
  "How does a Venturi tube sensor work?",
  "Tell me about air quality in Dhaka.",
  "Give me pursed-lip breathing tips.",
];

const TypingIndicator = () => (
  <div className="flex gap-1.5 items-center px-4 py-3.5 rounded-2xl rounded-tl-sm" style={{
    background: 'rgba(27,45,107,0.04)',
    border: '1px solid rgba(27,45,107,0.08)'
  }}>
    <span className="typing-dot" style={{ backgroundColor: '#1B2D6B' }} />
    <span className="typing-dot" style={{ backgroundColor: '#1B2D6B' }} />
    <span className="typing-dot" style={{ backgroundColor: '#1B2D6B' }} />
  </div>
);

export default function ChatbotPage() {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm ReVive AI, your personal respiratory health assistant. Ask me anything about lung metrics, breathing exercises, or your spirometer device.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history })
      });

      if (!response.ok) throw new Error("Chat request failed");
      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        role: "assistant",
        content: "I'm having trouble connecting to the AI server right now. Please make sure the API server is running and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-2rem)] max-w-4xl mx-auto w-full p-4 md:p-6 gap-4">

      {/* Background ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[20%] right-[-5%] w-[40%] h-[40%] rounded-full opacity-[0.04]" 
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-[20%] left-[-5%] w-[40%] h-[40%] rounded-full opacity-[0.04]" 
          style={{ background: 'radial-gradient(circle, #059669, transparent)', filter: 'blur(60px)' }} />
      </div>

      {/* Main chat card frame */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col bg-white rounded-3xl overflow-hidden p-4 md:p-6 gap-4"
        style={{
          border: '1px solid rgba(27,45,107,0.07)',
          boxShadow: '0 2px 4px rgba(27,45,107,0.04), 0 8px 32px rgba(27,45,107,0.07), 0 32px 64px rgba(27,45,107,0.05)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[rgba(27,45,107,0.07)]">
          <div className="flex items-center gap-3">
            <div className="relative animate-float">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-tr from-[#1B2D6B] to-[#2563EB]" style={{
                boxShadow: '0 6px 20px rgba(27,45,107,0.3)'
              }}>
                <Wind className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 animate-pulse"
                style={{ borderColor: '#FFFFFF' }} />
            </div>
            <div className="text-left">
              <h1 className="text-lg font-display font-black text-[#1B2D6B] tracking-tight">ReVive AI Chat</h1>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pulmonology Assistant</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border"
            style={{ background: 'rgba(124,58,237,0.06)', color: '#7c3aed', borderColor: 'rgba(124,58,237,0.15)', boxShadow: '0 2px 8px rgba(124,58,237,0.08)' }}>
            <Sparkles className="w-3.5 h-3.5" /> AI Powered
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 px-1 py-2 scroll-smooth"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(27,45,107,0.2) transparent' }}>
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isBot = msg.role === "assistant";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className={`flex gap-2.5 ${isBot ? "self-start" : "self-end flex-row-reverse"} max-w-[85%]`}
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1"
                    style={isBot ? {
                      background: 'linear-gradient(135deg, #1B2D6B, #2563EB)',
                      boxShadow: '0 2px 8px rgba(27,45,107,0.15)'
                    } : {
                      background: 'rgba(27,45,107,0.05)',
                      border: '1px solid rgba(27,45,107,0.1)'
                    }}>
                    {isBot ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4" style={{ color: '#1B2D6B' }} />}
                  </div>

                  <div className={`flex flex-col gap-1 ${isBot ? 'items-start' : 'items-end'}`}>
                    <div className="px-4 py-3.5 rounded-2xl text-sm leading-relaxed"
                      style={isBot ? {
                        background: '#FFFFFF',
                        border: '1px solid rgba(27,45,107,0.07)',
                        color: '#0F172A',
                        borderTopLeftRadius: '4px',
                        boxShadow: '0 2px 4px rgba(27,45,107,0.04), 0 8px 20px rgba(27,45,107,0.05)'
                      } : {
                        background: 'linear-gradient(135deg, #1B2D6B, #2563EB)',
                        color: 'white',
                        borderTopRightRadius: '4px',
                        boxShadow: '0 4px 20px rgba(27,45,107,0.3), 0 2px 8px rgba(37,99,235,0.2)'
                      }}>
                      <p className="whitespace-pre-line text-left">{msg.content}</p>
                    </div>
                    {msg.timestamp && (
                      <span className="text-[10px] px-1 text-slate-400 font-bold">{msg.timestamp}</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex gap-2.5 self-start max-w-[85%]"
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{
                background: 'linear-gradient(135deg, #1B2D6B, #2563EB)',
                boxShadow: '0 2px 8px rgba(27,45,107,0.15)'
              }}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <TypingIndicator />
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Replies */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[rgba(27,45,107,0.06)]">
          {QUICK_REPLIES.map((reply, idx) => (
            <motion.button
              key={idx}
              onClick={() => sendMessage(reply)}
              disabled={isLoading}
              whileHover={{ y: -2, scale: 1.02, borderColor: 'rgba(37,99,235,0.25)', color: '#2563EB', background: 'rgba(37,99,235,0.04)' }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer disabled:opacity-40 bg-white border border-[rgba(27,45,107,0.08)] text-[#64748B] shadow-2xs"
            >
              {reply}
            </motion.button>
          ))}
        </div>

        {/* Input Form */}
        <form 
          onSubmit={e => { e.preventDefault(); sendMessage(inputValue); }}
          className="flex gap-2.5 p-2 rounded-2xl bg-white"
          style={{
            border: '1px solid rgba(27,45,107,0.08)',
            boxShadow: '0 8px 30px rgba(27,45,107,0.04)'
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Ask about lung health, AQI, breathing exercises..."
            disabled={isLoading}
            className="flex-1 bg-transparent outline-none text-sm px-3 py-2 text-left"
            style={{ color: '#1B2D6B' }}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 bg-gradient-to-tr from-[#1B2D6B] to-[#2563EB]"
            style={{
              boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
            }}
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
