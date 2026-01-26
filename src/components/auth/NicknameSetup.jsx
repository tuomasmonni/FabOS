// ============================================================================
// NICKNAME SETUP - Profiilin luonti uusille käyttäjille (multi-step wizard)
// ============================================================================
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, THEMES } from '../../contexts/ThemeContext';

// Maalista
const COUNTRIES = [
  { code: 'FI', name: 'Suomi' },
  { code: 'SE', name: 'Ruotsi' },
  { code: 'NO', name: 'Norja' },
  { code: 'DK', name: 'Tanska' },
  { code: 'EE', name: 'Viro' },
  { code: 'DE', name: 'Saksa' },
  { code: 'PL', name: 'Puola' },
  { code: 'GB', name: 'Iso-Britannia' },
  { code: 'US', name: 'Yhdysvallat' },
  { code: 'OTHER', name: 'Muu' }
];

// Ammattilista
const PROFESSIONS = [
  'Suunnittelija / Insinööri',
  'Tuotantopäällikkö',
  'Osto / Hankinta',
  'Toimitusjohtaja / Yrittäjä',
  'Myynti',
  'Projektipäällikkö',
  'Opiskelija',
  'Muu'
];

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

  // Multi-step state
  const [step, setStep] = useState(1); // 1: Basic info, 2: Nickname, 3: Professional info

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [country, setCountry] = useState('FI');
  const [profession, setProfession] = useState('');
  const [company, setCompany] = useState('');

  // Status
  const [nicknameStatus, setNicknameStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  const isLegacy = theme === THEMES.LEGACY;

  // Nimimerkin validointi ja saatavuuden tarkistus
  useEffect(() => {
    if (step !== 2 || !nickname.trim()) {
      setNicknameStatus('idle');
      return;
    }

    const nicknameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!nicknameRegex.test(nickname)) {
      setNicknameStatus('error');
      if (nickname.length < 3) {
        setErrorMessage('Vähintään 3 merkkiä');
      } else if (nickname.length > 20) {
        setErrorMessage('Enintään 20 merkkiä');
      } else {
        setErrorMessage('Vain kirjaimet, numerot, - ja _');
      }
      return;
    }

    if (debounceTimer) clearTimeout(debounceTimer);

    setNicknameStatus('checking');
    const timer = setTimeout(async () => {
      const available = await checkNicknameAvailable(nickname);
      setNicknameStatus(available ? 'available' : 'taken');
      if (!available) {
        setErrorMessage('Nimimerkki on jo käytössä');
      }
    }, 500);

    setDebounceTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [nickname, step]);

  if (!showNicknameModal) return null;

  const handleNext = () => {
    if (step === 1 && firstName.trim() && lastName.trim()) {
      setStep(2);
    } else if (step === 2 && nicknameStatus === 'available') {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step === 3) {
      if (!profession) {
        setErrorMessage('Valitse ammatti');
        return;
      }

      setIsLoading(true);
      const { error } = await createProfile(nickname, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        country,
        profession,
        company: company.trim() || null
      });

      if (error) {
        setErrorMessage(error.message);
      }
      setIsLoading(false);
    } else {
      handleNext();
    }
  };

  const handleCancel = async () => {
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
    buttonDisabled: 'bg-slate-700 text-slate-500 cursor-not-allowed',
    cancelBtn: 'text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700',
    backBtn: 'text-slate-400 hover:text-white',
    success: 'text-emerald-400',
    error: 'text-red-400',
    checking: 'text-amber-400',
    stepActive: 'bg-cyan-500 text-white',
    stepInactive: 'bg-slate-700 text-slate-400',
    stepComplete: 'bg-emerald-500 text-white',
    select: 'bg-slate-800 border-slate-600 text-white'
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
    buttonDisabled: 'bg-gray-200 text-gray-400 cursor-not-allowed',
    cancelBtn: 'text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200',
    backBtn: 'text-gray-400 hover:text-gray-600',
    success: 'text-green-600',
    error: 'text-red-600',
    checking: 'text-amber-600',
    stepActive: 'bg-[#FF6B35] text-white',
    stepInactive: 'bg-gray-200 text-gray-400',
    stepComplete: 'bg-green-500 text-white',
    select: 'bg-white border-gray-300 text-gray-900'
  };

  const getInputClass = (hasError = false, isSuccess = false) => {
    const base = `w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors ${styles.input}`;
    if (isSuccess) return `${base} ${styles.inputSuccess}`;
    if (hasError) return `${base} ${styles.inputError}`;
    return `${base} ${styles.inputFocus}`;
  };

  // Step indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            s < step ? styles.stepComplete : s === step ? styles.stepActive : styles.stepInactive
          }`}>
            {s < step ? '✓' : s}
          </div>
          {s < 3 && (
            <div className={`w-8 h-1 ${s < step ? 'bg-emerald-500' : isLegacy ? 'bg-slate-700' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${styles.overlay}`}>
      <div
        className={`relative w-full max-w-md rounded-2xl p-8 ${styles.modal}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step indicator */}
        <StepIndicator />

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <>
            <div className="text-center mb-6">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                isLegacy ? 'bg-gradient-to-br from-cyan-500 to-blue-600' : 'bg-gradient-to-br from-[#FF6B35] to-orange-500'
              }`}>
                <span className="text-3xl">👋</span>
              </div>
              <h2 className={`text-2xl font-bold ${styles.title}`}>Tervetuloa!</h2>
              <p className={`mt-2 ${styles.text}`}>
                Kertoisitko hieman itsestäsi?
              </p>
            </div>

            {user?.email && (
              <div className={`mb-4 p-3 rounded-lg ${isLegacy ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                <p className={`text-sm ${styles.text}`}>
                  Kirjautunut: <strong className={styles.title}>{user.email}</strong>
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${styles.text}`}>
                    Etunimi *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Matti"
                    className={getInputClass()}
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${styles.text}`}>
                    Sukunimi *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Meikäläinen"
                    className={getInputClass()}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${styles.text}`}>
                  Maa *
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={`${getInputClass()} ${styles.select}`}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${styles.cancelBtn}`}
                >
                  Peruuta
                </button>
                <button
                  type="submit"
                  disabled={!firstName.trim() || !lastName.trim()}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                    firstName.trim() && lastName.trim() ? styles.button : styles.buttonDisabled
                  }`}
                >
                  Seuraava →
                </button>
              </div>
            </form>
          </>
        )}

        {/* Step 2: Nickname */}
        {step === 2 && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h2 className={`text-2xl font-bold ${styles.title}`}>Valitse nimimerkki</h2>
              <p className={`mt-2 ${styles.text}`}>
                Hei {firstName}! Tällä nimellä näyt muille käyttäjille.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${styles.text}`}>
                  Nimimerkki *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value.toLowerCase())}
                    placeholder="esim. matti42"
                    className={getInputClass(
                      nicknameStatus === 'error' || nicknameStatus === 'taken',
                      nicknameStatus === 'available'
                    )}
                    autoFocus
                    maxLength={20}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {nicknameStatus === 'checking' && (
                      <svg className={`w-5 h-5 animate-spin ${styles.checking}`} fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {nicknameStatus === 'available' && (
                      <svg className={`w-5 h-5 ${styles.success}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {(nicknameStatus === 'taken' || nicknameStatus === 'error') && (
                      <svg className={`w-5 h-5 ${styles.error}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="mt-2 min-h-[20px]">
                  {nicknameStatus === 'available' && (
                    <p className={`text-sm ${styles.success}`}>✓ Nimimerkki on vapaa!</p>
                  )}
                  {(nicknameStatus === 'error' || nicknameStatus === 'taken') && (
                    <p className={`text-sm ${styles.error}`}>{errorMessage}</p>
                  )}
                  {nicknameStatus === 'checking' && (
                    <p className={`text-sm ${styles.checking}`}>Tarkistetaan...</p>
                  )}
                </div>
              </div>

              <div className={`text-xs ${styles.text} space-y-1`}>
                <p>Nimimerkin säännöt:</p>
                <ul className="list-disc list-inside ml-2">
                  <li>3-20 merkkiä</li>
                  <li>Vain pienet kirjaimet (a-z), numerot, - ja _</li>
                  <li>Nimimerkkiä ei voi muuttaa myöhemmin</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className={`py-3 px-4 rounded-lg font-medium transition-colors ${styles.cancelBtn}`}
                >
                  ← Takaisin
                </button>
                <button
                  type="submit"
                  disabled={nicknameStatus !== 'available'}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                    nicknameStatus === 'available' ? styles.button : styles.buttonDisabled
                  }`}
                >
                  Seuraava →
                </button>
              </div>
            </form>
          </>
        )}

        {/* Step 3: Professional Info */}
        {step === 3 && (
          <>
            <div className="text-center mb-6">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                isLegacy ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
              }`}>
                <span className="text-3xl">💼</span>
              </div>
              <h2 className={`text-2xl font-bold ${styles.title}`}>Ammattitiedot</h2>
              <p className={`mt-2 ${styles.text}`}>
                Kerro vielä ammattitaustastasi, niin voimme palvella sinua paremmin.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${styles.text}`}>
                  Ammatti *
                </label>
                <select
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className={`${getInputClass(!profession && errorMessage)} ${styles.select}`}
                  required
                >
                  <option value="">Valitse ammatti...</option>
                  {PROFESSIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${styles.text}`}>
                  Yritys <span className={styles.text}>(valinnainen)</span>
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Yrityksen nimi"
                  className={getInputClass()}
                />
              </div>

              {/* Yhteenveto */}
              <div className={`p-4 rounded-xl ${isLegacy ? 'bg-slate-800/50 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                <h4 className={`text-sm font-semibold mb-2 ${styles.title}`}>Profiilisi:</h4>
                <div className={`text-sm space-y-1 ${styles.text}`}>
                  <p><strong>Nimi:</strong> {firstName} {lastName}</p>
                  <p><strong>Nimimerkki:</strong> @{nickname}</p>
                  <p><strong>Maa:</strong> {COUNTRIES.find(c => c.code === country)?.name}</p>
                  {profession && <p><strong>Ammatti:</strong> {profession}</p>}
                  {company && <p><strong>Yritys:</strong> {company}</p>}
                </div>
              </div>

              {errorMessage && step === 3 && (
                <p className={`text-sm ${styles.error}`}>{errorMessage}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className={`py-3 px-4 rounded-lg font-medium transition-colors ${styles.cancelBtn}`}
                >
                  ← Takaisin
                </button>
                <button
                  type="submit"
                  disabled={!profession || isLoading}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                    profession && !isLoading ? styles.button : styles.buttonDisabled
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Luodaan...
                    </span>
                  ) : (
                    '✓ Luo profiili'
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
