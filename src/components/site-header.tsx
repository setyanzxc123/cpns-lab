"use client";

// Header navigasi utama + status auth Supabase.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabaseConfigured, createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { GraduationCap, LayoutDashboard, Timer, BookOpen, BarChart3, Library, Bot, LogIn, LogOut, Loader2 } from "lucide-react";

const NAV = [
  { href: "/", label: "Beranda", icon: LayoutDashboard },
  { href: "/simulasi", label: "Simulasi", icon: Timer },
  { href: "/latihan", label: "Latihan", icon: BookOpen },
  { href: "/statistik", label: "Statistik", icon: BarChart3 },
  { href: "/bank", label: "Bank Soal", icon: Library },
  { href: "/ai", label: "Tutor AI", icon: Bot },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!supabaseConfigured()) return;
    const sb = createClient();
    sb.auth.getUser().then(({ data }) => setUser(data.user?.email ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signInEmail(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    setBusy(true);
    try {
      const sb = createClient();
      await sb.auth.signInWithPassword({ email, password });
    } finally {
      setBusy(false);
    }
  }

  async function signUpEmail(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    setBusy(true);
    try {
      const sb = createClient();
      await sb.auth.signUp({ email, password });
    } finally {
      setBusy(false);
    }
  }

  async function signInGoogle() {
    const sb = createClient();
    await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-2.5">
        <Link href="/" className="mr-2 flex items-center gap-2 font-bold text-blue-800 dark:text-blue-400">
          <GraduationCap className="h-6 w-6" />
          <span>CPNS Lab</span>
        </Link>
        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === n.href
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeToggle />
          {mounted && supabaseConfigured() ? (
            user ? (
              <>
                <span className="hidden text-xs text-muted-foreground sm:inline">{user}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const sb = createClient();
                    await sb.auth.signOut();
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Keluar</span>
                </Button>
              </>
            ) : (
              <Dialog>
                <DialogTrigger
                  render={
                    <Button size="sm">
                      <LogIn className="h-4 w-4" /> Masuk
                    </Button>
                  }
                />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Masuk ke CPNS Lab</DialogTitle>
                    <DialogDescription>
                      Riwayat &amp; progres tersinkron antar perangkat via Supabase.
                    </DialogDescription>
                  </DialogHeader>
                  <Button variant="outline" onClick={signInGoogle} className="w-full">
                    Lanjut dengan Google
                  </Button>
                  <div className="relative text-center text-xs text-muted-foreground">
                    <span className="relative z-10 bg-background px-2">atau email</span>
                    <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
                  </div>
                  <form action={signInEmail} className="space-y-2">
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="email@contoh.com"
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    <input
                      name="password"
                      type="password"
                      required
                      minLength={6}
                      placeholder="kata sandi (min. 6 karakter)"
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <Button type="submit" disabled={busy} className="flex-1">
                        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Masuk
                      </Button>
                    </div>
                  </form>
                  <form action={signUpEmail}>
                    <Button type="submit" variant="link" className="w-full text-xs">
                      Belum punya akun? Daftar dengan email
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )
          ) : null}
        </div>
      </div>
      {/* nav mobile */}
      <nav className="flex gap-1 overflow-x-auto border-t px-2 py-1.5 md:hidden">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium ${
              pathname === n.href ? "bg-blue-100 text-blue-800" : "text-muted-foreground"
            }`}
          >
            <n.icon className="h-3.5 w-3.5" />
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
