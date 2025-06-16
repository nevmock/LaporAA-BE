const randomResponse = (arr) => arr[Math.floor(Math.random() * arr.length)];

const daruratMessage = (sapaan, nama, sessionId) => {
  const responses = [
`Terimakasih ${sapaan} ${nama} telah menghubungi kami.

Laporan Anda dengan ID: *${sessionId}*

Dari hasil verifikasi Tim Admin, laporan Anda termasuk dalam situasi darurat, silahkan langsung hubungi:

- 119 : PSC  (Untuk Kegawatdaruratan Medis)
- 123 : PLN (Untuk Layanan Pengaduan Listrik)
- 110 : Kepolisian (Kriminal dll)
- 02122137870 : MarKo (Markas Komando Pemadam Kebakaran)
- 081219071900 : BPBD (Badan Penanggulangan Bencana Daerah)
`
  ];
  return randomResponse(responses);
};

const selesaiPenangananMessage = (sapaan, nama, sessionId, formattedKesimpulan) => {
  const responses = [
`Terimakasih ${sapaan} ${nama}, Laporan ${sessionId} telah selesai ditangani.
Berikut ini adalah hasil penanganan laporannya:

${formattedKesimpulan}

Apakah sudah puas dengan hasil penanganan laporan ini?
Jika *belum puas*, cukup balas dengan "belum".
Jika *sudah puas*, cukup balas dengan "puas".`
  ];
  return randomResponse(responses);
};

const ditolakMessage = (sapaan, nama, sessionId, kesimpulan) => {
    const responses = [
    `Mohon maaf ${sapaan} ${nama}, laporan Anda dengan ID *${sessionId}* *tidak dapat ditindaklanjuti*.`,
    `Laporan Anda dengan ID *${sessionId}* atas nama ${sapaan} ${nama} telah *tidak terproses* oleh petugas.`,
    `Laporan Anda dengan ID (*${sessionId}*) *tidak dapat diproses* lebih lanjut, ${sapaan} ${nama}.`,
    `Maaf ${sapaan} ${nama}, laporan Anda dengan ID *${sessionId}* *tidak bisa kami tindaklanjuti*.`,
    `Laporan dengan ID *${sessionId}* telah *tidak bisa dilanjutkan*.`
  ];
  return (
    randomResponse(responses) +
    `
Alasan tidak bisa diproses: ${kesimpulan || 'Tidak tersedia'}
Silahkan untuk membuat laporan ulang dengan memperbaiki kesalahannya.
Terima kasih ${sapaan} ${nama}, laporan akan kami tutup..`
  );
}

const tindakLanjutLaporanMessage = (sapaan, nama, sessionId, keluhan, kesimpulanList) => {
  const kesimpulanText = kesimpulanList.length > 0
    ? kesimpulanList.map((k, i) => {
      const date = new Date(k.timestamp);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `- [${day}/${month}/${year} ${hours}:${minutes}]\n${k.text}\n`;
    }).join("\n")
    : "Belum ada tindak lanjut yang tercatat.";

  const responses = [
    `Halo ${sapaan} ${nama}, Tindak Lanjut Laporan Anda (${sessionId})\nTentang: ${keluhan}\n\n${kesimpulanText}`,
    `Berikut adalah Tindak Lanjut Laporan Anda (${sessionId})\nTentang: ${keluhan}\n\n${kesimpulanText}`,
    `Informasi terbaru untuk Laporan Anda (${sessionId})\nTentang: ${keluhan}\n\n${kesimpulanText}`,
    `Update Tindak Lanjut untuk Laporan Anda (${sessionId})\nTentang: ${keluhan}\n\n${kesimpulanText}`,
    `Pemberitahuan Tindak Lanjut Laporan Anda (${sessionId})\nTentang: ${keluhan}\n\n${kesimpulanText}`
  ];
  return randomResponse(responses);
};

const finalizeAndAskNewReport = (sapaan, nama) => {
  const responses = [
    `Terima kasih atas feedback Anda, ${sapaan} ${nama}. Laporan ini sudah kami anggap selesai.\n\nJika Anda masih memiliki keluhan, silakan buat laporan baru. Terima kasih atas pengertiannya.`
  ];
  return randomResponse(responses);
};

const belumReply = (sapaan, nama, sessionId, remaining) => {
  const responses = [
    `Terima kasih atas feedback Anda, ${sapaan} ${nama}. Laporan dengan ID ${sessionId} akan kami proses ulang.\n\nAnda masih memiliki ${remaining} laporan yang menunggu konfirmasi.`
  ];
  return randomResponse(responses);
};

const puasReply = (sapaan, nama, sessionId) => {
  const responses = [
    `Terima kasih atas kepuasan Anda, ${sapaan} ${nama}. Laporan dengan ID ${sessionId} telah selesai.`
  ];
  return randomResponse(responses);
};

const puasReply1 = (sapaan, nama, sessionId) => {
  const responses = [
    `⭐️\n\nMohon maaf atas ketidakpuasan Anda, ${sapaan} ${nama}. Kami sangat menghargai masukan Anda dan akan menjadikan hal ini sebagai bahan evaluasi.\n\nLaporan dengan ID ${sessionId} telah kami tandai selesai.`
  ];
  return randomResponse(responses);
};

const puasReply2 = (sapaan, nama, sessionId) => {
  const responses = [
    `⭐️⭐️\n\nTerima kasih atas tanggapan Anda, ${sapaan} ${nama}. Kami mohon maaf jika pelayanan kami belum memenuhi harapan Anda. Masukan Anda sangat berarti untuk perbaikan ke depannya.\n\nLaporan dengan ID ${sessionId} telah kami tandai selesai.`
  ];
  return randomResponse(responses);
};

const puasReply3 = (sapaan, nama, sessionId) => {
  const responses = [
    `⭐️⭐️⭐️\n\nTerima kasih atas penilaian Anda, ${sapaan} ${nama}. Kami akan terus berusaha meningkatkan kualitas layanan kami.\n\nLaporan dengan ID ${sessionId} telah kami tandai selesai.`
  ];
  return randomResponse(responses);
};

const puasReply4 = (sapaan, nama, sessionId) => {
  const responses = [
    `⭐️⭐️⭐️⭐️\n\nTerima kasih atas apresiasi Anda, ${sapaan} ${nama}. Kami senang bisa membantu Anda dengan baik.\n\nLaporan dengan ID ${sessionId} telah kami tandai selesai.`
  ];
  return randomResponse(responses);
};

const puasReply5 = (sapaan, nama, sessionId) => {
  const responses = [
    `⭐️⭐️⭐️⭐️⭐️\n\nTerima kasih banyak atas rating sempurna dari Anda, ${sapaan} ${nama}! Kami sangat senang bisa memberikan pelayanan terbaik.\n\nLaporan dengan ID ${sessionId} telah kami tandai selesai.`
  ];
  return randomResponse(responses);
};

module.exports = {
  daruratMessage,
  selesaiPenangananMessage,
  ditolakMessage,
  tindakLanjutLaporanMessage,
  finalizeAndAskNewReport,
  belumReply,
  puasReply,
  puasReply1,
  puasReply2,
  puasReply3,
  puasReply4,
  puasReply5
};
