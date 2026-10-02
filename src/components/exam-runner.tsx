"use client";

// Komponen pengerjaan soal — dipakai untuk simulasi (berwaktu,
// navigasi grid) maupun latihan (feedback instan + pembahasan).

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExamConfig, Question, RunningExam, SessionResult } from "@/lib/types";
import { sampleQuestions } from "@/data/bank";
import { computeSubScores, formatTime, useCountdown } from "@/hooks/use-exam";
import { localStore } from "@/lib/storage";
import { GlyphPanelOption, VisualPanel } from "@/components/figural";
import { QuestionText } from "@/components/question-text";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Flag, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, Sparkles } from "lucide-react";

const LETTERS = ["A", "B", "C", "D", "E"];

interface Props {
  bank: Question[];
  config: ExamConfig;
  /** mode latihan: feedback langsung setelah memilih */
  onFinished: (result: SessionResult) => void | Promise<void>;
  onAbort?: () => void;
}

export function ExamRunner({ bank, config, onFinished, onAbort }: Props) {
  const router = useRouter();
  const aiOn = Boolean(process.env.NEXT_PUBLIC_HAS_GEMINI);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [choices, setChoices] = useState<Record<string, number | null>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [current, setCurrent] = useState(0);
  const [timeSpent, setTimeSpent] = useState<Record<string, number>>({});
  const [currentQuestionSec, setCurrentQuestionSec] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());
  const [endsAt, setEndsAt] = useState<number | null>(() =>
    config.durationSec > 0 ? Date.now() + config.durationSec * 1000 : null,
  );
  const finishedRef = useRef(false);
  const persistedRef = useRef(false);
  const questionEnteredAtRef = useRef<number>(0);

  useEffect(() => {
    const saved = localStore.getRunning() as RunningExam | null;
    const canRestore =
      saved &&
      saved.config?.title === config.title &&
      saved.config?.mode === config.mode &&
      (!saved.endsAt || saved.endsAt > Date.now());

    if (canRestore) {
      const qs = saved.questionIds
        .map((id) => bank.find((q) => q.id === id))
        .filter((q): q is Question => Boolean(q));

      if (qs.length === saved.questionIds.length && qs.length > 0) {
        setQuestions(qs);
        setChoices(saved.choices || {});
        setFlags(saved.flags || {});
        const restoredIdx = Math.min(saved.currentIndex || 0, qs.length - 1);
        setCurrent(restoredIdx);
        setTimeSpent(saved.timeSpent || {});
        questionEnteredAtRef.current = Date.now();
        setStartedAt(saved.startedAt);
        setEndsAt(saved.endsAt);
        return;
      }
    }

    const { questions: qs } = sampleQuestions(bank, config);
    const now = Date.now();
    const newEndsAt = config.durationSec > 0 ? now + config.durationSec * 1000 : null;
    setStartedAt(now);
    setEndsAt(newEndsAt);
    setQuestions(qs);
    questionEnteredAtRef.current = now;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update live counter per detik untuk soal yang sedang aktif
  useEffect(() => {
    if (finishedRef.current) return;
    const tick = () => {
      const enteredAt = questionEnteredAtRef.current || Date.now();
      const delta = Math.max(0, Math.floor((Date.now() - enteredAt) / 1000));
      const curQid = questions && questions[current] ? questions[current].id : null;
      const base = curQid ? timeSpent[curQid] ?? 0 : 0;
      setCurrentQuestionSec(base + delta);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [questions, current, timeSpent]);

  const changeCurrentIndex = useCallback(
    (nextIndex: number) => {
      if (!questions || !questions[current]) return;
      const now = Date.now();
      const enteredAt = questionEnteredAtRef.current || now;
      const deltaSec = Math.max(0, Math.round((now - enteredAt) / 1000));
      questionEnteredAtRef.current = now;
      const curQid = questions[current].id;

      setTimeSpent((prev) => ({
        ...prev,
        [curQid]: (prev[curQid] ?? 0) + deltaSec,
      }));

      setCurrent(nextIndex);
      const nextQid = questions[nextIndex]?.id;
      const baseForNext = nextQid ? timeSpent[nextQid] ?? 0 : 0;
      setCurrentQuestionSec(baseForNext);
    },
    [questions, current, timeSpent],
  );

  const answeredCount = questions ? questions.filter((q) => choices[q.id] != null).length : 0;

  const finish = useCallback(
    async (auto = false) => {
      if (!questions || finishedRef.current) return;
      finishedRef.current = true;

      // Akumulasikan detik pengerjaan di soal yang sedang dibuka sebelum disubmit
      const now = Date.now();
      const enteredAt = questionEnteredAtRef.current || now;
      const deltaSec = Math.max(0, Math.round((now - enteredAt) / 1000));
      const curQid = questions[current]?.id;
      const finalTimeSpent = {
        ...timeSpent,
        ...(curQid ? { [curQid]: (timeSpent[curQid] ?? 0) + deltaSec } : {}),
      };

      const {
        answers,
        subScores,
        totalScore,
        maxScore,
        passed,
        passingGradeSummary,
        avgTimePerQuestionSec,
        pacingStats,
      } = computeSubScores(questions, choices, finalTimeSpent, config.mode);

      const finishedAt = Date.now();
      const result: SessionResult = {
        id: `S-${finishedAt}`,
        mode: config.mode,
        title: auto ? `${config.title} (waktu habis)` : config.title,
        startedAt,
        finishedAt,
        durationSec: Math.round((finishedAt - startedAt) / 1000),
        answers,
        subScores,
        totalScore,
        maxScore,
        passed,
        passingGradeSummary,
        avgTimePerQuestionSec,
        pacingStats,
      };
      localStore.clearRunning();
      const { getRepo } = await import("@/lib/repository");
      const repo = await getRepo();
      await repo.saveResult(result);
      for (const a of answers) {
        if (a.correct !== null) await repo.recordWrong(a.questionId, !a.correct);
      }
      await onFinished(result);
    },
    [questions, choices, timeSpent, current, config, startedAt, onFinished],
  );

  const left = useCountdown(endsAt, () => void finish(true));

  // Persist sesi berjalan agar bisa dilanjutkan bila halaman tertutup
  useEffect(() => {
    if (!questions || finishedRef.current) return;
    if (!persistedRef.current && questions.length > 0) persistedRef.current = true;
    localStore.saveRunning({
      config,
      questionIds: questions.map((q) => q.id),
      choices,
      flags,
      startedAt,
      endsAt,
      currentIndex: current,
      timeSpent,
    });
  }, [questions, choices, flags, startedAt, endsAt, current, config, timeSpent]);

  if (!questions) {
    return <p className="text-center text-muted-foreground">Menyiapkan soal…</p>;
  }
  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-2">
          <p className="font-medium">Tidak ada soal yang cocok dengan konfigurasi ini.</p>
          <p className="text-sm text-muted-foreground">
            Coba kurangi jumlah soal.
          </p>
          {onAbort && (
            <Button variant="outline" onClick={onAbort} className="mt-2">
              Kembali
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const q = questions[current];
  const chosen = choices[q.id] ?? null;
  const showFeedback = config.mode === "latihan" && chosen !== null;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Header CAT */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
        <div>
          <p className="text-sm font-semibold">{config.title}</p>
          <p className="text-xs text-muted-foreground">
            Terjawab {answeredCount} / {questions.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {endsAt ? (
            <div
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 font-mono text-lg font-bold ${
                left < 300
                  ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
              }`}
            >
              <Clock className="h-4 w-4" />
              {formatTime(left)}
            </div>
          ) : (
            <Badge variant="secondary">Mode latihan</Badge>
          )}
          {onAbort && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                localStore.clearRunning();
                onAbort();
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Keluar
            </Button>
          )}
        </div>
      </div>

      {/* Navigasi grid (simulasi) */}
      {config.mode === "simulasi" && (
        <div className="rounded-lg border bg-card p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Navigasi soal</p>
          <div className="flex flex-wrap gap-1.5">
            {questions.map((qq, i) => {
              const answered = choices[qq.id] != null;
              const flagged = flags[qq.id];
              return (
                <button
                  key={qq.id}
                  onClick={() => changeCurrentIndex(i)}
                  aria-pressed={i === current}
                  aria-label={`Soal ${i + 1}${flagged ? " — ditandai ragu-ragu" : answered ? " — terjawab" : " — belum dijawab"}`}
                  className={`relative h-8 w-8 rounded text-xs font-semibold transition-colors after:absolute after:-inset-1.5 after:content-[''] ${
                    i === current
                      ? "bg-primary text-primary-foreground ring-2 ring-offset-1 ring-primary"
                      : answered
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                  } ${flagged ? "outline outline-2 outline-amber-500" : ""}`}
                  title={flagged ? "Ditandai ragu-ragu" : answered ? "Terjawab" : "Belum dijawab"}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Kartu soal */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <Badge variant="outline">{q.category}</Badge>
              <span className="ml-2 text-xs text-muted-foreground">{q.sub}</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Indikator pacing waktu soal ini — relevan saat berbentuk waktu */}
              {config.mode === "simulasi" && (
                <div
                  className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-xs transition-colors ${
                    currentQuestionSec > 90
                      ? "bg-red-100 font-semibold text-red-700 dark:bg-red-950/70 dark:text-red-400"
                      : currentQuestionSec > 54
                        ? "bg-amber-100 font-medium text-amber-700 dark:bg-amber-950/70 dark:text-amber-400"
                        : "bg-muted text-muted-foreground"
                  }`}
                  title={
                    currentQuestionSec > 90
                      ? "Waspada: Pengerjaan soal ini sudah >90 detik! Target BKN rata-rata 54 detik."
                      : "Durasi pada nomor soal ini"
                  }
                  aria-label={
                    currentQuestionSec > 90
                      ? `Waspada: pengerjaan soal ini ${formatTime(currentQuestionSec)}, melebihi 90 detik. Target BKN rata-rata 54 detik.`
                      : `Durasi pada soal ini ${formatTime(currentQuestionSec)}`
                  }
                >
                  <Clock className="h-3 w-3" aria-hidden />
                  <span>{formatTime(currentQuestionSec)}</span>
                </div>
              )}
              <span className="text-sm font-semibold text-muted-foreground">
                No. {current + 1}
              </span>
              {config.mode === "simulasi" && (
                <Button
                  variant={flags[q.id] ? "default" : "outline"}
                  size="sm"
                  aria-pressed={Boolean(flags[q.id])}
                  onClick={() => setFlags((f) => ({ ...f, [q.id]: !f[q.id] }))}
                >
                  <Flag className="h-3.5 w-3.5" aria-hidden />
                  Ragu-ragu
                </Button>
              )}
            </div>
          </div>

          <QuestionText
            text={q.text}
            className="text-base leading-relaxed font-medium"
          />

          {q.visual && (
            <div className="rounded-lg bg-muted/40 p-3">
              <VisualPanel spec={q.visual} />
            </div>
          )}

          {(() => {
            const hasVisual = q.options.some((o) => o.visual);
            return (
              <div className={hasVisual ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5" : "space-y-2"}>
                {q.options.map((opt, i) => {
                  const selected = chosen === i;
                  let feedbackCls = "";
                  if (showFeedback && q.category !== "TKP") {
                    if (i === q.answer) feedbackCls = "border-green-600 bg-green-50 dark:border-green-500/80 dark:bg-green-950/40 text-green-950 dark:text-green-200 ring-2 ring-green-600/30";
                    else if (selected) feedbackCls = "border-red-500 bg-red-50 dark:border-red-500/80 dark:bg-red-950/40 text-red-950 dark:text-red-200 ring-2 ring-red-500/30";
                  } else if (showFeedback && q.category === "TKP" && selected) {
                    feedbackCls = "border-blue-600 bg-blue-50 dark:border-blue-500/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 ring-2 ring-blue-600/30";
                  }

                  if (hasVisual) {
                    return (
                      <button
                        key={i}
                        disabled={showFeedback}
                        onClick={() => setChoices((c) => ({ ...c, [q.id]: i }))}
                        aria-pressed={selected}
                        aria-label={`Pilihan ${LETTERS[i]}${selected ? " — dipilih" : ""}`}
                        className={`group relative flex flex-col items-center justify-between gap-2 rounded-xl border p-2.5 text-center transition-all hover:border-primary/60 hover:shadow-sm ${
                          selected ? "border-primary bg-primary/5 ring-2 ring-primary/40 shadow-sm" : "bg-card hover:bg-muted/40"
                        } ${feedbackCls} ${showFeedback ? "cursor-default" : ""}`}
                      >
                        <div className="flex w-full items-center justify-between px-0.5">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                              selected ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground group-hover:border-foreground group-hover:text-foreground"
                            }`}
                          >
                            {LETTERS[i]}
                          </span>
                          {showFeedback && q.category !== "TKP" && i === q.answer && (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" aria-hidden />
                          )}
                          {showFeedback && q.category !== "TKP" && selected && i !== q.answer && (
                            <XCircle className="h-5 w-5 shrink-0 text-red-500" aria-hidden />
                          )}
                        </div>
                        <div className="flex w-full flex-1 items-center justify-center">
                          {opt.visual ? (
                            <GlyphPanelOption glyph={opt.visual} />
                          ) : (
                            <span className="text-sm font-medium">{opt.text}</span>
                          )}
                        </div>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={i}
                      disabled={showFeedback}
                      onClick={() => setChoices((c) => ({ ...c, [q.id]: i }))}
                      aria-pressed={selected}
                      aria-label={`Pilihan ${LETTERS[i]}: ${opt.text}${selected ? " — dipilih" : ""}`}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                        selected ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "hover:bg-muted/50"
                      } ${feedbackCls} ${showFeedback ? "cursor-default" : ""}`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                          selected ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {LETTERS[i]}
                      </span>
                      <span className="text-sm">{opt.text}</span>
                      {showFeedback && q.category !== "TKP" && i === q.answer && (
                        <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-green-600" />
                      )}
                      {showFeedback && q.category !== "TKP" && selected && i !== q.answer && (
                        <XCircle className="ml-auto h-5 w-5 shrink-0 text-red-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {showFeedback && q.category === "TKP" && q.points && (
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Nilai pilihan Anda: {q.points[chosen ?? 0]} dari 5
            </p>
          )}

          {showFeedback && (
            <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 text-sm leading-relaxed dark:border-blue-900/50 dark:bg-blue-950/30">
              <p className="mb-1 font-semibold text-blue-800 dark:text-blue-300">Pembahasan</p>
              {q.category !== "TKP" && (
                <p className="mb-1">
                  Jawaban benar: <b>{LETTERS[q.answer ?? 0]}</b>
                </p>
              )}
              <p className="text-muted-foreground">{q.explanation}</p>
              {aiOn && (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/ai?q=${encodeURIComponent(q.id)}${chosen != null ? `&c=${chosen}` : ""}`,
                    )
                  }
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  Tanya lebih lanjut dengan AI
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kontrol */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={() => changeCurrentIndex(Math.max(0, current - 1))} disabled={current === 0}>
          <ChevronLeft className="h-4 w-4" /> Sebelumnya
        </Button>
        {config.mode === "latihan" && chosen !== null && current < questions.length - 1 ? (
          <Button onClick={() => changeCurrentIndex(current + 1)}>Soal berikutnya</Button>
        ) : current === questions.length - 1 ? (
          <Button onClick={() => setConfirmOpen(true)}>Selesai &amp; Lihat Hasil</Button>
        ) : (
          <Button variant="outline" onClick={() => changeCurrentIndex(current + 1)}>
            Berikutnya <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Akhiri pengerjaan?</DialogTitle>
            <DialogDescription>
              {answeredCount < questions.length
                ? `Masih ada ${questions.length - answeredCount} soal yang belum dijawab. Soal yang tidak dijawab bernilai 0.`
                : "Semua soal sudah terjawab. Hasil akan langsung dihitung."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Periksa lagi
            </Button>
            <Button onClick={() => void finish(false)}>Ya, akhiri</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
