import type { Metadata, Viewport } from "next";
import "../globals.css";
import { ThemeProvider } from "../providers/theme-provider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "ReMember Me - Sign In",
  description: "Sign in to ReMember Me - Keep Track of People Who Matter",
};

export const viewport: Viewport = {
  themeColor: "#8b5cf6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: "dark light",
};

export default function AuthLayout({
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
            {/* Auth pages get a clean, centered layout with no navigation */}
            <main className="min-h-screen">
              {children}
            </main>
            <Toaster position="bottom-center" toastOptions={{
              className: 'bg-[#161926] border-emerald-500/30 text-white',
            }} />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
