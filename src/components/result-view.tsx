"use client";

// Tampilan hasil pengerjaan: skor per subtes, review jawaban
// dengan pembahasan, dan tombol minta penjelasan AI per soal.

import { useState } from "react";
import type { Question, SessionResult } from "@/lib/types";
import { CATEGORY_INFO } from "@/data/bank";
import { VisualPanel } from "@/components/figural";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Loader2 } from "lucide-react";

const LETTERS = ["A", "B", "C", "D", "E"];

export function ResultView({
  result,
  bank,
}: {
  result: SessionResult;
  bank: Question[];
}) {
  const byId = new Map(bank.map((q) => [q.id, q]));
  const pct = Math.round((result.totalScore / Math.max(1, result.maxScore)) * 100);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Hasil — {result.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Skor Total" value={`${result.totalScore}`} sub={`dari maksimum ${result.maxScore}`} />
            <Stat label="Persentase" value={`${pct}%`} />
            <Stat
              label="Durasi"
              value={`${Math.floor(result.durationSec / 60)} mnt`}
              sub={`${result.durationSec % 60} detik`}
            />
            <Stat
              label="Dikerjakan"
              value={new Date(result.finishedAt).toLocaleDateString("id-ID")}
              sub={new Date(result.finishedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            />
          </div>
          <Separator />
          <div className="space-y-3">
            {result.subScores.map((s) => {
              const info = CATEGORY_INFO[s.category];
              const p = Math.round((s.score / Math.max(1, s.maxScore)) * 100);
              return (
                <div key={s.category}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium" style={{ color: info.color }}>
                      {s.category} — {info.name}
                    </span>
                    <span className="text-muted-foreground">
                      {s.correct}/{s.total} benar · skor {s.score}/{s.maxScore}
                    </span>
                  </div>
                  <Progress value={p} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <h3 className="text-lg font-semibold">Review Jawaban</h3>
      <div className="space-y-3">
        {result.answers.map((a, idx) => {
          const q = byId.get(a.questionId);
          if (!q) return null;
          const wrong = a.correct === false;
          return (
            <ReviewCard
              key={a.questionId + idx}
              q={q}
              choice={a.choice}
              value={a.value}
              wrong={wrong}
              index={idx}
            />
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ReviewCard({
  q,
  choice,
  value,
  wrong,
  index,
}: {
  q: Question;
  choice: number | null;
  value: number;
  wrong: boolean;
  index: number;
}) {
  const [aiExplain, setAiExplain] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function askAi() {
    setLoading(true);
    setAiExplain(null);
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.text,
          category: q.category,
          options: q.options.map((o, i) => ({
            letter: LETTERS[i],
            text: o.text ?? "(gambar)",
          })),
          answerIndex: q.answer,
          points: q.points,
          userChoice: choice,
          explanation: q.explanation,
        }),
      });
      const data = await res.json();
      setAiExplain(data.explanation ?? "AI tidak tersedia saat ini.");
    } catch {
      setAiExplain("Gagal menghubungi AI. Periksa koneksi atau konfigurasi GEMINI_API_KEY.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className={wrong ? "border-red-200" : ""}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-muted-foreground">No. {index + 1}</span>
            <Badge variant="outline">{q.category}</Badge>
            {q.category !== "TKP" &&
              (wrong ? (
                <Badge variant="destructive">Salah</Badge>
              ) : (
                <Badge className="bg-green-600">Benar</Badge>
              ))}
            {q.category === "TKP" && <Badge variant="secondary">Nilai {value}/5</Badge>}
          </div>
        </div>
        <p className="text-sm font-medium leading-relaxed">{q.text}</p>
        {q.visual && (
          <div className="rounded bg-muted/40 p-2">
            <VisualPanel spec={q.visual} />
          </div>
        )}
        <div className="text-sm">
          {q.category === "TKP" && q.points ? (
            <p>
              Pilihan Anda: <b>{choice != null ? LETTERS[choice] : "—"}</b> ({q.options[choice ?? 0]?.text ?? "(gambar)"})
            </p>
          ) : (
            <>
              <p className={wrong ? "text-red-600" : ""}>
                Pilihan Anda: <b>{choice != null ? LETTERS[choice] : "tidak dijawab"}</b>
              </p>
              <p className="text-green-700">
                Kunci: <b>{LETTERS[q.answer ?? 0]}</b> — {q.options[q.answer ?? 0]?.text ?? "(gambar)"}
              </p>
            </>
          )}
        </div>
        <div className="rounded-lg bg-muted/40 p-3 text-sm leading-relaxed">
          <p className="mb-1 font-semibold">Pembahasan</p>
          <p className="text-muted-foreground">{q.explanation}</p>
        </div>
        <div>
          {aiExplain ? (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm leading-relaxed dark:border-purple-900/50 dark:bg-purple-950/30">
              <p className="mb-1 flex items-center gap-1 font-semibold text-purple-800 dark:text-purple-300">
                <Sparkles className="h-3.5 w-3.5" /> Penjelasan AI
              </p>
              <p className="whitespace-pre-wrap text-purple-950 dark:text-purple-200">{aiExplain}</p>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={askAi} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Minta penjelasan AI
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
