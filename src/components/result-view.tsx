"use client";

// Tampilan hasil pengerjaan: status kelulusan Nilai Ambang Batas (Passing Grade) BKN,
// analisis manajemen waktu (pacing time) vs benchmark resmi (~54s/soal),
// skor per subtes, review jawaban berfilter, dan tombol minta penjelasan AI.

import { useEffect, useState } from "react";
import type { Question, SessionResult } from "@/lib/types";
import { CATEGORY_INFO } from "@/data/bank";
import { formatTime } from "@/hooks/use-exam";
import { localStore } from "@/lib/storage";
import { VisualPanel } from "@/components/figural";
import { QuestionText } from "@/components/question-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Loader2,
  Award,
  AlertTriangle,
  Clock,
  Timer,
  Zap,
  AlertCircle,
} from "lucide-react";

const LETTERS = ["A", "B", "C", "D", "E"];

export function ResultView({
  result,
  bank,
}: {
  result: SessionResult;
  bank: Question[];
}) {
  const byId = new Map(bank.map((q) => [q.id, q]));
  const pct = Math.round((result.totalScore / Math.max(1, result.maxScore)) * 100);
  const [filterMode, setFilterMode] = useState<"all" | "wrong" | "traps">("all");

  const pgSummary = result.passingGradeSummary;
  const pacing = result.pacingStats;

  // Hitung jumlah soal untuk filter
  const wrongCount = result.answers.filter((a) => a.correct === false).length;
  const trapCount = result.answers.filter((a) => (a.timeSpentSec ?? 0) > 90).length;

  const filteredAnswers = result.answers
    .map((a, originalIndex) => ({ ...a, originalIndex }))
    .filter((a) => {
      if (filterMode === "wrong") return a.correct === false;
      if (filterMode === "traps") return (a.timeSpentSec ?? 0) > 90;
      return true;
    });

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* 1. Official BKN Passing Grade Verdict Banner */}
      {pgSummary && (
        <Card
          className={`border-2 ${
            pgSummary.allPassed
              ? "border-emerald-500/50 bg-emerald-50/70 dark:border-emerald-500/30 dark:bg-emerald-950/30"
              : "border-rose-500/50 bg-rose-50/70 dark:border-rose-500/30 dark:bg-rose-950/30"
          }`}
        >
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`mt-0.5 rounded-full p-2.5 ${
                    pgSummary.allPassed
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300"
                  }`}
                >
                  {pgSummary.allPassed ? (
                    <Award className="h-7 w-7" />
                  ) : (
                    <AlertTriangle className="h-7 w-7" />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2
                      className={`text-lg sm:text-xl font-bold ${
                        pgSummary.allPassed
                          ? "text-emerald-900 dark:text-emerald-100"
                          : "text-rose-900 dark:text-rose-100"
                      }`}
                    >
                      {pgSummary.allPassed
                        ? "MEMENUHI NILAI AMBANG BATAS (LULUS PG)"
                        : "TIDAK MEMENUHI NILAI AMBANG BATAS (TMS)"}
                    </h2>
                    <Badge
                      className={
                        pgSummary.allPassed
                          ? "bg-emerald-600 text-white"
                          : "bg-rose-600 text-white"
                      }
                    >
                      {pgSummary.allPassed ? "Lolos Seleksi PG" : "Gugur Passing Grade"}
                    </Badge>
                  </div>
                  <p
                    className={`mt-1 text-sm ${
                      pgSummary.allPassed
                        ? "text-emerald-800 dark:text-emerald-200"
                        : "text-rose-800 dark:text-rose-200"
                    }`}
                  >
                    {pgSummary.allPassed
                      ? "Selamat! Seluruh subtes (TWK, TIU, TKP) telah memenuhi nilai ambang batas sesuai standar KepmenPAN-RB No. 321."
                      : `Nilai Anda belum melampaui ambang batas pada subtes: ${pgSummary.failedCategories.join(
                          ", ",
                        )}. Untuk lolos perankingan SKB, seluruh subtes harus lulus serentak.`}
                  </p>
                </div>
              </div>

              <div
                className={`w-full sm:w-auto text-left sm:text-right shrink-0 rounded-lg p-3 ${
                  pgSummary.allPassed
                    ? "bg-emerald-100/60 dark:bg-emerald-900/40"
                    : "bg-rose-100/60 dark:bg-rose-900/40"
                }`}
              >
                <p className="text-xs text-muted-foreground">Target Kumulatif PG</p>
                <p className="font-mono text-xl font-bold">
                  {result.totalScore}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    / {pgSummary.totalPassingGrade}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Ringkasan Skor & Kartu Statistik Utama */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Hasil — {result.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Skor Total" value={`${result.totalScore}`} sub={`dari maksimum ${result.maxScore}`} />
            <Stat label="Persentase" value={`${pct}%`} />
            <Stat
              label="Durasi Total"
              value={`${Math.floor(result.durationSec / 60)} mnt`}
              sub={`${result.durationSec % 60} detik`}
            />
            <Stat
              label="Rata-rata / Soal"
              value={
                result.avgTimePerQuestionSec != null
                  ? `${result.avgTimePerQuestionSec} dtk`
                  : `${Math.round(result.durationSec / Math.max(1, result.answers.length))} dtk`
              }
              sub="Target BKN: ~54 dtk"
            />
          </div>

          <Separator />

          {/* Breakdown per Subtes & Ambang Batas */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Skor Subtes &amp; Nilai Ambang Batas (KepmenPAN-RB)
            </h4>
            <div className="grid gap-3">
              {result.subScores.map((s) => {
                const info = CATEGORY_INFO[s.category];
                const p = Math.round((s.score / Math.max(1, s.maxScore)) * 100);
                const pg = s.passingGrade ?? 0;
                const pgPct = Math.round((pg / Math.max(1, s.maxScore)) * 100);
                const isPassed = s.passed ?? s.score >= pg;
                const diff = s.score - pg;

                return (
                  <div
                    key={s.category}
                    className="rounded-lg border bg-card/60 p-3.5 space-y-2 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold" style={{ color: info.color }}>
                          {s.category} — {info.name}
                        </span>
                        {isPassed ? (
                          <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">
                            ✓ Lolos PG ({pg})
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            ✗ Di bawah PG ({diff} dari {pg})
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs sm:text-sm text-muted-foreground font-mono">
                        {s.correct}/{s.total} benar · skor <b className="text-foreground">{s.score}</b>/
                        {s.maxScore} (Target PG: {pg})
                      </span>
                    </div>

                    {/* Progress Bar dengan penanda garis Ambang Batas */}
                    <div className="relative pt-1">
                      <Progress
                        value={p}
                        className={isPassed ? "[&>div]:bg-emerald-600" : "[&>div]:bg-amber-600"}
                      />
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-foreground/80 -translate-x-1/2 rounded"
                        style={{ left: `${Math.min(100, Math.max(0, pgPct))}%` }}
                        title={`Ambang Batas: ${pg} poin (${pgPct}%)`}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                      <span>0</span>
                      <span className="font-medium text-foreground">Ambang Batas: {pg}</span>
                      <span>Maks: {s.maxScore}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Pacing Time Analytics Card */}
      {pacing && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Timer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Analisis Manajemen Waktu (Pacing)
              </CardTitle>
              <Badge variant="outline" className="font-mono text-xs">
                Benchmark Resmi BKN: ~54 dtk / soal
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Box evaluasi kecepatan */}
            <div
              className={`rounded-lg border p-4 ${
                pacing.avgTimeSec <= 54
                  ? "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200"
                  : pacing.avgTimeSec <= 75
                    ? "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
                    : "border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {pacing.avgTimeSec <= 54 ? (
                    <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  ) : pacing.avgTimeSec <= 75 ? (
                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-bold">
                    {pacing.avgTimeSec <= 54
                      ? `⚡ Kecepatan Pacing Sangat Efisien (${pacing.avgTimeSec} dtk/soal)`
                      : pacing.avgTimeSec <= 75
                        ? `⏱️ Kecepatan Cukup Baik (${pacing.avgTimeSec} dtk/soal)`
                        : `⚠️ Terlalu Lambat — Berisiko Kehabisan Waktu (${pacing.avgTimeSec} dtk/soal)`}
                  </p>
                  <p className="text-xs leading-relaxed opacity-90">
                    {pacing.avgTimeSec <= 54
                      ? "Rata-rata waktu pengerjaan Anda berada di bawah batas CAT BKN (54 detik). Anda memiliki sisa waktu berharga untuk memeriksa kembali soal yang ditandai ragu-ragu."
                      : pacing.avgTimeSec <= 75
                        ? "Pacing Anda mendekati batas ideal. Tetap berhati-hati pada soal berhitung numerik atau bacaan panjang agar tidak memakan waktu lebih dari 90 detik."
                        : "Pada ujian CAT asli (110 soal dalam 100 menit), kecepatan ini berisiko membuat Anda tidak sempat membaca 15–25 soal terakhir. Terapkan aturan 60 detik: jika rumus/solusi buntu, segera tandai ragu-ragu dan lanjutkan."}
                  </p>
                </div>
              </div>
            </div>

            {/* Grid 4 Stat Pacing */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Rata-rata Pengerjaan</p>
                <p className="font-mono text-xl font-bold">{pacing.avgTimeSec} dtk</p>
                <p className="text-[11px] text-muted-foreground">Target: 54 dtk</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Soal Cepat (&lt;45s)</p>
                <p className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {pacing.fastQuestionsCount}
                </p>
                <p className="text-[11px] text-muted-foreground">Hemat waktu</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Soal Standar (45–90s)</p>
                <p className="font-mono text-xl font-bold">{pacing.normalQuestionsCount}</p>
                <p className="text-[11px] text-muted-foreground">Pace normal</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Jebakan Waktu (&gt;90s)</p>
                <p className="font-mono text-xl font-bold text-rose-600 dark:text-rose-400">
                  {pacing.slowQuestionsCount + pacing.timeTrapsCount}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {pacing.timeTrapsCount > 0
                    ? `${pacing.timeTrapsCount} soal > 2 menit!`
                    : "Perlu diwaspadai"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Section Review Jawaban dengan Filter */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Review Jawaban ({filteredAnswers.length})</h3>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 rounded-lg border bg-card p-1 text-xs">
            <Button
              variant={filterMode === "all" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setFilterMode("all")}
            >
              Semua ({result.answers.length})
            </Button>
            <Button
              variant={filterMode === "wrong" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setFilterMode("wrong")}
            >
              Salah ({wrongCount})
            </Button>
            <Button
              variant={filterMode === "traps" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setFilterMode("traps")}
            >
              Jebakan Waktu &gt;90s ({trapCount})
            </Button>
          </div>
        </div>

        {filteredAnswers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              {filterMode === "wrong"
                ? "Hebat! Tidak ada jawaban yang salah pada sesi ini. 🎉"
                : filterMode === "traps"
                  ? "Bagus sekali! Tidak ada soal yang memakan waktu melebihi 90 detik. ⚡"
                  : "Tidak ada soal untuk ditampilkan."}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredAnswers.map((a) => {
              const q = byId.get(a.questionId);
              if (!q) return null;
              const wrong = a.correct === false;
              return (
                <ReviewCard
                  key={a.questionId + a.originalIndex}
                  q={q}
                  choice={a.choice}
                  value={a.value}
                  wrong={wrong}
                  index={a.originalIndex}
                  timeSpentSec={a.timeSpentSec}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ReviewCard({
  q,
  choice,
  value,
  wrong,
  index,
  timeSpentSec,
}: {
  q: Question;
  choice: number | null;
  value: number;
  wrong: boolean;
  index: number;
  timeSpentSec?: number;
}) {
  const [aiExplain, setAiExplain] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fromCache, setFromCache] = useState(false);

  const isTimeTrap = timeSpentSec != null && timeSpentSec > 90;
  const isFast = timeSpentSec != null && timeSpentSec <= 45;

  useEffect(() => {
    const cached = localStore.getAiExplanation(q.id, choice);
    if (cached) {
      setAiExplain(cached);
      setFromCache(true);
    }
  }, [q.id, choice]);

  async function askAi() {
    const cached = localStore.getAiExplanation(q.id, choice);
    if (cached) {
      setAiExplain(cached);
      setFromCache(true);
      return;
    }

    setLoading(true);
    setAiExplain(null);
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.text,
          category: q.category,
          options: q.options.map((o, i) => ({
            letter: LETTERS[i],
            text: o.text ?? "(gambar)",
          })),
          answerIndex: q.answer,
          points: q.points,
          userChoice: choice,
          explanation: q.explanation,
        }),
      });
      const data = await res.json();
      if (res.ok && data.explanation) {
        setAiExplain(data.explanation);
        setFromCache(false);
        localStore.saveAiExplanation(q.id, choice, data.explanation);
      } else {
        setAiExplain(data.explanation ?? "AI tidak tersedia saat ini.");
      }
    } catch {
      setAiExplain("Gagal menghubungi AI. Periksa koneksi atau konfigurasi GEMINI_API_KEY.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className={wrong ? "border-red-200 dark:border-red-900/60" : ""}>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-muted-foreground">No. {index + 1}</span>
            <Badge variant="outline">{q.category}</Badge>
            <span className="text-xs text-muted-foreground">{q.sub}</span>
            {q.category !== "TKP" &&
              (wrong ? (
                <Badge variant="destructive">Salah</Badge>
              ) : (
                <Badge className="bg-emerald-600 text-white">Benar</Badge>
              ))}
            {q.category === "TKP" && <Badge variant="secondary">Nilai {value}/5</Badge>}
          </div>

          {/* Time Pacing Badge */}
          {timeSpentSec != null && (
            <Badge
              variant="outline"
              className={`flex items-center gap-1 font-mono text-xs ${
                timeSpentSec > 120
                  ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                  : timeSpentSec > 90
                    ? "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    : isFast
                      ? "border-emerald-500/60 text-emerald-700 dark:text-emerald-400"
                      : "text-muted-foreground"
              }`}
            >
              <Clock className="h-3 w-3" />
              <span>{formatTime(timeSpentSec)}</span>
              {timeSpentSec > 120 ? (
                <span className="font-sans font-semibold text-[10px]">⚠️ Jebakan Waktu</span>
              ) : timeSpentSec > 90 ? (
                <span className="font-sans text-[10px]">⚠️ &gt;90s</span>
              ) : isFast ? (
                <span className="font-sans text-[10px]">⚡ Cepat</span>
              ) : null}
            </Badge>
          )}
        </div>

        <QuestionText
          text={q.text}
          className="text-sm font-medium leading-relaxed"
        />

        {q.visual && (
          <div className="rounded bg-muted/40 p-2">
            <VisualPanel spec={q.visual} />
          </div>
        )}

        <div className="text-sm">
          {q.category === "TKP" && q.points ? (
            <p>
              Pilihan Anda: <b>{choice != null ? LETTERS[choice] : "—"}</b> (
              {q.options[choice ?? 0]?.text ?? "(gambar)"})
            </p>
          ) : (
            <>
              <p className={wrong ? "text-rose-600 dark:text-rose-400 font-medium" : ""}>
                Pilihan Anda: <b>{choice != null ? LETTERS[choice] : "tidak dijawab"}</b>
              </p>
              <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                Kunci: <b>{LETTERS[q.answer ?? 0]}</b> — {q.options[q.answer ?? 0]?.text ?? "(gambar)"}
              </p>
            </>
          )}
        </div>

        {/* Pacing Advice Box for Time-Trap Questions */}
        {isTimeTrap && (
          <div className="rounded-lg border border-amber-300/80 bg-amber-50/80 p-2.5 text-xs text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200 leading-relaxed">
            <p className="font-semibold flex items-center gap-1.5 mb-0.5">
              <Clock className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
              Catatan Pacing: Soal ini menghabiskan waktu {timeSpentSec} detik (&gt;90 detik).
            </p>
            <p className="opacity-90">
              Pada tes CAT BKN sesungguhnya, usahakan tidak terpancing menghitung atau menalar lebih dari 1 menit pada satu soal. Tandai ragu-ragu dan amankan soal-soal lain yang lebih cepat dikerjakan.
            </p>
          </div>
        )}

        <div className="rounded-lg bg-muted/40 p-3 text-sm leading-relaxed">
          <p className="mb-1 font-semibold">Pembahasan</p>
          <p className="text-muted-foreground">{q.explanation}</p>
        </div>

        <div>
          {aiExplain ? (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm leading-relaxed dark:border-purple-900/50 dark:bg-purple-950/30">
              <div className="mb-1 flex items-center justify-between text-xs font-semibold text-purple-800 dark:text-purple-300">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> Penjelasan AI
                </span>
                {fromCache && (
                  <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-normal text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                    Tersimpan di Cache
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap text-purple-950 dark:text-purple-200">{aiExplain}</p>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={askAi} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Minta penjelasan AI
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
