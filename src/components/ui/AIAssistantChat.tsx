"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuizStore } from '@/store/useQuizStore';
import { playUISound } from '@/utils/audio';
import { generateChatReply } from '@/utils/gemini';

export function AIAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'model', content: string}[]>([
    { role: 'model', content: "Neural Core online. State your query, but remember: I will not simply hand you the answers." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const { questions, currentQuestionIndex, topic } = useQuizStore();
  
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);
    playUISound('click');
    
    const currentQ = questions[currentQuestionIndex];
    const contextStr = currentQ ? `Topic: ${topic}. Question: ${currentQ.question}` : `Topic: ${topic}`;

    try {
      const reply = await generateChatReply(
        [...messages, { role: 'user', content: userMsg }],
        contextStr
      );
      if (reply) {
        setMessages(prev => [...prev, { role: 'model', content: reply }]);
        playUISound('hover');
      } else {
        throw new Error("No reply");
      }
    } catch(e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', content: "[SYSTEM ERROR] Link to Neural Core disrupted." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 w-14 h-14 bg-surface hover:bg-primary/20 border-2 border-primary/50 text-white rounded-full flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:scale-110 transition-all z-40"
        title="Consult Neural Core"
      >
        🧠
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed top-0 left-0 w-full sm:w-96 h-full bg-surface border-r border-primary/30 z-50 flex flex-col shadow-[20px_0_50px_rgba(0,0,0,0.5)]"
          >
            <div className="p-4 border-b border-border flex justify-between items-center bg-black/50">
              <div className="font-bold uppercase tracking-widest text-primary text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"/>
                Neural Core Link
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-primary text-black font-medium border border-primary' : 'bg-surface-hover border border-border text-gray-300'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                   <div className="bg-surface-hover border border-border/50 text-primary text-[10px] uppercase tracking-widest font-bold px-4 py-3 rounded-2xl animate-pulse flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-75"/>
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-150"/>
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-300"/>
                      </div>
                      Processing query...
                   </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-black/50 flex gap-3">
              <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about this topic..."
                className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all"
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()} 
                className="px-6 py-3 bg-primary text-black hover:bg-white font-black uppercase tracking-widest text-[10px] rounded-xl disabled:opacity-50 disabled:hover:bg-primary transition-colors flex items-center justify-center"
              >
                Send ✓
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
