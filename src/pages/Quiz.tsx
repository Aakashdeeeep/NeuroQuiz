"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useQuizStore } from "@/store/useQuizStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { playUISound } from "@/utils/audio";
import { startAmbientTrack, stopAmbientTrack } from "@/utils/ambientAudio";
import { AIAssistantChat } from "@/components/ui/AIAssistantChat";
import { AICharacter } from "@/components/ui/AICharacter";

function FillBlankInput({ onSubmit, currentAnswer }: { onSubmit: (val: string) => void; currentAnswer: string }) {
  const [inputVal, setInputVal] = useState("");

  const handleSubmit = () => {
    if (!inputVal.trim() || currentAnswer) return;
    playUISound("click");
    onSubmit(inputVal.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl"
    >
      {currentAnswer ? (
        <div className="p-6 rounded-2xl border-2 border-primary bg-primary/10 text-white shadow-[0_0_20px_rgba(0,240,255,0.15)] font-bold text-xl tracking-wide">
          <span className="text-[10px] text-primary uppercase tracking-widest block mb-2">Your Answer Locked</span>
          {currentAnswer}
        </div>
      ) : (
        <div className="flex gap-4 items-center">
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => {
              e.stopPropagation(); // prevent page-level shortcut handler stealing keys
              if (e.key === "Enter") handleSubmit();
            }}
            placeholder="Type your answer here..."
            className="flex-1 border border-border rounded-xl px-6 py-4 text-white font-bold text-lg placeholder:text-gray-600 focus:outline-none focus:border-primary focus:shadow-[0_0_20px_rgba(0,240,255,0.2)] transition-all"
            style={{ background: "var(--color-surface, #1a1a2e)" }}
          />
          <button
            onClick={handleSubmit}
            disabled={!inputVal.trim()}
            className="px-6 py-4 rounded-xl bg-primary text-black font-black uppercase tracking-widest text-sm disabled:opacity-40 hover:scale-105 transition-transform shadow-[0_0_15px_rgba(0,240,255,0.3)]"
          >
            Evaluate ✓
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default function QuizPage() {
  const router = useRouter();
  const { 
    questions, 
    currentQuestionIndex, 
    answers, 
    answerQuestion, 
    nextQuestion, 
    saveAttempt,
    endQuiz,
    isVoiceEnabled,
    toggleVoice,
    setAiReaction
  } = useQuizStore();

  const [isClient, setIsClient] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [localSelection, setLocalSelection] = useState<string | null>(null);
  const TIME_PER_QUESTION = 15;
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [cheatWarnings, setCheatWarnings] = useState(0);
  const [showCheatAlert, setShowCheatAlert] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);
  const [skipsLeft, setSkipsLeft] = useState(1);
  const [showStreakBurst, setShowStreakBurst] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (questions.length === 0) {
      router.push("/setup");
    }
    startAmbientTrack();
    return () => stopAmbientTrack();
  }, [questions, router]);

  // Reset timer and feedback on question change
  useEffect(() => {
    setTimeLeft(TIME_PER_QUESTION);
    setShowCheatAlert(false);
    setShowHint(false);
    setShowFeedback(false);
    setLocalSelection(null);
    setAiReaction("none");
  }, [currentQuestionIndex, setAiReaction]);

  const currentAnswer = answers[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleSkip = useCallback(() => {
    if (skipsLeft <= 0 || showFeedback || currentAnswer) return;
    playUISound("error");
    setSkipsLeft(0);
    setTimeLeft(prev => Math.max(0, prev - 3));
    answerQuestion(currentQuestionIndex, "SYSTEM_TIMEOUT");
    setAiReaction("sad");
    setTimeout(() => setAiReaction("none"), 4000);
    setShowFeedback(true);
  }, [skipsLeft, showFeedback, currentAnswer, answerQuestion, currentQuestionIndex, setAiReaction]);

  const handleRequestHint = () => {
    if (showHint || timeLeft <= 4 || currentAnswer) return;
    playUISound("error"); // Dramatic sound for penalty
    setTimeLeft(prev => Math.max(0, prev - 4));
    setShowHint(true);
  };

  // Stable handlers for keyboard listeners
  const handleOptionSelect = useCallback((opt: string) => {
    if (showFeedback || currentAnswer) return;
    setLocalSelection(opt);
    playUISound("hover");
  }, [showFeedback, currentAnswer]);

  const handleEvaluate = useCallback((forcedAnswer?: string | any) => {
    if (showFeedback) return;
    const finalAnswer = (typeof forcedAnswer === "string" ? forcedAnswer : localSelection) || "SYSTEM_TIMEOUT";
    
    answerQuestion(currentQuestionIndex, finalAnswer);
    
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;
    
    // Evaluate correctness
    let isCorrect = false;
    if (finalAnswer === "SYSTEM_TIMEOUT") {
      isCorrect = false;
    } else if (currentQ.type === "fill_blank") {
      isCorrect = finalAnswer.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();
    } else {
      isCorrect = finalAnswer === currentQ.correctAnswer;
    }

    if (isCorrect) {
      setAiReaction("happy");
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak >= 3) {
        setShowStreakBurst(true);
        setTimeout(() => setShowStreakBurst(false), 1500);
      }
    } else {
      setAiReaction("sad");
      setStreak(0);
    }

    // Auto-reset robot reaction after 4 seconds
    setTimeout(() => setAiReaction("none"), 4000);
    
    setShowFeedback(true);
  }, [localSelection, answerQuestion, currentQuestionIndex, questions, setAiReaction, showFeedback, streak]);

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      endQuiz();
      saveAttempt();
      setAiReaction("none"); // 🔄 Reset robot back to idle before leaving
      router.push("/results");
    } else {
      nextQuestion();
    }
  }, [isLastQuestion, endQuiz, saveAttempt, router, nextQuestion, setAiReaction]);

  // Power-User Keyboard Shortcuts
  useEffect(() => {
    if (!isClient || questions.length === 0) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⚠️ Don't intercept keys if the user is typing in a text input
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;

      if (timeLeft <= 0) return;
      
      const key = e.key.toLowerCase();
      
      if (key === 'enter') {
        if (!showFeedback && localSelection) {
          playUISound("click");
          handleEvaluate();
        } else if (showFeedback) {
          playUISound("click");
          handleNext();
        }
        return;
      }
      
      // Keyboard answer shortcuts only apply to MCQ questions
      const currentQ = questions[currentQuestionIndex];
      if (!currentAnswer && currentQ?.type === "mcq") {
        if ((key === 'a' || key === '1') && currentQ.options[0]) handleOptionSelect(currentQ.options[0]);
        if ((key === 'b' || key === '2') && currentQ.options[1]) handleOptionSelect(currentQ.options[1]);
        if ((key === 'c' || key === '3') && currentQ.options[2]) handleOptionSelect(currentQ.options[2]);
        if ((key === 'd' || key === '4') && currentQ.options[3]) handleOptionSelect(currentQ.options[3]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isClient, questions, currentQuestionIndex, currentAnswer, timeLeft, localSelection, showFeedback, handleNext, handleEvaluate, handleOptionSelect]);

  // Anti-Cheat Focus Tracker (still active even with an answer selected)
  useEffect(() => {
    if (!isClient || questions.length === 0) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setCheatWarnings(prev => prev + 1);
        setTimeLeft(prev => Math.max(0, prev - 5)); // 5 Second Penalty
        setShowCheatAlert(true);
        playUISound("error");
        setTimeout(() => setShowCheatAlert(false), 3000);
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    return () => window.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isClient, questions.length]);

  // AI Voice Narration
  useEffect(() => {
    if (!isClient || questions.length === 0) return;
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (!isVoiceEnabled) return;
      
      const utterance = new SpeechSynthesisUtterance(currentQ.question);
      utterance.rate = 1.05;
      utterance.pitch = 0.9;
      
      const voices = window.speechSynthesis.getVoices();
      const syntheticVoice = voices.find((v: SpeechSynthesisVoice) => v.name.includes("Daniel") || v.name.includes("Google UK") || v.name.includes("Zira")) || voices[0];
      if (syntheticVoice) utterance.voice = syntheticVoice;

      window.speechSynthesis.speak(utterance);
    }

    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [currentQuestionIndex, isClient, questions, isVoiceEnabled]);

  // Timer rundown logic — runs regardless of whether an answer is selected
  useEffect(() => {
    if (!isClient || questions.length === 0 || showFeedback) return;

    if (timeLeft <= 0) {
      // If no answer yet, automatically trigger a timeout answer.
      if (!currentAnswer) {
        handleEvaluate("SYSTEM_TIMEOUT");
      }
      return;
    }

    const timerEvent = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timerEvent);
  }, [timeLeft, currentAnswer, showFeedback, isClient, questions.length, currentQuestionIndex, handleEvaluate]);

  if (!isClient || questions.length === 0) return null;

  const currentQ = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / questions.length) * 100;
  
  // Calculate specific correctness for display below
  let isAnswerCorrectLocally = false;
  if (currentAnswer && currentAnswer !== "SYSTEM_TIMEOUT") {
     isAnswerCorrectLocally = currentQ.type === "fill_blank" 
        ? currentAnswer.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase()
        : currentAnswer === currentQ.correctAnswer;
  }

  return (
    <main className="flex min-h-screen flex-col items-center py-8 px-4 md:px-24">
      {/* Global AI Assistant Drawer */}
      <AIAssistantChat />
      
      {/* Anti-Cheat Global Alert */}
      <AnimatePresence>
        {showCheatAlert && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-error/20 border border-error px-6 py-3 rounded-full flex items-center gap-3 backdrop-blur-md shadow-[0_0_30px_rgba(255,51,51,0.5)]"
          >
            <span className="text-xl">⚠️</span>
            <span className="text-white font-bold text-sm uppercase tracking-widest">Focus Lost! -5s Penalty applied.</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-start gap-8 lg:gap-16 flex-1 mt-12 relative">
        
        {/* Left Column: Quiz Content */}
        <div className="w-full lg:flex-1 flex flex-col items-center">
        
        {/* Header / Progress */}
        <div className="w-full mb-16">
          <div className="flex justify-between items-center mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">
            <div className="flex items-center gap-4">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              {/* 🔥 Streak Counter */}
              <AnimatePresence>
                {streak >= 2 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: showStreakBurst ? 1.4 : 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/50 text-orange-400"
                  >
                    <span className="text-base">🔥</span>
                    <span className="text-orange-300 font-black">{streak} Streak!</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => { toggleVoice(); playUISound("click"); }}
                 className={`flex items-center gap-2 px-3 py-1 rounded border transition-colors ${
                   isVoiceEnabled ? "border-primary text-primary bg-primary/10" : "border-border text-gray-500 hover:text-white"
                 }`}
               >
                 {isVoiceEnabled ? '🔊 Voice On' : '🔇 Voice Off'}
               </button>
               {/* ⏭️ Skip Button */}
               <button
                 onClick={handleSkip}
                 disabled={skipsLeft <= 0 || !!currentAnswer || showFeedback}
                 title={skipsLeft <= 0 ? "Skip used" : "Skip this question (−3s)"}
                 className={`flex items-center gap-1 px-3 py-1 rounded border transition-all text-[10px] font-black uppercase tracking-widest ${
                   skipsLeft > 0 && !currentAnswer && !showFeedback
                     ? "border-warning/50 text-warning hover:bg-warning/10"
                     : "border-border/30 text-gray-600 opacity-40 cursor-not-allowed"
                 }`}
               >
                 ⏭ Skip {skipsLeft > 0 ? <span className="text-error font-black ml-1">-3s</span> : "(used)"}
               </button>
               {cheatWarnings > 0 && <span className="text-error mr-4">Infractions: {cheatWarnings}</span>}
               <span className="text-primary">{Math.round(progress)}% Synced</span>
            </div>
          </div>
          {/* Liquid Progress Bar */}
          <div className="w-full h-3 bg-surface rounded-full overflow-hidden relative border border-border">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-secondary shadow-[0_0_15px_rgba(0,240,255,0.8)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 15 }}
            />
          </div>
        </div>

        {/* Question Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 50, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -50, filter: "blur(10px)" }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
            className="w-full mb-12"
          >
            {/* Burning Fuse Timer */}
            <div className="w-full flex justify-between items-center mb-2 text-[10px] font-black uppercase tracking-widest">
              <span className={timeLeft <= 5 ? "text-error" : "text-warning"}>Neural Decay</span>
              <span className={timeLeft <= 5 ? "text-error" : "text-warning"}>00:{timeLeft.toString().padStart(2, '0')}</span>
            </div>
            <div className="w-full h-1 bg-surface-hover rounded-full overflow-hidden mb-8 relative border border-border/50">
              <motion.div 
                className={`absolute top-0 left-0 h-full ${timeLeft <= 5 || showCheatAlert ? "bg-error shadow-[0_0_15px_rgba(255,51,51,0.8)]" : "bg-warning shadow-[0_0_15px_rgba(255,170,0,0.8)]"}`}
                animate={{ width: `${(timeLeft / TIME_PER_QUESTION) * 100}%` }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </div>

            <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-snug mb-8 max-w-3xl">
              {currentQ.question}
            </h2>

            {/* === QUESTION TYPE LABEL === */}
            <div className="mb-6 flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                currentQ.type === "mcq" ? "border-primary/50 text-primary bg-primary/10" :
                currentQ.type === "true_false" ? "border-secondary/50 text-secondary bg-secondary/10" :
                "border-warning/50 text-warning bg-warning/10"
              }`}>
                {currentQ.type === "mcq" ? "⚡ MCQ" : currentQ.type === "true_false" ? "⚖ True / False" : "✏ Fill in the Blank"}
              </div>
            </div>

            {/* === MCQ === */}
            {currentQ.type === "mcq" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQ.options.map((opt, i) => {
                  const isSelected = localSelection === opt || currentAnswer === opt;
                  return (
                    <motion.div
                      key={opt}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1, type: "spring" }}
                      onClick={() => handleOptionSelect(opt)}
                    >
                      <Card 
                        interactive={true}
                        className={`relative group h-full min-h-[100px] flex items-center ${
                          isSelected 
                          ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(0,240,255,0.2)]" 
                          : "border-border hover:border-gray-500 hover:bg-surface-hover"
                        } ${showFeedback ? "pointer-events-none" : ""}`}
                      >
                        {isSelected && (
                          <motion.div 
                             layoutId="activeOption"
                             className="absolute inset-0 bg-primary/5 rounded-2xl pointer-events-none"
                             transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <div className="flex items-center justify-between w-full relative z-10 pr-2">
                          <div className="flex items-center gap-4">
                             <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                               isSelected ? "bg-primary text-black" : "bg-surface text-gray-400 group-hover:text-white"
                             }`}>
                               {String.fromCharCode(65 + i)}
                             </div>
                             <span className={`font-medium ${isSelected ? "text-white" : "text-gray-300"}`}>
                               {opt}
                             </span>
                          </div>
                          <div className="hidden lg:flex shrink-0 w-6 h-6 border border-border bg-black rounded items-center justify-center text-[10px] text-gray-600 font-bold group-hover:border-primary/50 group-hover:text-primary transition-colors">
                             {i + 1}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* === TRUE / FALSE === */}
            {currentQ.type === "true_false" && (
              <div className="grid grid-cols-2 gap-6 max-w-lg">
                {["True", "False"].map((opt) => {
                  const isSelected = localSelection === opt || currentAnswer === opt;
                  return (
                    <motion.div
                      key={opt}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", bounce: 0.4 }}
                      onClick={() => handleOptionSelect(opt)}
                      className={`cursor-pointer rounded-2xl border-2 p-8 flex flex-col items-center justify-center gap-3 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/15 shadow-[0_0_25px_rgba(0,240,255,0.3)]"
                          : "border-border bg-surface hover:bg-surface-hover"
                      } ${showFeedback ? "pointer-events-none" : ""}`}
                    >
                      <span className="text-4xl">{opt === "True" ? "✓" : "✕"}</span>
                      <span className={`font-black text-xl uppercase tracking-widest ${
                        isSelected ? (opt === "True" ? "text-success" : "text-error") : "text-gray-400"
                      }`}>{opt}</span>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* === FILL IN THE BLANK === */}
            {currentQ.type === "fill_blank" && (
              <FillBlankInput
                onSubmit={handleEvaluate}
                currentAnswer={currentAnswer || ""}
              />
            )}

            {/* === AI HINT BUTTON & REVEAL === */}
            {!currentAnswer && currentQ.hint && (
              <div className="mt-8 flex flex-col items-center">
                {!showHint ? (
                  <button 
                    onClick={handleRequestHint}
                    disabled={timeLeft <= 4}
                    className="flex items-center gap-2 text-warning hover:text-warning/80 text-xs font-bold uppercase tracking-widest border border-warning/30 hover:border-warning/80 px-4 py-2 rounded-full transition-all bg-warning/5 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    🧠 Request AI Hint <span className="text-error bg-error/20 px-2 py-0.5 rounded ml-1 font-black">-4s Penalty</span>
                  </button>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="bg-warning/10 border border-warning/50 text-warning px-6 py-4 rounded-xl max-w-lg text-sm text-center shadow-[0_0_30px_rgba(255,170,0,0.15)] relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-warning to-error" />
                    <span className="font-black uppercase tracking-widest block mb-1 text-[10px] text-warning/70">Neural Clue Unlocked</span>
                    <span className="font-medium inline-block">{currentQ.hint}</span>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {showFeedback && (
           <motion.div 
             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
             className={`w-full p-6 rounded-2xl border-2 mb-8 ${isAnswerCorrectLocally ? 'bg-success/10 border-success shadow-[0_0_30px_rgba(0,255,136,0.15)]' : 'bg-error/10 border-error shadow-[0_0_30px_rgba(255,51,51,0.15)]'}`}
           >
             <div className="flex items-center gap-4 mb-3">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${isAnswerCorrectLocally ? 'bg-success text-black' : 'bg-error text-white'}`}>
                 {isAnswerCorrectLocally ? '✓' : '✕'}
               </div>
               <div>
                  <h3 className={`font-black text-xl uppercase tracking-widest ${isAnswerCorrectLocally ? 'text-success' : 'text-error'}`}>
                    {isAnswerCorrectLocally ? 'Protocol Verified' : currentAnswer === "SYSTEM_TIMEOUT" ? 'Time Expired' : 'Neural Mismatch'}
                  </h3>
                  {!isAnswerCorrectLocally && (
                    <div className="text-sm text-gray-300 mt-1">
                      Correct target: <span className="font-bold text-success ml-1">{currentQ.correctAnswer}</span>
                    </div>
                  )}
               </div>
             </div>
             
             <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border">
                <div className="text-[10px] text-primary uppercase font-bold tracking-widest mb-1 relative flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Neural Analysis
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{currentQ.explanation}</p>
             </div>
           </motion.div>
        )}

        <motion.div 
          className="mt-auto w-full pt-8 flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="relative group">
             {!showFeedback ? (
               <Button 
                 size="lg" 
                 onClick={handleEvaluate}
                 disabled={!localSelection}
                 className={`w-full md:w-auto px-16 ${!localSelection ? "opacity-50 pointer-events-none" : ""}`}
                 variant="primary"
               >
                 Evaluate Answer
               </Button>
             ) : (
               <Button 
                 size="lg" 
                 onClick={handleNext}
                 className="w-full md:w-auto px-16"
                 variant={isLastQuestion ? "secondary" : "primary"}
               >
                 {isLastQuestion ? "Finalize Protocol" : "Next Data Point"}
               </Button>
             )}
             
             {/* Enter Key Hint */}
             {(localSelection || showFeedback) && (
               <div className="absolute -top-6 text-center w-full hidden md:block text-[10px] uppercase tracking-widest text-primary/70 font-bold">
                 Press Enter ↵
               </div>
             )}
          </div>
        </motion.div>
        </div>

        {/* Right Column: AI Character (Sticky) */}
        <div className="hidden lg:flex flex-col items-center shrink-0 w-[300px] xl:w-[350px] sticky top-32">
           <div className="relative">
              <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
              <AICharacter />
           </div>
           
           <div className="mt-12 text-center border border-border bg-surface-hover/30 px-6 py-4 rounded-xl shadow-lg backdrop-blur-md">
              <div className="text-[10px] uppercase font-bold tracking-widest text-primary mb-1 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Neural Observer Active
              </div>
              <p className="text-xs text-gray-500">
                Evaluating cognitive fidelity and bio-metric responses in real-time.
              </p>
           </div>
        </div>
      </div>
    </main>
  );
}
