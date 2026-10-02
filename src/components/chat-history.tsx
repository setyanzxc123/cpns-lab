"use client";

// Daftar riwayat percakapan tutor AI — dipakai sidebar desktop dan Sheet mobile.

import { SquarePen, Trash2 } from "lucide-react";
import type { ChatSession } from "@/lib/storage";
import { Button } from "@/components/ui/button";

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
  onOpen,
  onDelete,
  onNew,
}: {
  sessions: ChatSession[];
  activeId: string | null;
  onOpen: (s: ChatSession) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-col gap-2">
      <Button variant="outline" size="sm" className="w-full justify-start" onClick={onNew}>
        <SquarePen className="h-4 w-4" aria-hidden />
        Percakapan baru
      </Button>
      {sessions.length === 0 && (
        <p className="px-1 text-xs text-muted-foreground">
          Belum ada riwayat percakapan.
        </p>
      )}
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 ${
              s.id === activeId ? "border-ring bg-muted/60" : "bg-card"
            }`}
          >
            <button
              type="button"
              onClick={() => onOpen(s)}
              className="min-w-0 flex-1 text-left"
              title={s.title}
            >
              <p className="truncate text-sm font-medium">{s.title}</p>
              <p className="text-[11px] text-muted-foreground">
                {formatWhen(s.updatedAt)} · {s.messages.length} pesan
              </p>
            </button>
            <button
              type="button"
              aria-label={`Hapus percakapan ${s.title}`}
              onClick={() => onDelete(s.id)}
              className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
