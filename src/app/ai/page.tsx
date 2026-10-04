"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import type { Question } from "@/lib/types";
import type { ChatSession } from "@/lib/storage";
import { localStore } from "@/lib/storage";
import {
  AI_MODEL_OPTIONS,
  AI_THINKING_OPTIONS,
  DEFAULT_AI_MODEL_KEY,
  DEFAULT_AI_THINKING_KEY,
  aiThinkingLevelsFor,
  resolveAiModelKey,
  resolveAiThinkingKey,
} from "@/lib/ai-options";
import type { AiThinkingKey } from "@/lib/ai-options";
import { refreshAllAiQuotaUsage, recordAiRequest } from "@/lib/ai-quota";
import type { AiQuotaUsage } from "@/lib/ai-quota";
import type { RunningExam } from "@/lib/types";
import { getRepo } from "@/lib/repository";
import { useSmoothText } from "@/hooks/use-smooth-text";
import { loadBank } from "@/data/bank";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ChatHistoryList } from "@/components/chat-history";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageActions,
  MessageAction,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Copy, GraduationCap, History, Loader2, RefreshCcw } from "lucide-react";

const LETTERS = ["A", "B", "C", "D", "E"];

/** Balasan assistant dengan efek ketik mulus saat sedang streaming. */
function AssistantMessage({ text, streaming }: { text: string; streaming: boolean }) {
  const smooth = useSmoothText(text, streaming);
  return <MessageResponse>{smooth}</MessageResponse>;
}

interface ChatContext {
  id?: string;
  label: string;
}

function messageText(m: UIMessage): string {
  return m.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function messageReasoning(m: UIMessage): string {
  return m.parts
    .filter((p): p is { type: "reasoning"; text: string } => p.type === "reasoning")
    .map((p) => p.text)
    .join("");
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
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [runningExam, setRunningExam] = useState<{
    exam: RunningExam;
    remainingMin: number | null;
  } | null>(null);

  // Percakapan seed dari deep-link soal memakai id deterministik agar
  // kunjungan ulang melanjutkan utas yang sama, bukan menduplikasi riwayat.
  const seededChatId = context?.id ? `C-q-${context.id}` : null;

  // Guard: sesi yang dihapus tidak boleh ditulis ulang oleh auto-save
  // yang kebetulan masih berjalan saat penghapusan.
  const deletedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    getRepo()
      .then((r) => r.listChatSessions())
      .then(setSessions)
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  // Ujian berjalan di halaman lain: tawarkan jalan kembali selama waktunya tersisa.
  useEffect(() => {
    const check = () => {
      const saved = localStore.getRunning() as RunningExam | null;
      const valid = saved && (!saved.endsAt || saved.endsAt > Date.now());
      setRunningExam(
        valid
          ? {
              exam: saved,
              remainingMin: saved.endsAt
                ? Math.max(1, Math.ceil((saved.endsAt - Date.now()) / 60000))
                : null,
            }
          : null,
      );
    };
    check();
    const interval = window.setInterval(check, 30000);
    return () => window.clearInterval(interval);
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

  // Preferensi model AI: dipersist di localStorage dan dikirim di body tiap
  // request (sendMessage/regenerate) agar route tervalidasi server-side.
  const [modelKey, setModelKey] = useState<string>(DEFAULT_AI_MODEL_KEY);
  const [thinkingKey, setThinkingKey] = useState<AiThinkingKey>(DEFAULT_AI_THINKING_KEY);
  // Kuota semua model untuk dropdown: tabel Supabase saat login, lokal saat tamu.
  const [quotaMap, setQuotaMap] = useState<Record<string, AiQuotaUsage> | null>(null);

  useEffect(() => {
    const prefs = localStore.getAiPrefs();
    const model = resolveAiModelKey(prefs.model);
    const thinking = resolveAiThinkingKey(prefs.thinking);
    if (model) setModelKey(model);
    if (thinking) setThinkingKey(thinking);
  }, []);

  useEffect(() => {
    let active = true;
    refreshAllAiQuotaUsage().then((map) => {
      if (active) setQuotaMap(map);
    });
    return () => {
      active = false;
    };
  }, []);

  function updateModelPref(key: string) {
    setModelKey(key);
    // Bila level thinking saat ini tak didukung model baru, turunkan ke
    // level terendah yang didukung (mis. minimal -> low di 3.8 Flash).
    if (!aiThinkingLevelsFor(key).includes(thinkingKey)) {
      const fallback = aiThinkingLevelsFor(key)[0];
      setThinkingKey(fallback);
      localStore.saveAiPrefs({ model: key, thinking: fallback });
      return;
    }
    localStore.saveAiPrefs({ ...localStore.getAiPrefs(), model: key });
  }

  function updateThinkingPref(key: AiThinkingKey) {
    setThinkingKey(key);
    localStore.saveAiPrefs({ ...localStore.getAiPrefs(), thinking: key });
  }

  // Perkiraan kuota: kurangi jatah model terpilih saat chat dikirim.
  function countQuota() {
    void recordAiRequest(modelKey).then((q) => {
      setQuotaMap((prev) => ({ ...(prev ?? {}), [modelKey]: q }));
    });
  }

  // Transport dibuat sekali — instansiasi ulang tiap render memutus koneksi stream.
  // Protokol UIMessage: mendukung part reasoning dari server.
  const [transport] = useState(() => new DefaultChatTransport({ api: "/api/ai/chat" }));
  const { messages, sendMessage, setMessages, status, error, stop, regenerate } = useChat({ transport });

  // Deep-link soal: lanjutkan utas yang sudah ada bila pernah dibuat,
  // baru kalau tidak, tanam seed percakapan baru (setelah riwayat termuat
  // agar tidak menimpa utas lama yang belum sempat dibaca).
  useEffect(() => {
    if (!seedQuestion || messages.length > 0) return;
    if (seededChatId) {
      setActiveId(seededChatId);
      if (historyLoading) return;
      const existing = sessions.find((s) => s.id === seededChatId);
      if (existing) {
        setMessages(existing.messages as unknown as UIMessage[]);
        setSeedQuestion(null);
        return;
      }
    }
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
  }, [seedQuestion, choice, messages.length, sessions, historyLoading, seededChatId]);

  // Auto-save sesi: setiap stream selesai (bukan per chunk).
  // Membuka sesi lama tanpa pesan baru tidak menyimpan ulang agar urutan
  // riwayat tidak terdorong ke atas.
  useEffect(() => {
    if ((status !== "ready" && status !== "error") || messages.length === 0) return;
    let cancelled = false;
    (async () => {
      const candidateId = activeId ?? seededChatId ?? `C-${Date.now()}`;
      if (deletedIdsRef.current.has(candidateId)) return;
      const canon = (ms: Array<{ id: string; role: string; parts: unknown }>) =>
        JSON.stringify(ms.map((m) => ({ id: m.id, role: m.role, parts: m.parts })));
      const signature = canon(messages);
      const existing = sessions.find((s) => s.id === candidateId);
      if (existing && canon(existing.messages) === signature) return;
      const session: ChatSession = {
        id: candidateId,
        title: deriveTitle(messages, context),
        createdAt: existing?.createdAt ?? Date.now(),
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
        if (activeId !== candidateId) setActiveId(candidateId);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [messages, status, activeId, context, sessions, seededChatId]);

  function aiPrefsBody() {
    return { model: modelKey, thinking: thinkingKey };
  }

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

  function deleteSession(id: string) {
    // Optimistis: singkirkan dari UI dulu, hapus repo menyusul.
    deletedIdsRef.current.add(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
      setContext(null);
      setSeedQuestion(null);
    }
    void (async () => {
      const next = await (await getRepo()).deleteChatSession(id);
      setSessions(next);
    })();
  }

  // Indikator mengetik: tampil hanya saat belum ada teks maupun ringkasan berpikir
  const lastMessage = messages[messages.length - 1];
  const lastText = lastMessage ? messageText(lastMessage) : "";
  const lastReasoning = lastMessage ? messageReasoning(lastMessage) : "";
  const waitingForFirstToken =
    (status === "submitted" || status === "streaming") &&
    messages.length > 0 &&
    lastMessage?.role === "assistant" &&
    lastText.length === 0 &&
    lastReasoning.length === 0;

  // Stream selesai tanpa teks → kemungkinan error upstream tertelan (kuota, dll.)
  const emptyReply =
    status === "ready" &&
    messages.length > 0 &&
    lastMessage?.role === "assistant" &&
    lastText.length === 0;

  const quota = quotaMap?.[modelKey] ?? null;

  const historyList = (
    <ChatHistoryList
      sessions={sessions}
      activeId={activeId}
      loading={historyLoading}
      onOpen={openSession}
      onDelete={deleteSession}
      onNew={newChat}
    />
  );

  return (
    <div className="ai-page flex h-full w-full gap-4 sm:gap-5 overflow-hidden">
      <aside className="hidden h-full w-64 shrink-0 flex-col overflow-hidden border-r pr-4 md:flex">
        <h1 className="px-2 pb-3 text-lg font-bold tracking-tight">Tutor AI</h1>
        {historyList}
      </aside>

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between gap-2 pb-1 md:hidden">
          <h2 className="text-lg font-bold tracking-tight">Tutor AI</h2>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Buka riwayat percakapan"
                >
                  <History className="h-4 w-4" aria-hidden />
                  Riwayat
                </Button>
              }
            />
            <SheetContent side="left" className="flex w-72 flex-col gap-3 p-4">
              <SheetHeader className="p-0">
                <SheetTitle>Riwayat Percakapan</SheetTitle>
              </SheetHeader>
              {historyList}
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex shrink-0 flex-col gap-1.5 pb-2">
          {runningExam && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-blue-300/60 bg-blue-50 px-3 py-2 text-xs dark:border-blue-900/50 dark:bg-blue-950/40">
              <span className="truncate">
                Ujian <span className="font-semibold">{runningExam.exam.config.title}</span> berjalan
                {runningExam.remainingMin !== null && ` · sisa ±${runningExam.remainingMin} menit`}
              </span>
              <Link
                href={runningExam.exam.config.mode === "simulasi" ? "/simulasi" : "/latihan"}
                className="shrink-0 font-medium underline-offset-2 hover:underline"
              >
                Kembali
              </Link>
            </div>
          )}
          {quota?.remaining === 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
              Perkiraan kuota harian model ini sudah habis — request berikutnya
              kemungkinan ditolak Google. Jatah ter-reset pukul{" "}
              {new Date(quota.resetAt).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              (tengah malam PT), atau pilih model lain.
            </div>
          )}
          {!aiOn && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
              Chat butuh <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50 dark:text-amber-200">GEMINI_API_KEY</code> — lihat README.
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <Conversation className="min-h-0 flex-1">
            <ConversationContent className="mx-auto w-full max-w-4xl p-3 sm:p-5 pb-6 gap-6">
              {messages.length === 0 && !context && (
                <div className="flex size-full flex-col items-center justify-center gap-5 text-center">
                  <ConversationEmptyState
                    title="Belum ada percakapan"
                    description="Mulai bertanya, atau coba salah satu contoh berikut:"
                    icon={<GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden />}
                    className="p-0"
                  />
                  <div className="flex max-w-xl flex-wrap justify-center gap-2">
                    {[
                      "Buatkan 5 soal latihan Pancasila beserta pembahasan",
                      "Trik cepat menjawab deret angka di TIU",
                      "Jelaskan perbedaan norma hukum dan kesusilaan",
                    ].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          countQuota();
                          void sendMessage({ text: s }, { body: aiPrefsBody() });
                        }}
                        className="focus-ring flex min-h-11 items-center rounded-full border px-4 py-2 text-xs transition-colors hover:bg-muted text-left"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m) => {
                const text = messageText(m);
                const reasoning = messageReasoning(m);
                const isLast = m.id === messages[messages.length - 1]?.id;
                const streaming = status === "streaming" && isLast;
                if (m.role === "user") {
                  return (
                    <Message key={m.id} from="user">
                      <MessageContent>
                        <MessageResponse>{text}</MessageResponse>
                      </MessageContent>
                    </Message>
                  );
                }
                return (
                  <Message key={m.id} from="assistant" className="max-w-full">
                    <div className="flex w-full min-w-0 flex-col gap-1.5">
                      {reasoning && (
                        <Reasoning isStreaming={streaming && text.length === 0}>
                          <ReasoningTrigger />
                          <ReasoningContent>{reasoning}</ReasoningContent>
                        </Reasoning>
                      )}
                      <AssistantMessage
                        text={text}
                        streaming={streaming && text.length > 0}
                      />
                      {text && (
                        <MessageActions className="opacity-80 transition-opacity md:opacity-0 md:group-hover:opacity-100 group-focus-within:opacity-100">
                          <MessageAction
                            tooltip="Salin"
                            aria-label="Salin balasan"
                            onClick={() => void navigator.clipboard.writeText(text)}
                          >
                            <Copy className="h-3.5 w-3.5" aria-hidden />
                          </MessageAction>
                          {isLast && (
                            <MessageAction
                              tooltip="Ulangi"
                              aria-label="Ulangi balasan terakhir"
                            onClick={() => {
                              countQuota();
                              void regenerate({ body: aiPrefsBody() });
                            }}
                            >
                              <RefreshCcw className="h-3.5 w-3.5" aria-hidden />
                            </MessageAction>
                          )}
                        </MessageActions>
                      )}
                    </div>
                  </Message>
                );
              })}
              {waitingForFirstToken && (
                <Message from="assistant" className="max-w-full">
                  <div className="flex items-center gap-1.5 px-1 py-1">
                    <span data-typing-dot className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    <span data-typing-dot className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    <span data-typing-dot className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    <span className="sr-only">Tutor sedang menulis…</span>
                  </div>
                </Message>
              )}
              {emptyReply && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                  AI tidak mengirim balasan — kemungkinan kuota harian API habis atau terjadi gangguan. Coba lagi nanti.
                </div>
              )}
            </ConversationContent>
            <ConversationScrollButton className="bottom-4 z-20" />
          </Conversation>

          <div className="shrink-0 bg-background p-3 sm:p-4">
            <div className="mx-auto max-w-4xl">
              {error && (
                <div className="mb-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive shadow-xs">
                  Gagal: {error.message}. Pastikan GEMINI_API_KEY terpasang dan server berjalan.
                </div>
              )}
              {aiOn && (
                <div className="mb-2 flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="hidden sm:inline">Model</span>
                    <select
                      value={modelKey}
                      onChange={(e) => updateModelPref(e.target.value)}
                      aria-label="Pilih model AI"
                      className="h-8 rounded-lg border border-input bg-card px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                    >
                      {AI_MODEL_OPTIONS.map((m) => {
                        const u = quotaMap?.[m.id];
                        const count = u ? `${u.remaining}/${u.limit}` : `${m.dailyQuota}`;
                        return (
                          <option
                            key={m.id}
                            value={m.id}
                            title={`${m.hint} — reset tengah malam PT (15.00 WITA)`}
                          >
                            {m.label} ({count} req)
                          </option>
                        );
                      })}
                    </select>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="hidden sm:inline">Thinking</span>
                    <select
                      value={thinkingKey}
                      onChange={(e) => updateThinkingPref(e.target.value as AiThinkingKey)}
                      aria-label="Pilih thinking level AI"
                      className="h-8 rounded-lg border border-input bg-card px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                    >
                      {AI_THINKING_OPTIONS.filter((t) =>
                        aiThinkingLevelsFor(modelKey).includes(t.key),
                      ).map((t) => (
                        <option key={t.key} value={t.key} title={t.hint}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
              <PromptInput
                onSubmit={({ text }) => {
                  const t = (text ?? "").trim();
                  if (!t) return;
                  countQuota();
                  sendMessage({ text: t }, { body: aiPrefsBody() });
                }}
                className="w-full rounded-2xl border border-input bg-card transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30"
              >
                <div className="flex w-full items-end gap-2 px-3 py-1.5">
                  <PromptInputTextarea
                    aria-label="Pesan untuk tutor AI"
                    placeholder="Tulis pertanyaan… (Enter kirim, Shift+Enter baris baru)"
                    className="min-h-[38px] max-h-36 flex-1 resize-none bg-transparent py-2 text-sm leading-relaxed outline-none border-0 shadow-none ring-0 focus-visible:ring-0 placeholder:text-muted-foreground"
                  />
                  <PromptInputSubmit
                    status={status}
                    onStop={() => stop()}
                    aria-label="Kirim pesan"
                    className="touch-target h-9 w-9 shrink-0 rounded-xl mb-1"
                  />
                </div>
              </PromptInput>
            </div>
          </div>
        </div>
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
