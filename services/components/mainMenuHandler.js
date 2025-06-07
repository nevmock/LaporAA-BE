const userRepo = require("../../repositories/userRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");
const { combinedContext } = require("../../utils/openAiHelper");
const mainMenuResponse = require("../responseMessage/mainMenuResponse");
const botFlowResponse = require("../responseMessage/botFlowResponse");
const spamHandler = require("./spamHandler");

// Global: Simpan key balasan terakhir per user
const lastResponseFunctionKey = new Map(); // Map<from, functionKey>

module.exports = async (from, input, sendReply) => {
    const user = await userProfileRepo.findByFrom(from);
    const nama = user?.name || "Warga";
    const jenisKelamin = user?.jenis_kelamin || "";
    const sapaan = jenisKelamin.toLowerCase() === "pria" ? "Pak" :
        jenisKelamin.toLowerCase() === "wanita" ? "Bu" : "";

    const context = await combinedContext(input);
    let session = await userRepo.getOrCreateSession(from);

    // ✅ Helper di dalam fungsi utama agar bisa akses sendReply
    const sendByFunctionKey = async (from, functionKey, responseFunc) => {
        const lastKey = lastResponseFunctionKey.get(from);
        if (lastKey === functionKey) return;

        const message = await responseFunc();
        lastResponseFunctionKey.set(from, functionKey);
        return sendReply(from, message);
    };

    const messageHandler = async () => {
        // 1. Menu utama jika user ketik 'menu' atau 'kembali'
        if (input === "menu" || input === "kembali") {
            await userRepo.resetSession(from);
            return sendByFunctionKey(from, "mainSapaan+mainMenuDefault", async () => {
                const res1 = await botFlowResponse.mainSapaan(sapaan, nama);
                const res2 = await mainMenuResponse.mainMenuDefault();
                return res1 + res2;
            });
        }

        // 2. Buat laporan baru
        if (input === "1" || context === "new_report") {
            if (!user) {
                await userRepo.updateSession(from, {
                    currentAction: "signup",
                    step: "ASK_NAME",
                });
                return sendByFunctionKey(from, "belumTerdaftar", () => mainMenuResponse.belumTerdaftar());
            }

            await userRepo.updateSession(from, {
                currentAction: "create_report",
                step: "ASK_MESSAGE",
                data: {},
            });

            return sendByFunctionKey(from, "mulaiLaporan", () => mainMenuResponse.mulaiLaporan(sapaan, nama));
        }

        // 3. Cek status laporan
        if (input === "2" || context === "check_report") {
            await userRepo.updateSession(from, {
                currentAction: "check_report",
                step: "ASK_REPORT_ID",
            });
            return sendByFunctionKey(from, "mintaIdLaporan", () => mainMenuResponse.mintaIdLaporan(sapaan, nama));
        }

        // 4. Komplain/marah langsung diarahkan ke laporan
        if (context === "angry_complaint") {
            if (!user) {
                await userRepo.updateSession(from, {
                    currentAction: "signup",
                    step: "ASK_NAME",
                });
                return sendByFunctionKey(from, "belumTerdaftar", () => mainMenuResponse.belumTerdaftar());
            }

            await userRepo.updateSession(from, {
                currentAction: "create_report",
                step: "ASK_MESSAGE",
                data: {},
            });

            return sendByFunctionKey(from, "angryComplaintResponse", () => mainMenuResponse.angryComplaintResponse());
        }

        if (context === "complaint") {
            if (!user) {
                await userRepo.updateSession(from, {
                    currentAction: "signup",
                    step: "ASK_NAME",
                });
                return sendByFunctionKey(from, "belumTerdaftar", () => mainMenuResponse.belumTerdaftar());
            }

            await userRepo.updateSession(from, {
                currentAction: "create_report",
                step: "ASK_MESSAGE",
                data: {},
            });

            return sendByFunctionKey(from, "complaintResponse", () => mainMenuResponse.complaintResponse());
        }

        // 5. Default response
        return sendByFunctionKey(from, "mainSapaan+mainMenuDefault", async () => {
            const res1 = await botFlowResponse.mainSapaan(sapaan, nama);
            const res2 = await mainMenuResponse.mainMenuDefault();
            return res1 + res2;
        });
    };

    if (spamHandler.isSpam(from)) {
        return spamHandler.handleSpam(from, messageHandler, sendReply);
    } else {
        return messageHandler();
    }
};