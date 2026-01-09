import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { SidebarNav } from "@/components/sidebar-nav";
import { ThemeProvider } from "./providers/theme-provider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Toaster } from "sonner";
import { MobileHeader } from "@/components/mobile-header";

export const metadata: Metadata = {
  title: "ReMember Me - Keep Track of People Who Matter",
  description: "A personal CRM to help you remember important details about the people in your life",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ReMember Me",
  },
};

export const viewport: Viewport = {
  themeColor: "#8b5cf6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var localTheme = localStorage.getItem('theme');
                  var sysTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (localTheme === 'dark' || (!localTheme && sysTheme)) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased max-w-full overflow-x-hidden">
        <SessionProvider>
          <ThemeProvider>
            <div className="flex flex-col min-h-screen md:flex-row">
              <SidebarNav />
              <div className="flex-1 md:ml-64 flex flex-col">
                <MobileHeader />
                <main className="flex-1">
                  {children}
                </main>
                <BottomNav />
              </div>
            </div>
            <Toaster position="bottom-center" toastOptions={{
              className: 'bg-[#161926] border-emerald-500/30 text-white',
            }} />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
