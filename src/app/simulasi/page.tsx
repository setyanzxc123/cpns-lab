"use client";

import { useEffect, useMemo, useState } from "react";
import { ExamRunner } from "@/components/exam-runner";
import { ResultView } from "@/components/result-view";
import { loadBank, CATEGORY_INFO } from "@/data/bank";
import type { Category, ExamConfig, Question, SessionResult } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

const PRESETS: { name: string; desc: string; counts: Record<Category, number>; minutes: number }[] = [
  {
    name: "Simulasi Mandiri (format BKN)",
    desc: "TWK 30 · TIU 35 · TKP 40 — 405 menit",
    counts: { TWK: 30, TIU: 35, TKP: 40 },
    minutes: 405,
  },
  {
    name: "Setengah Set",
    desc: "TWK 15 · TIU 17 · TKP 20 — 200 menit",
    counts: { TWK: 15, TIU: 17, TKP: 20 },
    minutes: 200,
  },
  {
    name: "Kuis Cepat",
    desc: "TWK 10 · TIU 10 · TKP 10 — 90 menit",
    counts: { TWK: 10, TIU: 10, TKP: 10 },
    minutes: 90,
  },
];

export default function SimulasiPage() {
  const [bank, setBank] = useState<Question[]>([]);
  const [phase, setPhase] = useState<"config" | "exam" | "result">("config");
  const [config, setConfig] = useState<ExamConfig | null>(null);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [counts, setCounts] = useState<Record<Category, number>>({ TWK: 10, TIU: 10, TKP: 10 });
  const [minutes, setMinutes] = useState(90);

  useEffect(() => {
    loadBank().then(setBank);
    const onBankUpdated = () => {
      void loadBank().then(setBank);
    };
    window.addEventListener("cpns:bank-updated", onBankUpdated);
    return () => window.removeEventListener("cpns:bank-updated", onBankUpdated);
  }, []);

  const startExam = (c: ExamConfig) => {
    setConfig(c);
    setResult(null);
    setPhase("exam");
  };

  const shortfall = useMemo(() => {
    if (!config || bank.length === 0) return [];
    const missing: string[] = [];
    for (const cat of ["TWK", "TIU", "TKP"] as Category[]) {
      const want = config.counts[cat] ?? 0;
      const have = bank.filter((q) => q.category === cat).length;
      if (have < want) missing.push(`${cat} kurang ${want - have} soal`);
    }
    return missing;
  }, [config, bank]);

  if (phase === "exam" && config) {
    return (
      <ExamRunner
        bank={bank}
        config={config}
        onFinished={(r) => {
          setResult(r);
          setPhase("result");
        }}
        onAbort={() => setPhase("config")}
      />
    );
  }

  if (phase === "result" && result) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (config) startExam(config);
            }}
          >
            <RotateCcw className="h-4 w-4" /> Ulangi dengan paket sama
          </Button>
          <Button variant="outline" onClick={() => setPhase("config")}>
            Ganti paket
          </Button>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            <Home className="h-4 w-4" /> Beranda
          </Link>
        </div>
        <ResultView result={result} bank={bank} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Simulasi Ujian</h1>
        <p className="text-sm text-muted-foreground">
          Satu sesi berwaktu dengan navigasi ala CAT BKN. Timer berjalan sejak Anda mulai;
          jawaban tersimpan otomatis.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {PRESETS.map((p) => (
          <Card key={p.name} className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{p.name}</CardTitle>
            </CardHeader>
            <CardContent className="mt-auto space-y-2">
              <p className="text-xs text-muted-foreground">{p.desc}</p>
              <Button size="sm" className="w-full" onClick={() => startExam({
                mode: "simulasi",
                title: p.name,
                counts: p.counts,
                durationSec: p.minutes * 60,
              })}>
                Mulai
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Paket Kustom</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {(["TWK", "TIU", "TKP"] as Category[]).map((cat) => (
              <div key={cat}>
                <label
                  htmlFor={`jumlah-${cat.toLowerCase()}`}
                  className="mb-1 block text-xs font-medium"
                  style={{ color: CATEGORY_INFO[cat].color }}
                >
                  {cat}
                </label>
                <Input
                  id={`jumlah-${cat.toLowerCase()}`}
                  type="number"
                  min={0}
                  max={100}
                  value={counts[cat]}
                  onChange={(e) =>
                    setCounts((c) => ({ ...c, [cat]: Math.max(0, Number(e.target.value) || 0) }))
                  }
                />
              </div>
            ))}
          </div>
          <div className="max-w-48">
            <label
              htmlFor="durasi-menit"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Durasi (menit)
            </label>
            <Input
              id="durasi-menit"
              type="number"
              min={1}
              value={minutes}
              onChange={(e) => setMinutes(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <Button
            onClick={() =>
              startExam({
                mode: "simulasi",
                title: "Simulasi Kustom",
                counts: { ...counts },
                durationSec: minutes * 60,
              })
            }
          >
            Mulai Simulasi Kustom
          </Button>
        </CardContent>
      </Card>

      {shortfall.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Bank soal belum cukup untuk paket ini:</p>
            <ul className="list-inside list-disc">
              {shortfall.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <p className="mt-1 text-xs">
              Soal yang tersedia tetap akan dipakai, atau tambahkan soal di menu{" "}
              <Link href="/bank" className="font-medium underline underline-offset-2">
                Bank Soal
              </Link>
              .
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
