'use client'; // Mark this as a client component

import React, { useState } from 'react';
import { Z_UNKNOWN } from 'zlib';

function MoodleChatbot() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Welcome to the Moodle Learning Assistant! How can I help you with your studies today?' }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
  
    const newMessages = [...messages, { role: 'user', content: inputMessage }];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);
  
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: newMessages })
      });
  
      // Ajoutez ce code pour vérifier le statut de la réponse
      if (!response.ok) {
        const errorText = await response.text(); // Lire la réponse en tant que texte
        throw new Error(`Error: ${response.status} - ${errorText}`); // Lancer une erreur avec le statut et le texte
      }
  
      const data = await response.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <center><style>{styles}</style><div className="moodle-chatbot">
          <div className="chat-header">
              <h2>🎓 Moodle Learning Assistant</h2>
          </div>
          <div className="chat-messages">
              {messages.map((msg, index) => (
                  <div
                      key={index}
                      className={`message ${msg.role}`}
                  >
                      {msg.content}
                  </div>
              ))}
              {isLoading && (
                  <div className="message assistant">
                      Thinking... 💭
                  </div>
              )}
          </div>
          <div className="chat-input">
              <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask a study-related question..." />
              <button onClick={sendMessage} disabled={isLoading}>
                  Send
              </button>
          </div>
      </div></center>
  );
}
const styles = `
  .moodle-chatbot {
    width: 400px;
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    overflow: hidden;
  }
  .chat-header {
    background-color: #3f51b5;
    color: white;
    padding: 15px;
    text-align: center;
  }
  .chat-messages {
    height: 400px;
    overflow-y: auto;
    padding: 15px;
  }
  .message {
    margin-bottom: 10px;
    padding: 10px;
    border-radius: 10px;
    max-width: 80%;
  }
  .message.user {
    background-color: #e6f2ff;
    align-self: flex-end;
    margin-left: auto;
  }
  .message.assistant {
    background-color: #f0f0f0;
    align-self: flex-start;
  }
  .chat-input {
    display: flex;
    padding: 15px;
    background-color: #f0f0f0;
  }
  .chat-input input {
    flex-grow: 1;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
    margin-right: 10px;
  }
  .chat-input button {
    background-color: #3f51b5;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
  }
`;


export default MoodleChatbot;
