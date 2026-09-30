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
  | "Nasionalisme"
  | "Gagasan Utama"
  | "Kalimat Efektif"
  | "Integritas"
  | "Bela Negara"
  | "Anti Radikalisme"
  // TIU (nama tema buku bank soal Al Faiz)
  | "Pecahan dan Desimal"
  | "Hubungan X dan Y"
  | "Analogi Kata dan Kalimat"
  | "Pola Kalimat"
  | "Silogisme"
  | "Pola Bilangan"
  | "Perbandingan Senilai dan Tak Senilai"
  | "Figural 9 Kotak"
  | "Figural"
  | "Penalaran Analitis"
  | "Tabel"
  // TKP
  | "Pelayanan Publik"
  | "Profesionalisme"
  | "Jejaring Kerja"
  | "Teknologi Informasi dan Komunikasi"
  | "Sosial Budaya";

/** Mode pengisian bentuk standar tes figural / matriks penalaran:
 * - solid: hitam pekat
 * - outline: garis tepi saja (transparan di dalam)
 * - white: putih pekat (penting untuk layering / menutupi bangun di bawahnya)
 * - hatch: arsiran diagonal (45°)
 * - hatch-reverse: arsiran diagonal berlawanan (135° / -45°)
 * - hatch-horizontal: garis horizontal
 * - hatch-vertical: garis vertikal
 * - cross-hatch: jaring-jaring / arsir silang
 * - dots-fill: pola titik-titik (stipple)
 * - none: tanpa pengisian
 */
export type Fill =
  | "solid"
  | "outline"
  | "white"
  | "hatch"
  | "hatch-reverse"
  | "hatch-horizontal"
  | "hatch-vertical"
  | "cross-hatch"
  | "dots-fill"
  | "none";

/** Satu primitif gambar di dalam sel (ruang koordinat 100x100 standar psikometri). */
export type Shape =
  | { polyRect: [number, number][]; fill: Fill; strokeWidth?: number }
  | { regularPolygon: { n: number; r: number; cx?: number; cy?: number; rot?: number; fill: Fill; strokeWidth?: number } }
  | { circle: { r: number; cx?: number; cy?: number; fill: Fill; strokeWidth?: number } }
  | { ellipse: { rx: number; ry: number; cx?: number; cy?: number; rot?: number; fill: Fill; strokeWidth?: number } }
  | { sector: { r: number; startAngle: number; endAngle: number; cx?: number; cy?: number; fill: Fill; strokeWidth?: number } }
  | { line: { x1: number; y1: number; x2: number; y2: number; strokeWidth?: number; strokeDash?: string } }
  | { spikes: { k: number; rOut: number; rIn: number; cx?: number; cy?: number; rot?: number; fill: Fill; strokeWidth?: number } }
  | { path: { d: string; fill?: Fill; strokeWidth?: number; strokeLinejoin?: "round" | "miter" | "bevel"; strokeLinecap?: "round" | "square" | "butt" } }
  | { zigzag: { peaks: number; amp: number; cx?: number; cy?: number; rot?: number; strokeWidth?: number } }
  | { dots: { cols?: number; rows?: number; gap?: number; r: number; points?: [number, number][]; cx?: number; cy?: number } }
  | { arrow: { rot?: number; cx?: number; cy?: number; scale?: number } }
  | { letter: string; x?: number; y?: number; fontSize?: number }
  | { image: string; x?: number; y?: number; width?: number; height?: number }
  | { composite: { shapes: Shape[]; transform?: { rot?: number; scale?: number; tx?: number; ty?: number } } };

/** Komposisi primitif dalam satu sel, opsional dengan bingkai. */
export interface Glyph {
  shapes: Shape[];
  frame?: {
    double?: boolean;
    none?: boolean;
    rounded?: boolean;
    circle?: boolean;
    dashed?: boolean;
  };
}

/**
 * Spesifikasi visual opsi jawaban:
 * - Glyph tunggal (standar)
 * - dual-v: sepasang sel atas-bawah (standar buku untuk soal 9-kotak dengan dua '?')
 * - dual-h: sepasang sel kiri-kanan
 */
export type OptionVisual =
  | Glyph
  | { kind: "dual-v"; top: Glyph; bottom: Glyph }
  | { kind: "dual-h"; left: Glyph; right: Glyph };

/**
 * Spesifikasi visual soal figural — mencakup pola standar tes IQ internasional:
 * - series: deret perubahan (rotasi, progresi, penambahan)
 * - analogy: pola A : B :: C : D / ?
 * - odd-five: 5 gambar soal (odd-one-out)
 * - net: jaring-jaring / lipatan 3D
 * - grid-9: matriks 3x3 Raven's Progressive Matrices (mendukung multiple '?' / missing cells)
 * - grid-4: matriks 2x2 Cattell Culture Fair
 */
export type VisualSpec =
  | { kind: "series"; cells: (Glyph | "?" | null)[] }
  | { kind: "analogy"; cells: [Glyph, Glyph, Glyph, Glyph | "?"] }
  | { kind: "odd-five"; cells: Glyph[] }
  | { kind: "net"; cells: (Glyph | null)[]; cols: number }
  | { kind: "grid-9"; cells: (Glyph | "?" | null)[] }
  | { kind: "grid-4"; cells: (Glyph | "?" | null)[] };

export interface QuestionOption {
  text?: string;
  /** Opsi jawaban berupa gambar: satu Glyph atau pasangan Glyph bertingkat. */
  visual?: OptionVisual;
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

