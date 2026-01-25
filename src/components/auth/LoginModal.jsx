// ============================================================================
// LOGIN MODAL - Sähköposti + salasana tai Magic Link kirjautuminen
// ============================================================================
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, THEMES } from '../../contexts/ThemeContext';

export default function LoginModal() {
  const {
    showLoginModal,
    closeLoginModal,
    signInWithMagicLink,
    signInWithPassword,
    signUp,
    isDemo
  } = useAuth();
  const { theme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('password'); // 'password', 'magiclink', 'signup'
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const isLegacy = theme === THEMES.LEGACY;

  if (!showLoginModal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setErrorMessage('Syötä sähköpostiosoite');
      setStatus('error');
      return;
    }

    // Validoi sähköposti
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Tarkista sähköpostiosoite');
      setStatus('error');
      return;
    }

    if ((mode === 'password' || mode === 'signup') && !password.trim()) {
      setErrorMessage('Syötä salasana');
      setStatus('error');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setErrorMessage('Salasanan tulee olla vähintään 6 merkkiä');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    let result;

    if (mode === 'magiclink') {
      result = await signInWithMagicLink(email);
      if (!result.error) {
        setStatus('success');
        return;
      }
    } else if (mode === 'signup') {
      result = await signUp(email, password);
      if (!result.error) {
        setStatus('signup_success');
        return;
      }
    } else {
      result = await signInWithPassword(email, password);
      if (!result.error) {
        // Kirjautuminen onnistui, sulje modal
        handleClose();
        return;
      }
    }

    if (result.error) {
      // Käännä yleisimmät virheviestit suomeksi
      let msg = result.error.message;
      if (msg.includes('Invalid login credentials')) {
        msg = 'Virheellinen sähköposti tai salasana';
      } else if (msg.includes('Email not confirmed')) {
        msg = 'Sähköpostia ei ole vahvistettu. Tarkista sähköpostisi.';
      } else if (msg.includes('User already registered')) {
        msg = 'Tällä sähköpostilla on jo tili. Kirjaudu sisään.';
      } else if (msg.includes('rate limit')) {
        msg = 'Liian monta yritystä. Odota hetki ja yritä uudelleen.';
      }
      setErrorMessage(msg);
      setStatus('error');
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setStatus('idle');
    setErrorMessage('');
    setMode('password');
    closeLoginModal();
  };

  // Tyylit teeman mukaan
  const styles = isLegacy ? {
    overlay: 'bg-black/70 backdrop-blur-sm',
    modal: 'bg-slate-900 border border-slate-700',
    title: 'text-white',
    text: 'text-slate-400',
    input: 'bg-slate-800 border-slate-600 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-cyan-500',
    button: 'bg-cyan-500 hover:bg-cyan-600 text-white',
    buttonSecondary: 'bg-slate-700 hover:bg-slate-600 text-slate-300',
    buttonDisabled: 'bg-slate-700 text-slate-500',
    closeBtn: 'text-slate-400 hover:text-white',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    demo: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    tab: 'text-slate-400 hover:text-white',
    tabActive: 'text-cyan-400 border-b-2 border-cyan-400',
    link: 'text-cyan-400 hover:text-cyan-300'
  } : {
    overlay: 'bg-black/50 backdrop-blur-sm',
    modal: 'bg-white border border-gray-200 shadow-xl',
    title: 'text-gray-900',
    text: 'text-gray-600',
    input: 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#FF6B35] focus:ring-[#FF6B35]',
    button: 'bg-[#FF6B35] hover:bg-[#e55a2b] text-white',
    buttonSecondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    buttonDisabled: 'bg-gray-200 text-gray-400',
    closeBtn: 'text-gray-400 hover:text-gray-600',
    success: 'bg-green-50 border-green-200 text-green-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    demo: 'bg-amber-50 border-amber-200 text-amber-700',
    tab: 'text-gray-500 hover:text-gray-700',
    tabActive: 'text-[#FF6B35] border-b-2 border-[#FF6B35]',
    link: 'text-[#FF6B35] hover:text-[#e55a2b]'
  };

  // Success -näkymät
  if (status === 'success') {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${styles.overlay}`}>
        <div className={`relative w-full max-w-md rounded-2xl p-8 ${styles.modal}`}>
          <div className={`p-4 rounded-lg border ${styles.success}`}>
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium">Linkki lähetetty!</p>
                <p className="text-sm mt-1 opacity-80">
                  Tarkista sähköpostisi <strong>{email}</strong> ja klikkaa kirjautumislinkkiä.
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className={`mt-4 w-full py-2 px-4 rounded-lg font-medium transition-colors ${styles.button}`}
            >
              Sulje
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'signup_success') {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${styles.overlay}`}>
        <div className={`relative w-full max-w-md rounded-2xl p-8 ${styles.modal}`}>
          <div className={`p-4 rounded-lg border ${styles.success}`}>
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium">Tili luotu!</p>
                <p className="text-sm mt-1 opacity-80">
                  Vahvista sähköpostiosoitteesi klikkaamalla linkkiä, jonka lähetimme osoitteeseen <strong>{email}</strong>.
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className={`mt-4 w-full py-2 px-4 rounded-lg font-medium transition-colors ${styles.button}`}
            >
              Sulje
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${styles.overlay}`}>
      <div
        className={`relative w-full max-w-md rounded-2xl p-8 ${styles.modal}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sulje-nappi */}
        <button
          onClick={handleClose}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${styles.closeBtn}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Otsikko */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className={`text-2xl font-bold ${styles.title}`}>
            {mode === 'signup' ? 'Luo tili' : 'Kirjaudu FabOS:iin'}
          </h2>
        </div>

        {/* Demo-varoitus */}
        {isDemo && (
          <div className={`mb-4 p-3 rounded-lg border ${styles.demo}`}>
            <p className="text-sm">
              <strong>Demo-tila:</strong> Supabase ei ole konfiguroitu. Kirjautuminen ei toimi.
            </p>
          </div>
        )}

        {/* Kirjautumistavan valinta */}
        {mode !== 'signup' && (
          <div className="flex border-b mb-6">
            <button
              type="button"
              onClick={() => { setMode('password'); setStatus('idle'); setErrorMessage(''); }}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                mode === 'password' ? styles.tabActive : styles.tab
              }`}
            >
              Salasana
            </button>
            <button
              type="button"
              onClick={() => { setMode('magiclink'); setStatus('idle'); setErrorMessage(''); }}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                mode === 'magiclink' ? styles.tabActive : styles.tab
              }`}
            >
              Magic Link
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sähköposti-kenttä */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${styles.text}`}>
              Sähköposti
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === 'error') {
                  setStatus('idle');
                  setErrorMessage('');
                }
              }}
              placeholder="nimi@yritys.fi"
              className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors ${styles.input}`}
              disabled={status === 'loading' || isDemo}
              autoFocus
            />
          </div>

          {/* Salasana-kenttä (vain password ja signup -modeissa) */}
          {(mode === 'password' || mode === 'signup') && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${styles.text}`}>
                Salasana
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (status === 'error') {
                    setStatus('idle');
                    setErrorMessage('');
                  }
                }}
                placeholder={mode === 'signup' ? 'Vähintään 6 merkkiä' : 'Salasana'}
                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors ${styles.input}`}
                disabled={status === 'loading' || isDemo}
              />
            </div>
          )}

          {/* Virheviesti */}
          {status === 'error' && (
            <div className={`p-3 rounded-lg border ${styles.error}`}>
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Lähetä-nappi */}
          <button
            type="submit"
            disabled={status === 'loading' || isDemo}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
              status === 'loading' || isDemo ? styles.buttonDisabled : styles.button
            }`}
          >
            {status === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {mode === 'magiclink' ? 'Lähetetään...' : 'Kirjaudutaan...'}
              </span>
            ) : mode === 'signup' ? (
              'Luo tili'
            ) : mode === 'magiclink' ? (
              'Lähetä kirjautumislinkki'
            ) : (
              'Kirjaudu sisään'
            )}
          </button>

          {/* Vaihda signup/login */}
          <div className={`text-center text-sm ${styles.text}`}>
            {mode === 'signup' ? (
              <>
                Onko sinulla jo tili?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('password'); setStatus('idle'); setErrorMessage(''); }}
                  className={`font-medium ${styles.link}`}
                >
                  Kirjaudu sisään
                </button>
              </>
            ) : (
              <>
                Eikö sinulla ole tiliä?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setStatus('idle'); setErrorMessage(''); }}
                  className={`font-medium ${styles.link}`}
                >
                  Luo tili
                </button>
              </>
            )}
          </div>

          {/* Info-teksti */}
          {mode === 'magiclink' && (
            <p className={`text-center text-sm ${styles.text}`}>
              Ei salasanaa tarvita! Kirjautumislinkki on voimassa 1 tunnin.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
