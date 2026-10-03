"use client";

import { useEffect, useMemo, useState } from "react";
import { ExamRunner } from "@/components/exam-runner";
import { ResultView } from "@/components/result-view";
import { loadBank } from "@/data/bank";
import type { Category, ExamConfig, Question, SessionResult } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

// Paket tunggal format resmi CAT BKN: SKD 110 soal dalam 405 menit.
const BKN_CONFIG = {
  title: "Simulasi Mandiri (format BKN)",
  counts: { TWK: 30, TIU: 35, TKP: 40 } as Record<Category, number>,
  minutes: 405,
};

export default function SimulasiPage() {
  const [bank, setBank] = useState<Question[]>([]);
  const [phase, setPhase] = useState<"config" | "exam" | "result">("config");
  const [config, setConfig] = useState<ExamConfig | null>(null);
  const [result, setResult] = useState<SessionResult | null>(null);

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
            Kembali
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

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="font-semibold">{BKN_CONFIG.title}</p>
            <p className="text-xs text-muted-foreground">
              TWK 30 · TIU 35 · TKP 40 — {BKN_CONFIG.minutes} menit
            </p>
          </div>
          <Button
            size="lg"
            onClick={() =>
              startExam({
                mode: "simulasi",
                title: BKN_CONFIG.title,
                counts: BKN_CONFIG.counts,
                durationSec: BKN_CONFIG.minutes * 60,
              })
            }
          >
            Mulai Simulasi
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
              Soal yang tersedia tetap akan dipakai.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
