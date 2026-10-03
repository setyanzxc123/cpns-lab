"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getRepo } from "@/lib/repository";
import { loadBank } from "@/data/bank";
import { deriveProgress, type Progress } from "@/lib/progress";
import { ArrowDownRight, ArrowUpRight, BookOpen, Timer } from "lucide-react";

function Highlight({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function HomePage() {
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    (async () => {
      const repo = await getRepo();
      const [results, bank] = await Promise.all([repo.listResults(), loadBank()]);
      setProgress(deriveProgress(results, bank));
    })();
  }, []);

  const delta = progress?.delta ?? null;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 px-6 py-8 text-white">
        <h1 className="text-2xl font-bold sm:text-3xl">Siap belajar hari ini?</h1>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/simulasi"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-white text-blue-800 hover:bg-blue-50",
            )}
          >
            <Timer className="h-5 w-5" /> Mulai Simulasi
          </Link>
          <Link
            href="/latihan"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white",
            )}
          >
            <BookOpen className="h-5 w-5" /> Latihan Soal
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">Sorotan Progres</h2>
          <Link
            href="/statistik"
            className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Lihat progres lengkap →
          </Link>
        </div>

        <div className="flex flex-wrap items-start gap-x-10 gap-y-4">
          <Highlight
            value={progress ? String(progress.totalSessions) : "—"}
            label="sesi dikerjakan"
          />
          <Highlight
            value={progress ? String(progress.totalQuestions) : "—"}
            label="soal dikerjakan"
          />
          <div>
            <p className="flex items-center gap-1.5 text-2xl font-bold tracking-tight">
              {progress?.accuracy7d != null ? `${progress.accuracy7d}%` : "—"}
              {delta != null && delta !== 0 && (
                <span
                  className={cn(
                    "flex items-center text-xs font-semibold",
                    delta > 0 ? "text-success" : "text-danger",
                  )}
                  title="Selisih akurasi 7 hari vs 30 hari"
                >
                  {delta > 0 ? (
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {Math.abs(delta)}%
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">akurasi 7 hari terakhir</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {progress?.focusSub ? (
            <>
              Fokus berikutnya:{" "}
              <Link
                href={`/latihan?cat=${progress.focusSub.category}&subs=${encodeURIComponent(progress.focusSub.sub)}`}
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                {progress.focusSub.sub} ({progress.focusSub.acc}%)
              </Link>
            </>
          ) : progress ? (
            <>
              Belum ada cukup data untuk rekomendasi —{" "}
              <Link
                href="/latihan"
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                mulai latihan pertamamu
              </Link>
              .
            </>
          ) : (
            "Memuat progres…"
          )}
        </p>
      </section>
    </div>
  );
}
