// Allowlist pilihan AI tutor (model Gemini + thinking level) — dipakai
// bersama oleh UI tutor dan API route. Client hanya mengirim key dari
// daftar ini; route yang memetakan ke id model asli agar model sewenang-
// wenang tidak bisa disuntikkan lewat request.
//
// Dukungan thinking level berbeda antar model (terverifikasi langsung ke
// API): "minimal" ditolak gemini-3.8-flash dan gemini-3.7-flash.

export interface AiThinkingOption {
  key: "minimal" | "low" | "medium" | "high";
  label: string;
  hint: string;
}

export const AI_THINKING_OPTIONS: AiThinkingOption[] = [
  { key: "minimal", label: "minimal", hint: "Proses berpikir paling singkat, jawaban tercepat" },
  { key: "low", label: "low", hint: "Seimbang untuk pertanyaan harian" },
  { key: "medium", label: "medium", hint: "Berpikir lebih lama untuk soal menengah" },
  { key: "high", label: "high", hint: "Paling lama, untuk soal hitungan dan silogisme rumit" },
];

export type AiThinkingKey = AiThinkingOption["key"];

const ALL_THINKING: AiThinkingKey[] = ["minimal", "low", "medium", "high"];

export interface AiModelOption {
  /** Id model Gemini — sekaligus key yang dikirim client. */
  id: string;
  label: string;
  hint: string;
  thinkingLevels: AiThinkingKey[];
}

export const AI_MODEL_OPTIONS: AiModelOption[] = [
  {
    id: "gemini-3.8-flash",
    label: "3.8 Flash",
    hint: "Flash terbaru, paling cerdas untuk agentic dan tugas kompleks",
    thinkingLevels: ALL_THINKING.filter((k) => k !== "minimal"),
  },
  {
    id: "gemini-3.7-flash",
    label: "3.7 Flash",
    hint: "Generasi sebelumnya untuk coding kompleks dan alur multi-langkah",
    thinkingLevels: ALL_THINKING.filter((k) => k !== "minimal"),
  },
  {
    id: "gemini-3.6-flash",
    label: "3.6 Flash",
    hint: "Seimbang antara kecepatan dan kemampuan multimodal",
    thinkingLevels: ALL_THINKING,
  },
  {
    id: "gemini-3.5-flash",
    label: "3.5 Flash",
    hint: "Generasi awal, performa dasar untuk beban rutin",
    thinkingLevels: ALL_THINKING,
  },
  {
    id: "gemini-3.5-flash-lite",
    label: "3.5 Flash-Lite",
    hint: "Paling kilat dan hemat, cocok tanya jawab ringan",
    thinkingLevels: ALL_THINKING,
  },
];

export const DEFAULT_AI_MODEL_KEY = "gemini-3.8-flash";
export const DEFAULT_AI_THINKING_KEY: AiThinkingKey = "low";

/** Id model valid dari input bebas, atau null bila tidak ada di allowlist. */
export function resolveAiModelKey(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return AI_MODEL_OPTIONS.some((m) => m.id === value) ? value : null;
}

/** Key thinking valid dari input bebas, atau null bila tidak dikenal. */
export function resolveAiThinkingKey(value: unknown): AiThinkingKey | null {
  if (typeof value !== "string") return null;
  return AI_THINKING_OPTIONS.some((t) => t.key === value)
    ? (value as AiThinkingKey)
    : null;
}

/** Level thinking yang didukung sebuah model allowlist. */
export function aiThinkingLevelsFor(modelKey: string): AiThinkingKey[] {
  return AI_MODEL_OPTIONS.find((m) => m.id === modelKey)?.thinkingLevels ?? ALL_THINKING;
}
