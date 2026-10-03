"use client";

// Modul storage lokal (localStorage) — layer persistensi default saat
// user belum login Supabase. Interface sama dengan SupabaseRepo.

import type { SessionResult } from "./types";

const K_RESULTS = "cpns.results";
const K_WRONG = "cpns.wrong";
const K_RUNNING = "cpns.runningExam";
const K_EXPLAIN_CACHE = "cpns.aiExplains";
const K_CHAT_SESSIONS = "cpns.chatSessions";
const K_DELETED_CHATS = "cpns.deletedChatIds";
const K_AI_PREFS = "cpns.aiPrefs";

/** Satu pesan riwayat chat — struktur longgar mengikuti UIMessage AI SDK. */
export interface ChatSessionMessage {
  id: string;
  role: "user" | "assistant" | "system";
  parts: Array<{ type: string; text?: string } & Record<string, unknown>>;
}

/** Sesi percakapan tutor AI yang tersimpan lokal. */
export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  /** Id soal bila percakapan bermula dari tombol "Tanya lebih lanjut". */
  contextQuestionId?: string;
  /** Label ringkas konteks, mis. "TIU — Pola Bilangan". */
  contextLabel?: string;
  messages: ChatSessionMessage[];
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export const localStore = {
  getResults(): SessionResult[] {
    return read<SessionResult[]>(K_RESULTS, []);
  },
  saveResult(r: SessionResult) {
    const all = localStore.getResults();
    all.push(r);
    write(K_RESULTS, all.slice(-200));
  },
  getWrong(): Record<string, number> {
    return read<Record<string, number>>(K_WRONG, {});
  },
  recordWrong(id: string, wasWrong: boolean) {
    const w = localStore.getWrong();
    if (wasWrong) w[id] = (w[id] ?? 0) + 1;
    else delete w[id];
    write(K_WRONG, w);
  },
  clearWrong(ids?: string[]) {
    if (!ids) {
      write(K_WRONG, {});
      return;
    }
    const w = localStore.getWrong();
    for (const id of ids) delete w[id];
    write(K_WRONG, w);
  },
  getRunning() {
    return read<unknown>(K_RUNNING, null);
  },
  saveRunning(v: unknown) {
    write(K_RUNNING, v);
  },
  clearRunning() {
    if (typeof window !== "undefined") window.localStorage.removeItem(K_RUNNING);
  },
  getAiExplanation(questionId: string, choice: number | null): string | null {
    const cache = read<Record<string, string>>(K_EXPLAIN_CACHE, {});
    const key = `${questionId}:${choice ?? "none"}`;
    return cache[key] ?? null;
  },
  saveAiExplanation(questionId: string, choice: number | null, text: string) {
    const cache = read<Record<string, string>>(K_EXPLAIN_CACHE, {});
    const key = `${questionId}:${choice ?? "none"}`;
    cache[key] = text;
    const keys = Object.keys(cache);
    if (keys.length > 300) {
      delete cache[keys[0]];
    }
    write(K_EXPLAIN_CACHE, cache);
  },
  getAllAiExplanations(): Record<string, string> {
    return read<Record<string, string>>(K_EXPLAIN_CACHE, {});
  },
  getDeletedChatIds(): string[] {
    return read<string[]>(K_DELETED_CHATS, []);
  },
  addDeletedChatId(id: string) {
    const ids = localStore.getDeletedChatIds();
    if (!ids.includes(id)) {
      write(K_DELETED_CHATS, [...ids.slice(-99), id]);
    }
  },
  removeDeletedChatId(id: string) {
    write(K_DELETED_CHATS, localStore.getDeletedChatIds().filter((x) => x !== id));
  },
  getChatSessions(): ChatSession[] {
    return read<ChatSession[]>(K_CHAT_SESSIONS, []).sort((a, b) => b.updatedAt - a.updatedAt);
  },
  saveChatSession(session: ChatSession): ChatSession[] {
    // Sesi yang baru dihapus tidak boleh dihidupkan ulang oleh auto-save
    // yang kebetulan masih berjalan saat penghapusan.
    if (localStore.getDeletedChatIds().includes(session.id)) {
      return localStore.getChatSessions();
    }
    const all = localStore.getChatSessions();
    const existing = all.find((s) => s.id === session.id);
    const merged: ChatSession = {
      ...session,
      // Judul dipertahankan dari sesi lama bila tidak dikirim ulang
      title: session.title || existing?.title || "Percakapan",
      createdAt: existing?.createdAt ?? session.createdAt,
      updatedAt: Date.now(),
    };
    const next = [merged, ...all.filter((s) => s.id !== session.id)].slice(0, 50);
    write(K_CHAT_SESSIONS, next);
    return next;
  },
  deleteChatSession(id: string): ChatSession[] {
    localStore.addDeletedChatId(id);
    const next = localStore.getChatSessions().filter((s) => s.id !== id);
    write(K_CHAT_SESSIONS, next);
    return next;
  },
  hasGuestData(): boolean {
    const results = localStore.getResults();
    const wrong = localStore.getWrong();
    return results.length > 0 || Object.keys(wrong).length > 0;
  },
  clearGuestData(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(K_RESULTS);
    window.localStorage.removeItem(K_WRONG);
    window.localStorage.removeItem(K_CHAT_SESSIONS);
    window.localStorage.removeItem(K_DELETED_CHATS);
  },
  getLastSync(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("cpns.lastSync");
  },
  setLastSync(iso: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("cpns.lastSync", iso);
  },
  getAiPrefs(): Record<string, string> {
    return read<Record<string, string>>(K_AI_PREFS, {});
  },
  saveAiPrefs(prefs: Record<string, string>): void {
    write(K_AI_PREFS, prefs);
  },
};

