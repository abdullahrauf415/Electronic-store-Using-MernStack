import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import {
  FaRobot,
  FaPaperPlane,
  FaTrash,
  FaTimes,
  FaComment,
  FaExternalLinkAlt,
} from "react-icons/fa";
import HomeContext from "../../Context/HomeContext";
import "./ChatBot.css";

const ChatBot = () => {
  const { user } = useContext(HomeContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatHistoryList, setChatHistoryList] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const chatWindowRef = useRef(null); // ✅ ref for outside click

  // Load chat history when chat opens
  useEffect(() => {
    if (isOpen && user?.token) {
      fetchChatHistory();
    } else {
      setMessages([]);
    }
  }, [isOpen, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ✅ Close chat when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        chatWindowRef.current &&
        !chatWindowRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Detect and format URLs inside messages
  const formatMessageWithLinks = (text) => {
    if (!text) return text;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="message-link"
          >
            {part} <FaExternalLinkAlt className="link-icon" />
          </a>
        );
      }
      return part;
    });
  };

  // Fetch history from backend
  const fetchChatHistory = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/chat-history",
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      const fullChat = [];
      const historyList = [];
      const seenIds = new Set();

      response.data.forEach((msg) => {
        if (seenIds.has(msg._id)) return;
        seenIds.add(msg._id);

        fullChat.push({
          _id: msg._id,
          text: msg.message,
          sender: "user",
          timestamp: msg.timestamp,
        });

        if (msg.reply) {
          fullChat.push({
            _id: `bot-${msg._id}`,
            text: msg.reply,
            sender: "bot",
            timestamp: new Date(msg.timestamp).getTime() + 1000,
          });
        }

        historyList.push({
          _id: msg._id,
          text: msg.message,
          timestamp: msg.timestamp,
        });
      });

      setMessages(fullChat);
      setChatHistoryList(historyList.reverse());
    } catch (err) {
      console.error("Chat history fetch error:", err);
      setError("Failed to load chat history.");
    }
  };

  // Send new message
  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading || !user) return;

    const tempId = `temp-${Date.now()}`;
    const newUserMsg = {
      _id: tempId,
      text: inputText,
      sender: "user",
      timestamp: new Date(),
      isTemp: true,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputText("");
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:3000/api/chatbot",
        { message: inputText },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const botReply = {
        _id: `bot-${response.data.messageId}`,
        text: response.data.reply,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [
        ...prev.filter((msg) => msg._id !== tempId),
        { ...newUserMsg, _id: response.data.messageId, isTemp: false },
        botReply,
      ]);

      fetchChatHistory();
    } catch (err) {
      console.error("Chat send error:", err);
      setError("Failed to get response.");
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
    } finally {
      setIsLoading(false);
    }
  };

  // Delete message
  const handleDeleteMessage = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/chat-messages/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setMessages((prev) =>
        prev.filter((msg) => msg._id !== id && msg._id !== `bot-${id}`)
      );
      fetchChatHistory();
    } catch (err) {
      console.error("Delete message error:", err);
      setError("Failed to delete message.");
    }
  };

  // Clear all messages
  const handleClearChat = async () => {
    try {
      await axios.delete("http://localhost:3000/api/chat-messages", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setMessages([]);
      setChatHistoryList([]);
    } catch (err) {
      console.error("Clear chat error:", err);
      setError("Failed to clear chat.");
    }
  };

  // Enter key handling
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Select old conversation
  const handleSelectPastMessage = (id) => {
    setSelectedChatId(id);
    const selected = messages.filter(
      (msg) => msg._id === id || msg._id === `bot-${id}`
    );
    setMessages(selected);
  };

  const resetToLiveChat = () => {
    setSelectedChatId(null);
    fetchChatHistory();
  };

  if (!user) return null;

  return (
    <div className={`chatbot-container ${isOpen ? "open" : ""}`}>
      {!isOpen ? (
        <button
          className="chatbot-toggle"
          onClick={() => setIsOpen(true)}
          aria-label="Open Chat"
        >
          <FaRobot className="chat-icon" />
          <span className="chat-text">Chat Support</span>
        </button>
      ) : (
        <div className="chatbot-window" ref={chatWindowRef}>
          <div className="chatbot-header">
            <div className="chatbot-title">
              <FaRobot className="robot-icon" />
              <div>
                <h3>Support Assistant</h3>
                <p>Hi {user.name?.split(" ")[0]}, how can we help?</p>
              </div>
            </div>
            <button
              className="close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <FaTimes />
            </button>
          </div>

          <div className="chatbot-body">
            {/* Sidebar */}
            <div className="chatbot-sidebar">
              <h4>Past Chats</h4>
              <ul>
                {chatHistoryList.slice(0, 10).map((item) => (
                  <li
                    key={`history-${item._id}`}
                    className={item._id === selectedChatId ? "active" : ""}
                    onClick={() => handleSelectPastMessage(item._id)}
                  >
                    {item.text.slice(0, 30)}...
                  </li>
                ))}
              </ul>
              {selectedChatId && (
                <button className="live-chat-btn" onClick={resetToLiveChat}>
                  Back to Live Chat
                </button>
              )}
            </div>

            {/* Chat Messages */}
            <div className="chatbot-messages">
              {messages.length === 0 && !isLoading ? (
                <div className="empty-chat">
                  <FaComment className="comment-icon" />
                  <h4>Welcome to Support Chat!</h4>
                  <p>Ask about products, orders, or store policies.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={`${msg.sender}-${msg._id}`}
                    className={`message ${msg.sender}`}
                  >
                    <div className="message-content">
                      <div className="message-text">
                        {formatMessageWithLinks(msg.text)}
                      </div>
                      <div className="message-time">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    {msg.sender === "user" &&
                      !msg.isTemp &&
                      !selectedChatId && (
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteMessage(msg._id)}
                        >
                          <FaTrash />
                        </button>
                      )}
                  </div>
                ))
              )}
              {isLoading && (
                <div className="message bot">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input area */}
          {!selectedChatId && (
            <div className="chatbot-input-area">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputText.trim()}
              >
                <FaPaperPlane />
              </button>
            </div>
          )}

          <div className="chatbot-footer">
            <button
              className="clear-chat-btn"
              onClick={handleClearChat}
              disabled={messages.length === 0}
            >
              Clear Chat History
            </button>
          </div>

          {error && (
            <div className="chatbot-error">
              <p>{error}</p>
              <button onClick={() => setError("")}>Dismiss</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatBot;
