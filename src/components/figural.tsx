"use client";

// Renderer visual figural — digambar dari spesifikasi vektor (Glyph) tanpa
// file gambar maupun library eksternal. Ruang koordinat satu sel: 100x100.

import type { Fill, Glyph, Shape, VisualSpec } from "@/lib/types";

const STROKE = 4;

// Arsiran diagonal; id sama di seluruh dokumen aman karena pattern identik.
function HatchDefs() {
  return (
    <defs>
      <pattern id="hatch-fill" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="8" stroke="currentColor" strokeWidth="2.5" />
      </pattern>
    </defs>
  );
}

function fillProps(fill: Fill) {
  if (fill === "solid") return { fill: "currentColor" };
  if (fill === "hatch") return { fill: "url(#hatch-fill)", stroke: "currentColor", strokeWidth: 2 };
  return { fill: "none", stroke: "currentColor", strokeWidth: STROKE };
}

function spikePoints(k: number, rOut: number, rIn: number, rot: number): string {
  const pts: string[] = [];
  const cx = 50, cy = 50;
  for (let i = 0; i < k; i++) {
    const aOut = ((rot + (360 / k) * i) * Math.PI) / 180;
    const aIn = ((rot + (360 / k) * (i + 0.5)) * Math.PI) / 180;
    pts.push(`${(cx + rOut * Math.sin(aOut)).toFixed(2)},${(cy - rOut * Math.cos(aOut)).toFixed(2)}`);
    pts.push(`${(cx + rIn * Math.sin(aIn)).toFixed(2)},${(cy - rIn * Math.cos(aIn)).toFixed(2)}`);
  }
  return pts.join(" ");
}

function zigzagPath(peaks: number, amp: number): string {
  const y0 = 50 - amp, y1 = 50 + amp;
  const step = 84 / (peaks * 2);
  let d = `M 8 ${y1}`;
  for (let i = 0; i < peaks * 2; i++) {
    d += ` L ${8 + step * (i + 1)} ${i % 2 === 0 ? y0 : y1}`;
  }
  return d;
}

function ShapeView({ shape }: { shape: Shape }) {
  if ("polyRect" in shape) {
    return <polygon points={shape.polyRect.map((p) => p.join(",")).join(" ")} {...fillProps(shape.fill)} />;
  }
  if ("circle" in shape) {
    return <circle cx="50" cy="50" r={shape.circle.r} {...fillProps(shape.circle.fill)} />;
  }
  if ("spikes" in shape) {
    const s = shape.spikes;
    return (
      <polygon
        points={spikePoints(s.k, s.rOut, s.rIn, s.rot ?? 0)}
        {...fillProps(s.fill)}
        strokeLinejoin="round"
      />
    );
  }
  if ("zigzag" in shape) {
    return <path d={zigzagPath(shape.zigzag.peaks, shape.zigzag.amp)} fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />;
  }
  if ("dots" in shape) {
    const { cols, rows, gap, r } = shape.dots;
    const cells: React.ReactNode[] = [];
    const w = (cols - 1) * gap, h = (rows - 1) * gap;
    for (let c = 0; c < cols; c++) {
      for (let rr = 0; rr < rows; rr++) {
        cells.push(
          <circle key={`${c}-${rr}`} cx={Number((50 - w / 2 + c * gap).toFixed(2))} cy={Number((50 - h / 2 + rr * gap).toFixed(2))} r={r} fill="currentColor" />,
        );
      }
    }
    return <g>{cells}</g>;
  }
  if ("arrow" in shape) {
    return (
      <g transform={`rotate(${shape.arrow.rot ?? 0} 50 50)`}>
        <polygon points="50,12 74,46 58,46 58,84 42,84 42,46 26,46" fill="currentColor" />
      </g>
    );
  }
  if ("letter" in shape) {
    return (
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fontSize="46" fontWeight="700" fill="currentColor">
        {shape.letter}
      </text>
    );
  }
  return (
    <image href={shape.image} x="4" y="4" width="92" height="92" preserveAspectRatio="xMidYMid meet" />
  );
}

/** Satu sel: primitif + bingkai (double = bingkai ganda). */
export function GlyphView({ glyph }: { glyph: Glyph }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" role="img">
      <HatchDefs />
      <rect x="4" y="4" width="92" height="92" fill="none" stroke="currentColor" strokeWidth={STROKE} />
      {glyph.frame?.double && (
        <rect x="11" y="11" width="78" height="78" fill="none" stroke="currentColor" strokeWidth={2.5} />
      )}
      {glyph.shapes.map((s, i) => (
        <ShapeView key={i} shape={s} />
      ))}
    </svg>
  );
}

function QuestionMarkPanel({ className }: { className: string }) {
  return (
    <div className={`${className} flex items-center justify-center rounded-lg border-2 border-dashed bg-muted text-2xl font-bold text-muted-foreground`}>
      ?
    </div>
  );
}

const SIZE: Record<string, string> = {
  sm: "h-14 w-14",
  md: "h-20 w-20",
  lg: "h-24 w-24",
};

function GlyphPanel({ glyph, className }: { glyph: Glyph; className: string }) {
  return (
    <div className={`${className} shrink-0 rounded-lg border bg-card p-1`}>
      <GlyphView glyph={glyph} />
    </div>
  );
}

function Cell({
  cell,
  className,
}: {
  cell: Glyph | "?" | null;
  className: string;
}) {
  if (cell === null) {
    return <div className={`${className} shrink-0 rounded-lg border border-dashed bg-muted/30`} aria-hidden />;
  }
  if (cell === "?") return <QuestionMarkPanel className={className} />;
  return <GlyphPanel glyph={cell} className={className} />;
}

/**
 * Renderer spesifikasi visual figural. `spec` = VisualSpec (batang soal);
 * untuk opsi jawaban gunakan <GlyphPanel> langsung dengan Glyph.
 */
export function VisualPanel({ spec }: { spec: VisualSpec }) {
  if (spec.kind === "grid-9") {
    return (
      <div className="grid w-fit grid-cols-3 gap-1.5">
        {spec.cells.map((cell, i) => (
          <Cell key={i} cell={cell} className="h-16 w-16" />
        ))}
      </div>
    );
  }
  if (spec.kind === "net") {
    return (
      <div className="grid w-fit gap-1.5" style={{ gridTemplateColumns: `repeat(${spec.cols}, minmax(0, 1fr))` }}>
        {spec.cells.map((cell, i) => (
          <Cell key={i} cell={cell} className="h-16 w-16" />
        ))}
      </div>
    );
  }
  if (spec.kind === "analogy") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Cell cell={spec.cells[0]} className="h-16 w-16" />
        <span className="text-xl font-bold text-muted-foreground">:</span>
        <Cell cell={spec.cells[1]} className="h-16 w-16" />
        <span className="text-xl font-bold text-muted-foreground">∷</span>
        <Cell cell={spec.cells[2]} className="h-16 w-16" />
        <span className="text-xl font-bold text-muted-foreground">:</span>
        <Cell cell={spec.cells[3]} className="h-16 w-16" />
      </div>
    );
  }
  if (spec.kind === "odd-five") {
    return (
      <div className="flex flex-wrap gap-2">
        {spec.cells.map((glyph, i) => (
          <div key={i} className="space-y-1 text-center">
            <GlyphPanel glyph={glyph} className="h-16 w-16" />
            <div className="text-xs font-bold text-muted-foreground">{String.fromCharCode(65 + i)}</div>
          </div>
        ))}
      </div>
    );
  }
  // series
  return (
    <div className="flex flex-wrap items-center gap-2">
      {spec.cells.map((cell, i) => (
        <Cell key={i} cell={cell} className="h-16 w-16" />
      ))}
    </div>
  );
}

/** Panel untuk opsi jawaban berupa gambar (Glyph). */
export function GlyphPanelOption({ glyph }: { glyph: Glyph }) {
  return <GlyphPanel glyph={glyph} className="h-14 w-14" />;
}
