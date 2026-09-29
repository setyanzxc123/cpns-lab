import type { Question } from "@/lib/types";

// TKP: tidak ada jawaban salah. Setiap opsi bernilai 1-5 poin
// (urutan nilai mengikuti urutan opsi, standar penilaian BKN).

export const tkpQuestions: Question[] = [
  {
    id: "TKP-001",
    category: "TKP",
    sub: "Pelayanan Publik",
    text: "Seorang warga datang dengan marah karena pengurusan suratnya telah tertunda lebih dari sebulan. Sikap Anda sebagai petugas loket:",
    options: [
      { text: "Mendengarkan keluhannya dengan tenang, memeriksa status berkas, lalu menjelaskan penyebab dan solusinya" },
      { text: "Mencatat nomor kontak warga dan berjanji mengabari perkembangan berkasnya dalam waktu 1x24 jam" },
      { text: "Meminta warga tenang dan menunggu di ruang tunggu sementara Anda menanyakan ke bagian verifikasi" },
      { text: "Menyalahkan keterlambatan pada bagian lain agar tidak terkesan kelalaian Anda pribadi" },
      { text: "Membalas nada bicaranya agar warga menghentikan emosinya di depan antrean" },
    ],
    points: [5, 4, 3, 2, 1],
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
      { text: "Menerima tugas tersebut sambil berkonsultasi secara intensif dengan rekan kerja yang kompeten" },
      { text: "Menerima sambil berharap atasan mengganti tugas itu nantinya" },
      { text: "Menerima tetapi mengerjakan seadanya sesuai batas kemampuan lama" },
      { text: "Menolak dengan alasan bukan bidang keahlian Anda" },
    ],
    points: [5, 4, 3, 2, 1],
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
      { text: "Mengajaknya berdiskusi santai di luar jam kerja untuk membangun kedekatan emosional" },
      { text: "Melaporkan kendala kerja sama tim kepada atasan agar dicarikan solusi bersama" },
      { text: "Mengerjakan bagian tim itu sendiri tanpa melibatkannya agar target tetap tercapai" },
      { text: "Menegurnya di depan seluruh anggota tim agar merasa malu dan berubah" },
    ],
    points: [5, 4, 3, 2, 1],
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
      { text: "Mengumumkan estimasi waktu perbaikan secara transparan kepada warga yang sedang antre" },
      { text: "Mengarahkan warga untuk memanfaatkan layanan mandiri jika memungkinkan" },
      { text: "Meminta semua warga pulang dan kembali besok saat sistem sudah normal" },
      { text: "Menyalahkan bagian TIK di hadapan warga yang sedang menunggu" },
    ],
    points: [5, 4, 3, 2, 1],
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
      { text: "Menyampaikan kepada atasan bahwa Anda siap mem-backup tugasnya selama rekan beribadah" },
      { text: "Bersikap biasa saja tanpa mendukung ataupun melarang" },
      { text: "Mengizinkan tetapi terlihat kesal karena pekerjaan bertambah" },
      { text: "Memintanya menunda ibadah sampai jam pulang kantor" },
    ],
    points: [5, 4, 3, 2, 1],
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
      { text: "Melaporkan aktivitas tersebut kepada bagian kepegawaian atau atasan secara formal" },
      { text: "Keluar dari grup kantor agar pikiran tidak terganggu oleh konten kebencian" },
      { text: "Membalas di grup dengan kata-kata keras agar semua orang tahu kontennya salah" },
      { text: "Mengabaikannya dan menganggap hal tersebut urusan pribadi masing-masing" },
    ],
    points: [5, 4, 3, 2, 1],
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
      { text: "Membantu mengecek apakah dokumen tersebut bisa diverifikasi melalui data kependudukan digital" },
      { text: "Mengembalikan berkasnya secara santun dan memintanya datang kembali dengan syarat lengkap" },
      { text: "Memproses tetap tanpa syarat itu karena merasa kasihan kepada lansia" },
      { text: "Menyarankan memakai jasa pihak ketiga atau calo agar prosesnya tidak merepotkan" },
    ],
    points: [5, 4, 3, 2, 1],
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
      { text: "Mempelajari regulasi atau materi baru terkait pengembangan kompetensi kedinasan" },
      { text: "Merapikan arsip kerja dan menyusun daftar rencana kerja untuk esok hari" },
      { text: "Menunggu jam kerja berakhir sambil santai membaca berita non-pekerjaan" },
      { text: "Pulang lebih awal tanpa izin karena semua tugas harian sudah beres" },
    ],
    points: [5, 4, 3, 2, 1],
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
      { text: "Mengajak keduanya berdiskusi dengan kepala dingin untuk memetakan beban kerja masing-masing" },
      { text: "Menyarankan keduanya membawa masalah ini ke atasan agar diputuskan secara resmi" },
      { text: "Menghindari keduanya agar Anda tidak terseret dalam konflik pribadi" },
      { text: "Memihak rekan yang lebih senior tanpa mendengarkan penjelasan pihak lainnya" },
    ],
    points: [5, 4, 3, 2, 1],
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
      { text: "Mempelajari buku panduan dan mencoba fitur-fiturnya secara mandiri di luar jam sibuk" },
      { text: "Menunggu pelatihan resmi dari bagian IT sambil mengamati rekan yang sudah paham" },
      { text: "Meminta rekan lain mengerjakan bagian yang berkaitan dengan aplikasi tersebut" },
      { text: "Tetap memakai cara kerja manual sampai sistem lama benar-benar dimatikan" },
    ],
    points: [5, 4, 3, 2, 1],
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
      { text: "Menjalin komunikasi yang akrab dengan tokoh masyarakat untuk mempercepat proses adaptasi" },
      { text: "Bergaul sewajarnya dalam batas kedinasan tanpa mencampuri urusan budaya warga" },
      { text: "Membatasi interaksi sosial di luar jam kantor karena merasa kurang nyaman" },
      { text: "Memaksakan norma kebiasaan daerah asal Anda kepada rekan kantor setempat" },
    ],
    points: [5, 4, 3, 2, 1],
    explanation:
      "Sensitivitas sosial-budaya: beradaptasi dengan tulus, mempelajari budaya lokal, dan menghormati masyarakat tempat bertugas.",
  },
  {
    id: "TKP-013",
    category: "TKP",
    sub: "Anti Radikalisme",
    text: "Seorang kenalan mengajak Anda bergabung ke organisasi yang sering mengajarkan antipati terhadap pemerintah dan menolak pandangan lain. Anda:",
    options: [
      { text: "Menolak dengan halus dan tegas, serta mengingatkannya tentang bahaya intoleransi" },
      { text: "Menolak ajakan tersebut dan menjauhkan diri dari aktivitas kelompok tersebut" },
      { text: "Menolak sambil memberikan alasan kesibukan kerja agar hubungan pertemanan tidak retak" },
      { text: "Mengikuti pertemuannya sesekali hanya untuk mengetahui seberapa jauh ajarannya" },
      { text: "Menerima ajakan tersebut karena merasa sungkan dengan kenalan lama" },
    ],
    points: [5, 4, 3, 2, 1],
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
      { text: "Segera mencetak ulang dokumen yang benar dan mengabari warga sebelum dokumen sempat digunakan" },
      { text: "Memperbaiki dokumen secara mandiri tanpa memberi tahu atasan agar tidak menimbulkan kepanikan" },
      { text: "Menunggu warga komplain terlebih dahulu baru melakukan proses revisi" },
      { text: "Menyalahkan aplikasi komputer yang dianggap sering mengalami bug sistem" },
    ],
    points: [5, 4, 3, 2, 1],
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
      { text: "Berkoordinasi dengan rekan setim untuk mendelegasikan sebagian pekerjaan yang memungkinkan" },
      { text: "Mengerjakan tugas pimpinan terlebih dahulu lalu lembur menyelesaikan laporan rapat" },
      { text: "Mengerjakan keduanya secara terburu-buru sehingga kualitas hasilnya kurang optimal" },
      { text: "Menolak tugas mendadak dengan alasan beban kerja laporan rapat sudah sangat padat" },
    ],
    points: [5, 4, 3, 2, 1],
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
      { text: "Memberikan penguatan data teknis pada ide tersebut sehingga peran Anda tetap diakui tim" },
      { text: "Membicarakan hal ini secara empat mata dengan rekan tersebut setelah rapat selesai" },
      { text: "Menegur rekan tersebut secara langsung di tengah jalannya presentasi rapat" },
      { text: "Memilih diam dan memutuskan untuk tidak akan pernah menyumbang ide lagi di masa depan" },
    ],
    points: [5, 4, 3, 2, 1],
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
      { text: "Mengusulkan penggunaan scanner otomatis berkecepatan tinggi dan software OCR untuk mempercepat" },
      { text: "Membagi dokumen dalam kelompok tahun dan mengerjakannya secara berurutan" },
      { text: "Mengerjakan arsip yang paling mudah terlebih dahulu dan membiarkan yang sulit" },
      { text: "Meminta penambahan waktu pengerjaan sebelum mulai mencoba mengeksekusi tugas" },
    ],
    points: [5, 4, 3, 2, 1],
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
      { text: "Hadir membantu semampu Anda dan berbaur secara akrab dengan para tetangga" },
      { text: "Menyumbang konsumsi atau dana kegiatan jika berhalangan hadir secara fisik" },
      { text: "Datang sebentar hanya untuk memenuhi undangan lalu segera pulang" },
      { text: "Memilih tidak hadir karena hari libur adalah hak privasi pribadi Anda" },
    ],
    points: [5, 4, 3, 2, 1],
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
      { text: "Menjelaskan upaya-upaya positif pemerintah yang telah berhasil dan mengajak berpikir konstruktif" },
      { text: "Mengalihkan obrolan ke topik lain yang lebih aman dan tidak memicu perdebatan" },
      { text: "Mendebatnya secara emosional dan mengancam akan memutus hubungan pertemanan" },
      { text: "Menyetujui semua keluhannya agar suasana obrolan tetap akrab dan tidak berkonflik" },
    ],
    points: [5, 4, 3, 2, 1],
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
      { text: "Menjelaskan keunggulan metode Anda kepada auditor dan meminta izin tertulis untuk menerapkannya" },
      { text: "Menerapkan SOP resmi secara penuh dan meninggalkan cara kerja alternatif tersebut" },
      { text: "Tetap mempertahankan cara sendiri secara diam-diam karena terbukti lebih cepat" },
      { text: "Menerapkan SOP hanya saat tim pemeriksa atau auditor sedang berada di kantor" },
    ],
    points: [5, 4, 3, 2, 1],
    explanation:
      "Kepatuhan pada aturan sekaligus semangat perbaikan: patuh pada SOP yang berlaku dan mengusulkan penyempurnaan melalui jalur resmi, bukan memotong jalurnya.",
  },
];
