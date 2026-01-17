"use client";

import { usePathname } from "next/navigation";
import { FloatingVoiceButton } from "@/components/floating-voice-button";
import { QuickAddNoteFAB } from "@/components/QuickAddNoteFAB";

export function FABWrapper() {
  const pathname = usePathname();

  // Show FABs on all pages including contact profile pages
  return (
    <>
      <FloatingVoiceButton />
      <QuickAddNoteFAB />
    </>
  );
}
