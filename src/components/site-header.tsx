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
import {
  GraduationCap,
  LayoutDashboard,
  Timer,
  BookOpen,
  BarChart3,
  Library,
  Bot,
  LogIn,
  LogOut,
  Loader2,
  Cloud,
  HardDrive,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { syncGuestToCloud } from "@/lib/sync";
import { localStore } from "@/lib/storage";
import {
  pushPending,
  getUnsyncedCount,
  PROGRESS_CHANGED_EVENT,
} from "@/lib/auto-sync";

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
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!supabaseConfigured()) return;
    const sb = createClient();

    // Auto-sync antrean progres: app dibuka / kembali online / selesai ujian /
    // interval ringan. pushPending sendiri memeriksa online + login + antrean.
    const triggerAutoSync = () => {
      setPendingCount(getUnsyncedCount());
      void pushPending()
        .then(() => setPendingCount(getUnsyncedCount()))
        .catch(() => {});
    };
    window.addEventListener("online", triggerAutoSync);
    window.addEventListener(PROGRESS_CHANGED_EVENT, triggerAutoSync);
    const interval = window.setInterval(triggerAutoSync, 5 * 60 * 1000);
    triggerAutoSync();

    async function checkAndSync(userEmail: string | null) {
      setUser(userEmail);
      if (userEmail && localStore.hasGuestData()) {
        setSyncing(true);
        try {
          const res = await syncGuestToCloud();
          if (res.success && (res.sessionsCount > 0 || res.customCount > 0)) {
            toast.success(
              `Data sesi tamu berhasil disinkronkan ke cloud: ${res.sessionsCount} sesi, ${res.customCount} soal kustom.`,
            );
          }
        } catch {
          // Keep local data safe on failure
        } finally {
          setSyncing(false);
        }
      }
    }

    sb.auth.getUser().then(({ data }) => {
      void checkAndSync(data.user?.email ?? null);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      void checkAndSync(session?.user?.email ?? null);
    });
    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener("online", triggerAutoSync);
      window.removeEventListener(PROGRESS_CHANGED_EVENT, triggerAutoSync);
      window.clearInterval(interval);
    };
  }, []);

  async function handleManualSync() {
    if (syncing || !user) return;
    setSyncing(true);
    try {
      const res = await syncGuestToCloud();
      if (res.success) {
        if (res.sessionsCount > 0 || res.customCount > 0) {
          toast.success(
            `Data berhasil disinkronkan: ${res.sessionsCount} sesi, ${res.customCount} soal kustom.`,
          );
        } else {
          toast.info("Semua data lokal telah tersinkronisasi ke cloud.");
        }
      } else if (res.message) {
        toast.info(res.message);
      }
    } catch {
      toast.error("Gagal menyinkronkan data ke cloud.");
    } finally {
      setSyncing(false);
    }
  }

  async function signInEmail(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    setBusy(true);
    try {
      const sb = createClient();
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Berhasil masuk.");
      }
    } catch {
      toast.error("Gagal masuk. Periksa koneksi Anda.");
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
      const { error } = await sb.auth.signUp({ email, password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Pendaftaran berhasil. Silakan periksa email untuk konfirmasi.");
      }
    } catch {
      toast.error("Gagal mendaftar. Periksa koneksi Anda.");
    } finally {
      setBusy(false);
    }
  }

  // Login Google dikelola Supabase OAuth. Kredensial client diatur di dashboard
  // Supabase (Auth -> Providers -> Google); env ini hanya saklar tampilan tombol.
  const googleEnabled = process.env.NEXT_PUBLIC_HAS_GOOGLE === "1";

  async function signInGoogle() {
    try {
      const sb = createClient();
      const { error } = await sb.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) toast.error(error.message);
    } catch {
      toast.error("Gagal mengarahkan ke Google. Periksa koneksi Anda.");
    }
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
          {mounted && (
            user ? (
              <button
                type="button"
                onClick={handleManualSync}
                disabled={syncing}
                className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  pendingCount > 0
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                }`}
                title={
                  pendingCount > 0
                    ? `${pendingCount} sesi menunggu sinkronisasi. Klik untuk sinkron manual.`
                    : "Tersinkronisasi ke cloud. Klik untuk sinkronisasi manual."
                }
              >
                {syncing ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Cloud className="h-3 w-3" />
                )}
                <span>
                  {syncing
                    ? "Sinkronisasi..."
                    : pendingCount > 0
                      ? `Cloud · ${pendingCount} tertunda`
                      : "Cloud"}
                </span>
              </button>
            ) : (
              <div
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-muted bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
                title="Data tersimpan di browser ini (Mode Tamu)"
              >
                <HardDrive className="h-3 w-3" />
                <span>Mode Tamu</span>
              </div>
            )
          )}
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
                    setUser(null);
                    toast.info("Anda telah keluar.");
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
                      Riwayat &amp; progres tersinkron antar perangkat via Supabase. Data sesi tamu di perangkat ini akan otomatis disinkronkan ke akun Anda saat masuk.
                    </DialogDescription>
                  </DialogHeader>
                  {googleEnabled && (
                    <Button variant="outline" onClick={signInGoogle} className="w-full">
                      Lanjut dengan Google
                    </Button>
                  )}
                  {googleEnabled && (
                    <div className="relative text-center text-xs text-muted-foreground">
                      <span className="relative z-10 bg-background px-2">atau email</span>
                      <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
                    </div>
                  )}
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
