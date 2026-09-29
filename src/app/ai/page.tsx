"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Loader2, Send, Sparkles, User } from "lucide-react";

export default function AiPage() {
  const aiOn = Boolean(process.env.NEXT_PUBLIC_HAS_GEMINI);
  const { messages, sendMessage, status, error } = useChat({
    transport: new TextStreamChatTransport({ api: "/api/ai/chat" }),
  });
  const [report, setReport] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Tutor AI</h1>
        <p className="text-sm text-muted-foreground">
          Bertanya soal materi TWK/TIU/TKP, minta soal latihan baru, atau minta analisis progres belajar Anda.
        </p>
      </div>

      {!aiOn && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          Chat AI butuh <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50 dark:text-amber-200">GEMINI_API_KEY</code> di file{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50 dark:text-amber-200">.env.local</code>. Lihat README untuk langkah pemasangan.
          Analisis skor di bawah juga memakai kunci yang sama.
        </div>
      )}

      {/* Analisis skor */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-purple-600" /> Analisis Skor &amp; Rencana Belajar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={async () => {
              setAnalyzing(true);
              setReport(null);
              try {
                const { getRepo } = await import("@/lib/repository");
                const repo = await getRepo();
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
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
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
            <Bot className="h-4 w-4 text-blue-700 dark:text-blue-400" /> Chat dengan Tutor{" "}
            <Badge variant="outline">gemini-2.5-flash</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-h-[28rem] space-y-3 overflow-y-auto rounded-lg border p-3">
            {messages.length === 0 && (
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
                    <Bot className="h-4 w-4" />
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
                    <User className="h-4 w-4" />
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
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <Button type="submit" size="icon" disabled={status === "submitted" || status === "streaming"}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
