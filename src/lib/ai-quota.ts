// Penghitung perkiraan kuota harian tutor AI per model — sisi client.
// Google tidak menyediakan bacaan kuota lewat API, jadi ini estimasi.
//
// Dua jalur penyimpanan:
// - User login Supabase: hitung via RPC atomik record_ai_usage ke tabel
//   ai_quota_usage (tersinkron antar perangkat, reset tengah malam PT).
// - Tamu: hitung lokal di localStorage (window sama: tengah malam PT,
//   DST-aware). Angka bisa meleset bila kuota dipakai dari perangkat lain.

import { AI_MODEL_OPTIONS } from "./ai-options";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

const K_QUOTA = "cpns.aiQuota";

interface QuotaEntry {
  count: number;
  resetAt: number;
}

export interface AiQuotaUsage {
  used: number;
  limit: number;
  remaining: number;
  /** Epoch ms ketika jatah ter-reset (tengah malam PT berikutnya). */
  resetAt: number;
}

function readAll(): Record<string, QuotaEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(K_QUOTA);
    return raw ? (JSON.parse(raw) as Record<string, QuotaEntry>) : {};
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, QuotaEntry>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(K_QUOTA, JSON.stringify(all));
}

const PT_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function ptParts(t: number): Record<string, string> {
  return Object.fromEntries(
    PT_FORMAT.formatToParts(new Date(t)).map((p) => [p.type, p.value]),
  );
}

/** Selisih jam lokal PT terhadap UTC pada momen t (ms), termasuk DST. */
function ptOffsetMs(t: number): number {
  const m = ptParts(t);
  const wall = Date.UTC(
    +m.year,
    +m.month - 1,
    +m.day,
    +m.hour,
    +m.minute,
    +m.second,
  );
  return wall - t;
}

/** Epoch (ms) tengah malam PT untuk tanggal PT yang memuat momen t. */
function midnightPtFor(t: number): number {
  const m = ptParts(t);
  return Date.UTC(+m.year, +m.month - 1, +m.day) - ptOffsetMs(t);
}

/** Tengah malam PT berikutnya dalam epoch ms. */
function nextResetAt(now: number): number {
  let resetAt = midnightPtFor(now);
  if (now >= resetAt) {
    resetAt = midnightPtFor(now + 24 * 60 * 60 * 1000);
  }
  return resetAt;
}

export function aiDailyLimit(modelId: string): number {
  return AI_MODEL_OPTIONS.find((m) => m.id === modelId)?.dailyQuota ?? 20;
}

function usageFor(modelId: string, now: number): AiQuotaUsage {
  const limit = aiDailyLimit(modelId);
  const entry = readAll()[modelId];
  const active = entry && now < entry.resetAt ? entry : undefined;
  const used = active?.count ?? 0;
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetAt: active?.resetAt ?? nextResetAt(now),
  };
}

/** Baca pemakaian terkini (tamu) — sinkron, tanpa jaringan. */
export function getAiQuotaUsage(modelId: string): AiQuotaUsage {
  return usageFor(modelId, Date.now());
}

function toUsage(remote: { used: number; limit: number; resetAt: string }): AiQuotaUsage {
  return {
    used: remote.used,
    limit: remote.limit,
    remaining: Math.max(0, remote.limit - remote.used),
    resetAt: Date.parse(remote.resetAt),
  };
}

/** Pemakaian semua model sekaligus — RPC get_all_ai_usage saat login, lokal saat tamu. */
export async function refreshAllAiQuotaUsage(): Promise<Record<string, AiQuotaUsage>> {
  if (supabaseConfigured()) {
    try {
      const { data, error } = await createClient().rpc("get_all_ai_usage");
      if (!error && data) {
        const payload = data as { resetAt: string; usage: Record<string, number> };
        const map: Record<string, AiQuotaUsage> = {};
        for (const m of AI_MODEL_OPTIONS) {
          const used = payload.usage[m.id] ?? 0;
          map[m.id] = {
            used,
            limit: m.dailyQuota,
            remaining: Math.max(0, m.dailyQuota - used),
            resetAt: Date.parse(payload.resetAt),
          };
        }
        return map;
      }
    } catch {
      // Jatuh ke hitungan lokal di bawah.
    }
  }
  const map: Record<string, AiQuotaUsage> = {};
  for (const m of AI_MODEL_OPTIONS) {
    map[m.id] = getAiQuotaUsage(m.id);
  }
  return map;
}

/** Catat satu request AI (chat, pembahasan soal, atau analitik) ke model terkait. */
export async function recordAiRequest(modelId: string): Promise<AiQuotaUsage> {
  if (supabaseConfigured()) {
    try {
      const { data, error } = await createClient().rpc("record_ai_usage", {
        p_model: modelId,
      });
      if (!error && data) return toUsage(data as { used: number; limit: number; resetAt: string });
    } catch {
      // Tamu (tidak login) atau gangguan jaringan: hitung lokal di bawah.
    }
  }

  const now = Date.now();
  const all = readAll();
  const entry = all[modelId];
  if (!entry || now >= entry.resetAt) {
    all[modelId] = { count: 1, resetAt: nextResetAt(now) };
  } else {
    entry.count += 1;
  }
  writeAll(all);
  return usageFor(modelId, now);
}
