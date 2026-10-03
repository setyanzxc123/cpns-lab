"use client";

import { useEffect, useState } from "react";
import { localStore } from "@/lib/storage";
import type { ExamConfig, RunningExam } from "@/lib/types";
import { Button } from "@/components/ui/button";

/**
 * Banner "Lanjutkan ujian" untuk halaman konfigurasi. Muncul bila ada sesi
 * ujian tersimpan dengan mode yang sama dan waktunya belum habis.
 */
export function ResumeExamBanner({
  mode,
  ready,
  onResume,
}: {
  mode: "latihan" | "simulasi";
  ready: boolean;
  onResume: (config: ExamConfig) => void;
}) {
  const [pending, setPending] = useState<{ exam: RunningExam; remainingMin: number | null } | null>(
    null,
  );

  useEffect(() => {
    if (!ready) return;
    const saved = localStore.getRunning() as RunningExam | null;
    const valid =
      saved &&
      saved.config?.mode === mode &&
      (!saved.endsAt || saved.endsAt > Date.now());
    setPending(
      valid
        ? {
            exam: saved,
            remainingMin: saved.endsAt
              ? Math.max(1, Math.ceil((saved.endsAt - Date.now()) / 60000))
              : null,
          }
        : null,
    );
  }, [mode, ready]);

  if (!pending) return null;

  const { exam: pendingExam, remainingMin } = pending;
  const answered = Object.values(pendingExam.choices ?? {}).filter((c) => c !== null).length;
  const total = pendingExam.questionIds.length;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-300/60 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/40">
      <div className="min-w-0">
        <p className="text-sm font-semibold">Ujian tertunda: {pendingExam.config.title}</p>
        <p className="text-xs text-muted-foreground">
          {answered}/{total} soal terjawab
          {remainingMin !== null && ` · sisa ±${remainingMin} menit (timer tetap berjalan)`}
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onResume(pendingExam.config)}>
          Lanjutkan
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setPending(null)}>
          Abaikan
        </Button>
      </div>
    </div>
  );
}
