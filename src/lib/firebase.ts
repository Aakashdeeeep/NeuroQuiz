import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp
} from "firebase/firestore";
import { Question } from "@/store/useQuizStore";

// Your web app's Firebase configuration
// These should be added to the .env.local file by the user!
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase only if the config is valid
const app = (firebaseConfig.apiKey && firebaseConfig.projectId) 
  ? initializeApp(firebaseConfig) 
  : null;

export const db = app ? getFirestore(app) : null;

export interface ChallengeData {
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  numQuestions: number;
  questions: Question[];
  createdAt: any;
}

export interface LeaderboardEntry {
  userName: string;
  score: number;
  accuracy: number;
  timeTaken: number;
  createdAt: any;
}

/**
 * Saves a newly generated quiz to Firestore — with a 10s timeout so it never hangs.
 */
export async function saveChallenge(data: Omit<ChallengeData, "createdAt">): Promise<string | null> {
  if (!db) {
    console.error("Firebase is not configured! Please add keys to .env.local");
    return null;
  }
  try {
    const challengesRef = collection(db, "challenges");

    // Race the Firestore write against a 10-second timeout
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Firestore timeout — check Firestore rules are in Test Mode")), 10000)
    );

    const docRef = await Promise.race([
      addDoc(challengesRef, { ...data, createdAt: serverTimestamp() }),
      timeoutPromise
    ]);

    console.log("✅ Challenge saved with ID:", docRef.id);
    return docRef.id;
  } catch (err) {
    console.error("❌ Error saving challenge (is Firestore in Test Mode?):", err);
    return null;
  }
}

/**
 * Fetches an exact generated quiz Challenge from Firestore by its ID.
 */
export async function getChallenge(challengeId: string): Promise<ChallengeData | null> {
  if (!db) return null;
  
  try {
    const docRef = doc(db, "challenges", challengeId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as ChallengeData;
    }
    return null;
  } catch (err) {
    console.error("Error getting challenge:", err);
    return null;
  }
}

/**
 * Submits a player's score to the Leaderboard for a specific Challenge ID.
 */
export async function submitScore(challengeId: string, entry: Omit<LeaderboardEntry, "createdAt">): Promise<boolean> {
  if (!db) return false;

  try {
    const leaderboardRef = collection(db, "challenges", challengeId, "leaderboard");
    await addDoc(leaderboardRef, {
      ...entry,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error("Error submitting score:", err);
    return false;
  }
}

/**
 * Fetches the Top 10 players for a specific challenge sorted by Score (desc) then TimeTaken (asc).
 */
export async function getLeaderboard(challengeId: string): Promise<LeaderboardEntry[]> {
  if (!db) return [];

  try {
    const leaderboardRef = collection(db, "challenges", challengeId, "leaderboard");
    // To sort by multiple fields, Firebase requires a composite index. 
    // Usually, you sort mostly by Score. 
    const q = query(leaderboardRef, orderBy("score", "desc"), limit(10));
    
    const snapshot = await getDocs(q);
    const allEntries: LeaderboardEntry[] = [];
    snapshot.forEach((doc: any) => {
      allEntries.push(doc.data() as LeaderboardEntry);
    });

    // Deduplicate by userName — keep the best score per player
    const best: Record<string, LeaderboardEntry> = {};
    allEntries.forEach(entry => {
      const key = entry.userName.toLowerCase().trim();
      if (!best[key] || entry.score > best[key].score ||
          (entry.score === best[key].score && entry.timeTaken < best[key].timeTaken)) {
        best[key] = entry;
      }
    });

    return Object.values(best)
      .sort((a, b) => b.score !== a.score ? b.score - a.score : a.timeTaken - b.timeTaken)
      .slice(0, 10);
  } catch (err) {
    console.error("Error getting leaderboard:", err);
    return [];
  }
}
