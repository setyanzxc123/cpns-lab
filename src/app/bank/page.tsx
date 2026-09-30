"use client";

import { useEffect, useState } from "react";
import { loadBank } from "@/data/bank";
import { getRepo } from "@/lib/repository";
import type { Question } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Download, Upload, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export default function BankPage() {
  const [bank, setBank] = useState<Question[]>([]);
  const [custom, setCustom] = useState<Question[]>([]);
  const [importText, setImportText] = useState("");

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
      <div>
        <h1 className="text-2xl font-bold">Bank Soal</h1>
        {bank.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {bank.length} soal tersedia ({custom.length} kustom).
          </p>
        ) : (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Bank soal diambil dari server — butuh koneksi internet pada kunjungan
            pertama. Saat ini bank masih kosong atau perangkat sedang offline;
            soal kustom lokal tetap dapat dipakai.
          </p>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Impor / Ekspor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Tempelkan JSON soal di bawah lalu klik Impor. Untuk TWK/TIU isi{" "}
            <code className="rounded bg-muted px-1">answer</code> (index jawaban mulai 0); untuk TKP isi{" "}
            <code className="rounded bg-muted px-1">points</code> (nilai 1–5 per opsi). Bisa juga unggah file{" "}
            <code className="rounded bg-muted px-1">.json</code> dari konversi Word/Excel.
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
              <Button variant="ghost" size="icon" onClick={() => deleteCustom(q.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Semua Soal (pratinjau)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 space-y-1.5 overflow-y-auto">
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
        </CardContent>
      </Card>
    </div>
  );
}
