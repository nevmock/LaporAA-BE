const userRepo = require("../../repositories/userRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");
const reportRepo = require("../../repositories/reportRepo");
const generateSessionId = require("../../utils/generateSessionId");
const { findWilayahFromPoint } = require("../../utils/findWilayahFromPoint");
const response = require("../../utils/response");
const responseError = require("../../utils/responseError");

/**
 * Menangani alur pembuatan laporan warga.
 * Mulai dari lokasi, deskripsi, foto, hingga konfirmasi akhir laporan.
 * 
 * @param {string} from - Nomor WhatsApp pengguna
 * @param {string} step - Langkah aktif dalam session
 * @param {string|Object} input - Pesan teks atau media dari pengguna
 * @returns {Promise<string>}
 */
module.exports = async (from, step, input) => {
    try {
        const session = await userRepo.getOrCreateSession(from);
        const user = await userProfileRepo.findByFrom(from);
        const nama = user?.name || "Warga";

        // === STEP 1: Lokasi kejadian ===
        if (step === "ASK_LOCATION") {
            if (typeof input !== "object" || input.type !== "location") {
                return response.report.askLocationInvalid(nama);
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

            return response.report.askMessage(nama);
        }

        // === STEP 2: Deskripsi keluhan ===
        if (step === "ASK_MESSAGE") {
            await userRepo.updateSession(from, {
                step: "ASK_PHOTO",
                data: { ...session.data, message: input, photos: [] }
            });

            return response.report.askPhoto(nama);
        }

        // === STEP 3: Kirim foto (max 3) ===
        if (step === "ASK_PHOTO") {
            const photos = session.data.photos || [];

            if (typeof input === "string") {
                const command = input.toLowerCase();

                if (command === "kirim") {
                    if (photos.length < 1) return response.report.minPhotoRequired(nama);

                    await userRepo.updateSession(from, {
                        step: "REVIEW",
                        data: session.data
                    });

                    return response.report.reportPreview(nama, session.data);
                }

                if (command === "batal") {
                    await userRepo.resetSession(from);
                    return response.report.reportCancelled(nama);
                }

                return response.report.askPhoto(nama);
            }

            // Jika berupa gambar
            const newPhotoUrl = input.image?.url;
            if (!newPhotoUrl) return response.report.photoError(nama);

            const updatedPhotos = [...photos, newPhotoUrl];

            if (updatedPhotos.length >= 3) {
                await userRepo.updateSession(from, {
                    step: "REVIEW",
                    data: { ...session.data, photos: updatedPhotos }
                });

                return response.report.photoLimitReached(nama);
            }

            await userRepo.updateSession(from, {
                step: "ASK_PHOTO",
                data: { ...session.data, photos: updatedPhotos }
            });

            return response.report.photoReceived(nama, 3 - updatedPhotos.length);
        }

        // === STEP 4: Konfirmasi & Simpan laporan ===
        if (step === "REVIEW") {
            const command = typeof input === "string" ? input.toLowerCase() : "";

            if (command === "konfirmasi") {
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

                const nomor = sessionId.split("-")[1];
                return response.report.reportSuccess(nama, nomor);
            }

            if (command === "batal") {
                await userRepo.resetSession(from);
                return response.report.reportCancelled(nama);
            }

            return response.report.reportPreview(nama, session.data);
        }

        // === Fallback jika step tidak dikenali ===
        return response.checkReport.unknownStep(nama);

    } catch (err) {
        console.error("Error di createReportHandler:", err);

        try {
            const session = await userRepo.getOrCreateSession(from);
            const fallbackName = session.data?.name || "Warga";
            return responseError.defaultErrorMessage(fallbackName);
        } catch {
            return "Terjadi kesalahan. Silakan coba lagi nanti.";
        }
    }
};