"use client";

// Auto-sync progres: antrean id sesi yang belum terkirim ke Supabase +
// pengirim idempoten (upsert). Offline-first: apa pun yang terjadi, data
// selalu aman di localStorage; antrean ini hanya menjelaskan delta yang
// perlu dikirim ke cloud begitu online & login.

import { createClient } from "@/lib/supabase/client";
import { localStore } from "./storage";
import type { SessionResult } from "./types";

const K_UNSYNCED = "cpns.unsynced";

/** Event yang di-dispatch setiap kali progres lokal berubah. */
export const PROGRESS_CHANGED_EVENT = "cpns:progress-changed";

function readQueue(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(K_UNSYNCED);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeQueue(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(K_UNSYNCED, JSON.stringify(ids));
}

/** Catat bahwa progres berubah: masukkan id sesi ke antrean + beri tahu UI. */
export function notifyProgressChanged(sessionId?: string) {
  if (typeof window === "undefined") return;
  if (sessionId) {
    const q = readQueue();
    if (!q.includes(sessionId)) writeQueue([...q, sessionId].slice(-500));
  }
  window.dispatchEvent(new CustomEvent(PROGRESS_CHANGED_EVENT));
}

/** Jumlah sesi yang belum terkonfirmasi tersinkron. */
export function getUnsyncedCount(): number {
  return readQueue().length;
}

export interface PushResult {
  /** null = tidak mencoba (offline / belum login / tanpa env). */
  attempted: boolean;
  pushed: number;
}

/**
 * Kirim sesi dalam antrean ke Supabase (upsert by id — idempoten, aman
 * dipanggil berkali-kali). Sukses → bersihkan antrean.
 */
export async function pushPending(): Promise<PushResult> {
  if (typeof window === "undefined") return { attempted: false, pushed: 0 };
  if (!navigator.onLine) return { attempted: false, pushed: 0 };

  const queue = readQueue();
  if (queue.length === 0) return { attempted: false, pushed: 0 };

  let sb: ReturnType<typeof createClient>;
  try {
    sb = createClient();
  } catch {
    return { attempted: false, pushed: 0 };
  }

  const { data } = await sb.auth.getUser();
  if (!data?.user) return { attempted: false, pushed: 0 };

  // 1. Sesi dalam antrean → upsert (last-write-wins by id).
  const allResults = localStore.getResults();
  const byId = new Map(allResults.map((r) => [r.id, r]));
  const sessions = queue
    .map((id) => byId.get(id))
    .filter((r): r is SessionResult => Boolean(r));

  let pushed = 0;
  const failed = new Set<string>();

  if (sessions.length > 0) {
    const rows = sessions.map((r) => ({
      id: r.id,
      user_id: data.user.id,
      mode: r.mode,
      total_score: r.totalScore,
      max_score: r.maxScore,
      finished_at: new Date(r.finishedAt).toISOString(),
      payload: r,
    }));
    const CHUNK = 100;
    let ok = true;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { error } = await sb
        .from("exam_sessions")
        .upsert(rows.slice(i, i + CHUNK), { onConflict: "id" });
      if (error) {
        ok = false;
        break;
      }
    }
    if (ok) {
      pushed += sessions.length;
    } else {
      for (const s of sessions) failed.add(s.id);
    }
  }

  // 2. wrong_questions → kirim seluruh map lokal dengan max(count) cloud.
  const wrong = localStore.getWrong();
  const wrongIds = Object.keys(wrong);
  if (wrongIds.length > 0) {
    const { data: cloudWrong, error: wErr } = await sb
      .from("wrong_questions")
      .select("question_id, count");
    if (!wErr) {
      const cloudMap = new Map((cloudWrong ?? []).map((w) => [w.question_id, w.count]));
      const rows = wrongIds.map((question_id) => ({
        user_id: data.user.id,
        question_id,
        count: Math.max(cloudMap.get(question_id) ?? 0, wrong[question_id]),
        updated_at: new Date().toISOString(),
      }));
      const CHUNK = 200;
      let ok = true;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const { error } = await sb
          .from("wrong_questions")
          .upsert(rows.slice(i, i + CHUNK), { onConflict: "user_id,question_id" });
        if (error) {
          ok = false;
          break;
        }
      }
      // Kegagalan wrong_questions tidak membatalkan sesi yang sudah terkirim;
      // antrean sesi tetap dibersihkan, wrong akan dicoba lagi di push berikutnya.
      if (!ok) failed.add("__wrong__");
    } else {
      failed.add("__wrong__");
    }
  }

  if (failed.size === 0) {
    writeQueue([]);
  } else {
    writeQueue(readQueue().filter((id) => failed.has(id)));
  }
  localStore.setLastSync(new Date().toISOString());
  window.dispatchEvent(new CustomEvent("cpns:sync-done"));
  return { attempted: true, pushed };
}
