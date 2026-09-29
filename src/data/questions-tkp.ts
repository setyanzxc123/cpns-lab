import type { Question } from "@/lib/types";

// TKP: tidak ada jawaban salah. Setiap opsi bernilai 1-5 poin
// (urutan nilai mengikuti urutan opsi, standar penilaian BKN).

export const tkpQuestions: Question[] = [
  {
    id: "TKP-001",
    category: "TKP",
    sub: "Pelayanan Publik",
    text: "Seorang warga datang dengan marah karena pengurusnya suratnya telah tertunda lebih dari sebulan. Sikap Anda sebagai petugas loket:",
    options: [
      { text: "Mendengarkan keluhannya dengan tenang, memeriksa status berkas, lalu menjelaskan penyebab dan solusinya", },
      { text: "Meminta warga tenang dan kembali besok karena sedang ramai" },
      { text: "Menyalahkan keterlambatan pada bagian lain agar tidak terkesan salah" },
      { text: "Membalas nada bicaranya agar warga menghentikan emosinya" },
      { text: "Meminta warga mengajukan keluhan resmi tanpa penjelasan lebih" },
    ],
    points: [5, 2, 1, 1, 3],
    explanation:
      "Kunci pelayanan prima: tetap tenang, mendengarkan aktif, cek fakta, lalu beri penjelasan dan solusi. Menyalahkan pihak lain atau membalas emosi memperburuk keadaan.",
  },
  {
    id: "TKP-002",
    category: "TKP",
    sub: "Pelayanan Publik",
    text: "Menjelang jam istirahat, datang warga yang telah menempuh perjalanan lima jam untuk mengurus dokumen. Anda akan:",
    options: [
      { text: "Melayaninya terlebih dahulu sampai selesai, walaupun sedikit melewati jam istirahat" },
      { text: "Memintanya menunggu hingga jam istirahat berakhir" },
      { text: "Memintanya kembali besok pagi agar sesuai jadwal" },
      { text: "Melayani sambil mempercepat proses agar bisa segera istirahat" },
      { text: "Menyuruhnya mendaftar ulang di sistem online" },
    ],
    points: [5, 3, 1, 4, 2],
    explanation:
      "Pelayanan publik mengutamakan kepentingan masyarakat. Melayani warga yang jauh datang sekalipun melewati jam istirahat adalah wujud empati dan komitmen layanan.",
  },
  {
    id: "TKP-003",
    category: "TKP",
    sub: "Profesionalisme",
    text: "Atasan memberi Anda tugas baru yang berada di luar bidang keahlian Anda. Sikap Anda:",
    options: [
      { text: "Menerima tugas, mempelajarinya dengan cepat, dan meminta arahan bila perlu" },
      { text: "Menerima sambil berharap atasan mengganti tugas itu nantinya" },
      { text: "Menolak dengan alasan bukan bidang Anda" },
      { text: "Menerima tetapi mengerjakan seadanya" },
      { text: "Meminta dibantu sepenuhnya oleh rekan yang ahli" },
    ],
    points: [5, 3, 1, 2, 2],
    explanation:
      "Profesionalisme dan kemauan belajar (willingness to learn) adalah nilai inti ASN. Menerima tugas baru dengan belajar cepat dan meminta arahan menunjukkan pertumbuhan diri.",
  },
  {
    id: "TKP-004",
    category: "TKP",
    sub: "Jejaring Kerja",
    text: "Ada rekan kerja yang selalu menolak diajak berkolaborasi sehingga pekerjaan tim terhambat. Anda akan:",
    options: [
      { text: "Mendekatinya secara personal untuk memahami alasannya lalu mencari titik temu" },
      { text: "Melaporkan sikapnya kepada atasan agar ditindak" },
      { text: "Mengerjakan bagian tim itu sendiri tanpa melibatkannya" },
      { text: "Membiarkannya dan menyesuaikan target dengan keadaan" },
      { text: "Menegurnya di depan tim agar berubah" },
    ],
    points: [5, 3, 2, 1, 1],
    explanation:
      "Membangun jejaring kerja dimulai dari komunikasi interpersonal. Pendekatan personal untuk memahami akar masalah lebih efektif daripada melaporkan atau menegur terbuka.",
  },
  {
    id: "TKP-005",
    category: "TKP",
    sub: "Teknologi Informasi",
    text: "Sistem informasi layanan online tiba-tiba padat/gangguan saat antrean warga membludak. Anda:",
    options: [
      { text: "Menerapkan prosedur cadangan manual sambil segera melaporkan gangguan ke bagian TIK" },
      { text: "Meminta semua warga pulang dan kembali besok" },
      { text: "Menunggu sampai sistem normal tanpa menginformasikan apa pun" },
      { text: "Menyalahkan bagian TIK di hadapan warga" },
      { text: "Menghentikan layanan sampai sistem diperbaiki" },
    ],
    points: [5, 2, 2, 1, 1],
    explanation:
      "Mastery of technology termasuk kesiapan prosedur cadangan: layanan tetap berjalan manual, gangguan dilaporkan cepat, dan warga diberi informasi yang jelas.",
  },
  {
    id: "TKP-006",
    category: "TKP",
    sub: "Sosial Budaya",
    text: "Rekan kerja Anda meminta izin menjalankan ibadah pada jam kerja sesuai ketentuan yang berlaku. Sikap Anda:",
    options: [
      { text: "Mendukung dan menghargai, sementara pekerjaan sementara dibagi dengan rekan lain" },
      { text: "Mengizinkan tetapi terlihat kesal karena pekerjaan bertambah" },
      { text: "Memintanya menunda ibadah sampai jam pulang" },
      { text: "Bersikap biasa saja tanpa mendukung ataupun melarang" },
      { text: "Meminta atasan yang mengambil keputusan" },
    ],
    points: [5, 2, 1, 3, 3],
    explanation:
      "Sensitivitas sosial-budaya dan sikap toleransi: mendukung hak beribadah rekan sesuai aturan dan menyesuaikan pembagian kerja secara sukarela.",
  },
  {
    id: "TKP-007",
    category: "TKP",
    sub: "Anti Radikalisme",
    text: "Anda menemukan rekan kerja rutin membagikan konten kebencian terhadap kelompok tertentu di grup pesan kantor. Sikap Anda:",
    options: [
      { text: "Mengingatkannya secara pribadi bahwa konten itu berbahaya dan tidak pantas dibagikan" },
      { text: "Membalas di grup agar semua orang tahu kontennya salah" },
      { text: "Mengabaikannya karena bukan urusan Anda" },
      { text: "Keluar dari grup agar tidak terpapar" },
      { text: "Melaporkannya langsung ke polisi" },
    ],
    points: [5, 2, 1, 2, 3],
    explanation:
      "Komitmen anti-kekerasan dan anti-radikalisme dimulai dari keberanian mengoreksi secara tepat: mengingatkan secara personal dan santun, tanpa memperpanjang konflik di grup.",
  },
  {
    id: "TKP-008",
    category: "TKP",
    sub: "Pelayanan Publik",
    text: "Warga lanjut usia mengurus izin namun satu syaratnya tidak lengkap dan belum bisa dibuat ulang hari itu. Anda:",
    options: [
      { text: "Menjelaskan syarat yang kurang, mencatat berkasnya, dan menginformasikan cara tercepat melengkapinya" },
      { text: "Mengembalikan berkasnya dan memintanya datang lengkap besok" },
      { text: "Memproses tetap tanpa syarat itu karena kasihan" },
      { text: "Memintanya meminta bantuan keluarganya saja" },
      { text: "Menyarankan memakai jasa calo agar cepat" },
    ],
    points: [5, 2, 1, 3, 1],
    explanation:
      "Empati harus tetap dalam koridor aturan: jelaskan kekurangan, bantu maksimal (catat, informasikan alur tercepat), tanpa melanggar prosedur dan tanpa membuka celah calo.",
  },
  {
    id: "TKP-009",
    category: "TKP",
    sub: "Profesionalisme",
    text: "Anda menyelesaikan tugas harian lebih cepat dari biasanya sehingga ada sisa waktu di kantor. Anda akan:",
    options: [
      { text: "Menawarkan bantuan kepada rekan yang sedang padat atau memperbaiki kualitas pekerjaan Anda" },
      { text: "Menghabiskan waktu berselancar di media sosial" },
      { text: "Pulang lebih awal karena tugas sudah selesai" },
      { text: "Menunggu jam kerja berakhir sambil santai" },
      { text: "Membuat kesibukan agar terlihat bekerja" },
    ],
    points: [5, 1, 1, 2, 1],
    explanation:
      "Komitmen tinggi pada organisasi: waktu produktif digunakan untuk membantu rekan atau meningkatkan mutu kerja, bukan menunggu atau pura-pura sibuk.",
  },
  {
    id: "TKP-010",
    category: "TKP",
    sub: "Jejaring Kerja",
    text: "Dua rekan kerja Anda berselisih soal pembagian tugas dan keduanya meminta Anda memihak. Anda:",
    options: [
      { text: "Mendengarkan kedua pihak secara netral lalu mengusulkan pembagian yang adil dan disepakati bersama" },
      { text: "Membela rekan yang lebih dekat dengan Anda" },
      { text: "Menghindari keduanya sampai konflik selesai" },
      { text: "Melaporkan kepada atasan tanpa mencoba meredakan" },
      { text: "Memihak yang tampak benar tanpa mendengar pihak lain" },
    ],
    points: [5, 1, 2, 3, 1],
    explanation:
      "Sinergi dan kerja sama: posisi netral, mendengar semua pihak, dan memfasilitasi solusi yang disepakati bersama menghasilkan kerja tim yang sehat.",
  },
  {
    id: "TKP-011",
    category: "TKP",
    sub: "Teknologi Informasi",
    text: "Instansi Anda menerapkan aplikasi kerja baru yang belum Anda kuasai. Anda:",
    options: [
      { text: "Mempelajari aplikasinya sampai mahir dan berbagi pengetahuan kepada rekan yang kesulitan" },
      { text: "Mempelajari secukupnya untuk keperluan sendiri" },
      { text: "Meminta rekan lain mengerjakan bagian yang berkaitan aplikasi itu" },
      { text: "Tetap memakai cara lama sampai dipaksa" },
      { text: "Menunggu pelatihan resmi dari instansi" },
    ],
    points: [5, 3, 1, 1, 2],
    explanation:
      "Mastery of technology: proaktif mendalami teknologi baru dan menjadi agen perubahan dengan membagikan kemampuannya ke rekan kerja.",
  },
  {
    id: "TKP-012",
    category: "TKP",
    sub: "Sosial Budaya",
    text: "Anda ditugaskan di daerah dengan adat dan bahasa yang sangat berbeda dari daerah asal Anda. Sikap Anda:",
    options: [
      { text: "Belajar kebiasaan dan bahasa lokal, serta beradaptasi sambil tetap menghormati aturan kerja" },
      { text: "Menghindari kontak dengan masyarakat setempat" },
      { text: "Membawa gaya hidup daerah asal dan memaksakannya di lingkungan baru" },
      { text: "Meminta segera dipindah ke daerah yang mirip daerah asal" },
      { text: "Mengikuti kebiasaan lokal hanya saat ada atasan yang melihat" },
    ],
    points: [5, 1, 1, 2, 2],
    explanation:
      "Sensitivitas sosial-budaya: beradaptasi dengan tulus, mempelajari budaya lokal, dan menghormati masyarakat tempat bertugas.",
  },
  {
    id: "TKP-013",
    category: "TKP",
    sub: "Anti Radikalisme",
    text: "Seorang kenalan mengajak Anda bergabung ke organisasi yang sering mengajarkan antipati terhadap pemerintah dan menolak pandangan lain. Anda:",
    options: [
      { text: "Menolak dengan halus dan tidak terlibat, serta membangun pemahaman yang seimbang" },
      { text: "Mengikuti dulu untuk tahu isi organisasinya" },
      { text: "Menerima ajakan agar tidak dianggap sombong" },
      { text: "Melaporkan kenalan itu ke media sosial" },
      { text: "Menghindari kenalan itu tanpa penjelasan" },
    ],
    points: [5, 2, 1, 3, 3],
    explanation:
      "Komitmen kebangsaan: menolak paham yang bertentangan dengan Pancasila dan NKRI, tetapi dengan cara santun dan tidak mudah terprovokasi.",
  },
  {
    id: "TKP-014",
    category: "TKP",
    sub: "Pelayanan Publik",
    text: "Anda menyadari telah salah memasukkan data sehingga dokumen warga terbit keliru. Anda:",
    options: [
      { text: "Segera mengakui kesalahan kepada atasan, menghubungi warga untuk meminta maaf, dan memperbaikinya" },
      { text: "Menunggu jika ada yang menemukan kesalahannya baru diperbaiki" },
      { text: "Memperbaiki diam-diam tanpa memberi tahu siapa pun" },
      { text: "Menyalahkan sistem yang rawan salah input" },
      { text: "Mengarahkan warga ke petugas lain agar tidak dikaitkan dengan Anda" },
    ],
    points: [5, 1, 2, 1, 1],
    explanation:
      "Integritas dan tanggung jawab: mengakui kesalahan secara transparan, meminta maaf kepada yang terdampak, dan segera memperbaiki.",
  },
  {
    id: "TKP-015",
    category: "TKP",
    sub: "Profesionalisme",
    text: "Hari yang sama Anda harus menyiapkan laporan untuk rapat esok dan menerima tugas mendadak dari pimpinan. Anda:",
    options: [
      { text: "Menilai urgensi keduanya, menyusun prioritas, dan mengomunikasikan penyesuaian jadwal bila perlu" },
      { text: "Mengerjakan tugas mendadak dan mengorbankan laporan tanpa memberi tahu siapa pun" },
      { text: "Mengerjakan yang paling mudah terlebih dahulu" },
      { text: "Menolak tugas mendadak karena sedang sibuk" },
      { text: "Mengerjakan keduanya seadanya agar cepat selesai" },
    ],
    points: [5, 2, 2, 1, 1],
    explanation:
      "Manajemen prioritas dan komunikasi: menilai urgensi-dampak, menyusun prioritas, dan mengomunikasikan konsekuensinya kepada pihak terkait.",
  },
  {
    id: "TKP-016",
    category: "TKP",
    sub: "Jejaring Kerja",
    text: "Ide yang Anda angkat dalam rapat dipresentasikan kembali oleh rekan seolah idenya. Sikap Anda:",
    options: [
      { text: "Tetap profesional, dan pada kesempatan yang tepat mengklarifikasi asal ide dengan santun" },
      { text: "Menyampaikan kekesalan Anda di depan semua orang" },
      { text: "Menyebarkan keluhan kepada rekan lain di belakangnya" },
      { text: "Berhenti menyampaikan ide di rapat berikutnya" },
      { text: "Membiarkannya dan menyimpan dendam diam-diam" },
    ],
    points: [5, 1, 1, 2, 1],
    explanation:
      "Kematangan emosi dan profesionalisme: konflik diselesaikan dengan komunikasi asertif yang tepat tempat, bukan dengan kebencian diam-diam atau drama terbuka.",
  },
  {
    id: "TKP-017",
    category: "TKP",
    sub: "Teknologi Informasi",
    text: "Anda diminta mendigitalisasi ribuan arsip lama dengan waktu terbatas. Anda:",
    options: [
      { text: "Menyusun urutan prioritas arsip yang paling sering dipakai, membuat alur kerja, lalu mengeksekusinya" },
      { text: "Memindai semua arsip berurutan dari rak pertama tanpa prioritas" },
      { text: "Menunggu tambahan petugas sebelum mulai bekerja" },
      { text: "Meminta perpanjangan waktu tanpa mencoba" },
      { text: "Mengerjakan sebagian kecil agar ada hasil yang dilaporkan" },
    ],
    points: [5, 2, 1, 1, 2],
    explanation:
      "Manajemen kerja berbasis teknologi: berpikir sistematis dengan prioritas data, alur kerja yang efisien, dan eksekusi yang terukur.",
  },
  {
    id: "TKP-018",
    category: "TKP",
    sub: "Sosial Budaya",
    text: "Di hari libur, masyarakat sekitar mengadakan kerja bakti membangun fasilitas kampung dan mengundang ASN setempat. Anda:",
    options: [
      { text: "Ikut serta karena mempererat hubungan dengan masyarakat sekaligus wujud kepedulian" },
      { text: "Tidak datang karena itu hari libur Anda" },
      { text: "Datang sebentar hanya untuk foto dokumentasi" },
      { text: "Mengirim sumbangan tanpa datang, lalu mempublikasikannya" },
      { text: "Datang jika ada surat resmi dari kelurahan" },
    ],
    points: [5, 1, 1, 2, 2],
    explanation:
      "Sinergi dengan masyarakat: keikutsertaan tulus dalam kegiatan sosial membangun kepercayaan publik terhadap ASN, sekalipun di luar jam kerja.",
  },
  {
    id: "TKP-019",
    category: "TKP",
    sub: "Anti Radikalisme",
    text: "Seorang teman sering berpendapat bahwa negara ini tidak adil dan semuanya salah, lalu menguji sikap Anda. Anda:",
    options: [
      { text: "Mendengarkan pandangannya, mengakui masalah yang nyata, dan menawarkan perspektif yang seimbang serta solusi" },
      { text: "Menyetujui semua pendapatnya agar hubungan tetap baik" },
      { text: "Membantah keras dan memutus komunikasi" },
      { text: "Menganggapnya lelucon dan tidak menanggapi" },
      { text: "Melaporkan teman Anda kepada atasannya" },
    ],
    points: [5, 1, 2, 1, 3],
    explanation:
      "Kritik wajar terhadap kebijakan berbeda dengan paham anti-negara. Sikap sehat: mendengar, memilah yang nyata, memberi perspektif seimbang dan membangun, tanpa setuju buta atau memutus silaturahmi.",
  },
  {
    id: "TKP-020",
    category: "TKP",
    sub: "Profesionalisme",
    text: "Audit menemukan cara kerja Anda berbeda dari SOP, walaupun hasilnya selalu baik. Sikap Anda:",
    options: [
      { text: "Mengembalikan cara kerja sesuai SOP dan mengusulkan perbaikan SOP lewat jalur yang ada" },
      { text: "Tetap memakai cara sendiri karena hasilnya terbukti baik" },
      { text: "Memakai cara SOP hanya saat ada pemeriksaan" },
      { text: "Meminta tim audit memaklumi cara kerja Anda" },
      { text: "Beralih ke SOP tanpa mengusulkan perbaikan apa pun" },
    ],
    points: [5, 1, 1, 2, 3],
    explanation:
      "Kepatuhan pada aturan sekaligus semangat perbaikan: patuh pada SOP yang berlaku dan mengusulkan penyempurnaan melalui jalur resmi, bukan memotong jalurnya.",
  },
];
