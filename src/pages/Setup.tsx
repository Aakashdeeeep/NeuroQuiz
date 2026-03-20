"use client";

import { useState, useEffect, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuizStore } from "@/store/useQuizStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { AICharacter } from "@/components/ui/AICharacter";
import { startAmbientTrack, stopAmbientTrack } from "@/utils/ambientAudio";
import { generateQuiz } from "@/utils/gemini";
import { getChallenge } from "@/lib/firebase";

const HACKER_PHRASES = [
  "BYPASSING_FIREWALL...",
  "EXTRACTING_NEURAL_VECTORS...",
  "CROSS_REF_SEMANTIC_INDEX...",
  "CALIBRATING_SYNAPSE_WEIGHTS...",
  "INJECTING_KNOWLEDGE_GRAPH...",
  "COMPILING_EVALUATION_MATRIX...",
  "ALLOCATING_COGNITIVE_BUFFER...",
  "RUNNING_ENTROPY_ANALYSIS...",
  "SYNTHESIZING_DATASET...",
  "ENCRYPTING_RESPONSE_PAYLOAD...",
];

function SetupContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setConfig, setIsGenerating, isGenerating, setQuestions, startQuiz, setAiReaction, setChallengeId } = useQuizStore();
  
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [numQuestions, setNumQuestions] = useState("5");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [hackerPhrase, setHackerPhrase] = useState(HACKER_PHRASES[0]);
  const isChallenge = searchParams.get('challenge') === 'true';
  const incomingChallengeId = searchParams.get('challengeId');
  const [isChallengeLoading, setIsChallengeLoading] = useState(false);

  // Ambient audio on mount
  useEffect(() => {
    startAmbientTrack();
    return () => stopAmbientTrack();
  }, []);

  // Cycle hacker phrases during generation
  useEffect(() => {
    if (!isGenerating) return;
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % HACKER_PHRASES.length;
      setHackerPhrase(HACKER_PHRASES[idx]);
    }, 800);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Support Challenge Links from other users
  useEffect(() => {
    if (incomingChallengeId) {
      setIsChallengeLoading(true);
      getChallenge(incomingChallengeId).then(data => {
        if (data) {
          setTopic(data.topic);
          setDifficulty(data.difficulty);
          setNumQuestions(data.numQuestions.toString());
        } else {
          setError("Challenge link is invalid or expired.");
        }
        setIsChallengeLoading(false);
      });
    } else if (isChallenge) {
      const t = searchParams.get('topic');
      const d = searchParams.get('difficulty');
      const n = searchParams.get('numQuestions');
      if (t) setTopic(decodeURIComponent(t));
      if (d && ["Easy", "Medium", "Hard"].includes(d)) setDifficulty(d as any);
      if (n) setNumQuestions(n);
    }
  }, [incomingChallengeId, isChallenge, searchParams]);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Please enter a research topic.");
      return;
    }
    const qCount = parseInt(numQuestions);
    if (isNaN(qCount) || qCount < 5 || qCount > 20) {
      setError("Please enter a valid number of questions (5-20).");
      return;
    }

    setError("");
    setIsGenerating(true);
    setAiReaction("thinking");
    setConfig({ topic: topic.trim(), difficulty, numQuestions: qCount });

    try {
      if (incomingChallengeId) {
        // Pre-fetched exact questions from Firebase
        const data = await getChallenge(incomingChallengeId);
        if (!data || !data.questions) throw new Error("Could not retrieve challenge questions.");
        setQuestions(data.questions);
        setChallengeId(incomingChallengeId); // Mark as challenge in store
      } else {
        // New organic generation
        const data = await generateQuiz({ topic: topic.trim(), difficulty, numQuestions: qCount });
        if (!data.questions || data.questions.length === 0) throw new Error("No questions generated.");
        setQuestions(data.questions);
        setChallengeId(null);
      }
      
      startQuiz();
      navigate("/quiz");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during neural synthesis. Target API might be rate limited.");
      setAiReaction("sad");
      setTimeout(() => setAiReaction("none"), 4000);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center py-12 px-4 md:px-24">
      {/* Background elements */}
      <div className="fixed top-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[150px] rounded-full" />
      </div>

      <div className="w-full flex justify-between items-center z-10 mb-12">
        <motion.div 
           initial={{ opacity: 0 }} animate={{ opacity: 1 }}
           className="font-bold text-xl tracking-tighter cursor-pointer"
           onClick={() => navigate('/')}
        >
          KNOWLEDGE<span className="text-secondary">LAB</span>
        </motion.div>
      </div>

      <div className="z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center flex-1">
        
        {/* Left Column - Setup Form */}
        <motion.div
           initial={{ opacity: 0, x: -50 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-foreground to-gray-500">
            The <br/> <span className="text-primary">Laboratory</span>
          </h1>
          <p className="text-gray-400 mb-8 max-w-md bg-surface p-4 border-l-2 border-primary text-sm">
            Engineer high-fidelity assessments using our neural synthesis engine. Define your parameters and let the AI architect your challenge.
          </p>

          <Card className="max-w-md w-full" interactive={false}>
            <div className="flex flex-col gap-6">
              <Input 
                label="Research Topic" 
                placeholder="e.g. Quantum Electrodynamics" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                error={error.includes("topic") ? error : undefined}
                disabled={isGenerating || !!incomingChallengeId}
              />

              <div className="flex flex-wrap gap-2 mt-[-1rem]">
                {["System Design", "Microservices", "React Hooks", "GraphQL", "Cybersecurity", "Astrophysics", "World War II"].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setTopic(cat)}
                    className="text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full border border-border/50 bg-surface hover:bg-primary/10 hover:border-primary/50 text-gray-400 hover:text-primary transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-3">
                  Complexity Level
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["Easy", "Medium", "Hard"].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      disabled={isGenerating || !!incomingChallengeId}
                      onClick={() => setDifficulty(lvl as "Easy" | "Medium" | "Hard")}
                      className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wide border transition-all ${
                        difficulty === lvl 
                        ? (lvl === "Hard" ? "bg-error/20 border-error text-error" : (lvl === "Easy" ? "bg-success/20 border-success text-success" : "bg-primary/20 border-primary text-primary"))
                        : "bg-surface border-border text-gray-400 hover:border-gray-500"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex justify-between">
                  <span>Data Points (Questions)</span>
                  <span className="text-foreground text-lg">{numQuestions}</span>
                </label>
                <input 
                  type="range" 
                  min="5" max="20" 
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  disabled={isGenerating || !!incomingChallengeId}
                  className="w-full accent-secondary h-2 bg-surface rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {error && !error.includes("topic") && (
                <p className="text-error text-xs font-bold uppercase">{error}</p>
              )}

              <div className="flex gap-4 mt-4 w-full">
                <Button 
                  onClick={handleGenerate} 
                  className="flex-1 h-14 shadow-[0_0_20px_rgba(0,240,255,0.3)]" 
                  variant={isGenerating ? "glass" : "primary"}
                  disabled={isGenerating || isChallengeLoading}
                >
                  {isGenerating 
                    ? hackerPhrase
                    : isChallengeLoading 
                      ? "Decrypting Challenge..." 
                      : incomingChallengeId 
                        ? "🚀 Accept Challenge" 
                        : "▶ Initialize Protocol"
                  }
                </Button>
                
                {!isGenerating && !isChallenge && topic.trim() && (
                  <button
                    onClick={() => {
                      const url = new URL(window.location.href);
                      url.searchParams.set('challenge', 'true');
                      url.searchParams.set('topic', encodeURIComponent(topic));
                      url.searchParams.set('difficulty', difficulty);
                      url.searchParams.set('numQuestions', numQuestions.toString());
                      navigator.clipboard.writeText(url.toString());
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className={`h-14 px-6 rounded-xl border flex items-center justify-center transition-all ${copied ? 'bg-success/20 border-success text-success' : 'bg-surface border-border text-gray-400 hover:text-secondary hover:border-secondary'}`}
                    title="Copy Challenge Link"
                  >
                    {copied ? '✓' : '🔗'}
                  </button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Right Column - Status/Visuals */}
        <motion.div
           initial={{ opacity: 0, x: 50 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.6, delay: 0.2 }}
           className="flex flex-col items-center justify-center relative min-h-[400px] hidden md:flex"
        >
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_10%,transparent_100%)] pointer-events-none" />
          
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div 
                key="generating"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center"
              >
                <div className="scale-75 origin-center">
                  <AICharacter />
                </div>
                <motion.div 
                  className="mt-8 text-primary font-mono bg-primary/10 px-4 py-2 rounded border border-primary/30 tracking-widest text-xs uppercase"
                  key={hackerPhrase}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {hackerPhrase}
                </motion.div>
              </motion.div>
            ) : (
              <motion.div 
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center justify-center gap-12"
              >
                {/* AI Character floating idly above parameters */}
                <div className="scale-75 origin-center opacity-80 mt-[-4rem]">
                  <AICharacter />
                </div>
                
                <div className="w-full max-w-sm">
                  <Card interactive={false} className="border-secondary/30 bg-secondary/5 shadow-[0_0_30px_rgba(176,38,255,0.05)]">
                    <h3 className="text-secondary font-bold uppercase tracking-widest text-sm mb-6">Neural Parameters</h3>
                    <div className="space-y-6 text-sm text-gray-300">
                      <div className="flex gap-4 items-start">
                        <div className="text-primary text-xl mt-[-2px]">⚙</div>
                        <div>
                          <div className="text-foreground font-bold text-xs uppercase mb-1">Active Context Window</div>
                          <div className="text-xs text-gray-500 leading-relaxed">Engineered with Gemini Flash 2.5 architecture for extreme topic depth and precise neural synthesis.</div>
                        </div>
                      </div>
                      <div className="flex gap-4 items-start">
                        <div className="text-success text-xl mt-[-2px]">✓</div>
                        <div>
                          <div className="text-white font-bold text-xs uppercase mb-1">Source Verification</div>
                          <div className="text-xs text-gray-500 leading-relaxed">Cross-referencing global data vectors in real-time to ensure absolute accuracy of dynamic generation.</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </main>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-primary font-black uppercase tracking-widest text-sm">Initializing Neural Link...</div>}>
      <SetupContent />
    </Suspense>
  );
}
