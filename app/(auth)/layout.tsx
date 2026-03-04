import type { Metadata } from "next";
import { ThemeProvider } from "../providers/theme-provider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to ReMember Me - Keep Track of People Who Matter",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <main className="min-h-screen">
          {children}
        </main>
        <Toaster position="bottom-center" toastOptions={{
          className: 'bg-[#161926] border-emerald-500/30 text-white',
        }} />
      </ThemeProvider>
    </SessionProvider>
  );
}
