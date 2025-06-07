const userMessageTimestamps = new Map();
const userMessageQueue = new Map();
const userSpamWarningSent = new Map();
const SPAM_TIME_WINDOW_MS = 2000; // 2 seconds debounce window
const MAX_MESSAGES_IN_WINDOW = 3;

function isSpam(from) {
  const now = Date.now();
  if (!userMessageTimestamps.has(from)) {
    userMessageTimestamps.set(from, []);
  }
  const timestamps = userMessageTimestamps.get(from);

  // Remove timestamps older than time window
  while (timestamps.length > 0 && now - timestamps[0] > SPAM_TIME_WINDOW_MS) {
    timestamps.shift();
  }

  timestamps.push(now);

  return timestamps.length > MAX_MESSAGES_IN_WINDOW;
}

function enqueueMessage(from, messageHandler) {
  if (!userMessageQueue.has(from)) {
    userMessageQueue.set(from, []);
  }
  userMessageQueue.get(from).push(messageHandler);
}

function dequeueMessages(from) {
  if (!userMessageQueue.has(from)) return [];
  const queue = userMessageQueue.get(from);
  userMessageQueue.set(from, []);
  return queue;
}

async function handleSpam(from, messageHandler, sendReply) {
  enqueueMessage(from, messageHandler);

  if (userMessageQueue.get(from).length === 1) {
    // First message in queue, send spam warning and hold replies
    const waitTimeSeconds = SPAM_TIME_WINDOW_MS / 1000;

    if (!userSpamWarningSent.get(from)) {
      await sendReply(from, `Chat Anda terindikasi spam. Mohon tunggu selama ${waitTimeSeconds} detik sebelum mengirim pesan lagi. Bot akan mulai merespon kembali setelah waktu tersebut.`);
      userSpamWarningSent.set(from, true);

      setTimeout(() => {
        userSpamWarningSent.delete(from);
      }, SPAM_TIME_WINDOW_MS);
    }

    setTimeout(async () => {
      const handlers = dequeueMessages(from);
      // Process only the last message handler to avoid multiple replies
      if (handlers.length > 0) {
        await handlers[handlers.length - 1]();
      }
    }, SPAM_TIME_WINDOW_MS);
  }
}

module.exports = {
  isSpam,
  handleSpam
};
