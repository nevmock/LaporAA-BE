function randomResponse(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function mintaKeluhan() {
  const responses = [
    `Terima kasih atas keluhannya. Apakah ada keluhan tambahan? Jika masih ada, silakan lanjutkan tulis keluhan Anda. Namun, jika sudah cukup, ketik *kirim*.\n\nAtau tulis *menu* untuk kembali ke menu utama.`,
    `Terima kasih atas keluhannya. Silakan tambahkan keluhan lain, atau ketik *kirim* jika sudah selesai.\n\nAtau tulis *menu* untuk kembali ke menu utama.`,
    `Terima kasih atas keluhannya. Tulis lagi keluhan tambahan Anda jika ada, atau ketik *kirim* untuk lanjut.\n\nAtau ketik *menu* untuk kembali ke menu utama.`,
    `Terima kasih atas keluhannya. Jika masih ada keluhan, silakan tulis keluhan tambahan Anda. Jika cukup ketik *kirim* untuk melanjutkan.\n\nAtau ketik *menu* untuk kembali ke menu utama.`,
    `Terima kasih atas keluhannya. Ketik *kirim* jika keluhan sudah lengkap. Jika belum tulis lagi untuk menambah keluhan Anda.\n\nAtau ketik *menu* untuk kembali ke menu utama.`,
  ];
  return randomResponse(responses);
}

function keluhanDitambahkan() {
  const responses = [
    `Keluhan telah ditambahkan. Jika ada lagi, silakan lanjut tulis keluhan. Jika cukup, ketik *kirim*.\n\nAtau ketik *menu* untuk kembali ke menu utama.`,
    `Keluhan berhasil ditambahkan. Tulis lagi jika masih ada, atau ketik *kirim* jika dirasa cukup.\n\nAtau ketik *menu* untuk kembali ke menu utama.`,
    `Keluhan Anda sudah dicatat. Tulis lagi jika masih ada atau ketik *kirim* jika selesai.\n\nAtau ketik *menu* untuk kembali ke menu utama.`,
    `Kami sudah menambahkan keluhan Anda. Tambahkan lagi keluhannya jika ingin lanjut. Jika cukup, ketik *kirim* .\n\nAtau ketik *menu* untuk kembali ke menu utama.`,
    `Keluhan tambahan sudah masuk. Tulis lagi untuk menambah, atau ketik *kirim* jika selesai.\n\nJika ingin kembali ke menu utama, ketik *menu*.`,
  ];
  return randomResponse(responses);
}

function konfirmasiKeluhan(message) {
  const responses = [
    `Saya simpulkan keluhan anda sebagai berikut:\n\n*${message}*\n\nJika sudah sesuai, ketik *kirim* untuk lanjut ke proses berikutnya, atau ketik *batal* untuk mengulang.`,
    `Berikut ringkasan keluhan Anda:\n\n*${message}*\n\nKetik *kirim* jika sudah benar, atau ketik *batal* untuk mengulang.`,
    `Keluhan Anda adalah:\n\n*${message}*\n\nKetik *kirim* untuk melanjutkan proses pelaporan, atau ketik *batal* untuk mengulang.`,
    `Ringkasan keluhan Anda ialah:\n\n*${message}*\n\nKetik *kirim* jika sudah sesuai, atau ketik *batal* untuk mengulang.`,
    `Keluhan yang tercatat adalah:\n\n*${message}*\n\nKetik *kirim* untuk lanjut proses melapornya, atau ketik *batal* untuk mengulang.`,
  ];
  return randomResponse(responses);
}

function laporanDibatalkan(sapaan, nama) {
  const responses = [
    `Baik ${sapaan} ${nama}, laporan telah dibatalkan. Ketik *menu* untuk memulai kembali.`,
    `Laporan Anda dibatalkan, ${sapaan} ${nama}. Silakan ketik *menu* untuk mulai ulang.`,
    `Laporan telah dibatalkan, ${sapaan} ${nama}. Jika ingin memulai ulang, ketik *menu*`,
    `Proses laporan telah dibatalkan. Ketik *menu* untuk memulai ulang.`,
    `Laporan telah dibatalkan. Silakan mulai ulang dengan ketik *menu*, ${sapaan} ${nama}.`,
  ];
  return randomResponse(responses);
}

function ulangKeluhan(sapaan, nama) {
  const responses = [
    `Baik ${sapaan} ${nama}, silakan jelaskan kembali keluhan Anda.`,
    `Silakan tulis ulang keluhan Anda, ${sapaan} ${nama}.`,
    `Mohon tulis kembali keluhan Anda, ${sapaan} ${nama}.`,
    `Ceritakan ulang keluhan Anda, ${sapaan} ${nama}.`,
    `Silakan sampaikan kembali keluhan Anda, ${sapaan} ${nama}.`,
  ];
  return randomResponse(responses);
}

function konfirmasiAtauBatal() {
  const responses = [
    `Silakan ketik *kirim* jika sudah sesuai, atau *batal* untuk mengulang.`,
    `Ketik *kirim* jika sudah benar, atau *batal* untuk mengulang.`,
    `Jika sudah cukup, ketik *kirim*. Jika ingin mengulang, ketik *batal*.`,
    `Ketik *kirim* untuk lanjut, atau *batal* untuk mengulang.`,
    `Silakan dengan *kirim* jika dirasa cukup, atau ulangi dengan ketik *batal*.`,
  ];
  return randomResponse(responses);
}

function mintaLokasi(sapaan, nama) {
  const responses = [
    `Baik ${sapaan} ${nama}, silakan kirimkan *pin point lokasi kejadian* dengan menggunakan fitur *Kirim Lokasi/Share Loc WA* di WhatsApp.`,
    `Silakan kirim lokasi kejadian dengan fitur *Kirim Lokasi / Share Loc WA*, ${sapaan} ${nama}.`,
    `Mohon kirimkan lokasi kejadian melalui fitur *Kirim Lokasi / Share Loc WA*, ${sapaan} ${nama}.`,
    `Kirimkan lokasi kejadian dengan fitur *Kirim Lokasi / Share Loc WA* di WhatsApp, ${sapaan} ${nama}.`,
    `Silakan gunakan fitur *Kirim Lokasi / Share Loc WA* untuk mengirim lokasi kejadian, ${sapaan} ${nama}.`,
  ];
  return randomResponse(responses);
}

function lokasiBukanBekasi(sapaan, nama, kabupaten) {
  const responses = [
    `Terima kasih ${sapaan} ${nama}, namun laporan Anda *berada di luar wilayah Kabupaten Bekasi* (${
      kabupaten || 'wilayah tidak dikenal'
    }).`,
    `Mohon maaf, lokasi laporan Anda *bukan di area Kabupaten Bekasi* (${
      kabupaten || 'wilayah tidak dikenal'
    }).`,
    `Laporan Anda *tidak berada di Kabupaten Bekasi* (${
      kabupaten || 'wilayah tidak dikenal'
    }).`,
    `Lokasi laporan berada *di luar Kabupaten Bekasi* (${
      kabupaten || 'wilayah tidak dikenal'
    }).`,
    `Laporan Anda *bukan di wilayah Kabupaten Bekasi* (${
      kabupaten || 'wilayah tidak dikenal'
    }).`,
  ];
  return (
    randomResponse(responses) +
    `\n\nSilakan hubungi layanan pengaduan masyarakat di pemerintahan daerah setempat sesuai lokasi kejadian 🙏🏼`
  );
}

function lokasiDiterima(wilayah) {
  const responses = [
    `Berikut lokasi yang Anda kirim:\n\n${wilayah.desa}, ${wilayah.kecamatan}, KABUPATEN ${wilayah.kabupaten}.\n\nKetik *kirim* jika sudah sesuai, atau ketik *batal* untuk kirim ulang.`,
    `Lokasi diterima, lokasi ada di:\n\n${wilayah.desa}, ${wilayah.kecamatan}, KABUPATEN ${wilayah.kabupaten}.\n\nKetik *kirim* jika benar, atau ketik *batal* untuk mengulang.`,
    `Lokasi kejadian di:\n\n${wilayah.desa}, ${wilayah.kecamatan}, KABUPATEN ${wilayah.kabupaten}.\n\nKetik *kirim* jika sudah sesuai, ketik *batal* untuk mengirim ulang.`,
    `Lokasi sudah kami terima, lokasinya di:\n\n${wilayah.desa}, ${wilayah.kecamatan}, KABUPATEN ${wilayah.kabupaten}.\n\nJika sudah benar ketik *kirim*, jika belum ketik *batal*`,
    `Lokasi kejadian:\n\n${wilayah.desa}, ${wilayah.kecamatan}, KABUPATEN ${wilayah.kabupaten}.\n\nKetik *kirim* jika benar, atau ketik *batal* untuk ulang.`,
  ];
  return randomResponse(responses);
}

function mintaFoto() {
  const responses = [
    `Silakan kirim *1–3 foto* untuk bukti. Cek kembali apakah foto yang akan dikirim sudah jelas dan relevan.`,
    `Mohon kirimkan 1 sampai 3 foto bukti yang relevan.`,
    `Kirimkan foto bukti (maksimal 3), dan pastikan fotonya jelas.`,
    `Silakan sertakan foto bukti, minimal 1 foto dan maksimal 3 foto.`,
    `Kirimkan 1-3 foto untuk bukti laporan Anda.`,
  ];
  return randomResponse(responses);
}

function ulangLokasi() {
  const responses = [
    `Silakan kirim ulang lokasi kejadian dengan fitur *Kirim Lokasi* di WhatsApp.`,
    `Mohon kirim ulang lokasi kejadian menggunakan fitur *Kirim Lokasi*.`,
    `Kirim ulang lokasi kejadian dengan fitur *Kirim Lokasi* di WhatsApp.`,
    `Silakan ulangi pengiriman lokasi dengan fitur *Kirim Lokasi*.`,
    `Mohon ulangi, kirim lokasi kejadian menggunakan fitur *Kirim Lokasi*.`,
  ];
  return randomResponse(responses);
}

function konfirmasiLokasi() {
  const responses = [
    `Ketik *kirim* jika lokasi sudah benar, atau ketik *batal* untuk kirim ulang.`,
    `Jika lokasi sudah sesuai, ketik *kirim*. Jika ingin mengulang, ketik *batal*.`,
    `Konfirmasi lokasi dengan ketik *kirim*, atau ulangi dengan ketik *batal*.`,
    `Ketik *kirim* untuk lanjut, atau ketik *batal* untuk ulang lokasi.`,
    `Silakan ketik *kirim* jika lokasi sudah benar, atau ketik *batal* untuk ulang.`,
  ];
  return randomResponse(responses);
}

function minimalFoto(sapaan, nama) {
  const responses = [
    `Mohon maaf ${sapaan} ${nama}, minimal perlu 1 foto bukti sebelum melanjutkan.`,
    `Minimal 1 foto bukti diperlukan untuk melanjutkan melapor, ${sapaan} ${nama}.`,
    `Anda harus mengirimkan setidaknya 1 foto bukti, ${sapaan} ${nama}.`,
    `Anda tidak bisa melanjutkan jika tidak menyertakan foto bukti, ${sapaan} ${nama}.`,
    `Mohon kirim minimal 1 foto bukti, ${sapaan} ${nama}.`,
  ];
  return randomResponse(responses);
}

function ringkasanLaporan(session) {
  const responses = [
    `Berikut ringkasan laporan Anda:\n\n📍 *Lokasi:* ${session.location.desa}, ${session.location.kecamatan}, ${session.location.kabupaten}\n\n📝 *Keluhan:*\n${session.message}\n\n📷 *Jumlah Foto:* ${session.photos.length}\n\nJika sudah benar, ketik *konfirmasi*. Jika ingin mengirim ulang, ketik *batal*.`,
    `Ringkasan laporan:\n\n*Lokasi:* ${session.location.desa}, ${session.location.kecamatan}, ${session.location.kabupaten}\n\n*Keluhan:*\n${session.message}\n\n*Jumlah Foto:* ${session.photos.length}\n\nKetik *konfirmasi* jika sudah konfirmasi laporannya, atau ketik *batal* untuk mengulang.`,
    // `Cek kembali laporan Anda:\n\n*Lokasi:* ${session.location.desa}, ${session.location.kecamatan}, ${session.location.kabupaten}\n\n*Keluhan:*\n${session.message}\n\n*Foto:* ${session.photos.length}\n\nKetik *benar* jika benar, atau ketik *salah* untuk mengulang kembali.`,
    // `Berikut detail laporan Anda:\n\n*Lokasi:* ${session.location.desa}, ${session.location.kecamatan}, ${session.location.kabupaten}\n\n*Keluhan:*\n${session.message}\n\n*Jumlah Foto:* ${session.photos.length}\n\nKetik *benar* jika sudah benar laporannya, atau ketik *salah* untuk mengulang.`,
    // `Laporan Anda adalah:\n\n*Lokasi:* ${session.location.desa}, ${session.location.kecamatan}, ${session.location.kabupaten}\n\n*Keluhan:*\n${session.message}\n\n*Foto:* ${session.photos.length}\n\nJika laporan sudah konfirmasi, ketik *konfirmasi*, atau ketik *salah* untuk mengulang kembali.`
  ];
  return randomResponse(responses);
}

function laporanDibatalkanMenu() {
  const responses = [
    `Laporan dibatalkan. Ketik *menu* untuk memulai kembali.`,
    `Proses pelaporan dibatalkan. Silakan ketik *menu* untuk mulai ulang.`,
    `Laporan telah dibatalkan. Ketik *menu* untuk memulai lagi.`,
    `Laporan dibatalkan. Silakan mulai ulang dengan ketik *menu*.`,
    `Laporan Anda telah dibatalkan. Ketik *menu* untuk mulai dari awal.`,
  ];
  return randomResponse(responses);
}

function hanyaFoto() {
  const responses = [
    `Pada tahap ini Anda harus *mengirim foto bukti*. Silakan kirim foto bukti.\n\nAtau ketik *menu* jika ingin memulai melapor dari awal.`,
    `Anda berada di tahap pengiriman foto bukti. Silakan *kirim foto bukti*.\n\nNamun, jika Anda ingin mengulang pelaporan dari awal, ketik *menu*.`,
    `Tolong *kirim hanya foto bukti* saja di tahap ini.\n\nNamun, jika Anda ingin melapor ulang dari awal, ketik *menu*`,
    `Mohon kirimkan *foto bukti* saja.\n\nTapi, jika Anda ingin membuat laporan dari awal lagi, silakan ketik *menu*`,
    `Anda diharuskan mengirim foto bukti di tahap ini. Silakan *kirim foto bukti*.\n\nJika Anda ingin mengulangi laporan dari awal, ketik *menu*`,
  ];
  return randomResponse(responses);
}

// function gagalProsesFoto() {
//   const responses = [
//     `Kami tidak dapat memproses foto tersebut. Coba kirim ulang menggunakan fitur "Kirim Foto".`,
//     `Foto gagal diproses. Silakan kirim ulang dengan fitur "Kirim Foto".`,
//     `Gagal memproses foto. Mohon kirim ulang fotonya.`,
//     `Foto tidak bisa diproses. Silakan coba lagi.`,
//     `Foto gagal diproses. Coba kirim ulang menggunakan fitur "Kirim Foto".`
//   ];
//   return randomResponse(responses);
// }

function sudah3Foto() {
  const responses = [
    `Kami telah menerima 3 foto bukti. Coba periksa kembali, apakah foto yang Anda kirim sudah sesuai?\n\nJika sudah cukup, ketik *kirim*, atau ketik *batal* untuk mengulang.`,
    `Sudah ada 3 foto bukti yang diterima.\n\nKetik *kirim* jika sudah cukup, atau *batal* untuk ulang.`,
    `3 foto bukti dari Anda sudah diterima.\n\nKetik *kirim* jika sudah benar, atau *batal* untuk ulang.`,
    `Kami sudah menerima 3 foto bukti.\n\nSilakan cek kembali, lalu ketik *kirim* jika sudah sesuai, atau *batal* jika ingin mengulang.`,
    `3 foto bukti berhasil diterima.\n\nKetik *kirim* jika sudah cukup, atau *batal* untuk ulang.`,
  ];
  return randomResponse(responses);
}

function fotoBerhasilDiterima(sisa) {
  const responses = [
    `Foto bukti berhasil diterima. Anda masih bisa mengirim ${sisa} foto lagi.\n\nKetik *kirim* jika sudah cukup, atau *batal* untuk mengulang.`,
    `Foto bukti sudah masuk. Anda masih bisa mengirim ${sisa} foto lagi.\n\nJika sudah cukup ketik *kirim*, jika ingin mengulang ketik *batal*`,
    `Foto bukti telah diterima. Sisa foto yang bisa dikirim: ${sisa}.\n\nKetik *kirim* jika sudah cukup, ketik *batal* jika ingin mengulang`,
    `Foto bukti sudah diterima. Anda masih bisa tambah ${sisa} foto lagi.\n\nJika cukup ketik *kirim*, jika ingin mengulang ketik *batal*`,
    `Foto bukti berhasil disimpan oleh kami. Anda masih bisa kirim ${sisa} foto lagi.\n\nJika cukup ketik *kirim*, jika ingin diulang ketik *batal*`,
  ];
  return randomResponse(responses);
}

function konfirmasiReview() {
  const responses = [
    `Ketik *konfirmasi* jika laporan sudah benar, atau *batal* untuk membatalkan.`,
    `Konfirmasi laporan dengan ketik *konfirmasi*, atau *batal* untuk membatalkan.`,
    `Jika laporan sudah benar, ketik *konfirmasi*. Jika ingin membatalkan, ketik *batal*.`,
    `Ketik *konfirmasi* untuk kirim laporan, atau *batal* untuk membatalkan.`,
    `Silakan ketik *konfirmasi* jika sudah benar, atau *batal* untuk membatalkan.`,
  ];
  return randomResponse(responses);
}

function laporanBerhasil(sapaan, nama, nomorLaporan) {
  const responses = [
    `Terima kasih ${sapaan} ${nama}, laporan berhasil dikirim dengan ID\n\n${nomorLaporan}\n\nSimpan ID ini untuk cek status laporan.`,
    `Laporan Anda sudah berhasil dikirim, ${sapaan} ${nama}. Berikut ID laporannya:\n\n${nomorLaporan}. Mohon simpan ID tersebut untuk mengecek status laporan di sesi lain.`,
    `Laporan berhasil dikirim. ID laporan Anda:\n\n${nomorLaporan}\n\nMohon simpan ID tersebut ${sapaan} ${nama}, untuk mengecek status laporan di sesi lain.`,
    `Terima kasih, laporan Anda sudah kami terima. Simpan ID berikut:\n\n${nomorLaporan}, untuk mengecek laporan di sesi lain.`,
    `Laporan berhasil dikirim. Simpan ID:\n\n${nomorLaporan}\n\nMohon disimpan ID tersebut ya ${sapaan} ${nama}, agar bisa mengecek laporan di sesi lain.`,
  ];
  return randomResponse(responses);
}

function gagalSimpanLaporan() {
  const responses = [
    `Terjadi kesalahan saat menyimpan laporan. Silakan ketik "reset" untuk mengulang.`,
    `Laporan gagal disimpan. Silakan coba lagi dengan ketik "reset".`,
    `Gagal menyimpan laporan. Silakan ulangi proses dengan "reset".`,
    `Ada kendala saat menyimpan laporan. Silakan ketik "reset" untuk mengulang.`,
    `Laporan tidak berhasil disimpan. Silakan coba lagi dengan "reset".`,
  ];
  return randomResponse(responses);
}

function ulangLaporan() {
  const responses = [
    `Laporan dibatalkan. Ketik *menu* untuk memulai dari awal.`,
    `Proses laporan dibatalkan. Silakan mulai ulang dengan ketik *menu*.`,
    `Laporan telah dibatalkan. Ketik *menu* untuk mulai dari awal.`,
    `Laporan Anda dibatalkan. Silakan mulai ulang dengan *menu*.`,
    `Laporan dibatalkan. Ketik *menu* untuk mulai ulang.`,
  ];
  return randomResponse(responses);
}

function handlerDefault() {
  const responses = [
    `Mohon ikuti langkah pelaporan sesuai instruksi.\n\nAgar sesuai instruksi, silahkan ketik *menu*.`,
    `Mohon ikuti arahan pelaporan.\n\nAgar sesuai dengan arahan, mohon ketik *menu*.`,
    `Silakan mengikuti tahapan pembuatan laporan.\n\nUntuk mengikuti tahapan tersebut, ketik *menu*.`,
    `Proses pembuatan laporan mesti sesuai dengan tahapan\n\nKetik *menu* untuk menyesuaikan.`,
    `Pelaporan mesti sesuai dengan proses pelaporan, mohon ketik *menu*.`,
    // `Pelaporan mesti sesuai dengan proses pelaporan, mohon ketik *menu*. (createReportResponse DEFAULT)`
  ];
  return randomResponse(responses);
}

function mediaDitambahkan(mediaType) {
  const mediaTypes = {
    image: "Gambar",
    video: "Video", 
    audio: "Audio",
    voice: "Pesan suara",
    document: "Dokumen",
    sticker: "Sticker"
  };
  
  const mediaName = mediaTypes[mediaType] || "File";
  
  const responses = [
    `${mediaName} telah ditambahkan ke keluhan Anda. Jika ada keluhan tambahan, silakan tulis lagi. Jika cukup, ketik *kirim*.\n\nAtau ketik *menu* untuk kembali ke menu utama.`,
    `${mediaName} berhasil dicatat. Tambahkan keluhan lain jika masih ada, atau ketik *kirim* jika dirasa cukup.\n\nAtau ketik *menu* untuk kembali ke menu utama.`,
    `${mediaName} sudah kami terima. Tulis keluhan tambahan jika ada, atau ketik *kirim* untuk melanjutkan.\n\nAtau ketik *menu* untuk kembali ke menu utama.`,
    `${mediaName} telah disimpan. Jika masih ada keluhan, silakan tulis lagi. Jika tidak, ketik *kirim*.\n\nAtau ketik *menu* untuk kembali ke menu utama.`,
  ];
  return randomResponse(responses);
}

module.exports = {
  mintaKeluhan,
  keluhanDitambahkan,
  konfirmasiKeluhan,
  laporanDibatalkan,
  ulangKeluhan,
  konfirmasiAtauBatal,
  mintaLokasi,
  lokasiBukanBekasi,
  lokasiDiterima,
  mintaFoto,
  ulangLokasi,
  konfirmasiLokasi,
  minimalFoto,
  ringkasanLaporan,
  laporanDibatalkanMenu,
  hanyaFoto,
  // gagalProsesFoto,
  sudah3Foto,
  fotoBerhasilDiterima,
  konfirmasiReview,
  laporanBerhasil,
  gagalSimpanLaporan,
  ulangLaporan,
  handlerDefault,
  mediaDitambahkan,
};
