const userRepo = require("../../repositories/userRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");
const reportRepo = require("../../repositories/reportRepo");
const generateSessionId = require("../../utils/generateSessionId");
const { findWilayahFromPoint } = require("../../utils/findWilayahFromPoint");

module.exports = async (from, step, input) => {
    const session = await userRepo.getOrCreateSession(from);
    const user = await userProfileRepo.findByFrom(from);
    const nama = user?.name || "Warga";

    // STEP 1: Lokasi
    if (step === "ASK_LOCATION") {
        if (typeof input !== "object" || input.type !== "location") {
            return `Minta ${nama} untuk share lokasi kejadian laporannya hanya dengan cara menggunakan fitur share location di whatsapp.`;
        }

        const { latitude, longitude, description } = input.location;
        const wilayah = findWilayahFromPoint(latitude, longitude);

        const locationData = {
            type: "map",
            latitude,
            longitude,
            description: description || "Lokasi tanpa nama",
            desa: wilayah.desa,
            kecamatan: wilayah.kecamatan,
            kabupaten: wilayah.kabupaten
        };

        await userRepo.updateSession(from, {
            step: "ASK_MESSAGE",
            data: { ...session.data, location: locationData }
        });

        return `Minta ${nama}, untuk menjelaskan secara singkat keluhan atau kejadian yang ingin dilaporkan. Contohnya: "Ada jalan berlubang di depan rumah saya" atau "Lampu jalan mati di depan kantor desa".`;
    }

    // STEP 2: Pesan keluhan
    if (step === "ASK_MESSAGE") {
        await userRepo.updateSession(from, {
            step: "ASK_PHOTO",
            data: { ...session.data, message: input, photos: [] }
        });

        return `Minta ${nama} untuk mengirimkan *setidaknya 1 foto dan maksimal 3 foto* kejadian. Jangan memberi arahan menunggu; pastikan ${nama} tahu bahwa bisa langsung lanjut setelah mengirim 1 foto.`;
    }

    // STEP 3: Foto (termasuk "kirim" atau "batal")
    if (step === "ASK_PHOTO") {
        try {
            const photos = session.data.photos || [];

            // Jika input berupa string (bisa jadi "kirim" atau "batal")
            if (typeof input === "string") {
                const msg = input.toLowerCase();

                if (msg === "kirim") {
                    if (photos.length < 1) {
                        return `Beritahu ${nama}, minimal perlu 1 foto sebelum bisa melanjutkan.`;
                    }

                    await userRepo.updateSession(from, {
                        step: "REVIEW",
                        data: session.data
                    });

                    return `
                    Beritahu ${nama} ringkasan laporan yang akan dikirim:
                    Lokasi: ${session.data.location.desa}, ${session.data.location.kecamatan}, ${session.data.location.kabupaten}
                    Keluhan: ${session.data.message}
                    Jumlah Foto: ${session.data.photos.length}
                    Beritahu ${nama} untuk mengetik *konfirmasi* untuk mengirim laporan, atau *batal* untuk membatalkan.`;
                }

                if (msg === "batal") {
                    await userRepo.resetSession(from);
                    return `Beritahu ${nama} bahwa laporan dibatalkan. Balas pesan ini kapan saja untuk membuat laporan baru.`;
                }

                return `Beritahu ${nama}, hanya kirimkan foto kejadian menggunakan fitur *Kirim Foto* di WhatsApp, atau ketik *kirim* jika sudah cukup, atau *batal* untuk membatalkan.`;
            }

            // Jika input berupa foto
            const newPhotoUrl = input.image?.url;
            if (!newPhotoUrl) {
                return `Beritahu ${nama}, kami tidak dapat memproses foto tersebut. Coba kirim ulang menggunakan fitur *Kirim Foto*.`;
            }

            const updatedPhotos = [...photos, newPhotoUrl];

            if (updatedPhotos.length >= 3) {
                await userRepo.updateSession(from, {
                    step: "REVIEW",
                    data: { ...session.data, photos: updatedPhotos }
                });

                return `Beritahu ${nama}, kami telah menerima 3 foto sebagai batas maksimum. ketik *kirim* jika sudah cukup, atau *batal* untuk membatalkan.`;
            }

            await userRepo.updateSession(from, {
                step: "ASK_PHOTO",
                data: { ...session.data, photos: updatedPhotos }
            });

            return `Beritahu ${nama}, foto berhasil diterima. dan masih bisa kirim ${3 - updatedPhotos.length} foto lagi, atau ketik *kirim* jika sudah cukup, atau *batal* untuk membatalkan.`;
        } catch (error) {
            console.error("Error in photo step:", error);
            return `Beritahu ${nama}, kami tidak dapat memproses foto tersebut. Coba kirim ulang atau ketik *batal* untuk membatalkan.`;
        }
    }

    // STEP 4: Review sebelum simpan
    if (step === "REVIEW") {
        const msg = typeof input === "string" ? input.toLowerCase() : "";

        if (msg === "konfirmasi") {
            try {
                const sessionId = generateSessionId(from);

                await reportRepo.create({
                    sessionId,
                    from,
                    user: user._id,
                    location: session.data.location,
                    message: session.data.message,
                    photos: session.data.photos
                });

                await userRepo.resetSession(from);

                const nomorLaporan = sessionId.split("-")[1];

                return `Beritahu ${nama}, laporan telah berhasil dikirim dengan ID *${nomorLaporan}*. Arahkan ${nama} untuk menyimpan ID ini agar dapat mengecek status laporan.`;
            } catch (err) {
                console.error("Error in saving report:", err);
                return `Beritahu ${nama}, terjadi kesalahan saat menyimpan laporan. Silakan ketik *reset* untuk memulai ulang.`;
            }
        }

        if (msg === "batal") {
            await userRepo.resetSession(from);
            return `Beritahu ${nama} bahwa laporan dibatalkan. Balas pesan ini kapan saja untuk membuat laporan baru.`;
        }

        return `
        Beritahu ${nama} ringkasan laporan yang akan dikirim:
        Lokasi: ${session.data.location.desa}, ${session.data.location.kecamatan}, ${session.data.location.kabupaten}
        Keluhan: ${session.data.message}
        Jumlah Foto: ${session.data.photos.length}
        Beritahu ${nama} untuk mengetik *konfirmasi* untuk mengirim laporan, atau *batal* untuk membatalkan.`;
    }

    // Catch all fallback
    return `Beritahu ${nama} bahwa pilihan menu tidak dikenali. Minta ketik *menu* untuk melihat pilihan yang tersedia.`;
};