"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  href?: string;
  fallbackHref?: string;
  className?: string;
  children?: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  "aria-label"?: string;
}

/**
 * Smart back button: uses router.back() when there's history, otherwise navigates to fallback.
 * Use when the user should return to the previous screen (e.g. contact profile, edit page).
 */
export function BackButton({
  href,
  fallbackHref = "/",
  className,
  children,
  variant = "ghost",
  size = "icon",
  "aria-label": ariaLabel = "Go back",
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(className)}
      aria-label={ariaLabel}
    >
      {children ?? <ChevronLeft className="h-5 w-5" />}
    </Button>
  );
}
