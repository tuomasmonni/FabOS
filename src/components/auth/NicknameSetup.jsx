// ============================================================================
// NICKNAME SETUP - Nimimerkin asetus uusille käyttäjille
// ============================================================================
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, THEMES } from '../../contexts/ThemeContext';

export default function NicknameSetup() {
  const {
    showNicknameModal,
    closeNicknameModal,
    createProfile,
    checkNicknameAvailable,
    user,
    signOut
  } = useAuth();
  const { theme } = useTheme();

  const [nickname, setNickname] = useState('');
  const [status, setStatus] = useState('idle'); // idle, checking, available, taken, loading, error
  const [errorMessage, setErrorMessage] = useState('');
  const [debounceTimer, setDebounceTimer] = useState(null);

  const isLegacy = theme === THEMES.LEGACY;

  // Nimimerkin validointi ja saatavuuden tarkistus
  useEffect(() => {
    if (!nickname.trim()) {
      setStatus('idle');
      return;
    }

    // Validoi nimimerkin muoto
    const nicknameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!nicknameRegex.test(nickname)) {
      setStatus('error');
      if (nickname.length < 3) {
        setErrorMessage('Vähintään 3 merkkiä');
      } else if (nickname.length > 20) {
        setErrorMessage('Enintään 20 merkkiä');
      } else {
        setErrorMessage('Vain kirjaimet, numerot, - ja _');
      }
      return;
    }

    // Debounce saatavuuden tarkistus
    if (debounceTimer) clearTimeout(debounceTimer);

    setStatus('checking');
    const timer = setTimeout(async () => {
      const available = await checkNicknameAvailable(nickname);
      setStatus(available ? 'available' : 'taken');
      if (!available) {
        setErrorMessage('Nimimerkki on jo käytössä');
      }
    }, 500);

    setDebounceTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [nickname]);

  if (!showNicknameModal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (status !== 'available') return;

    setStatus('loading');
    const { error } = await createProfile(nickname);

    if (error) {
      setStatus('error');
      setErrorMessage(error.message);
    }
  };

  const handleCancel = async () => {
    // Kirjaudu ulos jos käyttäjä peruuttaa
    await signOut();
    closeNicknameModal();
  };

  // Tyylit teeman mukaan
  const styles = isLegacy ? {
    overlay: 'bg-black/70 backdrop-blur-sm',
    modal: 'bg-slate-900 border border-slate-700',
    title: 'text-white',
    text: 'text-slate-400',
    input: 'bg-slate-800 border-slate-600 text-white placeholder-slate-500',
    inputFocus: 'focus:border-cyan-500 focus:ring-cyan-500',
    inputSuccess: 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500',
    inputError: 'border-red-500 focus:border-red-500 focus:ring-red-500',
    button: 'bg-cyan-500 hover:bg-cyan-600 text-white',
    buttonDisabled: 'bg-slate-700 text-slate-500',
    cancelBtn: 'text-slate-400 hover:text-white',
    success: 'text-emerald-400',
    error: 'text-red-400',
    checking: 'text-amber-400'
  } : {
    overlay: 'bg-black/50 backdrop-blur-sm',
    modal: 'bg-white border border-gray-200 shadow-xl',
    title: 'text-gray-900',
    text: 'text-gray-600',
    input: 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
    inputFocus: 'focus:border-[#FF6B35] focus:ring-[#FF6B35]',
    inputSuccess: 'border-green-500 focus:border-green-500 focus:ring-green-500',
    inputError: 'border-red-500 focus:border-red-500 focus:ring-red-500',
    button: 'bg-[#FF6B35] hover:bg-[#e55a2b] text-white',
    buttonDisabled: 'bg-gray-200 text-gray-400',
    cancelBtn: 'text-gray-400 hover:text-gray-600',
    success: 'text-green-600',
    error: 'text-red-600',
    checking: 'text-amber-600'
  };

  const getInputClass = () => {
    const base = `w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors ${styles.input}`;
    if (status === 'available') return `${base} ${styles.inputSuccess}`;
    if (status === 'error' || status === 'taken') return `${base} ${styles.inputError}`;
    return `${base} ${styles.inputFocus}`;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return (
          <svg className={`w-5 h-5 animate-spin ${styles.checking}`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        );
      case 'available':
        return (
          <svg className={`w-5 h-5 ${styles.success}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'taken':
      case 'error':
        return (
          <svg className={`w-5 h-5 ${styles.error}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${styles.overlay}`}>
      <div
        className={`relative w-full max-w-md rounded-2xl p-8 ${styles.modal}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Otsikko */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h2 className={`text-2xl font-bold ${styles.title}`}>Valitse nimimerkki</h2>
          <p className={`mt-2 ${styles.text}`}>
            Tervetuloa! Valitse itsellesi nimimerkki, jolla näyt muille käyttäjille.
          </p>
        </div>

        {/* Käyttäjän sähköposti */}
        {user?.email && (
          <div className={`mb-4 p-3 rounded-lg ${isLegacy ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
            <p className={`text-sm ${styles.text}`}>
              Kirjautunut: <strong className={styles.title}>{user.email}</strong>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nimimerkki-kenttä */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${styles.text}`}>
              Nimimerkki
            </label>
            <div className="relative">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value.toLowerCase())}
                placeholder="esim. koodari42"
                className={getInputClass()}
                disabled={status === 'loading'}
                autoFocus
                maxLength={20}
              />
              {/* Status-ikoni */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {getStatusIcon()}
              </div>
            </div>

            {/* Validointiviesti */}
            <div className="mt-2 min-h-[20px]">
              {status === 'available' && (
                <p className={`text-sm ${styles.success}`}>Nimimerkki on vapaa!</p>
              )}
              {(status === 'error' || status === 'taken') && (
                <p className={`text-sm ${styles.error}`}>{errorMessage}</p>
              )}
              {status === 'checking' && (
                <p className={`text-sm ${styles.checking}`}>Tarkistetaan...</p>
              )}
            </div>
          </div>

          {/* Säännöt */}
          <div className={`text-xs ${styles.text} space-y-1`}>
            <p>Nimimerkin säännöt:</p>
            <ul className="list-disc list-inside ml-2">
              <li>3-20 merkkiä</li>
              <li>Vain pienet kirjaimet (a-z), numerot, - ja _</li>
              <li>Nimimerkkiä ei voi muuttaa myöhemmin</li>
            </ul>
          </div>

          {/* Napit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${styles.cancelBtn} ${
                isLegacy ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Peruuta
            </button>
            <button
              type="submit"
              disabled={status !== 'available'}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                status === 'available' ? styles.button : styles.buttonDisabled
              }`}
            >
              {status === 'loading' ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Luodaan...
                </span>
              ) : (
                'Vahvista'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
