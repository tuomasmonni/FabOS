// ============================================================================
// AI CHAT COMPONENT
// ============================================================================
// Keskusteluikkuna käyttäjän ja AI:n väliseen kommunikaatioon
// Käytetään moduulien muokkauspyyntöihin

import React, { useState, useRef, useEffect } from 'react';
import { createVersion, generateFingerprint, generateNextVersionNumber, watchVersionStatus } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ============================================================================
// CODE GENERATION STATUS COMPONENT
// ============================================================================
function CodeGenerationStatus({ versionName, status, isFabOS, onClose }) {
  const statusMessages = {
    pending: { icon: '⏳', text: 'Odottaa käsittelyä...', color: 'amber' },
    generating: { icon: '🔄', text: 'AI generoi koodia...', color: 'blue' },
    deployed: { icon: '✅', text: 'Valmis ja deployattu!', color: 'green' },
    failed: { icon: '❌', text: 'Generointi epäonnistui', color: 'red' }
  };

  const current = statusMessages[status] || statusMessages.pending;
  const isActive = status === 'pending' || status === 'generating';

  const colorClasses = {
    amber: isFabOS ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-900/30 border-amber-700 text-amber-300',
    blue: isFabOS ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-blue-900/30 border-blue-700 text-blue-300',
    green: isFabOS ? 'bg-green-50 border-green-200 text-green-800' : 'bg-green-900/30 border-green-700 text-green-300',
    red: isFabOS ? 'bg-red-50 border-red-200 text-red-800' : 'bg-red-900/30 border-red-700 text-red-300'
  };

  return (
    <div className={`mx-4 my-2 p-4 rounded-xl border ${colorClasses[current.color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-2xl ${isActive ? 'animate-pulse' : ''}`}>{current.icon}</span>
          <div>
            <p className="font-medium text-sm">{versionName}</p>
            <p className="text-xs opacity-75">{current.text}</p>
          </div>
        </div>
        {!isActive && (
          <button
            onClick={onClose}
            className={`text-xs px-2 py-1 rounded-lg transition-colors ${
              isFabOS ? 'hover:bg-gray-200' : 'hover:bg-slate-700'
            }`}
          >
            ✕
          </button>
        )}
      </div>
      {isActive && (
        <div className="mt-3">
          <div className={`h-1 rounded-full overflow-hidden ${isFabOS ? 'bg-gray-200' : 'bg-slate-700'}`}>
            <div
              className={`h-full rounded-full ${
                status === 'generating'
                  ? 'bg-blue-500 animate-pulse'
                  : 'bg-amber-500'
              }`}
              style={{
                width: status === 'generating' ? '60%' : '20%',
                transition: 'width 1s ease-in-out'
              }}
            />
          </div>
          <p className={`text-[10px] mt-2 ${isFabOS ? 'text-gray-500' : 'text-slate-500'}`}>
            💡 Voit sulkea tämän ikkunan - saat sähköposti-ilmoituksen kun valmis!
          </p>
        </div>
      )}
    </div>
  );
}

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
// LOGIN REQUIRED COMPONENT
// ============================================================================
function LoginRequired({ isFabOS, onClose, onLogin }) {
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
              Kirjautuminen vaaditaan
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

      {/* Content */}
      <div className={`flex-1 flex items-center justify-center p-8 ${isFabOS ? 'bg-gray-50' : 'bg-slate-800/50'}`}>
        <div className="text-center max-w-md">
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
            isFabOS ? 'bg-[#FF6B35]/10' : 'bg-emerald-500/20'
          }`}>
            <span className="text-4xl">🔐</span>
          </div>

          <h2 className={`text-xl font-bold mb-3 ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
            Kirjaudu käyttääksesi AI-kehittäjää
          </h2>

          <p className={`mb-6 ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>
            AI-kehitysominaisuudet ovat käytettävissä vain kirjautuneille käyttäjille.
            Näin voimme seurata kehitystä ja tarjota sinulle paremman kokemuksen.
          </p>

          <div className={`p-4 rounded-xl mb-6 text-left ${
            isFabOS ? 'bg-blue-50 border border-blue-200' : 'bg-blue-900/20 border border-blue-700'
          }`}>
            <p className={`text-sm font-medium mb-2 ${isFabOS ? 'text-blue-800' : 'text-blue-300'}`}>
              Kirjautuneet käyttäjät voivat:
            </p>
            <ul className={`text-sm space-y-1 ${isFabOS ? 'text-blue-700' : 'text-blue-400'}`}>
              <li>✓ Pyytää AI:ta tekemään muutoksia moduuleihin</li>
              <li>✓ Testata muutoksia reaaliajassa</li>
              <li>✓ Tallentaa omia versioita</li>
              <li>✓ Arvostella ja dokumentoida kehitystyötä</li>
            </ul>
          </div>

          <button
            onClick={onLogin}
            className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
              isFabOS
                ? 'bg-[#FF6B35] hover:bg-[#e5612f] text-white'
                : 'bg-emerald-500 hover:bg-emerald-400 text-white'
            }`}
          >
            Kirjaudu sisään
          </button>

          <p className={`text-xs mt-4 ${isFabOS ? 'text-gray-500' : 'text-slate-500'}`}>
            Ei vielä tiliä? Kirjautumissivulla voit myös rekisteröityä.
          </p>
        </div>
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
  const { user, isAuthenticated, openLoginModal } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hei! 👋 Olen kehitysassistenttisi. Kerro mitä haluaisit muuttaa tai parantaa putkentaivutusmoduulissa, niin autan sinua luomaan uuden version!\n\n🚀 Uutta: Kun luot version, AI generoi oikean koodin automaattisesti ja saat sähköposti-ilmoituksen kun se on valmis!',
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVersion, setPendingVersion] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [activeGeneration, setActiveGeneration] = useState(null); // Track active code generation
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const statusWatcherRef = useRef(null);

  // Scroll to bottom when new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Cleanup status watcher on unmount
  useEffect(() => {
    return () => {
      if (statusWatcherRef.current) {
        statusWatcherRef.current();
      }
    };
  }, []);

  // If not authenticated, show login required screen
  if (!isAuthenticated) {
    return (
      <LoginRequired
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

  const handleCreateVersion = async (generateCode = false) => {
    if (!pendingVersion) return;

    // Käytä automaattisesti kirjautuneen käyttäjän sähköpostia
    const emailToUse = user?.email || userEmail;

    // Jos koodi generoidaan eikä sähköpostia ole, pyydä se
    if (generateCode && !emailToUse) {
      setShowEmailInput(true);
      return;
    }

    setIsLoading(true);

    try {
      const fingerprint = generateFingerprint();
      const email = user?.email || userEmail || '';

      // Generoi semanttinen versionumero
      const versionNumber = await generateNextVersionNumber(email, moduleId);

      const newVersion = await createVersion({
        module_id: moduleId,
        name: pendingVersion.name,
        description: pendingVersion.description,
        version_number: versionNumber,
        config: pendingVersion.config,
        version_type: 'experimental',
        user_fingerprint: fingerprint,
        deployment_status: generateCode ? 'pending' : 'config_only',
        creator_email: email,
        user_request: pendingVersion.userRequest
      });

      if (generateCode && newVersion?.id) {
        // Aseta aktiivinen generointi
        setActiveGeneration({
          id: newVersion.id,
          name: pendingVersion.name,
          versionNumber,
          status: 'pending'
        });

        // Aloita statuksen seuranta
        statusWatcherRef.current = watchVersionStatus(newVersion.id, (statusData) => {
          setActiveGeneration(prev => prev ? {
            ...prev,
            status: statusData.deployment_status
          } : null);

          // Ilmoita valmistumisesta
          if (statusData.deployment_status === 'deployed') {
            setMessages(prev => [...prev, {
              role: 'system',
              content: `🎉 Versio "${pendingVersion.name}" (${versionNumber}) on nyt valmis ja deployattu tuotantoon!\n\nVoit testata muutoksia heti.`,
              timestamp: new Date().toISOString()
            }]);
          } else if (statusData.deployment_status === 'failed') {
            setMessages(prev => [...prev, {
              role: 'system',
              content: `❌ Koodin generointi epäonnistui versiolle "${pendingVersion.name}". Yritä uudelleen yksinkertaisemmalla pyynnöllä.`,
              timestamp: new Date().toISOString()
            }]);
          }
        });

        try {
          const triggerResponse = await fetch('/api/trigger-code-generation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              versionId: newVersion.id,
              moduleId: moduleId,
              versionName: `${pendingVersion.name} (${versionNumber})`,
              userRequest: pendingVersion.userRequest || pendingVersion.description,
              proposedChanges: pendingVersion.config,
              userEmail: email
            })
          });

          if (triggerResponse.ok) {
            setActiveGeneration(prev => prev ? { ...prev, status: 'generating' } : null);
          } else {
            throw new Error('Trigger failed');
          }
        } catch (triggerError) {
          console.error('Code generation trigger failed:', triggerError);
          setActiveGeneration(null);
          setMessages(prev => [...prev, {
            role: 'system',
            content: `⚠️ Automaattinen koodin generointi ei käynnistynyt. Versio ${versionNumber} on silti tallennettu config-muutoksilla.`,
            timestamp: new Date().toISOString()
          }]);
        }
      } else {
        // Vain config-muutos
        setMessages(prev => [...prev, {
          role: 'system',
          content: `✅ Uusi versio "${pendingVersion.name}" (${versionNumber}) luotu onnistuneesti! Voit nyt testata sitä versiogalleriassa.`,
          timestamp: new Date().toISOString()
        }]);
      }

      setPendingVersion(null);
      setShowEmailInput(false);
      setUserEmail('');

      // Ilmoita parent-komponentille
      onVersionCreated?.(newVersion);

    } catch (error) {
      console.error('Version creation error:', error);
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      console.error('Error details:', JSON.stringify(error, null, 2));

      setMessages(prev => [...prev, {
        role: 'system',
        content: `❌ Virhe version luomisessa: ${error?.message || error?.code || 'Tuntematon virhe'}. Yritä uudelleen.`,
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

      {/* Active code generation status */}
      {activeGeneration && (
        <CodeGenerationStatus
          versionName={`${activeGeneration.name} (${activeGeneration.versionNumber})`}
          status={activeGeneration.status}
          isFabOS={isFabOS}
          onClose={() => setActiveGeneration(null)}
        />
      )}

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

      {/* Email input for code generation */}
      {showEmailInput && (
        <div className={`px-4 py-3 border-t ${
          isFabOS ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/30 border-blue-700'
        }`}>
          <p className={`text-sm font-medium mb-2 ${isFabOS ? 'text-blue-800' : 'text-blue-300'}`}>
            📧 Sähköpostiosoite ilmoitusta varten
          </p>
          <p className={`text-xs mb-3 ${isFabOS ? 'text-blue-600' : 'text-blue-400'}`}>
            Saat ilmoituksen kun koodi on generoitu ja otettu käyttöön.
          </p>
          <div className="flex gap-2 mb-2">
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="esim. nimi@yritys.fi"
              className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                isFabOS
                  ? 'bg-white border border-blue-300 text-gray-900 placeholder-gray-400'
                  : 'bg-slate-700 border border-blue-600 text-white placeholder-slate-400'
              }`}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleCreateVersion(true)}
              disabled={isLoading || !userEmail.includes('@')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                userEmail.includes('@') && !isLoading
                  ? isFabOS
                    ? 'bg-[#FF6B35] hover:bg-[#e5612f] text-white'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-white'
                  : isFabOS
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
              }`}
            >
              🚀 Generoi koodi
            </button>
            <button
              onClick={() => {
                setShowEmailInput(false);
                handleCreateVersion(false);
              }}
              className={`py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                isFabOS
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              Vain config
            </button>
          </div>
        </div>
      )}

      {/* Pending version confirmation */}
      {pendingVersion && !showEmailInput && (
        <div className={`px-4 py-3 border-t ${
          isFabOS ? 'bg-green-50 border-green-200' : 'bg-emerald-900/30 border-emerald-700'
        }`}>
          <p className={`text-sm font-medium mb-2 ${isFabOS ? 'text-green-800' : 'text-emerald-300'}`}>
            🎉 Versio valmis luotavaksi!
          </p>
          <p className={`text-xs mb-3 ${isFabOS ? 'text-green-700' : 'text-emerald-400'}`}>
            <strong>{pendingVersion.name}</strong>: {pendingVersion.description}
          </p>

          {/* Kaksi vaihtoehtoa: config vs koodi */}
          <div className={`mb-3 p-3 rounded-lg ${isFabOS ? 'bg-white border border-green-200' : 'bg-slate-800 border border-emerald-700'}`}>
            <p className={`text-xs font-medium mb-2 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
              Valitse toteutustapa:
            </p>
            <div className="space-y-2">
              <div className={`text-xs ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>
                <strong className={isFabOS ? 'text-[#FF6B35]' : 'text-emerald-400'}>🚀 Generoi koodi</strong>
                <span className="ml-2">AI kirjoittaa oikeat koodimuutokset ja deployaa automaattisesti</span>
              </div>
              <div className={`text-xs ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>
                <strong className={isFabOS ? 'text-gray-700' : 'text-slate-300'}>⚙️ Vain config</strong>
                <span className="ml-2">Tallennetaan JSON-konfiguraatio (nopea, mutta rajatumpi)</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleCreateVersion(true)}
              disabled={isLoading}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                isFabOS
                  ? 'bg-[#FF6B35] hover:bg-[#e5612f] text-white'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-white'
              }`}
            >
              🚀 Generoi koodi
            </button>
            <button
              onClick={() => handleCreateVersion(false)}
              disabled={isLoading}
              className={`py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                isFabOS
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              ⚙️ Vain config
            </button>
          </div>
          <button
            onClick={() => setPendingVersion(null)}
            className={`w-full mt-2 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              isFabOS
                ? 'text-gray-500 hover:text-gray-700'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Peruuta
          </button>
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
