"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import type { UIMessage } from "ai";
import type { Question } from "@/lib/types";
import type { ChatSession } from "@/lib/storage";
import { getRepo } from "@/lib/repository";
import { loadBank } from "@/data/bank";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ChatHistoryList } from "@/components/chat-history";
import { Bot, History, Loader2, Send, Sparkles, User } from "lucide-react";

const LETTERS = ["A", "B", "C", "D", "E"];

interface ChatContext {
  id?: string;
  label: string;
}

function buildSeed(q: Question, choice: number | null): string {
  const lines: string[] = [];
  lines.push(`Saya sedang belajar soal ${q.category}${q.sub ? ` (${q.sub})` : ""}:`);
  lines.push("");
  lines.push(q.text);
  lines.push("");
  lines.push("Pilihan:");
  q.options.forEach((o, i) => lines.push(`${LETTERS[i]}. ${o.text ?? "(gambar)"}`));
  if (q.category === "TKP" && q.points) {
    lines.push(
      `Saya memilih: ${choice != null ? LETTERS[choice] : "—"} (nilai ${q.points[choice ?? 0]}/5)`,
    );
  } else if (choice != null) {
    lines.push(
      `Jawaban saya: ${LETTERS[choice]}${
        q.answer != null ? ` (kunci: ${LETTERS[q.answer]})` : ""
      }`,
    );
  }
  lines.push(`Pembahasan resmi: ${q.explanation}`);
  return lines.join("\n");
}

const FOLLOWUPS = [
  "Jelaskan langkah pengerjaannya dengan cara lain",
  "Kenapa pilihan saya kurang tepat?",
  "Beri soal serupa untuk latihan",
];

function deriveTitle(messages: UIMessage[], context: ChatContext | null): string {
  if (context?.label) return `Soal ${context.label}`;
  const firstUser = messages.find((m) => m.role === "user");
  const text =
    firstUser?.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join(" ") ?? "";
  return text.slice(0, 60) || "Percakapan";
}

function AiChat() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qid = searchParams.get("q");
  const choiceParam = searchParams.get("c");
  const choice = choiceParam != null && choiceParam !== "" ? Number(choiceParam) : null;
  const aiOn = Boolean(process.env.NEXT_PUBLIC_HAS_GEMINI);

  // null = tanpa konteks soal; undefined = masih memuat bank
  const [seedQuestion, setSeedQuestion] = useState<Question | null | undefined>(
    qid ? undefined : null,
  );
  const [context, setContext] = useState<ChatContext | null>(null);

  // Riwayat percakapan (Supabase saat login, localStorage saat tamu)
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    getRepo()
      .then((r) => r.listChatSessions())
      .then(setSessions)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!qid) return;
    let active = true;
    loadBank().then((bank) => {
      if (!active) return;
      const found = bank.find((q) => q.id === qid) ?? null;
      setSeedQuestion(found);
      if (found) {
        setContext({
          id: found.id,
          label: `${found.category}${found.sub ? ` — ${found.sub}` : ""}`,
        });
      }
    });
    return () => {
      active = false;
    };
  }, [qid]);

  // Transport dibuat sekali — instansiasi ulang tiap render memutus koneksi stream.
  const [transport] = useState(() => new TextStreamChatTransport({ api: "/api/ai/chat" }));
  const { messages, sendMessage, setMessages, status, error } = useChat({ transport });
  const [report, setReport] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Seed percakapan baru dengan konteks soal dari deep-link (sekali)
  useEffect(() => {
    if (!seedQuestion || messages.length > 0) return;
    setMessages([
      {
        id: "seed-question",
        role: "user",
        parts: [{ type: "text", text: buildSeed(seedQuestion, choice) }],
      },
      {
        id: "seed-greeting",
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "Saya sudah membaca soalnya. Mau tanyakan bagian mana — langkah pengerjaannya, konsep di baliknya, atau kenapa pilihan lain kurang tepat?",
          },
        ],
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedQuestion, choice, messages.length]);

  // Auto-save sesi: setiap stream selesai (bukan per chunk)
  useEffect(() => {
    if ((status !== "ready" && status !== "error") || messages.length === 0) return;
    let cancelled = false;
    (async () => {
      const session: ChatSession = {
        id: activeId ?? `C-${Date.now()}`,
        title: deriveTitle(messages, context),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        contextQuestionId: context?.id,
        contextLabel: context?.label,
        messages: messages.map((m) => ({
          id: m.id,
          role: m.role,
          parts: m.parts,
        })),
      };
      const next = await (await getRepo()).saveChatSession(session);
      if (!cancelled) {
        setSessions(next);
        if (activeId !== session.id) setActiveId(session.id);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [messages, status, activeId, context]);

  function newChat() {
    setActiveId(null);
    setMessages([]);
    setContext(null);
    setSeedQuestion(null);
    if (qid) router.replace("/ai");
    setSheetOpen(false);
  }

  function openSession(s: ChatSession) {
    setActiveId(s.id);
    setMessages(s.messages as unknown as UIMessage[]);
    setContext(
      s.contextQuestionId
        ? { id: s.contextQuestionId, label: s.contextLabel ?? "" }
        : null,
    );
    setSeedQuestion(null);
    setSheetOpen(false);
  }

  async function deleteSession(id: string) {
    setSessions(await (await getRepo()).deleteChatSession(id));
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
      setContext(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-6">
      {/* Sidebar riwayat — desktop */}
      <aside className="hidden w-60 shrink-0 self-start md:sticky md:top-[72px] md:flex md:max-h-[calc(100vh-90px)] md:flex-col">
        <ChatHistoryList
          sessions={sessions}
          activeId={activeId}
          onOpen={openSession}
          onDelete={(id) => void deleteSession(id)}
          onNew={newChat}
        />
      </aside>

      <div className="min-w-0 flex-1 space-y-5">
        <div>
          {qid ? (
            <Link
              href="/latihan"
              className="text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              ← Kembali ke latihan
            </Link>
          ) : null}
          <div className="flex items-center gap-2">
            <h1 className="mt-1 text-2xl font-bold">Tutor AI</h1>
            {/* Riwayat — mobile */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto md:hidden"
                    aria-label="Buka riwayat percakapan"
                  >
                    <History className="h-4 w-4" aria-hidden />
                    Riwayat
                  </Button>
                }
              />
              <SheetContent side="left" className="flex w-72 flex-col gap-2 p-4">
                <SheetHeader className="p-0">
                  <SheetTitle>Riwayat Percakapan</SheetTitle>
                </SheetHeader>
                <ChatHistoryList
                  sessions={sessions}
                  activeId={activeId}
                  onOpen={openSession}
                  onDelete={(id) => void deleteSession(id)}
                  onNew={newChat}
                />
              </SheetContent>
            </Sheet>
          </div>
          <p className="text-sm text-muted-foreground">
            Bertanya soal materi TWK/TIU/TKP, minta soal latihan baru, atau minta analisis progres belajar Anda.
          </p>
        </div>

        {!aiOn && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
            Chat &amp; analisis skor butuh <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50 dark:text-amber-200">GEMINI_API_KEY</code> — lihat README untuk pemasangan.
          </div>
        )}

        {/* Konteks soal dari tautan latihan */}
        {context ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/60 px-3 py-2 text-xs text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              Konteks aktif: <b>{context.label}</b>
            </span>
            <div className="ml-auto flex flex-wrap gap-1.5">
              {FOLLOWUPS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => sendMessage({ text: f })}
                  className="rounded-full border border-blue-300 px-2.5 py-0.5 text-[11px] font-medium transition-colors hover:bg-blue-100 dark:border-blue-800 dark:hover:bg-blue-950"
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        ) : qid && seedQuestion === null ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
            Soal dari tautan tidak ditemukan di bank soal — chat berjalan tanpa konteks.
          </div>
        ) : null}

        {/* Analisis skor */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-purple-600" aria-hidden /> Analisis Skor &amp; Rencana Belajar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={async () => {
                setAnalyzing(true);
                setReport(null);
                try {
                  const { getRepo: getRepository } = await import("@/lib/repository");
                  const repo = await getRepository();
                  const { loadBank } = await import("@/data/bank");
                  const [results, bank, wrong] = await Promise.all([
                    repo.listResults(),
                    loadBank(),
                    repo.listWrong(),
                  ]);
                  const byId = new Map(bank.map((q) => [q.id, q]));
                  const subAcc = new Map<string, { sub: string; category: string; correct: number; total: number }>();
                  for (const r of [...results].sort((a, b) => a.finishedAt - b.finishedAt)) {
                    for (const a of r.answers) {
                      const q = byId.get(a.questionId);
                      if (!q) continue;
                      const cur =
                        subAcc.get(q.sub) ?? { sub: q.sub, category: q.category, correct: 0, total: 0 };
                      cur.total += 1;
                      if (a.correct) cur.correct += 1;
                      subAcc.set(q.sub, cur);
                    }
                  }
                  const res = await fetch("/api/ai/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      history: results.map((r) => ({
                        date: new Date(r.finishedAt).toISOString().slice(0, 10),
                        mode: r.mode,
                        totalScore: r.totalScore,
                        maxScore: r.maxScore,
                        subScores: r.subScores,
                      })),
                      subAccuracy: [...subAcc.values()].map((s) => ({
                        ...s,
                        pct: Math.round((s.correct / Math.max(1, s.total)) * 100),
                      })),
                      wrongCount: Object.keys(wrong).length,
                    }),
                  });
                  const data = await res.json();
                  setReport(data.report ?? "Tidak ada hasil.");
                } catch {
                  setReport("Gagal menghubungi AI. Periksa koneksi atau GEMINI_API_KEY.");
                } finally {
                  setAnalyzing(false);
                }
              }}
              disabled={analyzing}
            >
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
              Analisis progres saya
            </Button>
            {report && (
              <div className="prose-sm max-w-none whitespace-pre-wrap rounded-lg border border-purple-200 bg-purple-50 p-4 text-sm leading-relaxed text-purple-950 dark:border-purple-900/50 dark:bg-purple-950/30 dark:text-purple-200">
                {report}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-4 w-4 text-blue-700 dark:text-blue-400" aria-hidden /> Chat dengan Tutor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-[28rem] space-y-3 overflow-y-auto rounded-lg border p-3">
              {messages.length === 0 && !context && (
                <div className="space-y-2 py-6 text-center text-sm text-muted-foreground">
                  <p>Belum ada percakapan. Coba tanya:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      "Buatkan 5 soal latihan Pancasila beserta pembahasan",
                      "Trik cepat menjawab deret angka di TIU",
                      "Jelaskan perbedaan norma hukum dan kesusilaan",
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage({ text: s })}
                        className="rounded-full border px-3 py-1 text-xs hover:bg-muted"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                  {m.role !== "user" && (
                    <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      <Bot className="h-4 w-4" aria-hidden />
                    </span>
                  )}
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user" ? "bg-blue-600 text-white" : "bg-muted text-foreground"
                    }`}
                  >
                    {m.parts
                      .filter((p): p is { type: "text"; text: string } => p.type === "text")
                      .map((p) => p.text)
                      .join("")}
                  </div>
                  {m.role === "user" && (
                    <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                      <User className="h-4 w-4" aria-hidden />
                    </span>
                  )}
                </div>
              ))}
            </div>
            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                Gagal: {error.message}. Pastikan GEMINI_API_KEY terpasang dan server berjalan.
              </div>
            )}
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const input = form.elements.namedItem("msg") as HTMLTextAreaElement;
                if (!input.value.trim()) return;
                sendMessage({ text: input.value });
                input.value = "";
              }}
            >
              <Textarea
                name="msg"
                placeholder="Tulis pertanyaan… (Enter untuk kirim)"
                aria-label="Pesan untuk tutor AI"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                aria-label="Kirim pesan"
                disabled={status === "submitted" || status === "streaming"}
              >
                <Send className="h-4 w-4" aria-hidden />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AiPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Memuat…
        </div>
      }
    >
      <AiChat />
    </Suspense>
  );
}
