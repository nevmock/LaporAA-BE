const userRepo = require("../../repositories/userRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");
const reportRepo = require("../../repositories/reportRepo");
const generateSessionId = require("../../utils/generateSessionId");
const { findWilayahFromPoint } = require("../../utils/findWilayahFromPoint");
const messageController = require("../../controllers/messageController");
const createReportResponse = require("../responseMessage/createReportReponse");

module.exports = async (from, step, input) => {
    const session = await userRepo.getOrCreateSession(from);
    const user = await userProfileRepo.findByFrom(from);
    const nama = user?.name || "Warga";
    const jenisKelamin = user?.jenis_kelamin || "";
    const sapaan = jenisKelamin.toLowerCase() === "pria" ? "Pak" : jenisKelamin.toLowerCase() === "wanita" ? "Bu" : "";

    // STEP: Keluhan pertama
    if (step === "ASK_MESSAGE") {
        const newMessage = `- ${input}`;
        await userRepo.updateSession(from, {
            step: "APPEND_MESSAGE",
            data: { ...session.data, message: newMessage }
        });
        return createReportResponse.mintaKeluhan();
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

            return createReportResponse.konfirmasiKeluhan(session.data.message);
        }

        if (msg === "batal") {
            await userRepo.resetSession(from);
            return createReportResponse.laporanDibatalkan(sapaan, nama);
        }

        const updated = `${currentMessage}\n- ${input}`;
        await userRepo.updateSession(from, {
            step: "APPEND_MESSAGE",
            data: { ...session.data, message: updated }
        });

        return createReportResponse.keluhanDitambahkan();
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
            return createReportResponse.mintaLokasi(sapaan, nama);
        }

        if (msg === "batal") {
            await userRepo.updateSession(from, {
                step: "ASK_MESSAGE",
                data: session.data
            });

            return createReportResponse.ulangKeluhan(sapaan, nama);
        }

        return createReportResponse.konfirmasiAtauBatal();
    }

    // STEP: Lokasi
    if (step === "ASK_LOCATION") {
        if (typeof input !== "object" || input.type !== "location") {
            return createReportResponse.mintaLokasi(sapaan, nama);
        }

        const { latitude, longitude, description } = input.location;
        const wilayah = findWilayahFromPoint(latitude, longitude);

        if (!wilayah) {
            return createReportResponse.mintaLokasi(sapaan, nama);
        }

        if (wilayah.kabupaten.toUpperCase() !== "BEKASI") {
            return createReportResponse.lokasiBukanBekasi(sapaan, nama, wilayah.kabupaten);
        }

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

        return createReportResponse.lokasiDiterima(wilayah);
    }

    // STEP: Konfirmasi lokasi
    if (step === "CONFIRM_LOCATION") {
        const msg = input.toLowerCase();

        if (msg === "kirim") {
            await userRepo.updateSession(from, {
                step: "ASK_PHOTO",
                data: { ...session.data, photos: [] }
            });

            return createReportResponse.mintaFoto();
        }

        if (msg === "batal") {
            await userRepo.updateSession(from, {
                step: "ASK_LOCATION",
                data: session.data
            });

            return createReportResponse.ulangLokasi();
        }

        return createReportResponse.konfirmasiLokasi();
    }

    // STEP: Foto (1–3, konfirmasi setelah upload)
    if (step === "ASK_PHOTO") {
        const photos = session.data.photos || [];

        if (typeof input === "string") {
            const msg = input.toLowerCase();

            if (msg === "kirim") {
                if (photos.length < 1) {
                    return createReportResponse.minimalFoto(sapaan, nama);
                }

                await userRepo.updateSession(from, {
                    step: "REVIEW",
                    data: session.data
                });

                return createReportResponse.ringkasanLaporan(session.data);
            }

            if (msg === "batal") {
                await userRepo.resetSession(from);
                return createReportResponse.laporanDibatalkanMenu();
            }

            return createReportResponse.hanyaFoto();
        }

        if (!input || typeof input !== "object" || !input.image || !input.image.url) {
            return createReportResponse.gagalProsesFoto();
        }

        const newPhotoUrl = input.image.url;
        const updatedPhotos = [...photos, newPhotoUrl];

        if (updatedPhotos.length >= 3) {
            await userRepo.updateSession(from, {
                step: "REVIEW",
                data: { ...session.data, photos: updatedPhotos }
            });

            return createReportResponse.sudah3Foto();
        }

        await userRepo.updateSession(from, {
            step: "ASK_PHOTO",
            data: { ...session.data, photos: updatedPhotos }
        });

        return createReportResponse.fotoBerhasilDiterima(3 - updatedPhotos.length);
    }

    // STEP: Review sebelum simpan
    if (step === "REVIEW") {
        const msg = typeof input === "string" ? input.toLowerCase() : "";

        if (msg === "konfirmasi") {
            try {
                const sessionId = generateSessionId(from);

                if (!user) {
                    return createReportResponse.gagalSimpanLaporan();
                }

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
                return createReportResponse.laporanBerhasil(sapaan, nama, nomorLaporan);
            } catch (err) {
                console.error("❌ Gagal simpan laporan:", err);
                return createReportResponse.gagalSimpanLaporan();
            }
        }

        if (msg === "batal") {
            await userRepo.resetSession(from);
            return createReportResponse.ulangLaporan();
        }

        return createReportResponse.konfirmasiReview();
    }

    return createReportResponse.handlerDefault();
};
