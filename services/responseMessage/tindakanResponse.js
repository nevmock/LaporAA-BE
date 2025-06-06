const randomResponse = (arr) => arr[Math.floor(Math.random() * arr.length)];

const daruratMessage = (sapaan, nama) => {
  const responses = [
    `Terimakasih ${sapaan} ${nama} telah menghubungi kami.
            Karena situasinya darurat, silahkan langsung hubungi:

            - 119 : PSC  (Untuk Kegawat Daruratan Medis)
            - 113 : Pemadam Kebakaran
            - 110 : Kepolisian (Kriminal dll)
            - 081219071900 : BPBD (Untuk Bantuan Penanggulangan Bencana)`
  ];
  return randomResponse(responses);
};

const selesaiPenangananMessage = (sapaan, nama, sessionId, formattedKesimpulan) => {
  const responses = [
    `Terimakasih ${sapaan} ${nama}, Laporan ${sessionId} telah selesai ditangani.
            berikut ini adalah hasil penanganan laporannya:
            ${formattedKesimpulan}

            Apakah sudah puas dengan hasil penanganan laporan ini?
            jika belum puas, cukup balas dengan "belum"
            jika sudah puas, cukup balas dengan "puas"`
  ];
  return randomResponse(responses);
};

const ditolakMessage = (sapaan, nama, sessionId, keterangan) => {
  const responses = [
    `Mohon maaf ${sapaan} ${nama}, Laporan ${sessionId} ditolak dan tidak dapat ditindak lanjuti. Karena ${keterangan || 'Tidak ada alasan jelas'}, silahkan untuk membuat laporan baru dengan memperbaiki kesalahan ${keterangan || 'Tidak ada alasan jelas, silakan untuk langsung membuat laporan baru'}`
  ];
  return randomResponse(responses);
};

const tindakLanjutLaporanMessage = (sapaan, nama, sessionId, kesimpulanList) => {
  const kesimpulanText = kesimpulanList.length > 0
    ? kesimpulanList.map((k, i) => `- ${k.text}`).join("\n")
    : "Belum ada tindak lanjut yang tercatat.";

  const responses = [
    `Halo ${sapaan} ${nama}, Tindak Lanjut Laporan Anda (${sessionId}):\n${kesimpulanText}`,
    `Berikut adalah Tindak Lanjut Laporan Anda (${sessionId}):\n${kesimpulanText}`,
    `Informasi terbaru untuk Laporan Anda (${sessionId}):\n${kesimpulanText}`,
    `Update Tindak Lanjut untuk Laporan Anda (${sessionId}):\n${kesimpulanText}`,
    `Pemberitahuan Tindak Lanjut Laporan Anda (${sessionId}):\n${kesimpulanText}`
  ];
  return randomResponse(responses);
};

module.exports = {
  daruratMessage,
  selesaiPenangananMessage,
  ditolakMessage,
  tindakLanjutLaporanMessage
};
