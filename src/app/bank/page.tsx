"use client";

import { useEffect, useState } from "react";
import { loadBank, forceRefreshBank } from "@/data/bank";
import { getRepo } from "@/lib/repository";
import type { Question } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Download, Upload, Trash2, Plus, RotateCw } from "lucide-react";
import { toast } from "sonner";

export default function BankPage() {
  const [bank, setBank] = useState<Question[]>([]);
  const [custom, setCustom] = useState<Question[]>([]);
  const [importText, setImportText] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    (async () => {
      setBank(await loadBank());
      const repo = await getRepo();
      setCustom(await repo.listCustomQuestions());
    })();
    // Bank di-refresh dari server di latar — ikuti pembaruannya.
    const onBankUpdated = () => {
      void loadBank().then(setBank);
    };
    window.addEventListener("cpns:bank-updated", onBankUpdated);
    return () => window.removeEventListener("cpns:bank-updated", onBankUpdated);
  }, []);

  async function exportBank() {
    const blob = new Blob([JSON.stringify(bank, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bank-soal-cpns.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importBank() {
    try {
      const parsed = JSON.parse(importText) as Question[];
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const valid = arr.filter(
        (q) =>
          q.id &&
          q.category &&
          q.text &&
          Array.isArray(q.options) &&
          q.options.length >= 2 &&
          (q.answer !== undefined || Array.isArray(q.points)),
      );
      if (valid.length === 0) throw new Error("tidak ada soal valid");
      const repo = await getRepo();
      const merged = [...custom.filter((c) => !valid.some((v) => v.id === c.id)), ...valid];
      await repo.saveCustomQuestions(merged);
      setCustom(merged);
      setBank(await loadBank());
      setImportText("");
      toast.success(`${valid.length} soal berhasil diimpor.`);
    } catch (e) {
      toast.error(`Impor gagal: ${e instanceof Error ? e.message : "format tidak sesuai"}`);
    }
  }

  async function deleteCustom(id: string) {
    const repo = await getRepo();
    const merged = custom.filter((c) => c.id !== id);
    await repo.saveCustomQuestions(merged);
    setCustom(merged);
    setBank(await loadBank());
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const refreshed = await forceRefreshBank();
      setBank(refreshed);
      toast.success("Bank soal berhasil diperbarui dari server!");
    } catch {
      toast.error("Gagal memperbarui bank soal dari server.");
    } finally {
      setRefreshing(false);
    }
  }

  const SAMPLE = JSON.stringify(
    {
      id: "CUSTOM-001",
      category: "TWK",
      sub: "Pancasila",
      text: "Contoh teks soal?",
      options: [{ text: "Jawaban benar" }, { text: "Jawaban salah" }, { text: "Salah lagi" }, { text: "Salah lagi 2" }],
      answer: 0,
      explanation: "Pembahasan singkat.",
    },
    null,
    2,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bank Soal</h1>
          {bank.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              {bank.length} soal tersedia ({custom.length} kustom)
            </p>
          ) : (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Bank soal diambil dari server — butuh koneksi internet pada kunjungan
              pertama. Saat ini bank masih kosong atau perangkat sedang offline;
              soal kustom lokal tetap dapat dipakai.
            </p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Impor / Ekspor & Sinkronisasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Tempel JSON soal lalu klik Impor — TWK/TIU butuh{" "}
            <code className="rounded bg-muted px-1">answer</code> (mulai 0), TKP butuh{" "}
            <code className="rounded bg-muted px-1">points</code> (1–5). Klik “Isi contoh format” untuk strukturnya.
          </p>
          <Textarea
            rows={8}
            placeholder={SAMPLE}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className="font-mono text-xs"
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={importBank} disabled={!importText.trim()}>
              <Upload className="h-4 w-4" /> Impor soal
            </Button>
            <Button variant="outline" onClick={exportBank}>
              <Download className="h-4 w-4" /> Ekspor semua ({bank.length})
            </Button>
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RotateCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Menyegarkan..." : "Segarkan dari Server"}
            </Button>
            <Button variant="ghost" onClick={() => setImportText(SAMPLE)}>
              <Plus className="h-4 w-4" /> Isi contoh format
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Daftar Soal Kustom</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {custom.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada soal kustom yang diimpor.</p>
          )}
          {custom.map((q) => (
            <div key={q.id} className="flex items-start justify-between gap-2 rounded-lg border p-3 text-sm">
              <div>
                <div className="mb-1 flex gap-2">
                  <Badge variant="outline">{q.category}</Badge>
                  <Badge variant="secondary">{q.sub}</Badge>
                  <span className="text-xs text-muted-foreground">{q.id}</span>
                </div>
                <p>{q.text}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Hapus soal kustom ${q.id}`}
                onClick={() => deleteCustom(q.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" aria-hidden />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pratinjau Bank</CardTitle>
        </CardHeader>
        <CardContent>
          <details>
            <summary className="cursor-pointer select-none text-sm font-medium text-muted-foreground">
              Lihat semua soal ({bank.length})
            </summary>
            <div className="mt-3 max-h-96 space-y-1.5 overflow-y-auto">
              {bank.map((q) => (
                <div key={q.id} className="flex items-center gap-2 rounded border px-2.5 py-1.5 text-xs">
                  <Badge variant="outline" className="shrink-0">
                    {q.category}
                  </Badge>
                  <span className="shrink-0 text-muted-foreground">{q.sub}</span>
                  <span className="truncate text-muted-foreground">{q.text}</span>
                </div>
              ))}
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}
