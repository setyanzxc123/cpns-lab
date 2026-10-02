// Derivasi progres belajar dari riwayat sesi — fungsi murni tanpa I/O agar
// mudah diuji dan dipakai lintas halaman (Beranda, Progres, payload AI).
// Pemetaan questionId ke sub/kategori memakai bank soal yang dimuat pemanggil.

import type { Category, Question, SessionResult, SubCategory } from "./types";

/** Minimal jumlah jawaban sebuah sub sebelum dianggap cukup data. */
const MIN_ATTEMPTS = 5;

/** Paruh bobot: sesi ke-N terakhir diberi bobot 0.5^(N / HALF_LIFE_SESSIONS). */
const HALF_LIFE_SESSIONS = 5;

export interface SubMastery {
  sub: SubCategory;
  category: Category;
  /** Akurasi berbobot ke sesi terbaru, 0-100. */
  acc: number;
  attempts: number;
  lastPracticedAt: number;
}

export interface Progress {
  totalSessions: number;
  totalQuestions: number;
  totalMinutes: number;
  /** Akurasi 7/30 hari terakhir (persen) — null bila tak ada jawaban pada rentang itu. */
  accuracy7d: number | null;
  accuracy30d: number | null;
  /** accuracy7d - accuracy30d; null bila salah satu belum terhitung. */
  delta: number | null;
  subMastery: SubMastery[];
  /** Sub dengan akurasi berbobot terendah yang datanya cukup; null bila belum ada. */
  focusSub: SubMastery | null;
}

function windowAccuracy(
  sessions: { finishedAt: number; answers: { correct: boolean | null }[] }[],
  sinceMs: number,
  now: number,
): number | null {
  let correct = 0;
  let total = 0;
  for (const r of sessions) {
    if (r.finishedAt < now - sinceMs) continue;
    for (const a of r.answers) {
      if (a.correct === null) continue;
      total += 1;
      if (a.correct) correct += 1;
    }
  }
  return total > 0 ? Math.round((correct / total) * 100) : null;
}

/**
 * Akurasi berbobot dari sesi berurutan (lama → baru): sesi terbaru diberi
 * bobot lebih besar sehingga angka mengikuti kemampuan saat ini.
 */
function weightedAccuracy(sessions: { correct: number; total: number }[]): number {
  let weighted = 0;
  let weightSum = 0;
  sessions.forEach((s, i) => {
    const weight = Math.pow(0.5, (sessions.length - 1 - i) / HALF_LIFE_SESSIONS);
    weighted += weight * (s.correct / s.total);
    weightSum += weight;
  });
  return weightSum > 0 ? Math.round((weighted / weightSum) * 100) : 0;
}

/**
 * Ringkasan progres dari seluruh riwayat sesi (urutan apa pun —
 * fungsi ini mengurutkan sendiri berdasarkan finishedAt).
 * Jawaban dengan questionId yang tak dikenal di bank diabaikan.
 */
export function deriveProgress(results: SessionResult[], bank: Question[]): Progress {
  const now = Date.now();
  const sorted = [...results].sort((a, b) => a.finishedAt - b.finishedAt);

  const accuracy7d = windowAccuracy(sorted, 7 * 24 * 60 * 60 * 1000, now);
  const accuracy30d = windowAccuracy(sorted, 30 * 24 * 60 * 60 * 1000, now);
  const delta =
    accuracy7d !== null && accuracy30d !== null ? accuracy7d - accuracy30d : null;

  const byId = new Map(bank.map((q) => [q.id, q]));
  const subToCat = new Map<SubCategory, Category>();
  for (const q of bank) subToCat.set(q.sub, q.category);

  // Jawaban dikelompokkan per sub per sesi: satu sesi memuat sub campuran,
  // dan bobot akurasi dihitung per sesi (bukan per soal) agar sesi panjang
  // tidak mendominasi.
  interface SubEntry {
    category: Category;
    sessions: { correct: number; total: number }[];
    attempts: number;
    lastAt: number;
  }
  const perSub = new Map<SubCategory, SubEntry>();

  for (const r of sorted) {
    const perSubInSession = new Map<SubCategory, { correct: number; total: number }>();
    for (const a of r.answers) {
      if (a.correct === null) continue;
      const q = byId.get(a.questionId);
      if (!q) continue;
      const cur = perSubInSession.get(q.sub) ?? { correct: 0, total: 0 };
      cur.total += 1;
      if (a.correct) cur.correct += 1;
      perSubInSession.set(q.sub, cur);
    }
    for (const [sub, s] of perSubInSession) {
      const entry = perSub.get(sub) ?? {
        category: subToCat.get(sub) ?? "TWK",
        sessions: [],
        attempts: 0,
        lastAt: r.finishedAt,
      };
      entry.sessions.push(s);
      entry.attempts += s.total;
      entry.lastAt = Math.max(entry.lastAt, r.finishedAt);
      perSub.set(sub, entry);
    }
  }

  const subMastery: SubMastery[] = [...perSub.entries()].map(([sub, e]) => ({
    sub,
    category: e.category,
    acc: weightedAccuracy(e.sessions),
    attempts: e.attempts,
    lastPracticedAt: e.lastAt,
  }));

  const eligible = subMastery.filter((m) => m.attempts >= MIN_ATTEMPTS);
  const focusSub =
    eligible.length > 0
      ? eligible.reduce((worst, m) => (m.acc < worst.acc ? m : worst))
      : null;

  return {
    totalSessions: results.length,
    totalQuestions: results.reduce((n, r) => n + r.answers.length, 0),
    totalMinutes: Math.round(results.reduce((n, r) => n + r.durationSec, 0) / 60),
    accuracy7d,
    accuracy30d,
    delta,
    subMastery,
    focusSub,
  };
}

/** Akurasi per sesi untuk satu sub (lama → baru) — bahan tren di halaman Progres. */
export function subTrend(
  results: SessionResult[],
  bank: Question[],
  sub: SubCategory,
): { label: string; pct: number }[] {
  const bySub = new Map(bank.filter((q) => q.sub === sub).map((q) => [q.id, q.sub]));
  const sorted = [...results].sort((a, b) => a.finishedAt - b.finishedAt);
  const out: { label: string; pct: number }[] = [];
  for (const r of sorted) {
    let correct = 0;
    let total = 0;
    for (const a of r.answers) {
      if (!bySub.has(a.questionId) || a.correct === null) continue;
      total += 1;
      if (a.correct) correct += 1;
    }
    if (total > 0) {
      out.push({
        label: new Date(r.finishedAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        }),
        pct: Math.round((correct / total) * 100),
      });
    }
  }
  return out;
}

/** Akurasi per minggu (mulai Senin), hanya minggu yang punya jawaban. */
export function weeklyAccuracy(
  results: SessionResult[],
): { week: string; pct: number }[] {
  const byWeek = new Map<number, { correct: number; total: number }>();
  for (const r of results) {
    const d = new Date(r.finishedAt);
    const day = (d.getDay() + 6) % 7; // Senin = 0
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
    const key = monday.getTime();
    const cur = byWeek.get(key) ?? { correct: 0, total: 0 };
    for (const a of r.answers) {
      if (a.correct === null) continue;
      cur.total += 1;
      if (a.correct) cur.correct += 1;
    }
    byWeek.set(key, cur);
  }
  return [...byWeek.entries()]
    .sort(([a], [b]) => a - b)
    .map(([key, s]) => ({
      week: new Date(key).toISOString().slice(0, 10),
      pct: Math.round((s.correct / s.total) * 100),
    }));
}
