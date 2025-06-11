function randomResponse(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function kembaliKeMenu(sapaan, nama) {
  const responses = [
    `Halo ${sapaan} ${nama}, selamat datang kembali di Lapor AA Kabupaten Bekasi. Ingin membuat laporan baru atau cek status laporan?`,
    `Hai ${sapaan} ${nama}, Anda kembali ke menu utama. Silakan pilih apakah Anda ingin membuat laporan atau cek status laporan.`,
    `Selamat datang di menu utama, ${sapaan} ${nama}. Mau buat laporan atau cek status laporan?`,
    `Anda sedang berada di menu utama, ${sapaan} ${nama}. Mau buat laporan baru atau cek status laporan?`
  ];
  return (
    randomResponse(responses)
  );
}

function laporanTidakDitemukan(sapaan, nama, nomorLaporan) {
  const responses = [
    `Mohon maaf ${sapaan} ${nama}, nomor laporan ${nomorLaporan} tidak ditemukan.`,
    `Laporan dengan ID ${nomorLaporan} tidak ditemukan, ${sapaan} ${nama}.`,
    `Nomor laporan ${nomorLaporan} tidak ada di sistem kami, ${sapaan} ${nama}.`,
    `Maaf, laporan dengan ID ${nomorLaporan} tidak ditemukan, ${sapaan} ${nama}.`,
    `Laporan ${nomorLaporan} tidak ditemukan, ${sapaan} ${nama}.`
  ];
  return (
    randomResponse(responses) +
    `Silakan cek kembali dan kirim ulang nomornya, atau ketik *menu* untuk kembali ke menu utama.`
  );
}

function detailLaporan(sapaan, nama, nomorLaporan, report) {
  const tindakan = report?.tindakan;
  const responses = [
    `Terima kasih ${sapaan} ${nama}, berikut detail laporan Anda:\n🆔 *Laporan ${nomorLaporan}*\n📍 Lokasi: ${report.location.desa}, ${report.location.kecamatan}, ${report.location.kabupaten}\n📅 Tanggal: ${report.createdAt.toLocaleDateString('id-ID')}\n⏰ Waktu: ${report.createdAt.toLocaleTimeString('id-ID')}\n📝 Isi Laporan: ${report.message}\n\n📌 Tindakan Terbaru:\n• OPD Terkait: ${tindakan?.opd || '-'}\n• Tingkat Kedaruratan: ${tindakan?.situasi || '-'}\n• Status: ${tindakan?.status || '-'}`,
    `Berikut info laporan Anda, ${sapaan} ${nama}:\nID: ${nomorLaporan}\nLokasi: ${report.location.desa}, ${report.location.kecamatan}, ${report.location.kabupaten}\nTanggal: ${report.createdAt.toLocaleDateString('id-ID')}\nWaktu: ${report.createdAt.toLocaleTimeString('id-ID')}\nIsi: ${report.message}\n\nTindakan:\nOPD: ${tindakan?.opd || '-'}\nKedaruratan: ${tindakan?.situasi || '-'}\nStatus: ${tindakan?.status || '-'}`,
    `Laporan ${nomorLaporan} atas nama ${sapaan} ${nama}:\nLokasi: ${report.location.desa}, ${report.location.kecamatan}, ${report.location.kabupaten}\nTanggal: ${report.createdAt.toLocaleDateString('id-ID')}\nWaktu: ${report.createdAt.toLocaleTimeString('id-ID')}\nIsi: ${report.message}\n\nTindakan terakhir:\nOPD: ${tindakan?.opd || '-'}\nSituasi: ${tindakan?.situasi || '-'}\nStatus: ${tindakan?.status || '-'}`,
    `Detail laporan Anda (${nomorLaporan}):\nLokasi: ${report.location.desa}, ${report.location.kecamatan}, ${report.location.kabupaten}\nTanggal: ${report.createdAt.toLocaleDateString('id-ID')}\nWaktu: ${report.createdAt.toLocaleTimeString('id-ID')}\nIsi: ${report.message}\n\nTindakan:\nOPD: ${tindakan?.opd || '-'}\nKedaruratan: ${tindakan?.situasi || '-'}\nStatus: ${tindakan?.status || '-'}`,
    `Info laporan:\nID: ${nomorLaporan}\nLokasi: ${report.location.desa}, ${report.location.kecamatan}, ${report.location.kabupaten}\nTanggal: ${report.createdAt.toLocaleDateString('id-ID')}\nWaktu: ${report.createdAt.toLocaleTimeString('id-ID')}\nIsi: ${report.message}\n\nTindakan terbaru:\nOPD: ${tindakan?.opd || '-'}\nKedaruratan: ${tindakan?.situasi || '-'}\nStatus: ${tindakan?.status || '-'}`
  ];
  return randomResponse(responses);
}

function handlerDefault() {
  const responses = [
    `Mohon ikuti langkah pelaporan sesuai instruksi. Silahkan ketik *menu* untuk mengulang.`,
    `Mohon ikuti arahan pelaporan. Agar sesuai dengan arahan, mohon ketik *menu*.`,
    `Silakan mengikuti tahapan pembuatan laporan. Untuk mengikuti tahapan tersebut, ketik *menu*.`,
    `Proses pembuatan laporan mesti sesuai dengan tahapan, ketik *menu* untuk menyesuaikan.`,
    `Pelaporan mesti sesuai dengan proses pelaporan, mohon ketik *menu*.`
    // `Pelaporan mesti sesuai dengan proses pelaporan, mohon ketik *menu*. (checkReportResponse DEFAULT)`
  ];
  return randomResponse(responses);
}

module.exports = {
  kembaliKeMenu,
  laporanTidakDitemukan,
  detailLaporan,
  handlerDefault
};
