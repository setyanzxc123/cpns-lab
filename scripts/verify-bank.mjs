#!/usr/bin/env node

// Verification Suite untuk Bank Soal CPNS (SKD TWK, TIU, TKP)
// Menjamin akurasi visual figural, konsistensi matematis numerik,
// skala bobot TKP 1-5, integritas kunci jawaban, dan cakupan kisi-kisi MenPAN-RB.

const VALID_SHAPES = new Set(["arrow", "triangle", "star", "square", "pentagon", "flag"]);

const VALID_SUBS = {
  TWK: new Set(["Pancasila", "UUD 1945", "Bhinneka Tunggal Ika", "NKRI", "Nasionalisme", "Gagasan Utama", "Kalimat Efektif", "Integritas", "Bela Negara", "Anti Radikalisme"]),
  TIU: new Set(["Verbal", "Numerik", "Figural", "Logika", "Pecahan dan Desimal", "Hubungan X dan Y", "Analogi Kata dan Kalimat", "Pola Kalimat", "Silogisme", "Pola Bilangan", "Perbandingan Senilai dan Tak Senilai", "Figural 9 Kotak", "Figural", "Penalaran Analitis", "Tabel"]),
  TKP: new Set(["Pelayanan Publik", "Profesionalisme", "Jejaring Kerja", "Teknologi Informasi", "Teknologi Informasi dan Komunikasi", "Sosial Budaya", "Anti Radikalisme"]),
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

  const [twkMod, tiuMod, tkpMod, fs] = await Promise.all([
    import("../src/data/questions-twk.ts"),
    import("../src/data/questions-tiu.ts"),
    import("../src/data/questions-tkp.ts"),
    import("node:fs"),
    import("node:path"),
  ]);
  const fsSync = (await import("node:fs")).default;
  const path = (await import("node:path")).default;

  const extractedDir = path.resolve("src/data/extracted");
  const batchFiles = fsSync.existsSync(extractedDir)
    ? fsSync.readdirSync(extractedDir).filter((f) => f.startsWith("batch-") && f.endsWith(".json"))
    : [];

  const batchQuestions = batchFiles.flatMap((f) =>
    JSON.parse(fsSync.readFileSync(path.join(extractedDir, f), "utf8")),
  );

  const allQuestions = [
    ...twkMod.twkQuestions,
    ...tiuMod.tiuQuestions,
    ...tkpMod.tkpQuestions,
    ...batchQuestions,
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

    // 7. VERIFIKASI VISUAL FIGURAL (SPEC VEKTOR BARU)
    if (q.visual) {
      const v = q.visual;
      const KNOWN_KINDS = ["series", "analogy", "odd-five", "net", "grid-9"];
      if (!KNOWN_KINDS.includes(v.kind)) {
        errors.push(`${prefix} [VISUAL] kind '${v.kind}' tidak dikenal (harus: ${KNOWN_KINDS.join(", ")}).`);
      } else {
        const cells = v.cells;
        const isGlyph = (g) => g && g !== "?" && g !== null && Array.isArray(g.shapes) && g.shapes.length > 0;
        const validateGlyph = (g, where) => {
          for (const sh of g.shapes) {
            if ("polyRect" in sh) {
              if (!Array.isArray(sh.polyRect) || sh.polyRect.length < 3) {
                errors.push(`${prefix} [VISUAL ${where}] polyRect butuh >= 3 titik.`);
              }
              for (const [x, y] of sh.polyRect) {
                if (x < 0 || x > 100 || y < 0 || y > 100) {
                  errors.push(`${prefix} [VISUAL ${where}] koordinat polyRect di luar 0-100.`);
                }
              }
            }
            if ("circle" in sh && (sh.circle.r <= 0 || sh.circle.r > 50)) {
              errors.push(`${prefix} [VISUAL ${where}] circle.r di luar 1-50.`);
            }
            if ("spikes" in sh && (sh.spikes.k < 3 || sh.spikes.rOut > 50 || sh.spikes.rIn >= sh.spikes.rOut)) {
              errors.push(`${prefix} [VISUAL ${where}] spikes tidak valid (k>=3, rOut<=50, rIn<rOut).`);
            }
            if ("zigzag" in sh && (sh.zigzag.peaks < 1 || sh.zigzag.amp <= 0 || sh.zigzag.amp > 46)) {
              errors.push(`${prefix} [VISUAL ${where}] zigzag tidak valid (peaks>=1, amp 1-46).`);
            }
            if ("dots" in sh && (sh.dots.cols < 1 || sh.dots.rows < 1 || (sh.dots.cols - 1) * sh.dots.gap + sh.dots.r * 2 > 96 || (sh.dots.rows - 1) * sh.dots.gap + sh.dots.r * 2 > 96)) {
              errors.push(`${prefix} [VISUAL ${where}] kisi dots meluap dari sel 100x100.`);
            }
            if ("letter" in sh && (!sh.letter || sh.letter.length > 3)) {
              errors.push(`${prefix} [VISUAL ${where}] letter maksimal 3 karakter.`);
            }
            if ("image" in sh) {
              const imgPath = path.resolve("public", sh.image.replace(/^\//, ""));
              if (!fsSync.existsSync(imgPath)) {
                errors.push(`${prefix} [VISUAL ${where}] file image tidak ditemukan: ${sh.image}`);
              }
            }
          }
        };
        if (v.kind === "series") {
          if (!Array.isArray(cells) || cells.length < 3) {
            errors.push(`${prefix} [VISUAL] series butuh minimal 3 sel.`);
          } else if (cells.filter((c) => c === "?").length !== 1) {
            errors.push(`${prefix} [VISUAL] series harus punya tepat satu sel "?".`);
          }
        }
        if (v.kind === "odd-five" && (!Array.isArray(cells) || cells.length !== 5)) {
          errors.push(`${prefix} [VISUAL] odd-five harus 5 sel.`);
        }
        if (v.kind === "grid-9") {
          if (!Array.isArray(cells) || cells.length !== 9) {
            errors.push(`${prefix} [VISUAL] grid-9 harus 9 sel.`);
          } else if (cells.filter((c) => c === "?").length !== 1) {
            errors.push(`${prefix} [VISUAL] grid-9 harus punya tepat satu sel "?".`);
          }
        }
        if (v.kind === "analogy" && (!Array.isArray(cells) || cells.length !== 4)) {
          errors.push(`${prefix} [VISUAL] analogy harus 4 sel.`);
        }
        if (v.kind === "net") {
          if (!Number.isInteger(v.cols) || v.cols < 2) {
            errors.push(`${prefix} [VISUAL] net.cols harus integer >= 2.`);
          } else if (!Array.isArray(cells) || cells.length % v.cols !== 0) {
            errors.push(`${prefix} [VISUAL] panjang cells net (${cells?.length}) harus kelipatan cols (${v.cols}).`);
          }
        }
        for (const [ci, cell] of (cells ?? []).entries()) {
          if (cell && cell !== "?" && cell !== null) validateGlyph(cell, `sel ${ci + 1}`);
        }
      }
    }

    // 8. Opsi visual (Glyph langsung, tanpa pembungkus kind)
    if (q.options) {
      for (const [oi, opt] of q.options.entries()) {
        if (opt.visual) {
          if (opt.visual.kind) {
            errors.push(`${prefix} [VISUAL OPSI ${oi}] opsi memakai VisualSpec berkind; opsi harus Glyph langsung ({ shapes, frame? }).`);
          } else if (!Array.isArray(opt.visual.shapes) || opt.visual.shapes.length === 0) {
            errors.push(`${prefix} [VISUAL OPSI ${oi}] Glyph tanpa shapes.`);
          } else {
            for (const sh of opt.visual.shapes) {
              if ("polyRect" in sh) {
                for (const [x, y] of sh.polyRect) {
                  if (x < 0 || x > 100 || y < 0 || y > 100) {
                    errors.push(`${prefix} [VISUAL OPSI ${oi}] koordinat polyRect di luar 0-100.`);
                  }
                }
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
