"use client";

import { useEffect } from "react";
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { useQuizStore } from "@/store/useQuizStore";
import CustomCursor from "@/components/ui/CustomCursor";
import { SettingsPanel } from "@/components/ui/SettingsPanel";
import "@/index.css";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

function ThemeManager({ children }: { children: React.ReactNode }) {
  const { appTheme, isOverclocked } = useQuizStore();

  useEffect(() => {
    if (isOverclocked) {
      document.documentElement.setAttribute("data-theme", "overclocked");
    } else if (appTheme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [appTheme, isOverclocked]);

  return <>{children}</>;
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { appTheme } = useQuizStore();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Knowledge Lab - Neural Quiz</title>
        <meta name="description" content="AI-powered quiz application that generates dynamic questions on any topic" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ClerkProvider
          publishableKey={publishableKey}
          afterSignOutUrl="/"
          appearance={{ baseTheme: appTheme === "dark" ? dark : undefined }}
        >
          <ThemeManager>
            <CustomCursor />
            <SettingsPanel />
            <div className="absolute inset-0 z-[-1] bg-[radial-gradient(ellipse_at_center,_var(--color-surface)_0%,_var(--background)_100%)]" />
            {children}
          </ThemeManager>
        </ClerkProvider>
      </body>
    </html>
  );
}
