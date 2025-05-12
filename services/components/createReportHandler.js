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
            return `Halo ${nama}, mohon kirimkan *lokasi kejadian* menggunakan fitur *Kirim Lokasi* di WhatsApp. Lokasi ini penting untuk kami tindaklanjuti. 🙏`;
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
    
        return `Terima kasih ${nama}, lokasi sudah kami terima. Sekarang silakan ceritakan secara singkat apa yang terjadi atau apa yang ingin Anda laporkan.`;
    }    

    // STEP 2: Pesan keluhan
    if (step === "ASK_MESSAGE") {
        await userRepo.updateSession(from, {
            step: "ASK_PHOTO",
            data: { ...session.data, message: input, photos: [] }
        });

        return `minta warga untuk mengirimkan setidaknya 1 dan maksimal 3 foto kejadian sebelum melanjutkan dan jangan memberi arahan untuk menunggu yang membuat warga tidak tau langkah selanjutnya`;
    }

    // STEP 3: Foto
    if (step === "ASK_PHOTO") {
        const photos = session.data.photos || [];

        if (typeof input === "string" && input.toLowerCase() === "selesai") {
            if (photos.length === 0) {
                return `beri tahu warga kalau foto belum dikirim. Silakan kirimkan setidaknya 1dan maksimal 3 foto kejadian sebelum melanjutkan.`;
            }

            await userRepo.updateSession(from, {
                step: "CONFIRMATION",
                data: { ...session.data, photos }
            });

            return `Beri tahu warga ${nama}, jika fotonya sudah diterima, apakah foto mau ditambahkan lagi, jika tidak maka cukup ketik *selesai*.`;
        }

        if (typeof input === "object" && input.type === "image") {
            const newPhotoUrl = input.image?.url;
            if (!newPhotoUrl) {
                return `beri tahu ${nama}, kami tidak dapat memproses foto tersebut. Coba kirim ulang fotonya.`;
            }

            const updatedPhotos = [...photos, newPhotoUrl];

            if (updatedPhotos.length >= 3) {
                await userRepo.updateSession(from, {
                    step: "CONFIRMATION",
                    data: { ...session.data, photos: updatedPhotos }
                });

                return `Beri tahu ${nama}, Kami telah menerima 3 foto. jika semua data sudah benar, ketik *kirim* untuk melanjutkan atau *batal* untuk membatalkan.`;
            }

            await userRepo.updateSession(from, {
                step: "ASK_PHOTO",
                data: { ...session.data, photos: updatedPhotos }
            });

            return `Beri tahu warga ${nama}, jika fotonya sudah diterima, apakah foto mau ditambahkan lagi, jika tidak maka cukup ketik *selesai*.`;
        }

        return `Beri tahu warga ${nama}, jika fotonya sudah diterima, apakah foto mau ditambahkan lagi, jika tidak maka cukup ketik *selesai*.`;
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
    
                return `Terima kasih ${nama}, laporan Anda telah berhasil dikirim dengan ID *${sessionId}*. 
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
