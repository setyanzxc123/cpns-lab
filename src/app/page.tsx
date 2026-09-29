"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRepo } from "@/lib/repository";
import { loadBank, CATEGORY_INFO } from "@/data/bank";
import type { SessionResult } from "@/lib/types";
import { Timer, BookOpen, BarChart3, Library, Bot, Database, TrendingUp } from "lucide-react";

export default function HomePage() {
  const [results, setResults] = useState<SessionResult[]>([]);
  const [bankCount, setBankCount] = useState(0);
  const [aiOn, setAiOn] = useState(false);
  const [dbOn, setDbOn] = useState(false);

  useEffect(() => {
    (async () => {
      const repo = await getRepo();
      setResults(await repo.listResults());
      setBankCount((await loadBank()).length);
      setAiOn(Boolean(process.env.NEXT_PUBLIC_HAS_GEMINI));
      setDbOn(Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL));
    })();
  }, []);

  const avg = results.length
    ? Math.round(
        (results.reduce((a, r) => a + r.totalScore / Math.max(1, r.maxScore), 0) /
          results.length) *
          100,
      )
    : null;
  const best = results.reduce((a, r) => Math.max(a, r.totalScore), 0);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 px-6 py-10 text-white">
        <h1 className="text-3xl font-bold sm:text-4xl">Siap tempur tes CPNS?</h1>
        <p className="mt-2 max-w-xl text-blue-100">
          Latihan TWK, TIU, dan TKP dengan pembahasan lengkap, simulasi ujian berwaktu
          ala CAT BKN, analisis kelemahan, dan tutor AI yang membantu belajar lebih fokus.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/simulasi"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-white text-blue-800 hover:bg-blue-50"
            )}
          >
            <Timer className="h-5 w-5" /> Mulai Simulasi
          </Link>
          <Link
            href="/latihan"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
            )}
          >
            <BookOpen className="h-5 w-5" /> Latihan Soal
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {(["TWK", "TIU", "TKP"] as const).map((c) => (
          <Card key={c}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base" style={{ color: CATEGORY_INFO[c].color }}>
                {c} — {CATEGORY_INFO[c].name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{CATEGORY_INFO[c].desc}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-100 p-2.5 text-blue-700">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{results.length}</p>
              <p className="text-xs text-muted-foreground">Total pengerjaan</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-green-100 p-2.5 text-green-700">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avg !== null ? `${avg}%` : "—"}</p>
              <p className="text-xs text-muted-foreground">
                Rata-rata capaian{results.length ? ` · terbaik ${best}` : ""}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-purple-100 p-2.5 text-purple-700">
              <Library className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{bankCount}</p>
              <p className="text-xs text-muted-foreground">Soal tersedia</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <FeatureCard
          href="/statistik"
          icon={<BarChart3 className="h-5 w-5" />}
          title="Statistik & Analisis"
          desc="Lihat kekuatan/kelemahan per subkategori dan latih ulang soal yang Anda salah."
        />
        <FeatureCard
          href="/ai"
          icon={<Bot className="h-5 w-5" />}
          title="Tutor AI (Gemini)"
          desc="Chat tutor, analisis skor, dan rencana belajar personal."
          badge={aiOn ? <Badge className="bg-green-600">Aktif</Badge> : <Badge variant="outline">Butuh API key</Badge>}
        />
        <FeatureCard
          href="/bank"
          icon={<Library className="h-5 w-5" />}
          title="Bank Soal"
          desc={`${bankCount} soal siap pakai. Tambahkan soal sendiri atau impor file JSON.`}
        />
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <div className="rounded-lg bg-amber-100 p-2.5 text-amber-700">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">
                Penyimpanan {dbOn ? "Supabase" : "Perangkat"}
                {dbOn && <Badge className="ml-2 bg-green-600">Terhubung</Badge>}
              </p>
              <p className="text-sm text-muted-foreground">
                {dbOn
                  ? "Progres tersinkron antar perangkat lewat akun Supabase Anda."
                  : "Progres disimpan di perangkat ini. Pasang Supabase untuk sinkron antar perangkat."}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function FeatureCard({
  href,
  icon,
  title,
  desc,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  badge?: React.ReactNode;
}) {
  return (
    <Link href={href} className="group">
      <Card className="h-full transition-colors group-hover:border-blue-300">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="rounded-lg bg-muted p-2.5 text-blue-700">{icon}</div>
          <div>
            <p className="font-medium">
              {title} {badge}
            </p>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
