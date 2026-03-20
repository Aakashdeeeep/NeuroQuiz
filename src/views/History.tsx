"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useQuizStore } from "@/store/useQuizStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Leaderboard } from "@/components/ui/Leaderboard";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function History() {
  const { history, clearHistory, deleteHistoryItem } = useQuizStore();
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, "questions" | "leaderboard">>({});

  // 📊 Calculate Weekly Stats & Heatmap
  const { weeklyStats, heatmapData, maxCount } = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentHistory = history.filter(h => new Date(h.date) >= sevenDaysAgo);
    const topicScores: Record<string, { correct: number, total: number }> = {};
    let totalCorrect = 0;
    let totalQuestions = 0;
    const heatmapCounts = new Array(7).fill(0);
    const dayLabels = new Array(7).fill("");
    for (let i = 0; i < 7; i++) {
        const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        dayLabels[i] = d.toLocaleDateString("en-US", { weekday: 'short' });
    }
    recentHistory.forEach(h => {
       const hDate = new Date(h.date);
       const diffTime = Math.abs(now.getTime() - hDate.getTime());
       const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
       if (diffDays < 7) heatmapCounts[6 - diffDays]++;
       if (!topicScores[h.topic]) topicScores[h.topic] = { correct: 0, total: 0 };
       topicScores[h.topic].correct += h.score;
       topicScores[h.topic].total += h.totalQuestions;
       totalCorrect += h.score;
       totalQuestions += h.totalQuestions;
    });
    let bestTopic = "None"; let worstTopic = "None";
    let highestAcc = -1; let lowestAcc = 101;
    Object.entries(topicScores).forEach(([topic, stats]) => {
        const acc = (stats.correct / stats.total) * 100;
        if (acc > highestAcc) { highestAcc = acc; bestTopic = topic; }
        if (acc < lowestAcc) { lowestAcc = acc; worstTopic = topic; }
    });
    return {
        weeklyStats: {
            quizzesTaken: recentHistory.length,
            avgScore: totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
            bestTopic: bestTopic.length > 15 ? bestTopic.substring(0, 15) + "..." : bestTopic,
            worstTopic: worstTopic.length > 15 ? worstTopic.substring(0, 15) + "..." : worstTopic
        },
        heatmapData: heatmapCounts.map((count, i) => ({ count, label: dayLabels[i] })),
        maxCount: Math.max(...heatmapCounts, 1)
    };
  }, [history]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const getTab = (id: string) => activeTab[id] || "questions";
  const setTab = (id: string, tab: "questions" | "leaderboard") => {
    setActiveTab(prev => ({ ...prev, [id]: tab }));
  };

  return (
    <main className="flex min-h-screen flex-col items-center py-12 px-4 md:px-24">
      <div className="fixed top-0 w-full h-full pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] left-[30%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-4xl z-10 flex flex-col gap-8">
        {/* Header */}
        <div className="flex justify-between items-center bg-surface/80 p-6 rounded-2xl border border-border backdrop-blur-md shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
             <h1 className="text-3xl font-black uppercase tracking-widest text-foreground mb-1">
               Neural <span className="text-secondary">Archives</span>
             </h1>
             <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">
               Past Cognitive Sessions
             </p>
          </motion.div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-xs px-4" onClick={() => clearHistory()} disabled={history.length === 0}>
              Clear Archives
            </Button>
            <Button variant="primary" onClick={() => router.push("/")}>
              Home
            </Button>
          </div>
        </div>

        {/* Weekly Stats */}
        {history.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
             <Card interactive={false} className="col-span-1 lg:col-span-2 border-border/50 bg-surface/30">
               <h3 className="text-secondary font-bold uppercase tracking-widest text-sm mb-6">7-Day Report Card</h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-2xl font-black text-foreground">{weeklyStats.quizzesTaken}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Quizzes Taken</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-primary">{weeklyStats.avgScore}%</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Avg Accuracy</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-success truncate" title={weeklyStats.bestTopic}>{weeklyStats.bestTopic}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Strongest</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-error truncate" title={weeklyStats.worstTopic}>{weeklyStats.worstTopic}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Weakest</div>
                  </div>
               </div>
             </Card>

             <Card interactive={false} className="col-span-1 border-border/50 bg-surface/30 flex flex-col justify-between">
               <h3 className="text-primary font-bold uppercase tracking-widest text-sm mb-4">Activity Heatmap</h3>
               <div className="flex justify-between items-end h-16 gap-1">
                 {heatmapData.map((day, i) => {
                    const heightPct = Math.max((day.count / maxCount) * 100, 10);
                    return (
                      <div key={i} className="flex flex-col items-center gap-2 flex-1 group relative">
                        {day.count > 0 && (
                          <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border text-xs px-2 py-1 rounded">
                            {day.count}
                          </div>
                        )}
                        <div className="w-full bg-surface rounded-sm relative overflow-hidden flex-1 flex items-end">
                           <div className="w-full bg-gradient-to-t from-primary/50 to-primary/80 rounded-sm rounded-t-sm transition-all duration-1000" 
                             style={{ height: `${heightPct}%`, opacity: day.count === 0 ? 0 : 1 }} 
                           />
                        </div>
                        <span className="text-[9px] uppercase tracking-widest text-gray-500">{day.label[0]}</span>
                      </div>
                    )
                 })}
               </div>
             </Card>
          </div>
        )}

        {/* History List */}
        {history.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center p-16 text-center border border-border/50 rounded-2xl bg-surface/30"
          >
            <div className="text-4xl mb-4 opacity-50">📂</div>
            <h2 className="text-lg font-bold text-foreground mb-2 uppercase tracking-widest">No Archival Data Found</h2>
            <p className="text-gray-400 text-sm max-w-sm leading-relaxed mb-6">
              You haven't completed any knowledge protocols yet. Run a neural scan to record performance data.
            </p>
            <Button variant="primary" onClick={() => router.push("/setup")}>Launch Protocol</Button>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {history.map((attempt, index) => {
              const isOpen = expandedId === attempt.id;
              const accuracy = Math.round((attempt.score / attempt.totalQuestions) * 100);
              const tab = getTab(attempt.id);

              return (
                <motion.div 
                  key={attempt.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: index * 0.08 }}
                  className="rounded-2xl border border-border/50 bg-surface/40 overflow-hidden"
                >
                  {/* Card Header - always visible */}
                  <div 
                    className="flex flex-col md:flex-row gap-4 md:items-center justify-between p-6 cursor-pointer hover:bg-surface/60 transition-colors"
                    onClick={() => toggleExpand(attempt.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/70 bg-primary/10 px-2 py-1 rounded">
                          {attempt.difficulty}
                        </span>
                        {attempt.challengeId && (
                          <span className="text-[10px] font-black uppercase tracking-widest text-secondary/70 bg-secondary/10 px-2 py-1 rounded flex items-center gap-1">
                            ⚔️ Challenge
                          </span>
                        )}
                        <span className="text-[10px] font-bold tracking-widest text-gray-500">
                          {new Date(attempt.date).toLocaleString()}
                        </span>
                      </div>
                      <h3 className="font-bold text-xl text-foreground tracking-widest uppercase truncate">
                        {attempt.topic}
                      </h3>
                    </div>

                    <div className="flex items-center gap-6 md:gap-8 flex-shrink-0">
                      <div className="flex flex-col items-center md:items-end">
                        <span className="text-[10px] uppercase text-gray-500 tracking-widest mb-1 font-bold">Accuracy</span>
                        <span className={`text-2xl font-black ${accuracy >= 50 ? 'text-success' : 'text-error'}`}>
                          {attempt.score}<span className="text-gray-600 text-sm">/{attempt.totalQuestions}</span>
                        </span>
                      </div>
                      <div className="flex flex-col items-center md:items-end w-16">
                        <span className="text-[10px] uppercase text-gray-500 tracking-widest mb-1 font-bold">Time</span>
                        <span className="text-lg font-bold text-foreground">
                          {Math.floor(attempt.timeTaken / 60)}:{String(attempt.timeTaken % 60).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${isOpen ? 'border-primary text-primary bg-primary/10' : 'border-border text-gray-500 hover:border-primary/50 hover:text-primary'}`}
                          title="Expand"
                        >
                          {isOpen ? '▲' : '▼'}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteHistoryItem(attempt.id); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-900/20 text-red-500 hover:bg-red-900/50 hover:text-red-400 transition-colors"
                          title="Delete Record"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable section */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border/50 px-6 pb-6 pt-4">
                          {/* Tab Switcher */}
                          <div className="flex gap-2 mb-6">
                            <button
                              onClick={() => setTab(attempt.id, "questions")}
                              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${tab === "questions" ? 'bg-primary text-black' : 'border border-border text-gray-400 hover:border-primary/50 hover:text-primary'}`}
                            >
                              📋 Questions
                            </button>
                            {attempt.challengeId && (
                              <button
                                onClick={() => setTab(attempt.id, "leaderboard")}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${tab === "leaderboard" ? 'bg-secondary text-white' : 'border border-border text-gray-400 hover:border-secondary/50 hover:text-secondary'}`}
                              >
                                🏆 Leaderboard
                              </button>
                            )}
                          </div>

                          {/* Questions Review tab */}
                          {tab === "questions" && (
                            <div className="space-y-4">
                              {(attempt.questions && attempt.questions.length > 0) ? (
                                attempt.questions.map((q, qi) => {
                                  const userAnswer = attempt.userAnswers?.[qi];
                                  const isCorrect = q.type === "fill_blank"
                                    ? userAnswer?.trim().toLowerCase() === q.correctAnswer?.trim().toLowerCase()
                                    : userAnswer === q.correctAnswer;
                                  return (
                                    <div key={qi} className={`p-4 rounded-xl border-2 ${isCorrect ? 'border-success/30 bg-success/5' : 'border-error/30 bg-error/5'}`}>
                                      <div className="flex items-start gap-3">
                                        <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-black text-black ${isCorrect ? 'bg-success' : 'bg-error'}`}>
                                          {isCorrect ? '✓' : '✕'}
                                        </div>
                                        <div className="flex-1">
                                          <p className="font-bold text-foreground text-sm mb-3">{q.question}</p>
                                          {userAnswer && userAnswer !== q.correctAnswer && (
                                            <p className="text-xs text-error font-bold mb-1">Your answer: <span className="font-normal">{userAnswer}</span></p>
                                          )}
                                          <p className="text-xs text-success font-bold mb-2">Correct: <span className="font-normal">{q.correctAnswer}</span></p>
                                          {q.explanation && (
                                            <p className="text-[11px] text-gray-500 leading-relaxed border-l-2 border-primary/30 pl-2">{q.explanation}</p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-center py-6 text-gray-500 text-sm">
                                  <p className="mb-1 font-bold uppercase tracking-widest text-[11px]">Questions not stored</p>
                                  <p className="text-[11px]">Detailed questions are only saved for the 3 most recent quizzes to optimize storage.</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Leaderboard tab */}
                          {tab === "leaderboard" && attempt.challengeId && (
                            <div>
                              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4">
                                Challenge ID: <span className="text-primary font-mono">{attempt.challengeId.substring(0, 8)}...</span>
                              </p>
                              <Leaderboard challengeId={attempt.challengeId} />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
