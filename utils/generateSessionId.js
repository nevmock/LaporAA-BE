function generateSessionId(from) {
    const phoneSuffix = from?.slice(-4) || "0000"; // ambil 4 digit terakhir no HP
    const random = Math.floor(1000 + Math.random() * 9000); // random 4 digit

    return `${phoneSuffix}${random}`;
}

module.exports = generateSessionId;
