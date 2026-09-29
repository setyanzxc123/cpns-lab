// Tipe data inti aplikasi CPNS Lab

export type Category = "TWK" | "TIU" | "TKP";

/** Nilai Ambang Batas (Passing Grade) resmi BKN sesuai KepmenPAN-RB (SKD Standar 110 soal) */
export const BKN_PASSING_GRADE: Record<Category, number> = {
  TWK: 65,
  TIU: 80,
  TKP: 166,
};

/** Skor maksimum resmi BKN per subtes */
export const BKN_MAX_SCORE: Record<Category, number> = {
  TWK: 150, // 30 soal x 5
  TIU: 175, // 35 soal x 5
  TKP: 225, // 45 soal x 5
};

/** Benchmark waktu pengerjaan resmi CAT BKN (100 menit / 110 soal ≈ 54.5 detik/soal) */
export const BKN_BENCHMARK_PACE_SEC = 54;

export type SubCategory =
  // TWK
  | "Pancasila"
  | "UUD 1945"
  | "Bhinneka Tunggal Ika"
  | "NKRI"
  | "Integritas"
  | "Bela Negara"
  // TIU
  | "Verbal"
  | "Numerik"
  | "Figural"
  | "Logika"
  // TKP
  | "Pelayanan Publik"
  | "Jejaring Kerja"
  | "Sosial Budaya"
  | "Teknologi Informasi"
  | "Profesionalisme"
  | "Anti Radikalisme";

/** Spesifikasi deklaratif untuk soal figural yang dirender sebagai SVG. */
export type VisualSpec =
  | {
      /** Deretan N bangun yang dirotasi bertahap, satu panel ditandai "?" */
      kind: "shape-series";
      shape: ShapeName;
      count: number;
      /** index panel yang digantikan "?" (0-based) */
      missing: number;
      /** besar rotasi per langkah (derajat) */
      rotationStep: number;
      /** jumlah titik kecil di bawah bangun, bertambah tiap langkah */
      dots?: { start: number; step: number };
    }
  | {
      /** Satu bangun untuk pilihan jawaban figural */
      kind: "shape-single";
      shape: ShapeName;
      rotation?: number;
      flipH?: boolean;
      dots?: number;
    };

export type ShapeName = "arrow" | "triangle" | "star" | "square" | "pentagon" | "flag";

export interface QuestionOption {
  text?: string;
  visual?: VisualSpec;
}

export interface Question {
  /** id stabil, contoh "TWK-001" */
  id: string;
  category: Category;
  sub: SubCategory;
  text: string;
  options: QuestionOption[];
  /** Untuk TWK/TIU: index jawaban benar (0-based) */
  answer?: number;
  /** Untuk TKP: nilai 1..5 per opsi */
  points?: number[];
  explanation: string;
  visual?: VisualSpec;
}

export interface SubScore {
  category: Category;
  correct: number;
  total: number;
  /** skor mentah (TWK/TIU: 5 per benar; TKP: 1-5 per soal) */
  score: number;
  maxScore: number;
  /** Nilai Ambang Batas BKN atau ambang batas proporsional */
  passingGrade?: number;
  /** Apakah subtes ini melampaui nilai ambang batas */
  passed?: boolean;
}

export interface SessionAnswer {
  questionId: string;
  /** index opsi yang dipilih, null jika kosong */
  choice: number | null;
  /** true jika dinilai benar / nilai TKP >= 4 */
  correct: boolean | null;
  /** nilai yang diperoleh untuk soal ini */
  value: number;
  /** Durasi pengerjaan soal ini dalam satuan detik */
  timeSpentSec?: number;
}

export interface PassingGradeSummary {
  /** True jika menggunakan paket standar BKN penuh (30 TWK, 35 TIU, 40-45 TKP) */
  isFullPackage: boolean;
  /** True jika SEMUA subtes memenuhi atau melampaui nilai ambang batas */
  allPassed: boolean;
  /** Total ambang batas kumulatif */
  totalPassingGrade: number;
  /** Daftar subtes yang gagal memenuhi ambang batas */
  failedCategories: Category[];
}

export interface PacingStats {
  /** Rata-rata detik per soal */
  avgTimeSec: number;
  /** Benchmark resmi BKN (~54s) */
  benchmarkSec: number;
  /** Jumlah soal cepat (< 45s) */
  fastQuestionsCount: number;
  /** Jumlah soal standar/aman (45s - 90s) */
  normalQuestionsCount: number;
  /** Jumlah soal lambat / rawan (> 90s dan <= 120s) */
  slowQuestionsCount: number;
  /** Jumlah soal jebakan waktu / time-trap kritis (> 120s) */
  timeTrapsCount: number;
}

export interface SessionResult {
  id: string;
  /** "simulasi" | "latihan" */
  mode: "simulasi" | "latihan";
  title: string;
  startedAt: number;
  finishedAt: number;
  durationSec: number;
  answers: SessionAnswer[];
  subScores: SubScore[];
  totalScore: number;
  maxScore: number;
  /** Status kelulusan nilai ambang batas secara keseluruhan */
  passed?: boolean;
  passingGradeSummary?: PassingGradeSummary;
  /** Rata-rata waktu pengerjaan per soal dalam detik */
  avgTimePerQuestionSec?: number;
  /** Analisis pacing waktu pengerjaan */
  pacingStats?: PacingStats;
}

export interface ExamConfig {
  mode: "simulasi" | "latihan";
  title: string;
  /** jumlah soal per kategori */
  counts: Record<Category, number>;
  /** durasi total dalam detik; 0 = tanpa waktu (latihan) */
  durationSec: number;
  /** filter subkategori opsional */
  subs?: SubCategory[];
  /** batasi soal ke daftar id tertentu (mis. latihan soal salah) */
  onlyIds?: string[];
}

/** Sesi ujian yang sedang berjalan, dipersist agar bisa dilanjutkan. */
export interface RunningExam {
  config: ExamConfig;
  questionIds: string[];
  choices: Record<string, number | null>;
  flags: Record<string, boolean>;
  startedAt: number;
  endsAt: number | null; // epoch ms, null = tanpa waktu
  currentIndex: number;
  /** Akumulasi durasi per soal (dalam detik) */
  timeSpent?: Record<string, number>;
}

