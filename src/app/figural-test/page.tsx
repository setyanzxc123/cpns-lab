"use client";

// Halaman tes renderer figural standar tes IQ internasional & CAT BKN.
// Menampilkan pratinjau pola geometris Raven's Progressive Matrices, Cattell, dan WAIS.

import { GlyphPanelOption, VisualPanel } from "@/components/figural";
import { FiguralShape, createDualOption } from "@/lib/figural-engine";
import type { Glyph, VisualSpec } from "@/lib/types";

// 1. Roda Juring 8 Bagian Berputar (Raven's Progressive Matrices standard)
const wheelA: Glyph = {
  shapes: FiguralShape.pieWheel([
    { startAngle: 0, endAngle: 45, fill: "solid" },
    { startAngle: 45, endAngle: 90, fill: "outline" },
    { startAngle: 90, endAngle: 135, fill: "solid" },
    { startAngle: 135, endAngle: 180, fill: "hatch" },
    { startAngle: 180, endAngle: 225, fill: "solid" },
    { startAngle: 225, endAngle: 270, fill: "outline" },
    { startAngle: 270, endAngle: 315, fill: "solid" },
    { startAngle: 315, endAngle: 360, fill: "hatch" },
  ]),
};

const wheelB: Glyph = {
  shapes: FiguralShape.pieWheel([
    { startAngle: 45, endAngle: 90, fill: "solid" },
    { startAngle: 90, endAngle: 135, fill: "outline" },
    { startAngle: 135, endAngle: 180, fill: "solid" },
    { startAngle: 180, endAngle: 225, fill: "hatch" },
    { startAngle: 225, endAngle: 270, fill: "solid" },
    { startAngle: 270, endAngle: 315, fill: "outline" },
    { startAngle: 315, endAngle: 360, fill: "solid" },
    { startAngle: 0, endAngle: 45, fill: "hatch" },
  ]),
};

const wheelC: Glyph = {
  shapes: FiguralShape.pieWheel([
    { startAngle: 90, endAngle: 135, fill: "solid" },
    { startAngle: 135, endAngle: 180, fill: "outline" },
    { startAngle: 180, endAngle: 225, fill: "solid" },
    { startAngle: 225, endAngle: 270, fill: "hatch" },
    { startAngle: 270, endAngle: 315, fill: "solid" },
    { startAngle: 315, endAngle: 360, fill: "outline" },
    { startAngle: 0, endAngle: 45, fill: "solid" },
    { startAngle: 45, endAngle: 90, fill: "hatch" },
  ]),
};

// 2. Poligon Beraturan & Titik Sudut Presisi
const hexWithCornerDots: Glyph = {
  shapes: [
    FiguralShape.hexagon(34, { fill: "cross-hatch" }),
    FiguralShape.circle(12, { fill: "white" }),
    FiguralShape.cornerDots(3, 14),
  ],
  frame: { double: true },
};

// 3. Path Kurva Vektor Bebas (Contoh: Hati Analogi)
const heartGlyph: Glyph = {
  shapes: [
    FiguralShape.path(
      "M 50 78 C 30 60, 20 44, 20 32 C 20 18, 32 14, 42 22 C 46 25, 50 30, 50 30 C 50 30, 54 25, 58 22 C 68 14, 80 18, 80 32 C 80 44, 70 60, 50 78 Z",
      { fill: "solid" }
    ),
  ],
};

// 4. Opsi Jawaban Pasangan Bertingkat (Dual-V untuk 2 tanda tanya)
const dualOptionSample = createDualOption(
  {
    shapes: [FiguralShape.square(18, { fill: "solid" })],
  },
  {
    shapes: [FiguralShape.triangle(18, { fill: "hatch" })],
  }
);

// 5. Grid 9 Kotak dengan 2 Missing Cells ('?')
const grid9WithTwoMissing: VisualSpec = {
  kind: "grid-9",
  cells: [
    hexWithCornerDots,
    hexWithCornerDots,
    hexWithCornerDots,
    hexWithCornerDots,
    "?", // missing cell 1 (tengah)
    hexWithCornerDots,
    hexWithCornerDots,
    hexWithCornerDots,
    "?", // missing cell 2 (kanan bawah)
  ],
};

const polaWheelSeries: VisualSpec = {
  kind: "series",
  cells: [wheelA, wheelB, wheelC, "?"],
};

const polaAnalogy: VisualSpec = {
  kind: "analogy",
  cells: [
    { shapes: [FiguralShape.circle(32, { fill: "outline" })] },
    { shapes: [FiguralShape.circle(32, { fill: "solid" })] },
    { shapes: [heartGlyph.shapes[0]] },
    "?",
  ],
};

const CONTOH: { judul: string; deskripsi: string; spec: VisualSpec }[] = [
  {
    judul: "1. Raven's Progressive Matrix — Roda Juring 8 Bagian Berputar (Rotasi 45°)",
    deskripsi: "Menggunakan primitif sector & pieWheel dengan arsiran diagonal dan solid.",
    spec: polaWheelSeries,
  },
  {
    judul: "2. Matriks 3x3 dengan Dua Tanda Tanya (Pola Asli Buku Al Faiz)",
    deskripsi: "Mendukung dua sel hilang ('?') di tengah dan kanan bawah tanpa error.",
    spec: grid9WithTwoMissing,
  },
  {
    judul: "3. Analogi Visual dengan Kurva Bézier Bebas (Bentuk Hati)",
    deskripsi: "Menggunakan primitif path SVG presisi untuk bentuk organik non-poligon.",
    spec: polaAnalogy,
  },
];

export default function FiguralTestPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Suite Modul Figural Standar Internasional</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Implementasi geometri presisi tinggi: Raven&apos;s Progressive Matrices, Cattell Culture Fair, dan WAIS Matrix Reasoning.
        </p>
      </div>

      {CONTOH.map(({ judul, deskripsi, spec }) => (
        <div key={judul} className="space-y-3 rounded-xl border bg-card p-5 shadow-sm">
          <div>
            <p className="font-semibold text-foreground">{judul}</p>
            <p className="text-xs text-muted-foreground">{deskripsi}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-4">
            <VisualPanel spec={spec} />
          </div>
        </div>
      ))}

      {/* Pratinjau Opsi Jawaban Bertingkat (Dual-V) */}
      <div className="space-y-3 rounded-xl border bg-card p-5 shadow-sm">
        <div>
          <p className="font-semibold text-foreground">
            4. Pratinjau Opsi Jawaban Bertingkat (Dual-Cell Stacked Option)
          </p>
          <p className="text-xs text-muted-foreground">
            Merender sepasang kotak atas-bawah secara proporsional untuk soal yang memiliki dua tanda tanya.
          </p>
        </div>
        <div className="flex items-center gap-4 rounded-lg bg-muted/40 p-4">
          <span className="text-sm font-bold">Opsi A:</span>
          <GlyphPanelOption glyph={dualOptionSample} />
        </div>
      </div>
    </div>
  );
}
