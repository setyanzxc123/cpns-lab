"use client";

// Modul storage lokal (localStorage) — layer persistensi default saat
// user belum login Supabase. Interface sama dengan SupabaseRepo.

import type { Question, SessionResult } from "./types";

const K_RESULTS = "cpns.results";
const K_WRONG = "cpns.wrong";
const K_CUSTOM = "cpns.customQuestions";
const K_RUNNING = "cpns.runningExam";
const K_EXPLAIN_CACHE = "cpns.aiExplains";

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
  getCustomQuestions(): Question[] {
    return read<Question[]>(K_CUSTOM, []);
  },
  saveCustomQuestions(qs: Question[]) {
    write(K_CUSTOM, qs);
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
  hasGuestData(): boolean {
    const results = localStore.getResults();
    const wrong = localStore.getWrong();
    const custom = localStore.getCustomQuestions();
    return results.length > 0 || Object.keys(wrong).length > 0 || custom.length > 0;
  },
  clearGuestData(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(K_RESULTS);
    window.localStorage.removeItem(K_WRONG);
    window.localStorage.removeItem(K_CUSTOM);
  },
  getLastSync(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("cpns.lastSync");
  },
  setLastSync(iso: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("cpns.lastSync", iso);
  },
};

