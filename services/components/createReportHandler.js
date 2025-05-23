const userRepo = require("../../repositories/userRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");
const reportRepo = require("../../repositories/reportRepo");
const generateSessionId = require("../../utils/generateSessionId");
const { findWilayahFromPoint } = require("../../utils/findWilayahFromPoint");
const messageController = require("../../controllers/messageController");

module.exports = async (from, step, input) => {
    const session = await userRepo.getOrCreateSession(from);
    const user = await userProfileRepo.findByFrom(from);
    const nama = user?.name || "Warga";

    // STEP: Keluhan pertama
    if (step === "ASK_MESSAGE") {
        const newMessage = `- ${input}`;
        await userRepo.updateSession(from, {
            step: "APPEND_MESSAGE",
            data: { ...session.data, message: newMessage }
        });
        return `Apakah ada keluhan tambahan?\nJika sudah cukup, ketik *kirim*.`;
    }

    // STEP: Tambah keluhan
    if (step === "APPEND_MESSAGE") {
        const msg = input.toLowerCase();
        const currentMessage = session.data.message || "";

        if (msg === "kirim") {
            await userRepo.updateSession(from, {
                step: "CONFIRM_MESSAGE",
                data: { ...session.data }
            });

            return `Saya simpulkan keluhan anda sebagai berikut:\n\n${session.data.message}\n\nJika sudah sesuai, ketik *kirim* untuk lanjut ke lokasi kejadian, atau *batal* untuk mengulang.`;
        }

        if (msg === "batal") {
            await userRepo.resetSession(from);
            return `Baik ${nama}, laporan dibatalkan. Ketik *menu* untuk memulai kembali.`;
        }

        const updated = `${currentMessage}\n- ${input}`;
        await userRepo.updateSession(from, {
            step: "APPEND_MESSAGE",
            data: { ...session.data, message: updated }
        });

        return `Keluhan ditambahkan. Jika ada lagi, silakan tulis. Jika sudah cukup, ketik *kirim*.`;
    }

    // STEP: Konfirmasi keluhan
    if (step === "CONFIRM_MESSAGE") {
        const msg = input.toLowerCase();

        if (msg === "kirim") {
            await userRepo.updateSession(from, {
                step: "ASK_LOCATION",
                data: session.data
            });

            await messageController.sendTutorialImagesToUser(from);
            return `Baik ${nama}, silakan kirimkan *lokasi kejadian* menggunakan fitur *Kirim Lokasi* di WhatsApp.`;
        }

        if (msg === "batal") {
            await userRepo.updateSession(from, {
                step: "ASK_MESSAGE",
                data: session.data
            });

            return `Baik ${nama}, silakan jelaskan kembali keluhan Anda.`;
        }

        return `Silakan ketik *kirim* jika sudah sesuai, atau *batal* untuk mengulang.`;
    }

    // STEP: Lokasi
    if (step === "ASK_LOCATION") {
        if (typeof input !== "object" || input.type !== "location") {
            return `Mohon untuk kirim lokasi kejadian menggunakan fitur *Kirim Lokasi* di WhatsApp.`;
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
            step: "CONFIRM_LOCATION",
            data: { ...session.data, location: locationData }
        });

        return `Berikut lokasi yang Anda kirim:\n${wilayah.desa}, ${wilayah.kecamatan}, ${wilayah.kabupaten}\n\nKetik *kirim* jika sudah sesuai, atau *batal* untuk kirim ulang.`;
    }

    // STEP: Konfirmasi lokasi
    if (step === "CONFIRM_LOCATION") {
        const msg = input.toLowerCase();

        if (msg === "kirim") {
            await userRepo.updateSession(from, {
                step: "ASK_PHOTO",
                data: { ...session.data, photos: [] }
            });

            return `Silakan kirim *1–3 foto* pendukung. Cek kembali apakah foto yang dikirim sudah jelas dan relevan.`;
        }

        if (msg === "batal") {
            await userRepo.updateSession(from, {
                step: "ASK_LOCATION",
                data: session.data
            });

            return `Silakan kirim ulang lokasi kejadian dengan fitur *Kirim Lokasi* di WhatsApp.`;
        }

        return `Ketik *kirim* jika lokasi sudah benar, atau *batal* untuk kirim ulang.`;
    }

    // STEP: Foto (1–3, konfirmasi setelah upload)
    if (step === "ASK_PHOTO") {
        const photos = session.data.photos || [];

        if (typeof input === "string") {
            const msg = input.toLowerCase();

            if (msg === "kirim") {
                if (photos.length < 1) {
                    return `Mohon maaf ${nama}, minimal perlu 1 foto sebelum melanjutkan.`;
                }

                await userRepo.updateSession(from, {
                    step: "REVIEW",
                    data: session.data
                });

                return `Berikut ringkasan laporan Anda:\n\n📍 Lokasi: ${session.data.location.desa}, ${session.data.location.kecamatan}, ${session.data.location.kabupaten}\n📝 Keluhan:\n${session.data.message}\n📷 Jumlah Foto: ${session.data.photos.length}\n\nJika sudah benar, ketik *konfirmasi* untuk mengirim atau *batal* untuk mengulang.`;
            }

            if (msg === "batal") {
                await userRepo.resetSession(from);
                return `Laporan dibatalkan. Ketik *menu* untuk memulai kembali.`;
            }

            return `Mohon hanya kirim foto atau ketik *kirim* jika sudah cukup, atau *batal* untuk mengulang.`;
        }

        const newPhotoUrl = input.image?.url;
        if (!newPhotoUrl) {
            return `Kami tidak dapat memproses foto tersebut. Coba kirim ulang menggunakan fitur *Kirim Foto*.`;
        }

        const updatedPhotos = [...photos, newPhotoUrl];

        if (updatedPhotos.length >= 3) {
            await userRepo.updateSession(from, {
                step: "REVIEW",
                data: { ...session.data, photos: updatedPhotos }
            });

            return `Kami telah menerima 3 foto. Coba periksa kembali, apakah foto yang Anda kirim sudah sesuai? Jika sudah, ketik *kirim*, atau ketik *batal* untuk mengulang.`;
        }

        await userRepo.updateSession(from, {
            step: "ASK_PHOTO",
            data: { ...session.data, photos: updatedPhotos }
        });

        return `Foto berhasil diterima. Masih bisa kirim ${3 - updatedPhotos.length} foto lagi. Ketik *kirim* jika sudah cukup, atau *batal* untuk mengulang.`;
    }

    // STEP: Review sebelum simpan
    if (step === "REVIEW") {
        const msg = typeof input === "string" ? input.toLowerCase() : "";

        if (msg === "konfirmasi") {
            try {
                const sessionId = generateSessionId(from);

                await reportRepo.create({
                    sessionId,
                    from,
                    user: user._id,
                    message: session.data.message,
                    location: session.data.location,
                    photos: session.data.photos
                });

                await userRepo.resetSession(from);

                const nomorLaporan = sessionId.split("-")[1];
                return `Terima kasih ${nama}, laporan berhasil dikirim dengan ID *${nomorLaporan}*. Simpan ID ini untuk cek status laporan.`;
            } catch (err) {
                console.error("❌ Gagal simpan laporan:", err);
                return `Terjadi kesalahan saat menyimpan laporan. Silakan ketik *reset* untuk mengulang.`;
            }
        }

        if (msg === "batal") {
            await userRepo.resetSession(from);
            return `Laporan dibatalkan. Ketik *menu* untuk memulai dari awal.`;
        }

        return `Ketik *konfirmasi* jika laporan sudah benar, atau *batal* untuk membatalkan.`;
    }

    return `Pilihan tidak dikenali. Silakan ketik *menu* untuk kembali ke menu utama.`;
};
