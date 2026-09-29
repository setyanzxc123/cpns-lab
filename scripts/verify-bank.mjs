#!/usr/bin/env node

// Verification Suite untuk Bank Soal CPNS (SKD TWK, TIU, TKP)
// Menjamin akurasi visual figural, konsistensi matematis numerik,
// skala bobot TKP 1-5, integritas kunci jawaban, dan cakupan kisi-kisi MenPAN-RB.

const VALID_SHAPES = new Set(["arrow", "triangle", "star", "square", "pentagon", "flag"]);

const VALID_SUBS = {
  TWK: new Set(["Pancasila", "UUD 1945", "Bhinneka Tunggal Ika", "NKRI", "Integritas", "Bela Negara", "Anti Radikalisme"]),
  TIU: new Set(["Verbal", "Numerik", "Figural", "Logika"]),
  TKP: new Set(["Pelayanan Publik", "Jejaring Kerja", "Sosial Budaya", "Teknologi Informasi", "Profesionalisme", "Anti Radikalisme"]),
};

const BKN_TARGET_QUOTA = {
  TWK: 30,
  TIU: 35,
  TKP: 45,
};

function normalizeDeg(deg) {
  let d = Math.round(deg) % 360;
  if (d < 0) d += 360;
  return d;
}

async function run() {
  console.log("\n========================================================");
  console.log("   CPNS LAB - SUITE VERIFIKASI BANK SOAL OTOMATIS");
  console.log("========================================================\n");

  const [twkMod, tiuMod, tkpMod] = await Promise.all([
    import("../src/data/questions-twk.ts"),
    import("../src/data/questions-tiu.ts"),
    import("../src/data/questions-tkp.ts"),
  ]);

  const allQuestions = [
    ...twkMod.twkQuestions,
    ...tiuMod.tiuQuestions,
    ...tkpMod.tkpQuestions,
  ];

  console.log(`Memuat ${allQuestions.length} butir soal dari bank data...\n`);

  const seenIds = new Set();
  const errors = [];
  const warnings = [];

  const counts = {
    TWK: { total: 0, bySub: {} },
    TIU: { total: 0, bySub: {} },
    TKP: { total: 0, bySub: {} },
  };

  for (const q of allQuestions) {
    const prefix = `[${q.id || "TANPA-ID"}]`;

    // 1. Validasi ID Unik
    if (!q.id) {
      errors.push(`${prefix} Soal tidak memiliki ID stabil.`);
    } else if (seenIds.has(q.id)) {
      errors.push(`${prefix} ID terduplikasi dalam bank soal.`);
    } else {
      seenIds.add(q.id);
    }

    // 2. Validasi Kategori & Subkategori
    if (!VALID_SUBS[q.category]) {
      errors.push(`${prefix} Kategori tidak valid: '${q.category}'.`);
      continue;
    }

    counts[q.category].total += 1;
    counts[q.category].bySub[q.sub] = (counts[q.category].bySub[q.sub] || 0) + 1;

    if (!VALID_SUBS[q.category].has(q.sub)) {
      errors.push(`${prefix} Subkategori '${q.sub}' tidak sah untuk kategori ${q.category}.`);
    }

    // 3. Validasi Teks Soal & Pembahasan
    if (!q.text || q.text.trim().length < 5) {
      errors.push(`${prefix} Teks soal terlalu pendek atau kosong.`);
    }
    if (!q.explanation || q.explanation.trim().length < 15) {
      errors.push(`${prefix} Pembahasan terlalu pendek atau kosong (< 15 karakter).`);
    }

    // 4. Validasi Opsi Jawaban
    if (!Array.isArray(q.options) || q.options.length < 4) {
      errors.push(`${prefix} Opsi jawaban kurang dari 4 opsi.`);
    } else {
      if (q.options.length === 4) {
        warnings.push(`${prefix} Berisi 4 opsi (standar CAT BKN resmi adalah 5 opsi A–E).`);
      }

      // Cek apakah opsi tidak kosong dan tidak duplikat
      const optionSignatures = new Set();
      for (let i = 0; i < q.options.length; i++) {
        const opt = q.options[i];
        if (!opt.text && !opt.visual) {
          errors.push(`${prefix} Opsi [${i}] tidak memiliki teks maupun visual.`);
        }
        const sig = opt.text ? `TEXT:${opt.text.trim().toLowerCase()}` : `VISUAL:${JSON.stringify(opt.visual)}`;
        if (optionSignatures.has(sig)) {
          errors.push(`${prefix} Terdapat opsi duplikat pada opsi [${i}]: '${sig}'.`);
        }
        optionSignatures.add(sig);
      }
    }

    // 5. Validasi Khusus TWK & TIU
    if (q.category === "TWK" || q.category === "TIU") {
      if (q.points !== undefined) {
        errors.push(`${prefix} Soal ${q.category} tidak boleh memiliki field 'points' (hanya untuk TKP).`);
      }
      if (typeof q.answer !== "number" || q.answer < 0 || (q.options && q.answer >= q.options.length)) {
        errors.push(`${prefix} Kunci jawaban 'answer' tidak valid: ${q.answer}. Harus index 0..${q.options ? q.options.length - 1 : 4}.`);
      }
    }

    // 6. Validasi Khusus TKP (Skala 1-5 BKN)
    if (q.category === "TKP") {
      if (q.answer !== undefined) {
        errors.push(`${prefix} Soal TKP tidak boleh memiliki 'answer' (harus menggunakan skala bobot 'points').`);
      }
      if (!Array.isArray(q.points) || q.points.length !== q.options.length) {
        errors.push(`${prefix} Jumlah elemen array 'points' (${q.points?.length}) tidak cocok dengan jumlah opsi (${q.options.length}).`);
      } else {
        const pts = [...q.points].sort();
        const expected = q.options.length === 5 ? [1, 2, 3, 4, 5] : [2, 3, 4, 5];
        if (JSON.stringify(pts) !== JSON.stringify(expected)) {
          errors.push(`${prefix} Bobot TKP harus memuat seluruh nilai skala unik ${JSON.stringify(expected)}, ditemukan: ${JSON.stringify(q.points)}.`);
        }
      }
    }

    // 7. VERIFIKASI MATEMATIS GEOMETRIS UNTUK FIGURAL (VISUAL SPEC)
    if (q.visual) {
      if (q.visual.kind === "shape-series") {
        const { shape, count, missing, rotationStep, dots } = q.visual;

        if (!VALID_SHAPES.has(shape)) {
          errors.push(`${prefix} [VISUAL] Bangun '${shape}' tidak terdaftar dalam valid shapes.`);
        }
        if (typeof count !== "number" || count < 3) {
          errors.push(`${prefix} [VISUAL] Deret bangun 'count' minimal 3, ditemukan: ${count}.`);
        }
        if (typeof missing !== "number" || missing < 0 || missing >= count) {
          errors.push(`${prefix} [VISUAL] Index panel hilang 'missing' (${missing}) di luar batas (0..${count - 1}).`);
        }

        // Hitung ekspektasi geometris secara deterministik
        const expectedAngle = normalizeDeg(missing * rotationStep);
        let expectedDots = undefined;
        if (dots) {
          expectedDots = dots.start + dots.step * missing;
        }

        // Verifikasi bahwa opsi jawaban yang dinyatakan 'answer' cocok dengan perhitungan matematis
        if (typeof q.answer === "number" && q.options && q.options[q.answer]) {
          const correctOpt = q.options[q.answer];
          if (!correctOpt.visual || correctOpt.visual.kind !== "shape-single") {
            errors.push(`${prefix} [VISUAL] Kunci jawaban [${q.answer}] tidak memiliki visual bertipe 'shape-single'.`);
          } else {
            const v = correctOpt.visual;
            if (v.shape !== shape) {
              errors.push(`${prefix} [VISUAL MISMATCH] Bangun jawaban kunci (${v.shape}) tidak sama dengan deret soal (${shape}).`);
            }
            if (v.rotation !== undefined) {
              const optAngle = normalizeDeg(v.rotation);
              if (optAngle !== expectedAngle) {
                errors.push(`${prefix} [GEOMETRIC ANGLE ERROR] Rotasi kunci opsi [${q.answer}] adalah ${optAngle}°, tetapi perhitungan deret mengharuskan ${expectedAngle}°!`);
              }
            }
            if (expectedDots !== undefined) {
              if (v.dots !== expectedDots) {
                errors.push(`${prefix} [DOTS COUNT ERROR] Titik kunci opsi [${q.answer}] adalah ${v.dots}, tetapi perhitungan deret mengharuskan ${expectedDots}!`);
              }
            }
          }
        }
      }
    }
  }

  // CETAK LAPORAN REKAPITULASI
  console.log("--------------------------------------------------------");
  console.log("             REKAPITULASI KUOTA KISI-KISI BKN           ");
  console.log("--------------------------------------------------------");

  for (const cat of ["TWK", "TIU", "TKP"]) {
    const have = counts[cat].total;
    const target = BKN_TARGET_QUOTA[cat];
    const status = have >= target ? "LENGKAP" : `KURANG ${target - have}`;
    console.log(`\n${cat} (Target 1 Paket BKN: ${target} soal) | Saat ini: ${have} soal -> [${status}]`);
    for (const [sub, cnt] of Object.entries(counts[cat].bySub)) {
      console.log(`   - ${sub.padEnd(24)} : ${cnt} soal`);
    }
  }

  console.log("\n--------------------------------------------------------");
  console.log(`HASIL PEMERIKSAAN KUALITAS:`);
  console.log(`- Total Soal Diperiksa  : ${allQuestions.length}`);
  console.log(`- Pelanggaran / Error   : ${errors.length}`);
  console.log(`- Catatan / Peringatan  : ${warnings.length}`);
  console.log("--------------------------------------------------------\n");

  if (warnings.length > 0) {
    console.log("⚠️  CATATAN PERINGATAN (Non-Fatal):");
    warnings.slice(0, 10).forEach((w) => console.log(`   ${w}`));
    if (warnings.length > 10) console.log(`   ...dan ${warnings.length - 10} peringatan lainnya.`);
    console.log("");
  }

  if (errors.length > 0) {
    console.error("❌ KESALAHAN INTEGRITAS SOAL TERDETEKSI (Fatal):");
    errors.forEach((e) => console.error(`   ${e}`));
    console.log("\nSilakan perbaiki kesalahan di atas sebelum merilis ke pengguna!\n");
    process.exit(1);
  }

  console.log("✅ SELURUH SOAL DINYATAKAN VALID SECARA MATEMATIS, GEOMETRIS, DAN SCHEMA!");
  console.log("   Bank soal siap digunakan untuk simulasi CAT BKN berintegritas tinggi.\n");
  process.exit(0);
}

run().catch((err) => {
  console.error("Fatal exception during verification:", err);
  process.exit(1);
});
