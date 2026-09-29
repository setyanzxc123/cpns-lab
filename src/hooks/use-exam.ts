"use client";

// Quiz engine: mengelola sesi ujian (sampling, jawaban, timer,
// penilaian, persistensi sesi berjalan agar bisa dilanjutkan).

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BKN_BENCHMARK_PACE_SEC,
  BKN_MAX_SCORE,
  BKN_PASSING_GRADE,
  type Category,
  type ExamConfig,
  type PacingStats,
  type PassingGradeSummary,
  type Question,
  type RunningExam,
  type SessionAnswer,
  type SessionResult,
  type SubScore,
} from "@/lib/types";
import { sampleQuestions } from "@/data/bank";
import { localStore } from "@/lib/storage";

interface ExamState {
  config: ExamConfig;
  questions: Question[];
  choices: Record<string, number | null>;
  flags: Record<string, boolean>;
  startedAt: number;
  endsAt: number | null;
  currentIndex: number;
  timeSpent: Record<string, number>;
}

function questionValue(q: Question, choice: number | null): { value: number; correct: boolean | null } {
  if (choice === null) return { value: 0, correct: null };
  if (q.category === "TKP" && q.points) {
    const v = q.points[choice] ?? 0;
    return { value: v, correct: v >= 4 };
  }
  const ok = q.answer === choice;
  return { value: ok ? 5 : 0, correct: ok };
}

export function computeSubScores(
  questions: Question[],
  choices: Record<string, number | null>,
  timeSpent?: Record<string, number>,
  mode: "simulasi" | "latihan" = "simulasi",
): {
  subScores: SubScore[];
  answers: SessionAnswer[];
  totalScore: number;
  maxScore: number;
  passed?: boolean;
  passingGradeSummary?: PassingGradeSummary;
  avgTimePerQuestionSec?: number;
  pacingStats?: PacingStats;
} {
  const byCat = new Map<Category, SubScore>();
  const answers: SessionAnswer[] = [];
  let totalScore = 0;
  let maxScore = 0;

  for (const q of questions) {
    const { value, correct } = questionValue(q, choices[q.id] ?? null);
    const spentSec = timeSpent && timeSpent[q.id] != null ? Math.max(0, Math.round(timeSpent[q.id])) : undefined;
    answers.push({
      questionId: q.id,
      choice: choices[q.id] ?? null,
      correct,
      value,
      timeSpentSec: spentSec,
    });
    totalScore += value;
    const max = 5;
    maxScore += max;
    const cur = byCat.get(q.category) ?? {
      category: q.category,
      correct: 0,
      total: 0,
      score: 0,
      maxScore: 0,
    };
    if (correct) cur.correct += 1;
    cur.total += 1;
    cur.score += value;
    cur.maxScore += max;
    byCat.set(q.category, cur);
  }

  // Hitung Nilai Ambang Batas (Passing Grade) per subtes
  const subScores: SubScore[] = [];
  for (const [cat, cur] of byCat.entries()) {
    let pg = BKN_PASSING_GRADE[cat];
    const isStandardCount =
      (cat === "TWK" && cur.total === 30) ||
      (cat === "TIU" && cur.total === 35) ||
      (cat === "TKP" && (cur.total === 45 || cur.total === 40));

    // Jika jumlah soal tidak standar (mis. paket mini / custom), skala ambang batas proporsional
    if (!isStandardCount && cur.maxScore > 0) {
      pg = Math.round((cur.maxScore / BKN_MAX_SCORE[cat]) * BKN_PASSING_GRADE[cat]);
    }

    cur.passingGrade = pg;
    cur.passed = cur.score >= pg;
    subScores.push(cur);
  }

  // Ringkasan status kelulusan passing grade BKN
  const twkCount = byCat.get("TWK")?.total ?? 0;
  const tiuCount = byCat.get("TIU")?.total ?? 0;
  const tkpCount = byCat.get("TKP")?.total ?? 0;
  const isFullPackage = twkCount === 30 && tiuCount === 35 && (tkpCount === 45 || tkpCount === 40);
  const allPassed = subScores.length > 0 && subScores.every((s) => s.passed);
  const failedCategories = subScores.filter((s) => !s.passed).map((s) => s.category);
  const totalPassingGrade = subScores.reduce((acc, s) => acc + (s.passingGrade ?? 0), 0);

  const passingGradeSummary: PassingGradeSummary = {
    isFullPackage,
    allPassed,
    totalPassingGrade,
    failedCategories,
  };

  // Pacing analytics
  let pacingStats: PacingStats | undefined = undefined;
  let avgTimePerQuestionSec: number | undefined = undefined;

  if (timeSpent && questions.length > 0) {
    const spentList = questions.map((q) => timeSpent[q.id] ?? 0);
    const totalSpent = spentList.reduce((acc, v) => acc + v, 0);
    const avgSec = Math.round(totalSpent / questions.length);
    avgTimePerQuestionSec = avgSec;

    let fastCount = 0;
    let normalCount = 0;
    let slowCount = 0;
    let trapCount = 0;

    for (const sec of spentList) {
      if (sec <= 0) continue;
      if (sec < 45) fastCount++;
      else if (sec <= 90) normalCount++;
      else if (sec <= 120) slowCount++;
      else trapCount++;
    }

    pacingStats = {
      avgTimeSec: avgSec,
      benchmarkSec: BKN_BENCHMARK_PACE_SEC,
      fastQuestionsCount: fastCount,
      normalQuestionsCount: normalCount,
      slowQuestionsCount: slowCount,
      timeTrapsCount: trapCount,
    };
  }

  return {
    subScores,
    answers,
    totalScore,
    maxScore,
    passed: mode === "simulasi" ? allPassed : undefined,
    passingGradeSummary,
    avgTimePerQuestionSec,
    pacingStats,
  };
}

export function useExam(bank: Question[]) {
  const [exam, setExam] = useState<ExamState | null>(null);
  const bankRef = useRef(bank);
  useEffect(() => {
    bankRef.current = bank;
  }, [bank]);

  // Pulihkan sesi berjalan (mis. browser tertutup di tengah ujian)
  useEffect(() => {
    const saved = localStore.getRunning() as RunningExam | null;
    if (!saved || bank.length === 0) return;
    const qs = saved.questionIds
      .map((id) => bank.find((q) => q.id === id))
      .filter((q): q is Question => Boolean(q));
    if (qs.length === 0) {
      localStore.clearRunning();
      return;
    }
    // sesi kedaluwarsa (timer habis saat tertutup) → buang
    if (saved.endsAt && saved.endsAt < Date.now()) {
      localStore.clearRunning();
      return;
    }
    setExam({
      config: saved.config,
      questions: qs,
      choices: saved.choices,
      flags: saved.flags,
      startedAt: saved.startedAt,
      endsAt: saved.endsAt,
      currentIndex: saved.currentIndex,
      timeSpent: saved.timeSpent || {},
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bank.length === 0]);

  const persist = useCallback((state: ExamState | null) => {
    if (!state) {
      localStore.clearRunning();
      return;
    }
    const running: RunningExam = {
      config: state.config,
      questionIds: state.questions.map((q) => q.id),
      choices: state.choices,
      flags: state.flags,
      startedAt: state.startedAt,
      endsAt: state.endsAt,
      currentIndex: state.currentIndex,
      timeSpent: state.timeSpent,
    };
    localStore.saveRunning(running);
  }, []);

  const start = useCallback(
    (config: ExamConfig) => {
      const { questions, shortfall } = sampleQuestions(bankRef.current, config);
      if (questions.length === 0) return null;
      const state: ExamState = {
        config,
        questions,
        choices: {},
        flags: {},
        startedAt: Date.now(),
        endsAt: config.durationSec > 0 ? Date.now() + config.durationSec * 1000 : null,
        currentIndex: 0,
        timeSpent: {},
      };
      setExam(state);
      persist(state);
      return { shortfall };
    },
    [persist],
  );

  const select = useCallback(
    (qid: string, choice: number) => {
      setExam((prev) => {
        if (!prev) return prev;
        const next = { ...prev, choices: { ...prev.choices, [qid]: choice } };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const toggleFlag = useCallback(
    (qid: string) => {
      setExam((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          flags: { ...prev.flags, [qid]: !prev.flags[qid] },
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const goTo = useCallback(
    (index: number) => {
      setExam((prev) => {
        if (!prev) return prev;
        const next = { ...prev, currentIndex: Math.max(0, Math.min(index, prev.questions.length - 1)) };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const finish = useCallback(async (): Promise<SessionResult | null> => {
    if (!exam) return null;
    const { subScores, answers, totalScore, maxScore, passed, passingGradeSummary, avgTimePerQuestionSec, pacingStats } =
      computeSubScores(exam.questions, exam.choices, exam.timeSpent, exam.config.mode);
    const finishedAt = Date.now();
    const result: SessionResult = {
      id: `S-${finishedAt}`,
      mode: exam.config.mode,
      title: exam.config.title,
      startedAt: exam.startedAt,
      finishedAt,
      durationSec: Math.round((finishedAt - exam.startedAt) / 1000),
      answers,
      subScores,
      totalScore,
      maxScore,
      passed,
      passingGradeSummary,
      avgTimePerQuestionSec,
      pacingStats,
    };
    setExam(null);
    persist(null);

    const { getRepo } = await import("@/lib/repository");
    const repo = await getRepo();
    await repo.saveResult(result);
    for (const a of answers) {
      if (a.correct !== null) await repo.recordWrong(a.questionId, !a.correct);
    }
    return result;
  }, [exam, persist]);

  const abort = useCallback(() => {
    setExam(null);
    persist(null);
  }, [persist]);

  return { exam, start, select, toggleFlag, goTo, finish, abort };
}

/** Countdown sisa waktu; onZero dipanggil sekali saat mencapai 0. */
export function useCountdown(endsAt: number | null | undefined, onZero?: () => void) {
  const [left, setLeft] = useState<number>(() =>
    endsAt ? Math.max(0, Math.round((endsAt - Date.now()) / 1000)) : 0,
  );
  const firedRef = useRef(false);
  const onZeroRef = useRef(onZero);
  useEffect(() => {
    onZeroRef.current = onZero;
  }, [onZero]);

  useEffect(() => {
    firedRef.current = false;
    if (!endsAt) {
      setLeft(0);
      return;
    }
    const tick = () => {
      const s = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setLeft(s);
      if (s === 0 && !firedRef.current) {
        firedRef.current = true;
        onZeroRef.current?.();
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  return left;
}

export function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
