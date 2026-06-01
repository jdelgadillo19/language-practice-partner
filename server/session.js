/** @type {Map<string, object>} */
const sessions = new Map();

export function getOrCreateSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      messages: [],
      progress: null,
      userTurnCount: 0,
    });
  }
  return sessions.get(sessionId);
}

export function appendMessage(sessionId, role, content) {
  const session = getOrCreateSession(sessionId);
  session.messages.push({ role, content });
  if (role === "user") {
    session.userTurnCount += 1;
  }
  return session;
}

export function updateProgress(sessionId, progress) {
  const session = getOrCreateSession(sessionId);
  session.progress = progress;
  return session;
}
