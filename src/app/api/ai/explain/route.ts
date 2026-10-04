import { generateText } from "ai";
import { GEMINI_MODEL_ID, getGemini } from "@/lib/ai";

export const maxDuration = 60;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 15;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  entry.count += 1;
  return false;
}

const SYSTEM_PROMPT = `Anda adalah tutor ahli seleksi CPNS (SKD) yang objektif, presisi, dan berpijak teguh pada kunci jawaban dan pembahasan resmi yang diberikan.
Pedoman penilaian:
1. Kunci jawaban dan pembahasan resmi dari sistem adalah acuan mutlak. Jangan menyangkal atau mengubah kunci jawaban.
2. Untuk TWK: Kutip nama undang-undang, pasal, atau butir Pancasila yang relevan secara faktual. Jangan mengarang pasal atau nomor undang-undang fiktif.
3. Untuk TIU: Jabarkan alur logika deduktif atau hitungan matematis langkah demi langkah secara ringkas dan runtut.
4. Untuk TKP: Jelaskan nilai integritas, pelayanan publik, atau profesionalisme ASN yang membuat opsi kunci berbobot 5 poin dibanding opsi lain.
5. Gaya penyampaian: Lugas, santun, terstruktur, tanpa basa-basi pembuka.`;

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { explanation: "Fitur AI belum aktif. Pasang GEMINI_API_KEY di .env.local lalu restart server." },
      { status: 200 },
    );
  }

  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "default-client";

  if (isRateLimited(clientIp)) {
    return Response.json(
      {
        explanation:
          "Batas permintaan AI tercapai (maksimal 15 per menit). Mohon tunggu beberapa saat sebelum meminta penjelasan lagi.",
      },
      { status: 429 },
    );
  }

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

  const prompt = `Pembedah soal tes CPNS kategori ${body.category} berikut:

Soal: ${body.question}

Pilihan:
${ops}

Pembahasan resmi: ${body.explanation}

Buat penjelasan maksimal 150 kata:
1. Mengapa jawaban kunci bernilai itu dan mengapa pilihan user kurang tepat (jika user salah).
2. Konsep inti atau dasar hukum/rumus yang harus diingat.
3. Tips praktis agar tidak terkecoh jawaban mirip.`;

  try {
    const { text } = await generateText({
      ...getGemini(),
      system: SYSTEM_PROMPT,
      prompt,
      maxOutputTokens: 600,
    });

    // Model ikut dikirim agar client bisa mencatatnya ke kuota harian.
    return Response.json({ explanation: text, model: GEMINI_MODEL_ID });
  } catch {
    return Response.json(
      { explanation: "Gagal memproses penjelasan dengan AI saat ini. Gunakan pembahasan resmi yang tertera." },
      { status: 500 },
    );
  }
}
