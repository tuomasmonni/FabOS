// ============================================================================
// PROFILE DROPDOWN - Käyttäjävalikko headerissa
// ============================================================================
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, THEMES } from '../../contexts/ThemeContext';

export default function ProfileDropdown() {
  const { user, profile, signOut, openLoginModal, isAuthenticated, isDemo } = useAuth();
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const dropdownRef = useRef(null);

  // Näytä ilmoitus
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const isLegacy = theme === THEMES.LEGACY;

  // Sulje dropdown kun klikataan muualle
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tyylit teeman mukaan
  const styles = isLegacy ? {
    button: 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white',
    loginButton: 'bg-cyan-500 hover:bg-cyan-600 text-white',
    dropdown: 'bg-slate-800 border border-slate-700 shadow-xl',
    item: 'text-slate-300 hover:bg-slate-700 hover:text-white',
    divider: 'border-slate-700',
    email: 'text-slate-500',
    nickname: 'text-white',
    demoTag: 'bg-amber-500/20 text-amber-400'
  } : {
    button: 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 shadow-sm',
    loginButton: 'bg-[#FF6B35] hover:bg-[#e55a2b] text-white',
    dropdown: 'bg-white border border-gray-200 shadow-xl',
    item: 'text-gray-700 hover:bg-gray-50',
    divider: 'border-gray-200',
    email: 'text-gray-500',
    nickname: 'text-gray-900',
    demoTag: 'bg-amber-100 text-amber-700'
  };

  // Demo-tila näyttö
  if (isDemo) {
    return (
      <button
        onClick={openLoginModal}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 ${styles.demoTag}`}
      >
        <span>Demo</span>
      </button>
    );
  }

  // Ei kirjautunut
  if (!isAuthenticated) {
    return (
      <button
        onClick={openLoginModal}
        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${styles.loginButton}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Kirjaudu
      </button>
    );
  }

  // Kirjautunut käyttäjä
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profiilinappi */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${styles.button}`}
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
          {profile?.nickname?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
        </div>

        {/* Nimimerkki */}
        <span className={`hidden sm:inline ${styles.nickname}`}>
          {profile?.nickname || 'Profiili'}
        </span>

        {/* Nuoli */}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown-valikko */}
      {isOpen && (
        <div className={`absolute right-0 mt-2 w-56 rounded-xl overflow-hidden z-50 ${styles.dropdown}`}>
          {/* Käyttäjätiedot */}
          <div className={`px-4 py-3 border-b ${styles.divider}`}>
            <p className={`font-medium ${styles.nickname}`}>
              {profile?.nickname || 'Ei nimimerkkiä'}
            </p>
            <p className={`text-sm truncate ${styles.email}`}>
              {user?.email}
            </p>
          </div>

          {/* Valikkolinkit */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                showNotification('Profiilisivu tulossa pian!', 'info');
              }}
              className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors ${styles.item}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profiili
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                showNotification('Omat versiot -sivu tulossa pian!', 'info');
              }}
              className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors ${styles.item}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Omat versiot
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                showNotification('Luonnokset-sivu tulossa pian!', 'info');
              }}
              className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors ${styles.item}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Luonnokset
            </button>
          </div>

          {/* Kirjaudu ulos */}
          <div className={`py-1 border-t ${styles.divider}`}>
            <button
              onClick={async () => {
                setIsOpen(false);
                await signOut();
                showNotification('Kirjauduttu ulos', 'success');
              }}
              className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors ${styles.item}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Kirjaudu ulos
            </button>
          </div>
        </div>
      )}

      {/* Ilmoitus-toast */}
      {notification && (
        <div className={`fixed bottom-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-up ${
          notification.type === 'success'
            ? isLegacy ? 'bg-emerald-500/90 text-white' : 'bg-green-500 text-white'
            : isLegacy ? 'bg-slate-700 text-white' : 'bg-gray-800 text-white'
        }`}>
          {notification.type === 'success' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}
    </div>
  );
}
