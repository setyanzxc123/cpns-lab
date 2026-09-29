import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { explanation: "Fitur AI belum aktif — pasang GEMINI_API_KEY di .env.local lalu restart server." },
      { status: 200 },
    );
  }
  const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
  const body = await req.json();

  const ops = (body.options ?? [])
    .map((o: { letter: string; text: string }, i: number) => {
      let note = "";
      if (typeof body.answerIndex === "number" && i === body.answerIndex) note = " <- KUNCI";
      if (Array.isArray(body.points)) note += ` (nilai ${body.points[i]}/5)`;
      if (typeof body.userChoice === "number" && i === body.userChoice) note += " <- pilihan user";
      return `${o.letter}. ${o.text}${note}`;
    })
    .join("\n");

  const prompt = `Pembedah soal tes CPNS kategori ${body.category} berikut agar mudah dipahami pemula.

Soal: ${body.question}

Pilihan:
${ops}

Pembahasan resmi di aplikasi: ${body.explanation}

Buat penjelasan maksimal 150 kata dalam bahasa Indonesia santun:
1. Mengapa jawaban benar/kunci bernilai itu (atau mengapa pilihan user kurang tepat, jika user salah).
2. Poin konsep yang harus diingat.
3. Satu tips agar tidak tertukar dengan jawaban mirip.
Format paragraf/daftar singkat, tanpa basa-basi pembuka.`;

  const { text } = await generateText({
    model: google("gemini-2.5-flash"),
    prompt,
    maxOutputTokens: 600,
  });

  return Response.json({ explanation: text });
}
