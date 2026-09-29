"use client";

// Renderer SVG untuk soal figural — semua gambar digenerate dari
// VisualSpec (deklaratif, tanpa file gambar). Deterministik & tajam.

import type { ShapeName, VisualSpec } from "@/lib/types";

function ShapeGlyph({
  shape,
  rotation = 0,
  flipH = false,
  dots,
}: {
  shape: ShapeName;
  rotation?: number;
  flipH?: boolean;
  dots?: number;
}) {
  const cx = 50;
  const cy = 46;
  const transform = `rotate(${rotation} ${cx} ${cy})${flipH ? ` translate(100,0) scale(-1,1) translate(-100,0)` : ""}`;
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" role="img" aria-label={`bangun ${shape}`}>
      <g transform={transform}>
        {shape === "arrow" && (
          <path
            d="M50 14 L72 40 L58 40 L58 76 L42 76 L42 40 L28 40 Z"
            fill="currentColor"
            className="text-primary"
          />
        )}
        {shape === "triangle" && (
          <path d="M50 16 L82 74 L18 74 Z" fill="none" stroke="currentColor" strokeWidth="6" className="text-primary" />
        )}
        {shape === "star" && (
          <path
            d="M50 12 L59.5 38.5 L87.5 38.5 L64.8 55 L73.5 82 L50 65.5 L26.5 82 L35.2 55 L12.5 38.5 L40.5 38.5 Z"
            fill="currentColor"
            className="text-primary"
          />
        )}
        {shape === "square" && (
          <rect x="20" y="20" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="6" className="text-primary" />
        )}
        {shape === "pentagon" && (
          <polygon
            points="50,14 84,39 71,79 29,79 16,39"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-primary"
          />
        )}
        {shape === "flag" && (
          <g className="text-primary">
            <rect x="46" y="12" width="6" height="70" fill="currentColor" />
            <path d="M52 16 L84 26 L52 36 Z" fill="currentColor" />
          </g>
        )}
      </g>
      {dots !== undefined && dots > 0 && (
        <g fill="currentColor" className="text-foreground">
          {Array.from({ length: Math.min(dots, 12) }).map((_, i) => (
            <circle key={i} cx={18 + i * 8} cy={90} r="3.2" />
          ))}
        </g>
      )}
    </svg>
  );
}

/** Panel tunggal (dipakai untuk deret maupun opsi jawaban). */
export function VisualPanel({ spec, size = "md" }: { spec: VisualSpec; size?: "sm" | "md" | "lg" }) {
  const cls = size === "sm" ? "h-14 w-14" : size === "lg" ? "h-28 w-28" : "h-20 w-20";
  if (spec.kind === "shape-single") {
    return (
      <div className={`${cls} shrink-0 rounded-lg border bg-card p-1`}>
        <ShapeGlyph shape={spec.shape} rotation={spec.rotation} flipH={spec.flipH} dots={spec.dots} />
      </div>
    );
  }
  // shape-series: deretan panel dengan satu tanda tanya
  return (
    <div className="flex flex-wrap items-center justify-start gap-2">
      {Array.from({ length: spec.count }).map((_, i) => {
        if (i === spec.missing) {
          return (
            <div
              key={i}
              className={`${cls} flex shrink-0 items-center justify-center rounded-lg border-2 border-dashed bg-muted text-2xl font-bold text-muted-foreground`}
            >
              ?
            </div>
          );
        }
        const dots = spec.dots ? spec.dots.start + spec.dots.step * i : undefined;
        return (
          <div key={i} className={`${cls} shrink-0 rounded-lg border bg-card p-1`}>
            <ShapeGlyph shape={spec.shape} rotation={spec.rotationStep * i} dots={dots} />
          </div>
        );
      })}
    </div>
  );
}
