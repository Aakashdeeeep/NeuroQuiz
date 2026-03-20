"use client";

import { useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/Button";
import { AICharacter } from "@/components/ui/AICharacter";
import FloatingDecorations from "@/components/ui/FloatingDecorations";
import { useQuizStore } from "@/store/useQuizStore";
import { SignInButton, useAuth, UserButton } from "@clerk/clerk-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const SplitText = ({ text, className, wordClass = "hero-word" }: { text: string, className?: string, wordClass?: string }) => {
  return (
    <div className={className} style={{ display: "inline-block" }}>
      {text.split(" ").map((word, i) => (
        <span key={i} className="inline-block whitespace-nowrap items-baseline">
          <span className="inline-block overflow-hidden pb-4 -mb-4">
            <span className={`${wordClass} inline-block min-w-[0.5rem] transform translate-y-full opacity-0`}>{word}</span>
          </span>
          {i !== text.split(" ").length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </div>
  );
};

const ScrubText = ({ text, className }: { text: string, className?: string }) => {
  return (
    <div className={`${className} scrub-container`} style={{ display: "inline-block" }}>
      {text.split(" ").map((word, i) => (
        <span key={i} className="inline-block whitespace-nowrap">
          <span className="scrub-word inline-block opacity-20 text-foreground">{word}</span>
          {i !== text.split(" ").length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </div>
  );
};


export default function Home() {
  const navigate = useNavigate();
  const container = useRef<HTMLDivElement>(null);
  const { history } = useQuizStore();
  const { isSignedIn } = useAuth();

  // Compute best score from history
  const bestAttempt = useMemo(() => {
    return history.length > 0
      ? history.reduce((best, cur) => {
          const curPct = (cur.score / cur.totalQuestions) * 100;
          const bestPct = (best.score / best.totalQuestions) * 100;
          return curPct > bestPct ? cur : best;
        })
      : null;
  }, [history]);

  useGSAP(() => {
    // Parallax background
    gsap.to(".bg-parallax", {
      yPercent: 50,
      ease: "none",
      scrollTrigger: {
        trigger: container.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

    // Staggered Title Text Reveal (Hero)
    const titleWords = gsap.utils.toArray(".hero-word");
    gsap.fromTo(titleWords,
       { y: "150%", opacity: 0 },
       { y: "0%", opacity: 1, duration: 1.2, stagger: 0.08, ease: "power4.out", delay: 0.1 }
    );

    // Staggered Title Text Reveal (Scroll triggers)
    const scrollHeadings = gsap.utils.toArray(".scroll-heading") as HTMLElement[];
    scrollHeadings.forEach((heading) => {
      const words = heading.querySelectorAll(".scroll-word");
      gsap.fromTo(words,
        { y: "150%", opacity: 0 },
        {
          y: "0%", opacity: 1, duration: 1, stagger: 0.05, ease: "power3.out",
          scrollTrigger: {
            trigger: heading,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );
    });

    // Fade up sections on scroll
    const sections = gsap.utils.toArray(".scroll-section") as HTMLElement[];
    sections.forEach((sec) => {
      gsap.fromTo(sec, 
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1, scale: 1, duration: 1, ease: "power3.out",
          scrollTrigger: {
            trigger: sec,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );
    });

    // Word Scrub opacity animation linked strictly to scroll
    const scrubContainers = gsap.utils.toArray(".scrub-container") as HTMLElement[];
    scrubContainers.forEach((scrubBox) => {
      const words = scrubBox.querySelectorAll(".scrub-word");
      gsap.to(words, {
        opacity: 1,
        color: "#00f0ff", // Lights up in primary color
        stagger: 0.1,
        scrollTrigger: {
          trigger: scrubBox,
          start: "top 80%",
          end: "bottom 50%",
          scrub: 1, // Adds a 1 second smoothing to the scrub 
        }
      });
    });

  }, { scope: container });

  return (
    <main ref={container} className="relative w-full min-h-screen flex flex-col items-center overflow-x-hidden">
      {/* Background radial gradients for depth (parallax) */}
      <div className="bg-parallax absolute top-0 left-[-10%] w-[50%] h-[100vh] bg-primary/20 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="bg-parallax absolute top-[100vh] right-[-10%] w-[50%] h-[100vh] bg-secondary/10 blur-[150px] rounded-full pointer-events-none z-0" />
      
      {/* Navbar Fixed */}
      <div className="fixed top-0 w-full flex justify-between items-center z-50 py-6 px-8 md:px-24 bg-background/50 backdrop-blur-lg border-b border-border">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="font-bold text-2xl tracking-tighter cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          KNOWLEDGE<span className="text-primary">LAB</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
          {bestAttempt && (
            <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-[10px] font-bold uppercase tracking-widest">
              <span className="text-primary">🏆 Record:</span>
              <span className="text-foreground">{Math.round((bestAttempt.score / bestAttempt.totalQuestions) * 100)}%</span>
              <span className="text-gray-500">· {bestAttempt.topic.substring(0, 14)}...</span>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>History</Button>
          
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <Button size="sm" variant="primary" className="text-xs">Authenticate</Button>
            </SignInButton>
          ) : (
            <UserButton appearance={{ elements: { userButtonAvatarBox: "w-9 h-9 border border-primary hover:border-white transition-colors" } }} />
          )}
        </motion.div>
      </div>

      {/* Hero Section */}
      <section className="relative w-full h-[100vh] flex flex-col items-center justify-center z-10 px-4 pt-20 overflow-hidden">
        <FloatingDecorations />
        <div className="text-center w-full max-w-5xl flex flex-col items-center">
          
          <h1
            className="font-black tracking-tighter uppercase mb-4 leading-[0.9] overflow-visible"
            style={{ fontSize: 'clamp(3rem, 10vw, 9rem)' }}
          >
            <SplitText text="Train Your" /> <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              <SplitText text="Mind With AI" />
            </span>
          </h1>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 1, type: "spring" }}
            className="-mt-2 mb-6 h-56 flex items-center justify-center"
          >
            <AICharacter />
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
            className="text-gray-400 text-lg md:text-2xl max-w-2xl mx-auto font-medium mb-12"
          >
            Scroll down to explore the neural architecture.
          </motion.p>
          <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1, y: [0, 10, 0] }} 
             transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
             className="text-primary text-3xl"
          >
            ↓
          </motion.div>
        </div>
      </section>

      {/* Feature Section 1 */}
      <section className="scroll-section relative w-full min-h-screen py-24 flex items-center justify-center z-10 px-8 lg:px-24 border-t border-border mt-12 bg-surface/10">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
           <div>
             <div className="text-primary font-bold tracking-widest text-sm uppercase mb-4">Phase 01</div>
             <h2 className="scroll-heading text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 overflow-visible">
               <SplitText text="Dynamic Synthesis" wordClass="scroll-word" />
             </h2>
             <ScrubText 
                className="text-xl md:text-2xl text-gray-500 font-medium leading-relaxed mb-8" 
                text="Our neural matrix generates high-fidelity cognitive challenges on demand. Input any scientific, artistic, or logical parameter and watch the AI construct a bespoke evaluation protocol tailored strictly to your topic." 
             />
           </div>
           <div className="w-full aspect-square bg-surface border border-border rounded-3xl glass shadow-[0_0_50px_rgba(176,38,255,0.1)] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none" />
              <div className="text-9xl text-secondary opacity-50 font-black relative z-10">⚡</div>
           </div>
        </div>
      </section>

      {/* Feature Section 2 */}
      <section className="scroll-section relative w-full min-h-[80vh] py-24 flex flex-col items-center justify-center z-10 px-8 lg:px-24 bg-surface/30 border-y border-border">
         <div className="max-w-5xl text-center">
            <h2 className="scroll-heading text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 overflow-visible">
               <SplitText text="Real-Time Adaptation" wordClass="scroll-word" />
            </h2>
            <ScrubText 
               className="text-2xl md:text-3xl text-gray-500 font-medium leading-relaxed mb-16" 
               text="The Lab's AI monitors your response tempo and accuracy, grading your fidelity and percentile. We capture every synaptic sequence into the archive for future recalibration."
            />
            
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <div className="px-8 py-6 bg-background border border-border rounded-2xl shadow-xl">
                 <div className="text-primary text-5xl font-black mb-2">98%</div>
                 <div className="text-sm text-gray-400 uppercase tracking-widest font-bold">Retention Rate</div>
              </div>
              <div className="px-8 py-6 bg-background border border-border rounded-2xl shadow-xl">
                 <div className="text-secondary text-5xl font-black mb-2">&lt;0.5s</div>
                 <div className="text-sm text-gray-400 uppercase tracking-widest font-bold">Calculation Latency</div>
              </div>
            </div>
         </div>
      </section>

      {/* CTA Section */}
      <section className="scroll-section relative w-full h-[80vh] flex flex-col items-center justify-center z-10 px-4 text-center">
        <h2 className="scroll-heading text-5xl md:text-[6rem] font-black uppercase tracking-tighter mb-12 leading-[0.9] overflow-visible">
           <SplitText text="Ready to" wordClass="scroll-word" /> <br/>
           <span className="text-primary"><SplitText text="Proceed?" wordClass="scroll-word" /></span>
        </h2>
        
        <div className="mt-8 scale-110">
          <Button size="lg" onClick={() => navigate('/setup')} className="text-2xl px-16 py-8 rounded-full shadow-[0_0_30px_rgba(0,240,255,0.3)]">
            Initiate Protocol
          </Button>
        </div>
      </section>
      
      {/* Bottom footer */}
      <footer className="w-full py-12 text-center text-xs text-gray-600 uppercase tracking-widest z-10 border-t border-border mt-auto">
        ©2024 KNOWLEDGE LAB. FOR THE BRAVE.
      </footer>
    </main>
  );
}
