"use client";

// Repository layer: satu interface untuk penyimpanan lokal (tamu)
// dan Supabase (user login). Halaman tidak perlu tahu bedanya.

import type { Question, SessionResult } from "./types";
import { localStore } from "./storage";
import { createClient } from "@/lib/supabase/client";

export interface Repository {
  listResults(): Promise<SessionResult[]>;
  saveResult(r: SessionResult): Promise<void>;
  listWrong(): Promise<Record<string, number>>;
  recordWrong(id: string, wasWrong: boolean): Promise<void>;
  clearWrong(ids?: string[]): Promise<void>;
  listCustomQuestions(): Promise<Question[]>;
  saveCustomQuestions(qs: Question[]): Promise<void>;
}

// ---------- Lokal (tamu) ----------

export const localRepo: Repository = {
  async listResults() {
    return localStore.getResults();
  },
  async saveResult(r) {
    localStore.saveResult(r);
  },
  async listWrong() {
    return localStore.getWrong();
  },
  async recordWrong(id, wasWrong) {
    localStore.recordWrong(id, wasWrong);
  },
  async clearWrong(ids) {
    localStore.clearWrong(ids);
  },
  async listCustomQuestions() {
    return localStore.getCustomQuestions();
  },
  async saveCustomQuestions(qs) {
    localStore.saveCustomQuestions(qs);
  },
};

// ---------- Supabase (user login) ----------

class SupabaseRepo implements Repository {
  async listResults(): Promise<SessionResult[]> {
    const sb = createClient();
    const { data } = await sb
      .from("exam_sessions")
      .select("payload")
      .order("finished_at", { ascending: false })
      .limit(200);
    return (data ?? []).map((row) => row.payload as SessionResult);
  }
  async saveResult(r: SessionResult) {
    const sb = createClient();
    await sb.from("exam_sessions").insert({
      id: r.id,
      mode: r.mode,
      total_score: r.totalScore,
      max_score: r.maxScore,
      finished_at: new Date(r.finishedAt).toISOString(),
      payload: r,
    });
  }
  async listWrong(): Promise<Record<string, number>> {
    const sb = createClient();
    const { data } = await sb.from("wrong_questions").select("question_id, count");
    const out: Record<string, number> = {};
    for (const row of data ?? []) out[row.question_id] = row.count;
    return out;
  }
  async recordWrong(id: string, wasWrong: boolean) {
    const sb = createClient();
    if (wasWrong) {
      await sb.rpc("upsert_wrong_question", { p_question_id: id });
    } else {
      await sb.from("wrong_questions").delete().eq("question_id", id);
    }
  }
  async clearWrong(ids?: string[]) {
    const sb = createClient();
    if (ids) {
      await sb.from("wrong_questions").delete().in("question_id", ids);
    } else {
      await sb.from("wrong_questions").delete().neq("question_id", "");
    }
  }
  async listCustomQuestions(): Promise<Question[]> {
    const sb = createClient();
    const { data } = await sb.from("custom_questions").select("payload");
    return (data ?? []).map((row) => row.payload as Question);
  }
  async saveCustomQuestions(qs: Question[]) {
    const sb = createClient();
    // ganti seluruh set soal kustom milik user (sederhana & idempoten)
    await sb.from("custom_questions").delete().neq("question_id", "");
    if (qs.length === 0) return;
    await sb.from("custom_questions").insert(
      qs.map((q) => ({ question_id: q.id, payload: q })),
    );
  }
}

/** Pilih repo aktif: Supabase jika user sudah login, selain itu lokal. */
export async function getRepo(): Promise<Repository> {
  try {
    if (supabaseConfiguredClient()) {
      const sb = createClient();
      const { data } = await sb.auth.getUser();
      if (data.user) return new SupabaseRepo();
    }
  } catch {
    // env Supabase tidak lengkap — jatuh ke mode lokal
  }
  return localRepo;
}

function supabaseConfiguredClient(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
