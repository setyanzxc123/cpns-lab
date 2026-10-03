"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadBank, CATEGORY_INFO } from "@/data/bank";
import { getRepo } from "@/lib/repository";
import { deriveProgress, subTrend, weeklyAccuracy } from "@/lib/progress";
import type { Category, Question, SessionResult, SubCategory } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Loader2, Sparkles, Trash2, Repeat } from "lucide-react";

export default function StatistikPage() {
  const [results, setResults] = useState<SessionResult[]>([]);
  const [bank, setBank] = useState<Question[]>([]);
  const [wrong, setWrong] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const aiOn = Boolean(process.env.NEXT_PUBLIC_HAS_GEMINI);

  useEffect(() => {
    (async () => {
      const repo = await getRepo();
      const [rs, b, w] = await Promise.all([repo.listResults(), loadBank(), repo.listWrong()]);
      setResults([...rs].sort((a, b) => b.finishedAt - a.finishedAt));
      setBank(b);
      setWrong(w);
      setLoading(false);
    })();
  }, []);

  // Akumulasi semua waktu per sub — pelengkap angka berbobot di panel kemampuan.
  const subStats = useMemo(() => {
    const byId = new Map(bank.map((q) => [q.id, q]));
    const stats = new Map<SubCategory, { correct: number; total: number; category: Category }>();
    for (const r of results) {
      for (const a of r.answers) {
        const q = byId.get(a.questionId);
        if (!q) continue;
        const cur = stats.get(q.sub) ?? { correct: 0, total: 0, category: q.category };
        cur.total += 1;
        if (a.correct) cur.correct += 1;
        stats.set(q.sub, cur);
      }
    }
    return stats;
  }, [results, bank]);

  const wrongCount = useMemo(
    () => Object.keys(wrong).filter((id) => bank.some((q) => q.id === id)).length,
    [wrong, bank],
  );

  const progress = useMemo(
    () => (bank.length > 0 ? deriveProgress(results, bank) : null),
    [results, bank],
  );

  const mastery = useMemo(
    () => (progress ? [...progress.subMastery].sort((a, b) => a.acc - b.acc) : []),
    [progress],
  );

  async function clearWrong() {
    const repo = await getRepo();
    await repo.clearWrong();
    setWrong({});
  }

  async function runAnalysis() {
    setAnalyzing(true);
    setReport(null);
    try {
      const byId = new Map(bank.map((q) => [q.id, q]));
      const subAcc = new Map<string, { sub: string; category: string; correct: number; total: number }>();
      for (const r of [...results].sort((a, b) => a.finishedAt - b.finishedAt)) {
        for (const a of r.answers) {
          const q = byId.get(a.questionId);
          if (!q) continue;
          const cur =
            subAcc.get(q.sub) ?? { sub: q.sub, category: q.category, correct: 0, total: 0 };
          cur.total += 1;
          if (a.correct) cur.correct += 1;
          subAcc.set(q.sub, cur);
        }
      }
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: results.map((r) => ({
            date: new Date(r.finishedAt).toISOString().slice(0, 10),
            mode: r.mode,
            totalScore: r.totalScore,
            maxScore: r.maxScore,
            subScores: r.subScores,
          })),
          subAccuracy: [...subAcc.values()].map((s) => ({
            ...s,
            pct: Math.round((s.correct / Math.max(1, s.total)) * 100),
          })),
          subMastery:
            progress?.subMastery.map((m) => ({
              sub: m.sub,
              category: m.category,
              acc: m.acc,
              attempts: m.attempts,
            })) ?? [],
          weeklyAccuracy: weeklyAccuracy(results),
          wrongCount: Object.keys(wrong).length,
        }),
      });
      const data = await res.json();
      setReport(data.report ?? "Tidak ada hasil.");
    } catch {
      setReport("Gagal menghubungi AI. Periksa koneksi atau GEMINI_API_KEY.");
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) return <p className="text-center text-muted-foreground">Memuat progres…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-bold">Progres Belajar</h1>
        {progress?.focusSub && (
          <Link
            href={`/latihan?cat=${progress.focusSub.category}&subs=${encodeURIComponent(progress.focusSub.sub)}`}
            className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
          >
            Fokus berikutnya: {progress.focusSub.sub} · {progress.focusSub.acc}%
          </Link>
        )}
      </div>

      {/* Panel kemampuan: bar tren per sesi + angka berbobot, terlemah di atas. */}
      <section aria-labelledby="kemampuan-heading">
        <div className="flex items-baseline justify-between gap-2 pb-2">
          <h2 id="kemampuan-heading" className="text-sm font-semibold">
            Kemampuan per sub-materi
          </h2>
          <p className="text-xs text-muted-foreground">Hasil terbaru lebih menentukan.</p>
        </div>
        {!progress || mastery.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada data. Kerjakan{" "}
            <Link href="/latihan" className="text-blue-700 underline">
              latihan
            </Link>{" "}
            atau{" "}
            <Link href="/simulasi" className="text-blue-700 underline">
              simulasi
            </Link>{" "}
            dulu.
          </p>
        ) : (
          <div className="divide-y rounded-xl border">
            {mastery.map((m) => {
              const trend = bank.length > 0 ? subTrend(results, bank, m.sub).slice(-12) : [];
              const all = subStats.get(m.sub);
              const allPct = all ? Math.round((all.correct / Math.max(1, all.total)) * 100) : null;
              const isFocus = progress.focusSub?.sub === m.sub;
              const row = (
                <>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="truncate text-sm font-semibold"
                        style={{ color: CATEGORY_INFO[m.category].color }}
                      >
                        {m.sub}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {m.category}
                        {isFocus && " · fokus"}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 text-lg font-bold tabular-nums ${
                        m.acc < 60 ? "text-danger" : ""
                      }`}
                    >
                      {m.acc}%
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <div className="flex h-6 min-w-0 flex-1 items-end gap-[3px]">
                      {trend.map((t, i) => (
                        <div
                          key={i}
                          className="w-2.5 rounded-sm"
                          style={{
                            height: `${Math.max(10, t.pct * 0.22)}px`,
                            backgroundColor: `color-mix(in oklab, ${CATEGORY_INFO[m.category].color} ${Math.max(30, t.pct)}%, transparent)`,
                          }}
                          title={`${t.label} — ${t.pct}%`}
                        />
                      ))}
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {m.attempts} jawaban
                      {allPct !== null && ` · akumulasi ${allPct}%`}
                    </span>
                  </div>
                </>
              );
              return isFocus ? (
                <Link
                  key={m.sub}
                  href={`/latihan?cat=${m.category}&subs=${encodeURIComponent(m.sub)}`}
                  className="block px-4 py-3 transition-colors hover:bg-muted/60"
                >
                  {row}
                </Link>
              ) : (
                <div key={m.sub} className="px-4 py-3">
                  {row}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" aria-hidden />
            <div>
              <p className="text-sm font-semibold">Analisis AI</p>
              <p className="text-xs text-muted-foreground">
                Rencana belajar 7 hari dari riwayat latihan Anda.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => void runAnalysis()} disabled={analyzing || !aiOn}>
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
              Analisis sekarang
            </Button>
            {report && (
              <Link href="/ai" className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Bot className="h-4 w-4 text-blue-600" aria-hidden />
                Tanya Tutor
              </Link>
            )}
          </div>
        </CardContent>
        {!aiOn && (
          <p className="px-5 pb-4 text-xs text-muted-foreground">
            Analisis butuh <code className="rounded bg-muted px-1">GEMINI_API_KEY</code> — lihat README.
          </p>
        )}
        {report && (
          <div className="px-5 pb-5">
            <div className="prose-sm max-w-none whitespace-pre-wrap rounded-lg border border-purple-200 bg-purple-50/70 p-4 text-sm leading-relaxed text-purple-950 dark:border-purple-900/50 dark:bg-purple-950/30 dark:text-purple-200">
              {report}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-sm">
            {wrongCount > 0 ? (
              <>
                <span className="font-semibold">{wrongCount} soal</span>{" "}
                <span className="text-muted-foreground">menunggu untuk diulang.</span>
              </>
            ) : (
              <span className="text-muted-foreground">Tidak ada soal salah yang tertunda.</span>
            )}
          </p>
          <div className="flex gap-2">
            {wrongCount > 0 ? (
              <Link href="/latihan" className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Repeat className="h-4 w-4" /> Latih ulang
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                <Repeat className="h-4 w-4" /> Latih ulang
              </Button>
            )}
            <Button variant="ghost" size="sm" disabled={wrongCount === 0} onClick={clearWrong}>
              <Trash2 className="h-4 w-4" /> Bersihkan
            </Button>
          </div>
        </CardContent>
      </Card>

      <section aria-labelledby="riwayat-heading">
        <div className="flex items-baseline justify-between gap-2 pb-2">
          <h2 id="riwayat-heading" className="text-sm font-semibold">
            Riwayat Pengerjaan
          </h2>
          <span className="text-xs text-muted-foreground">{results.length} sesi</span>
        </div>
        <div className="divide-y rounded-xl border">
          {results.length === 0 && (
            <p className="px-4 py-3 text-sm text-muted-foreground">Belum ada riwayat.</p>
          )}
          {results.map((r) => {
            const pct = Math.round((r.totalScore / Math.max(1, r.maxScore)) * 100);
            return (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    <span className="truncate">{r.title}</span>
                    {r.passingGradeSummary && (
                      <Badge
                        className={
                          r.passed ? "bg-success text-success-foreground" : "bg-danger text-danger-foreground"
                        }
                      >
                        {r.passed ? "Lulus PG" : "TMS"}
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.finishedAt).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}{" "}
                    · {Math.floor(r.durationSec / 60)} menit
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">{pct}%</p>
                  <p className="text-[11px] text-muted-foreground">
                    {r.subScores.map((sc) => `${sc.category} ${sc.score}/${sc.maxScore}`).join(" · ")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
