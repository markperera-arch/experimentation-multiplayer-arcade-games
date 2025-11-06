import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import '../../styles/Chat.css';

const Chat = ({ visible, onToggle }) => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('chat:message', (message) => {
      setMessages((prev) => [...prev, message].slice(-50)); // Keep last 50 messages
    });

    return () => {
      socket.off('chat:message');
    };
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket) return;

    socket.emit('chat:message', inputMessage);
    setInputMessage('');
  };

  const getLevelColor = (level) => {
    if (level >= 10) return '#ffd700'; // Gold
    if (level >= 5) return '#c0c0c0'; // Silver
    return '#cd7f32'; // Bronze
  };

  if (!visible) {
    return (
      <button className="chat-toggle-btn" onClick={onToggle}>
        💬
      </button>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Chat</h3>
        <button className="chat-close-btn" onClick={onToggle}>
          ✕
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className="chat-message">
            <span
              className="chat-username"
              style={{ color: getLevelColor(msg.level) }}
            >
              [{msg.level}] {msg.username}:
            </span>
            <span className="chat-text">{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-input"
          placeholder="Type a message... (C to toggle)"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          maxLength={200}
        />
        <button type="submit" className="chat-send-btn">
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
