"use client";

// Gerbang auth: login Google wajib. Belum login → layar masuk (app terkunci);
// sudah login → app penuh. Sesi disimpan Supabase di localStorage sehingga user
// yang sudah login tetap masuk saat offline. Bila env Supabase tidak dipasang
// (dev lokal tanpa cloud), gate dilewati agar dev tetap bisa jalan.

import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { toast } from "sonner";
import { GraduationCap, Loader2 } from "lucide-react";

type AuthState = "loading" | "anon" | "authed";

/** Logo "G" Google 4 warna (brand guidelines) untuk tombol sign-in. */
export function GoogleLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.32A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.96H.96a9 9 0 0 0 0 8.08l3.01-2.32z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 .96 4.96l3.01 2.32C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

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

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>("loading");

  useEffect(() => {
    if (!supabaseConfigured()) {
      // Dev lokal tanpa kredensial Supabase — gate dilewati.
      setState("authed");
      return;
    }
    const sb = createClient();
    // getSession membaca sesi dari localStorage — aman saat offline.
    sb.auth
      .getSession()
      .then(({ data }) => setState(data.session?.user ? "authed" : "anon"))
      .catch(() => setState("anon"));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setState(session?.user ? "authed" : "anon");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (state === "loading") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Memeriksa sesi…</p>
      </div>
    );
  }

  if (state === "anon") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-950">
          <GraduationCap className="h-8 w-8 text-blue-800 dark:text-blue-300" />
        </div>
        <div className="max-w-md space-y-1.5">
          <h1 className="text-xl font-bold">Masuk untuk melanjutkan</h1>
          <p className="text-sm text-muted-foreground">
            Latihan, simulasi, statistik, dan preferensi tersimpan per akun agar
            sinkron di semua perangkat Anda. Masuk dengan akun Google untuk mulai.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void signInGoogle()}
          className="inline-flex items-center gap-3 rounded-full border bg-card px-6 py-2.5 text-sm font-semibold shadow-sm transition-colors hover:bg-muted"
        >
          <GoogleLogo className="h-5 w-5" />
          Masuk dengan Google
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
