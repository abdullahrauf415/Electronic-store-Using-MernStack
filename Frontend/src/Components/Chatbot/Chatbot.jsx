import React, { useState } from "react";
import "./Chatbot.css";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const sendMessage = () => {
    if (input.trim() === "") return;
    const newMessages = [
      ...messages,
      { text: input, fromUser: true },
      { text: "Thanks for your message!", fromUser: false },
    ];
    setMessages(newMessages);
    setInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <>
      <div className="chat-icon" onClick={toggleChat}>
        💬
      </div>

      <div className={`chatbox ${isOpen ? "open" : ""}`}>
        <div className="chat-sidebar">
          <h3>🤖 MyBot</h3>
          <button className="new-chat">+ New Chat</button>
        </div>

        <div className="chat-main">
          <div className="messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.fromUser ? "user" : "bot"}`}
              >
                {msg.text}
              </div>
            ))}
          </div>
          <div className="input-area">
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chatbot;
