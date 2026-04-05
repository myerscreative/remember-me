import type { Metadata } from "next";
import { BottomNav } from "@/components/bottom-nav";
import { SidebarNav } from "@/components/sidebar-nav";
import { DeepLinkHandler } from "@/components/deep-link-handler";
import { SplashScreenHandler } from "@/components/splash-screen-handler";
import { ThemeProvider } from "../providers/theme-provider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Toaster } from "sonner";
import { MobileHeader } from "@/components/mobile-header";

export const metadata: Metadata = {
  title: "ReMember Me - Keep Track of People Who Matter",
  description: "A personal CRM to help you remember important details about the people in your life",
};

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
          <DeepLinkHandler />
          <SplashScreenHandler />
          <ThemeProvider>
            <div className="flex min-h-screen flex-col md:flex-row" style={{ backgroundColor: 'var(--rm-bg-base)' }}>
              <SidebarNav />
              <div className="flex min-h-screen flex-1 flex-col md:ml-64">
                <MobileHeader />
                <main className="flex-1 pb-20 md:min-h-0 md:pb-0">
                  {children}
                </main>
                <BottomNav />
              </div>
            </div>
            <Toaster position="bottom-center" toastOptions={{
              className: 'bg-elevated border-border-default text-text-primary',
            }} />
          </ThemeProvider>
        </SessionProvider>
  );
}
