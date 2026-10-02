"use client";

// Renderer visual figural standar tes IQ internasional & CAT BKN
// Mendukung Raven's Progressive Matrices, Cattell, WAIS Matrix Reasoning.
// Ruang koordinat standar satu sel: 100x100.

import React from "react";
import type { Fill, Glyph, OptionVisual, Shape, VisualSpec } from "@/lib/types";

const DEFAULT_STROKE = 3.5;

/** Definisi pola arsiran SVG standar tes visual / psikometri */
export function HatchDefs() {
  return (
    <defs>
      {/* Arsiran diagonal standar (45 deg) */}
      <pattern id="hatch-fill" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="8" stroke="currentColor" strokeWidth="2.5" />
      </pattern>
      {/* Arsiran diagonal berlawanan (135 deg / -45 deg) */}
      <pattern id="hatch-reverse-fill" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
        <line x1="0" y1="0" x2="0" y2="8" stroke="currentColor" strokeWidth="2.5" />
      </pattern>
      {/* Garis-garis horizontal */}
      <pattern id="hatch-horizontal-fill" width="8" height="8" patternUnits="userSpaceOnUse">
        <line x1="0" y1="4" x2="8" y2="4" stroke="currentColor" strokeWidth="2.5" />
      </pattern>
      {/* Garis-garis vertikal */}
      <pattern id="hatch-vertical-fill" width="8" height="8" patternUnits="userSpaceOnUse">
        <line x1="4" y1="0" x2="4" y2="8" stroke="currentColor" strokeWidth="2.5" />
      </pattern>
      {/* Arsir silang / jaring-jaring (cross-hatch) */}
      <pattern id="cross-hatch-fill" width="8" height="8" patternUnits="userSpaceOnUse">
        <line x1="0" y1="4" x2="8" y2="4" stroke="currentColor" strokeWidth="2" />
        <line x1="4" y1="0" x2="4" y2="8" stroke="currentColor" strokeWidth="2" />
      </pattern>
      {/* Tekstur titik-titik (dots-fill / stipple) */}
      <pattern id="dots-fill" width="8" height="8" patternUnits="userSpaceOnUse">
        <circle cx="4" cy="4" r="1.7" fill="currentColor" />
      </pattern>
    </defs>
  );
}

function fillProps(fill: Fill, customSw?: number) {
  const sw = customSw ?? DEFAULT_STROKE;
  switch (fill) {
    case "solid":
      return { fill: "currentColor", stroke: "currentColor", strokeWidth: 0 };
    case "white":
      return { fill: "var(--background, #ffffff)", stroke: "currentColor", strokeWidth: sw };
    case "none":
      return { fill: "none", stroke: "currentColor", strokeWidth: sw };
    case "outline":
      return { fill: "none", stroke: "currentColor", strokeWidth: sw };
    case "hatch":
      return { fill: "url(#hatch-fill)", stroke: "currentColor", strokeWidth: Math.min(sw, 2.5) };
    case "hatch-reverse":
      return { fill: "url(#hatch-reverse-fill)", stroke: "currentColor", strokeWidth: Math.min(sw, 2.5) };
    case "hatch-horizontal":
      return { fill: "url(#hatch-horizontal-fill)", stroke: "currentColor", strokeWidth: Math.min(sw, 2.5) };
    case "hatch-vertical":
      return { fill: "url(#hatch-vertical-fill)", stroke: "currentColor", strokeWidth: Math.min(sw, 2.5) };
    case "cross-hatch":
      return { fill: "url(#cross-hatch-fill)", stroke: "currentColor", strokeWidth: Math.min(sw, 2.5) };
    case "dots-fill":
      return { fill: "url(#dots-fill)", stroke: "currentColor", strokeWidth: Math.min(sw, 2.5) };
    default:
      return { fill: "none", stroke: "currentColor", strokeWidth: sw };
  }
}

function regularPolygonPoints(n: number, r: number, cx = 50, cy = 50, rot = 0): string {
  const pts: string[] = [];
  const step = 360 / n;
  for (let i = 0; i < n; i++) {
    const angle = ((rot + step * i) * Math.PI) / 180;
    const x = (cx + r * Math.sin(angle)).toFixed(2);
    const y = (cy - r * Math.cos(angle)).toFixed(2);
    pts.push(`${x},${y}`);
  }
  return pts.join(" ");
}

function sectorPath(r: number, startAngle: number, endAngle: number, cx = 50, cy = 50): string {
  const a1 = (startAngle * Math.PI) / 180;
  const a2 = (endAngle * Math.PI) / 180;
  const x1 = (cx + r * Math.sin(a1)).toFixed(2);
  const y1 = (cy - r * Math.cos(a1)).toFixed(2);
  const x2 = (cx + r * Math.sin(a2)).toFixed(2);
  const y2 = (cy - r * Math.cos(a2)).toFixed(2);

  let diff = endAngle - startAngle;
  while (diff < 0) diff += 360;
  const largeArc = diff > 180 ? 1 : 0;

  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

function spikePoints(k: number, rOut: number, rIn: number, rot = 0, cx = 50, cy = 50): string {
  const pts: string[] = [];
  const step = 360 / k;
  for (let i = 0; i < k; i++) {
    const aOut = ((rot + step * i) * Math.PI) / 180;
    const aIn = ((rot + step * (i + 0.5)) * Math.PI) / 180;
    pts.push(`${(cx + rOut * Math.sin(aOut)).toFixed(2)},${(cy - rOut * Math.cos(aOut)).toFixed(2)}`);
    pts.push(`${(cx + rIn * Math.sin(aIn)).toFixed(2)},${(cy - rIn * Math.cos(aIn)).toFixed(2)}`);
  }
  return pts.join(" ");
}

function zigzagPath(peaks: number, amp: number, cx = 50, cy = 50): string {
  const y0 = cy - amp;
  const y1 = cy + amp;
  const totalW = 84;
  const startX = cx - totalW / 2;
  const step = totalW / (peaks * 2);
  let d = `M ${startX} ${y1}`;
  for (let i = 0; i < peaks * 2; i++) {
    d += ` L ${startX + step * (i + 1)} ${i % 2 === 0 ? y0 : y1}`;
  }
  return d;
}

function ShapeView({ shape }: { shape: Shape }) {
  if ("polyRect" in shape) {
    return (
      <polygon
        points={shape.polyRect.map((p) => p.join(",")).join(" ")}
        {...fillProps(shape.fill, shape.strokeWidth)}
      />
    );
  }

  if ("regularPolygon" in shape) {
    const { n, r, cx, cy, rot, fill, strokeWidth } = shape.regularPolygon;
    return (
      <polygon
        points={regularPolygonPoints(n, r, cx, cy, rot)}
        {...fillProps(fill, strokeWidth)}
        strokeLinejoin="round"
      />
    );
  }

  if ("circle" in shape) {
    const cx = shape.circle.cx ?? 50;
    const cy = shape.circle.cy ?? 50;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={shape.circle.r}
        {...fillProps(shape.circle.fill, shape.circle.strokeWidth)}
      />
    );
  }

  if ("ellipse" in shape) {
    const { rx, ry, cx = 50, cy = 50, rot = 0, fill, strokeWidth } = shape.ellipse;
    return (
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        transform={rot ? `rotate(${rot} ${cx} ${cy})` : undefined}
        {...fillProps(fill, strokeWidth)}
      />
    );
  }

  if ("sector" in shape) {
    const { r, startAngle, endAngle, cx = 50, cy = 50, fill, strokeWidth } = shape.sector;
    return (
      <path
        d={sectorPath(r, startAngle, endAngle, cx, cy)}
        {...fillProps(fill, strokeWidth)}
        strokeLinejoin="round"
      />
    );
  }

  if ("line" in shape) {
    const { x1, y1, x2, y2, strokeWidth = DEFAULT_STROKE, strokeDash } = shape.line;
    return (
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={strokeDash}
      />
    );
  }

  if ("spikes" in shape) {
    const s = shape.spikes;
    const cx = s.cx ?? 50;
    const cy = s.cy ?? 50;
    return (
      <polygon
        points={spikePoints(s.k, s.rOut, s.rIn, s.rot ?? 0, cx, cy)}
        {...fillProps(s.fill, s.strokeWidth)}
        strokeLinejoin="round"
      />
    );
  }

  if ("path" in shape) {
    const { d, fill = "outline", strokeWidth, strokeLinejoin = "round", strokeLinecap = "round" } = shape.path;
    return (
      <path
        d={d}
        {...fillProps(fill, strokeWidth)}
        strokeLinejoin={strokeLinejoin}
        strokeLinecap={strokeLinecap}
      />
    );
  }

  if ("zigzag" in shape) {
    const { peaks, amp, cx = 50, cy = 50, rot = 0, strokeWidth = DEFAULT_STROKE } = shape.zigzag;
    const d = zigzagPath(peaks, amp, cx, cy);
    return (
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        transform={rot ? `rotate(${rot} ${cx} ${cy})` : undefined}
      />
    );
  }

  if ("dots" in shape) {
    const { cols = 1, rows = 1, gap = 12, r, points, cx = 50, cy = 50 } = shape.dots;
    if (points && points.length > 0) {
      return (
        <g>
          {points.map(([px, py], i) => (
            <circle key={i} cx={px} cy={py} r={r} fill="currentColor" />
          ))}
        </g>
      );
    }
    const cells: React.ReactNode[] = [];
    const w = (cols - 1) * gap;
    const h = (rows - 1) * gap;
    for (let c = 0; c < cols; c++) {
      for (let rr = 0; rr < rows; rr++) {
        cells.push(
          <circle
            key={`${c}-${rr}`}
            cx={Number((cx - w / 2 + c * gap).toFixed(2))}
            cy={Number((cy - h / 2 + rr * gap).toFixed(2))}
            r={r}
            fill="currentColor"
          />,
        );
      }
    }
    return <g>{cells}</g>;
  }

  if ("arrow" in shape) {
    const { rot = 0, cx = 50, cy = 50, scale = 1 } = shape.arrow;
    return (
      <g transform={`translate(${cx} ${cy}) rotate(${rot}) scale(${scale}) translate(-50 -50)`}>
        <polygon points="50,12 74,46 58,46 58,84 42,84 42,46 26,46" fill="currentColor" />
      </g>
    );
  }

  if ("letter" in shape) {
    return (
      <text
        x={shape.x ?? 50}
        y={shape.y ?? 50}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={shape.fontSize ?? 46}
        fontWeight="700"
        fill="currentColor"
      >
        {shape.letter}
      </text>
    );
  }

  if ("composite" in shape) {
    const { shapes, transform } = shape.composite;
    const rot = transform?.rot ?? 0;
    const scale = transform?.scale ?? 1;
    const tx = transform?.tx ?? 0;
    const ty = transform?.ty ?? 0;
    const tStr = `translate(${tx} ${ty}) rotate(${rot} 50 50) scale(${scale})`;
    return (
      <g transform={tStr}>
        {shapes.map((s, idx) => (
          <ShapeView key={idx} shape={s} />
        ))}
      </g>
    );
  }

  return (
    <image
      href={shape.image}
      x={shape.x ?? 4}
      y={shape.y ?? 4}
      width={shape.width ?? 92}
      height={shape.height ?? 92}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}

/** Satu sel: primitif + bingkai konfigurabel. */
export function GlyphView({ glyph }: { glyph: Glyph }) {
  const frame = glyph.frame;
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" role="img">
      <HatchDefs />
      {!frame?.none && !frame?.circle && (
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx={frame?.rounded ? 10 : 0}
          fill="none"
          stroke="currentColor"
          strokeWidth={DEFAULT_STROKE}
          strokeDasharray={frame?.dashed ? "5 4" : undefined}
        />
      )}
      {frame?.circle && (
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="currentColor"
          strokeWidth={DEFAULT_STROKE}
          strokeDasharray={frame?.dashed ? "5 4" : undefined}
        />
      )}
      {frame?.double && !frame?.circle && (
        <rect
          x="11"
          y="11"
          width="78"
          height="78"
          rx={frame?.rounded ? 7 : 0}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        />
      )}
      {frame?.double && frame?.circle && (
        <circle
          cx="50"
          cy="50"
          r="39"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        />
      )}
      {glyph.shapes.map((s, i) => (
        <ShapeView key={i} shape={s} />
      ))}
    </svg>
  );
}

function QuestionMarkPanel({ className }: { className: string }) {
  return (
    <div
      className={`${className} flex items-center justify-center rounded-lg border-2 border-dashed bg-muted text-2xl font-bold text-muted-foreground`}
    >
      ?
    </div>
  );
}

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
 * Renderer spesifikasi visual figural untuk batang soal.
 */
export function VisualPanel({ spec }: { spec: VisualSpec }) {
  if (spec.kind === "image") {
    return (
      <div className="flex justify-center p-2">
        <img
          src={spec.src}
          alt={spec.alt ?? "Stimulus Soal Figural"}
          className="max-h-72 w-auto max-w-full rounded-lg border bg-white p-2 shadow-sm object-contain"
        />
      </div>
    );
  }

  if (spec.kind === "grid-9") {
    return (
      <div className="grid w-fit grid-cols-3 gap-1.5">
        {spec.cells.map((cell, i) => (
          <Cell key={i} cell={cell} className="h-16 w-16" />
        ))}
      </div>
    );
  }

  if (spec.kind === "grid-4") {
    return (
      <div className="grid w-fit grid-cols-2 gap-2">
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

/**
 * Panel untuk opsi jawaban figural. Mendukung Glyph tunggal maupun pasangan sel
 * bertingkat (dual-v / dual-h) untuk soal dengan 2 kotak tanda tanya.
 */
export function GlyphPanelOption({ glyph }: { glyph: OptionVisual }) {
  if ("kind" in glyph && glyph.kind === "image") {
    return (
      <div className="flex h-16 w-full items-center justify-center p-0.5">
        <img
          src={glyph.src}
          alt="Pilihan visual"
          className="max-h-16 w-auto max-w-full rounded border bg-white p-0.5 object-contain"
        />
      </div>
    );
  }

  if ("kind" in glyph && glyph.kind === "dual-v") {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="h-12 w-14 shrink-0 rounded border bg-card p-0.5">
          <GlyphView glyph={glyph.top} />
        </div>
        <div className="h-12 w-14 shrink-0 rounded border bg-card p-0.5">
          <GlyphView glyph={glyph.bottom} />
        </div>
      </div>
    );
  }

  if ("kind" in glyph && glyph.kind === "dual-h") {
    return (
      <div className="flex items-center gap-1">
        <div className="h-14 w-12 shrink-0 rounded border bg-card p-0.5">
          <GlyphView glyph={glyph.left} />
        </div>
        <div className="h-14 w-12 shrink-0 rounded border bg-card p-0.5">
          <GlyphView glyph={glyph.right} />
        </div>
      </div>
    );
  }

  return <GlyphPanel glyph={glyph} className="h-14 w-14" />;
}
