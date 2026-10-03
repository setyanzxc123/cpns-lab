import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
} from "ai";
import { getGemini } from "@/lib/ai";

export const maxDuration = 60;

const SYSTEM = `Anda adalah tutor CPNS berbahasa Indonesia yang ramah dan tajam. Tugas Anda:
1. Menjelaskan materi tes CPNS: Pancasila, UUD 1945, Wawasan Kebangsaan (TWK), soal verbal/numerik/figural/logika (TIU), dan karakter pribadi ASN (TKP).
2. Memberi trik cepat mengerjakan soal numerik dan figural.
3. Membuat soal latihan baru bila diminta, lengkap dengan kunci dan pembahasan.
4. Membantu menyusun rencana belajar berdasarkan data yang diberikan user.
Gaya: jelas, terstruktur (pakai poin/heading singkat), contoh konkret, tidak bertele-tele.
Jangan mengklaim data resmi yang tidak pasti; jika soal bersifat hafalan, sebutkan dasarnya (pasal/keputusan).`;

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY belum dipasang di .env.local" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }
  const body = (await req.json()) as {
    messages?: Array<{
      role: string;
      content?: string;
      parts?: Array<{ type: string; text?: string }>;
    }>;
  };
  const messages = (body.messages ?? []).map((m) => {
    const text =
      m.content ??
      m.parts
        ?.filter((p) => p.type === "text" && typeof p.text === "string")
        .map((p) => p.text)
        .join("") ??
      "";
    return {
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: text,
    };
  });

  // Thinking "low": token proses berpikir dihitung ke dalam maxOutputTokens,
  // jadi level tinggi dengan jatah kecil memotong jawaban.
  const result = streamText({
    ...getGemini("low"),
    system: SYSTEM,
    messages,
    maxOutputTokens: 8192,
  });

  // Peringatkan bila model berhenti karena jatah token habis — tanpa ini
  // pemotongan tampak seperti jawaban normal yang berhenti mendadak.
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.merge(
        toUIMessageStream({
          stream: result.fullStream,
          sendStart: false,
          sendFinish: false,
          onError: (error) => {
            // Jangan diamkan error upstream (mis. 429 kuota harian habis)
            console.error("[ai/chat]", error);
            return "Terjadi gangguan saat menghubungi AI.";
          },
        }),
      );
      const finishReason = await result.finishReason;
      console.log("[ai/chat] finish reason:", finishReason);
      if (finishReason === "length") {
        writer.write({
          type: "text-delta",
          id: "truncation-note",
          delta: "\n\n_Jawaban terpotong karena batas token. Ketik **lanjutkan** untuk melanjutkan._",
        });
      }
    },
    onError: (error) => {
      console.error("[ai/chat]", error);
      return "Terjadi gangguan saat menghubungi AI.";
    },
  });

  return createUIMessageStreamResponse({ stream });
}
