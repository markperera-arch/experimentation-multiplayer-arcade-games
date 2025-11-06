class ChatManager {
  constructor() {
    this.chatHistories = new Map(); // gameName -> messages array
    this.maxMessages = 100;
  }

  addMessage(gameName, playerId, username, message, player) {
    if (!this.chatHistories.has(gameName)) {
      this.chatHistories.set(gameName, []);
    }

    const chatMessage = {
      id: `${Date.now()}-${playerId}`,
      playerId,
      username,
      message: this.sanitizeMessage(message),
      level: player ? player.level : 1,
      timestamp: Date.now()
    };

    const history = this.chatHistories.get(gameName);
    history.push(chatMessage);

    // Keep only last maxMessages
    if (history.length > this.maxMessages) {
      history.shift();
    }

    return chatMessage;
  }

  getChatHistory(gameName) {
    return this.chatHistories.get(gameName) || [];
  }

  sanitizeMessage(message) {
    // Basic profanity filter (very simple implementation)
    const profanityList = ['fuck', 'shit', 'damn', 'ass', 'bitch'];
    let sanitized = message;

    profanityList.forEach(word => {
      const regex = new RegExp(word, 'gi');
      sanitized = sanitized.replace(regex, '*'.repeat(word.length));
    });

    // Limit message length
    return sanitized.substring(0, 200);
  }

  clearChatHistory(gameName) {
    this.chatHistories.delete(gameName);
  }
}

module.exports = ChatManager;
