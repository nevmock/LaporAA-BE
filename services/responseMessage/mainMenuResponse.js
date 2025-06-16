function randomResponse(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function belumTerdaftar() {
  const responses = [
    `Sebelum lanjut lapor, harap mendaftarkan diri Anda terlebih dahulu.\n\nPertama-tama, sebutkan *nama lengkap* Anda sesuai KTP.`,
    `Mohon mendaftarkan diri terlebih dahulu secara bertahap sebelum melapor.\n\nPertama, tolong sebutkan *nama lengkap* Anda sesuai KTP.`,
    `Anda harus mendaftar dulu, sebelum menjelaskan keluhan.\n\nDi tahap ini, tolong sebutkan *Nama lengkap* Anda yang sesuai dengan KTP.`,
    `Anda wajib mendaftar dulu sebelum menuliskan keluhan.\n\nPertama, tolong sebutkan *nama lengkap* sesuai KTP.`,
    `Harap mendaftar dulu sebelum melanjutkan pelaporan. \n\nPertama-tama, tolong tuliskan *nama lengkap* Anda sesuai KTP.`
  ];
  return randomResponse(responses);
}

function mulaiLaporan(sapaan, nama) {
  const responses = [
    `Silakan ${sapaan} ${nama}, ceritakan keluhan atau kejadian yang ingin dilaporkan.`,
    `${sapaan} ${nama}, tuliskan keluhan atau kejadian yang ingin dilaporkan.`,
    `Silakan sampaikan keluhan Anda, ${sapaan} ${nama}.`,
    `Ceritakan masalah yang ingin dilaporkan, ${sapaan} ${nama}.`,
    `Tulis keluhan atau kejadian yang ingin dilaporkan, ${sapaan} ${nama}.`
  ];
  return randomResponse(responses);
}

// function cekBelumTerdaftar() {
//   const responses = [
//     `Anda belum pernah mendaftarkan diri. Mohon mendaftarkan diri terlebih dahulu.`,
//     `Maaf, sepertinya Anda belum membuat laporan. Mohon buat laporan baru.`,
//     `Laporan tersebut tidak ditemukan. Mohon buat laporan sebelum melakukan pengecekan.`,
//     `Sistem belum menemukan laporan Anda. Mohon buat laporan terlebih dahulu.`,
//     `Belum ada data laporan. Mohon buat laporan untuk bisa melakukan pengecekan.`
//   ];
//   return randomResponse(responses) + `Silakan ketik "buat laporan"`;
// }

function mintaIdLaporan(sapaan, nama) {
  const responses = [
    `Silakan ${sapaan} ${nama}, masukkan *ID laporan* Anda. Contoh: 12345678.`,
    `Masukkan *ID laporan* Anda, ${sapaan} ${nama}. Contoh: 12345678.`,
    `Tolong ketikkan *ID laporan* Anda, ${sapaan} ${nama}. Contoh: 12345678.`,
    `Mohon masukkan *ID laporan* Anda, ${sapaan} ${nama}. Contoh: 12345678.`,
    `Silakan input *ID laporan* Anda, ${sapaan} ${nama}, misal: 12345678.`
  ];
  return randomResponse(responses);
}

function mainMenuDefault() {
  const responses = [
    `Mohon ikuti langkah pelaporan sesuai instruksi.\n\nSilahkan ketik *menu* agar sesuai dengan instruksi.`,
    `Mohon ikuti arahan pelaporan.\n\nAgar sesuai dengan arahan, silahkan ketik *menu* agar sesuai dengan arahan.`,
    `Silakan mengikuti tahapan pembuatan laporan.\n\nUntuk mengikuti tahapan tersebut, silahkan ketik *menu*.`,
    `Proses pembuatan laporan mesti sesuai dengan tahapan.\n\nSilahkan ketik *menu* agar sesuai dengan tahapan.`,
    `Pelaporan mesti sesuai dengan proses pelaporan.\n\nSilahkan ketik *menu* agar sesuai dengan tahap pelaporan.`
  ];
  return randomResponse(responses);
}

function angryComplaintResponse() {
  const responses = [
    `Mohon maaf atas apa yang terjadi, kami mengerti kekesalah dan kemarahan Anda.\n\nKami siap menerima laporan anda, silahkan jelaskan dengan detail keluhannya.`,
  ];
  return randomResponse(responses);
}

function angryComplaintSignup() {
  const responses = [
    `Mohon maaf atas apa yang terjadi, kami mengerti bahwa Anda sedang kesal dan marah. Kami siap menerima laporan anda.\n\nAkan tetapi data diri anda *belum terdaftar* di sistem kami, silahkan sebutkan *nama lengkap* anda sesuai KTP untuk melanjutkan proses pelaporan.`,
  ];
  return randomResponse(responses);
}

function complaintResponse() {
  const responses = [
    `Mohon maaf atas apa yang terjadi, kami mengerti, dan kami siap menerima laporan anda.\n\nSilahkan jelaskan dengan detail keluhannya.`,
  ];
  return randomResponse(responses);
}

function complaintSignup() {
  const responses = [
    `Mohon maaf atas apa yang terjadi, kami mengerti, dan kami siap menerima laporan anda. Akan tetapi kami memerlukan perlu mengetahui diri Anda terlebih dahulu.\n\nSilahkan sebutkan *nama lengkap* Anda sesuai KTP untuk melanjutkan proses pelaporan.`,
  ];
  return randomResponse(responses);
}

function menuTakDikenal(sapaan, nama) {
  const responses = [
    `Mohon Maaf ${sapaan} ${nama}, kami perlu tahu kebutuhan Anda terlebih dahulu.\n\nApakah Anda ingin *membuat laporan* atau *cek status laporan*?`,
    'Maaf, harap sebutkan kebutuhan Anda terlebih dahulu.\n\nApakah Anda ingin *buat laporan* atau *cek status laporan*?',
    'Sebutkan terlebih dahulu keinginan Anda.\n\nApakah Anda ingin *buat laporan* atau *cek status laporan*?',
    'Harap sebutkan keinginan Anda dulu.\n\nApakah Anda ingin *cek status laporan* atau *buat laporan*?',
    'Mohon maaf, kami harus tahu kebutuhan Anda terlebih dahulu.\n\nApakah Anda ingin *membuat laporan* atau *cek status laporan*?'
  ];
  return (
    randomResponse(responses)
  );
}

module.exports = {
  belumTerdaftar,
  mulaiLaporan,
  // cekBelumTerdaftar,
  mintaIdLaporan,
  mainMenuDefault,
  angryComplaintResponse,
  complaintResponse,
  angryComplaintSignup,
  complaintSignup,
  menuTakDikenal
};
