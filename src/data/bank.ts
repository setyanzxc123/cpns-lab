import type { Category, Question, SubCategory } from "@/lib/types";

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
    "Nasionalisme",
    "Gagasan Utama",
    "Kalimat Efektif",
    "Integritas",
    "Bela Negara",
    "Anti Radikalisme",
  ],
  TIU: [
    "Pecahan dan Desimal",
    "Hubungan X dan Y",
    "Analogi Kata dan Kalimat",
    "Pola Kalimat",
    "Silogisme",
    "Pola Bilangan",
    "Perbandingan Senilai dan Tak Senilai",
    "Figural 9 Kotak",
    "Figural",
    "Penalaran Analitis",
    "Tabel",
  ],
  TKP: [
    "Pelayanan Publik",
    "Profesionalisme",
    "Jejaring Kerja",
    "Teknologi Informasi dan Komunikasi",
    "Sosial Budaya",
    "Anti Radikalisme",
  ],
};

// ---------------------------------------------------------------------------
// Bank soal dari Supabase (tabel `questions`) dengan cache localStorage.
// Offline-first: cache dipakai langsung bila ada; refresh server berjalan di
// latar bila cache > 24 jam. Kunjungan pertama butuh internet.
// ---------------------------------------------------------------------------

export const BANK_CACHE_VERSION = "2.2.0-crops";
const K_BANK_CACHE = "cpns.bankCache";
const STALE_MS = 24 * 60 * 60 * 1000;

interface BankCache {
  version: string;
  questions: Question[];
  fetchedAt: string;
}

function isQuestion(x: unknown): x is Question {
  const q = x as Question;
  return Boolean(
    q &&
      typeof q.id === "string" &&
      (q.category === "TWK" || q.category === "TIU" || q.category === "TKP") &&
      typeof q.text === "string" &&
      Array.isArray(q.options) &&
      q.options.length >= 2,
  );
}

function readCache(): BankCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(K_BANK_CACHE);
    if (!raw) return null;
    const c = JSON.parse(raw) as Partial<BankCache>;
    // Invalidate jika versi cache usang atau struktur data tidak valid
    if (
      !c ||
      c.version !== BANK_CACHE_VERSION ||
      !Array.isArray(c.questions) ||
      c.questions.some((q) => !isQuestion(q))
    ) {
      window.localStorage.removeItem(K_BANK_CACHE);
      return null;
    }
    return c as BankCache;
  } catch {
    return null;
  }
}

function writeCache(questions: Question[]) {
  if (typeof window === "undefined") return;
  const c: BankCache = {
    version: BANK_CACHE_VERSION,
    questions,
    fetchedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(K_BANK_CACHE, JSON.stringify(c));
  } catch {
    // localStorage penuh — abaikan, cache tidak kritikal
  }
}

function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

async function fetchFromSupabase(): Promise<Question[] | null> {
  try {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    const { data, error } = await sb
      .from("questions")
      .select("payload")
      .order("id", { ascending: true });
    if (error) return null;
    return (data ?? []).map((r) => r.payload as Question).filter(isQuestion);
  } catch {
    return null;
  }
}

async function refreshCacheInBackground() {
  const fresh = await fetchFromSupabase();
  if (fresh && fresh.length > 0) {
    writeCache(fresh);
    window.dispatchEvent(new CustomEvent("cpns:bank-updated"));
  }
}

function dedupeById(qs: Question[]): Question[] {
  const seen = new Set<string>();
  const out: Question[] = [];
  for (const q of qs) {
    if (!seen.has(q.id)) {
      seen.add(q.id);
      out.push(q);
    }
  }
  return out;
}

/** Muat bank soal (Supabase cache-first) + soal kustom (localStorage). */
export async function loadBank(): Promise<Question[]> {
  const { getRepo } = await import("@/lib/repository");
  const repo = await getRepo();
  const custom = await repo.listCustomQuestions().catch(() => []);

  const cache = readCache();
  const stale = !cache || Date.now() - Date.parse(cache.fetchedAt) > STALE_MS;

  // Cache ada → pakai langsung (offline-safe). Kalau basi, segarkan di latar.
  if (cache) {
    if (stale && isOnline()) void refreshCacheInBackground();
    return dedupeById([...cache.questions, ...custom]);
  }

  // Tanpa cache → butuh internet (kunjungan pertama).
  if (isOnline()) {
    const fresh = await fetchFromSupabase();
    if (fresh && fresh.length > 0) {
      writeCache(fresh);
      return dedupeById([...fresh, ...custom]);
    }
    // Server kosong (belum di-seed) atau fetch gagal — jangan cache, biar
    // percobaan berikutnya mencoba lagi.
  }

  // Offline & tanpa cache: hanya soal kustom lokal yang tersedia.
  return custom;
}

/** Memaksa hapus cache lokal dan mengambil ulang bank soal terbaru dari Supabase. */
export async function forceRefreshBank(): Promise<Question[]> {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(K_BANK_CACHE);
  }
  const { getRepo } = await import("@/lib/repository");
  const repo = await getRepo();
  const custom = await repo.listCustomQuestions().catch(() => []);

  const fresh = await fetchFromSupabase();
  if (fresh && fresh.length > 0) {
    writeCache(fresh);
    window.dispatchEvent(new CustomEvent("cpns:bank-updated"));
    return dedupeById([...fresh, ...custom]);
  }
  return custom;
}

/** Muat bank hanya dari cache localStorage (tanpa jaringan) — untuk latar cepat. */
export function getCachedBank(): Question[] | null {
  return readCache()?.questions ?? null;
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
