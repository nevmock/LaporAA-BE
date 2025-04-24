const botFlowService = require("../services/botFlowService");
const { sendMessageToWhatsApp } = require("./messageController");

exports.handleIncomingMessage = async (req, res) => {
    try {
        const { entry } = req.body;
        const changes = entry?.[0]?.changes?.[0];
        const message = changes?.value?.messages?.[0];

        if (!message) return res.sendStatus(200); // ignore if no message

        const from = message.from;
        const msgText = message.text?.body;

        if (!from || !msgText) return res.sendStatus(400);

        const reply = await botFlowService.handleMessageFlow(from, msgText);

        await sendMessageToWhatsApp(from, reply);
        res.sendStatus(200);
    } catch (err) {
        console.error("❌ Error handle WA:", err);
        res.status(500).send("Internal Server Error");
    }
};
