// Konfigurasi Gemini terpusat lewat env (dokumentasi lengkap di .env.example):
//   GEMINI_MODEL          — id model default (dipakai bila request tidak menyertakan pilihan)
//   GEMINI_THINKING_LEVEL — off | minimal | low | medium | high
//
// Catatan: token thinking dihitung ke dalam maxOutputTokens per route — level
// tinggi dengan maxOutputTokens kecil berisiko memotong jawaban.

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  aiThinkingLevelsFor,
  resolveAiModelKey,
  resolveAiThinkingKey,
} from "./ai-options";

export const GEMINI_MODEL_ID = process.env.GEMINI_MODEL || "gemini-3.8-flash";

type ThinkingLevel = "minimal" | "low" | "medium" | "high";

const LEVELS: ThinkingLevel[] = ["minimal", "low", "medium", "high"];

function parseThinkingConfig(raw?: string) {
  const value = raw?.trim().toLowerCase();
  if (!value) return undefined; // tidak diset → ikut default model
  if (value === "off" || value === "0") return { thinkingBudget: 0 }; // matikan thinking
  if (LEVELS.includes(value as ThinkingLevel)) {
    return { thinkingLevel: value as ThinkingLevel };
  }
  return undefined;
}

const provider = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

interface GeminiOptions {
  /** Key allowlist (src/lib/ai-options.ts) — bukan id model mentah dari client. */
  modelKey?: unknown;
  /** Key thinking allowlist: minimal | low | medium | high. */
  thinkingKey?: unknown;
  /** Fallback thinking bila thinkingKey tidak valid/diset (mis. default per route). */
  defaultThinking?: ThinkingLevel;
}

/** Model Gemini + providerOptions thinkingConfig — spread ke streamText/generateText.
 *  includeThoughts: ringkasan proses berpikir ikut distream (tampil di Reasoning). */
export function getGemini(options: GeminiOptions = {}) {
  const modelKey = resolveAiModelKey(options.modelKey);
  const modelId = modelKey ?? GEMINI_MODEL_ID;

  const thinkingKey = resolveAiThinkingKey(options.thinkingKey);
  let thinking: { thinkingBudget: number } | { thinkingLevel: ThinkingLevel } | undefined;
  if (modelKey && thinkingKey) {
    // Clamp ke level yang memang didukung model terpilih (mis. minimal
    // tidak tersedia di 3.8/3.7 Flash) agar request tidak ditolak API.
    const levels = aiThinkingLevelsFor(modelKey);
    const level = levels.includes(thinkingKey) ? thinkingKey : levels[0];
    thinking = { thinkingLevel: level };
  } else {
    thinking =
      parseThinkingConfig(process.env.GEMINI_THINKING_LEVEL) ??
      (options.defaultThinking ? { thinkingLevel: options.defaultThinking } : undefined);
  }

  const thinkingConfig = { includeThoughts: true, ...(thinking ?? {}) };
  return {
    model: provider(modelId),
    providerOptions: { google: { thinkingConfig } },
  };
}
