"use client";

import { HTMLMotionProps, motion } from "framer-motion";
import { useRef, useState } from "react";
import { playUISound } from "@/utils/audio";

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "ghost" | "glass";
  size?: "sm" | "md" | "lg";
  magnetic?: boolean;
}

export const Button = ({
  className,
  variant = "primary",
  size = "md",
  magnetic = true,
  children,
  ...props
}: ButtonProps) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!magnetic || !ref.current) return;
    
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  const baseStyles = "relative inline-flex items-center justify-center rounded-lg font-bold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 uppercase";
  
  const variants = {
    primary: "bg-primary text-black hover:bg-[#00d0e0] shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)]",
    secondary: "bg-secondary text-white hover:bg-[#9015e0] shadow-[0_0_15px_rgba(176,38,255,0.4)] hover:shadow-[0_0_25px_rgba(176,38,255,0.6)]",
    ghost: "hover:bg-surface-hover hover:text-primary",
    glass: "glass glass-glow hover:text-primary",
  };
  
  const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-8 text-base",
    lg: "h-14 px-10 text-lg",
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    playUISound("hover");
    if (props.onMouseEnter) props.onMouseEnter(e);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playUISound("click");
    if (props.onClick) props.onClick(e);
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={(e) => {
        reset();
        if (props.onMouseLeave) props.onMouseLeave(e);
      }}
      onClick={handleClick}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className || ""}`}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};
