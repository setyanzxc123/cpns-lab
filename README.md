# CPNS Lab 🎓

Aplikasi web & Progressive Web App (PWA) untuk simulasi dan belajar tes Seleksi Kompetensi Dasar (SKD) Calon Pegawai Negeri Sipil (CPNS), mencakup kategori **TWK** (Tes Wawasan Kebangsaan), **TIU** (Tes Inteligensia Umum), dan **TKP** (Tes Karakteristik Pribadi).

---

## ✨ Fitur Utama

- **Simulasi Ujian Ala CAT BKN**
  - Tampilan dan feel meniru sistem CAT resmi (timer hitung mundur, navigasi grid soal, penanda ragu-ragu, auto-submit saat waktu habis).
  - Pilihan preset resmi BKN (105 soal), setengah paket, kuis cepat, atau kustom durasi & jumlah soal.
  - **Sesi pengerjaan persisten**: progres tersimpan otomatis sehingga bisa dilanjutkan jika browser tidak sengaja tertutup.
- **Mode Latihan Mandiri**
  - Kerjakan soal per kategori atau subkategori tanpa tekanan waktu.
  - Feedback instan: kunci jawaban dan pembahasan langsung tampil setelah opsi dipilih.
- **Soal Figural TIU Berbasis SVG**
  - Render bentuk figural secara matematis menggunakan SVG murni deklaratif (`VisualSpec`).
  - Gambar tajam di segala resolusi layar, tanpa perlu aset gambar eksternal/bitmap.
- **Statistik & Latih Ulang Soal Salah**
  - Rekap akurasi per subkategori untuk memetakan kekuatan dan kelemahan materi.
  - Basis data otomatis soal yang pernah dijawab salah untuk latihan remedial bertarget.
- **Tutor AI (Google Gemini 2.5 Flash)**
  - Chat interaktif streaming dengan tutor virtual berbahasa Indonesia.
  - Minta penjelasan detail per nomor soal pada halaman review.
  - Analisis tren performa dan rekomendasi jadwal belajar harian.
  - Keamanan terjamin: API key hanya berjalan di server (*server-only* route handler).
- **Bank Soal & Impor/Ekspor JSON**
  - Starter bank 80+ soal berbobot dan berpembahasan lengkap.
  - Fitur tambah soal kustom serta impor/ekspor bank soal berformat JSON.
- **PWA & Offline Ready**
  - Dapat diinstal di ponsel Android maupun desktop via Chrome/Edge.
  - Modul latihan & simulasi tetap dapat berjalan saat koneksi internet terputus.
- **Penyimpanan Fleksibel**
  - **Mode Tamu (Default)**: Berjalan 100% di browser pengguna via `localStorage` tanpa perlu setup backend atau akun.
  - **Mode Sinkronisasi (Supabase)**: Opsional login akun (Google / Email) untuk menyimpan riwayat dan bank soal lintas perangkat.

---

## 🚀 Memulai (Quick Start)

> [!IMPORTANT]
> **Selalu gunakan `pnpm`**. Jangan gunakan `npm` di proyek ini.

### 1. Prasyarat
- Node.js versi 18+ atau 20+
- `pnpm` (versi 9 atau 12)

### 2. Instalasi Dependensi
```bash
pnpm install
```

### 3. Konfigurasi Environment (`.env.local`)
Salin file contoh konfigurasi:
```bash
# Di Windows PowerShell:
Copy-Item .env.example .env.local

# Di Linux / macOS:
cp .env.example .env.local
```

Buka `.env.local` dan sesuaikan nilainya:
```env
# 1. Google Gemini API (untuk Tutor AI & pembahasan)
# Dapatkan gratis di: https://aistudio.google.com
GEMINI_API_KEY=AIzaSy...
NEXT_PUBLIC_HAS_GEMINI=1

# 2. Supabase (Opsional: jika ingin fitur login & sync multi-perangkat)
# Jika dikosongkan, app otomatis berjalan dalam Mode Tamu (localStorage)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
```

### 4. Menjalankan Server Pengembangan
```bash
pnpm dev
```
Akses aplikasi melalui browser di [http://localhost:3000](http://localhost:3000).

### 5. Build Produksi
```bash
pnpm build
pnpm start
```

---

## 🗄️ Setup Database Supabase (Opsional)

Jika ingin mengaktifkan sinkronisasi akun dan riwayat multi-perangkat:

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka menu **SQL Editor** pada dashboard Supabase.
3. Salin seluruh isi file [`supabase/schema.sql`](supabase/schema.sql) dan jalankan (**Run**). Script ini akan otomatis membuat tabel `exam_sessions`, `wrong_questions`, `custom_questions`, fungsi RPC `upsert_wrong_question`, serta mengonfigurasi Row Level Security (RLS).
4. Masuk ke **Project Settings -> API**, salin **Project URL** dan **anon public key**, lalu masukkan ke file `.env.local`.
5. Aktifkan provider autentikasi di menu **Authentication -> Providers** (mis. Google atau Email).

---

## 📄 Format JSON Bank Soal untuk Impor

Pengguna dapat mengimpor paket soal sendiri melalui menu **Bank Soal -> Impor Soal**. File harus berupa array JSON dari objek soal dengan skema berikut:

### Contoh Soal TWK / TIU (Skor Biner 0 atau 5)
```json
[
  {
    "id": "kustom-twk-01",
    "category": "TWK",
    "sub": "Pancasila",
    "question": "Rumusan sila-sila Pancasila yang sah dan resmi termaktub dalam...",
    "options": [
      { "letter": "A", "text": "Piagam Jakarta 22 Juni 1945" },
      { "letter": "B", "text": "Pembukaan UUD Negara Republik Indonesia 1945 alinea ke-4" },
      { "letter": "C", "text": "Dekrit Presiden 5 Juli 1959" },
      { "letter": "D", "text": "Ketetapan MPRS No. XX/MPRS/1966" },
      { "letter": "E", "text": "Batang Tubuh UUD 1945" }
    ],
    "answer": 1,
    "explanation": "Rumusan resmi Pancasila terdapat pada alinea ke-4 Pembukaan UUD 1945 yang disahkan oleh PPKI pada tanggal 18 Agustus 1945."
  }
]
```

### Contoh Soal TKP (Skor Gradasi 1 sampai 5)
```json
[
  {
    "id": "kustom-tkp-01",
    "category": "TKP",
    "sub": "Pelayanan Publik",
    "question": "Saat jam pelayanan hampir selesai, seorang lansia datang dengan dokumen yang belum lengkap...",
    "options": [
      { "letter": "A", "text": "Menolak melayani karena jam operasional segera berakhir." },
      { "letter": "B", "text": "Memintanya pulang dan datang kembali besok pagi dengan dokumen lengkap." },
      { "letter": "C", "text": "Menerima berkas yang ada dan memintanya melengkapi kekurangan besok tanpa harus mengantre ulang." },
      { "letter": "D", "text": "Membantunya memeriksa dokumen, menjelaskan kekurangannya secara jelas dan santun, serta memberikan formulir kelengkapan." },
      { "letter": "E", "text": "Meminta bantuan rekan kerja lain untuk mengurus karena Anda harus segera pulang." }
    ],
    "points": [1, 2, 4, 5, 3],
    "explanation": "Pilihan D memiliki nilai tertinggi (5) karena menunjukkan empati, keramahan, dan ketuntasan solusi kepada pengguna layanan publik."
  }
]
```

---

## 🌐 Panduan Deploy ke Vercel

Aplikasi ini siap di-deploy langsung ke Vercel:

1. Push kode ke repository GitHub/GitLab Anda.
2. Impor project ke [Vercel](https://vercel.com/new).
3. Di bagian **Environment Variables**, tambahkan:
   - `GEMINI_API_KEY`: API key dari Google AI Studio.
   - `NEXT_PUBLIC_HAS_GEMINI`: `1`
   - `NEXT_PUBLIC_SUPABASE_URL`: URL project Supabase Anda (jika pakai).
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon key Supabase Anda (jika pakai).
4. Klik **Deploy**. Aplikasi akan otomatis memiliki HTTPS dan dapat langsung diinstal sebagai PWA di perangkat Android Anda (*Add to Home Screen*).

---

## 🛠️ Generator Aset PWA

Ikon PWA dihasilkan secara mandiri tanpa dependensi grafis eksternal:
```bash
node scripts/generate-icons.mjs
```
File ikon PNG (192x192, 512x512, dan maskable 512x512) akan tersimpan di direktori `public/icons/`.

---

## 📜 Lisensi & Penafian

Aplikasi ini dikembangkan untuk tujuan pembelajaran mandiri. Soal-soal starter merupakan materi latihan edukatif orisinal dan bukan merupakan bocoran atau materi resmi dari Badan Kepegawaian Negara (BKN).
