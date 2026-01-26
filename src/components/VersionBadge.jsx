// ============================================================================
// VERSION BADGE - Näyttää sovelluksen version
// ============================================================================
import React from 'react';
import { useTheme, THEMES } from '../contexts/ThemeContext';

// Sovelluksen versio - tulee package.json:sta Viten kautta
const APP_VERSION = __APP_VERSION__ || '0.12.0';

/**
 * Pieni badge joka näyttää sovelluksen version
 * @param {string} position - 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
 * @param {boolean} fixed - Onko badge fixed position (default: true)
 */
export default function VersionBadge({ position = 'bottom-left', fixed = true }) {
  const { theme } = useTheme();
  const isLegacy = theme === THEMES.LEGACY;

  const positionClasses = {
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2'
  };

  const baseClasses = fixed ? 'fixed z-50' : 'absolute z-10';

  return (
    <div
      className={`
        ${baseClasses}
        ${positionClasses[position] || positionClasses['bottom-left']}
        px-2 py-1 rounded text-xs font-mono
        ${isLegacy
          ? 'bg-slate-800/80 text-slate-500 border border-slate-700'
          : 'bg-gray-100/80 text-gray-400 border border-gray-200'
        }
        backdrop-blur-sm
        select-none pointer-events-none
      `}
    >
      v{APP_VERSION}
    </div>
  );
}

// Export version for use elsewhere
export { APP_VERSION };
