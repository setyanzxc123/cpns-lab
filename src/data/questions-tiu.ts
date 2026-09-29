import type { Question } from "@/lib/types";

export const tiuQuestions: Question[] = [
  // ================= VERBAL =================
  {
    id: "TIU-001",
    category: "TIU",
    sub: "Verbal",
    text: "SINONIM = KOMPETENSI",
    options: [{ text: "Kecakapan" }, { text: "Kompetisi" }, { text: "Kekayaan" }, { text: "Kewenangan" }],
    answer: 0,
    explanation:
      "Kompetensi berarti kecakapan/kemampuan untuk melakukan suatu pekerjaan. Kompetisi berarti persaingan — jangan tertukar karena bunyinya mirip.",
  },
  {
    id: "TIU-002",
    category: "TIU",
    sub: "Verbal",
    text: "SINONIM = ANONIM",
    options: [{ text: "Tanpa nama" }, { text: "Tidak jelas arah" }, { text: "Ternama" }, { text: "Tidak berguna" }],
    answer: 0,
    explanation:
      "Anonim = tidak dikenal namanya / tanpa nama jelas, misalnya surat anonim.",
  },
  {
    id: "TIU-003",
    category: "TIU",
    sub: "Verbal",
    text: "ANTONIM = OPTIMIS",
    options: [{ text: "Pesimis" }, { text: "Realistis" }, { text: "Antusias" }, { text: "Skeptis" }],
    answer: 0,
    explanation:
      "Optimis (yakin akan baiknya keadaan) lawan katanya pesimis (mudah mengira buruk).",
  },
  {
    id: "TIU-004",
    category: "TIU",
    sub: "Verbal",
    text: "ANTONIM = GERSANG",
    options: [{ text: "Kering" }, { text: "Subur" }, { text: "Kakai" }, { text: "Tandus" }],
    answer: 1,
    explanation:
      "Gersang (kering, tidak subur) lawan katanya subur. Kering dan tandus justru mirip arti dengan gersang (sinonim).",
  },
  {
    id: "TIU-005",
    category: "TIU",
    sub: "Verbal",
    text: "PETANI : CANGKUL = .... : ....",
    options: [
      { text: "Pemasak : Wajan" },
      { text: "Padi : Sawah" },
      { text: "Guru : Murid" },
      { text: "Tukang : Bangunan" },
    ],
    answer: 0,
    explanation:
      "Relasi: pelaku profesi dan alat utamanya. Petani menggunakan cangkul seperti pemasak menggunakan wajan.",
  },
  {
    id: "TIU-006",
    category: "TIU",
    sub: "Verbal",
    text: "SISWA : SEKOLAH = .... : ....",
    options: [
      { text: "Buku : Perpustakaan" },
      { text: "Pasien : Rumah Sakit" },
      { text: "Dokter : Apotek" },
      { text: "Kursi : Kantor" },
    ],
    answer: 1,
    explanation:
      "Relasi: orang dan tempat ia mendapatkan layanan/kegiatan utamanya. Siswa belajar di sekolah seperti pasien berobat di rumah sakit.",
  },
  {
    id: "TIU-007",
    category: "TIU",
    sub: "Verbal",
    text: "Manakah kata yang TIDAK sejenis dengan kelompoknya?",
    options: [{ text: "Emas" }, { text: "Perak" }, { text: "Berlian" }, { text: "Tembaga" }],
    answer: 2,
    explanation:
      "Emas, perak, dan tembaga adalah logam unsur. Berlian adalah mineral karbon (bukan logam).",
  },
  {
    id: "TIU-008",
    category: "TIU",
    sub: "Verbal",
    text: "Kalimat berikut yang paling EFEKTIF adalah:",
    options: [
      { text: "Untuk melakukan perjalanan ke luar kota, semua peserta dikumpulkan di halaman kantor." },
      { text: "Semua peserta dikumpulkan di halaman kantor untuk keperluan perjalanan ke luar kota." },
      { text: "Perjalanan ke luar kota oleh semua peserta akan dilakukan dari halaman kantor." },
      { text: "Di halaman kantor semua peserta yang akan ke luar kota dikumpulkannya." },
    ],
    answer: 1,
    explanation:
      "Kalimat efektif hemat kata, penghubung jelas, dan tidak mubazir. Opsi B paling lugas; opsi lain bertele-tele atau strukturnya kaku.",
  },
  {
    id: "TIU-009",
    category: "TIU",
    sub: "Verbal",
    text: "SINONIM = MITIGASI",
    options: [{ text: "Pengurangan risiko" }, { text: "Peningkatan mutu" }, { text: "Perpindahan lokasi" }, { text: "Pencatatan data" }],
    answer: 0,
    explanation:
      "Mitigasi berarti tindakan mengurangi dampak/risiko, umum dipakai dalam konteks bencana (mitigasi bencana).",
  },
  {
    id: "TIU-010",
    category: "TIU",
    sub: "Verbal",
    text: "ANTONIM = ABSTRAK",
    options: [{ text: "Teoretis" }, { text: "Konkret" }, { text: "Imajiner" }, { text: "Filosofis" }],
    answer: 1,
    explanation:
      "Abstrak (tidak tampak secara nyata) lawan katanya konkret (nyata, dapat diamati).",
  },

  // ================= NUMERIK =================
  {
    id: "TIU-011",
    category: "TIU",
    sub: "Numerik",
    text: "2, 6, 12, 20, 30, ...",
    options: [{ text: "36" }, { text: "40" }, { text: "42" }, { text: "44" }],
    answer: 2,
    explanation:
      "Selisih antar suku bertambah 2: +4, +6, +8, +10, maka berikutnya +12 → 30 + 12 = 42.",
  },
  {
    id: "TIU-012",
    category: "TIU",
    sub: "Numerik",
    text: "1, 4, 9, 16, ...",
    options: [{ text: "20" }, { text: "24" }, { text: "25" }, { text: "27" }],
    answer: 2,
    explanation: "Deret bilangan kuadrat: 1², 2², 3², 4², berikutnya 5² = 25.",
  },
  {
    id: "TIU-013",
    category: "TIU",
    sub: "Numerik",
    text: "2, 6, 18, 54, ...",
    options: [{ text: "108" }, { text: "132" }, { text: "162" }, { text: "216" }],
    answer: 2,
    explanation: "Deret geometri dengan rasio 3: 54 × 3 = 162.",
  },
  {
    id: "TIU-014",
    category: "TIU",
    sub: "Numerik",
    text: "5, 7, 10, 14, 19, ...",
    options: [{ text: "23" }, { text: "24" }, { text: "25" }, { text: "26" }],
    answer: 2,
    explanation: "Selisih: +2, +3, +4, +5, berikutnya +6 → 19 + 6 = 25.",
  },
  {
    id: "TIU-015",
    category: "TIU",
    sub: "Numerik",
    text: "Ali menyelesaikan pekerjaan dalam 6 hari, Beni dalam 3 hari. Jika bekerja bersama-sama, pekerjaan selesai dalam:",
    options: [{ text: "1 hari" }, { text: "2 hari" }, { text: "3 hari" }, { text: "4,5 hari" }],
    answer: 1,
    explanation:
      "Kecepatan gabungan = 1/6 + 1/3 = 1/2 pekerjaan per hari → selesai 1 ÷ 1/2 = 2 hari.",
  },
  {
    id: "TIU-016",
    category: "TIU",
    sub: "Numerik",
    text: "Setelah diskon 20%, harga sebuah tas menjadi Rp96.000. Harga tas sebelum diskon adalah:",
    options: [{ text: "Rp112.000" }, { text: "Rp115.200" }, { text: "Rp120.000" }, { text: "Rp125.000" }],
    answer: 2,
    explanation: "96.000 = 80% × harga awal → harga awal = 96.000 ÷ 0,8 = Rp120.000.",
  },
  {
    id: "TIU-017",
    category: "TIU",
    sub: "Numerik",
    text: "Rata-rata nilai 5 siswa adalah 80. Jika ditambah satu siswa, rata-ratanya menjadi 82. Nilai siswa ke-6 adalah:",
    options: [{ text: "88" }, { text: "90" }, { text: "92" }, { text: "94" }],
    answer: 2,
    explanation:
      "Jumlah awal = 5 × 80 = 400. Jumlah baru = 6 × 82 = 492. Nilai ke-6 = 492 − 400 = 92.",
  },
  {
    id: "TIU-018",
    category: "TIU",
    sub: "Numerik",
    text: "Jika x = 3, maka nilai dari 2x² − 4 adalah:",
    options: [{ text: "10" }, { text: "14" }, { text: "18" }, { text: "22" }],
    answer: 1,
    explanation: "2(3²) − 4 = 2 × 9 − 4 = 18 − 4 = 14.",
  },
  {
    id: "TIU-019",
    category: "TIU",
    sub: "Numerik",
    text: "Perbandingan uang Ani dan Budi adalah 3 : 5. Jika selisih uang mereka Rp12.000, uang Ani adalah:",
    options: [{ text: "Rp15.000" }, { text: "Rp18.000" }, { text: "Rp20.000" }, { text: "Rp24.000" }],
    answer: 1,
    explanation:
      "Selisih perbandingan = 5 − 3 = 2 → Rp12.000 : 2 = Rp6.000 per bagian. Uang Ani = 3 × 6.000 = Rp18.000.",
  },
  {
    id: "TIU-020",
    category: "TIU",
    sub: "Numerik",
    text: "Jumlah seluruh bilangan bulat dari 1 sampai 20 adalah:",
    options: [{ text: "190" }, { text: "200" }, { text: "210" }, { text: "220" }],
    answer: 2,
    explanation: "Rumus deret aritmetika: n(n+1)/2 = 20 × 21 ÷ 2 = 210.",
  },

  // ================= FIGURAL (SVG) =================
  {
    id: "TIU-021",
    category: "TIU",
    sub: "Figural",
    text: "Perhatikan deret gambar berikut. Gambar yang tepat untuk menggantikan tanda tanya adalah:",
    visual: {
      kind: "shape-series",
      shape: "arrow",
      count: 5,
      missing: 3,
      rotationStep: 45,
    },
    options: [
      { visual: { kind: "shape-single", shape: "arrow", rotation: 90 } },
      { visual: { kind: "shape-single", shape: "arrow", rotation: 135 } },
      { visual: { kind: "shape-single", shape: "arrow", rotation: 180 } },
      { visual: { kind: "shape-single", shape: "arrow", rotation: 225 } },
    ],
    answer: 1,
    explanation:
      "Panah berotasi searah jarum jam 45° tiap langkah: 0°, 45°, 90°, (135°), 180°. Panel ke-4 yang hilang adalah rotasi 135°.",
  },
  {
    id: "TIU-022",
    category: "TIU",
    sub: "Figural",
    text: "Perhatikan deret gambar berikut. Gambar yang tepat untuk menggantikan tanda tanya adalah:",
    visual: {
      kind: "shape-series",
      shape: "pentagon",
      count: 5,
      missing: 4,
      rotationStep: 72,
    },
    options: [
      { visual: { kind: "shape-single", shape: "pentagon", rotation: 144 } },
      { visual: { kind: "shape-single", shape: "pentagon", rotation: 216 } },
      { visual: { kind: "shape-single", shape: "pentagon", rotation: 288 } },
      { visual: { kind: "shape-single", shape: "pentagon", rotation: 0 } },
    ],
    answer: 2,
    explanation:
      "Segilima berputar 72° per langkah: 0°, 72°, 144°, 216°, (288°). Panel ke-5 = rotasi 288° (setara posisi penuh dikurangi 72°).",
  },
  {
    id: "TIU-023",
    category: "TIU",
    sub: "Figural",
    text: "Perhatikan deret gambar berikut. Jumlah titik pada gambar yang tepat untuk menggantikan tanda tanya adalah:",
    visual: {
      kind: "shape-series",
      shape: "triangle",
      count: 5,
      missing: 3,
      rotationStep: 0,
      dots: { start: 1, step: 1 },
    },
    options: [
      { visual: { kind: "shape-single", shape: "triangle", dots: 3 } },
      { visual: { kind: "shape-single", shape: "triangle", dots: 4 } },
      { visual: { kind: "shape-single", shape: "triangle", dots: 5 } },
      { visual: { kind: "shape-single", shape: "triangle", dots: 6 } },
    ],
    answer: 1,
    explanation:
      "Jumlah titik bertambah satu tiap panel: 1, 2, 3, (4), 5. Panel yang hilang memuat 4 titik.",
  },
  {
    id: "TIU-024",
    category: "TIU",
    sub: "Figural",
    text: "Perhatikan deret gambar berikut. Gambar yang tepat untuk menggantikan tanda tanya adalah:",
    visual: {
      kind: "shape-series",
      shape: "star",
      count: 5,
      missing: 2,
      rotationStep: 90,
    },
    options: [
      { visual: { kind: "shape-single", shape: "star", rotation: 0 } },
      { visual: { kind: "shape-single", shape: "star", rotation: 90 } },
      { visual: { kind: "shape-single", shape: "star", rotation: 180 } },
      { visual: { kind: "shape-single", shape: "star", rotation: 270 } },
    ],
    answer: 2,
    explanation:
      "Bintang berputar 90° tiap langkah: 0°, 90°, (180°), 270°, 0° kembali. Panel ke-3 = rotasi 180°.",
  },
  {
    id: "TIU-025",
    category: "TIU",
    sub: "Figural",
    text: "Perhatikan deret gambar berikut. Gambar yang tepat untuk menggantikan tanda tanya adalah:",
    visual: {
      kind: "shape-series",
      shape: "square",
      count: 5,
      missing: 1,
      rotationStep: 60,
    },
    options: [
      { visual: { kind: "shape-single", shape: "square", rotation: 30 } },
      { visual: { kind: "shape-single", shape: "square", rotation: 60 } },
      { visual: { kind: "shape-single", shape: "square", rotation: 120 } },
      { visual: { kind: "shape-single", shape: "square", rotation: 150 } },
    ],
    answer: 1,
    explanation:
      "Persegi berputar 60° per langkah: 0°, (60°), 120°, 180°, 240°. Panel ke-2 = rotasi 60°.",
  },
  {
    id: "TIU-026",
    category: "TIU",
    sub: "Figural",
    text: "Perhatikan deret gambar berikut. Gambar yang tepat untuk menggantikan tanda tanya adalah:",
    visual: {
      kind: "shape-series",
      shape: "flag",
      count: 5,
      missing: 4,
      rotationStep: 45,
      dots: { start: 3, step: 2 },
    },
    options: [
      { visual: { kind: "shape-single", shape: "flag", rotation: 135, dots: 9 } },
      { visual: { kind: "shape-single", shape: "flag", rotation: 180, dots: 11 } },
      { visual: { kind: "shape-single", shape: "flag", rotation: 180, dots: 13 } },
      { visual: { kind: "shape-single", shape: "flag", rotation: 225, dots: 11 } },
    ],
    answer: 1,
    explanation:
      "Bendera berotasi 45° per langkah (panel ke-5 = 180°) dan titik bertambah dua: 3, 5, 7, 9, (11). Jawaban: rotasi 180° dengan 11 titik.",
  },

  // ================= LOGIKA =================
  {
    id: "TIU-027",
    category: "TIU",
    sub: "Logika",
    text: "\"Jika hujan turun maka jalan basah.\" Jalan tidak basah, maka kesimpulannya:",
    options: [
      { text: "Hujan turun sedikit" },
      { text: "Jalan tidak hujan" },
      { text: "Hujan tidak turun" },
      { text: "Tidak dapat disimpulkan" },
    ],
    answer: 2,
    explanation:
      "Modus tollens: jika p → q dan ¬q, maka ¬p. Karena jalan tidak basah (¬q), hujan tidak turun (¬p).",
  },
  {
    id: "TIU-028",
    category: "TIU",
    sub: "Logika",
    text: "\"Semua pegawai di ruangan A memakai dasi. Rina memakai dasi.\" Kesimpulan yang tepat:",
    options: [
      { text: "Rina pasti pegawai ruangan A" },
      { text: "Rina bukan pegawai ruangan A" },
      { text: "Rina mungkin saja bukan pegawai ruangan A" },
      { text: "Semua pemakai dasi pegawai ruangan A" },
    ],
    answer: 2,
    explanation:
      "Pernyataan hanya berlaku satu arah (pegawai A ⊂ pemakai dasi). Orang di luar ruangan A juga bisa memakai dasi, jadi Rina tidak pasti — mungkin saja bukan pegawai ruangan A. Kesimpulan pasti adalah jebakan klasik.",
  },
  {
    id: "TIU-029",
    category: "TIU",
    sub: "Logika",
    text: "Andi lebih tinggi dari Budi. Budi lebih tinggi dari Cici. Dedi lebih pendek dari Cici. Siapa yang paling tinggi?",
    options: [{ text: "Budi" }, { text: "Andi" }, { text: "Cici" }, { text: "Dedi" }],
    answer: 1,
    explanation:
      "Urutan: Andi > Budi > Cici > Dedi. Yang paling tinggi adalah Andi.",
  },
  {
    id: "TIU-030",
    category: "TIU",
    sub: "Logika",
    text: "\"Semua siswa yang lolos wawancara diterima. Beberapa siswa tidak lolos wawancara.\" Kesimpulan:",
    options: [
      { text: "Semua siswa diterima" },
      { text: "Beberapa siswa tidak diterima" },
      { text: "Semua siswa yang diterima lolos wawancara" },
      { text: "Tidak ada siswa yang diterima" },
    ],
    answer: 1,
    explanation:
      "Yang lolos diterima; karena ada siswa yang tidak lolos, maka beberapa siswa pasti tidak diterima. Opsi C adalah konversi — tidak boleh ditarik otomatis.",
  },
];
