"use client";

// Renderer teks soal — mendukung tabel inline: baris yang mengandung pemisah
// " | " (konvensi ekstraksi tema Tabel, lihat AGENTS-2.md §5) digabung menjadi
// <table> sungguhan; baris pertama tiap grup tabel = header. Baris lain tetap
// paragraf biasa dengan whitespace dipertahankan.

interface TextBlock {
  type: "p" | "table";
  // untuk "p": satu baris teks; untuk "table": daftar baris sel
  content: string | string[][];
}

function parseBlocks(text: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  for (const line of text.split("\n")) {
    if (line.includes(" | ")) {
      const cells = line.split("|").map((c) => c.trim());
      const last = blocks[blocks.length - 1];
      if (last && last.type === "table" && Array.isArray(last.content)) {
        (last.content as string[][]).push(cells);
      } else {
        blocks.push({ type: "table", content: [cells] });
      }
    } else {
      blocks.push({ type: "p", content: line });
    }
  }
  return blocks;
}

export function QuestionText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const blocks = parseBlocks(text);
  return (
    <div className={`space-y-1.5 ${className}`}>
      {blocks.map((b, i) =>
        b.type === "p" ? (
          b.content ? (
            <p key={i} className="whitespace-pre-line">
              {b.content as string}
            </p>
          ) : null
        ) : (
          <div key={i} className="overflow-x-auto">
            <table className="w-fit border-collapse text-sm">
              <tbody>
                {(b.content as string[][]).map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) =>
                      ri === 0 ? (
                        <th
                          key={ci}
                          scope="col"
                          className="border border-border bg-muted px-2 py-1 text-left font-semibold whitespace-nowrap"
                        >
                          {cell}
                        </th>
                      ) : (
                        <td
                          key={ci}
                          className="border border-border px-2 py-1 text-left whitespace-nowrap"
                        >
                          {cell}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      )}
    </div>
  );
}
