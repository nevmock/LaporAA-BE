const userRepo = require("../../repositories/userRepo");
const reportRepo = require("../../repositories/reportRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");
const generateSessionId = require("../../utils/generateSessionId");
const { findWilayahFromPoint } = require("../../utils/findWilayahFromPoint");
const messageController = require("../../controllers/messageController");
const createReportResponse = require("../responseMessage/createReportReponse");
const checkReportResponse = require("../responseMessage/checkReportResponse");
const { affirmativeInputs, negativeInputs } = require("../../utils/inputTypes");
const { compressMedia } = require("../../utils/mediaCompressor");

module.exports = async (from, step, input, sendReply) => {
    const session = await userRepo.getOrCreateSession(from);
    const user = await userProfileRepo.findByFrom(from);
    const nama = user?.name || "Warga";
    const jenisKelamin = user?.jenis_kelamin || "";
    const sapaan = jenisKelamin.toLowerCase() === "pria" ? "Pak" : jenisKelamin.toLowerCase() === "wanita" ? "Bu" : "";
    const lowerInput = typeof input === "string" ? input?.toLowerCase?.().trim() : "";
    const affirmative = affirmativeInputs.includes(lowerInput);
    const negative = negativeInputs.includes(lowerInput);

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
        const currentMessage = session.data.message || "";

        if (lowerInput === "kirim" || affirmative) {
            await userRepo.updateSession(from, {
                step: "CONFIRM_MESSAGE",
                data: session.data
            });
            return sendReply(from, createReportResponse.konfirmasiKeluhan(session.data.message));
        }

        if (step === "APPEND_MESSAGE" && lowerInput === "menu") {
            await userRepo.resetSession(from);
            return sendReply(from, createReportResponse.laporanDibatalkan(sapaan, nama));
        }

        if (lowerInput === "batal" || negative) {
            await userRepo.resetSession(from);
            return sendReply(from, createReportResponse.laporanDibatalkan(sapaan, nama));
        }

        // Handle media files during message input
        if (typeof input === "object" && input.type) {
            let mediaMessage = "";
            let mediaUrl = "";
            
            switch (input.type) {
                case "image":
                    mediaMessage = `[Gambar] ${input.image?.caption || ""}`;
                    mediaUrl = input.image?.url || "";
                    break;
                case "video":  
                    mediaMessage = `[Video] ${input.video?.caption || ""}`;
                    mediaUrl = input.video?.url || "";
                    break;
                case "audio":
                    mediaMessage = `[Audio]`;
                    mediaUrl = input.audio?.url || "";
                    break;
                case "voice":
                    mediaMessage = `[Pesan Suara]`;
                    mediaUrl = input.voice?.url || "";
                    break;
                case "document":
                    mediaMessage = `[Dokumen] ${input.document?.filename || ""} - ${input.document?.caption || ""}`;
                    mediaUrl = input.document?.url || "";
                    break;
                case "sticker":
                    mediaMessage = `[Sticker]`;
                    mediaUrl = input.sticker?.url || "";
                    break;
                default:
                    mediaMessage = "[File tidak didukung]";
            }
            
            const updatedMessage = currentMessage
                ? `${currentMessage}, ${mediaMessage}`
                : mediaMessage;

            // Store media URLs for later use
            const mediaFiles = session.data.mediaFiles || [];
            if (mediaUrl) {
                mediaFiles.push({
                    type: input.type,
                    url: mediaUrl,
                    message: mediaMessage
                });
            }

            await userRepo.updateSession(from, {
                step: "APPEND_MESSAGE",
                data: { 
                    ...session.data, 
                    message: updatedMessage,
                    mediaFiles: mediaFiles
                }
            });
            return sendReply(from, createReportResponse.mediaDitambahkan(input.type));
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
        if (lowerInput === "kirim" || affirmative) {
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

        if (lowerInput === "batal" || negative) {
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
        if (lowerInput === "kirim" || affirmative) {
            await userRepo.updateSession(from, {
                step: "ASK_PHOTO",
                data: { ...session.data, photos: [] }
            });
            return sendReply(from, createReportResponse.mintaFoto());
        }

        if (lowerInput === "batal" || negative) {
            await userRepo.updateSession(from, {
                step: "ASK_LOCATION",
                data: session.data
            });
            return sendReply(from, createReportResponse.ulangLokasi());
        }

        return sendReply(from, createReportResponse.konfirmasiLokasi());
    }

    // STEP 6: Ask for photos/videos (1–3)
    if (step === "ASK_PHOTO") {
        const photos = session.data.photos || [];

        if (typeof input === "string") {
            if (lowerInput === "kirim" || affirmative) {
                if (photos.length < 1) {
                    return sendReply(from, createReportResponse.minimalMedia(sapaan, nama)); // Need at least one media
                }

                await userRepo.updateSession(from, {
                    step: "REVIEW",
                    data: session.data
                });

                return sendReply(from, createReportResponse.ringkasanLaporan(session.data));
            }

            if (lowerInput === "batal" || negative) {
                await userRepo.resetSession(from);
                return sendReply(from, createReportResponse.laporanDibatalkanMenu());
            }

            return sendReply(from, createReportResponse.hanyaFotoVideo());
        }

        // Handle both image and video inputs
        let mediaUrl = null;
        let mediaType = null;
        let mediaCaption = "";

        if (input.image?.url) {
            mediaUrl = input.image.url;
            mediaType = "image";
            mediaCaption = input.image.caption || "";
        } else if (input.video?.url) {
            mediaUrl = input.video.url;
            mediaType = "video";
            mediaCaption = input.video.caption || "";
        } else if (input.voice?.url) {
            mediaUrl = input.voice.url;
            mediaType = "voice";
            mediaCaption = "";
        } else {
            return sendReply(from, createReportResponse.hanyaFotoVideo());
        }

        // Compress media before storing
        try {
            const compressedUrl = await compressMedia(mediaUrl, mediaType);
            
            const mediaData = {
                url: compressedUrl || mediaUrl, // fallback to original if compression fails
                type: mediaType,
                caption: mediaCaption,
                originalUrl: mediaUrl // keep original for reference
            };

            const updatedPhotos = [...photos, mediaData];

            // Allow only 3 media files
            if (updatedPhotos.length >= 3) {
                await userRepo.updateSession(from, {
                    step: "REVIEW",
                    data: { ...session.data, photos: updatedPhotos }
                });
                return sendReply(from, createReportResponse.sudah3Media());
            }

            await userRepo.updateSession(from, {
                step: "ASK_PHOTO",
                data: { ...session.data, photos: updatedPhotos }
            });

            const mediaTypeText = mediaType === "image" ? "foto" : 
                                 mediaType === "video" ? "video" : "pesan suara";
            return sendReply(from, createReportResponse.mediaBerhasilDiterima(mediaTypeText, 3 - updatedPhotos.length));
        } catch (error) {
            console.error("Error processing media:", error);
            // Fallback: store original without compression
            const mediaData = {
                url: mediaUrl,
                type: mediaType,
                caption: mediaCaption
            };

            const updatedPhotos = [...photos, mediaData];

            await userRepo.updateSession(from, {
                step: "ASK_PHOTO",
                data: { ...session.data, photos: updatedPhotos }
            });

            return sendReply(from, createReportResponse.mediaBerhasilDiterima(mediaType, 3 - updatedPhotos.length));
        }
    }

    // STEP 7: Review and confirm the report
    if (step === "REVIEW") {
        // Cek jumlah laporan aktif (belum Selesai Pengaduan)

        if (lowerInput === "kirim" || lowerInput === "konfirmasi" || lowerInput === "selesai" || affirmative) {
            try {
                const sessionId = await generateSessionId(from);
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

        if (lowerInput === "batal" || negative) {
            await userRepo.resetSession(from);
            return sendReply(from, createReportResponse.ulangLaporan());
        }

        return sendReply(from, createReportResponse.ringkasanLaporan(session.data));
    }

    return sendReply(from, createReportResponse.handlerDefault());
};