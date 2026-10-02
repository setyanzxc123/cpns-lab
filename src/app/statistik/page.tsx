"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadBank, CATEGORY_INFO } from "@/data/bank";
import { getRepo } from "@/lib/repository";
import { deriveProgress, subTrend, weeklyAccuracy } from "@/lib/progress";
import type { Category, Question, SessionResult, SubCategory } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Bot, Loader2, Sparkles, Trash2, Repeat } from "lucide-react";

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

  // Agregat akurasi per subkategori dari semua riwayat
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

  if (loading) return <p className="text-center text-muted-foreground">Memuat statistik…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Progres Belajar</h1>
        <p className="text-sm text-muted-foreground">
          Semakin sering berlatih, grafik ini yang menunjukkan area mana yang perlu diperkuat.
        </p>
      </div>

      {progress?.focusSub && (
        <p className="text-sm text-muted-foreground">
          Fokus berikutnya:{" "}
          <Link
            href={`/latihan?cat=${progress.focusSub.category}&subs=${encodeURIComponent(progress.focusSub.sub)}`}
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            {progress.focusSub.sub} ({progress.focusSub.acc}%)
          </Link>
        </p>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Kemampuan Saat Ini</CardTitle>
          <p className="text-xs text-muted-foreground">
            Akurasi berbobot — hasil terbaru berpengaruh lebih besar daripada hasil lama.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {!progress || progress.subMastery.length === 0 ? (
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
            [...progress.subMastery]
              .sort((a, b) => a.acc - b.acc)
              .map((m) => (
                <div key={m.sub}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium" style={{ color: CATEGORY_INFO[m.category].color }}>
                      {m.sub}{" "}
                      <span className="text-xs text-muted-foreground">({m.category})</span>
                    </span>
                    <span className="text-muted-foreground">
                      {m.acc}% · {m.attempts} jawaban
                      {m.acc < 60 && <span className="ml-2 text-xs font-semibold text-red-600">perlu diperkuat</span>}
                    </span>
                  </div>
                  <Progress value={m.acc} />
                </div>
              ))
          )}
        </CardContent>
      </Card>

      {progress && progress.subMastery.some((m) => m.attempts > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tren per Sub-materi</CardTitle>
            <p className="text-xs text-muted-foreground">
              Akurasi tiap sesi, lama ke baru. Arahkan kursor untuk detail.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {progress.subMastery
              .filter((m) => m.attempts > 0)
              .sort((a, b) => a.acc - b.acc)
              .map((m) => {
                const trend = subTrend(results, bank, m.sub).slice(-12);
                return (
                  <div key={m.sub} className="flex items-center gap-3">
                    <span
                      className="w-40 shrink-0 truncate text-sm font-medium"
                      style={{ color: CATEGORY_INFO[m.category].color }}
                      title={`${m.sub} (${m.category})`}
                    >
                      {m.sub}
                    </span>
                    <div className="flex h-8 flex-1 items-end gap-1">
                      {trend.map((t, i) => (
                        <div
                          key={i}
                          className="w-1.5 rounded-sm"
                          style={{
                            height: `${Math.max(8, t.pct * 0.28)}px`,
                            backgroundColor: `color-mix(in oklab, ${CATEGORY_INFO[m.category].color} ${Math.max(25, t.pct)}%, transparent)`,
                          }}
                          title={`${t.label} — ${t.pct}%`}
                        />
                      ))}
                    </div>
                    <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                      {trend[trend.length - 1]?.pct ?? 0}%
                    </span>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" /> Akumulasi Semua Waktu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {subStats.size === 0 && (
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
          )}
          {[...subStats.entries()]
            .sort((a, b) => a[1].correct / Math.max(1, a[1].total) - b[1].correct / Math.max(1, b[1].total))
            .map(([sub, s]) => {
              const pct = Math.round((s.correct / Math.max(1, s.total)) * 100);
              return (
                <div key={sub}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium" style={{ color: CATEGORY_INFO[s.category].color }}>
                      {sub} <span className="text-xs text-muted-foreground">({s.category})</span>
                    </span>
                    <span className="text-muted-foreground">
                      {s.correct}/{s.total} · {pct}%
                      {pct < 60 && <span className="ml-2 text-xs font-semibold text-red-600">perlu diperkuat</span>}
                    </span>
                  </div>
                  <Progress value={pct} />
                </div>
              );
            })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-purple-600" aria-hidden />
            Analisis Skor &amp; Rencana Belajar
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Evaluasi otomatis berdasarkan akurasi jawaban dan kelemahan sub-materi TWK/TIU/TKP Anda.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => void runAnalysis()} disabled={analyzing || !aiOn}>
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
              Analisis progres saya
            </Button>
            {report && (
              <Link href="/ai" className={buttonVariants({ variant: "outline" })}>
                <Bot className="h-4 w-4 text-blue-600" aria-hidden />
                Konsultasikan ke Tutor
              </Link>
            )}
          </div>
          {!aiOn && (
            <p className="text-xs text-muted-foreground">
              Analisis butuh <code className="rounded bg-muted px-1">GEMINI_API_KEY</code> — lihat README.
            </p>
          )}
          {report && (
            <div className="prose-sm max-w-none whitespace-pre-wrap rounded-lg border border-purple-200 bg-purple-50/70 p-4 text-sm leading-relaxed text-purple-950 dark:border-purple-900/50 dark:bg-purple-950/30 dark:text-purple-200">
              {report}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Basis Soal Salah</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {wrongCount > 0
              ? `${wrongCount} soal pernah Anda jawab salah dan belum diulang dengan benar.`
              : (<><span aria-hidden>🎉</span> Tidak ada soal salah yang tertunda.</>)}
          </p>
          <div className="flex gap-2">
            {wrongCount > 0 ? (
              <Link href="/latihan" className={buttonVariants({ variant: "outline" })}>
                <Repeat className="h-4 w-4" /> Latih ulang
              </Link>
            ) : (
              <Button variant="outline" disabled>
                <Repeat className="h-4 w-4" /> Latih ulang
              </Button>
            )}
            <Button variant="ghost" disabled={wrongCount === 0} onClick={clearWrong}>
              <Trash2 className="h-4 w-4" /> Bersihkan daftar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Riwayat Pengerjaan ({results.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {results.length === 0 && <p className="text-sm text-muted-foreground">Belum ada riwayat.</p>}
          {results.map((r) => {
            const pct = Math.round((r.totalScore / Math.max(1, r.maxScore)) * 100);
            return (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.finishedAt).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}{" "}
                    · {Math.floor(r.durationSec / 60)} menit
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {r.passingGradeSummary && (
                    <Badge
                      className={
                        r.passed
                          ? "bg-emerald-600 text-white"
                          : "bg-rose-600 text-white"
                      }
                    >
                      {r.passed ? "Lulus PG" : "TMS"}
                    </Badge>
                  )}
                  <span className="font-mono text-xs text-muted-foreground">
                    {pct}%
                    {r.avgTimePerQuestionSec != null && ` · ${r.avgTimePerQuestionSec} dtk/soal`}
                    {" · " +
                      r.subScores.map((sc) => `${sc.category} ${sc.score}/${sc.maxScore}`).join(" · ")}
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
