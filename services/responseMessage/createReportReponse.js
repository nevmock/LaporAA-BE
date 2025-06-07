function randomResponse(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function mintaKeluhan() {
  const responses = [
    `Apakah ada keluhan tambahan? Jika sudah cukup, ketik "kirim".`,
    `Silakan tambahkan keluhan lain, atau ketik "kirim" jika sudah selesai.`,
    `Tulis keluhan tambahan jika ada, atau ketik "kirim" untuk lanjut.`,
    `Jika masih ada keluhan, silakan tulis. Jika sudah, ketik "kirim".`,
    `Ketik "kirim" jika keluhan sudah lengkap, atau tulis lagi untuk menambah.`
  ];
  return randomResponse(responses);
}

function keluhanDitambahkan() {
  const responses = [
    `Keluhan ditambahkan. Jika ada lagi, silakan tulis. Jika sudah cukup, ketik "kirim".`,
    `Keluhan berhasil ditambahkan. Tulis lagi jika masih ada, atau ketik "kirim".`,
    `Keluhan Anda sudah dicatat. Tambahkan lagi atau ketik "kirim" jika selesai.`,
    `Kami sudah menambahkan keluhan Anda. Ketik "kirim" jika sudah cukup.`,
    `Keluhan sudah masuk. Tulis lagi untuk menambah, atau "kirim" untuk lanjut.`
  ];
  return randomResponse(responses);
}

function konfirmasiKeluhan(message) {
  const responses = [
    `Saya simpulkan keluhan anda sebagai berikut: ${message}\nJika sudah sesuai, ketik "kirim" untuk lanjut ke lokasi kejadian, atau "batal" untuk mengulang.`,
    `Berikut ringkasan keluhan Anda: ${message}\nKetik "kirim" jika sudah benar, atau "batal" untuk mengulang.`,
    `Keluhan Anda: ${message}\nKetik "kirim" untuk lanjut, atau "batal" untuk mengulang.`,
    `Ringkasan keluhan: ${message}\nKetik "kirim" jika sudah sesuai, atau "batal" untuk mengulang.`,
    `Keluhan yang tercatat: ${message}\nKetik "kirim" untuk lanjut ke lokasi, atau "batal" untuk mengulang.`
  ];
  return randomResponse(responses);
}

function laporanDibatalkan(sapaan, nama) {
  const responses = [
    `Baik ${sapaan} ${nama}, laporan dibatalkan. Ketik "menu" untuk memulai kembali.`,
    `Laporan Anda dibatalkan, ${sapaan} ${nama}. Silakan ketik "menu" untuk mulai ulang.`,
    `Laporan telah dibatalkan, ${sapaan} ${nama}.`,
    `Proses laporan dibatalkan. Ketik "menu" untuk memulai lagi.`,
    `Laporan dibatalkan. Silakan mulai ulang dengan ketik "menu", ${sapaan} ${nama}.`
  ];
  return randomResponse(responses);
}

function ulangKeluhan(sapaan, nama) {
  const responses = [
    `Baik ${sapaan} ${nama}, silakan jelaskan kembali keluhan Anda.`,
    `Silakan ulangi penjelasan keluhan Anda, ${sapaan} ${nama}.`,
    `Mohon tuliskan kembali keluhan Anda, ${sapaan} ${nama}.`,
    `Ceritakan ulang keluhan Anda, ${sapaan} ${nama}.`,
    `Silakan sampaikan kembali keluhan Anda, ${sapaan} ${nama}.`
  ];
  return randomResponse(responses);
}

function konfirmasiAtauBatal() {
  const responses = [
    `Silakan ketik "kirim" jika sudah sesuai, atau "batal" untuk mengulang.`,
    `Ketik "kirim" jika sudah benar, atau "batal" untuk mengulang.`,
    `Jika sudah sesuai, ketik "kirim". Jika ingin mengulang, ketik "batal".`,
    `Ketik "kirim" untuk lanjut, atau "batal" untuk mengulang.`,
    `Silakan konfirmasi dengan "kirim", atau ulangi dengan "batal".`
  ];
  return randomResponse(responses);
}

function mintaLokasi(sapaan, nama) {
  const responses = [
    `Baik ${sapaan} ${nama}, silakan kirimkan *pin point lokasi kejadian* menggunakan fitur *Kirim Lokasi* di WhatsApp.`,
    `Silakan kirim lokasi kejadian dengan fitur *Kirim Lokasi*, ${sapaan} ${nama}.`,
    `Mohon kirimkan lokasi kejadian melalui fitur *Kirim Lokasi*, ${sapaan} ${nama}.`,
    `Kirimkan lokasi kejadian dengan fitur *Kirim Lokasi* di WhatsApp, ${sapaan} ${nama}.`,
    `Silakan gunakan fitur *Kirim Lokasi* untuk mengirim lokasi kejadian, ${sapaan} ${nama}.`
  ];
  return randomResponse(responses);
}

function lokasiBukanBekasi(sapaan, nama, kabupaten) {
  const responses = [
    `Terima kasih ${sapaan} ${nama}, namun laporan Anda berada di luar wilayah *Kabupaten Bekasi* (${kabupaten || 'wilayah tidak dikenal'}).`,
    `Mohon maaf, lokasi laporan Anda bukan di area Kabupaten Bekasi (${kabupaten || 'wilayah tidak dikenal'}).`,
    `Laporan Anda tidak berada di Kabupaten Bekasi (${kabupaten || 'wilayah tidak dikenal'}).`,
    `Lokasi laporan di luar Kabupaten Bekasi (${kabupaten || 'wilayah tidak dikenal'}).`,
    `Laporan Anda bukan di wilayah Kabupaten Bekasi (${kabupaten || 'wilayah tidak dikenal'}).`
  ];
  return (
    randomResponse(responses) +
    `\n\nSilakan hubungi layanan pengaduan masyarakat di pemerintahan daerah setempat sesuai lokasi kejadian.`
  );
}

function lokasiDiterima(wilayah) {
  const responses = [
    `Berikut lokasi yang Anda kirim: ${wilayah.desa}, ${wilayah.kecamatan}, ${wilayah.kabupaten} Ketik "kirim" jika sudah sesuai, atau "batal" untuk kirim ulang.`,
    `Lokasi diterima: ${wilayah.desa}, ${wilayah.kecamatan}, ${wilayah.kabupaten}. Ketik "kirim" jika benar, atau "batal" untuk ulang.`,
    `Lokasi Anda: ${wilayah.desa}, ${wilayah.kecamatan}, ${wilayah.kabupaten}. Ketik "kirim" jika sudah sesuai, ketik "batal" untuk mengirim ulang.`,
    `Lokasi sudah kami terima: ${wilayah.desa}, ${wilayah.kecamatan}, ${wilayah.kabupaten}. Jika sudah benar ketik "kirim", jika belum ketik "batal"`,
    `Lokasi: ${wilayah.desa}, ${wilayah.kecamatan}, ${wilayah.kabupaten}. Ketik "kirim" jika benar, atau "batal" untuk ulang.`
  ];
  return randomResponse(responses);
}

function mintaFoto() {
  const responses = [
    `Silakan kirim *1–3 foto* pendukung. Cek kembali apakah foto yang akan dikirim sudah jelas dan relevan.`,
    `Mohon kirimkan 1 sampai 3 foto pendukung yang relevan.`,
    `Kirimkan foto pendukung (maksimal 3). Pastikan foto jelas.`,
    `Silakan upload foto pendukung, minimal 1 dan maksimal 3.`,
    `Kirimkan foto yang mendukung laporan Anda (1–3 foto).`
  ];
  return randomResponse(responses);
}

function ulangLokasi() {
  const responses = [
    `Silakan kirim ulang lokasi kejadian dengan fitur *Kirim Lokasi* di WhatsApp.`,
    `Mohon kirim ulang lokasi kejadian menggunakan fitur *Kirim Lokasi*.`,
    `Kirim ulang lokasi kejadian dengan fitur *Kirim Lokasi* di WhatsApp.`,
    `Silakan ulangi pengiriman lokasi dengan fitur *Kirim Lokasi*.`,
    `Mohon ulangi kirim lokasi kejadian menggunakan fitur *Kirim Lokasi*.`
  ];
  return randomResponse(responses);
}

function konfirmasiLokasi() {
  const responses = [
    `Ketik "kirim" jika lokasi sudah benar, atau ketik "batal" untuk kirim ulang.`,
    `Jika lokasi sudah sesuai, ketik "kirim". Jika ingin mengulang, ketik "batal".`,
    `Konfirmasi lokasi dengan ketik "kirim", atau ulangi dengan ketik "batal".`,
    `Ketik "kirim" untuk lanjut, atau ketik "batal" untuk ulang lokasi.`,
    `Silakan ketik "kirim" jika lokasi sudah benar, atau ketik "batal" untuk ulang.`
  ];
  return randomResponse(responses);
}

function minimalFoto(sapaan, nama) {
  const responses = [
    `Mohon maaf ${sapaan} ${nama}, minimal perlu 1 foto sebelum melanjutkan.`,
    `Minimal 1 foto pendukung diperlukan untuk melanjutkan, ${sapaan} ${nama}.`,
    `Anda harus mengirimkan setidaknya 1 foto pendukung, ${sapaan} ${nama}.`,
    `Anda tidak bisa melanjutkan jika tidak menyertakan foto pendukung, ${sapaan} ${nama}.`,
    `Mohon kirim minimal 1 foto pendukung, ${sapaan} ${nama}.`
  ];
  return randomResponse(responses);
}

function ringkasanLaporan(session) {
  const responses = [
    `Berikut ringkasan laporan Anda:\n📍 Lokasi: ${session.location.desa}, ${session.location.kecamatan}, ${session.location.kabupaten}\n📝 Keluhan:\n${session.message}\n📷 Jumlah Foto: ${session.photos.length}\nJika sudah benar, ketik "konfirmasi" untuk mengirim atau "batal" untuk mengulang.`,
    `Ringkasan laporan:\nLokasi: ${session.location.desa}, ${session.location.kecamatan}, ${session.location.kabupaten}\nKeluhan:\n${session.message}\nJumlah Foto: ${session.photos.length}\nKetik "konfirmasi" jika sudah benar, atau "batal" untuk mengulang.`,
    `Cek kembali laporan Anda:\nLokasi: ${session.location.desa}, ${session.location.kecamatan}, ${session.location.kabupaten}\nKeluhan:\n${session.message}\nFoto: ${session.photos.length}\nKetik "konfirmasi" untuk kirim, atau "batal" untuk ulang.`,
    `Berikut detail laporan Anda:\nLokasi: ${session.location.desa}, ${session.location.kecamatan}, ${session.location.kabupaten}\nKeluhan:\n${session.message}\nJumlah Foto: ${session.photos.length}\nKetik "konfirmasi" jika sudah benar, atau "batal" untuk mengulang.`,
    `Laporan Anda:\nLokasi: ${session.location.desa}, ${session.location.kecamatan}, ${session.location.kabupaten}\nKeluhan:\n${session.message}\nFoto: ${session.photos.length}\nKetik "konfirmasi" untuk kirim, atau "batal" untuk ulang.`
  ];
  return randomResponse(responses);
}

function laporanDibatalkanMenu() {
  const responses = [
    `Laporan dibatalkan. Ketik "menu" untuk memulai kembali.`,
    `Proses laporan dibatalkan. Silakan ketik "menu" untuk mulai ulang.`,
    `Laporan telah dibatalkan. Ketik "menu" untuk memulai lagi.`,
    `Laporan dibatalkan. Silakan mulai ulang dengan ketik "menu".`,
    `Laporan Anda dibatalkan. Ketik "menu" untuk mulai dari awal.`
  ];
  return randomResponse(responses);
}

function hanyaFoto() {
  const responses = [
    `Mohon hanya kirim foto, atau "batal" untuk mengulang.`,
    `Silakan kirim foto saja, atau ketik "batal" untuk mengulang.`,
    `Kirim hanya foto saja, atau ketik "batal" untuk ulang.`,
    `Mohon kirimkan foto saja, atau ketik "batal".`,
    `Hanya foto yang bisa diproses, atau ketik "batal" jika sudah cukup.`
  ];
  return randomResponse(responses);
}

function gagalProsesFoto() {
  const responses = [
    `Kami tidak dapat memproses foto tersebut. Coba kirim ulang menggunakan fitur "Kirim Foto".`,
    `Foto gagal diproses. Silakan kirim ulang dengan fitur "Kirim Foto".`,
    `Gagal memproses foto. Mohon kirim ulang fotonya.`,
    `Foto tidak bisa diproses. Silakan coba lagi.`,
    `Foto gagal diproses. Coba kirim ulang menggunakan fitur "Kirim Foto".`
  ];
  return randomResponse(responses);
}

function sudah3Foto() {
  const responses = [
    `Kami telah menerima 3 foto. Coba periksa kembali, apakah foto yang Anda kirim sudah sesuai? Jika sudah, ketik "kirim", atau ketik "batal" untuk mengulang.`,
    `Sudah ada 3 foto yang diterima. Ketik "kirim" jika sudah cukup, atau "batal" untuk ulang.`,
    `3 foto dari Anda sudah diterima. Ketik "kirim" jika sudah benar, atau "batal" untuk ulang.`,
    `Kami sudah menerima 3 foto. Silakan cek kembali, lalu ketik "kirim" jika sudah sesuai, atau "batal" jika ingin mengulang.`,
    `3 foto berhasil diterima. Ketik "kirim" jika sudah cukup, atau "batal" untuk ulang.`
  ];
  return randomResponse(responses);
}

function fotoBerhasilDiterima(sisa) {
  const responses = [
    `Foto berhasil diterima. Anda masih bisa mengirim ${sisa} foto lagi. Ketik "kirim" jika sudah cukup, atau "batal" untuk mengulang.`,
    `Foto sudah masuk. Anda masih bisa mengirim ${sisa} foto lagi. Jika sudah cukup ketik "kirim", jika ingin mengulang ketik "batal"`,
    `Foto diterima. Sisa foto yang bisa dikirim: ${sisa}. Ketik "kirim" jika sudah cukup, ketik "batal" jika ingin mengulang`,
    `Foto sudah diterima. Anda masih bisa tambah ${sisa} foto lagi. Jika cukup ketik "kirim", jika ingin mengulang ketik "batal"`,
    `Foto berhasil diupload. Anda masih bisa upload ${sisa} foto lagi. Jika sudah ketik "kirim", jika ingin diulang ketik "batal"`
  ];
  return randomResponse(responses);
}

function konfirmasiReview() {
  const responses = [
    `Ketik "konfirmasi" jika laporan sudah benar, atau "batal" untuk membatalkan.`,
    `Konfirmasi laporan dengan ketik "konfirmasi", atau "batal" untuk membatalkan.`,
    `Jika laporan sudah benar, ketik "konfirmasi". Jika ingin membatalkan, ketik "batal".`,
    `Ketik "konfirmasi" untuk kirim laporan, atau "batal" untuk membatalkan.`,
    `Silakan ketik "konfirmasi" jika sudah benar, atau "batal" untuk membatalkan.`
  ];
  return randomResponse(responses);
}

function laporanBerhasil(sapaan, nama, nomorLaporan) {
  const responses = [
    `Terima kasih ${sapaan} ${nama}, laporan berhasil dikirim dengan ID ${nomorLaporan}. Simpan ID ini untuk cek status laporan.`,
    `Laporan Anda sudah berhasil dikirim, ${sapaan} ${nama}. Berikut ID laporannya: ${nomorLaporan}.`,
    `Laporan berhasil dikirim dengan ID ${nomorLaporan}, ${sapaan} ${nama}. Mohon simpan ID tersebut`,
    `Terima kasih, laporan Anda sudah kami terima. Simpan ID berikut: ${nomorLaporan}.`,
    `Laporan berhasil dikirim. Simpan ID ${nomorLaporan} untuk cek status, ${sapaan} ${nama}.`
  ];
  return randomResponse(responses);
}

function gagalSimpanLaporan() {
  const responses = [
    `Terjadi kesalahan saat menyimpan laporan. Silakan ketik "reset" untuk mengulang.`,
    `Laporan gagal disimpan. Silakan coba lagi dengan ketik "reset".`,
    `Gagal menyimpan laporan. Silakan ulangi proses dengan "reset".`,
    `Ada kendala saat menyimpan laporan. Silakan ketik "reset" untuk mengulang.`,
    `Laporan tidak berhasil disimpan. Silakan coba lagi dengan "reset".`
  ];
  return randomResponse(responses);
}

function ulangLaporan() {
  const responses = [
    `Laporan dibatalkan. Ketik "menu" untuk memulai dari awal.`,
    `Proses laporan dibatalkan. Silakan mulai ulang dengan ketik "menu".`,
    `Laporan telah dibatalkan. Ketik "menu" untuk mulai dari awal.`,
    `Laporan Anda dibatalkan. Silakan mulai ulang dengan "menu".`,
    `Laporan dibatalkan. Ketik "menu" untuk mulai ulang.`
  ];
  return randomResponse(responses);
}

function handlerDefault() {
  const responses = [
    `Mohon ikuti langkah pelaporan sesuai instruksi. Silahkan ketik "menu".`,
    `Mohon ikuti arahan pelaporan. Agar sesuai dengan arahan, mohon ketik "menu".`,
    `Silakan mengikuti tahapan pembuatan laporan. Untuk mengikuti tahapan tersebut, ketik "menu".`,
    `Proses pembuatan laporan mesti sesuai dengan tahapan, ketik "menu" untuk menyesuaikan.`,
    `Pelaporan mesti sesuai dengan proses pelaporan, mohon ketik "menu".`
    // `Pelaporan mesti sesuai dengan proses pelaporan, mohon ketik "menu". (createReportResponse DEFAULT)`
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
  gagalProsesFoto,
  sudah3Foto,
  fotoBerhasilDiterima,
  konfirmasiReview,
  laporanBerhasil,
  gagalSimpanLaporan,
  ulangLaporan,
  handlerDefault
};
