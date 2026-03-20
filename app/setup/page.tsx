"use client";
import { Suspense } from "react";
import Setup from "@/pages/Setup";
export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-primary">Loading...</div>}>
      <Setup />
    </Suspense>
  );
}
