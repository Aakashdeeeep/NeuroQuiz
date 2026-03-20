import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { 
  collection, query, orderBy, limit, onSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LeaderboardEntry } from "@/lib/firebase";

interface LeaderboardProps {
  challengeId: string;
}

export const Leaderboard = ({ challengeId }: LeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    // ✅ Real-time listener — updates instantly when anyone submits a score
    const leaderboardRef = collection(db, "challenges", challengeId, "leaderboard");
    const q = query(leaderboardRef, orderBy("score", "desc"), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allEntries: LeaderboardEntry[] = [];
      snapshot.forEach((doc) => allEntries.push(doc.data() as LeaderboardEntry));

      // Deduplicate by userName — keep the best score per player
      const best: Record<string, LeaderboardEntry> = {};
      allEntries.forEach(entry => {
        const key = entry.userName.toLowerCase().trim();
        if (!best[key] || entry.score > best[key].score ||
            (entry.score === best[key].score && entry.timeTaken < best[key].timeTaken)) {
          best[key] = entry;
        }
      });

      const sorted = Object.values(best)
        .sort((a, b) => b.score !== a.score ? b.score - a.score : a.timeTaken - b.timeTaken)
        .slice(0, 10);

      setEntries(sorted);
      setLoading(false);
    }, (err) => {
      console.error("Leaderboard listener error:", err);
      setLoading(false);
    });

    // Cleanup listener when component unmounts
    return () => unsubscribe();
  }, [challengeId]);

  if (loading) {
    return (
      <div className="w-full flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent flex items-center justify-center rounded-full animate-spin" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center text-gray-500 py-6 text-sm uppercase tracking-widest font-bold">
        Be the first to leave a mark on this challenge.
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {entries.map((entry, idx) => {
        let badge = <span className="text-gray-500 text-xs font-black">#{idx + 1}</span>;
        if (idx === 0) badge = <span className="text-xl">🏆</span>;
        else if (idx === 1) badge = <span className="text-xl">🥈</span>;
        else if (idx === 2) badge = <span className="text-xl">🥉</span>;

        return (
          <motion.div
            key={entry.userName + idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`flex items-center justify-between p-3 rounded-xl border ${idx === 0 ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(0,240,255,0.2)]' : 'bg-surface border-border'} transition-colors`}
          >
            <div className="flex items-center gap-4">
              <div className="w-8 flex justify-center">{badge}</div>
              <span className={`font-bold uppercase tracking-widest ${idx === 0 ? 'text-primary' : 'text-foreground'}`}>
                {entry.userName}
              </span>
            </div>
            
            <div className="flex flex-col items-end">
              <span className={`font-black text-lg ${idx === 0 ? 'text-primary' : 'text-foreground'}`}>
                {entry.score} <span className="text-xs text-gray-500 font-normal">pts</span>
              </span>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                {Math.floor(entry.timeTaken / 60)}:{String(entry.timeTaken % 60).padStart(2, '0')} · {Math.round(entry.accuracy)}%
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
