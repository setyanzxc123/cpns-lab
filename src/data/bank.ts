import type { Category, Question, SubCategory } from "@/lib/types";
import { twkQuestions } from "./questions-twk";
import { tiuQuestions } from "./questions-tiu";
import { tkpQuestions } from "./questions-tkp";

export const BUILT_IN_QUESTIONS: Question[] = [
  ...twkQuestions,
  ...tiuQuestions,
  ...tkpQuestions,
];

export const CATEGORY_INFO: Record<
  Category,
  { name: string; desc: string; color: string }
> = {
  TWK: {
    name: "Tes Wawasan Kebangsaan",
    desc: "Pancasila, UUD 1945, NKRI, Bhinneka Tunggal Ika, integritas, dan bela negara.",
    color: "#2563eb",
  },
  TIU: {
    name: "Tes Intelegensi Umum",
    desc: "Kemampuan verbal, numerik, figural, dan penalaran logika.",
    color: "#7c3aed",
  },
  TKP: {
    name: "Tes Karakter Pribadi",
    desc: "Pelayanan publik, jejaring kerja, sosial budaya, TIK, profesionalisme, anti radikalisme.",
    color: "#059669",
  },
};

export const SUB_BY_CATEGORY: Record<Category, SubCategory[]> = {
  TWK: [
    "Pancasila",
    "UUD 1945",
    "Bhinneka Tunggal Ika",
    "NKRI",
    "Integritas",
    "Bela Negara",
    "Anti Radikalisme",
  ],
  TIU: ["Verbal", "Numerik", "Figural", "Logika"],
  TKP: [
    "Pelayanan Publik",
    "Jejaring Kerja",
    "Sosial Budaya",
    "Teknologi Informasi",
    "Profesionalisme",
    "Anti Radikalisme",
  ],
};

/** Muat bank soal: bawaan + soal kustom (localStorage). */
export async function loadBank(): Promise<Question[]> {
  const { getRepo } = await import("@/lib/repository");
  const repo = await getRepo();
  const custom = await repo.listCustomQuestions().catch(() => []);
  return [...BUILT_IN_QUESTIONS, ...custom];
}

/** Acak urutan (Fisher-Yates) tanpa memutasi array asli. */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface SamplingResult {
  questions: Question[];
  shortfall: Partial<Record<Category, number>>;
}

/**
 * Ambil sampel soal sesuai ExamConfig.
 * Soal figural dan pilihan visual dinormalisasi; pilihan A-D diacak
 * bersama kunci jawaban sehingga posisi kunci tidak bisa ditebak.
 */
export function sampleQuestions(bank: Question[], cfg: import("@/lib/types").ExamConfig): SamplingResult {
  const picked: Question[] = [];
  const shortfall: Partial<Record<Category, number>> = {};
  const cats: Category[] = ["TWK", "TIU", "TKP"];
  for (const cat of cats) {
    const want = cfg.counts[cat] ?? 0;
    if (want <= 0) continue;
    let pool = bank.filter(
      (q) => q.category === cat && (!cfg.subs || cfg.subs.includes(q.sub)),
    );
    if (cfg.onlyIds) {
      const set = new Set(cfg.onlyIds);
      pool = pool.filter((q) => set.has(q.id));
    }
    const chosen = shuffle(pool).slice(0, want);
    if (chosen.length < want) shortfall[cat] = want - chosen.length;
    for (const q of chosen) picked.push(shuffleOptions(q));
  }
  return { questions: picked, shortfall };
}

/** Acak posisi opsi sambil menjaga kunci jawaban/nilai poin. */
function shuffleOptions(q: Question): Question {
  const idx = shuffle(q.options.map((_, i) => i));
  const options = idx.map((i) => q.options[i]);
  if (q.category === "TKP" && q.points) {
    const points = idx.map((i) => q.points![i]);
    return { ...q, options, points };
  }
  if (q.answer !== undefined) {
    return { ...q, options, answer: idx.indexOf(q.answer) };
  }
  return { ...q, options };
}
