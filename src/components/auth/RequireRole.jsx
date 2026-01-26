// ============================================================================
// REQUIRE ROLE - Wrapper-komponentti roolipohjaista pääsynhallintaa varten
// ============================================================================
import React from 'react';
import { useAuth, ROLE_NAMES } from '../../contexts/AuthContext';
import { useTheme, THEMES } from '../../contexts/ThemeContext';

export default function RequireRole({
  minRole,           // Vaadittu vähimmäisrooli (esim. 'beta_tester')
  children,          // Sisältö joka näytetään jos oikeudet riittävät
  fallback = null,   // Vaihtoehtoinen sisältö jos oikeudet eivät riitä
  showMessage = true // Näytä "ei oikeuksia" -viesti jos ei fallbackia
}) {
  const { isAuthenticated, hasMinRole, openLoginModal } = useAuth();
  const { theme } = useTheme();
  const isLegacy = theme === THEMES.LEGACY;

  // Tarkista oikeudet
  const isAuthorized = hasMinRole(minRole);

  if (isAuthorized) {
    return children;
  }

  // Käytä annettua fallback-sisältöä
  if (fallback) {
    return fallback;
  }

  // Ei viestiä pyydetty
  if (!showMessage) {
    return null;
  }

  // Oletusviesti "ei oikeuksia"
  const requiredRoleName = ROLE_NAMES[minRole] || minRole;

  const styles = isLegacy ? {
    container: 'bg-slate-800 border border-slate-700',
    title: 'text-white',
    text: 'text-slate-400',
    button: 'bg-cyan-500 hover:bg-cyan-600 text-white'
  } : {
    container: 'bg-gray-50 border border-gray-200',
    title: 'text-gray-900',
    text: 'text-gray-600',
    button: 'bg-[#FF6B35] hover:bg-[#e55a2b] text-white'
  };

  return (
    <div className={`p-6 rounded-xl text-center ${styles.container}`}>
      <div className="text-4xl mb-4">🔒</div>
      <h3 className={`text-lg font-semibold mb-2 ${styles.title}`}>
        {isAuthenticated ? 'Ei oikeuksia' : 'Kirjautuminen vaaditaan'}
      </h3>
      <p className={`mb-4 ${styles.text}`}>
        {isAuthenticated
          ? `Tämä ominaisuus vaatii vähintään "${requiredRoleName}" -roolin.`
          : 'Kirjaudu sisään käyttääksesi tätä ominaisuutta.'
        }
      </p>
      {!isAuthenticated && (
        <button
          onClick={openLoginModal}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${styles.button}`}
        >
          Kirjaudu sisään
        </button>
      )}
    </div>
  );
}
