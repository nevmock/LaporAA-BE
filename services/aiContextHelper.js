const { combinedContext } = require("../../utils/openAiHelper");

// const CONTEXT_ENABLED = true; // Toggle global

let context = null;

if (CONTEXT_ENABLED) {
    context = await combinedContext(input);
}

// Semua pengecekan context
const greetingContext = CONTEXT_ENABLED && ["greeting", "menu"].includes(context);
const newReportContext = CONTEXT_ENABLED && ["new_report", "1"].includes(context);
const checkReportContext = CONTEXT_ENABLED && ["check_report", "2"].includes(context);
const angryComplaintContext = CONTEXT_ENABLED && ["angry_complaint", "3"].includes(context);
const complaintContext = CONTEXT_ENABLED && ["complaint", "4"].includes(context);

module.exports = {
    greetingContext,
    newReportContext,
    checkReportContext,
    angryComplaintContext,
    complaintContext
};