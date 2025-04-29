'use client';
import React, { useState, useEffect } from 'react';

// Déplacez les noms ici pour qu'ils soient constants
const ASSISTANT_NAMES = {
  french: ['Léa', 'Thomas', 'Sophie', 'Nicolas', 'Camille'],
  arabic: ['Youssef', 'Amina', 'Karim', 'Lina', 'Mehdi'],
  english: ['Emma', 'John', 'Olivia', 'Michael', 'Sarah']
};

function MoodleChatbot() {
  const [initialized, setInitialized] = useState(false);
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typingDots, setTypingDots] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [assistantName, setAssistantName] = useState('Léa'); // Valeur par défaut

  // Initialisation après le montage
  useEffect(() => {
    if (!initialized) {
      setMessages([{
        role: 'assistant', 
        content: `Bonjour ! Je suis ${assistantName}, votre assistante pédagogique. Quelle langue souhaitez-vous utiliser ? [Français/Arabe/Anglais]`
      }]);
      setInitialized(true);
    }
  }, [initialized, assistantName]);

  // Animation des points
  useEffect(() => {
    if (!isLoading) {
      setTypingDots('');
      return;
    }

    const interval = setInterval(() => {
      setTypingDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 200);

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleLanguageSelection = (language: string) => {
    const lang = language.toLowerCase();
    setSelectedLanguage(lang);
    
    // Choisissez un nom basé sur la langue de manière déterministe
    const names = lang.includes('arabe') ? ASSISTANT_NAMES.arabic :
                  lang.includes('anglais') ? ASSISTANT_NAMES.english : 
                  ASSISTANT_NAMES.french;
    
    const newName = names[Math.floor(Math.random() * names.length)];
    setAssistantName(newName);

    let response = '';
    switch(lang) {
      case 'français': response = `Parfait ${newName} ! Comment puis-je vous aider aujourd'hui ?`; break;
      case 'arabe': response = `!${newName} حسنا كيف يمكنني مساعدتك اليوم`; break;
      case 'anglais': response = `Great ${newName}! How can I help you today?`; break;
    }

    setMessages(prev => [...prev, 
      { role: 'user', content: language },
      { role: 'assistant', content: response }
    ]);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Gestion de la sélection de langue
    if (!selectedLanguage && ['français', 'arabe', 'anglais'].includes(inputMessage.toLowerCase())) {
      handleLanguageSelection(inputMessage);
      setInputMessage('');
      return;
    }

    const userMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          messages: [userMessage],
          selectedLanguage
        })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.content || data.response || 'No response content' 
      }]);
      
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: selectedLanguage === 'français' 
          ? 'Désolé, une erreur est survenue. Veuillez réessayer.' 
          : selectedLanguage === 'arabe' 
            ? 'عذرا، حدث خطأ. يرجى المحاولة مرة أخرى'
            : 'Sorry, I encountered an error. Please try again.'
      }]);
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div className="moodle-chatbot">
        <div className="chat-header">
          <h2>🎓 Assistant Moodle</h2>
        </div>
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              {msg.content}
            </div>
          ))}
          {isLoading && (
            <div className="message assistant">
              <span className="typing-indicator">{typingDots}</span>
            </div>
          )}
        </div>
        <div className="chat-input">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={
              !selectedLanguage 
                ? "Choisissez une langue..." 
                : selectedLanguage === 'français'
                  ? "Posez votre question..."
                  : selectedLanguage === 'arabe'
                    ? "اطرح سؤالك..."
                    : "Ask your question..."
            } 
          />
          <button onClick={sendMessage} disabled={isLoading}>
            {selectedLanguage === 'français' 
              ? 'Envoyer' 
              : selectedLanguage === 'arabe'
                ? 'إرسال'
                : 'Send'}
          </button>
        </div>
      </div>

      <style jsx>{`
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
          margin-left: auto;
        }
        .message.assistant {
          background-color: #f0f0f0;
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
        .typing-indicator {
          display: inline-block;
          min-width: 20px;
        }
      `}</style>
    </div>
  );
}

export default MoodleChatbot;