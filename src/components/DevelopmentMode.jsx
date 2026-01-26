// ============================================================================
// DEVELOPMENT MODE - Parannettu AI-kehitystila
// ============================================================================
// Split-näkymä: AI-chat vasemmalla, sovelluksen esikatselu oikealla
// Flow: Pyyntö → AI ehdotus → Testaus → Arvio → Hyväksy/Jatka

import React, { useState, useRef, useEffect } from 'react';
import { createVersion, generateFingerprint, generateNextVersionNumber } from '../lib/supabase';
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

        {/* Proposed changes - Tehdäänkö uusi versio? */}
        {hasProposal && (
          <div className={`mt-3 pt-3 border-t ${isFabOS ? 'border-gray-200' : 'border-slate-600'}`}>
            <p className={`text-xs font-medium mb-2 ${isFabOS ? 'text-[#FF6B35]' : 'text-emerald-400'}`}>
              Tehdäänkö uusi versio?
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
                    ? 'bg-[#FF6B35] hover:bg-[#e5612f] text-white'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-white'
                }`}
              >
                Kyllä, tee versio!
              </button>
              <button
                onClick={() => onReject?.(message)}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                  isFabOS
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-slate-600 hover:bg-slate-500 text-slate-300'
                }`}
              >
                Ei kiitos
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
// LOGIN REQUIRED COMPONENT FOR DEVELOPMENT MODE
// ============================================================================
function DevLoginRequired({ isFabOS, onClose, onLogin }) {
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
      </header>

      {/* Content */}
      <div className={`flex-1 flex items-center justify-center p-8`}>
        <div className="text-center max-w-lg">
          <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
            isFabOS ? 'bg-[#FF6B35]/10' : 'bg-purple-500/20'
          }`}>
            <span className="text-5xl">🔐</span>
          </div>

          <h2 className={`text-2xl font-bold mb-4 ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
            Kirjaudu käyttääksesi kehitystilaa
          </h2>

          <p className={`mb-6 text-lg ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>
            Kehitystila on tarkoitettu rekisteröityneille käyttäjille.
            Kirjautumalla voimme seurata kuka on kehittänyt mitäkin ominaisuutta.
          </p>

          <div className={`p-5 rounded-xl mb-8 text-left ${
            isFabOS ? 'bg-white border border-gray-200 shadow-lg' : 'bg-slate-800 border border-slate-700'
          }`}>
            <p className={`text-sm font-semibold mb-3 ${isFabOS ? 'text-gray-800' : 'text-slate-200'}`}>
              Kehitystilassa voit:
            </p>
            <ul className={`text-sm space-y-2 ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>
              <li className="flex items-center gap-2">
                <span className={`${isFabOS ? 'text-[#FF6B35]' : 'text-emerald-400'}`}>✓</span>
                Pyytää AI:ta kehittämään uusia ominaisuuksia
              </li>
              <li className="flex items-center gap-2">
                <span className={`${isFabOS ? 'text-[#FF6B35]' : 'text-emerald-400'}`}>✓</span>
                Testata muutoksia reaaliajassa split-näkymässä
              </li>
              <li className="flex items-center gap-2">
                <span className={`${isFabOS ? 'text-[#FF6B35]' : 'text-emerald-400'}`}>✓</span>
                Arvostella ja dokumentoida kehitystyötä
              </li>
              <li className="flex items-center gap-2">
                <span className={`${isFabOS ? 'text-[#FF6B35]' : 'text-emerald-400'}`}>✓</span>
                Palauttaa edellisiin versioihin tarvittaessa
              </li>
            </ul>
          </div>

          <button
            onClick={onLogin}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
              isFabOS
                ? 'bg-[#FF6B35] hover:bg-[#e5612f] text-white shadow-lg'
                : 'bg-emerald-500 hover:bg-emerald-400 text-white'
            }`}
          >
            Kirjaudu sisään
          </button>

          <p className={`text-sm mt-4 ${isFabOS ? 'text-gray-500' : 'text-slate-500'}`}>
            Ei vielä tiliä? Kirjautumissivulla voit myös rekisteröityä.
          </p>
        </div>
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
  const { user, isAuthenticated, openLoginModal } = useAuth();
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
  const [attachedFiles, setAttachedFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom when new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // If not authenticated, show login required screen
  if (!isAuthenticated) {
    return (
      <DevLoginRequired
        isFabOS={isFabOS}
        onClose={onClose}
        onLogin={() => {
          onClose?.();
          openLoginModal();
        }}
      />
    );
  }

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
      content: `🧪 Muutos "${message.versionName || 'Nimetön'}" on nyt aktiivisena!\n\nNäet muutokset oikealla esikatselussa. Voit tallentaa version tai jatkaa kehitystä.`,
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
      const email = user?.email || '';

      // Generoi semanttinen versionumero
      const versionNumber = await generateNextVersionNumber(email, moduleId);

      const newVersion = await createVersion({
        module_id: moduleId,
        name: testingVersion.name,
        description: testingVersion.description,
        version_number: versionNumber,
        config: testingVersion.config,
        version_type: 'experimental',
        user_fingerprint: fingerprint,
        deployment_status: 'config_only',
        creator_email: email,
        user_request: testingVersion.userRequest,
        developer_rating: rating,
        developer_feedback: feedback
      });

      setMessages(prev => [...prev, {
        role: 'system',
        content: `✅ Versio "${testingVersion.name}" (${versionNumber}) tallennettu arvosanalla ${rating}/5!\n\n${feedback ? `Palautteesi: "${feedback}"` : ''}\n\nVoit jatkaa kehitystä tai sulkea kehitystilan.`,
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

  // Handle file attachment
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      // Accept images and common document types
      const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });

    if (validFiles.length > 0) {
      // Convert files to base64 for display and sending
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setAttachedFiles(prev => [...prev, {
            name: file.name,
            type: file.type,
            size: file.size,
            data: event.target.result,
            preview: file.type.startsWith('image/') ? event.target.result : null
          }]);
        };
        reader.readAsDataURL(file);
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle paste event for screenshots
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setAttachedFiles(prev => [...prev, {
              name: `screenshot-${Date.now()}.png`,
              type: 'image/png',
              size: file.size,
              data: event.target.result,
              preview: event.target.result
            }]);
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  // Remove attached file
  const removeAttachedFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Send message with attachments
  const sendMessageWithAttachments = () => {
    if (!input.trim() && attachedFiles.length === 0) return;

    // Include attachment info in the message
    let messageContent = input.trim();
    if (attachedFiles.length > 0) {
      const fileNames = attachedFiles.map(f => f.name).join(', ');
      messageContent += `\n\n📎 Liitetiedostot: ${fileNames}`;
    }

    sendMessage(messageContent);
    setAttachedFiles([]);
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
            {/* Attached files preview */}
            {attachedFiles.length > 0 && (
              <div className={`mb-2 p-2 rounded-lg ${isFabOS ? 'bg-gray-100' : 'bg-slate-700'}`}>
                <p className={`text-xs mb-2 ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>
                  📎 Liitetiedostot:
                </p>
                <div className="flex flex-wrap gap-2">
                  {attachedFiles.map((file, index) => (
                    <div key={index} className={`relative group flex items-center gap-2 px-2 py-1 rounded-lg ${
                      isFabOS ? 'bg-white border border-gray-200' : 'bg-slate-600 border border-slate-500'
                    }`}>
                      {file.preview ? (
                        <img src={file.preview} alt={file.name} className="w-8 h-8 object-cover rounded" />
                      ) : (
                        <span className="text-lg">📄</span>
                      )}
                      <span className={`text-xs truncate max-w-[100px] ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeAttachedFile(index)}
                        className={`ml-1 w-4 h-4 flex items-center justify-center rounded-full text-xs ${
                          isFabOS
                            ? 'bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-500'
                            : 'bg-slate-500 hover:bg-red-500/50 text-slate-300 hover:text-red-300'
                        }`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.txt"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Attachment button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className={`px-3 py-2 rounded-xl transition-all self-end ${
                  isFabOS
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-400 border border-slate-600'
                }`}
                title="Liitä kuva tai tiedosto (tai liitä Ctrl+V)"
              >
                📎
              </button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                onPaste={handlePaste}
                placeholder={showRating ? "Jatka kehitystä tai hyväksy muutos..." : "Kirjoita muutospyyntö... (Ctrl+V liittää kuvan)"}
                rows={2}
                disabled={isLoading}
                className={`flex-1 px-3 py-2 rounded-xl resize-none text-sm ${
                  isFabOS
                    ? 'bg-gray-100 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]'
                    : 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                } outline-none transition-all`}
              />
              <button
                onClick={sendMessageWithAttachments}
                disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
                className={`px-4 py-2 rounded-xl font-medium transition-all self-end ${
                  (input.trim() || attachedFiles.length > 0) && !isLoading
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
            <p className={`text-[10px] mt-1 ${isFabOS ? 'text-gray-400' : 'text-slate-500'}`}>
              Enter lähettää • Shift+Enter uusi rivi • Ctrl+V liittää kuvakaappauksen
            </p>
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

          {/* App component / Config Preview */}
          <div className="flex-1 overflow-auto">
            {AppComponent ? (
              <AppComponent
                {...appProps}
                config={previewConfig}
                isPreview={true}
                onBack={null} // Disable back button in preview
              />
            ) : (
              <div className={`h-full p-6 ${isFabOS ? 'bg-gray-50' : 'bg-slate-900'}`}>
                {/* Config preview when no app component */}
                <div className={`rounded-xl border p-6 ${
                  isFabOS ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700'
                }`}>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl">⚙️</span>
                    <div>
                      <h3 className={`font-semibold ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
                        Moduulin konfiguraatio
                      </h3>
                      <p className={`text-sm ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>
                        {moduleId || 'Tuntematon moduuli'}
                      </p>
                    </div>
                  </div>

                  {/* Features section */}
                  {previewConfig?.features && (
                    <div className="mb-6">
                      <h4 className={`text-sm font-medium mb-3 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
                        📦 Ominaisuudet
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(previewConfig.features).map(([key, value]) => (
                          <div key={key} className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                            isFabOS ? 'bg-gray-50' : 'bg-slate-700/50'
                          }`}>
                            <span className={`text-sm ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>
                              {key}
                            </span>
                            <span className={`text-sm font-medium ${
                              value === true
                                ? 'text-green-500'
                                : value === false
                                  ? 'text-red-400'
                                  : isFabOS ? 'text-[#FF6B35]' : 'text-emerald-400'
                            }`}>
                              {typeof value === 'boolean' ? (value ? '✓' : '✗') : value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Limits section */}
                  {previewConfig?.limits && (
                    <div className="mb-6">
                      <h4 className={`text-sm font-medium mb-3 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
                        📐 Rajat
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(previewConfig.limits).map(([key, value]) => (
                          <div key={key} className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                            isFabOS ? 'bg-gray-50' : 'bg-slate-700/50'
                          }`}>
                            <span className={`text-sm ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>
                              {key}
                            </span>
                            <span className={`text-sm font-medium ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Materials section */}
                  {previewConfig?.materials && (
                    <div className="mb-6">
                      <h4 className={`text-sm font-medium mb-3 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
                        🔩 Materiaalit
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {previewConfig.materials.map((mat) => (
                          <span key={mat} className={`px-3 py-1 rounded-full text-sm ${
                            isFabOS
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {mat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Raw JSON toggle */}
                  <details className={`mt-4 rounded-lg ${isFabOS ? 'bg-gray-50' : 'bg-slate-700/50'}`}>
                    <summary className={`px-3 py-2 cursor-pointer text-sm font-medium ${
                      isFabOS ? 'text-gray-600' : 'text-slate-400'
                    }`}>
                      📄 Näytä JSON
                    </summary>
                    <pre className={`p-3 text-xs overflow-auto max-h-64 ${
                      isFabOS ? 'text-gray-700' : 'text-slate-300'
                    }`}>
                      {JSON.stringify(previewConfig, null, 2)}
                    </pre>
                  </details>

                  {/* Change indicator */}
                  {testingVersion && (
                    <div className={`mt-4 p-3 rounded-lg border ${
                      isFabOS
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-green-500/10 border-green-500/30 text-green-400'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span>✨</span>
                        <span className="text-sm font-medium">
                          Muutokset aktiivisena: {testingVersion.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
