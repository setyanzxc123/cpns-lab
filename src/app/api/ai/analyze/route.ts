import { generateText } from "ai";
import { getGemini } from "@/lib/ai";

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
  subMastery: { sub: string; category: string; acc: number; attempts: number }[];
  weeklyAccuracy: { week: string; pct: number }[];
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
  const data: AnalyzeInput = await req.json();

  // Hemat token: hanya ringkasan agregat yang dikirim, bukan mentahannya
  const prompt = `Anda analis persiapan CPNS. Berdasarkan data berikut, buat:
1. **Ringkasan capaian** (3-4 kalimat).
2. **Titik lemah & kekuatan** per subkategori (sebutkan yang persentase rendah <60%).
3. **Rencana belajar 7 hari** yang konkret: tabel sederhana Hari | Fokus | Aktivitas | Target.

Data riwayat (terbaru dulu):
${JSON.stringify(data.history.slice(0, 10))}

Akurasi per subkategori (akumulasi semua waktu):
${JSON.stringify(data.subAccuracy)}

Kemampuan saat ini per sub (berbobot — hasil terbaru lebih dominan):
${JSON.stringify(data.subMastery)}

Akurasi mingguan (tren, lama → baru):
${JSON.stringify(data.weeklyAccuracy)}

Soal salah tertunda: ${data.wrongCount}

Bahas tren mingguan dan perbandingan kemampuan berbobot vs akumulasi dalam
analisismu (mis. "naik/turun", "membaik", "perlu dipertahankan").
Bahasa Indonesia, maksimal 450 kata, langsung ke isi.`;

  const { text, finishReason } = await generateText({
    ...getGemini({ defaultThinking: "low" }),
    prompt,
    maxOutputTokens: 4096,
  });
  console.log("[ai/analyze] finish reason:", finishReason);

  return Response.json({
    report:
      finishReason === "length"
        ? `${text}

_Analisis terpotong karena batas token — coba lagi untuk hasil yang lebih ringkas._`
        : text,
  });
}
