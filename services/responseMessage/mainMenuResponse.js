function randomResponse(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function belumTerdaftar() {
  const responses = [
    `Data diri Anda belum terdaftar di sistem kami. Silakan masukkan nama lengkap sesuai KTP sebelum membuat laporan.`,
    `Anda belum terdaftar. Mohon isi nama lengkap sesuai KTP untuk melanjutkan.`,
    `Nama Anda belum ada di sistem kami. Masukkan nama lengkap sesuai KTP agar bisa membuat laporan.`,
    `Sebelum membuat laporan, silakan daftarkan nama lengkap Anda sesuai KTP.`,
    `Data belum ditemukan. Masukkan nama lengkap sesuai KTP untuk proses selanjutnya.`
  ];
  return randomResponse(responses);
}

function mulaiLaporan(sapaan, nama) {
  const responses = [
    `Silakan ${sapaan} ${nama}, ceritakan keluhan atau kejadian yang ingin Anda laporkan.`,
    `Yuk, ${sapaan} ${nama}, tuliskan keluhan atau kejadian yang ingin dilaporkan.`,
    `Silakan sampaikan keluhan Anda, ${sapaan} ${nama}.`,
    `Ceritakan masalah atau kejadian yang ingin dilaporkan, ${sapaan} ${nama}.`,
    `Tulis keluhan atau kejadian yang ingin Anda laporkan, ${sapaan} ${nama}.`
  ];
  return randomResponse(responses);
}

function cekBelumTerdaftar() {
  const responses = [
    `Belum ada laporan terdaftar di sistem kami. Mohon buat laporan terlebih dahulu.`,
    `Maaf, Anda belum memiliki laporan yang bisa dicek. Mohon buat laporan baru.`,
    `Tidak ditemukan laporan terdaftar. Mohon buat laporan sebelum melakukan pengecekan.`,
    `Sistem belum menemukan laporan Anda. Mohon buat laporan terlebih dahulu.`,
    `Belum ada data laporan. Mohon buat laporan untuk bisa melakukan pengecekan.`
  ];
  return randomResponse(responses) + `Silakan ketik "buat laporan"`;
}

function mintaIdLaporan(sapaan, nama) {
  const responses = [
    `Silakan ${sapaan} ${nama}, masukkan *ID laporan* Anda. Contoh: 12345678.`,
    `Masukkan ID laporan Anda, ${sapaan} ${nama}. Contoh: 12345678.`,
    `Tolong ketikkan ID laporan Anda, ${sapaan} ${nama}. Contoh: 12345678.`,
    `Mohon masukkan ID laporan Anda, ${sapaan} ${nama}. Contoh: 12345678.`,
    `Silakan input ID laporan Anda, ${sapaan} ${nama}, misal: 12345678.`
  ];
  return randomResponse(responses);
}

function mainMenuDefault() {
  const responses = [
    `Mohon ikuti langkah pelaporan sesuai instruksi. Silahkan ketik "menu".`,
    `Mohon ikuti arahan pelaporan. Agar sesuai dengan arahan, mohon ketik "menu".`,
    `Silakan mengikuti tahapan pembuatan laporan. Untuk mengikuti tahapan tersebut, ketik "menu".`,
    `Proses pembuatan laporan mesti sesuai dengan tahapan, ketik "menu" untuk menyesuaikan.`,
    `Pelaporan mesti sesuai dengan proses pelaporan, mohon ketik "menu".`
  ];
  return randomResponse(responses);
}

function arahKeluhan() {
  const responses = [
    `Silahkan untuk membuat laporan baru, bisa di jelaskan kembali apa keluhan Anda?`,
  ];
  return randomResponse(responses);
}

function angryComplaintResponse() {
  const responses = [
    `Mohon maaf atas apa yang terjadi, kami siap menerima laporan anda, silahkan untuk menjelaskan dengan detail keluhannya.`,
  ];
  return randomResponse(responses);
}

function complaintResponse() {
  const responses = [
    `Silahkan ceritakan kembali dengan detail apa yang ingin anda laporkan.`,
  ];
  return randomResponse(responses);
}

module.exports = {
  belumTerdaftar,
  mulaiLaporan,
  cekBelumTerdaftar,
  mintaIdLaporan,
  mainMenuDefault,
  arahKeluhan,
  angryComplaintResponse,
  complaintResponse
};
