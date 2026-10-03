"use client";

// Efek ketik mulus untuk streaming: model melontarkan teks dalam blok besar
// (gemini 3.x berpikir → blok → berpikir lagi); hook ini menampilkan teks
// bertahap dengan kecepatan tetap sehingga terlihat mengalir, bukan melompat.
// Hanya aktif saat `active` true — pesan selesai & riwayat tampil instan.

import { useEffect, useRef, useState } from "react";

export function useSmoothText(text: string, active: boolean) {
  const [displayed, setDisplayed] = useState(() => (active ? "" : text));
  const countRef = useRef(active ? 0 : text.length);
  // Gerak tereduksi: tampilkan teks seketika tanpa efek ketik.
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!active || reducedMotion) {
      countRef.current = text.length;
      setDisplayed(text);
      return;
    }
    // pesan baru mulai → reset dari nol
    if (countRef.current > text.length) {
      countRef.current = 0;
      setDisplayed("");
    }
    if (countRef.current >= text.length) return;

    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const elapsed = Math.min(now - last, 120);
      last = now;
      // kejar target dalam ±12 tick; makin besar sisa, makin cepat langkahnya
      const remaining = text.length - countRef.current;
      const step = Math.max(1, Math.round((remaining / 12) * Math.min(1, elapsed / 24)));
      countRef.current = Math.min(text.length, countRef.current + step);
      setDisplayed(text.slice(0, countRef.current));
    }, 24);
    return () => clearInterval(id);
  }, [text, active, reducedMotion]);

  return active && reducedMotion ? text : displayed;
}
