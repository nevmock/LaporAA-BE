const userRepo = require("../../repositories/userRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");
const reportRepo = require("../../repositories/reportRepo");
const generateSessionId = require("../../utils/generateSessionId");
const { findWilayahFromPoint } = require("../../utils/findWilayahFromPoint");
const messageController = require("../../controllers/messageController");
const createReportResponse = require("../responseMessage/createReportReponse");
const spamHandler = require("./spamHandler");

module.exports = async (from, step, input, sendReply) => {
    const session = await userRepo.getOrCreateSession(from);
    const user = await userProfileRepo.findByFrom(from);
    const nama = user?.name || "Warga";
    const jenisKelamin = user?.jenis_kelamin || "";
    const sapaan = jenisKelamin.toLowerCase() === "pria" ? "Pak" : jenisKelamin.toLowerCase() === "wanita" ? "Bu" : "";

    const messageHandler = async () => {
        // STEP: Keluhan pertama
        if (step === "ASK_MESSAGE") {
            const newMessage = `- ${input}`;
            await userRepo.updateSession(from, {
                step: "APPEND_MESSAGE",
                data: { ...session.data, message: newMessage }
            });
            return sendReply(from, createReportResponse.mintaKeluhan());
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

                return sendReply(from, createReportResponse.konfirmasiKeluhan(session.data.message));
            }

            if (msg === "batal") {
                await userRepo.resetSession(from);
                return sendReply(from, createReportResponse.laporanDibatalkan(sapaan, nama));
            }

            const updated = `${currentMessage}\n- ${input}`;
            await userRepo.updateSession(from, {
                step: "APPEND_MESSAGE",
                data: { ...session.data, message: updated }
            });

            return sendReply(from, createReportResponse.keluhanDitambahkan());
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
                return sendReply(from, createReportResponse.mintaLokasi(sapaan, nama));
            }

            if (msg === "batal") {
                await userRepo.updateSession(from, {
                    step: "ASK_MESSAGE",
                    data: session.data
                });

                return sendReply(from, createReportResponse.ulangKeluhan(sapaan, nama));
            }

            return sendReply(from, createReportResponse.konfirmasiAtauBatal());
        }

        // STEP: Lokasi
        if (step === "ASK_LOCATION") {
            if (typeof input !== "object" || input.type !== "location") {
                return sendReply(from, createReportResponse.mintaLokasi(sapaan, nama));
            }

            const { latitude, longitude, description } = input.location;
            const wilayah = findWilayahFromPoint(latitude, longitude);

            if (!wilayah) {
                return sendReply(from, createReportResponse.mintaLokasi(sapaan, nama));
            }

            if (wilayah.kabupaten.toUpperCase() !== "BEKASI") {
                return sendReply(from, createReportResponse.lokasiBukanBekasi(sapaan, nama, wilayah.kabupaten));
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

            return sendReply(from, createReportResponse.lokasiDiterima(wilayah));
        }

        // STEP: Konfirmasi lokasi
        if (step === "CONFIRM_LOCATION") {
            const msg = input.toLowerCase();

            if (msg === "kirim") {
                await userRepo.updateSession(from, {
                    step: "ASK_PHOTO",
                    data: { ...session.data, photos: [] }
                });

                return sendReply(from, createReportResponse.mintaFoto());
            }

            if (msg === "batal") {
                await userRepo.updateSession(from, {
                    step: "ASK_LOCATION",
                    data: session.data
                });

                return sendReply(from, createReportResponse.ulangLokasi());
            }

            return sendReply(from, createReportResponse.konfirmasiLokasi());
        }

        // STEP: Foto (1–3, konfirmasi setelah upload)
        if (step === "ASK_PHOTO") {
            const photos = session.data.photos || [];

            if (typeof input === "string") {
                const msg = input.toLowerCase();

                if (msg === "kirim") {
                    if (photos.length < 1) {
                        return sendReply(from, createReportResponse.minimalFoto(sapaan, nama));
                    }

                    await userRepo.updateSession(from, {
                        step: "REVIEW",
                        data: session.data
                    });

                    return sendReply(from, createReportResponse.ringkasanLaporan(session.data));
                }

                if (msg === "batal") {
                    await userRepo.resetSession(from);
                    return sendReply(from, createReportResponse.laporanDibatalkanMenu());
                }

                return sendReply(from, createReportResponse.hanyaFoto());
            }

            if (!input || typeof input !== "object" || !input.image || !input.image.url) {
                return sendReply(from, createReportResponse.gagalProsesFoto());
            }

            const newPhotoUrl = input.image.url;
            const updatedPhotos = [...photos, newPhotoUrl];

            if (updatedPhotos.length >= 3) {
                await userRepo.updateSession(from, {
                    step: "REVIEW",
                    data: { ...session.data, photos: updatedPhotos }
                });

                return sendReply(from, createReportResponse.sudah3Foto());
            }

            await userRepo.updateSession(from, {
                step: "ASK_PHOTO",
                data: { ...session.data, photos: updatedPhotos }
            });

            return sendReply(from, createReportResponse.fotoBerhasilDiterima(3 - updatedPhotos.length));
        }

        // STEP: Review sebelum simpan
        if (step === "REVIEW") {
            const msg = typeof input === "string" ? input.toLowerCase() : "";

            if (msg === "konfirmasi") {
                try {
                    const sessionId = generateSessionId(from);

                    if (!user) {
                        return sendReply(from, createReportResponse.gagalSimpanLaporan());
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
                    return sendReply(from, createReportResponse.laporanBerhasil(sapaan, nama, nomorLaporan));
                } catch (err) {
                    console.error("❌ Gagal simpan laporan:", err);
                    return sendReply(from, createReportResponse.gagalSimpanLaporan());
                }
            }

            if (msg === "batal") {
                await userRepo.resetSession(from);
                return sendReply(from, createReportResponse.ulangLaporan());
            }

            return sendReply(from, createReportResponse.konfirmasiReview());
        }

                    return sendReply(from, createReportResponse.handlerDefault());
    };

    if (spamHandler.isSpam(from)) {
        return spamHandler.handleSpam(from, messageHandler, sendReply);
    } else {
        return messageHandler();
    }
};
