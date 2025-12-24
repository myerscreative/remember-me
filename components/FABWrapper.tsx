"use client";

import { usePathname } from "next/navigation";
import { FloatingVoiceButton } from "@/components/floating-voice-button";
import { QuickAddNoteFAB } from "@/components/QuickAddNoteFAB";

export function FABWrapper() {
  const pathname = usePathname();
  
  // Hide both FABs on contact profile pages
  const isContactProfilePage = /^\/contacts\/[^/]+\/?$/.test(pathname) && !pathname.startsWith('/contacts/new');
  
  if (isContactProfilePage) {
    return null;
  }

  return (
    <>
      <FloatingVoiceButton />
      <QuickAddNoteFAB />
    </>
  );
}
