# 🧠 Knowledge Lab (NeuroQuiz)

Welcome to **Knowledge Lab**, a futuristic, AI-powered quiz application designed to test your mental limits on literally any topic in the universe. 

Forget boring, pre-written multiple-choice questions. This app generates dynamic, unique quizzes on-the-fly using the power of AI, grades you in real-time, and lets you challenge your friends on global leaderboards.

![Knowledge Lab Screenshot](#) *(Add a screenshot here later!)*

---

## 🚀 Why We Built This
Learning shouldn't feel like staring at a 1990s textbook. We wanted to build something that feels like you're jacking into the Matrix—a sleek, fast, and intensely engaging experience that actually makes you *want* to test your knowledge. 

The goal was simple: **If a user wants to learn about "Quantum Physics" or "14th Century French History", they shouldn't have to wait for us to hire a teacher to write a quiz.** By hooking up a powerful AI, we gave the user the ultimate flexible learning tool.

---

## 🛠 Architecture & The "Why" Behind Our Tech Decisions

If you look under the hood, you might notice something interesting: **We don't have a traditional backend database or a heavy Node.js/Express server.** 

Why? Because the modern web is all about speed, scale, and APIs. Here is exactly what we did and why we did it:

### 1. The "Open API" Backend (Google Gemini AI)
Instead of building a massive, clunky database of a million quiz questions (which would get outdated fast), we hit the **Google Gemini API** directly from the client. 
- **The Why:** This turns the app into a "zero-maintenance" machine. The AI dynamically generates fresh questions, wrong answers, correct answers, and detailed *explanations* every single time you hit "Start". The knowledge base is literally the entire internet.

### 2. The Serverless Cloud (Firebase / Firestore)
When you challenge a friend, we need a place to save the exact quiz you took and track everyone's scores. We used **Firebase Firestore** as an open, real-time NoSQL database.
- **The Why:** Building custom user-auth and websockets for real-time leaderboards is exhausting and expensive. Firebase lets us simply say "save this JSON object" and automatically syncs the leaderboard across everyone's screens instantly via websockets (`onSnapshot`). It's fast, free, and scales infinitely without us writing a single line of backend routing code.

### 3. The Front Door (Clerk Authentication)
We used **Clerk.dev** to handle user logins (Google, GitHub, email).
- **The Why:** Security is hard. Clerk provides a beautiful, pre-built UI and iron-clad security out of the box. We get secure user IDs, profile pictures, and session management in literally three lines of code.

### 4. The Interface (React, Vite, Tailwind, Framer Motion)
The frontend is built for pure speed and aesthetics. 
- **Vite** makes our local development lightning fast.
- **Tailwind CSS** lets us build stunning, glassmorphism UI components without writing messy CSS files.
- **Zustand** acts as our memory bank, keeping track of your history and theme preferences flawlessly.
- **Framer Motion & GSAP** handle the heavy lifting of making buttons super magnetic, cards flip, background elements float organically, and the interactive AI robotic companion react to your clicks.

---

## 🤖 Meet the AI Companion
One of our favorite features is the little robotic face on the home screen. It's not just a PNG! It acts as your guide. If you do well on a quiz, it smiles. If you click it too many times, it "overclocks" and turns the whole application red with alarm sirens. We added this strictly for *joy*—because applications should be fun to use.

---

## 📈 The Neural Archives (Your History)
Every quiz you take is logged locally. We process this data to generate your **Weekly Performance Heatmap** and track your best and worst topics. You can always expand an old quiz to see exactly which questions you got wrong and read the AI's explanation for the correct answer.

---

## 💻 How to Run It Locally

If you want to spin up your own Knowledge Lab, it’s effortless:

1. Clone the repository:
   ```bash
   git clone https://github.com/Aakashdeeeep/NeuroQuiz.git
   cd NeuroQuiz
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Set up your `.env.local` file (You'll need free API keys from Clerk, Google Gemini, and Firebase):
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
   VITE_GEMINI_API_KEY=your_gemini_key
   VITE_FIREBASE_API_KEY=your_firebase_key
   # ... plus the rest of your Firebase config
   ```

4. Start the engine:
   ```bash
   npm run dev
   ```

---
*Built with ❤️ (and a lot of caffeine) by Aakashdeep.*
