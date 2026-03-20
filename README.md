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

**On next.js API routes for Gemini**

The quiz generation call is proxied through a Next.js server-side API Route (`/api/generate`). In a purely client-side React app, calling Gemini directly from the browser would expose the API key. By migrating to Next.js App Router, we keep the deployment entirely serverless but perfectly secure the API key backend. The questions still generate in roughly two seconds. We also implemented automatic retry logic with exponential backoff so that if the API rate limits us, the app quietly waits and tries again instead of showing an error.

**On Firebase Firestore for the challenge and leaderboard data**

When you generate a challenge link, the full set of questions gets saved to Firestore under a randomly generated document ID. That ID becomes the URL parameter. When a friend opens the link, the app fetches those exact questions and runs the quiz. When they finish, their score is written into a sub-collection of that same challenge document.

This brings up a question worth answering properly: why not just use a traditional Node.js server with a PostgreSQL or MongoDB database?

The answer comes down to who needs access to the data and how.

In this application, two completely different users — the person who created the challenge and the friend who accepted it — both need to read and write to the exact same record in the database. In a traditional Node.js setup, you would first have to design a `challenges` table, then a `leaderboard_entries` table with a foreign key relationship back to it. Then you would write REST API routes like `GET /api/challenges/:id` and `POST /api/scores/:id`. Then you would add authentication middleware to verify who is allowed to touch each record. Then you would deploy and maintain that server. Both the creator's browser and the friend's browser would have to go through your server as a middleman on every single request.

With Firestore, there is no server and no schema. Both browsers use the same Firestore SDK and connect directly to the database. The challenge data lives at a path like `challenges/{id}` and scores are written to a sub-collection at `challenges/{id}/leaderboard`. The creator writes to that path when they publish. The friend reads from it when they open the link and writes their score when they finish.

The real-time part is where it really earns its keep. Both users subscribe to an `onSnapshot` listener on the same leaderboard path. The moment any score is submitted, Firestore pushes the updated data to every connected client simultaneously — no polling, no WebSocket server, no infrastructure. The leaderboard updates live on both screens in under a second.

The mental model is this: instead of both users talking to your server who then talks to the database, both users talk directly to the database through a secure, permission-aware API. For a feature like shared challenges where multiple independent users need to collaborate on the same data in real time, this approach cuts the work down from weeks to an afternoon.


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
| Framework | Next.js App Router | Required by hackathon, provides secure API routes and seamless App Router conventions |
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
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
    CLERK_SECRET_KEY=sk_test_...
    NEXT_PUBLIC_GEMINI_API_KEY=AIza...
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=...
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:3000`.

---

## Known Limitations

- Quiz history is stored in `localStorage` and is therefore device-specific. There is no cross-device sync.
- Firebase Firestore is currently running in Test Mode, which means anyone with the database URL can read and write. Security rules should be tightened before moving beyond a demo context.

---

Built by Aakashdeep.
