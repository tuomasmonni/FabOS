import React, { useState, useRef, useEffect } from 'react';

// Chat-viestikomponentti
const ChatMessage = ({ message, isUser }) => (
  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
    <div
      className={`max-w-[80%] px-4 py-3 rounded-2xl ${
        isUser
          ? 'bg-[#FF6B35] text-white rounded-br-md'
          : 'bg-gray-100 text-gray-800 rounded-bl-md'
      }`}
    >
      <p className="text-sm whitespace-pre-wrap">{message}</p>
    </div>
  </div>
);

// Pikavalintanapit
const QuickSuggestions = ({ onSelect }) => {
  const suggestions = [
    'Mitä moduuleja FabOS sisältää?',
    'Miten kloonaan boardin?',
    'Miten putkentaivutus toimii?',
    'Apua kirjautumisessa'
  ];

  return (
    <div className="flex flex-wrap gap-2 p-3 border-t border-gray-200">
      {suggestions.map((text, index) => (
        <button
          key={index}
          onClick={() => onSelect(text)}
          className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
        >
          {text}
        </button>
      ))}
    </div>
  );
};

// Latausanimaatio (kolme pompivaa palloa)
const LoadingIndicator = () => (
  <div className="flex justify-start animate-fade-in">
    <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce-dot" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce-dot" style={{ animationDelay: '160ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce-dot" style={{ animationDelay: '320ms' }} />
      </div>
    </div>
  </div>
);

// Pääkomponentti
const LKPChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hei! Olen FabOS-tukiassistentti. Miten voin auttaa sinua tänään?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scrollaa aina viimeisimpään viestiin
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Fokusoi input kun chat avataan
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    const messageText = text || inputValue.trim();
    if (!messageText || isLoading) return;

    // Lisää käyttäjän viesti
    const userMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/lkp-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages,
          newMessage: messageText
        })
      });

      const data = await response.json();

      // Lisää assistentin vastaus
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Pahoittelut, tapahtui virhe. Kokeile päivittää sivu (F5) ja yritä uudelleen.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Kelluva chat-nappi */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#FF6B35] text-white shadow-lg hover:bg-[#e5612f] transition-all duration-300 flex items-center justify-center ${
          !isOpen ? 'animate-bounce-subtle' : ''
        }`}
        aria-label={isOpen ? 'Sulje chat' : 'Avaa chat'}
      >
        {isOpen ? (
          // X-ikoni
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          // Chat-ikoni
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat-ikkuna */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[384px] max-w-[calc(100vw-48px)] h-[500px] max-h-[calc(100vh-120px)] bg-white rounded-2xl shadow-2xl flex flex-col animate-slide-up overflow-hidden sm:w-[384px] sm:h-[500px]">
          {/* Header */}
          <div className="bg-[#1A1A2E] text-white px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FF6B35] flex items-center justify-center font-bold text-sm">
              <span className="text-white">F</span><span className="text-[#1A1A2E]">OS</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">FabOS Tuki</h3>
              <p className="text-xs text-gray-400">AI-assistentti</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Sulje chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Viestit */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
            {messages.map((msg, index) => (
              <ChatMessage key={index} message={msg.content} isUser={msg.role === 'user'} />
            ))}
            {isLoading && <LoadingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Pikavalinnat (näytetään vain alussa) */}
          {messages.length === 1 && !isLoading && (
            <QuickSuggestions onSelect={sendMessage} />
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Kirjoita viesti..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] disabled:bg-gray-50"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className="w-10 h-10 bg-[#FF6B35] text-white rounded-full flex items-center justify-center hover:bg-[#e5612f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Lähetä viesti"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobiili: täyden näytön chat */}
      <style>{`
        @media (max-width: 480px) {
          .fixed.bottom-24.right-6 {
            bottom: 0 !important;
            right: 0 !important;
            left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: 100vh !important;
            max-height: 100vh !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </>
  );
};

export default LKPChatWidget;
