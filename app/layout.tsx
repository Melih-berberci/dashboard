import type { Metadata } from "next";
import { Inter, Orbitron, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { Toaster } from "sonner";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const orbitron = Orbitron({ 
  subsets: ["latin"],
  variable: "--font-orbitron",
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Chatsubo | Discord Bot Dashboard",
  description: "Gelişmiş Discord bot yönetim sistemi. Neon ışıklar, cyberpunk estetik ve tam kontrol.",
  icons: {
    icon: "/logo.png",
  },
  keywords: ["discord", "bot", "dashboard", "cyberpunk", "panel", "chatsubo"],
  authors: [{ name: "Chatsubo" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning className="dark">
      <body className={`${inter.variable} ${orbitron.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <SessionProvider>
          <ThemeProvider defaultTheme="dark" storageKey="cyberpanel-theme">
            {children}
            <Toaster 
              richColors 
              position="top-right" 
              toastOptions={{
                style: {
                  background: "hsl(240 10% 6%)",
                  border: "1px solid hsl(180 100% 50% / 0.3)",
                  color: "hsl(180 100% 90%)",
                },
              }}
            />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
