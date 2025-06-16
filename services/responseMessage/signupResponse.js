function randomResponse(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function mintaNama() {
  const responses = [
    `Silakan masukkan *nama lengkap* Anda sesuai KTP.`,
    `Mohon isi *nama lengkap* Anda sesuai KTP.`,
    `Tolong ketik *nama lengkap* Anda sesuai KTP.`,
    `Masukkan *nama lengkap* Anda (sesuai KTP) untuk melanjutkan proses pelaporan.`,
    `*Nama lengkap* sesuai KTP diperlukan, silakan tulis.`
  ];
  return randomResponse(responses);
}

function terimaKasihNama(nama) {
  const responses = [
    `Terima kasih ${nama}, silakan ketik *jenis kelamin* Anda (pria/wanita).`,
    `Nama ${nama} sudah tercatat. Sekarang, ketik *jenis kelamin* Anda (pria/wanita).`,
    `Baik ${nama}, selanjutnya silakan tulis *jenis kelamin* (pria atau wanita).`,
    `Terima kasih, ${nama}. Silakan pilih *jenis kelamin* Anda (pria/wanita)?`,
    `Nama sudah diterima, ${nama}. Mohon sebutkan *jenis kelamin* Anda (pria/wanita).`
  ];
  return randomResponse(responses);
}

function jenisKelaminTidakValid() {
  const responses = [
    `Penulisan jenis kelamin harus sesuai.\n\nSilakan ketik *pria* atau *wanita*.`,
    `Mohon hanya ketik *pria* atau *wanita* saja.`,
    `Jenis kelamin harus diketik *pria* atau *wanita*.\n\nSilakan coba lagi.`,
    `Mohon tulis jenis kelamin sesuai yang dengan permintaan.\n\nKetik *pria* atau *wanita*.`,
    `Cara penulisan jenis kelamin salah.\n\nMohon hanya ketik *pria* atau *wanita*.`
  ];
  return randomResponse(responses);
}

function konfirmasiData(name, jenis_kelamin) {
  const responses = [
    `Berikut adalah data Anda:\nNama: *${name}*\nJenis Kelamin: *${jenis_kelamin}*\n\nJika sudah benar, silakan ketik *kirim* untuk menyimpan data anda, atau *batal* untuk membatalkan.`,
    `Cek kembali data berikut:\nNama: *${name}*\nJenis Kelamin: *${jenis_kelamin}*\nKetik *kirim* jika sudah benar, atau *batal* untuk membatalkan.`,
    `Data Anda:\nNama: *${name}*\nJenis Kelamin: *${jenis_kelamin}*\n\nKetik *kirim* untuk simpan, atau *batal* untuk membatalkan.`,
    `Nama: *${name}*\nJenis Kelamin: *${jenis_kelamin}*\n\nKetik *kirim* untuk menyimpan, atau *batal* untuk membatalkan.`,
    `Konfirmasi data:\nNama: *${name}*\nJenis Kelamin: *${jenis_kelamin}*\n\nKetik *kirim* jika benar, atau *batal* jika ingin membatalkan.`
  ];
  return randomResponse(responses);
}

function dataTersimpan() {
  const responses = [
    `Data anda telah disimpan.\n\nSilakan ceritakan dengan cara mengetik keluhan atau kejadian yang ingin Anda laporkan.`,
    `Pendaftaran berhasil!\n\nSekarang, silakan tuliskan keluhan atau laporan Anda.`,
    `Data berhasil disimpan.\n\nSilakan lanjutkan dengan menulis laporan atau keluhan.`,
    `Data telah tersimpan.\n\nSilakan ceritakan masalah atau laporan Anda.`,
    `Data Anda sudah kami simpan.\n\nSilakan tuliskan keluhan atau kejadian yang ingin dilaporkan.`
  ];
  return randomResponse(responses);
}

function pendaftaranDibatalkan(nama) {
  const responses = [
    `Terima kasih ${nama}, pendaftaran dibatalkan.`,
    `Pendaftaran atas nama ${nama} telah dibatalkan.`,
    `Pendaftaran dibatalkan. Terima kasih, ${nama}.`,
    `Data tidak tersimpan, ${nama}.`,
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
    `Apakah nama Anda sudah benar:\n\n*${nama}*?\n\nKetik *kirim* untuk melanjutkan atau *batal* untuk membatalkan.`,
    `Nama Anda adalah:\n\n*${nama}*.\n\nJika sudah benar, ketik *kirim*, jika ingin mengubah, ketik *batal*.`,
    `Tolong konfirmasi nama Anda:\n\n*${nama}*.\n\nKetik *kirim* untuk lanjut, atau *batal* untuk membatalkan.`,
    `Mohon cek kembali nama Anda:\n\n*${nama}*\n\nApakah sudah benar? Ketik *kirim* untuk melanjutkan, atau *batal* untuk membatalkan.`,
    `Konfirmasi nama:\n\n*${nama}*\n\nKetik *kirim* jika sudah benar, atau *batal* jika ingin membatalkan.`
  ];
  return randomResponse(responses);
}

function namaTerlaluPanjang() {
  const responses = [
    `Nama terlalu panjang.\n\nSilakan masukkan nama yang lebih singkat.`,
    `Nama Anda terlalu panjang.\n\nMohon gunakan nama yang lebih pendek.`,
    `Nama yang Anda masukkan terlalu panjang.\n\nSilakan coba lagi dengan nama yang lebih singkat.`,
    `Maaf, nama Anda terlalu panjang.\n\nSilakan masukkan nama yang lebih singkat.`,
    `Nama tidak boleh lebih dari 30 huruf.\n\nSilakan coba lagi dengan nama yang lebih pendek.`
  ];
  return randomResponse(responses);
}

function handlerDefault() {
  const responses = [
    `Mohon ikuti langkah pelaporan sesuai instruksi.\n\nSilahkan ketik *menu*.`,
    `Mohon ikuti arahan pelaporan.\n\nAgar sesuai dengan arahan, mohon ketik *menu*.`,
    `Silakan mengikuti tahapan pembuatan laporan.\n\nUntuk mengikuti tahapan tersebut, ketik *menu*.`,
    `Proses pembuatan laporan mesti sesuai dengan tahapan.\n\nKetik *menu* untuk menyesuaikan.`,
    `Pelaporan mesti sesuai dengan proses pelaporan, mohon ketik *menu*.`
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
  handlerDefault,
  konfirmasiNama,
  namaTerlaluPanjang
};
