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
            return `Beritahu ${nama}, mohon kirimkan *lokasi kejadian* menggunakan fitur *Kirim Lokasi* di WhatsApp. Lokasi ini diperlukan untuk memproses laporan Anda.`;
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

        return `Beritahu ${nama}, lokasi sudah kami terima. Sekarang silakan ceritakan secara singkat apa yang terjadi atau apa yang ingin Anda laporkan.`;
    }

    // STEP 2: Pesan keluhan
    if (step === "ASK_MESSAGE") {
        await userRepo.updateSession(from, {
            step: "ASK_PHOTO",
            data: { ...session.data, message: input, photos: [] }
        });

        return `Beritahu warga untuk mengirimkan setidaknya 1 dan maksimal 3 foto kejadian sebelum melanjutkan dan jangan memberi arahan untuk menunggu yang membuat warga tidak tau langkah selanjutnya`;
    }

    // STEP 3: Foto
    if (step === "ASK_PHOTO") {
        try {
            const photos = session.data.photos || [];

            const newPhotoUrl = input.image?.url;
            if (!newPhotoUrl) {
                return `Beritahu ${nama}, kami tidak dapat memproses foto tersebut. Coba kirim ulang fotonya.`;
            }

            if (typeof input === "string" && input.toLowerCase() === "selesai") {
                return `Beritahu ${nama}, jika semua data sudah benar, ketik *kirim* untuk melanjutkan atau *batal* untuk membatalkan.`
            }


            if (updatedPhotos.length >= 3) {
                await userRepo.updateSession(from, {
                    step: "CONFIRMATION",
                    data: { ...session.data, photos: updatedPhotos }
                });

                return `Beritahu ${nama}, Foto sudah kami terima maksimal batas yaitu 3, jika semua data sudah benar, ketik *kirim* untuk melanjutkan atau *batal* untuk membatalkan.`;
            }

            if (photos.length < 3) {
                await userRepo.updateSession(from, {
                    step: "CONFIRMATION",
                    data: { ...session.data, photos }
                });

                return `Beritahu ${nama} bahwa masih bisa kirim foto keluhan sampai dengan maksimal 3, tapi jika dirasa tidak perlu mengirimkan lagi maka ketik *kirim* untuk mengirimkan laporan Anda, atau *batal* jika ingin membatalkan.`;
            }
        } catch (error) {
            return `Beritahu ${nama}, kami tidak dapat memproses foto tersebut. Coba kirimkan foto pendukung atau ketik selesai jika sudah selesai mengirim foto.`;
        }
    }

    // STEP 4: Konfirmasi
    if (step === "CONFIRMATION") {
        try {
            const msg = typeof input === "string" ? input.toLowerCase() : "";

            if (msg === "kirim") {
                const user = await userProfileRepo.findByFrom(from);
                const sessionId = generateSessionId(from);

                await reportRepo.create({
                    sessionId,
                    from,
                    user: user._id,
                    location: session.data.location,
                    message: session.data.message,
                    photos: session.data.photos || []
                });

                await userRepo.resetSession(from);

                return `Terima kasih ${nama}, laporan Anda telah berhasil diproses dengan ID *${sessionId}*. 
                Tim kami akan segera memprosesnya. Anda dapat mengecek status laporan ini kapan saja dengan memasukkan ID-nya.
                `;
            }

            if (msg === "batal") {
                await userRepo.resetSession(from);
                return `Beri tahu warga bahwa pembuatan laporan dibatalkan. Balas pesan untuk kembali ke menu utama.`;
            }

            return `Beri tahu warga untuk mengetik *kirim* untuk menyimpan laporan, atau *batal* untuk membatalkan.`;
        }
        catch (error) {
            console.error("Error in confirmation step:", error);
            return `Beri tahu warga ${nama}, terjadi kesalahan saat memproses laporan. Silakan ketik *reset* untuk memulai pembuatan laporan baru.`;
        }
    }

    return `Warga dengan nama ${nama} memilih menu yang tidak dikenali. Silakan pilih menu yang tersedia. atau ketik 'menu' untuk melihat menu.`;
};
