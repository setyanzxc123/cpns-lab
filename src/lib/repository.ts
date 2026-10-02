"use client";

// Repository layer: satu interface untuk penyimpanan lokal (tamu)
// dan Supabase (user login). Halaman tidak perlu tahu bedanya.

import type { SessionResult } from "./types";
import type { ChatSession } from "./storage";
import { localStore } from "./storage";
import { createClient } from "@/lib/supabase/client";
import { syncGuestToCloud } from "./sync";
import { notifyProgressChanged } from "./auto-sync";

export { syncGuestToCloud };

export interface Repository {
  listResults(): Promise<SessionResult[]>;
  saveResult(r: SessionResult): Promise<void>;
  listWrong(): Promise<Record<string, number>>;
  recordWrong(id: string, wasWrong: boolean): Promise<void>;
  clearWrong(ids?: string[]): Promise<void>;
  listChatSessions(): Promise<ChatSession[]>;
  saveChatSession(s: ChatSession): Promise<ChatSession[]>;
  deleteChatSession(id: string): Promise<ChatSession[]>;
}

// Local guest repository

export const localRepo: Repository = {
  async listResults() {
    return localStore.getResults();
  },
  async saveResult(r) {
    localStore.saveResult(r);
    notifyProgressChanged(r.id);
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
  async listChatSessions() {
    return localStore.getChatSessions();
  },
  async saveChatSession(s) {
    return localStore.saveChatSession(s);
  },
  async deleteChatSession(id) {
    return localStore.deleteChatSession(id);
  },
};

// Supabase authenticated repository

class SupabaseRepo implements Repository {
  async listResults(): Promise<SessionResult[]> {
    // Cloud kanonik, tapi hasil yang baru dibuat offline (belum ter-push)
    // tetap tampil: gabungkan dengan localStorage, cloud menimpa by id.
    let cloud: SessionResult[] = [];
    try {
      const sb = createClient();
      const { data } = await sb
        .from("exam_sessions")
        .select("payload")
        .order("finished_at", { ascending: false })
        .limit(200);
      cloud = (data ?? []).map((row) => row.payload as SessionResult);
    } catch {
      // offline — pakai lokal saja
    }
    const byId = new Map<string, SessionResult>();
    for (const r of [...localStore.getResults(), ...cloud]) {
      if (r?.id) byId.set(r.id, r);
    }
    return [...byId.values()]
      .sort((a, b) => b.finishedAt - a.finishedAt)
      .slice(0, 200);
  }
  async saveResult(r: SessionResult) {
    // Offline-first: selalu tulis localStorage + antrean auto-sync; cloud
    // menerima lewat pushPending (upsert by id) saat online.
    localStore.saveResult(r);
    notifyProgressChanged(r.id);
  }
  async listWrong(): Promise<Record<string, number>> {
    try {
      const sb = createClient();
      const { data } = await sb.from("wrong_questions").select("question_id, count");
      const cloud: Record<string, number> = {};
      for (const row of data ?? []) cloud[row.question_id] = row.count;
      // max(cloud, local) — konsisten dengan strategi push auto-sync
      const merged: Record<string, number> = { ...cloud };
      for (const [id, n] of Object.entries(localStore.getWrong())) {
        merged[id] = Math.max(merged[id] ?? 0, n);
      }
      return merged;
    } catch {
      return localStore.getWrong();
    }
  }
  async recordWrong(id: string, wasWrong: boolean) {
    // Offline-first: hitung lokal, sinkron via pushPending (max-count).
    localStore.recordWrong(id, wasWrong);
    notifyProgressChanged();
  }
  async clearWrong(ids?: string[]) {
    localStore.clearWrong(ids);
    try {
      const sb = createClient();
      if (ids) {
        await sb.from("wrong_questions").delete().in("question_id", ids);
      } else {
        await sb.from("wrong_questions").delete().neq("question_id", "");
      }
    } catch {
      // offline — penghapusan lokal dulu, cloud menyusul saat push berikutnya
    }
  }
  async listChatSessions(): Promise<ChatSession[]> {
    // Cloud kanonik + gabungkan sesi lokal yang belum ter-push (by id).
    let cloud: ChatSession[] = [];
    try {
      const sb = createClient();
      const { data } = await sb
        .from("chat_sessions")
        .select("id, title, context_question_id, context_label, messages, created_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(50);
      cloud = (data ?? []).map((row) => ({
        id: row.id as string,
        title: (row.title as string) || "Percakapan",
        createdAt: Date.parse(row.created_at as string),
        updatedAt: Date.parse(row.updated_at as string),
        contextQuestionId: (row.context_question_id as string) ?? undefined,
        contextLabel: (row.context_label as string) ?? undefined,
        messages: (row.messages as ChatSession["messages"]) ?? [],
      }));
    } catch {
      // offline — pakai lokal saja
    }
    const byId = new Map<string, ChatSession>();
    for (const s of [...localStore.getChatSessions(), ...cloud]) {
      if (s?.id) byId.set(s.id, s);
    }
    return [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 50);
  }
  async saveChatSession(s: ChatSession): Promise<ChatSession[]> {
    // Offline-first: selalu tulis salinan lokal, lalu upsert ke cloud saat online.
    const next = localStore.saveChatSession(s);
    try {
      const sb = createClient();
      await sb.from("chat_sessions").upsert(
        {
          id: s.id,
          title: s.title,
          context_question_id: s.contextQuestionId ?? null,
          context_label: s.contextLabel ?? null,
          messages: s.messages,
          updated_at: new Date(s.updatedAt).toISOString(),
        },
        { onConflict: "id" },
      );
    } catch {
      // offline — salinan lokal ada; akan tersinkron saat save berikutnya online
    }
    return next;
  }
  async deleteChatSession(id: string): Promise<ChatSession[]> {
    const next = localStore.deleteChatSession(id);
    try {
      const sb = createClient();
      await sb.from("chat_sessions").delete().eq("id", id);
    } catch {
      // offline — lokal terhapus; baris cloud tersisa diabaikan saat merge
      // (sesi tidak ada di lokal & cloud tetap muncul setelah list berikutnya)
    }
    return next;
  }
}

/** Select active repository: Supabase if a session exists, otherwise local. */
export async function getRepo(): Promise<Repository> {
  try {
    if (supabaseConfiguredClient()) {
      const sb = createClient();
      // getSession membaca sesi dari localStorage — tetap terdeteksi saat offline.
      const { data } = await sb.auth.getSession();
      if (data.session?.user) {
        if (localStore.hasGuestData()) {
          void syncGuestToCloud().catch(() => {});
        }
        return new SupabaseRepo();
      }
    }
  } catch {
    // Fall back to local mode if Supabase credentials are missing or network fails
  }
  return localRepo;
}

function supabaseConfiguredClient(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
