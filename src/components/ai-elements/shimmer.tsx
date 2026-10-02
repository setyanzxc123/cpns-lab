"use client";

import { cn } from "@/lib/utils";

type ShimmerProps = {
  children: string;
  className?: string;
  /** Durasi satu siklus kilau (detik). */
  duration?: number;
};

/** Teks beranimasi kilau — dipakai indikator "Thinking..." saat streaming. */
export function Shimmer({ children, className, duration = 2 }: ShimmerProps) {
  return (
    <span
      className={cn(
        "animate-[shimmer_x_linear_infinite] bg-[linear-gradient(90deg,var(--muted-foreground)_35%,var(--foreground)_50%,var(--muted-foreground)_65%)] bg-[length:200%_100%] bg-clip-text text-transparent",
        className,
      )}
      style={{ animationDuration: `${duration}s` }}
    >
      {children}
    </span>
  );
}
