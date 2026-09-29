"use client";

// Halaman tes renderer figural — pratinjau 4 pola dari spesifikasi vektor.
// Dipakai untuk verifikasi visual; juga jadi acuan kontrak bagi agent ekstraksi.

import { VisualPanel } from "@/components/figural";
import type { Glyph, VisualSpec } from "@/lib/types";

const tangga: Glyph = {
  shapes: [{ polyRect: [[30, 76], [30, 60], [42, 60], [42, 44], [54, 44], [54, 28], [70, 28], [70, 76]], fill: "solid" }],
  frame: { double: true },
};

const titikBingkai: Glyph = {
  shapes: [{ dots: { cols: 4, rows: 5, gap: 14, r: 3.5 } }],
  frame: { double: true },
};

const duri: Glyph = {
  shapes: [{ spikes: { k: 7, rOut: 30, rIn: 12, rot: 15, fill: "solid" } }],
  frame: { double: true },
};

const mesin: Glyph = {
  shapes: [
    { polyRect: [[26, 50], [60, 50], [60, 70], [26, 70]], fill: "solid" },
    { circle: { r: 14, fill: "outline" } },
    { polyRect: [[54, 24], [74, 24], [74, 42], [54, 42]], fill: "outline" },
  ],
  frame: { double: true },
};

const pola1: VisualSpec = { kind: "series", cells: [tangga, "?", tangga, tangga, tangga] };
const pola2: VisualSpec = {
  kind: "analogy",
  cells: [
    { shapes: [{ circle: { r: 34, fill: "outline" } }] },
    { shapes: [{ circle: { r: 18, fill: "solid" } }] },
    { shapes: [{ polyRect: [[18, 18], [82, 18], [82, 82], [18, 82]], fill: "outline" }] },
    "?",
  ],
};
const pola3: VisualSpec = {
  kind: "odd-five",
  cells: [duri, duri, duri, { shapes: [{ spikes: { k: 7, rOut: 30, rIn: 12, rot: 60, fill: "solid" } }] }, duri],
};
const pola4: VisualSpec = {
  kind: "net",
  cols: 3,
  cells: [
    null,
    { shapes: [{ arrow: { rot: 180 } }] },
    null,
    { shapes: [{ letter: "A" }] },
    { shapes: [{ arrow: { rot: 0 } }] },
    { shapes: [{ letter: "B" }] },
    { shapes: [{ arrow: { rot: 90 } }] },
    null,
    null,
  ],
};
const pola5: VisualSpec = {
  kind: "grid-9",
  cells: [titikBingkai, titikBingkai, titikBingkai, titikBingkai, "?", titikBingkai, mesin, titikBingkai, titikBingkai],
};
const pola6: VisualSpec = {
  kind: "series",
  cells: [
    { shapes: [{ zigzag: { peaks: 5, amp: 20 } }] },
    { shapes: [{ zigzag: { peaks: 4, amp: 20 } }] },
    { shapes: [{ zigzag: { peaks: 3, amp: 20 } }] },
    "?",
  ],
};

const CONTOH: { judul: string; spec: VisualSpec }[] = [
  { judul: "Pola 1 — Deret (rotasi/tangga, tanda ?)", spec: pola1 },
  { judul: "Pola 1 — Deret (zigzag menurun)", spec: pola6 },
  { judul: "Pola 2 — Analogi (nested + fill bertukar)", spec: pola2 },
  { judul: "Pola 3 — Odd-One-Out (orientasi salah di D)", spec: pola3 },
  { judul: "Pola 4 — Jaring-jaring kubus", spec: pola4 },
  { judul: "Varian — Grid 9 kotak (komposit mesin)", spec: pola5 },
];

export default function FiguralTestPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tes Renderer Figural</h1>
        <p className="text-sm text-muted-foreground">
          Pratinjau keempat pola dari spesifikasi vektor — acuan kontrak bagi agent ekstraksi.
        </p>
      </div>
      {CONTOH.map(({ judul, spec }) => (
        <div key={judul} className="space-y-2 rounded-lg border p-4">
          <p className="text-sm font-semibold">{judul}</p>
          <div className="rounded-lg bg-muted/40 p-3">
            <VisualPanel spec={spec} />
          </div>
        </div>
      ))}
    </div>
  );
}
