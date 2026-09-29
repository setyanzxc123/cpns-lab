import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

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
  const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
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

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: SYSTEM,
    messages,
    maxOutputTokens: 2048,
  });

  return result.toTextStreamResponse();
}
