import React from 'react';

const AppV02 = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-900 to-amber-900 text-white font-sans flex items-center justify-center">
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

        {/* Icon */}
        <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-amber-400 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/30 animate-float">
          <span className="text-6xl">🏆</span>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold cinzel mb-4">
          <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent">
            Marskin Malja
          </span>
        </h1>
        <h2 className="text-2xl text-amber-300/80 mb-8">Versio 0.2</h2>

        {/* Description */}
        <div className="max-w-2xl mx-auto bg-black/30 rounded-2xl p-8 border border-amber-500/30">
          <p className="text-xl text-amber-100 mb-6">
            Tämä versio on kehityksessä.
          </p>
          <div className="space-y-4 text-left">
            <h3 className="text-lg font-semibold text-amber-300">Suunnitellut ominaisuudet:</h3>
            <ul className="space-y-2 text-amber-100/80">
              <li className="flex items-center gap-3">
                <span className="text-amber-400">⏳</span>
                Parannettu materiaalivalikko
              </li>
              <li className="flex items-center gap-3">
                <span className="text-amber-400">⏳</span>
                3D-esikatselu
              </li>
              <li className="flex items-center gap-3">
                <span className="text-amber-400">⏳</span>
                DXF-tuonti
              </li>
              <li className="flex items-center gap-3">
                <span className="text-amber-400">⏳</span>
                Projektien tallennus
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-amber-400/60 text-sm">
          Kehitys käynnissä - Tulossa pian!
        </p>
      </div>
    </div>
  );
};

export default AppV02;
