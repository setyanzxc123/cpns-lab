"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { getRepo } from "@/lib/repository";
import { loadBank } from "@/data/bank";
import type { SessionResult } from "@/lib/types";
import { Timer, BookOpen } from "lucide-react";

export default function HomePage() {
  const [results, setResults] = useState<SessionResult[]>([]);
  const [bankCount, setBankCount] = useState(0);
  const [dbOn, setDbOn] = useState(false);

  useEffect(() => {
    (async () => {
      const repo = await getRepo();
      setResults(await repo.listResults());
      setBankCount((await loadBank()).length);
      setDbOn(Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL));
    })();
  }, []);

  const avg = results.length
    ? Math.round(
        (results.reduce((a, r) => a + r.totalScore / Math.max(1, r.maxScore), 0) /
          results.length) *
          100,
      )
    : null;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 px-6 py-10 text-white">
        <h1 className="text-3xl font-bold sm:text-4xl">Siap tempur tes CPNS?</h1>
        <p className="mt-2 max-w-xl text-blue-100">
          Latihan TWK, TIU, dan TKP dengan pembahasan lengkap, simulasi ujian berwaktu
          ala CAT BKN, analisis kelemahan, dan tutor AI yang membantu belajar lebih fokus.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/simulasi"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-white text-blue-800 hover:bg-blue-50"
            )}
          >
            <Timer className="h-5 w-5" /> Mulai Simulasi
          </Link>
          <Link
            href="/latihan"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
            )}
          >
            <BookOpen className="h-5 w-5" /> Latihan Soal
          </Link>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl border bg-card px-5 py-4">
        <p className="text-sm">
          <span className="text-xl font-bold">{bankCount}</span>{" "}
          <span className="text-muted-foreground">soal tersedia</span>
        </p>
        <p className="text-sm">
          <span className="text-xl font-bold">{results.length}</span>{" "}
          <span className="text-muted-foreground">sesi dikerjakan</span>
        </p>
        <p className="text-sm">
          <span className="text-xl font-bold">{avg !== null ? `${avg}%` : "—"}</span>{" "}
          <span className="text-muted-foreground">rata-rata capaian</span>
        </p>
      </section>

      <p className="text-xs text-muted-foreground">
        Penyimpanan{" "}
        {dbOn
          ? "terhubung ke Supabase — progres tersinkron antar perangkat."
          : "di perangkat ini — pasang Supabase untuk sinkron antar perangkat."}
      </p>
    </div>
  );
}
