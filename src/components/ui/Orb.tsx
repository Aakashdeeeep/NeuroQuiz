"use client";

import { motion } from "framer-motion";

export const Orb = ({ isGenerating = false }: { isGenerating?: boolean }) => {
  return (
    <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
      {/* Outer Glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/20 blur-3xl pointer-events-none"
        animate={{
          scale: isGenerating ? [1, 1.5, 1] : [1, 1.1, 1],
          opacity: isGenerating ? [0.5, 0.8, 0.5] : [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: isGenerating ? 1 : 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Core */}
      <motion.div
        className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-primary to-secondary shadow-[0_0_50px_rgba(0,240,255,0.6)] z-10"
        animate={{
          y: isGenerating ? [-5, 5, -5] : [-10, 10, -10],
          rotate: isGenerating ? [0, 360] : [0, 180, 0],
          scale: isGenerating ? [0.95, 1.05, 0.95] : 1,
        }}
        transition={{
          y: {
            duration: isGenerating ? 0.5 : 3,
            repeat: Infinity,
            ease: "easeInOut",
          },
          rotate: {
            duration: isGenerating ? 2 : 10,
            repeat: Infinity,
            ease: "linear",
          },
          scale: {
            duration: 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }
        }}
      >
        {/* Inner texture lines */}
        <div className="absolute inset-0 rounded-full border border-white/20 mix-blend-overlay rotate-45 pointer-events-none" />
        <div className="absolute inset-2 rounded-full border border-white/20 mix-blend-overlay -rotate-45 pointer-events-none" />
      </motion.div>
    </div>
  );
};
