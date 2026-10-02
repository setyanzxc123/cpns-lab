// Konfigurasi Gemini terpusat lewat env (dokumentasi lengkap di .env.example):
//   GEMINI_MODEL          — id model (default: gemini-3.8-flash)
//   GEMINI_THINKING_LEVEL — off | minimal | low | medium | high
//
// Semua route AI memakai Interactions API (@google/genai ≥ 2.3) dengan
// store: false — riwayat percakapan tetap dikelola client, tidak tersimpan
// di server Google.

import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL_ID = process.env.GEMINI_MODEL || "gemini-3.8-flash";

type ThinkingLevel = "minimal" | "low" | "medium" | "high";

const LEVELS: ThinkingLevel[] = ["minimal", "low", "medium", "high"];

function parseThinkingLevel(): ThinkingLevel | "off" | undefined {
  const raw = process.env.GEMINI_THINKING_LEVEL?.trim().toLowerCase();
  if (!raw) return undefined; // tidak diset → ikut default model
  if (raw === "off" || raw === "0") return "off";
  if (LEVELS.includes(raw as ThinkingLevel)) return raw as ThinkingLevel;
  return undefined;
}

let client: GoogleGenAI | null = null;

/** Client Gemini tunggal (Gemini API, bukan Vertex). */
export function getGenAI(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });
  }
  return client;
}

/** generation_config bersama: batas token + knob thinking level dari env. */
export function generationConfig(maxOutputTokens: number) {
  const level = parseThinkingLevel();
  return {
    max_output_tokens: maxOutputTokens,
    // "off" dipetakan ke level terendah — pada 2.5 Flash/Flash-Lite ini
    // mematikan thinking; Pro memang tidak bisa mematikannya sama sekali.
    ...(level ? { thinking_level: level === "off" ? ("minimal" as const) : level } : {}),
  };
}
