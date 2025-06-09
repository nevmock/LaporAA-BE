function randomResponse(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function mintaNama() {
  const responses = [
    `Silakan masukkan nama lengkap Anda sesuai KTP.`,
    `Mohon isi nama lengkap Anda sesuai KTP.`,
    `Tolong masukkan nama lengkap sesuai KTP Anda.`,
    `Masukkan nama lengkap Anda (sesuai KTP) untuk melanjutkan.`,
    `Nama lengkap sesuai KTP diperlukan, silakan isi di bawah ini.`
  ];
  return randomResponse(responses);
}

function terimaKasihNama(nama) {
  const responses = [
    `Terima kasih ${nama}, silakan masukkan jenis kelamin anda (pria/wanita).`,
    `Nama ${nama} sudah tercatat. Sekarang, masukkan jenis kelamin Anda (pria/wanita).`,
    `Baik ${nama}, selanjutnya silakan isi jenis kelamin (pria atau wanita).`,
    `Terima kasih, ${nama}. Silakan pilih jenis kelamin Anda (pria/wanita)?`,
    `Nama sudah diterima, ${nama}. Mohon masukkan jenis kelamin Anda (pria/wanita).`
  ];
  return randomResponse(responses);
}

function jenisKelaminTidakValid() {
  const responses = [
    `Jenis kelamin tidak valid. Silakan masukkan ketik *pria* atau *wanita*.`,
    `Input jenis kelamin salah. Mohon ketik "pria" atau "wanita".`,
    `Jenis kelamin harus diketik "pria" atau "wanita". Silakan coba lagi.`,
    `Mohon masukkan jenis kelamin yang benar, ketik pria/wanita.`,
    `Jenis kelamin tidak dikenali. Mohon hanya ketik "pria" atau "wanita".`
  ];
  return randomResponse(responses);
}

function konfirmasiData(name, jenis_kelamin) {
  const responses = [
    `Berikut adalah data anda:\nNama: ${name}\nJenis Kelamin: ${jenis_kelamin}\n\nJika sudah benar, silakan ketik *kirim* untuk menyimpan data anda, atau *batal* untuk membatalkan.`,
    `Cek kembali data berikut:\nNama: ${name}\nJenis Kelamin: ${jenis_kelamin}\nKetik *kirim* jika sudah benar, atau *batal* untuk membatalkan.`,
    `Data Anda:\nNama: ${name}\nJenis Kelamin: ${jenis_kelamin}\n\nKetik "kirim" untuk simpan, atau "batal" untuk membatalkan.`,
    `Nama: ${name}\nJenis Kelamin: ${jenis_kelamin}\n\nKetik *kirim* untuk menyimpan, atau *batal* untuk membatalkan.`,
    `Konfirmasi data:\nNama: ${name}\nJenis Kelamin: ${jenis_kelamin}\n\nKetik "kirim" jika benar, atau "batal" jika ingin membatalkan.`
  ];
  return randomResponse(responses);
}

function dataTersimpan() {
  const responses = [
    `Data anda telah disimpan. Silakan ceritakan dengan cara mengetik keluhan atau kejadian yang ingin anda laporkan.`,
    `Pendaftaran berhasil! Sekarang, silakan tuliskan keluhan atau laporan Anda.`,
    `Data berhasil disimpan. Silakan lanjutkan dengan menulis laporan atau keluhan.`,
    `Data sudah tersimpan. Silakan ceritakan masalah atau laporan Anda.`,
    `Data Anda sudah kami simpan. Silakan tuliskan keluhan atau kejadian yang ingin dilaporkan.`
  ];
  return randomResponse(responses);
}

function pendaftaranDibatalkan(nama) {
  const responses = [
    `Terima kasih ${nama}, pendaftaran dibatalkan.`,
    `Pendaftaran atas nama ${nama} telah dibatalkan.`,
    `Pendaftaran dibatalkan. Terima kasih, ${nama}.`,
    `Data tidak disimpan. Pendaftaran dibatalkan untuk ${nama}.`,
    `Pendaftaran Anda dibatalkan, ${nama}.`
  ];
  return randomResponse(responses);
}

function konfirmasiKirimAtauBatal() {
  const responses = [
    `Mohon ketik *kirim* untuk menyimpan data, atau *batal* untuk membatalkan.`,
    `Ketik "kirim" untuk simpan data, atau "batal" untuk membatalkan.`,
    `Silakan ketik "kirim" jika data sudah benar, atau "batal" untuk membatalkan.`,
    `Jika sudah benar, ketik "kirim". Jika ingin membatalkan, ketik "batal".`,
    `Ketik *kirim* untuk menyimpan, atau *batal* untuk membatalkan proses.`
  ];
  return randomResponse(responses);
}

function konfirmasiNama(nama) {
  const responses = [
    `Apakah nama Anda sudah benar: ${nama}?\nKetik *kirim* untuk melanjutkan atau *batal* untuk membatalkan.`,
    `Nama yang Anda masukkan adalah: ${nama}.\nJika sudah benar, ketik *kirim*, jika ingin mengubah, ketik *batal*.`,
    `Tolong konfirmasi nama Anda: ${nama}.\nKetik "kirim" untuk lanjut, atau "batal" untuk membatalkan.`,
    `Nama: ${nama}. Apakah sudah benar?\nKetik *kirim* untuk melanjutkan, atau *batal* untuk membatalkan.`,
    `Konfirmasi nama: ${nama}.\nKetik "kirim" jika sudah benar, atau "batal" jika ingin membatalkan.`
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
    // `Pelaporan mesti sesuai dengan proses pelaporan, mohon ketik "menu". (signupResponse DEFAULT)`
  ];
  return randomResponse(responses);
}

module.exports = {
  mintaNama,
  terimaKasihNama,
  jenisKelaminTidakValid,
  konfirmasiData,
  dataTersimpan,
  pendaftaranDibatalkan,
  konfirmasiKirimAtauBatal,
  handlerDefault
};
