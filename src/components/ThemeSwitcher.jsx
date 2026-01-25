import React, { useState } from 'react';
import { useTheme, THEMES } from '../contexts/ThemeContext';

export default function ThemeSwitcher({ variant = 'default' }) {
  const { theme, selectTheme, clearTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const isLegacy = theme === THEMES.LEGACY;

  // Different styles for light vs dark backgrounds
  const isDark = variant === 'dark' || isLegacy;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          isDark
            ? isLegacy
              ? 'bg-slate-700/50 text-cyan-400 hover:bg-slate-700 border border-slate-600'
              : 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border border-orange-500/30'
            : isLegacy
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20'
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${isLegacy ? 'bg-cyan-400' : 'bg-orange-500'}`}></span>
        {isLegacy ? 'Legacy' : 'FabOS'}
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Dropdown */}
          <div className={`absolute right-0 mt-2 w-64 rounded-xl shadow-xl border z-50 overflow-hidden ${
            isDark
              ? 'bg-slate-800 border-slate-700'
              : 'bg-white border-gray-100'
          }`}>
            <div className="p-2">
              <button
                onClick={() => { selectTheme(THEMES.LEGACY); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  isDark
                    ? isLegacy
                      ? 'bg-cyan-500/20 text-white'
                      : 'text-gray-300 hover:bg-slate-700'
                    : isLegacy
                      ? 'bg-cyan-50 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"></span>
                <div className="flex-1">
                  <div className="font-medium">Levyverkkokauppa</div>
                  <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Tumma, Vegas-efektit</div>
                </div>
                {isLegacy && (
                  <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => { selectTheme(THEMES.FABOS); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  isDark
                    ? !isLegacy
                      ? 'bg-orange-500/20 text-white'
                      : 'text-gray-300 hover:bg-slate-700'
                    : !isLegacy
                      ? 'bg-orange-50 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-orange-600"></span>
                <div className="flex-1">
                  <div className="font-medium">FabOS <span className="text-orange-500 text-xs">Beta</span></div>
                  <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Vaalea, moderni</div>
                </div>
                {!isLegacy && (
                  <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>

            <div className={`border-t p-3 ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-gray-100 bg-gray-50'}`}>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Auta meitä kehittämään palvelua valitsemalla suosikkisi!
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
