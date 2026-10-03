"use client";

import { useEffect, useState } from "react";
import { ExamRunner } from "@/components/exam-runner";
import { ResultView } from "@/components/result-view";
import { loadBank, CATEGORY_INFO, SUB_BY_CATEGORY } from "@/data/bank";
import type { Category, ExamConfig, Question, SessionResult, SubCategory } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RotateCcw, Home, Repeat } from "lucide-react";

const ALL_QUESTIONS_COUNT = 999;

export default function LatihanPage() {
  const [bank, setBank] = useState<Question[]>([]);
  const [phase, setPhase] = useState<"config" | "exam" | "result">("config");
  const [config, setConfig] = useState<ExamConfig | null>(null);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [cat, setCat] = useState<Category>("TWK");
  const [subs, setSubs] = useState<SubCategory[]>([]);
  const [count, setCount] = useState(10);
  const [wrongIds, setWrongIds] = useState<string[] | null>(null);

  useEffect(() => {
    loadBank().then(setBank);
    const onBankUpdated = () => {
      void loadBank().then(setBank);
    };
    window.addEventListener("cpns:bank-updated", onBankUpdated);

    // Deep-link: ?cat=TIU&subs=Pola Bilangan,Figural — prakonfigurasi paket
    // dari tautan "Fokus berikutnya" di Beranda. Nilai tak dikenal diabaikan.
    const params = new URLSearchParams(window.location.search);
    const catParam = params.get("cat");
    const selectedCat: Category =
      catParam === "TWK" || catParam === "TIU" || catParam === "TKP" ? catParam : "TWK";
    if (catParam) setCat(selectedCat);
    const subsParam = params.get("subs");
    if (subsParam) {
      const valid = new Set<string>(SUB_BY_CATEGORY[selectedCat]);
      const picked = subsParam
        .split(",")
        .map((s) => s.trim())
        .filter((s) => valid.has(s));
      if (picked.length > 0) setSubs(picked as SubCategory[]);
    }

    (async () => {
      const { getRepo } = await import("@/lib/repository");
      const repo = await getRepo();
      const wrong = await repo.listWrong();
      setWrongIds(Object.keys(wrong));
    })();

    return () => window.removeEventListener("cpns:bank-updated", onBankUpdated);
  }, []);

  const startExam = (c: ExamConfig) => {
    setConfig(c);
    setResult(null);
    setPhase("exam");
  };

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
          <Button variant="outline" onClick={() => config && startExam(config)}>
            <RotateCcw className="h-4 w-4" /> Latih lagi
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

  const catCount = bank.filter((q) => q.category === cat && (!subs.length || subs.includes(q.sub))).length;
  const wrongCount = wrongIds?.filter((id) => bank.some((q) => q.id === id)).length ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Latihan</h1>
        <p className="text-sm text-muted-foreground">
          Tanpa timer — kunci dan pembahasan muncul langsung di setiap jawaban.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pilih Kategori</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["TWK", "TIU", "TKP"] as Category[]).map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCat(c);
                  setSubs([]);
                }}
                aria-pressed={cat === c}
                className={`min-h-10 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                  cat === c ? "" : "bg-card"
                }`}
                style={
                  cat === c
                    ? {
                        color: CATEGORY_INFO[c].color,
                        borderColor: CATEGORY_INFO[c].color,
                        backgroundColor: `color-mix(in oklab, ${CATEGORY_INFO[c].color} 12%, transparent)`,
                      }
                    : {}
                }
              >
                {c}
              </button>
            ))}
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Subkategori (kosongkan = semua)
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SUB_BY_CATEGORY[cat].map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={subs.includes(s)}
                    onCheckedChange={(v: boolean) =>
                      setSubs((prev) => (v ? [...prev, s] : prev.filter((x) => x !== s)))
                    }
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <div className="max-w-40">
            <label
              htmlFor="jumlah-soal"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Jumlah soal
            </label>
            <Input
              id="jumlah-soal"
              type="number"
              min={1}
              value={count}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() =>
                startExam({
                  mode: "latihan",
                  title: `Latihan ${cat}${subs.length ? ` (${subs.join(", ")})` : ""}`,
                  counts: { TWK: cat === "TWK" ? count : 0, TIU: cat === "TIU" ? count : 0, TKP: cat === "TKP" ? count : 0 },
                  durationSec: 0,
                  subs: subs.length ? subs : undefined,
                })
              }
              disabled={catCount === 0}
            >
              <Repeat className="h-4 w-4" /> Mulai Latihan {cat} ({catCount} soal tersedia)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Latih Ulang Soal yang Salah</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {wrongCount > 0
              ? `Anda memiliki ${wrongCount} soal yang pernah dijawab salah. Kerjakan ulang untuk menguasainya.`
              : "Belum ada — soal yang dijawab salah terkumpul otomatis di sini."}
          </p>
          <Button
            variant="outline"
            disabled={wrongCount === 0}
            onClick={() =>
              startExam({
                mode: "latihan",
                title: "Latihan Soal yang Salah",
                counts: { TWK: ALL_QUESTIONS_COUNT, TIU: ALL_QUESTIONS_COUNT, TKP: ALL_QUESTIONS_COUNT },
                durationSec: 0,
                onlyIds: wrongIds ?? [],
              })
            }
          >
            <Repeat className="h-4 w-4" /> Latih {wrongCount} Soal Salah
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
