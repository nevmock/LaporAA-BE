const { combinedContext } = require("../../utils/openAiHelper");

// const CONTEXT_ENABLED = true; // Toggle global

let context = null;

if (CONTEXT_ENABLED) {
    context = await combinedContext(input);
}

// Semua pengecekan context
const greetingContext = process.env.AI_CONTEXT_READER && ["greeting", "menu"].includes(context);
const newReportContext = process.env.AI_CONTEXT_READER && ["new_report", "1"].includes(context);
const checkReportContext = process.env.AI_CONTEXT_READER && ["check_report", "2"].includes(context);
const angryComplaintContext = process.env.AI_CONTEXT_READER && ["angry_complaint", "3"].includes(context);
const complaintContext = process.env.AI_CONTEXT_READER && ["complaint", "4"].includes(context);

module.exports = {
    greetingContext,
    newReportContext,
    checkReportContext,
    angryComplaintContext,
    complaintContext
};