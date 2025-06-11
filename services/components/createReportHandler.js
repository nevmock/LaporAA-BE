const userRepo = require("../../repositories/userRepo");
const reportRepo = require("../../repositories/reportRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");
const generateSessionId = require("../../utils/generateSessionId");
const { findWilayahFromPoint } = require("../../utils/findWilayahFromPoint");
const messageController = require("../../controllers/messageController");
const createReportResponse = require("../responseMessage/createReportReponse");
const checkReportResponse = require("../responseMessage/checkReportResponse");

module.exports = async (from, step, input, sendReply) => {
    const session = await userRepo.getOrCreateSession(from);
    const user = await userProfileRepo.findByFrom(from);
    const nama = user?.name || "Warga";
    const jenisKelamin = user?.jenis_kelamin || "";
    const sapaan = jenisKelamin.toLowerCase() === "pria" ? "Pak" : jenisKelamin.toLowerCase() === "wanita" ? "Bu" : "";
    const lowerInput = typeof input === "string" ? input.toLowerCase() : "";

    // Check for 'menu' or 'kembali' input to reset session and go to main menu
    if (lowerInput === "menu" || lowerInput === "kembali") {
        await userRepo.resetSession(from);
        return sendReply(from, checkReportResponse.kembaliKeMenu(sapaan, nama));
    }

    // STEP 1: Ask for the complaint message
    if (step === "ASK_MESSAGE") {
        const newMessage = input;
        await userRepo.updateSession(from, {
            step: "APPEND_MESSAGE",
            data: { ...session.data, message: newMessage }
        });
        return sendReply(from, createReportResponse.mintaKeluhan());
    }

    // STEP 2: Append the complaint message or handle cancellation
    if (step === "APPEND_MESSAGE") {
        const msg = lowerInput;
        const currentMessage = session.data.message || "";

        if (msg === "kirim") {
            await userRepo.updateSession(from, {
                step: "CONFIRM_MESSAGE",
                data: session.data
            });
            return sendReply(from, createReportResponse.konfirmasiKeluhan(session.data.message));
        }

        if (step = "APPEND_MESSAGE" && msg === "menu") {
            await userRepo.resetSession(from);
            return sendReply(from, createReportResponse.laporanDibatalkan(sapaan, nama));
        }

        if (msg === "batal") {
            await userRepo.resetSession(from);
            return sendReply(from, createReportResponse.laporanDibatalkan(sapaan, nama));
        }

        const updatedMessage = currentMessage
            ? `${currentMessage}, ${input}`
            : input;

        await userRepo.updateSession(from, {
            step: "APPEND_MESSAGE",
            data: { ...session.data, message: updatedMessage }
        });
        return sendReply(from, createReportResponse.keluhanDitambahkan());
    }

    // STEP 3: Confirm the complaint message
    if (step === "CONFIRM_MESSAGE") {
        if (lowerInput === "kirim") {
            await userRepo.updateSession(from, {
                step: "ASK_LOCATION",
                data: session.data
            });

            const success = await messageController.sendTutorialImagesToUser(from);

            if (success) {
                return sendReply(from, createReportResponse.mintaLokasi(sapaan, nama));
            } else {
                return sendReply(from, "❌ Maaf, gagal mengirim gambar tutorial lokasi Silahkan untukk share lokasi kejadian secara manual dengan mengirimkan lokasi melalui fitur kirim lokasi pada WhatsApp.");
            }
        }

        if (lowerInput === "batal") {
            await userRepo.updateSession(from, {
                step: "ASK_MESSAGE",
                data: session.data
            });
            return sendReply(from, createReportResponse.ulangKeluhan(sapaan, nama));
        }

        return sendReply(from, createReportResponse.konfirmasiAtauBatal());
    }

    // STEP 4: Ask for the user's location
    if (step === "ASK_LOCATION") {
        if (typeof input !== "object" || input.type !== "location") {
            return sendReply(from, createReportResponse.mintaLokasi(sapaan, nama)); // Ask for location again if input is not correct
        }

        const { latitude, longitude, description } = input.location;
        const wilayah = findWilayahFromPoint(latitude, longitude);

        // Check if location is within the required region
        if (!wilayah || wilayah.kabupaten.toUpperCase() !== "BEKASI") {
            await userRepo.resetSession(from);
            return sendReply(from, createReportResponse.lokasiBukanBekasi(sapaan, nama, wilayah?.kabupaten || "wilayah lain"));
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

    // STEP 5: Confirm the location
    if (step === "CONFIRM_LOCATION") {
        if (lowerInput === "kirim") {
            await userRepo.updateSession(from, {
                step: "ASK_PHOTO",
                data: { ...session.data, photos: [] }
            });
            return sendReply(from, createReportResponse.mintaFoto());
        }

        if (lowerInput === "batal") {
            await userRepo.updateSession(from, {
                step: "ASK_LOCATION",
                data: session.data
            });
            return sendReply(from, createReportResponse.ulangLokasi());
        }

        return sendReply(from, createReportResponse.konfirmasiLokasi());
    }

    // STEP 6: Ask for photos (1–3)
    if (step === "ASK_PHOTO") {
        const photos = session.data.photos || [];

        if (typeof input === "string") {
            if (lowerInput === "kirim") {
                if (photos.length < 1) {
                    return sendReply(from, createReportResponse.minimalFoto(sapaan, nama)); // Need at least one photo
                }

                await userRepo.updateSession(from, {
                    step: "REVIEW",
                    data: session.data
                });

                return sendReply(from, createReportResponse.ringkasanLaporan(session.data));
            }

            if (lowerInput === "batal") {
                await userRepo.resetSession(from);
                return sendReply(from, createReportResponse.laporanDibatalkanMenu());
            }

            return sendReply(from, createReportResponse.hanyaFoto());
        }

        // Ensure that the input is a valid image URL
        if (!input.image?.url) {
            return sendReply(from, createReportResponse.gagalProsesFoto());
        }

        const newPhotoUrl = input.image.url;
        const updatedPhotos = [...photos, newPhotoUrl];

        // Allow only 3 photos
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

    // STEP 7: Review and confirm the report
    if (step === "REVIEW") {
        if (lowerInput === "konfirmasi") {
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
                const nomorLaporan = sessionId;
                return sendReply(from, createReportResponse.laporanBerhasil(sapaan, nama, nomorLaporan));
            } catch (err) {
                console.error("Gagal simpan laporan:", err);
                return sendReply(from, createReportResponse.gagalSimpanLaporan());
            }
        }

        if (lowerInput === "batal") {
            await userRepo.resetSession(from);
            return sendReply(from, createReportResponse.ulangLaporan());
        }

        return sendReply(from, createReportResponse.ringkasanLaporan(session.data));
    }

    return sendReply(from, createReportResponse.handlerDefault());
};