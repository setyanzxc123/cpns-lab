"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadBank, CATEGORY_INFO } from "@/data/bank";
import { getRepo } from "@/lib/repository";
import type { Category, Question, SessionResult, SubCategory } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Trash2, Repeat } from "lucide-react";

export default function StatistikPage() {
  const [results, setResults] = useState<SessionResult[]>([]);
  const [bank, setBank] = useState<Question[]>([]);
  const [wrong, setWrong] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

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

  async function clearWrong() {
    const repo = await getRepo();
    await repo.clearWrong();
    setWrong({});
  }

  if (loading) return <p className="text-center text-muted-foreground">Memuat statistik…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Statistik &amp; Analisis Progres</h1>
        <p className="text-sm text-muted-foreground">
          Semakin sering berlatih, grafik ini yang menunjukkan area mana yang perlu diperkuat.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" /> Akurasi per Subkategori
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
          <CardTitle className="text-base">Basis Soal Salah</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {wrongCount > 0
              ? `${wrongCount} soal pernah Anda jawab salah dan belum diulang dengan benar.`
              : "Tidak ada soal salah yang tertunda. 🎉"}
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
                <div className="flex items-center gap-2">
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
                  {r.avgTimePerQuestionSec != null && (
                    <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
                      ⏱️ {r.avgTimePerQuestionSec}s/soal
                    </span>
                  )}
                  {r.subScores.map((s) => (
                    <Badge key={s.category} variant="outline">
                      {s.category} {s.score}/{s.maxScore}
                    </Badge>
                  ))}
                  <Badge className={pct >= 60 ? "bg-emerald-600" : "bg-amber-600"}>{pct}%</Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
