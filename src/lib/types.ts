// Tipe data inti aplikasi CPNS Lab

export type Category = "TWK" | "TIU" | "TKP";

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
}

export interface SessionAnswer {
  questionId: string;
  /** index opsi yang dipilih, null jika kosong */
  choice: number | null;
  /** true jika dinilai benar / nilai TKP >= 4 */
  correct: boolean | null;
  /** nilai yang diperoleh untuk soal ini */
  value: number;
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
}
