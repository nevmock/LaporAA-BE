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

        return `Baik ${nama}, sekarang mohon kirimkan *foto pendukung* yang berkaitan dengan laporan Anda.\n\n📸 *Minimal 1 foto*, maksimal 3 foto. Jika sudah selesai mengirimkan, balas dengan ketik *selesai*.`;
    }

    // STEP 3: Foto
    if (step === "ASK_PHOTO") {
        const photos = session.data.photos || [];

        if (typeof input === "string" && input.toLowerCase() === "selesai") {
            if (photos.length === 0) {
                return `Mohon kirimkan *setidaknya 1 foto* sebelum melanjutkan.`;
            }

            await userRepo.updateSession(from, {
                step: "CONFIRMATION",
                data: { ...session.data, photos }
            });

            return `📎 Foto sudah kami terima.\n\n${nama}, jika semua data sudah benar, ketik *kirim* untuk mengirimkan laporan Anda, atau *batal* jika ingin membatalkan.`;
        }

        if (typeof input === "object" && input.type === "image") {
            const newPhotoUrl = input.image?.url;
            if (!newPhotoUrl) {
                return `Maaf ${nama}, kami tidak dapat memproses foto tersebut. Coba kirim ulang fotonya.`;
            }

            const updatedPhotos = [...photos, newPhotoUrl];

            if (updatedPhotos.length >= 3) {
                await userRepo.updateSession(from, {
                    step: "CONFIRMATION",
                    data: { ...session.data, photos: updatedPhotos }
                });

                return `✅ Kami telah menerima 3 foto.\n\n${nama}, jika semua data sudah benar, ketik *kirim* untuk melanjutkan atau *batal* untuk membatalkan.`;
            }

            await userRepo.updateSession(from, {
                step: "ASK_PHOTO",
                data: { ...session.data, photos: updatedPhotos }
            });

            return `📸 Foto sudah diterima (${updatedPhotos.length}/3).\nJika sudah cukup, ketik *selesai*.`;
        }

        return `Mohon kirimkan *foto pendukung* atau ketik *selesai* jika sudah selesai mengirim foto.`;
    }

    // STEP 4: Konfirmasi
    if (step === "CONFIRMATION") {
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

            return `🎉 Terima kasih ${nama}, laporan Anda telah berhasil dikirim dengan ID *${sessionId}*.\n\nTim kami akan segera memprosesnya. Anda dapat mengecek status laporan ini kapan saja dengan memasukkan ID-nya. 🙏`;
        }

        if (msg === "batal") {
            await userRepo.resetSession(from);
            return `Laporan dibatalkan.\nJika ingin mulai lagi, silakan pilih menu kembali.`;
        }

        return `Ketik *kirim* untuk mengirim laporan Anda atau *batal* untuk membatalkan.`;
    }

    return `Warga dengan nama ${nama} memilih menu yang tidak dikenali. Silakan pilih menu yang tersedia. atau ketik 'menu' untuk melihat menu.`;
};
