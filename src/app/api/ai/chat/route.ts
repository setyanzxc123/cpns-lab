import { getGenAI, GEMINI_MODEL_ID, generationConfig } from "@/lib/ai";

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

  // Riwayat multi-turn → Step sequence Interactions API (stateless, store=false)
  const input = (body.messages ?? [])
    .map((m) => {
      const text =
        m.content ??
        m.parts
          ?.filter((p) => p.type === "text" && typeof p.text === "string")
          .map((p) => p.text)
          .join("") ??
        "";
      return {
        type: m.role === "assistant" ? ("model_output" as const) : ("user_input" as const),
        content: [{ type: "text" as const, text }],
      };
    })
    .filter((step) => step.content[0].text.trim().length > 0);

  try {
    const stream = await getGenAI().interactions.create({
      model: GEMINI_MODEL_ID,
      input,
      system_instruction: SYSTEM,
      generation_config: generationConfig(2048),
      store: false,
      stream: true,
    });

    const encoder = new TextEncoder();
    const textStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.event_type === "step.delta" && event.delta.type === "text" && event.delta.text) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } catch {
          // stream terputus — client melihat stream berakhir
        } finally {
          controller.close();
        }
      },
    });

    return new Response(textStream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Gagal menghubungi Gemini. Periksa koneksi atau GEMINI_API_KEY." }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
}
