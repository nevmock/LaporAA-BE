// utils/inputTypes.js

const affirmativeInputs = [
    "konfirmasi", "betul", "benar", "siap", "oke", "iya", "ya", "baik", "sudah", "lanjut", "sip", "mantap", "aman", "udah", "ok", "lanjutkan", "bener",
    "konfirmasi pak", "betul pak", "benar pak", "siap pak", "oke pak", "iya pak", "ya pak", "baik pak", "sudah pak", "lanjut pak", "sip pak", "mantap pak", "aman pak", "udah pak", "ok pak", "lanjutkan pak", "bener pak",
    "konfirmasi pa", "betul pa", "benar pa", "siap pa", "oke pa", "iya pa", "ya pa", "baik pa", "sudah pa", "lanjut pa", "sip pa", "mantap pa", "aman pa", "udah pa", "ok pa", "lanjutkan pa", "bener pa",
];

const negativeInputs = [
    "batal", "salah", "bukan", "tidak tepat", "tidak", "belum", "keliru", "kurang tepat", "tidak bisa", "tidak sesuai", "belum valid", "gagal", "dibatalkan",
    "batalkan", "belum lengkap", "tidak lengkap", "belum diproses", "mohon dicek kembali", "cek lagi", "coba lagi", "perlu diperbaiki", "perbaiki", "terjadi kesalahan",
    "kesalahan", "input salah", "data tidak cocok", "tidak cocok", "nggak cocok", "nggak sesuai", "nggak pas", "nggak tepat", "nggak valid", "nggak betul", "nggak benar", "nggak bener",
    "batal pak", "salah pak", "bukan pak", "tidak tepat pak", "tidak pak", "belum pak", "keliru pak", "kurang tepat pak", "tidak bisa pak", "tidak sesuai pak", "belum valid pak", "gagal pak", "dibatalkan pak",
    "batalkan pak", "belum lengkap pak", "tidak lengkap pak", "belum diproses pak", "mohon dicek kembali pak", "cek lagi pak", "coba lagi pak", "perlu diperbaiki pak", "perbaiki pak", "terjadi kesalahan pak",
    "kesalahan pak", "input salah pak", "data tidak cocok pak", "tidak cocok pak", "nggak cocok pak", "nggak sesuai pak", "nggak pas pak", "nggak tepat pak", "nggak valid pak", "nggak betul pak", "nggak benar pak", "nggak bener pak",
    "batal pa", "salah pa", "bukan pa", "tidak tepat pa", "tidak pa", "belum pa", "keliru pa", "kurang tepat pa", "tidak bisa pa", "tidak sesuai pa", "belum valid pa", "gagal pa", "dibatalkan pa",
    "batalkan pa", "belum lengkap pa", "tidak lengkap pa", "belum diproses pa", "mohon dicek kembali pa", "cek lagi pa", "coba lagi pa", "perlu diperbaiki pa", "perbaiki pa", "terjadi kesalahan pa",
    "kesalahan pa", "input salah pa", "data tidak cocok pa", "tidak cocok pa",
    "nggak cocok pa", "enggak cocok pa", "gak cocok pa", "ga cocok pa",
    "nggak sesuai pa", "enggak sesuai pa", "gak sesuai pa", "ga sesuai pa",
    "nggak tepat pa", "enggak tepat pa", "gak tepat pa", "ga tepat pa",
    "nggak valid pa", "enggak valid pa", "gak valid pa", "ga valid pa",
    "nggak betul pa", "enggak betul pa", "gak betul pa", "ga betul pa",
    "nggak benar pa", "enggak benar pa", "gak benar pa", "ga benar pa",
    "nggak bener pa", "enggak bener pa", "gak bener pa", "ga bener pa",
    "nggak pas pa", "enggak pas pa", "gak pas pa", "ga pas pa",
];

const genderInputs = {
    male: ["pria", "laki", "laki-laki", "cowok", "cowo", "lelaki", "jantan"],
    female: ["wanita", "perempuan", "cewek", "cewe", "betina"],
};

module.exports = {
    affirmativeInputs,
    negativeInputs,
    genderInputs,
};