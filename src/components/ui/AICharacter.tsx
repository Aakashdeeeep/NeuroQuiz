"use client";

import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useQuizStore } from "@/store/useQuizStore";
import { getAudioContext } from "@/utils/audio";

export const AICharacter = () => {
  const [blink, setBlink] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const { isOverclocked, setOverclocked, aiReaction, setAiReaction } = useQuizStore();
  const clickCounts = useRef<number[]>([]);
  const [speechText, setSpeechText] = useState("");

  // Memoize random timings for waveform
  const waveformTimings = useMemo(() => {
    return [...Array(12)].map(() => ({
      normalDuration: 0.8 + Math.random(),
      normalDelay: Math.random() * 0.5,
      overclockDuration: 0.2 + Math.random() * 0.2,
      overclockDelay: Math.random() * 0.1,
    }));
  }, []);

  // Blinking logic — faster when happy, slower when sad
  useEffect(() => {
    const interval = aiReaction === "happy" ? 1500 : aiReaction === "sad" ? 6000 : 4000;
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, interval);
    return () => clearInterval(blinkInterval);
  }, [aiReaction]);

  // Cursor tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const springConfig = { damping: 25, stiffness: 150 };
  const eyeX = useSpring(useTransform(mouseX, [-1, 1], [-15, 15]), springConfig);
  const eyeY = useSpring(useTransform(mouseY, [-1, 1], [-8, 8]), springConfig);

  // ─── Synthesized Sounds ──────────────────────────────────────────────────────
  const playReactionSound = useCallback((type: "correct" | "wrong" | "surprised" | "thinking" | "alarm") => {
    try {
      const actx = getAudioContext();
      if (!actx) return;

      if (type === "correct") {
        // 🎵 Happy celebratory chime: C–E–G ascending
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, i) => {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.type = "sine";
          const start = actx.currentTime + i * 0.12;
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.4, start + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.01, start + 0.35);
          osc.start(start);
          osc.stop(start + 0.4);
        });
      } else if (type === "wrong") {
        // 😢 Sad descending "ooops" tones
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(350, actx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, actx.currentTime + 0.4);
        osc.frequency.exponentialRampToValueAtTime(130, actx.currentTime + 0.8);
        gain.gain.setValueAtTime(0.4, actx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 1.0);
        osc.start();
        osc.stop(actx.currentTime + 1.0);
      } else if (type === "surprised") {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.type = "square";
        osc.frequency.setValueAtTime(200, actx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, actx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, actx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.3);
        osc.start();
        osc.stop(actx.currentTime + 0.3);
      } else if (type === "thinking") {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(300, actx.currentTime);
        osc.frequency.linearRampToValueAtTime(150, actx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.4, actx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.6);
        osc.start();
        osc.stop(actx.currentTime + 0.6);
      } else if (type === "alarm") {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(400, actx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, actx.currentTime + 0.4);
        osc.frequency.linearRampToValueAtTime(400, actx.currentTime + 0.8);
        gain.gain.setValueAtTime(0.6, actx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 1.2);
        osc.start();
        osc.stop(actx.currentTime + 1.2);
      }
    } catch (e) {}
  }, []);

  // Keep old playSound alias for click reactions
  const playSound = useCallback((type: "happy" | "surprised" | "thinking" | "alarm") => {
    if (type === "happy") playReactionSound("correct");
    else if (type === "surprised") playReactionSound("surprised");
    else if (type === "thinking") playReactionSound("thinking");
    else if (type === "alarm") playReactionSound("alarm");
  }, [playReactionSound]);

  // Play sound automatically when aiReaction changes from quiz evaluation
  useEffect(() => {
    if (aiReaction === "happy") {
      playReactionSound("correct");
      setSpeechText("🎉 Nailed it!");
    } else if (aiReaction === "sad") {
      playReactionSound("wrong");
      setSpeechText("😢 Oops...");
    } else if (aiReaction === "thinking") {
      setSpeechText("Hmm... let me calculate.");
    } else if (aiReaction === "surprised") {
      setSpeechText("Whoa!");
    } else {
      // Idle state
      if (Math.random() > 0.8) {
        setSpeechText("I'm ready!");
        setTimeout(() => setSpeechText(""), 2000);
      } else {
        setSpeechText("");
      }
    }
  }, [aiReaction, playReactionSound]);

  // Global Theme toggle effect
  useEffect(() => {
    if (isOverclocked) {
      playReactionSound("alarm");
      const cooldown = setTimeout(() => setOverclocked(false), 7000);
      return () => clearTimeout(cooldown);
    }
  }, [isOverclocked, playReactionSound, setOverclocked]);

  // Click handler
  const handleRobotClick = useCallback(() => {
    const now = Date.now();
    clickCounts.current = clickCounts.current.filter(t => now - t < 2000);
    clickCounts.current.push(now);

    if (clickCounts.current.length >= 5) {
      setOverclocked(!isOverclocked);
      clickCounts.current = [];
      setAiReaction("none");
      return;
    }

    if (!isOverclocked) {
      if (aiReaction !== "none") return;
      const reactions = ["surprised", "thinking"] as const;
      const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
      setAiReaction(randomReaction);
      playSound(randomReaction);
      setTimeout(() => setAiReaction("none"), 1500 + Math.random() * 1000);
    }
  }, [aiReaction, playSound, isOverclocked, setOverclocked, setAiReaction]);

  // ─── Eye Shapes ──────────────────────────────────────────────────────────────
  const baseColor = isOverclocked ? "#ff0033" : "#00f0ff";

  let leftEyeProps  = { scaleY: blink ? 0.05 : 1, scaleX: 1,   rotate: 45,  backgroundColor: baseColor,    boxShadow: `0 0 ${isOverclocked ? '30px' : '20px'} ${baseColor}` };
  let rightEyeProps = { scaleY: blink ? 0.05 : 1, scaleX: 1,   rotate: 45,  backgroundColor: baseColor,    boxShadow: `0 0 ${isOverclocked ? '30px' : '20px'} ${baseColor}` };

  if (!isOverclocked) {
    if (aiReaction === "happy") {
      // ^‿^ curved-up, crescent eyes — bright pink/yellow
      leftEyeProps  = { scaleY: 0.25, scaleX: 1.5, rotate: 0, backgroundColor: "#ffdd00", boxShadow: "0 0 30px #ffdd00" };
      rightEyeProps = { scaleY: 0.25, scaleX: 1.5, rotate: 0, backgroundColor: "#ffdd00", boxShadow: "0 0 30px #ffdd00" };
    } else if (aiReaction === "sad") {
      // ╥_╥ droopy, heavy eyes — watery blue, heavy & small
      leftEyeProps  = { scaleY: 0.7, scaleX: 0.8, rotate: -20, backgroundColor: "#4db8ff", boxShadow: "0 0 20px #4db8ff" };
      rightEyeProps = { scaleY: 0.7, scaleX: 0.8, rotate: 20,  backgroundColor: "#4db8ff", boxShadow: "0 0 20px #4db8ff" };
    } else if (aiReaction === "surprised") {
      leftEyeProps  = { scaleY: 1.5, scaleX: 1.5, rotate: 0, backgroundColor: "#ffff00", boxShadow: "0 0 25px #ffff00" };
      rightEyeProps = { scaleY: 1.5, scaleX: 1.5, rotate: 0, backgroundColor: "#ffff00", boxShadow: "0 0 25px #ffff00" };
    } else if (aiReaction === "thinking") {
      leftEyeProps  = { scaleY: 0.5, scaleX: 0.5, rotate: 45, backgroundColor: "#ff9900", boxShadow: "0 0 15px #ff9900" };
      rightEyeProps = { scaleY: 1.2, scaleX: 1.2, rotate: 45, backgroundColor: "#ff9900", boxShadow: "0 0 25px #ff9900" };
    }
  } else {
    leftEyeProps  = { scaleY: 0.4, scaleX: 1.6, rotate: 15,  backgroundColor: "#ff0000", boxShadow: "0 0 40px #ff0000" };
    rightEyeProps = { scaleY: 0.4, scaleX: 1.6, rotate: -15, backgroundColor: "#ff0000", boxShadow: "0 0 40px #ff0000" };
  }

  const waveformColor = isOverclocked
    ? "#ff0033"
    : aiReaction === "sad"
    ? "#4db8ff"
    : aiReaction === "happy"
    ? "#ffdd00"
    : "#00f0ff";

  const outerRingColor = isOverclocked
    ? "border-primary/80"
    : aiReaction === "sad"
    ? "border-[#4db8ff]/60"
    : aiReaction === "happy"
    ? "border-[#ffdd00]/60"
    : aiReaction !== "none"
    ? "border-secondary/50"
    : "border-primary/20";

  return (
    <motion.div
      className={`relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center p-4 bg-background/50 backdrop-blur-md border rounded-3xl cursor-pointer group transition-colors duration-500
        ${isOverclocked ? 'border-primary/80 shadow-[0_0_80px_rgba(255,0,51,0.2)] animate-overclock' : 
          aiReaction === "happy" ? 'border-[#ffdd00]/40 shadow-[0_0_40px_rgba(255,221,0,0.15)]' :
          aiReaction === "sad"   ? 'border-[#4db8ff]/40 shadow-[0_0_40px_rgba(77,184,255,0.10)]' :
          'border-border/50 shadow-[0_0_30px_rgba(0,240,255,0.1)]'}
      `}
      animate={
        isOverclocked ? {} :
        aiReaction === "happy" ? { y: [-12, 12, -12], rotate: [-2, 2, -2] } :
        aiReaction === "sad"   ? { y: [0, 6, 0] } :
        { y: [-15, 15, -15] }
      }
      transition={
        isOverclocked ? {} :
        aiReaction === "happy" ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } :
        aiReaction === "sad"   ? { duration: 3, repeat: Infinity, ease: "easeInOut" } :
        { duration: 5, repeat: Infinity, ease: "easeInOut" }
      }
      onClick={handleRobotClick}
      title="Click me 5 times fast!"
    >
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes overclockShake {
          0% { transform: translate(-2px, -5px); }
          50% { transform: translate(2px, 5px); }
          100% { transform: translate(-2px, -5px); }
        }
        .animate-overclock { animation: overclockShake 0.2s infinite ease-in-out; }
        @keyframes tearDrop {
          0%   { transform: translateY(0px) scaleY(0.5); opacity: 0.8; }
          100% { transform: translateY(28px) scaleY(1.5); opacity: 0; }
        }
        .tear { animation: tearDrop 1.1s ease-in infinite; }
        .tear-delay { animation: tearDrop 1.1s ease-in 0.55s infinite; }
        .speech-bubble::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          border-width: 6px 6px 0;
          border-style: solid;
          border-color: rgba(20, 25, 35, 0.95) transparent transparent transparent;
          display: block;
          width: 0;
        }
      `}} />

      {/* Speech Bubble */}
      <AnimatePresence>
        {speechText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute -top-12 z-50 px-4 py-2 bg-[#141923] text-white text-xs font-bold rounded-lg border border-primary/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)] whitespace-nowrap speech-bubble"
          >
            {speechText}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outer Rotating Gear/Ring */}
      <motion.div
        className={`absolute inset-0 rounded-3xl border-2 border-dashed pointer-events-none transition-colors duration-500 ${outerRingColor}`}
        animate={{ rotate: 360, scale: aiReaction === "surprised" ? 1.05 : 1 }}
        transition={{ rotate: { duration: isOverclocked ? 2 : 20, repeat: Infinity, ease: "linear" }, scale: { duration: 0.2 } }}
      />

      {/* HAPPY sparkles ✨ */}
      <AnimatePresence>
        {aiReaction === "happy" && !isOverclocked && (
          <>
            {["-top-3 -left-3", "-top-3 -right-3", "-bottom-3 -left-3", "-bottom-3 -right-3"].map((pos, i) => (
              <motion.div
                key={pos}
                className={`absolute ${pos} text-yellow-300 text-lg pointer-events-none`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1.3, 0], rotate: [0, 20, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
              >✦</motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Robotic Head Structure */}
      <div className={`w-full h-full relative flex flex-col items-center justify-center gap-4 overflow-hidden bg-surface-hover border rounded-2xl transition-colors
        ${isOverclocked ? 'border-primary/60' : 'border-white/5 group-hover:border-primary/30'}
      `}>

        {/* Top Hardware details */}
        <div className="absolute top-4 w-2/3 flex justify-between px-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`w-3 h-1 rounded-full ${isOverclocked ? 'bg-primary' : aiReaction === "happy" ? 'bg-yellow-300' : aiReaction === "sad" ? 'bg-blue-300' : 'bg-primary/40'}`}
              style={{ boxShadow: `0 0 5px ${isOverclocked ? '#ff0033' : aiReaction === "happy" ? '#ffdd00' : aiReaction === "sad" ? '#4db8ff' : '#00f0ff'}` }} />
          ))}
        </div>

        {/* Visor Area */}
        <div className={`w-5/6 h-20 rounded-2xl relative overflow-visible flex items-center justify-center shadow-inner mt-4 transition-colors duration-500
          ${aiReaction === "happy" ? "bg-black border-b-2 border-yellow-400/40" : aiReaction === "sad" ? "bg-[#050d1a] border-b-2 border-blue-400/30" : "bg-black border-b-2 border-primary/30"}
        `}>
          {/* Eye container */}
          <motion.div
            className="flex gap-10 items-center justify-center w-full z-10"
            style={isOverclocked ? {} : { x: eyeX, y: eyeY }}
          >
            {/* Left Eye */}
            <motion.div
              className="w-5 h-5 rounded-sm"
              animate={leftEyeProps}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
            {/* Right Eye */}
            <motion.div
              className="w-5 h-5 rounded-sm"
              animate={rightEyeProps}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
          </motion.div>

          {/* Mouth Animation */}
          <motion.div 
            className="absolute bottom-2 left-1/2 -translate-x-1/2 flex justify-center items-center w-12 h-6"
            style={isOverclocked ? {} : { x: eyeX }}
          >
            <motion.div
              className={`${aiReaction === "happy" ? "bg-yellow-400" : aiReaction === "sad" ? "bg-[#4db8ff]" : isOverclocked ? "bg-red-500" : "bg-primary/60"}`}
              animate={{
                width: aiReaction === "happy" ? 24 : aiReaction === "surprised" ? 12 : aiReaction === "thinking" ? 6 : 16,
                height: aiReaction === "surprised" ? 12 : aiReaction === "sad" ? 4 : 6,
                borderRadius: aiReaction === "surprised" ? "50%" : "9999px",
                y: aiReaction === "happy" ? -2 : aiReaction === "sad" ? 2 : 0
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
          </motion.div>

          {/* SAD tears 💧 */}
          <AnimatePresence>
            {aiReaction === "sad" && !isOverclocked && (
              <>
                <div className="absolute bottom-0 left-[28%] w-1 h-2 rounded-full bg-[#4db8ff]/70 blur-[1px] tear" />
                <div className="absolute bottom-0 right-[28%] w-1 h-2 rounded-full bg-[#4db8ff]/70 blur-[1px] tear-delay" />
              </>
            )}
          </AnimatePresence>

          {/* Holographic Scanline */}
          <motion.div
            className={`absolute top-0 w-2 h-full blur-[2px] z-0 ${isOverclocked ? 'bg-primary/50' : aiReaction === "happy" ? 'bg-yellow-300/30' : 'bg-white/20'}`}
            animate={{ left: ["-10%", "110%"] }}
            transition={{ duration: isOverclocked ? 0.5 : aiReaction === "happy" ? 0.8 : 2.5, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Reaction label */}
        <AnimatePresence mode="wait">
          {aiReaction === "happy" && (
            <motion.div
              key="happy-label"
              initial={{ opacity: 0, y: 4, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-[10px] font-black uppercase tracking-widest text-yellow-300"
            >
              ✓ Correct!
            </motion.div>
          )}
          {aiReaction === "sad" && (
            <motion.div
              key="sad-label"
              initial={{ opacity: 0, y: 4, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-[10px] font-black uppercase tracking-widest text-[#4db8ff]"
            >
              ✗ Oops...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Audio Waveform */}
        <div className="flex gap-[3px] items-end h-6 bg-black/50 px-4 py-2 rounded-full border border-secondary/20">
          {waveformTimings.map((timing, i) => (
            <motion.div
              key={i}
              className="w-1.5 rounded-full"
              style={{ backgroundColor: waveformColor, boxShadow: `0 0 8px ${waveformColor}` }}
              animate={{
                height: isOverclocked || aiReaction === "surprised"
                  ? "90%"
                  : aiReaction === "happy"
                  ? ["30%", "100%", "50%", "80%", "30%"]
                  : aiReaction === "sad"
                  ? ["10%", "30%", "15%", "25%", "10%"]
                  : ["20%", "100%", "40%", "90%", "20%"]
              }}
              transition={{
                duration: isOverclocked ? timing.overclockDuration : aiReaction === "sad" ? timing.normalDuration * 1.8 : timing.normalDuration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: isOverclocked ? timing.overclockDelay : timing.normalDelay,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
