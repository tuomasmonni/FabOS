// ============================================================================
// REQUIRE AUTH - Kirjautumisvaatimus koko sovellukselle
// ============================================================================
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, THEMES } from '../../contexts/ThemeContext';

export default function RequireAuth({ children }) {
  const { isAuthenticated, loading, openLoginModal } = useAuth();
  const { theme } = useTheme();

  const isLegacy = theme === THEMES.LEGACY;
  const isFabOS = theme === THEMES.FABOS;

  // Näytä latausruutu kun tarkistetaan kirjautumista
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isLegacy ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-[#F7F7F7]'
      }`}>
        <div className="text-center">
          <div className={`w-16 h-16 mx-auto mb-4 border-4 border-t-transparent rounded-full animate-spin ${
            isLegacy ? 'border-cyan-500' : 'border-[#FF6B35]'
          }`} />
          <p className={isLegacy ? 'text-slate-400' : 'text-gray-500'}>
            Tarkistetaan kirjautumista...
          </p>
        </div>
      </div>
    );
  }

  // Jos ei kirjautunut, näytä tervetulosivu
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex flex-col ${
        isLegacy
          ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
          : 'bg-gradient-to-br from-[#F7F7F7] to-white'
      }`}>
        {/* Header */}
        <header className={`px-6 py-4 border-b ${
          isLegacy ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {isFabOS ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Fab
                </span>
                <span className="text-2xl font-bold text-[#FF6B35]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  OS
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-xl">⚙️</span>
                </div>
                <span className="text-xl font-bold text-white">FabOS</span>
              </div>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-lg w-full text-center">
            {/* Logo/Icon */}
            <div className={`w-32 h-32 mx-auto mb-8 rounded-3xl flex items-center justify-center ${
              isLegacy
                ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30'
                : 'bg-gradient-to-br from-[#FF6B35]/10 to-orange-500/10 border border-[#FF6B35]/20'
            }`}>
              <span className="text-6xl">🔐</span>
            </div>

            {/* Title */}
            <h1 className={`text-3xl font-bold mb-4 ${
              isLegacy ? 'text-white' : 'text-gray-900'
            }`}>
              Tervetuloa FabOS-alustalle!
            </h1>

            {/* Description */}
            <p className={`text-lg mb-8 ${
              isLegacy ? 'text-slate-400' : 'text-gray-600'
            }`}>
              Kirjaudu sisään käyttääksesi sovellusta. Voit luoda uuden tilin kirjautumissivulla.
            </p>

            {/* Features box */}
            <div className={`p-6 rounded-2xl mb-8 text-left ${
              isLegacy
                ? 'bg-slate-800/50 border border-slate-700'
                : 'bg-white border border-gray-200 shadow-lg'
            }`}>
              <h3 className={`text-sm font-semibold mb-4 ${
                isLegacy ? 'text-slate-300' : 'text-gray-700'
              }`}>
                Rekisteröityneille käyttäjille:
              </h3>
              <ul className="space-y-3">
                {[
                  { icon: '🎨', text: 'Pääsy kaikkiin moduuleihin ja konfiguraattoreihin' },
                  { icon: '🤖', text: 'AI-avusteinen kehitystila omien versioiden luomiseen' },
                  { icon: '📊', text: 'Henkilökohtaiset tilastot ja saavutukset' },
                  { icon: '⭐', text: 'Mahdollisuus äänestää ja arvostella versioita' },
                  { icon: '📧', text: 'Sähköposti-ilmoitukset päivityksistä' }
                ].map((item, i) => (
                  <li key={i} className={`flex items-center gap-3 text-sm ${
                    isLegacy ? 'text-slate-400' : 'text-gray-600'
                  }`}>
                    <span className="text-lg">{item.icon}</span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Login button */}
            <button
              onClick={openLoginModal}
              className={`w-full py-4 px-8 rounded-xl font-semibold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                isLegacy
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                  : 'bg-[#FF6B35] hover:bg-[#e5612f] text-white shadow-lg shadow-[#FF6B35]/25'
              }`}
            >
              Kirjaudu sisään
            </button>

            <p className={`text-sm mt-4 ${
              isLegacy ? 'text-slate-500' : 'text-gray-500'
            }`}>
              Ei vielä tiliä? Voit rekisteröityä kirjautumissivulla.
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className={`px-6 py-4 text-center border-t ${
          isLegacy ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <p className={`text-sm ${
            isLegacy ? 'text-slate-500' : 'text-gray-500'
          }`}>
© 2025 FabOS - Valmistuksen tulevaisuus
          </p>
        </footer>
      </div>
    );
  }

  // Kirjautunut käyttäjä - näytä sisältö
  return children;
}
