// ============================================================================
// DEVELOPMENT MODE - Parannettu AI-kehitystila
// ============================================================================
// Split-näkymä: AI-chat vasemmalla, sovelluksen esikatselu oikealla
// Flow: Pyyntö → AI ehdotus → Testaus → Arvio → Hyväksy/Jatka

import React, { useState, useRef, useEffect } from 'react';
import { createVersion, generateFingerprint } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ============================================================================
// CHAT MESSAGE COMPONENT
// ============================================================================
function ChatMessage({ message, isFabOS, onTest, onReject }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const hasProposal = message.proposedChanges && message.type === 'final';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[90%] rounded-2xl px-4 py-3 ${
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
        {!isUser && !isSystem && (
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

        {/* Proposed changes with TEST button */}
        {hasProposal && (
          <div className={`mt-3 pt-3 border-t ${isFabOS ? 'border-gray-200' : 'border-slate-600'}`}>
            <p className={`text-xs font-medium mb-2 ${isFabOS ? 'text-[#FF6B35]' : 'text-emerald-400'}`}>
              Ehdotetut muutokset:
            </p>
            <p className={`text-xs mb-3 ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>
              {message.proposedChanges.summary}
            </p>

            {/* Action buttons */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onTest?.(message)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                  isFabOS
                    ? 'bg-[#10B981] hover:bg-[#059669] text-white'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-white'
                }`}
              >
                <span>▶</span> Testaa muutosta
              </button>
              <button
                onClick={() => onReject?.(message)}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                  isFabOS
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-slate-600 hover:bg-slate-500 text-slate-300'
                }`}
              >
                Hylkää
              </button>
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
// DEVELOPER RATING COMPONENT
// ============================================================================
function DeveloperRating({ isFabOS, onRate, onContinue, onRevert, versionName }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);

  return (
    <div className={`p-4 rounded-xl border ${
      isFabOS
        ? 'bg-blue-50 border-blue-200'
        : 'bg-blue-900/20 border-blue-700'
    }`}>
      <h4 className={`font-semibold mb-3 flex items-center gap-2 ${
        isFabOS ? 'text-blue-800' : 'text-blue-300'
      }`}>
        <span>📊</span> Kehittäjän arvio
      </h4>

      <p className={`text-sm mb-3 ${isFabOS ? 'text-blue-700' : 'text-blue-400'}`}>
        Arvioi muutos <strong>"{versionName}"</strong>
      </p>

      {/* Star rating */}
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            className="text-2xl transition-transform hover:scale-110"
          >
            {star <= (hoveredStar || rating) ? '⭐' : '☆'}
          </button>
        ))}
        <span className={`ml-2 text-sm ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>
          {rating > 0 ? `${rating}/5` : 'Valitse'}
        </span>
      </div>

      {/* Feedback input */}
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Vapaaehtoinen palaute muutoksesta..."
        rows={2}
        className={`w-full px-3 py-2 rounded-lg text-sm mb-3 resize-none ${
          isFabOS
            ? 'bg-white border border-blue-200 text-gray-900 placeholder-gray-400'
            : 'bg-slate-800 border border-blue-700 text-white placeholder-slate-400'
        }`}
      />

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onRate?.(rating, feedback)}
          disabled={rating === 0}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            rating > 0
              ? isFabOS
                ? 'bg-[#10B981] hover:bg-[#059669] text-white'
                : 'bg-emerald-500 hover:bg-emerald-400 text-white'
              : isFabOS
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          ✓ Hyväksy ja tallenna
        </button>
        <button
          onClick={onContinue}
          className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            isFabOS
              ? 'bg-[#FF6B35] hover:bg-[#e5612f] text-white'
              : 'bg-blue-500 hover:bg-blue-400 text-white'
          }`}
        >
          🔄 Jatka kehitystä
        </button>
        <button
          onClick={onRevert}
          className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            isFabOS
              ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
          }`}
        >
          ↩ Palauta edellinen
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN DEVELOPMENT MODE COMPONENT
// ============================================================================
export default function DevelopmentMode({
  moduleId,
  currentConfig,
  isFabOS = false,
  onClose,
  onVersionCreated,
  AppComponent, // The app to show in preview (e.g., PipeBendingApp)
  appProps = {} // Props to pass to the app
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Tervetuloa kehitystilaan! 🛠️\n\nKerro mitä haluaisit muuttaa tai parantaa. Voit testata muutoksia suoraan oikealla näkyvässä esikatselussa.\n\nFlow: Pyyntö → Ehdotus → Testaa → Arvio → Tallenna',
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testingVersion, setTestingVersion] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [previewConfig, setPreviewConfig] = useState(currentConfig);
  const [configHistory, setConfigHistory] = useState([currentConfig]);
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
      // Call AI API
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          currentConfig: previewConfig,
          conversation: messages.filter(m => m.role !== 'system'),
          newMessage: text.trim()
        })
      });

      if (!response.ok) {
        throw new Error('AI request failed');
      }

      const result = await response.json();

      const assistantMessage = {
        role: 'assistant',
        content: result.message,
        timestamp: new Date().toISOString(),
        questions: result.questions,
        proposedChanges: result.proposedChanges,
        type: result.type,
        versionName: result.versionName,
        versionDescription: result.versionDescription
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat error:', error);

      // Demo mode response
      const demoResponse = {
        role: 'assistant',
        content: 'Ymmärrän pyyntösi. Tässä on ehdotukseni:\n\nMuutoksen kuvaus: Parannettu toiminnallisuus pyynnön mukaan.\n\nVoit testata muutosta painamalla "Testaa muutosta" -nappia.',
        timestamp: new Date().toISOString(),
        type: 'final',
        versionName: 'Demo-muutos',
        versionDescription: text.trim(),
        proposedChanges: {
          summary: 'Demo-tilan simuloitu muutos',
          newConfig: { ...previewConfig, _demoChange: Date.now() }
        }
      };

      setMessages(prev => [...prev, demoResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = (message) => {
    if (!message.proposedChanges?.newConfig) return;

    // Save current config to history
    setConfigHistory(prev => [...prev, previewConfig]);

    // Apply new config to preview
    setPreviewConfig(message.proposedChanges.newConfig);

    // Set testing state
    setTestingVersion({
      name: message.versionName || 'Nimetön versio',
      description: message.versionDescription || message.proposedChanges.summary,
      config: message.proposedChanges.newConfig,
      userRequest: messages.filter(m => m.role === 'user').map(m => m.content).join('\n')
    });

    // Show rating panel
    setShowRating(true);

    // Add system message
    setMessages(prev => [...prev, {
      role: 'system',
      content: `🧪 Testataan muutosta "${message.versionName || 'Nimetön'}"...\n\nKokeile muutosta oikealla olevassa esikatselussa. Kun olet valmis, anna arvio alla.`,
      timestamp: new Date().toISOString()
    }]);
  };

  const handleReject = (message) => {
    setMessages(prev => [...prev, {
      role: 'system',
      content: `❌ Muutos "${message.versionName || 'Nimetön'}" hylätty. Kerro mitä haluaisit tehdä toisin.`,
      timestamp: new Date().toISOString()
    }]);
  };

  const handleRatingSubmit = async (rating, feedback) => {
    if (!testingVersion) return;

    setIsLoading(true);

    try {
      const fingerprint = generateFingerprint();

      const newVersion = await createVersion({
        module_id: moduleId,
        name: testingVersion.name,
        description: testingVersion.description,
        version_number: `1.0.0-alpha-${Date.now().toString(36)}`,
        config: testingVersion.config,
        version_type: 'experimental',
        user_fingerprint: fingerprint,
        deployment_status: 'config_only',
        creator_email: user?.email || '',
        user_request: testingVersion.userRequest,
        developer_rating: rating,
        developer_feedback: feedback
      });

      setMessages(prev => [...prev, {
        role: 'system',
        content: `✅ Versio "${testingVersion.name}" tallennettu arvosanalla ${rating}/5!\n\n${feedback ? `Palautteesi: "${feedback}"` : ''}\n\nVoit jatkaa kehitystä tai sulkea kehitystilan.`,
        timestamp: new Date().toISOString()
      }]);

      setShowRating(false);
      setTestingVersion(null);
      onVersionCreated?.(newVersion);

    } catch (error) {
      console.error('Save error:', error);
      setMessages(prev => [...prev, {
        role: 'system',
        content: `❌ Virhe tallennuksessa: ${error?.message || 'Tuntematon virhe'}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueDevelopment = () => {
    setShowRating(false);
    setMessages(prev => [...prev, {
      role: 'system',
      content: '🔄 Jatketaan kehitystä. Kerro mitä haluaisit muuttaa tai parantaa.',
      timestamp: new Date().toISOString()
    }]);
    inputRef.current?.focus();
  };

  const handleRevert = () => {
    if (configHistory.length > 1) {
      const previousConfig = configHistory[configHistory.length - 1];
      setPreviewConfig(previousConfig);
      setConfigHistory(prev => prev.slice(0, -1));
      setShowRating(false);
      setTestingVersion(null);

      setMessages(prev => [...prev, {
        role: 'system',
        content: '↩ Palautettu edelliseen versioon. Voit jatkaa kehitystä.',
        timestamp: new Date().toISOString()
      }]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className={`flex flex-col h-screen ${isFabOS ? 'bg-[#F7F7F7]' : 'bg-slate-900'}`}>
      {/* Header */}
      <header className={`flex items-center justify-between px-4 py-3 border-b ${
        isFabOS ? 'bg-[#1A1A2E] border-gray-700' : 'bg-slate-900 border-slate-700'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm">Palaa sovellukseen</span>
          </button>
          <div className={`w-px h-6 ${isFabOS ? 'bg-gray-600' : 'bg-slate-700'}`}></div>
          {isFabOS ? (
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Fab</span>
              <span className="text-xl font-bold text-[#FF6B35]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>OS</span>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded">KEHITYSTILA</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                🛠️
              </div>
              <span className="text-white font-medium">Kehitystila</span>
            </div>
          )}
        </div>

        {testingVersion && (
          <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            isFabOS
              ? 'bg-amber-100 text-amber-700'
              : 'bg-amber-500/20 text-amber-400'
          }`}>
            🧪 Testataan: {testingVersion.name}
          </div>
        )}
      </header>

      {/* Main content - split view */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: AI Chat */}
        <div className={`w-[400px] flex flex-col border-r ${
          isFabOS ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700'
        }`}>
          {/* Messages */}
          <div className={`flex-1 overflow-y-auto p-4 ${isFabOS ? 'bg-gray-50' : 'bg-slate-800/50'}`}>
            {messages.map((msg, i) => (
              <ChatMessage
                key={i}
                message={msg}
                isFabOS={isFabOS}
                onTest={handleTest}
                onReject={handleReject}
              />
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

          {/* Rating panel (shown when testing) */}
          {showRating && testingVersion && (
            <div className="p-3 border-t border-gray-200">
              <DeveloperRating
                isFabOS={isFabOS}
                versionName={testingVersion.name}
                onRate={handleRatingSubmit}
                onContinue={handleContinueDevelopment}
                onRevert={handleRevert}
              />
            </div>
          )}

          {/* Input */}
          <div className={`p-3 border-t ${isFabOS ? 'border-gray-200' : 'border-slate-700'}`}>
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={showRating ? "Jatka kehitystä tai hyväksy muutos..." : "Kirjoita muutospyyntö..."}
                rows={2}
                disabled={isLoading}
                className={`flex-1 px-3 py-2 rounded-xl resize-none text-sm ${
                  isFabOS
                    ? 'bg-gray-100 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]'
                    : 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                } outline-none transition-all`}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className={`px-4 py-2 rounded-xl font-medium transition-all self-end ${
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
          </div>
        </div>

        {/* Right: App Preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Preview header */}
          <div className={`px-4 py-2 border-b flex items-center justify-between ${
            isFabOS ? 'bg-gray-100 border-gray-200' : 'bg-slate-800 border-slate-700'
          }`}>
            <span className={`text-sm font-medium ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>
              📱 Esikatselu
            </span>
            {testingVersion && (
              <span className={`text-xs px-2 py-1 rounded ${
                isFabOS ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-400'
              }`}>
                Muutokset aktiivisena
              </span>
            )}
          </div>

          {/* App component */}
          <div className="flex-1 overflow-auto">
            {AppComponent ? (
              <AppComponent
                {...appProps}
                config={previewConfig}
                isPreview={true}
                onBack={null} // Disable back button in preview
              />
            ) : (
              <div className={`h-full flex items-center justify-center ${
                isFabOS ? 'bg-gray-50 text-gray-400' : 'bg-slate-900 text-slate-500'
              }`}>
                <div className="text-center">
                  <span className="text-4xl mb-4 block">📱</span>
                  <p>Sovelluksen esikatselu</p>
                  <p className="text-sm mt-2">Komponenttia ei ole määritetty</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
