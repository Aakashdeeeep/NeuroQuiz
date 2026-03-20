"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import { useQuizStore } from "@/store/useQuizStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useUser } from "@clerk/nextjs";
import { saveChallenge, submitScore } from "@/lib/firebase";
import { Leaderboard } from "@/components/ui/Leaderboard";

function Confetti() {
  const [particles, setParticles] = useState<any[]>([]);
  
  useEffect(() => {
    const colors = ['#00f0ff', '#b026ff', '#ffffff', '#ffdd00', '#ff0055'];
    const newParticles = Array.from({ length: 75 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -20,
      color: colors[Math.floor(Math.random() * colors.length)],
      angle: Math.random() * 360,
      speed: 1 + Math.random() * 3,
      delay: Math.random() * 2,
      isCircle: Math.random() > 0.5
    }));
    setParticles(newParticles);

    const timer = setTimeout(() => setParticles([]), 7000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{ 
             backgroundColor: p.color, 
             left: `${p.x}vw`,
             width: p.isCircle ? '8px' : '6px',
             height: p.isCircle ? '8px' : '12px',
             borderRadius: p.isCircle ? '50%' : '1px'
          }}
          initial={{ y: "-10vh", rotate: 0 }}
          animate={{ y: "110vh", rotate: p.angle + 360 * 3, x: `calc(${p.x}vw + ${(Math.random() - 0.5) * 30}vw)` }}
          transition={{ duration: p.speed + 3, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const { topic, difficulty, questions, answers, endTime, startTime, resetQuiz, challengeId, setChallengeId, updateLatestAttemptChallengeId } = useQuizStore();
  const { user } = useUser();
  
  const [isClient, setIsClient] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const scoreSubmittedRef = useRef(false); // Prevents double leaderboard submission

  // Compute score eagerly (before any conditional return) so Hooks are stable
  const isAnswerCorrect = (q: typeof questions[0], answer: string) => {
    if (q.type === "fill_blank") {
      return answer?.trim().toLowerCase() === q.correctAnswer?.trim().toLowerCase();
    }
    return answer === q.correctAnswer;
  };
  let score = 0;
  questions.forEach((q, i) => { if (isAnswerCorrect(q, answers[i])) score++; });
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const timeTaken = endTime && startTime ? Math.floor((endTime - startTime) / 1000) : 0;
  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;

  useEffect(() => {
    setIsClient(true);
    if (questions.length === 0) {
      router.push("/");
    }
  }, [questions, router]);

  // Auto-submit score to leaderboard if this is a Shared Challenge
  // Must be above conditional return to satisfy React's Rules of Hooks
  useEffect(() => {
    // Guard: only submit once per page visit
    if (challengeId && isClient && questions.length > 0 && !scoreSubmittedRef.current) {
      scoreSubmittedRef.current = true;
      submitScore(challengeId, {
        userName: user?.firstName || "Anonymous Protocol",
        score,
        accuracy: percentage,
        timeTaken
      }).catch(console.error);
    }
  }, [challengeId, isClient]);

  if (!isClient || questions.length === 0) return null;

  const handleRetake = () => {
    resetQuiz();
    router.push("/setup");
  };

  const generateHoloCertificate = () => {
    // Holographic Cyberpunk SVG Certificate
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
      <defs>
        <radialGradient id="bgGlow" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#1a0033" />
          <stop offset="100%" stopColor="#030005" />
        </radialGradient>
        <linearGradient id="primary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00f0ff" />
          <stop offset="100%" stopColor="#b026ff" />
        </linearGradient>
        <filter id="neonGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 240, 255, 0.05)" stroke-width="1"/>
        </pattern>
      </defs>
      
      <rect width="800" height="450" fill="url(#bgGlow)"/>
      <rect width="800" height="450" fill="url(#grid)"/>
      
      <!-- Tech Border -->
      <rect x="20" y="20" width="760" height="410" fill="none" stroke="url(#primary)" stroke-width="2" rx="15" ry="15"/>
      <path d="M 20 50 L 50 20 M 750 20 L 780 50 M 20 400 L 50 430 M 750 430 L 780 400" stroke="#00f0ff" stroke-width="3" fill="none"/>
      
      <!-- Header -->
      <text x="400" y="80" font-family="monospace" font-size="32" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="8">KNOWLEDGE<tspan fill="#b026ff">LAB</tspan></text>
      <text x="400" y="110" font-family="monospace" font-size="12" font-weight="bold" fill="#00f0ff" text-anchor="middle" letter-spacing="4">NEURAL CERTIFICATION OF EXCELLENCE</text>
      
      <line x1="200" y1="140" x2="600" y2="140" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
      
      <!-- Content Area -->
      <text x="400" y="200" font-family="sans-serif" font-size="16" fill="#8892b0" text-anchor="middle">This certifies cognitive dominance in the topic:</text>
      <text x="400" y="250" font-family="monospace" font-size="38" font-weight="900" fill="#ffffff" text-anchor="middle" text-transform="uppercase" filter="url(#neonGlow)">
        ${(topic || "KNOWLEDGE PROTOCOL").substring(0, 30)}
      </text>
      
      <!-- Performance Metrics -->
      <g transform="translate(150, 340)">
        <text x="0" y="0" font-family="monospace" font-size="36" font-weight="900" fill="${percentage >= 50 ? '#00ff88' : '#ff3333'}">${percentage}%</text>
        <text x="0" y="25" font-family="sans-serif" font-size="10" font-weight="bold" fill="#8892b0" letter-spacing="2">RETENTION</text>
      </g>
      
      <g transform="translate(400, 340)">
        <text x="0" y="0" font-family="monospace" font-size="36" font-weight="900" fill="#ffffff" text-anchor="middle">${minutes}:${seconds.toString().padStart(2, '0')}</text>
        <text x="0" y="25" font-family="sans-serif" font-size="10" font-weight="bold" fill="#8892b0" letter-spacing="2" text-anchor="middle">TIME LATENCY</text>
      </g>
      
      <g transform="translate(650, 340)">
        <text x="0" y="0" font-family="monospace" font-size="36" font-weight="900" fill="#00f0ff" text-anchor="end">${score}/${questions.length}</text>
        <text x="0" y="25" font-family="sans-serif" font-size="10" font-weight="bold" fill="#8892b0" letter-spacing="2" text-anchor="end">ACCURACY</text>
      </g>
      
      <!-- Footer Details -->
      <text x="40" y="405" font-family="sans-serif" font-size="10" font-weight="bold" fill="rgba(255,255,255,0.3)">ISSUED: ${new Date().toISOString().split('T')[0]}</text>
      <text x="760" y="405" font-family="sans-serif" font-size="10" font-weight="bold" fill="rgba(255,255,255,0.3)" text-anchor="end">ID: KL-${Math.random().toString(36).substring(2,8).toUpperCase()}</text>
    </svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `KnowledgeLab_Certificate_${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleChallengeLink = async () => {
    setIsPublishing(true);
    setPublishError("");
    let linkId = challengeId;
    
    try {
      // If not already a shared challenge, publish it to Firebase
      if (!linkId) {
        linkId = await saveChallenge({
          topic: topic || "Knowledge Protocol",
          difficulty: difficulty || "Hard",
          numQuestions: questions.length,
          questions
        });
        if (linkId) {
          setChallengeId(linkId);
          // Patch the creator's most recent History entry with the challengeId
          // so their History page also shows the Leaderboard tab
          updateLatestAttemptChallengeId(linkId);
          // Also auto-submit the creator's score so they appear on their own leaderboard!
          await submitScore(linkId, {
            userName: user?.firstName || "Creator",
            score,
            accuracy: percentage,
            timeTaken
          });
        }
      }

      const url = new URL(window.location.origin + '/setup');
      if (linkId) {
         url.searchParams.set('challengeId', linkId);
      } else {
         // Fallback if Firebase fails or isn't configured
         setPublishError("⚠️ Firebase not reached. Sharing basic link.");
         url.searchParams.set('challenge', 'true');
         url.searchParams.set('topic', encodeURIComponent(topic || "Knowledge Protocol"));
         url.searchParams.set('difficulty', difficulty || 'Hard'); 
         url.searchParams.set('numQuestions', questions.length.toString());
      }
      
      const finalUrl = url.toString();
      navigator.clipboard.writeText(finalUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);

      const darkColor = document.documentElement.getAttribute('data-theme') === 'light' ? '#0a0e17' : '#00f0ff';
      const qrUrl = await QRCode.toDataURL(finalUrl, { 
        width: 300, 
        margin: 2, 
        color: { dark: darkColor, light: '#00000000' } 
      });
      setQrCodeDataUrl(qrUrl);
      setShowQrModal(true);
    } catch (err) {
      console.error("Challenge link error:", err);
      setPublishError("Failed to publish. Check browser console for details.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center py-12 px-4 md:px-24">
      {percentage >= 70 && <Confetti />}
      
      {/* Background elements */}
      <div className="fixed top-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[30%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full" />
      </div>

      <div className="w-full flex justify-between items-center z-10 mb-12">
        <motion.div 
           initial={{ opacity: 0 }} animate={{ opacity: 1 }}
           className="font-bold text-xl tracking-tighter"
        >
          KNOWLEDGE<span className="text-secondary">LAB</span>
        </motion.div>
      </div>

      <div className="z-10 w-full max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="text-primary font-bold tracking-widest text-sm uppercase mb-2">Analysis Complete</div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 text-foreground">
              Neural <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Evaluation.</span>
            </h1>
            <p className="text-gray-400 max-w-md bg-surface p-4 border-l-2 border-primary text-sm">
              Your cognitive performance has been indexed and mapped against the laboratory benchmarks.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mt-8 md:mt-0 relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center shrink-0"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(176,38,255,0.4)]">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
              <motion.circle 
                cx="50" cy="50" r="45" fill="none" 
                stroke="url(#gradient)" strokeWidth="6"
                strokeDasharray="283"
                initial={{ strokeDashoffset: 283 }}
                animate={{ strokeDashoffset: 283 - (283 * percentage) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00f0ff" />
                  <stop offset="100%" stopColor="#b026ff" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-5xl md:text-6xl font-black">{percentage}</span>
              <span className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">Percentile</span>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="h-full">
             <Card interactive={false} className="h-full">
                <h3 className="text-foreground font-bold uppercase tracking-widest text-lg mb-1">Performance Metrics</h3>
                <div className="text-gray-500 text-[10px] uppercase tracking-widest mb-6">Session Data V2.0</div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl md:text-3xl font-black text-foreground">{score}/{questions.length}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Accuracy</div>
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-black text-foreground">{minutes}:{seconds.toString().padStart(2, '0')}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Tempo</div>
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-black text-foreground">{percentage >= 80 ? 'A+' : percentage >= 60 ? 'B' : 'C'}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Fidelity</div>
                  </div>
                </div>
             </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="h-full">
             <Card interactive={false} className="h-full bg-secondary/5 border-secondary/20">
                <h3 className="text-secondary font-bold uppercase tracking-widest text-sm mb-6">AI Confidence</h3>
             </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="h-full">
            <Card interactive={false} className="h-full flex flex-col justify-center items-center">
              {challengeId ? (
                <div className="w-full flex flex-col h-full">
                   <h3 className="text-secondary font-bold uppercase tracking-widest text-lg mb-4 text-center">Global Leaderboard</h3>
                   <div className="flex-1 overflow-y-auto max-h-48 pr-2">
                     <Leaderboard challengeId={challengeId} />
                   </div>
                </div>
              ) : (
                <>
                  <div className="text-gray-500 text-[10px] uppercase tracking-widest mb-6">Retention Predictor</div>
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 shrink-0 rounded-full border border-secondary flex items-center justify-center relative">
                      <div className="absolute inset-0 border-[3px] border-t-secondary border-r-secondary border-b-transparent border-l-transparent rounded-full animate-spin" style={{ animationDuration: '3s' }} />
                      <span className="font-bold text-foreground text-lg">98%</span>
                    </div>
                    <div className="text-xs text-gray-400 uppercase leading-relaxed font-medium">
                      System probability of knowledge retention is optimal. Neural pathways successfully established.
                    </div>
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[1px] w-12 bg-primary"></div>
            <h2 className="text-xl font-bold uppercase tracking-widest text-foreground">Review Protocol</h2>
          </div>

          <div className="space-y-4">
            {questions.map((q, i) => {
               const isCorrect = isAnswerCorrect(q, answers[i]);
               return (
                  <Card key={i} interactive={false} className={`border ${isCorrect ? 'border-success/30 bg-success/5' : 'border-error/30 bg-error/5'}`}>
                     <div className="flex gap-4">
                        <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center font-bold text-xs ${isCorrect ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <div className="flex-1 text-sm">
                           <h4 className="font-bold text-foreground text-lg mb-4">{q.question}</h4>
                           
                           <div className="bg-surface p-3 rounded-lg border border-border mb-3">
                              <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Your Response</span>
                              <span className={`font-medium ${isCorrect ? 'text-success' : 'text-error'}`}>{answers[i] || 'SYSTEM TIMEOUT / No response'}</span>
                           </div>

                           {!isCorrect && (
                             <div className="bg-surface p-3 rounded-lg border border-success/30 mb-3">
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Correct Protocol</span>
                                <span className="font-medium text-success">{q.correctAnswer}</span>
                             </div>
                           )}

                           <div className="text-gray-400 mt-4 italic">
                             <span className="text-primary not-italic font-bold text-xs uppercase mr-2.5">Analysis:</span>
                             {q.explanation}
                           </div>
                        </div>
                        <div className="shrink-0 pt-1">
                          {isCorrect ? (
                             <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center text-black font-black text-xs">✓</div>
                          ) : (
                             <div className="w-6 h-6 rounded-full bg-error flex items-center justify-center text-white font-black text-xs">✕</div>
                          )}
                        </div>
                     </div>
                  </Card>
               );
            })}
          </div>
        </motion.div>

        <motion.div className="flex flex-col sm:flex-row justify-center items-center flex-wrap gap-6 pb-24" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
          <Button variant="secondary" onClick={generateHoloCertificate} className="px-8 py-4 border border-secondary hover:border-white shadow-[0_0_15px_rgba(176,38,255,0.4)]">
             <span className="mr-2">🖨️</span> Download Certificate
          </Button>
          <div className="flex flex-col items-center gap-2">
            <Button variant="primary" onClick={handleChallengeLink} disabled={isPublishing} className="px-8 py-4 border border-primary hover:border-white shadow-[0_0_15px_rgba(0,240,255,0.4)] relative">
               <span className="mr-2">⚔️</span> {isPublishing ? "Publishing..." : copiedLink ? "Link Copied!" : "Challenge Friend"}
            </Button>
            {publishError && (
              <p className="text-error text-xs font-bold text-center max-w-xs">{publishError}</p>
            )}
          </div>
          <Button variant="ghost" onClick={handleRetake} className="px-8 py-4 bg-surface hover:bg-surface-hover border border-border">
            New Protocol
          </Button>
          <Button variant="ghost" onClick={() => router.push('/history')} className="px-8 py-4 border border-border bg-surface hover:bg-surface-hover hover:border-foreground text-foreground">
            View Archives
          </Button>
        </motion.div>
      </div>

      {/* QR Code Modal for Sharing */}
      <AnimatePresence>
        {showQrModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowQrModal(false)}
          >
             <motion.div
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               exit={{ scale: 0.9, y: 20 }}
               className="bg-background border border-border p-8 rounded-3xl max-w-sm w-full text-center relative shadow-[0_0_50px_rgba(0,240,255,0.2)]"
               onClick={e => e.stopPropagation()}
             >
                <button 
                  onClick={() => setShowQrModal(false)}
                  className="absolute top-6 right-6 text-gray-400 hover:text-foreground"
                >
                  ✕
                </button>
                <div className="text-primary font-bold tracking-widest text-[10px] uppercase mb-2">Protocol Ready</div>
                <h3 className="text-2xl font-black uppercase text-foreground mb-6">Challenge Deployed</h3>
                
                <div className="bg-surface border border-border rounded-xl p-4 mb-6 flex justify-center">
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt="Challenge QR Code" className="w-48 h-48" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-gray-500">Generating...</div>
                  )}
                </div>

                <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                  Scan this code to load these exact neural parameters. The link has also been copied to your clipboard.
                </p>

                <Button variant="primary" className="w-full" onClick={() => setShowQrModal(false)}>
                  Acknowledge
                </Button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
