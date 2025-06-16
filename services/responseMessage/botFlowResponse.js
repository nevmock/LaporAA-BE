function randomResponse(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function mainSapaan(sapaan, nama) {
  const responses = [
    `Halo ${sapaan} ${nama}, selamat datang di *Lapor AA Bupati Bekasi!*`,
    `Hai ${sapaan} ${nama}, terima kasih sudah menghubungi *Lapor AA Bupati Bekasi*.`,
    `Selamat datang ${sapaan} ${nama} di layanan *Lapor AA Bupati Bekasi*.`,
    `Halo ${sapaan} ${nama}, kami siap membantu melalui layanan *Lapor AA Bupati Bekasi*`,
    `Salam hormat ${sapaan} ${nama}, selamat datang di layanan *Lapor AA Bupati Bekasi*.`
  ];
  return (
    randomResponse(responses) +
    `

Apabila *situasi Anda darurat*, bisa menghubungi nomer berikut:

- 119 : PSC  (Untuk Kegawatdaruratan Medis)
- 123 : PLN (Untuk Layanan Pengaduan Listrik)
- 110 : Kepolisian (Kriminal dll)
- 02122137870 : MarKo (Markas Komando Pemadam Kebakaran)
- 081219071900 : BPBD (Badan Penanggulangan Bencana Daerah)

Jika tidak darurat, apakah Anda mau *buat laporan* atau *cek status laporan*?

Mohon untuk menunggu respon dari kami sebelum mengirim chat berikutnya. Terima kasih.`
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
  return randomResponse(responses) + 'Kami akan terus meningkatkan layanan.';
}

function laporanDitolak(sapaan, nama, sessionId, kesimpulan) {
  const responses = [
    `Mohon maaf ${sapaan} ${nama}, laporan dengan ID *${sessionId}* *tidak dapat ditindaklanjuti*.`,
    `Laporan Anda dengan ID *${sessionId}* atas nama ${sapaan} ${nama} *tidak bisa diproses* oleh petugas.`,
    `Laporan Anda dengan ID (*${sessionId}*) *tidak dapat diproses* lebih lanjut, ${sapaan} ${nama}.`,
    `Maaf ${sapaan} ${nama}, laporan Anda dengan ID *${sessionId}* *tidak bisa kami lanjutkan*.`,
    `Laporan dengan ID *${sessionId}* *belum bisa diproses lebih lanjut*.`
  ];
  return (
    randomResponse(responses) +
    `
Alasan tidak bisa ditindaklanjut adalah: ${kesimpulan || 'Tidak tersedia'}
Silahkan untuk membuat laporan ulang dengan memperbaiki kesalahannya.
Terima kasih ${sapaan} ${nama}, laporan akan kami tutup.`
  );
}

function puasReply(sapaan, nama, sessionId) {
  const responses = [
    `Terima kasih ${sapaan} ${nama}, laporan Anda dengan ID *${sessionId}* akan kami tutup.`,
    `Tanggapan Anda sangat berarti, ${sapaan} ${nama}. Laporan Anda dengan ID *${sessionId}* akan ditutup.`,
    `Laporan Anda dengan ID *${sessionId}* telah selesai.`,
    `Terima kasih atas konfirmasi Anda, ${sapaan} ${nama}. Laporan Anda dengan ID *${sessionId}* akan segera kami tutup.`,
  ];
  return (
    randomResponse(responses) +
    'Sebagai bentuk peningkatan layanan, mohon berikan rating dengan *menginput angka 1-5*'
  );
}

function belumReply(sapaan, nama, sessionId, pendingCount) {
  const responses = [
    `Terima kasih ${sapaan} ${nama}, laporan *${sessionId}* akan kami tindak lanjuti ulang.`,
    `Kami akan segera menindaklanjuti laporan *${sessionId}*, ${sapaan} ${nama}.`,
    `Laporan *${sessionId}* akan kami proses kembali. Mohon maaf atas ketidakpuasan Anda.`,
    `Laporan *${sessionId}* akan kami tinjau ulang, ${sapaan} ${nama}.`,
    `Terima kasih atas feedback Anda, laporan *${sessionId}* akan kami tindak lanjuti.`
  ];
  let reply =
    randomResponse(responses) + 'Terimakasih sudah menanggapi laporannya.';
  if (pendingCount > 0) {
    reply += `Masih ada ${pendingCount} laporan lain yang belum diberi rating kepuasannya.\n\nHarap balas "puas" atau "belum" untuk melakukan penyelesaian laporan tersebut. *${sessionId}*.`;
  }
  return reply;
}

function pendingKonfirmasi(sapaan, nama) {
  const responses = [
    `Mohon maaf ${sapaan} ${nama}, Anda masih memiliki laporan yang harus dinilai kepuasannya.`,
    `Masih ada laporan yang perlu Anda nilai kepuasannya, ${sapaan} ${nama}.`,
    `Anda belum memberi penilaian kepuasan laporan, ${sapaan} ${nama}.`,
    `Silakan beri penilaian kepuasan laporan terlebih dahulu, ${sapaan} ${nama}.`,
    `Masih ada laporan yang harus dinilai kepuasannya dari Anda, ${sapaan} ${nama}.`
  ];
  return (
    randomResponse(responses) +
    ' Balas "puas" jika sudah selesai, atau "belum" jika masih ada masalah.'
  );
}

function ratingInvalid(sapaan, nama) {
  const responses = [
    `Rating tidak valid, ${sapaan} ${nama}. Mohon *hanya input angka*.`,
    `Mohon masukkan rating *hanya dengan angka*, ${sapaan} ${nama}.`,
    `Rating yang Anda masukkan salah, ${sapaan} ${nama}. Harap *input angka saja* `,
    `Rating *harus berupa angka*, ${sapaan} ${nama}.`,
    `Beri rating *hanya dengan angka*, ${sapaan} ${nama}.`
  ];
  return (
    randomResponse(responses) + ' Silakan berikan rating antara 1 hingga 5.'
  );
}

function laporanSelesaiDiarahkanKeBaru(sapaan, nama) {
  return `Halo ${sapaan} ${nama}, laporan Anda telah diselesaikan dengan rating 5 karena telah mencapai batas ketidakpuasan.\n\nJika Anda memiliki masalah lain, silakan buat laporan baru.`;
}

function laporanTidakDitemukan(sapaan, nama) {
  const responses = [
    `Laporan tidak ditemukan, ${sapaan} ${nama}.`,
    `Mohon maaf, laporan Anda tidak ditemukan, ${sapaan} ${nama}.`,
    `Kami tidak menemukan laporan Anda, ${sapaan} ${nama}.`,
    `Laporan yang Anda maksud tidak ada, ${sapaan} ${nama}.`,
    `Laporan tidak ditemukan, ${sapaan} ${nama}.`
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

function limitResponse() {
  const responses = [
    `Mohon Maaf, dikarenakan banyaknya laporan yang masuk, kami tidak dapat memproses laporan Anda saat ini. Mohon untuk mencoba lagi di esok hari 🙏🏼.`,
  ];
  return randomResponse(responses);
}

function terimakasihResponse(sapaan, nama){
  const responses = [
    `Siap ${sapaan} ${nama}, terima kasih telah menggunakan layanan kami.`,
    `Terima kasih ${sapaan} ${nama}, kami senang bisa membantu Anda.`,
    `Sama-sama ${sapaan} ${nama}, kami siap membantu kapan saja.`,
    `Sama-sama ${sapaan} ${nama}, kami menghargai kepercayaan Anda.`,
    `Terima kasih ${sapaan} ${nama}, kami senang bisa membantu Anda.`
  ]
  return randomResponse(responses);  
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
  gagalSimpanRating,
  limitResponse,
  terimakasihResponse
};
