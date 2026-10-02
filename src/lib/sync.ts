"use client";

import { createClient } from "@/lib/supabase/client";
import { localStore } from "./storage";

export interface SyncResult {
  success: boolean;
  sessionsCount: number;
  wrongCount: number;
  message?: string;
}

export async function syncGuestToCloud(): Promise<SyncResult> {
  const emptyResult: SyncResult = {
    success: true,
    sessionsCount: 0,
    wrongCount: 0,
  };

  if (!localStore.hasGuestData()) {
    return emptyResult;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return {
      success: false,
      sessionsCount: 0,
      wrongCount: 0,
      message: "Supabase client not configured",
    };
  }

  const sb = createClient();
  const { data: authData, error: authError } = await sb.auth.getUser();
  if (authError || !authData.user) {
    return {
      success: false,
      sessionsCount: 0,
      wrongCount: 0,
      message: "User not authenticated",
    };
  }

  const user = authData.user;
  const localSessions = localStore.getResults();
  const localWrong = localStore.getWrong();

  let insertedSessions = 0;
  let syncedWrong = 0;

  if (localSessions.length > 0) {
    const { data: existingSessions, error: sesErr } = await sb
      .from("exam_sessions")
      .select("id");
    if (sesErr) throw sesErr;

    const existingIds = new Set((existingSessions ?? []).map((s) => s.id));
    const toInsert = localSessions
      .filter((r) => !existingIds.has(r.id))
      .map((r) => ({
        id: r.id,
        user_id: user.id,
        mode: r.mode,
        total_score: r.totalScore,
        max_score: r.maxScore,
        finished_at: new Date(r.finishedAt).toISOString(),
        payload: r,
      }));

    if (toInsert.length > 0) {
      const { error: insErr } = await sb.from("exam_sessions").insert(toInsert);
      if (insErr) throw insErr;
      insertedSessions = toInsert.length;
    }
  }

  const wrongEntries = Object.entries(localWrong);
  if (wrongEntries.length > 0) {
    const { data: cloudWrong, error: wErr } = await sb
      .from("wrong_questions")
      .select("question_id, count");
    if (wErr) throw wErr;

    const wrongMap = new Map((cloudWrong ?? []).map((w) => [w.question_id, w.count]));
    const wrongRows = wrongEntries.map(([question_id, count]) => {
      const currentCloud = wrongMap.get(question_id) ?? 0;
      return {
        user_id: user.id,
        question_id,
        count: Math.max(currentCloud, count),
        updated_at: new Date().toISOString(),
      };
    });

    const { error: upErr } = await sb
      .from("wrong_questions")
      .upsert(wrongRows, { onConflict: "user_id,question_id" });
    if (upErr) throw upErr;
    syncedWrong = wrongRows.length;
  }

  localStore.clearGuestData();
  localStore.setLastSync(new Date().toISOString());

  return {
    success: true,
    sessionsCount: insertedSessions,
    wrongCount: syncedWrong,
  };
}
