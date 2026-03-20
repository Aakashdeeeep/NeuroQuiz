# Knowledge Lab

Knowledge Lab is an AI-powered quiz application that generates unique, exam-quality questions on any topic you can think of. There are no pre-written question banks here — every quiz is created on the fly by a large language model, graded instantly, and logged to your personal history. You can also share a quiz you just took as a challenge link, letting your friends race against your score on a global leaderboard.

The project was built for a hackathon. The goal was to build something that genuinely felt impressive to use, so we went deep on animation, sound design, and user experience to make it feel less like a study tool and more like something you would actually want to open.

---

## What the Application Does

When you open the app, you are asked to type in any topic, pick a difficulty level, and choose how many questions you want. The app sends that request to Google's Gemini AI and gets back a structured JSON response with multiple choice, true/false, and fill-in-the-blank questions — complete with explanations and hints for each one.

Once you finish the quiz, you land on a results page that shows your score, time taken, and accuracy. From there you can generate a shareable challenge link. That link encodes the exact quiz you just took and saves it to a cloud database. When a friend opens that link and finishes the quiz, their score is submitted to a real-time leaderboard that both of you can see instantly, without refreshing the page.

Your quiz history is stored locally and displayed on a separate page where you can see a weekly heatmap of your activity, your best and worst topics, and a detailed review of each past quiz — including which answers you got wrong and the AI's explanation for the correct answer.

---

## Why There Is No Traditional Backend

This is probably the first question anyone who looks at the codebase will ask. There is no Node.js server. There is no REST API we wrote. There is no database schema we designed. Here is the honest reason for each decision:

**On Gemini API called directly from the browser**

The quiz generation call goes from the user's browser directly to Google's Gemini API. In a production application with paying users this would be a problem because your API key would be exposed. But for a hackathon demo, and for a tool where the key usage is tied to your own account, this approach has a significant advantage: there is no server to maintain, no deployment to manage for the generation layer, and no latency added by proxying through a middleman. The questions come back in roughly two seconds. We also implemented automatic retry logic with exponential backoff so that if the API rate limits us, the app quietly waits and tries again instead of showing an error.

**On Firebase Firestore for the challenge and leaderboard data**

When you generate a challenge link, the full set of questions gets saved to Firestore under a randomly generated document ID. That ID becomes the URL parameter. When a friend opens the link, the app fetches those exact questions and runs the quiz. When they finish, their score is written into a sub-collection of that challenge document.

The reason we chose Firestore instead of building a traditional database was the real-time subscription feature. Firestore's `onSnapshot` listener opens a persistent connection and pushes updates to every connected client the millisecond a new document is written. This meant we got a live leaderboard — where scores appear on screen as other people submit — without writing a single line of WebSocket code. It also meant we got horizontal scaling and global replication for free, which would have taken weeks to set up on a self-hosted server.

**On Clerk for authentication**

User authentication is genuinely difficult to get right. Session management, password hashing, OAuth flows, token rotation — each of these is a category of security vulnerability on its own. Clerk handles all of it. We get a beautiful, pre-built sign-in component, Google and GitHub OAuth, secure user sessions, and a user object with a stable ID attached to every request. The integration is three lines of code in our root component. We would have spent a full day building something far less secure.

---

## State Management Design

All client-side state — current quiz, history, theme preference, voice settings, AI character reactions — lives in a Zustand store. Zustand was chosen over Redux because it has almost no boilerplate and the store reads like plain JavaScript functions. The store is wrapped with a `persist` middleware that saves specific fields (`history`, `appTheme`, `isVoiceEnabled`) to `localStorage` automatically, which is how your history and theme preferences survive page refreshes and browser restarts.

One subtle design decision worth noting: we only store the full question and answer data for the three most recent history entries. For entries beyond that, the bulky nested arrays are stripped out and only the metadata is kept. This prevents `localStorage` from hitting its 5MB browser limit even after hundreds of quiz attempts.

---

## The AI Character

The robotic figure on the home screen is not just decorative. It reads reactions from the global store and changes its expression based on your quiz performance. If you click it rapidly five or more times within two seconds, it enters an "overclocked" mode which turns the entire color palette red and plays an alarm sound. The overclock expires after seven seconds and the theme restores itself. This behavior is driven purely by a `isOverclocked` flag in the Zustand store, watched by both the character component and the root `App` component which owns the `data-theme` attribute on the document.

---

## Tech Stack Summary

| Layer | Technology | Why |
|---|---|---|
| Framework | React + Vite | Fast HMR during development, minimal build config |
| Language | TypeScript | Catches type errors before they reach users |
| Styling | Tailwind CSS + CSS variables | Design tokens let the light/dark/overclocked themes share one stylesheet |
| Animation | Framer Motion + GSAP | Framer for component-level transitions, GSAP for scroll-driven effects on the home page |
| State | Zustand with persist middleware | Minimal boilerplate, localStorage sync out of the box |
| Auth | Clerk | Managed OAuth, sessions, and user profiles in three lines |
| AI | Google Gemini (gemini-2.5-flash) | Structured JSON output mode gives predictable question format every time |
| Cloud DB | Firebase Firestore | Real-time subscriptions for live leaderboards, no server required |
| Deployment | Vercel | Zero-config deployment from GitHub with automatic rebuilds on push |

---

## Running Locally

You will need free accounts on Clerk, Google AI Studio (for the Gemini API), and Firebase to get a full working instance.

1.  Clone the repository and install dependencies:
    ```bash
    git clone https://github.com/Aakashdeeeep/NeuroQuiz.git
    cd NeuroQuiz
    npm install
    ```

2.  Create a `.env.local` file in the project root and fill in your keys:
    ```
    VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
    CLERK_SECRET_KEY=sk_test_...
    VITE_GEMINI_API_KEY=AIza...
    VITE_FIREBASE_API_KEY=...
    VITE_FIREBASE_AUTH_DOMAIN=...
    VITE_FIREBASE_PROJECT_ID=...
    VITE_FIREBASE_STORAGE_BUCKET=...
    VITE_FIREBASE_MESSAGING_SENDER_ID=...
    VITE_FIREBASE_APP_ID=...
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:5173`.

---

## Known Limitations

- The Gemini API is called directly from the browser, which exposes the API key in client bundles. This is acceptable for a demo but should be proxied through a server-side function before any public production release.
- Quiz history is stored in `localStorage` and is therefore device-specific. There is no cross-device sync.
- Firebase Firestore is currently running in Test Mode, which means anyone with the database URL can read and write. Security rules should be tightened before moving beyond a demo context.

---

Built by Aakashdeep.
