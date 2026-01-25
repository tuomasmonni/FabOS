import React, { useState, useEffect } from 'react';
import { useTheme, THEMES } from './contexts/ThemeContext';
import ThemeSwitcher from './components/ThemeSwitcher';

const FeatureSuggestionPage = ({ onBack }) => {
  const { theme } = useTheme();
  const isFabOS = theme === THEMES.FABOS;
  const [suggestion, setSuggestion] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const categories = [
    { id: 'laser', label: 'Laserleikkaus', icon: '⚡' },
    { id: 'bending', label: 'Taivutukset', icon: '📐' },
    { id: 'pipe', label: 'Putket', icon: '🔧' },
    { id: 'drilling', label: 'Poraukset', icon: '🏗️' },
    { id: 'assembly', label: 'Kokoonpano', icon: '🔩' },
    { id: 'ui', label: 'Käyttöliittymä', icon: '🖥️' },
    { id: 'pricing', label: 'Hinnoittelu', icon: '💰' },
    { id: 'other', label: 'Muu', icon: '💡' }
  ];

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch('/api/suggestions');
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!suggestion.trim() || !category) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestion: suggestion.trim(),
          name: name.trim() || 'Anonyymi',
          email: email.trim(),
          category,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setSuggestion('');
        setName('');
        setEmail('');
        setCategory('');
        fetchSuggestions();
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch (error) {
      console.error('Failed to submit suggestion:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (suggestionId) => {
    try {
      await fetch('/api/suggestions/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId })
      });
      fetchSuggestions();
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  return (
    <div className={isFabOS
      ? "min-h-screen bg-[#F7F7F7]"
      : "min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
    }>
      {/* Header */}
      <header className={isFabOS
        ? "bg-[#1A1A2E] border-b border-gray-700 sticky top-0 z-50"
        : "bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50"
      }>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className={isFabOS
                ? "flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                : "flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              }
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Takaisin</span>
            </button>
            <div className={isFabOS ? "w-px h-6 bg-gray-600" : "w-px h-6 bg-slate-700"}></div>
            {isFabOS ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <span className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Fab</span>
                  <span className="text-xl font-bold text-[#FF6B35]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>OS</span>
                </div>
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded">V0.7</span>
                <span className="text-white font-medium" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Ehdota ominaisuutta</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-fuchsia-500/30">
                  💡
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">V0.7 Laite</h1>
                  <p className="text-sm text-slate-400">Ehdota ominaisuutta</p>
                </div>
              </div>
            )}
          </div>
          <ThemeSwitcher variant="dark" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Suggestion Form */}
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
            <h2 className="text-2xl font-bold text-white mb-2">Ehdota uutta ominaisuutta</h2>
            <p className="text-slate-400 mb-6">
              Kerro meille mitä ominaisuutta tarvitset. Parhaat ideat toteutetaan!
            </p>

            {submitted && (
              <div className="mb-6 bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-emerald-400 font-semibold">Kiitos ehdotuksestasi!</p>
                  <p className="text-emerald-400/70 text-sm">Ehdotuksesi on tallennettu ja arvioidaan.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Kategoria *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`
                        p-3 rounded-xl border-2 transition-all text-center
                        ${category === cat.id
                          ? 'border-fuchsia-500 bg-fuchsia-500/20 text-white'
                          : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                        }
                      `}
                    >
                      <div className="text-2xl mb-1">{cat.icon}</div>
                      <div className="text-xs">{cat.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Suggestion Text */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Ominaisuusehdotus *
                </label>
                <textarea
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  placeholder="Kuvaile ominaisuus mahdollisimman tarkasti..."
                  rows={5}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 resize-none"
                  required
                />
              </div>

              {/* Name (Optional) */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nimi (valinnainen)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nimesi tai yritys"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500"
                />
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Sähköposti (valinnainen)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500"
                />
                <p className="text-slate-500 text-xs mt-1">
                  Ilmoitamme jos ominaisuus toteutetaan
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !suggestion.trim() || !category}
                className={`
                  w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2
                  ${isSubmitting || !suggestion.trim() || !category
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white hover:shadow-lg hover:shadow-fuchsia-500/30 hover:-translate-y-0.5'
                  }
                `}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Lähetetään...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Lähetä ehdotus
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Previous Suggestions */}
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
            <h2 className="text-2xl font-bold text-white mb-2">Ehdotukset</h2>
            <p className="text-slate-400 mb-6">
              Äänestä suosikkejasi - suosituimmat toteutetaan ensin!
            </p>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin" />
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-700/50 rounded-full flex items-center justify-center">
                  <span className="text-3xl">💭</span>
                </div>
                <p className="text-slate-400">Ei vielä ehdotuksia</p>
                <p className="text-slate-500 text-sm">Ole ensimmäinen!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {suggestions.map((item, index) => {
                  const cat = categories.find(c => c.id === item.category);
                  return (
                    <div
                      key={item.id || index}
                      className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleVote(item.id)}
                          className="flex flex-col items-center gap-1 group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:border-fuchsia-500 group-hover:bg-fuchsia-500/10 transition-all">
                            <svg className="w-5 h-5 text-slate-400 group-hover:text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </div>
                          <span className="text-sm font-bold text-slate-400 group-hover:text-fuchsia-400">
                            {item.votes || 0}
                          </span>
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {cat && (
                              <span className="text-sm bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                                {cat.icon} {cat.label}
                              </span>
                            )}
                          </div>
                          <p className="text-white text-sm">{item.suggestion}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                            <span>{item.name || 'Anonyymi'}</span>
                            <span>•</span>
                            <span>{new Date(item.timestamp).toLocaleDateString('fi-FI')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default FeatureSuggestionPage;
