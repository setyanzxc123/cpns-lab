import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import { AuthGate } from "@/components/auth-gate";
import { ThemeProvider } from "@/components/theme-provider";
import "katex/dist/katex.min.css";
import "streamdown/styles.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CPNS Lab — Simulasi & Belajar Tes CPNS",
  description:
    "Aplikasi simulasi dan pembelajaran tes CPNS: TWK, TIU, TKP dengan pembahasan, statistik progres, dan tutor AI.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CPNS Lab",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1d4ed8" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-full flex-col bg-background text-foreground transition-colors duration-150">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 has-[.ai-page]:max-w-none has-[.ai-page]:px-4 lg:has-[.ai-page]:px-6 has-[.ai-page]:py-2 sm:has-[.ai-page]:py-3 has-[.ai-page]:pb-2 has-[.ai-page]:overflow-hidden max-md:has-[.ai-page]:pb-[calc(3.5rem+env(safe-area-inset-bottom,_0px))]">
            <AuthGate>{children}</AuthGate>
          </main>
          <footer className="border-t py-4 text-center text-xs text-muted-foreground pb-[max(1rem,env(safe-area-inset-bottom))] max-md:pb-[calc(3.5rem+max(1rem,env(safe-area-inset-bottom)))]">
            CPNS Lab — alat belajar mandiri. Soal contoh, bukan soal resmi BKN.
          </footer>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
