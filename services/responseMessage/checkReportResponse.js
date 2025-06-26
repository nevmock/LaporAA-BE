function randomResponse(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function kembaliKeMenu(sapaan, nama) {
  const responses = [
    `Halo ${sapaan} ${nama}, selamat datang kembali di Lapor AA Bupati Bekasi.\n\nApakah Anda ingin membuat *laporan baru* atau *cek status laporan*?`,
    `Hai ${sapaan} ${nama}, apakah Anda ingin membuat *laporan baru* atau *cek status laporan*?`,
    `Selamat datang kembali di Lapor AA, ${sapaan} ${nama}.\n\nApakah Anda mau *buat laporan* atau *cek status laporan*?`,
    `Halo ${sapaan} ${nama}, dari sini Anda bisa *buat laporan baru* atau *cek status laporan*. Mau pilih yang mana?`
  ];
  return (
    randomResponse(responses)
  );
}

function laporanTidakDitemukan(sapaan, nama, nomorLaporan) {
  const responses = [
    `Mohon maaf ${sapaan} ${nama}, nomor lapora dengan ID ${nomorLaporan} tidak ditemukan.`,
    `Laporan dengan ID ${nomorLaporan} tidak ditemukan, ${sapaan} ${nama}.`,
    `Nomor laporan ${nomorLaporan} tidak ada, ${sapaan} ${nama}.`,
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
  const opdList = tindakan?.opd && tindakan.opd.length > 0 
    ? tindakan.opd.join(", ") 
    : '-';
  
  const responses = [
    `Terima kasih ${sapaan} ${nama}, berikut detail laporan Anda:\n\n🆔 *Laporan ID:* ${nomorLaporan}*\n\n📍 *Lokasi:* ${report.location.desa}, ${report.location.kecamatan}, ${report.location.kabupaten}\n\n📅 *Tanggal:* ${report.createdAt.toLocaleDateString('id-ID')}\n\n⏰ *Waktu:* ${new Date(report.createdAt).toTimeString().slice(0, 5)} WIB\n\n📝 *Isi Laporan:* ${report.message}\n\n📌 *Tindakan Terbaru:*\n\n• *OPD Terkait:* ${opdList}\n\n• *Tingkat Kedaruratan:* ${tindakan?.situasi || '-'}\n\n• *Status:* ${tindakan?.status || '-'}`,
    `Berikut informasi laporan Anda, ${sapaan} ${nama}:\n\n🆔 *ID:* ${nomorLaporan}\n\n📍 *Lokasi:* ${report.location.desa}, ${report.location.kecamatan}, ${report.location.kabupaten}\n\n📅 *Tanggal:* ${report.createdAt.toLocaleDateString('id-ID')}\n\n⏰ *Waktu:* ${new Date(report.createdAt).toTimeString().slice(0, 5)} WIB\n\n📝 *Isi laporan:* ${report.message}\n\n*Tindakan:*\n\n• *OPD:* ${opdList}\n\n• *Tingkat Kedaruratan:* ${tindakan?.situasi || '-'}\n\n• *Status:* ${tindakan?.status || '-'}`,
    `Laporan ${nomorLaporan} atas nama ${sapaan} ${nama}:\n\n📍 *Lokasi:* ${report.location.desa}, ${report.location.kecamatan}, ${report.location.kabupaten}\n\n📅 *Tanggal:* ${report.createdAt.toLocaleDateString('id-ID')}\n\n⏰ *Waktu:* ${new Date(report.createdAt).toTimeString().slice(0, 5)} WIB\n\n📝 *Isi laporan:* ${report.message}\n\n*Tindakan:*\n\n• *OPD:* ${opdList}\n\n• *Tingkat Kedaruratan:* ${tindakan?.situasi || '-'}\n\n• *Status:* ${tindakan?.status || '-'}`,
    `Detail laporan ${sapaan} ${nama} (🆔 : ${nomorLaporan}):\n\n📍 *Lokasi:* ${report.location.desa}, ${report.location.kecamatan}, ${report.location.kabupaten}\n\n📅 *Tanggal:* ${report.createdAt.toLocaleDateString('id-ID')}\n\n⏰ *Waktu:* ${new Date(report.createdAt).toTimeString().slice(0, 5)} WIB\n\n📝 *Isi laporan:* ${report.message}\n\nTindakan:\n\n• *OPD:* ${opdList}\n\n• *Tingkat Kedaruratan:* ${tindakan?.situasi || '-'}\n\n• *Status:* ${tindakan?.status || '-'}`,
    `Info laporan:\n\n🆔 *ID:* ${nomorLaporan}\n\n📍 *Lokasi:* ${report.location.desa}, ${report.location.kecamatan}, ${report.location.kabupaten}\n\n📅 *Tanggal:* ${report.createdAt.toLocaleDateString('id-ID')}\n\n⏰ *Waktu:* ${new Date(report.createdAt).toTimeString().slice(0, 5)} WIB\n\n📝 *Isi laporan:* ${report.message}\n\n*Tindakan terbaru:*\n\n• *OPD:* ${opdList}\n\n• *Tingkat Kedaruratan:* ${tindakan?.situasi || '-'}\n\n• *Status:* ${tindakan?.status || '-'}`
  ];
  return randomResponse(responses);
}

function handlerDefault() {
  const responses = [
    `Mohon ikuti langkah pelaporan sesuai instruksi.\n\nSilahkan ketik *menu* untuk mengulang.`,
    `Mohon ikuti arahan pelaporan.\n\nAgar sesuai dengan arahan, mohon ketik *menu*.`,
    `Silakan mengikuti tahapan pembuatan laporan.\n\nUntuk mengikuti tahapan tersebut, ketik *menu*.`,
    `Proses pembuatan laporan mesti sesuai dengan tahapan.\n\nKetik *menu* untuk menyesuaikan.`,
    `Pelaporan mesti sesuai dengan proses pelaporan, mohon ketik *menu*.`
  ];
  return randomResponse(responses);
}

module.exports = {
  kembaliKeMenu,
  laporanTidakDitemukan,
  detailLaporan,
  handlerDefault
};
