// Engine & Pembaca/Pembuat Figural Standar Tes IQ Internasional
// (Raven's Progressive Matrices, Cattell Culture Fair, WAIS Matrix Reasoning)

import type {
  Fill,
  Glyph,
  OptionVisual,
  Shape,
  VisualSpec,
} from "./types";

export const DEG2RAD = Math.PI / 180;

/** Konversi sudut derajat ke radian */
export function degToRad(deg: number): number {
  return deg * DEG2RAD;
}

/** Konversi koordinat polar (r, deg) dengan pusat (cx, cy) ke kartesius (x, y) */
export function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): [number, number] {
  const rad = angleDeg * DEG2RAD;
  return [
    Number((cx + r * Math.sin(rad)).toFixed(2)),
    Number((cy - r * Math.cos(rad)).toFixed(2)),
  ];
}

/** Kalkulasi titik-titik poligon beraturan (segitiga, segi-4, segi-5, segi-6, segi-8, dll) */
export function calculateRegularPolygonVertices(
  n: number,
  r: number,
  cx = 50,
  cy = 50,
  rot = 0,
): [number, number][] {
  const pts: [number, number][] = [];
  const step = 360 / n;
  for (let i = 0; i < n; i++) {
    pts.push(polarToCartesian(cx, cy, r, rot + step * i));
  }
  return pts;
}

/** Kalkulasi path SVG untuk juring lingkaran (pie slice/sector) */
export function calculateSectorPath(
  r: number,
  startAngleDeg: number,
  endAngleDeg: number,
  cx = 50,
  cy = 50,
): string {
  const [x1, y1] = polarToCartesian(cx, cy, r, startAngleDeg);
  const [x2, y2] = polarToCartesian(cx, cy, r, endAngleDeg);

  let diff = endAngleDeg - startAngleDeg;
  while (diff < 0) diff += 360;
  const largeArc = diff > 180 ? 1 : 0;

  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

/** Kalkulasi titik-titik bintang / duri (spikes) */
export function calculateStarVertices(
  k: number,
  rOut: number,
  rIn: number,
  cx = 50,
  cy = 50,
  rot = 0,
): [number, number][] {
  const pts: [number, number][] = [];
  const step = 360 / k;
  for (let i = 0; i < k; i++) {
    pts.push(polarToCartesian(cx, cy, rOut, rot + step * i));
    pts.push(polarToCartesian(cx, cy, rIn, rot + step * (i + 0.5)));
  }
  return pts;
}

/**
 * Pembuat Objek Bentuk (Shape Builders) Deklaratif & Presisi
 */
export const FiguralShape = {
  /** Poligon titik bebas */
  polygon(points: [number, number][], fill: Fill = "outline", strokeWidth?: number): Shape {
    return { polyRect: points, fill, strokeWidth };
  },

  /** Poligon beraturan (segitiga sama sisi n=3, bujur sangkar n=4, heksagon n=6, oktagon n=8) */
  regularPolygon(
    n: number,
    r: number,
    options?: { cx?: number; cy?: number; rot?: number; fill?: Fill; strokeWidth?: number },
  ): Shape {
    return {
      regularPolygon: {
        n,
        r,
        cx: options?.cx ?? 50,
        cy: options?.cy ?? 50,
        rot: options?.rot ?? 0,
        fill: options?.fill ?? "outline",
        strokeWidth: options?.strokeWidth,
      },
    };
  },

  /** Segitiga sama sisi */
  triangle(r: number, options?: { cx?: number; cy?: number; rot?: number; fill?: Fill; strokeWidth?: number }): Shape {
    return FiguralShape.regularPolygon(3, r, options);
  },

  /** Bujur sangkar */
  square(r: number, options?: { cx?: number; cy?: number; rot?: number; fill?: Fill; strokeWidth?: number }): Shape {
    return FiguralShape.regularPolygon(4, r, { ...options, rot: (options?.rot ?? 0) + 45 });
  },

  /** Segi enam beraturan */
  hexagon(r: number, options?: { cx?: number; cy?: number; rot?: number; fill?: Fill; strokeWidth?: number }): Shape {
    return FiguralShape.regularPolygon(6, r, options);
  },

  /** Segi delapan beraturan */
  octagon(r: number, options?: { cx?: number; cy?: number; rot?: number; fill?: Fill; strokeWidth?: number }): Shape {
    return FiguralShape.regularPolygon(8, r, options);
  },

  /** Lingkaran dengan koordinat pusat bebas (cx, cy) */
  circle(
    r: number,
    options?: { cx?: number; cy?: number; fill?: Fill; strokeWidth?: number },
  ): Shape {
    return {
      circle: {
        r,
        cx: options?.cx ?? 50,
        cy: options?.cy ?? 50,
        fill: options?.fill ?? "outline",
        strokeWidth: options?.strokeWidth,
      },
    };
  },

  /** Elips */
  ellipse(
    rx: number,
    ry: number,
    options?: { cx?: number; cy?: number; rot?: number; fill?: Fill; strokeWidth?: number },
  ): Shape {
    return {
      ellipse: {
        rx,
        ry,
        cx: options?.cx ?? 50,
        cy: options?.cy ?? 50,
        rot: options?.rot ?? 0,
        fill: options?.fill ?? "outline",
        strokeWidth: options?.strokeWidth,
      },
    };
  },

  /** Juring lingkaran / Pie Sector */
  sector(
    r: number,
    startAngle: number,
    endAngle: number,
    options?: { cx?: number; cy?: number; fill?: Fill; strokeWidth?: number },
  ): Shape {
    return {
      sector: {
        r,
        startAngle,
        endAngle,
        cx: options?.cx ?? 50,
        cy: options?.cy ?? 50,
        fill: options?.fill ?? "outline",
        strokeWidth: options?.strokeWidth,
      },
    };
  },

  /**
   * Roda juring (Pie Wheel Matrix) — sangat umum di soal Raven's Progressive Matrices.
   * Membagi lingkaran menjadi N juring dengan pola isi berbeda.
   */
  pieWheel(
    sectors: Array<{ startAngle: number; endAngle: number; fill: Fill }>,
    options?: { cx?: number; cy?: number; r?: number; strokeWidth?: number },
  ): Shape[] {
    const cx = options?.cx ?? 50;
    const cy = options?.cy ?? 50;
    const r = options?.r ?? 42;
    return sectors.map((s) => ({
      sector: {
        r,
        startAngle: s.startAngle,
        endAngle: s.endAngle,
        cx,
        cy,
        fill: s.fill,
        strokeWidth: options?.strokeWidth,
      },
    }));
  },

  /** Garis bebas (penunjuk arah, diameter, sumbu) */
  line(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options?: { strokeWidth?: number; strokeDash?: string },
  ): Shape {
    return {
      line: {
        x1,
        y1,
        x2,
        y2,
        strokeWidth: options?.strokeWidth,
        strokeDash: options?.strokeDash,
      },
    };
  },

  /** Salib / Palang simetris */
  cross(
    r: number,
    options?: { cx?: number; cy?: number; rot?: number; strokeWidth?: number },
  ): Shape[] {
    const cx = options?.cx ?? 50;
    const cy = options?.cy ?? 50;
    const rot = options?.rot ?? 0;
    const [x1, y1] = polarToCartesian(cx, cy, r, rot);
    const [x2, y2] = polarToCartesian(cx, cy, r, rot + 180);
    const [x3, y3] = polarToCartesian(cx, cy, r, rot + 90);
    const [x4, y4] = polarToCartesian(cx, cy, r, rot + 270);
    return [
      FiguralShape.line(x1, y1, x2, y2, options),
      FiguralShape.line(x3, y3, x4, y4, options),
    ];
  },

  /** Jari-jari lingkaran / Spokes */
  spokeWheel(
    spokeCount: number,
    r: number,
    options?: { cx?: number; cy?: number; rot?: number; strokeWidth?: number },
  ): Shape[] {
    const cx = options?.cx ?? 50;
    const cy = options?.cy ?? 50;
    const rot = options?.rot ?? 0;
    const step = 360 / spokeCount;
    const lines: Shape[] = [];
    for (let i = 0; i < spokeCount; i++) {
      const [x2, y2] = polarToCartesian(cx, cy, r, rot + step * i);
      lines.push(FiguralShape.line(cx, cy, x2, y2, options));
    }
    return lines;
  },

  /** Bintang / Gerigi */
  star(
    k: number,
    rOut: number,
    rIn: number,
    options?: { cx?: number; cy?: number; rot?: number; fill?: Fill; strokeWidth?: number },
  ): Shape {
    return {
      spikes: {
        k,
        rOut,
        rIn,
        cx: options?.cx ?? 50,
        cy: options?.cy ?? 50,
        rot: options?.rot ?? 0,
        fill: options?.fill ?? "outline",
        strokeWidth: options?.strokeWidth,
      },
    };
  },

  /** Path SVG arbitrer (kurva Bézier, logo, hati, ilustrasi lokomotif, dsb) */
  path(
    d: string,
    options?: {
      fill?: Fill;
      strokeWidth?: number;
      strokeLinejoin?: "round" | "miter" | "bevel";
      strokeLinecap?: "round" | "square" | "butt";
    },
  ): Shape {
    return {
      path: {
        d,
        fill: options?.fill ?? "outline",
        strokeWidth: options?.strokeWidth,
        strokeLinejoin: options?.strokeLinejoin,
        strokeLinecap: options?.strokeLinecap,
      },
    };
  },

  /** Zigzag horizontal */
  zigzag(
    peaks: number,
    amp: number,
    options?: { cx?: number; cy?: number; rot?: number; strokeWidth?: number },
  ): Shape {
    return {
      zigzag: {
        peaks,
        amp,
        cx: options?.cx ?? 50,
        cy: options?.cy ?? 50,
        rot: options?.rot,
        strokeWidth: options?.strokeWidth,
      },
    };
  },

  /** Kisi titik atau kumpulan titik eksplisit */
  dots(options: {
    r: number;
    cols?: number;
    rows?: number;
    gap?: number;
    points?: [number, number][];
    cx?: number;
    cy?: number;
  }): Shape {
    return { dots: options };
  },

  /** Titik-titik di pojok bingkai (corner dots) */
  cornerDots(r = 3.5, offset = 18, positions: ("tl" | "tr" | "bl" | "br")[] = ["tl", "tr", "bl", "br"]): Shape {
    const pts: [number, number][] = [];
    if (positions.includes("tl")) pts.push([offset, offset]);
    if (positions.includes("tr")) pts.push([100 - offset, offset]);
    if (positions.includes("bl")) pts.push([offset, 100 - offset]);
    if (positions.includes("br")) pts.push([100 - offset, 100 - offset]);
    return { dots: { points: pts, r } };
  },

  /** Panah penunjuk arah */
  arrow(rot = 0, options?: { cx?: number; cy?: number; scale?: number }): Shape {
    return {
      arrow: {
        rot,
        cx: options?.cx ?? 50,
        cy: options?.cy ?? 50,
        scale: options?.scale ?? 1,
      },
    };
  },

  /** Huruf / Karakter */
  letter(text: string, options?: { x?: number; y?: number; fontSize?: number }): Shape {
    return {
      letter: text,
      x: options?.x,
      y: options?.y,
      fontSize: options?.fontSize,
    };
  },

  /** Gambar bitmap escape hatch (PNG/WebP) */
  image(src: string, options?: { x?: number; y?: number; width?: number; height?: number }): Shape {
    return {
      image: src,
      x: options?.x,
      y: options?.y,
      width: options?.width,
      height: options?.height,
    };
  },

  /** Gabungan bentuk dengan transformasi (rotasi, translasi, skala) */
  composite(
    shapes: Shape[],
    transform?: { rot?: number; scale?: number; tx?: number; ty?: number },
  ): Shape {
    return { composite: { shapes, transform } };
  },
};

/** Pembuat Glyph (satu sel) */
export function createGlyph(
  shapes: Shape[],
  frame?: Glyph["frame"],
): Glyph {
  return { shapes, frame };
}

/** Pembuat Opsi Pasangan Vertikal (untuk soal grid-9 dengan dua tanda tanya) */
export function createDualOption(
  top: Glyph,
  bottom: Glyph,
): OptionVisual {
  return { kind: "dual-v", top, bottom };
}

/** Pembuat Opsi Pasangan Horizontal */
export function createDualOptionHorizontal(
  left: Glyph,
  right: Glyph,
): OptionVisual {
  return { kind: "dual-h", left, right };
}

/** Validator Geometris Lengkap untuk VisualSpec */
export function validateFiguralSpec(spec: VisualSpec): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (spec.kind === "image") {
    if (!spec.src || typeof spec.src !== "string") {
      errors.push("Image visual butuh atribut 'src'.");
    }
    return { valid: errors.length === 0, errors };
  }

  const KNOWN_KINDS = ["series", "analogy", "odd-five", "net", "grid-9", "grid-4"];
  if (!KNOWN_KINDS.includes(spec.kind)) {
    errors.push(`Pola kind '${spec.kind}' tidak dikenal (harus salah satu dari: ${KNOWN_KINDS.join(", ")})`);
    return { valid: false, errors };
  }

  const cells = spec.cells;
  if (!Array.isArray(cells)) {
    errors.push("Cells harus berupa array.");
    return { valid: false, errors };
  }

  if (spec.kind === "grid-9" && cells.length !== 9) {
    errors.push(`Grid-9 harus memiliki tepat 9 sel, ditemukan: ${cells.length}`);
  }
  if (spec.kind === "grid-4" && cells.length !== 4) {
    errors.push(`Grid-4 harus memiliki tepat 4 sel, ditemukan: ${cells.length}`);
  }
  if (spec.kind === "odd-five" && cells.length !== 5) {
    errors.push(`Odd-five harus memiliki tepat 5 sel, ditemukan: ${cells.length}`);
  }
  if (spec.kind === "analogy" && cells.length !== 4) {
    errors.push(`Analogy harus memiliki tepat 4 sel, ditemukan: ${cells.length}`);
  }
  if (spec.kind === "series" && cells.length < 3) {
    errors.push(`Series butuh minimal 3 sel, ditemukan: ${cells.length}`);
  }
  if (spec.kind === "net") {
    if (!spec.cols || spec.cols < 2) {
      errors.push("Net butuh cols >= 2.");
    } else if (cells.length % spec.cols !== 0) {
      errors.push(`Panjang cells net (${cells.length}) harus kelipatan cols (${spec.cols}).`);
    }
  }

  for (const [idx, c] of cells.entries()) {
    if (c && c !== "?" && typeof c === "object" && "shapes" in c) {
      validateGlyphInternal(c, `Sel ${idx + 1}`, errors);
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateGlyphInternal(glyph: Glyph, prefix: string, errors: string[]) {
  if (!Array.isArray(glyph.shapes) || glyph.shapes.length === 0) {
    errors.push(`${prefix}: Glyph tidak memiliki shape.`);
    return;
  }

  for (const [i, s] of glyph.shapes.entries()) {
    const sp = `${prefix} shape #${i + 1}`;
    if ("polyRect" in s) {
      if (!Array.isArray(s.polyRect) || s.polyRect.length < 3) {
        errors.push(`${sp}: polyRect butuh minimal 3 titik.`);
      }
    } else if ("circle" in s) {
      if (s.circle.r <= 0 || s.circle.r > 60) {
        errors.push(`${sp}: circle.r harus antara 1-60.`);
      }
    } else if ("regularPolygon" in s) {
      if (s.regularPolygon.n < 3 || s.regularPolygon.r <= 0) {
        errors.push(`${sp}: regularPolygon butuh n >= 3 dan r > 0.`);
      }
    } else if ("sector" in s) {
      if (s.sector.r <= 0) {
        errors.push(`${sp}: sector butuh r > 0.`);
      }
    } else if ("spikes" in s) {
      if (s.spikes.k < 3 || s.spikes.rOut <= s.spikes.rIn) {
        errors.push(`${sp}: spikes butuh k >= 3 dan rOut > rIn.`);
      }
    } else if ("path" in s) {
      if (!s.path.d || typeof s.path.d !== "string") {
        errors.push(`${sp}: path butuh atribut 'd' yang valid.`);
      }
    }
  }
}
