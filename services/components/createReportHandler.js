const userRepo = require("../../repositories/userRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");
const reportRepo = require("../../repositories/reportRepo");
const generateSessionId = require("../../utils/generateSessionId");

module.exports = async (from, step, input) => {
    const session = await userRepo.getOrCreateSession(from);

    // STEP 1: Terima lokasi dari pengguna (wajib menggunakan fitur share location WhatsApp)
    if (step === "ASK_LOCATION") {
        if (typeof input !== "object" || input.type !== "location") {
            return `Beri tahu user untuk membagikan lokasi yang ingin dilaporkan keluhannya melalui fitur share location WhatsApp. input dari user harus dari share lokasi whatsapp`;
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

        return `Beri tahu user untuk menceritakan keluhannya`;
    }

    // STEP 2: Terima pesan atau isi keluhan dari pengguna
    if (step === "ASK_MESSAGE") {
        await userRepo.updateSession(from, {
            step: "ASK_PHOTO",
            data: { ...session.data, message: input, photos: [] }
        });

        return `Beri tahu user untuk mengirim foto pendukung jika ada, atau ketik "selesai" jika sudah.`;
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

            return `beritahu user tentang ${locText} Isi laporannya: ${session.data.message}\n${photoList} user harus input "kirim" untuk mengirim laporan atau "batal" untuk membatalkan.`;
        }

        // Jika input adalah foto, simpan dan lanjutkan
        if (typeof input === "object" && input.type === "image") {
            const newPhotoUrl = input.image?.url;
            if (!newPhotoUrl) return `Beri tahu user untuk mengirim foto yang valid. dan ulangi kirim fotonya`;

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

                return `beritahu user tentang ${locText} Isi laporannya: ${session.data.message}\n${photoList} user harus input "kirim" untuk mengirim laporan atau "batal" untuk membatalkan.`;
            }

            await userRepo.updateSession(from, {
                step: "ASK_PHOTO",
                data: { ...session.data, photos: updatedPhotos }
            });

            return `Beri tahu user untuk mengirim foto pendukung lainnya, beri tahu inputnya harus ketik "selesai" jika sudah.`;
        }

        return `Beri tahu user untuk mengirim foto pendukung yang valid, atau ketik "selesai" jika sudah.`;
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

            return `Beri tahu user bahwa laporan telah berhasil dikirim dengan ID ${sessionId}. dan sampaikan terima kasih atas laporannya. juga untuk menunggu laporannya di proses`;
        }

        // Jika pengguna membatalkan laporan
        if (msg === "batal") {
            await userRepo.resetSession(from);
            return `Beri tahu user bahwa laporan telah dibatalkan. Balas pesan untuk kembali ke menu utama.`;
        }

        return `Beri tahu user untuk mengetik "kirim" untuk mengirim laporan atau "batal" untuk membatalkan.`;
    }

    // Penanganan error fallback
    return `ini adalah default jika command tidak dikenali, ucapkan salam juga ya dan Beri tahu user untuk memilih:\n1. Buat laporan baru\n2. Cek status laporan input nya harus 1 atau 2, jelaskan juga ke usernya dengan singkat`;
};