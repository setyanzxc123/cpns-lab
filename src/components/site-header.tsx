"use client";

// Header navigasi utama + status auth Supabase.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
  LogOut,
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

  // Login (Google) ditangani AuthGate di layout — header hanya menampilkan
  // status user yang sudah masuk.

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
                aria-label={`Sinkronisasi cloud: ${
                  syncing
                    ? "sedang menyinkronkan"
                    : pendingCount > 0
                      ? `${pendingCount} sesi menunggu, klik untuk sinkron manual`
                      : "tersinkronisasi, klik untuk sinkron manual"
                }`}
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
                      ? `${pendingCount} tertunda`
                      : "Tersinkron"}
                </span>
              </button>
            ) : !supabaseConfigured() && process.env.NODE_ENV === "development" ? (
              <div
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-muted bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
                title="Env Supabase tidak terpasang — data hanya di browser ini"
              >
                <HardDrive className="h-3 w-3" aria-hidden />
                <span>Mode Dev</span>
              </div>
            ) : null
          )}
          {mounted && supabaseConfigured() && user ? (
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
          ) : null}
        </div>
      </div>
      {/* nav mobile */}
      <nav className="flex gap-1 overflow-x-auto border-t px-2 py-1 md:hidden">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`flex min-h-11 shrink-0 items-center gap-1 rounded-md px-3 py-2 text-xs font-medium ${
              pathname === n.href
                ? "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300"
                : "text-muted-foreground"
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
