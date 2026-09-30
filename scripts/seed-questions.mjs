#!/usr/bin/env node
// Seed bank soal ke tabel public.questions di Supabase.
// Sumber: src/data/extracted/batch-*.json (gitignored — hanya ada di lokal).
// Pemakaian: node --env-file=.env.local scripts/seed-questions.mjs
// Idempoten (upsert by id) — aman dijalankan ulang tiap ada batch baru/koreksi.

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE_KEY) {
  console.error(
    "ENV kurang. Butuh NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local\n" +
      "Jalankan: node --env-file=.env.local scripts/seed-questions.mjs",
  );
  process.exit(2);
}

const sb = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } });

const extractedDir = path.resolve("src/data/extracted");
const files = fs
  .readdirSync(extractedDir)
  .filter((f) => f.startsWith("batch-") && f.endsWith(".json"))
  .sort();

if (files.length === 0) {
  console.error(`Tidak ada batch di ${extractedDir}`);
  process.exit(2);
}

const CHUNK = 250;
let seeded = 0;
const byCategory = { TWK: 0, TIU: 0, TKP: 0 };

for (const f of files) {
  const arr = JSON.parse(fs.readFileSync(path.join(extractedDir, f), "utf8"));
  const rows = arr.map((q) => ({
    id: q.id,
    category: q.category,
    sub: q.sub,
    payload: q,
    updated_at: new Date().toISOString(),
  }));
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await sb
      .from("questions")
      .upsert(chunk, { onConflict: "id" });
    if (error) {
      console.error(`Gagal seed ${f} (chunk ${i / CHUNK + 1}):`, error.message);
      process.exit(1);
    }
  }
  seeded += rows.length;
  for (const q of arr) byCategory[q.category] = (byCategory[q.category] ?? 0) + 1;
  console.log(`  ${f}: ${rows.length} soal ter-seed`);
}

// Verifikasi: hitung ulang dari server
const { count, error: countErr } = await sb
  .from("questions")
  .select("id", { count: "exact", head: true });
if (countErr) {
  console.error("Verifikasi gagal:", countErr.message);
  process.exit(1);
}

console.log(
  `\nSEED SELESAI: ${seeded} soal dari ${files.length} batch ` +
    `(TWK ${byCategory.TWK} / TIU ${byCategory.TIU} / TKP ${byCategory.TKP}).`,
);
console.log(
  count === seeded
    ? `Verifikasi server: ${count}/${seeded} row — COCOK.`
    : `⚠️ Verifikasi server: ${count} row ≠ ${seeded} yang dikirim — periksa!`,
);
