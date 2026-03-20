"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const FloatingDecorations = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 hidden lg:block">
      {/* Left Area Elements */}
      <motion.div 
        className="absolute top-[20%] left-[8%] flex flex-col items-center gap-2 opacity-30"
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
         <div className="w-16 h-16 rounded-full border border-primary/40 bg-primary/5 flex items-center justify-center backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-primary/80 animate-pulse" />
         </div>
      </motion.div>

      <motion.div 
        className="absolute top-[45%] left-[12%] opacity-20 text-primary font-mono text-5xl font-black tracking-tighter"
        animate={{ y: [0, 20, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        {`< />`}
      </motion.div>

      <motion.div 
        className="absolute top-[65%] left-[5%] transform -rotate-12 opacity-40"
        animate={{ y: [0, -25, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        <div className="px-4 py-2 rounded-lg border border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
          Neural Pathway Active
        </div>
      </motion.div>

      <motion.div 
        className="absolute top-[80%] left-[15%] w-24 h-24 opacity-10"
        style={{ backgroundImage: 'radial-gradient(var(--color-primary) 2px, transparent 2px)', backgroundSize: '16px 16px' }}
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Right Area Elements */}
      <motion.div 
        className="absolute top-[25%] right-[8%] flex flex-col items-center gap-2 opacity-30"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
         <div className="w-24 h-24 rounded-full border border-secondary/40 bg-secondary/5 flex items-center justify-center backdrop-blur-sm relative">
            <div className="absolute w-full h-full border border-secondary/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
            <div className="w-3 h-3 rounded-full bg-secondary/80" />
         </div>
      </motion.div>

      <motion.div 
        className="absolute top-[55%] right-[12%] opacity-20 text-secondary font-mono text-6xl font-black tracking-tighter"
        animate={{ y: [0, -15, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      >
        {`{ }`}
      </motion.div>

      <motion.div 
        className="absolute top-[80%] right-[8%] transform rotate-12 opacity-40"
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
      >
        <div className="px-4 py-2 rounded-lg border border-secondary/20 bg-secondary/5 text-secondary text-[10px] font-black uppercase tracking-widest backdrop-blur-md relative overflow-hidden">
          <div className="absolute inset-0 bg-secondary/10 w-[20%] animate-[slideRight_3s_infinite]" />
          Data Synchronization
        </div>
      </motion.div>

      <motion.div 
        className="absolute top-[15%] right-[18%] w-20 h-20 opacity-10"
        style={{ backgroundImage: 'radial-gradient(var(--color-secondary) 2px, transparent 2px)', backgroundSize: '16px 16px' }}
        animate={{ opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
    </div>
  );
};

export default FloatingDecorations;
