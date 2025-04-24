function generateSessionId(from) {
    const prefix = "LPRAA";
    const phoneSuffix = from?.slice(-4) || "0000"; // ambil 4 digit terakhir no HP
    const random = Math.floor(1000 + Math.random() * 9000); // random 4 digit

    return `${prefix}-${phoneSuffix}${random}`;
}

module.exports = generateSessionId;
