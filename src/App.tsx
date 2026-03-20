import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { useQuizStore } from '@/store/useQuizStore';
import Home from '@/pages/Home';
import Setup from '@/pages/Setup';
import Quiz from '@/pages/Quiz';
import Results from '@/pages/Results';
import History from '@/pages/History';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

import { useEffect } from 'react';
import CustomCursor from '@/components/ui/CustomCursor';
import { SettingsPanel } from '@/components/ui/SettingsPanel';

function App({ publishableKey }: { publishableKey: string }) {
  const { appTheme, isOverclocked } = useQuizStore();

  useEffect(() => {
    if (isOverclocked) {
      document.documentElement.setAttribute('data-theme', 'overclocked');
    } else if (appTheme === "light") {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [appTheme, isOverclocked]);

  return (
    <ClerkProvider 
      publishableKey={publishableKey} 
      afterSignOutUrl="/"
      appearance={{ baseTheme: appTheme === 'dark' ? dark : undefined }}
    >
      <Router>
        <CustomCursor />
        <SettingsPanel />
        <div className="absolute inset-0 z-[-1] bg-[radial-gradient(ellipse_at_center,_var(--color-surface)_0%,_var(--background)_100%)]" />
        <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/setup" 
          element={
            <ProtectedRoute>
              <Setup />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/quiz" 
          element={
            <ProtectedRoute>
              <Quiz />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/results" 
          element={
            <ProtectedRoute>
              <Results />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/history" 
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
    </ClerkProvider>
  );
}

export default App;
