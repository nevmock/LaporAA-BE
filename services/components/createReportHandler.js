const userRepo = require("../../repositories/userRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");
const reportRepo = require("../../repositories/reportRepo");
const generateSessionId = require("../../utils/generateSessionId");

module.exports = async (from, step, input) => {
    const session = await userRepo.getOrCreateSession(from);

    // STEP 1: Terima lokasi dari pengguna (wajib menggunakan fitur share location WhatsApp)
    if (step === "ASK_LOCATION") {
        if (typeof input !== "object" || input.type !== "location") {
            return `Silakan bagikan lokasi Anda melalui fitur share location WhatsApp.`;
        }

        const { latitude, longitude, description } = input.location;

        const locationData = {
            type: "map",
            latitude,
            longitude,
            description: description || "Lokasi tanpa nama"
        };

        await userRepo.updateSession(from, {
            step: "ASK_MESSAGE",
            data: { ...session.data, location: locationData }
        });

        return `Silakan ketik isi laporan Anda:`;
    }

    // STEP 2: Terima pesan atau isi keluhan dari pengguna
    if (step === "ASK_MESSAGE") {
        await userRepo.updateSession(from, {
            step: "ASK_PHOTO",
            data: { ...session.data, message: input, photos: [] }
        });

        return `Silakan kirim foto pendukung (maksimal 3 foto). Ketik "selesai" jika sudah cukup.`;
    }

    // STEP 3: Terima foto pendukung (maksimal 3 buah), atau lanjut jika pengguna ketik "selesai"
    if (step === "ASK_PHOTO") {
        const photos = session.data.photos || [];

        // Jika pengguna ketik "selesai", lanjut ke tahap konfirmasi laporan
        if (typeof input === "string" && input.toLowerCase() === "selesai") {
            await userRepo.updateSession(from, {
                step: "CONFIRMATION",
                data: { ...session.data, photos }
            });

            const loc = session.data.location;
            const locText = `Lokasi: ${loc.description} (Lat: ${loc.latitude}, Lon: ${loc.longitude})`;
            const photoList = photos.map((p, i) => `Foto ${i + 1}: ${p}`).join("\n");

            return `${locText}\nIsi: ${session.data.message}\n${photoList}\n\nKetik "kirim" untuk mengirim laporan atau "batal" untuk membatalkan.`;
        }

        // Jika input adalah foto, simpan dan lanjutkan
        if (typeof input === "object" && input.type === "image") {
            const newPhotoUrl = input.image?.url;
            if (!newPhotoUrl) return `Gagal mengambil gambar. Silakan coba lagi.`;

            const updatedPhotos = [...photos, newPhotoUrl];

            // Jika sudah 3 foto, langsung lanjut ke konfirmasi
            if (updatedPhotos.length >= 3) {
                await userRepo.updateSession(from, {
                    step: "CONFIRMATION",
                    data: { ...session.data, photos: updatedPhotos }
                });

                const loc = session.data.location;
                const locText = `Lokasi: ${loc.description} (Lat: ${loc.latitude}, Lon: ${loc.longitude})`;
                const photoList = updatedPhotos.map((p, i) => `Foto ${i + 1}: ${p}`).join("\n");

                return `${locText}\nIsi: ${session.data.message}\n${photoList}\n\nKetik "kirim" untuk mengirim laporan atau "batal" untuk membatalkan.`;
            }

            await userRepo.updateSession(from, {
                step: "ASK_PHOTO",
                data: { ...session.data, photos: updatedPhotos }
            });

            return `Foto berhasil ditambahkan (${updatedPhotos.length}/3). Kirim foto lain atau ketik "selesai".`;
        }

        return `Kirim gambar sebagai foto, atau ketik "selesai" jika tidak ingin menambah.`;
    }

    // STEP 4: Konfirmasi akhir dan simpan laporan
    if (step === "CONFIRMATION") {
        const msg = typeof input === "string" ? input.toLowerCase() : "";

        // Jika pengguna setuju, simpan laporan
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

            return `Laporan berhasil dikirim.\nKode laporan Anda: ${sessionId}\n\nBalas apa saja untuk kembali ke menu utama.`;
        }

        // Jika pengguna membatalkan laporan
        if (msg === "batal") {
            await userRepo.resetSession(from);
            return `Laporan dibatalkan. Balas apa saja untuk kembali ke menu utama.`;
        }

        return `Ketik "kirim" untuk mengirim laporan, atau "batal" untuk membatalkan.`;
    }

    // Penanganan error fallback
    return `Terjadi kesalahan saat membuat laporan. Balas apa saja untuk kembali ke menu utama.`;
};