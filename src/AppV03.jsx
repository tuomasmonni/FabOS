import React from 'react';

const AppV03 = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-fuchsia-900 to-purple-900 text-white font-sans flex items-center justify-center">
      <div className="text-center px-4">
        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Vaihda versiota
        </button>

        {/* Smoke animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute w-32 h-32 bg-purple-500/20 rounded-full blur-3xl animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 5}s`
              }}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="relative w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-purple-400 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/30 animate-float">
          <span className="text-6xl">🚬</span>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold cinzel mb-4">
          <span className="bg-gradient-to-r from-purple-300 via-pink-400 to-purple-300 bg-clip-text text-transparent">
            Pitkäsen Sikari
          </span>
        </h1>
        <h2 className="text-2xl text-purple-300/80 mb-8">Versio 0.3 - Kokeellinen</h2>

        {/* Description */}
        <div className="max-w-2xl mx-auto bg-black/30 rounded-2xl p-8 border border-purple-500/30">
          <p className="text-xl text-purple-100 mb-6">
            Kokeellinen versio hulluille ideoille.
          </p>
          <div className="space-y-4 text-left">
            <h3 className="text-lg font-semibold text-purple-300">Villien ideoiden laboratorio:</h3>
            <ul className="space-y-2 text-purple-100/80">
              <li className="flex items-center gap-3">
                <span className="text-purple-400">🧪</span>
                AI-pohjainen muotojen generointi
              </li>
              <li className="flex items-center gap-3">
                <span className="text-purple-400">🧪</span>
                Ääniohjauksella piirtäminen
              </li>
              <li className="flex items-center gap-3">
                <span className="text-purple-400">🧪</span>
                VR-tuki
              </li>
              <li className="flex items-center gap-3">
                <span className="text-purple-400">🧪</span>
                Parametriset mallit
              </li>
            </ul>
          </div>
        </div>

        {/* Warning */}
        <div className="mt-8 inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-full px-4 py-2">
          <span className="text-purple-400">⚗️</span>
          <span className="text-purple-300 text-sm">Tämä versio voi räjähtää milloin tahansa!</span>
        </div>
      </div>
    </div>
  );
};

export default AppV03;
