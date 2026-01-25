// ============================================================================
// AI CHAT COMPONENT
// ============================================================================
// Keskusteluikkuna käyttäjän ja AI:n väliseen kommunikaatioon
// Käytetään moduulien muokkauspyyntöihin

import React, { useState, useRef, useEffect } from 'react';
import { createVersion, generateFingerprint } from '../lib/supabase';

// ============================================================================
// CHAT MESSAGE COMPONENT
// ============================================================================
function ChatMessage({ message, isFabOS }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? isFabOS
              ? 'bg-[#FF6B35] text-white'
              : 'bg-blue-600 text-white'
            : isSystem
              ? isFabOS
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-amber-900/30 text-amber-300 border border-amber-700'
              : isFabOS
                ? 'bg-gray-100 text-gray-800'
                : 'bg-slate-700 text-slate-100'
        }`}
      >
        {/* Avatar */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              isFabOS ? 'bg-[#FF6B35] text-white' : 'bg-emerald-500 text-white'
            }`}>
              AI
            </div>
            <span className={`text-xs font-medium ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>
              Kehitysassistentti
            </span>
          </div>
        )}

        {/* Message content */}
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>

        {/* Questions (if clarification) */}
        {message.questions && message.questions.length > 0 && (
          <div className={`mt-3 pt-3 border-t ${isFabOS ? 'border-gray-200' : 'border-slate-600'}`}>
            <p className={`text-xs font-medium mb-2 ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>
              Kysymyksiä:
            </p>
            <ul className="space-y-1">
              {message.questions.map((q, i) => (
                <li key={i} className={`text-xs ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
                  {i + 1}. {q}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Proposed changes preview */}
        {message.proposedChanges && (
          <div className={`mt-3 pt-3 border-t ${isFabOS ? 'border-gray-200' : 'border-slate-600'}`}>
            <p className={`text-xs font-medium mb-2 ${isFabOS ? 'text-[#FF6B35]' : 'text-emerald-400'}`}>
              📝 Ehdotetut muutokset:
            </p>
            <p className={`text-xs mb-2 ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>
              {message.proposedChanges.summary}
            </p>
            <div className="space-y-1">
              {message.proposedChanges.changes?.slice(0, 5).map((change, i) => (
                <div key={i} className={`text-xs flex items-center gap-2 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
                  <span className="text-green-500">+</span>
                  <code className={`px-1 rounded ${isFabOS ? 'bg-gray-200' : 'bg-slate-800'}`}>
                    {change.path}
                  </code>
                  <span>→</span>
                  <span className="text-green-400">{JSON.stringify(change.newValue)}</span>
                </div>
              ))}
              {message.proposedChanges.changes?.length > 5 && (
                <p className={`text-xs ${isFabOS ? 'text-gray-500' : 'text-slate-500'}`}>
                  ...ja {message.proposedChanges.changes.length - 5} muuta muutosta
                </p>
              )}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-[10px] mt-2 ${isUser ? 'text-white/70' : isFabOS ? 'text-gray-400' : 'text-slate-500'}`}>
          {message.timestamp ? new Date(message.timestamp).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }) : ''}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// QUICK ACTIONS
// ============================================================================
function QuickActions({ onSelect, isFabOS }) {
  const suggestions = [
    { icon: '📤', text: 'Lisää DXF-vienti', prompt: 'Haluan lisätä DXF-viennin' },
    { icon: '🔄', text: 'Automaattinen kierto', prompt: 'Lisää automaattinen 3D-mallin kierto' },
    { icon: '📐', text: 'Lisää taivutuksia', prompt: 'Haluan nostaa maksimitaivutusten määrää' },
    { icon: '🎨', text: 'Uusi materiaali', prompt: 'Lisää uusi materiaali: titaani' },
  ];

  return (
    <div className={`p-3 border-b ${isFabOS ? 'border-gray-200' : 'border-slate-700'}`}>
      <p className={`text-xs mb-2 ${isFabOS ? 'text-gray-500' : 'text-slate-500'}`}>
        Pikavalintoja:
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelect(s.prompt)}
            className={`text-xs px-3 py-1.5 rounded-full transition-all ${
              isFabOS
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            {s.icon} {s.text}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN CHAT COMPONENT
// ============================================================================
export default function AIChat({
  moduleId,
  currentConfig,
  isFabOS = false,
  onVersionCreated,
  onClose
}) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hei! 👋 Olen kehitysassistenttisi. Kerro mitä haluaisit muuttaa tai parantaa putkentaivutusmoduulissa, niin autan sinua luomaan uuden version!',
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVersion, setPendingVersion] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Kutsu AI API:a
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          currentConfig,
          conversation: messages.filter(m => m.role !== 'system'),
          newMessage: text.trim()
        })
      });

      if (!response.ok) {
        throw new Error('AI request failed');
      }

      const result = await response.json();

      // Lisää AI:n vastaus
      const assistantMessage = {
        role: 'assistant',
        content: result.message,
        timestamp: new Date().toISOString(),
        questions: result.questions,
        proposedChanges: result.proposedChanges,
        type: result.type
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Jos lopullinen versio, tallenna pending state
      if (result.type === 'final' && result.proposedChanges?.newConfig) {
        setPendingVersion({
          name: result.versionName,
          description: result.versionDescription,
          config: result.proposedChanges.newConfig
        });
      }

    } catch (error) {
      console.error('Chat error:', error);

      // Demo mode - simuloi vastaus
      const demoResponse = {
        role: 'assistant',
        content: 'Kiitos viestistäsi! Tämä on demo-tila. Tuotantoversiossa AI analysoi pyyntösi ja ehdottaa muutoksia moduuliin.\n\nKokeile esim. "Lisää DXF-vienti" tai "Nosta maksimitaivutukset 20:een".',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, demoResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    if (!pendingVersion) return;

    setIsLoading(true);

    try {
      const fingerprint = generateFingerprint();

      const newVersion = await createVersion({
        module_id: moduleId,
        name: pendingVersion.name,
        description: pendingVersion.description,
        version_number: `1.0.0-alpha-${Date.now().toString(36)}`,
        config: pendingVersion.config,
        version_type: 'experimental',
        creator_fingerprint: fingerprint
      });

      // Lisää onnistumisviesti
      setMessages(prev => [...prev, {
        role: 'system',
        content: `✅ Uusi versio "${pendingVersion.name}" luotu onnistuneesti! Voit nyt testata sitä versiogalleriassa.`,
        timestamp: new Date().toISOString()
      }]);

      setPendingVersion(null);

      // Ilmoita parent-komponentille
      onVersionCreated?.(newVersion);

    } catch (error) {
      console.error('Version creation error:', error);

      setMessages(prev => [...prev, {
        role: 'system',
        content: '❌ Virhe version luomisessa. Yritä uudelleen.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className={`flex flex-col h-full ${isFabOS ? 'bg-white' : 'bg-slate-800'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${
        isFabOS ? 'bg-gray-50 border-gray-200' : 'bg-slate-900 border-slate-700'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isFabOS ? 'bg-[#FF6B35]' : 'bg-gradient-to-br from-emerald-500 to-cyan-500'
          }`}>
            <span className="text-white text-lg">🤖</span>
          </div>
          <div>
            <h3 className={`font-semibold ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
              AI Kehitysassistentti
            </h3>
            <p className={`text-xs ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>
              Pyydä muutoksia moduuliin
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg transition-colors ${
            isFabOS ? 'hover:bg-gray-200 text-gray-500' : 'hover:bg-slate-700 text-slate-400'
          }`}
        >
          ✕
        </button>
      </div>

      {/* Quick actions */}
      <QuickActions onSelect={sendMessage} isFabOS={isFabOS} />

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto p-4 ${isFabOS ? 'bg-gray-50' : 'bg-slate-800/50'}`}>
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} isFabOS={isFabOS} />
        ))}

        {isLoading && (
          <div className="flex justify-start mb-3">
            <div className={`rounded-2xl px-4 py-3 ${isFabOS ? 'bg-gray-100' : 'bg-slate-700'}`}>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className={`w-2 h-2 rounded-full animate-bounce ${isFabOS ? 'bg-[#FF6B35]' : 'bg-emerald-500'}`} style={{ animationDelay: '0ms' }}></div>
                  <div className={`w-2 h-2 rounded-full animate-bounce ${isFabOS ? 'bg-[#FF6B35]' : 'bg-emerald-500'}`} style={{ animationDelay: '150ms' }}></div>
                  <div className={`w-2 h-2 rounded-full animate-bounce ${isFabOS ? 'bg-[#FF6B35]' : 'bg-emerald-500'}`} style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className={`text-xs ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>
                  AI miettii...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pending version confirmation */}
      {pendingVersion && (
        <div className={`px-4 py-3 border-t ${
          isFabOS ? 'bg-green-50 border-green-200' : 'bg-emerald-900/30 border-emerald-700'
        }`}>
          <p className={`text-sm font-medium mb-2 ${isFabOS ? 'text-green-800' : 'text-emerald-300'}`}>
            🎉 Versio valmis luotavaksi!
          </p>
          <p className={`text-xs mb-3 ${isFabOS ? 'text-green-700' : 'text-emerald-400'}`}>
            <strong>{pendingVersion.name}</strong>: {pendingVersion.description}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleCreateVersion}
              disabled={isLoading}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                isFabOS
                  ? 'bg-[#FF6B35] hover:bg-[#e5612f] text-white'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-white'
              }`}
            >
              ✓ Luo versio
            </button>
            <button
              onClick={() => setPendingVersion(null)}
              className={`py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                isFabOS
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              Peruuta
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className={`p-4 border-t ${isFabOS ? 'border-gray-200' : 'border-slate-700'}`}>
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Kirjoita muutospyyntö..."
            rows={1}
            disabled={isLoading}
            className={`flex-1 px-4 py-3 rounded-xl resize-none text-sm ${
              isFabOS
                ? 'bg-gray-100 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]'
                : 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
            } outline-none transition-all`}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className={`px-4 py-3 rounded-xl font-medium transition-all ${
              input.trim() && !isLoading
                ? isFabOS
                  ? 'bg-[#FF6B35] hover:bg-[#e5612f] text-white'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-white'
                : isFabOS
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            ➤
          </button>
        </div>
        <p className={`text-[10px] mt-2 ${isFabOS ? 'text-gray-400' : 'text-slate-500'}`}>
          Enter lähettää, Shift+Enter uusi rivi
        </p>
      </div>
    </div>
  );
}
