import React, { useState, useEffect } from 'react';
import { useTheme, THEMES } from './contexts/ThemeContext';

export default function ThemeSelector() {
  const { selectTheme } = useTheme();
  const [hoveredTheme, setHoveredTheme] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">

      {/* Background animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/10 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <div className="relative max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-4xl">🎨</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Valitse käyttöliittymä
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Testaamme uutta ilmettä. Valitse kumman version haluat nähdä.
            Voit vaihtaa milloin tahansa.
          </p>
        </div>

        {/* Theme cards */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Legacy Theme Card */}
          <button
            onClick={() => selectTheme(THEMES.LEGACY)}
            onMouseEnter={() => setHoveredTheme('legacy')}
            onMouseLeave={() => setHoveredTheme(null)}
            className={`group relative bg-white/5 backdrop-blur border rounded-2xl p-8 text-left transition-all duration-300 hover:scale-[1.02] ${
              hoveredTheme === 'legacy'
                ? 'border-cyan-500/50 bg-white/10 shadow-xl shadow-cyan-500/10'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="absolute top-4 right-4 px-3 py-1 bg-gray-500/20 rounded-full text-gray-400 text-xs font-medium">
              Nykyinen
            </div>

            {/* Preview */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 mb-6 h-40 flex items-center justify-center border border-slate-700 overflow-hidden">
              <div className="text-center">
                {/* Old logo mock */}
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <div className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Levyverkkokauppa
                </div>
                <div className="flex gap-2 justify-center mt-3">
                  <div className="w-6 h-6 rounded bg-gradient-to-r from-cyan-500 to-blue-600"></div>
                  <div className="w-6 h-6 rounded bg-gradient-to-r from-violet-500 to-purple-600"></div>
                  <div className="w-6 h-6 rounded bg-gradient-to-r from-emerald-500 to-teal-600"></div>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-white mb-2">
              Levyverkkokauppa
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Nykyinen tuttu ilme. Vegas-efektit, tumma teema, neon-värit.
            </p>

            <div className="flex items-center gap-2 text-cyan-400 font-medium group-hover:text-cyan-300 transition-colors">
              Valitse tämä
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* FabOS Theme Card */}
          <button
            onClick={() => selectTheme(THEMES.FABOS)}
            onMouseEnter={() => setHoveredTheme('fabos')}
            onMouseLeave={() => setHoveredTheme(null)}
            className={`group relative bg-white/5 backdrop-blur border rounded-2xl p-8 text-left transition-all duration-300 hover:scale-[1.02] ${
              hoveredTheme === 'fabos'
                ? 'border-orange-500/50 bg-white/10 shadow-xl shadow-orange-500/10'
                : 'border-orange-500/30 hover:border-orange-500/50'
            }`}
          >
            <div className="absolute top-4 right-4 px-3 py-1 bg-orange-500/20 rounded-full text-orange-400 text-xs font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
              Uusi
            </div>

            {/* Preview */}
            <div className="bg-[#F7F7F7] rounded-xl p-4 mb-6 h-40 flex items-center justify-center overflow-hidden">
              <div className="text-center">
                {/* FabOS logo */}
                <div className="flex items-center justify-center mb-3">
                  <span className="text-2xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Fab</span>
                  <span className="text-2xl font-bold text-[#FF6B35]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>OS</span>
                </div>
                <div className="text-xs text-gray-500 mb-3">Käyttöjärjestelmä valmistukselle</div>
                <div className="flex gap-2 justify-center">
                  <div className="w-6 h-6 rounded-lg bg-[#1A1A2E]"></div>
                  <div className="w-6 h-6 rounded-lg bg-[#FF6B35]"></div>
                  <div className="w-6 h-6 rounded-lg bg-[#4ECDC4]"></div>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-white mb-2">
              FabOS <span className="text-orange-400">Beta</span>
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Uusi moderni ilme. Vaalea, selkeä, ammattimainen.
            </p>

            <div className="flex items-center gap-2 text-orange-400 font-medium group-hover:text-orange-300 transition-colors">
              Kokeile uutta
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

        </div>

        {/* Info */}
        <p className="text-center text-gray-500 text-sm mt-8">
          Valintasi tallennetaan selaimeen. Voit vaihtaa teemaa milloin tahansa yläpalkista.
        </p>

        {/* URL param hint */}
        <div className="text-center mt-4">
          <p className="text-gray-600 text-xs">
            Suora linkki:{' '}
            <code className="bg-gray-800 px-2 py-1 rounded text-gray-400">?theme=fabos</code>
            {' '}tai{' '}
            <code className="bg-gray-800 px-2 py-1 rounded text-gray-400">?theme=legacy</code>
          </p>
        </div>
      </div>
    </div>
  );
}
