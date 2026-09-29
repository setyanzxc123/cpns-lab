import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const maxDuration = 60;

export interface AnalyzeInput {
  history: {
    date: string;
    mode: string;
    totalScore: number;
    maxScore: number;
    subScores: { category: string; correct: number; total: number; score: number; maxScore: number }[];
  }[];
  subAccuracy: { sub: string; category: string; correct: number; total: number; pct: number }[];
  wrongCount: number;
}

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      {
        report:
          "Fitur AI belum aktif. Pasang GEMINI_API_KEY di file .env.local lalu jalankan ulang server untuk menganalisis skor dengan Gemini.",
      },
      { status: 200 },
    );
  }
  const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
  const data: AnalyzeInput = await req.json();

  // Hemat token: hanya ringkasan agregat yang dikirim, bukan mentahannya
  const prompt = `Anda analis persiapan CPNS. Berdasarkan data berikut, buat:
1. **Ringkasan capaian** (3-4 kalimat).
2. **Titik lemah & kekuatan** per subkategori (sebutkan yang persentase rendah <60%).
3. **Rencana belajar 7 hari** yang konkret: tabel sederhana Hari | Fokus | Aktivitas | Target.

Data riwayat (terbaru dulu):
${JSON.stringify(data.history.slice(0, 10))}

Akurasi per subkategori:
${JSON.stringify(data.subAccuracy)}

Soal salah tertunda: ${data.wrongCount}

Bahasa Indonesia, maksimal 450 kata, langsung ke isi.`;

  const { text } = await generateText({
    model: google("gemini-2.5-flash"),
    prompt,
    maxOutputTokens: 1200,
  });

  return Response.json({ report: text });
}
