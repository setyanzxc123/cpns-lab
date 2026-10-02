// Konfigurasi Gemini terpusat lewat env (dokumentasi lengkap di .env.example):
//   GEMINI_MODEL          — id model (default: gemini-3.8-flash)
//   GEMINI_THINKING_LEVEL — off | minimal | low | medium | high
//
// Catatan: token thinking dihitung ke dalam maxOutputTokens per route — level
// tinggi dengan maxOutputTokens kecil berisiko memotong jawaban.

import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const GEMINI_MODEL_ID = process.env.GEMINI_MODEL || "gemini-3.8-flash";

type ThinkingLevel = "minimal" | "low" | "medium" | "high";

const LEVELS: ThinkingLevel[] = ["minimal", "low", "medium", "high"];

function parseThinkingConfig() {
  const raw = process.env.GEMINI_THINKING_LEVEL?.trim().toLowerCase();
  if (!raw) return undefined; // tidak diset → ikut default model
  if (raw === "off" || raw === "0") return { thinkingBudget: 0 }; // matikan thinking
  if (LEVELS.includes(raw as ThinkingLevel)) {
    return { thinkingLevel: raw as ThinkingLevel };
  }
  return undefined;
}

const provider = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

/** Model Gemini + providerOptions thinking level — spread ke streamText/generateText.
 *  includeThoughts: ringkasan proses berpikir ikut distream (tampil di Reasoning). */
export function getGemini() {
  const thinking = parseThinkingConfig();
  const thinkingConfig = { includeThoughts: true, ...(thinking ?? {}) };
  return {
    model: provider(GEMINI_MODEL_ID),
    providerOptions: { google: { thinkingConfig } },
  };
}
