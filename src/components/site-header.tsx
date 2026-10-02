"use client";

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
  Bot,
  LogOut,
  HardDrive,
} from "lucide-react";
import { toast } from "sonner";
import { syncGuestToCloud } from "@/lib/sync";
import { localStore } from "@/lib/storage";
import {
  pushPending,
  PROGRESS_CHANGED_EVENT,
} from "@/lib/auto-sync";

const NAV = [
  { href: "/", label: "Beranda", icon: LayoutDashboard },
  { href: "/simulasi", label: "Simulasi", icon: Timer },
  { href: "/latihan", label: "Latihan", icon: BookOpen },
  { href: "/statistik", label: "Statistik", icon: BarChart3 },
  { href: "/ai", label: "Tutor AI", icon: Bot },
];


export function SiteHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!supabaseConfigured()) return;
    const sb = createClient();

    // Auto-sync antrean progres: app dibuka / kembali online / selesai ujian /
    // interval ringan. pushPending sendiri memeriksa online + login + antrean.
    const triggerAutoSync = () => {
      void pushPending().catch(() => {});
    };
    window.addEventListener("online", triggerAutoSync);
    window.addEventListener(PROGRESS_CHANGED_EVENT, triggerAutoSync);
    const interval = window.setInterval(triggerAutoSync, 5 * 60 * 1000);
    triggerAutoSync();

    async function checkAndSync(userEmail: string | null) {
      setUser(userEmail);
      if (userEmail && localStore.hasGuestData()) {
        try {
          const res = await syncGuestToCloud();
          if (res.success && res.sessionsCount > 0) {
            toast.success(
              `Data sesi tamu berhasil disinkronkan ke cloud: ${res.sessionsCount} sesi.`,
            );
          }
        } catch {
          // Keep local data safe on failure
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

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div
        className={`mx-auto flex w-full items-center gap-2 px-4 py-2.5 ${
          pathname === "/ai" ? "max-w-none lg:px-6" : "max-w-6xl"
        }`}
      >
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
          {mounted && !user && !supabaseConfigured() && process.env.NODE_ENV === "development" ? (
            <div
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-muted bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
              title="Env Supabase tidak terpasang — data hanya di browser ini"
            >
              <HardDrive className="h-3 w-3" aria-hidden />
              <span>Mode Dev</span>
            </div>
          ) : null}
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
