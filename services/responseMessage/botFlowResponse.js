function randomResponse(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function mainSapaan(sapaan, nama) {
  const responses = [
    `Halo ${sapaan} ${nama}, selamat datang di Lapor AA Pemerintahan Kabupaten Bekasi!`,
    `Hai ${sapaan} ${nama}, terima kasih sudah menghubungi Lapor AA Kabupaten Bekasi.`,
    `Selamat datang ${sapaan} ${nama} di layanan Lapor AA Pemerintahan Kabupaten Bekasi.`,
    `Halo ${sapaan} ${nama}, ada yang bisa kami bantu di Lapor AA Kabupaten Bekasi?`,
    `Salam hormat ${sapaan} ${nama}, silakan gunakan layanan Lapor AA Kabupaten Bekasi.`
  ];
  return (
    randomResponse(responses) +
    `

Apabila situasi anda darurat, bisa menghubungi nomer berikut :
- 119 : PSC  (Untuk Kegawat Daruratan Medis)
- 113 : Pemadam Kebakaran
- 110 : Kepolisian (Kriminal dll)
- 081219071900 : BPBD (Untuk Bantuan Penanggulangan Bencana)

Jika tidak dalam keadaan darurat, ketik "buat laporan" jika ingin membuat laporan, atau ketik "cek status" jika ingin mengecek status laporan.`
  );
}

function ratingSuccess(sapaan, nama, rating) {
  const responses = [
    `Terima kasih atas rating ${rating} untuk laporan Anda, ${nama}!`,
    `Rating ${rating} sudah kami terima, ${sapaan} ${nama}.`,
    `Kami menghargai feedback ${rating} dari Anda, ${sapaan} ${nama}.`,
    `Rating ${rating} Anda sudah tercatat. Terima kasih, ${sapaan} ${nama}!`,
    `Terima kasih, ${sapaan} ${nama}, atas rating ${rating} yang diberikan.`
  ];
  return randomResponse(responses) + ' Kami akan terus meningkatkan layanan.';
}

function laporanDitolak(sapaan, nama, sessionId, kesimpulan) {
  const responses = [
    `Mohon maaf ${sapaan} ${nama}, laporan dengan ID ${sessionId} tidak dapat ditindaklanjuti.`,
    `Laporan ${sessionId} atas nama ${sapaan} ${nama} telah ditolak oleh petugas.`,
    `Laporan Anda (${sessionId}) tidak dapat diproses lebih lanjut, ${sapaan} ${nama}.`,
    `Maaf ${sapaan} ${nama}, laporan ${sessionId} tidak bisa kami tindaklanjuti.`,
    `Laporan dengan ID ${sessionId} telah ditolak.`
  ];
  return (
    randomResponse(responses) +
    `
Alasan penolakan: ${kesimpulan || 'Tidak tersedia'}
Silahkan untuk membuat laporan ulang dengan memperbaiki kesalahannya.
Terimakasih.`
  );
}

function puasReply(sapaan, nama, sessionId) {
  const responses = [
    `Terima kasih ${sapaan} ${nama}, laporan ${sessionId} akan kami tutup.`,
    `Tanggapan Anda sangat berarti, ${sapaan} ${nama}. Laporan ${sessionId} akan ditutup.`,
    `Laporan ${sessionId} telah selesai.`,
    `Terima kasih atas konfirmasi Anda, ${sapaan} ${nama}.`,
    `Laporan ${sessionId} akan segera kami tutup.`
  ];
  return (
    randomResponse(responses) +
    ' Sebagai bentuk peningkatan layanan, mohon berikan rating 1-5. Cukup input angka 1-5 saja.'
  );
}

function belumReply(sapaan, nama, sessionId, pendingCount) {
  const responses = [
    `Terima kasih ${sapaan} ${nama}, laporan ${sessionId} akan kami tindak lanjuti ulang.`,
    `Kami akan segera menindaklanjuti laporan ${sessionId}, ${sapaan} ${nama}.`,
    `Laporan ${sessionId} akan kami proses kembali. Mohon maaf atas ketidakpuasan Anda.`,
    `Laporan ${sessionId} akan kami tinjau ulang, ${sapaan} ${nama}.`,
    `Terima kasih atas feedback Anda, laporan ${sessionId} akan kami tindak lanjuti.`
  ];
  let reply =
    randomResponse(responses) + ' Terimakasih sudah menanggapi laporannya.';
  if (pendingCount > 0) {
    reply += ` Masih ada ${pendingCount} laporan lain yang menunggu respon. Balas "puas" atau "belum" untuk melakukan penyelesaian laporan ${sessionId}.`;
  }
  return reply;
}

function pendingKonfirmasi(sapaan, nama) {
  const responses = [
    `Mohon maaf ${sapaan} ${nama}, Anda masih memiliki laporan yang menunggu konfirmasi tingkat kepuasannya.`,
    `Masih ada laporan yang perlu Anda konfirmasi tingkat kepuasannya, ${sapaan} ${nama}.`,
    `Anda belum menyelesaikan konfirmasi tingkat kepuasan laporan, ${sapaan} ${nama}.`,
    `Silakan konfirmasi tingkat kepuasan laporan terlebih dahulu, ${sapaan} ${nama}.`,
    `Ada laporan yang masih menunggu konfirmasi tingkat kepuasannya dari Anda, ${sapaan} ${nama}.`
  ];
  return (
    randomResponse(responses) +
    ' Balas "puas" jika sudah selesai, atau "belum" jika masih ada masalah.'
  );
}

function ratingInvalid(sapaan, nama) {
  const responses = [
    `Rating tidak valid, ${sapaan} ${nama}. Mohon hanya input angka.`,
    `Mohon masukkan rating dengan angka, ${sapaan} ${nama}.`,
    `Rating yang Anda masukkan salah, ${sapaan} ${nama}. `,
    `Rating harus berupa angka, ${sapaan} ${nama}.`,
    `Input rating tidak sesuai, ${sapaan} ${nama}.`
  ];
  return (
    randomResponse(responses) + ' Silakan berikan rating antara 1 hingga 5.'
  );
}

function laporanSelesaiDiarahkanKeBaru(sapaan, nama) {
  return `Halo ${sapaan} ${nama}, laporan Anda telah diselesaikan dengan rating 5 karena telah mencapai batas ketidakpuasan. Jika Anda memiliki masalah lain, silakan buat laporan baru.`;
}

function laporanTidakDitemukan(sapaan, nama) {
  const responses = [
    `Laporan tidak ditemukan, ${sapaan} ${nama}.`,
    `Mohon maaf, laporan Anda tidak ditemukan, ${sapaan} ${nama}.`,
    `Kami tidak menemukan laporan Anda, ${sapaan} ${nama}.`,
    `Laporan yang dimaksud tidak ada, ${sapaan} ${nama}.`,
    `Data laporan tidak ditemukan, ${sapaan} ${nama}.`
  ];
  return randomResponse(responses);
}

function gagalSimpanRating() {
  const responses = [
    `Terjadi kesalahan saat menyimpan rating.`,
    `Maaf, rating Anda gagal disimpan.`,
    `Ada kendala saat menyimpan rating.`,
    `Rating gagal diproses.`,
    `Sistem gagal menyimpan rating Anda.`
  ];
  return (
    randomResponse(responses) + ' Silakan berikan rating antara 1 hingga 5.'
  );
}

module.exports = {
  mainSapaan,
  ratingSuccess,
  laporanSelesaiDiarahkanKeBaru,
  laporanDitolak,
  puasReply,
  belumReply,
  pendingKonfirmasi,
  ratingInvalid,
  laporanTidakDitemukan,
  gagalSimpanRating
};
