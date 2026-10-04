"use client";

import { useEffect, useState } from "react";
import { SquarePen, Trash2 } from "lucide-react";
import type { ChatSession } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function getScreenCapacity(): number {
  if (typeof window === "undefined") return 8;
  const available = window.innerHeight - 240;
  return Math.max(5, Math.floor(available / 48));
}

function formatWhen(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export function ChatHistoryList({
  sessions,
  activeId,
  loading = false,
  onOpen,
  onDelete,
  onNew,
}: {
  sessions: ChatSession[];
  activeId: string | null;
  loading?: boolean;
  onOpen: (s: ChatSession) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}) {
  const [capacity, setCapacity] = useState(8);
  const [extraCount, setExtraCount] = useState(0);
  // Konfirmasi hapus: delete bersifat permanen (soft delete tanpa undo),
  // dan di perangkat sentuh tombol ini selalu tampak — rawan salah tekan.
  const [pendingDelete, setPendingDelete] = useState<ChatSession | null>(null);

  useEffect(() => {
    setCapacity(getScreenCapacity());
    const handleResize = () => {
      setCapacity(getScreenCapacity());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (activeId) {
      const idx = sessions.findIndex((s) => s.id === activeId);
      if (idx >= capacity + extraCount) {
        setExtraCount(idx + 1 - capacity);
      }
    }
  }, [activeId, sessions, capacity, extraCount]);

  const effectiveLimit = capacity + extraCount;
  const displayedSessions = sessions.slice(0, effectiveLimit);
  const hasMore = sessions.length > effectiveLimit;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1">
      <button
        type="button"
        onClick={onNew}
        className="focus-ring flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium transition-colors hover:bg-muted"
      >
        <SquarePen className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        Percakapan baru
      </button>
      {loading ? (
        <div className="space-y-2 px-2 py-1" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse space-y-1.5">
              <div className="h-3.5 w-3/4 rounded bg-muted" />
              <div className="h-2.5 w-1/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : (
        sessions.length === 0 && (
          <p className="px-2 py-1 text-xs text-muted-foreground">
            Belum ada riwayat percakapan.
          </p>
        )
      )}
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
        {displayedSessions.map((s) => (
          <div
            key={s.id}
            className={cn(
              "group flex items-center gap-1 rounded-md px-2 py-1.5 transition-colors hover:bg-muted",
              s.id === activeId && "bg-muted",
            )}
          >
            <button
              type="button"
              onClick={() => onOpen(s)}
              className="min-w-0 flex-1 text-left"
              title={s.title}
            >
              <p className="truncate text-sm">{s.title}</p>
              <p className="text-[11px] text-muted-foreground">
                {formatWhen(s.updatedAt)} · {s.messages.length} pesan
              </p>
            </button>
            <button
              type="button"
              aria-label={`Hapus percakapan ${s.title}`}
              onClick={() => setPendingDelete(s)}
              className="focus-ring touch-target grid h-9 w-9 shrink-0 place-items-center rounded text-muted-foreground transition-opacity hover:text-destructive focus-visible:text-destructive md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 md:focus-visible:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        ))}
        {hasMore && (
          <button
            type="button"
            onClick={() => setExtraCount((prev) => prev + capacity)}
            className="w-full py-1.5 text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            Muat lebih banyak
          </button>
        )}
      </div>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus percakapan ini?</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `"${pendingDelete.title}" akan dihapus dari riwayat. Tindakan ini tidak bisa dibatalkan.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingDelete) onDelete(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Ya, hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
