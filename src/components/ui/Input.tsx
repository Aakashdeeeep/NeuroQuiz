"use client";

import { forwardRef, InputHTMLAttributes, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <div className="relative flex flex-col gap-2 w-full">
        {label && (
          <label className={`text-sm font-bold uppercase tracking-wider transition-colors ${focused ? "text-primary" : "text-gray-400"}`}>
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            className={`w-full bg-background/50 border ${
              error ? "border-error focus:border-error" : "border-border focus:border-primary"
            } rounded-lg px-4 py-4 text-foreground placeholder:text-gray-600 outline-none transition-colors ${className}`}
            {...props}
          />
          
          {/* Glowing bottom border effect */}
          <AnimatePresence>
            {focused && !error && (
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                exit={{ scaleX: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-b-lg shadow-[0_0_15px_rgba(0,240,255,0.7)] pointer-events-none"
                style={{ originX: 0.5 }}
              />
            )}
            {focused && error && (
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                exit={{ scaleX: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-error rounded-b-lg shadow-[0_0_15px_rgba(255,42,42,0.7)] pointer-events-none"
                style={{ originX: 0.5 }}
              />
            )}
          </AnimatePresence>
        </div>
        
        {error && (
          <motion.span 
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            className="text-xs text-error mt-1 uppercase tracking-wide font-bold"
          >
            {error}
          </motion.span>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
