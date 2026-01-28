import React from 'react';
import { useTheme, THEMES } from '../contexts/ThemeContext';
import { ProfileDropdown } from './auth';

/**
 * ModuleShell — shared wrapper for all FabOS modules.
 * Renders a consistent sticky header with module name, version badge,
 * and optional version system controls. All module content goes in {children}.
 *
 * Header contains ONLY: Takaisin, FabOS logo, badge, module name, version info/buttons.
 * Module-specific controls (tabs, cart, toolbar) belong in children.
 */
export default function ModuleShell({
  onBack,
  moduleName,
  badgeVersion,
  badgeColor,
  sticky = true,
  layout = 'scroll',
  versionSystem = null,
  legacyIcon = null,
  legacySubtitle = null,
  children
}) {
  const { theme } = useTheme();
  const isFabOS = theme === THEMES.FABOS;
  const stickyClass = sticky ? 'sticky top-0 z-50' : '';

  const layoutClass = layout === 'fill'
    ? (isFabOS ? 'flex flex-col h-screen bg-[#F7F7F7] text-gray-900' : 'flex flex-col h-screen bg-slate-900 text-white')
    : (isFabOS ? 'min-h-screen bg-[#F7F7F7] text-gray-900' : 'min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white');

  return (
    <div className={layoutClass}>
      <header className={isFabOS
        ? `bg-[#1A1A2E] border-b border-gray-700 px-4 py-3 ${stickyClass}`
        : `bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 px-4 py-3 ${stickyClass}`
      }>
        <div className="flex items-center justify-between">
          {/* Left side: Back + Logo + Badge + Name */}
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className={isFabOS
                ? "flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                : "flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              }
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Takaisin</span>
            </button>

            <div className={isFabOS ? "w-px h-6 bg-gray-600" : "w-px h-6 bg-slate-700"} />

            {isFabOS ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <span className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Fab</span>
                  <span className="text-xl font-bold text-[#FF6B35]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>OS</span>
                </div>
                <span
                  className="px-2 py-1 text-xs font-bold rounded"
                  style={{ backgroundColor: `${badgeColor}33`, color: badgeColor }}
                >
                  {badgeVersion}
                </span>
                <span className="text-white font-medium" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {moduleName}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {legacyIcon}
                <div>
                  <h1 className="text-xl font-bold text-white">{badgeVersion} {moduleName}</h1>
                  {legacySubtitle && <p className="text-sm text-slate-400">{legacySubtitle}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Right side: Version system (optional) + ProfileDropdown */}
          <div className="flex items-center gap-4">
            {versionSystem && (
              <>
                <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  isFabOS ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-800/50 text-slate-400'
                }`}>
                  <span className="opacity-60">Versio:</span>{' '}
                  <span className="font-semibold">{versionSystem.currentVersionName}</span>
                  {versionSystem.currentVersionNumber && (
                    <span className="ml-1 opacity-60 font-mono">{versionSystem.currentVersionNumber}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={versionSystem.onOpenVersionGallery}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      isFabOS
                        ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30'
                        : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30'
                    }`}
                    title="Selaa kaikkia versioita"
                  >
                    <span>📚</span>
                    <span className="hidden sm:inline">Versiot</span>
                  </button>
                  <button
                    onClick={versionSystem.onOpenDevelopmentMode}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      isFabOS
                        ? 'bg-gradient-to-r from-[#FF6B35] to-amber-500 text-white hover:opacity-90'
                        : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90'
                    }`}
                    title="Avaa AI-kehitystila esikatselulla"
                  >
                    <span>🤖</span>
                    <span className="hidden sm:inline">Tee uusi kehitysversio</span>
                  </button>
                </div>
              </>
            )}
            <ProfileDropdown />
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
