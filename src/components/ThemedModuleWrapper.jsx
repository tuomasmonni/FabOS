import React from 'react';
import { useTheme, THEMES } from '../contexts/ThemeContext';
import ThemeSwitcher from './ThemeSwitcher';

/**
 * Wrapper component that provides themed styling for modules
 * based on the selected theme (legacy vs FabOS)
 */
export default function ThemedModuleWrapper({ children, onBack, title, subtitle, version }) {
  const { theme } = useTheme();
  const isFabOS = theme === THEMES.FABOS;

  if (isFabOS) {
    return (
      <div className="min-h-screen bg-[#F7F7F7]">
        {/* FabOS Navigation */}
        <nav className="bg-[#1A1A2E] sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left: Back + Logo */}
              <div className="flex items-center gap-4">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="text-sm">Takaisin</span>
                  </button>
                )}
                <div className="flex items-center">
                  <span className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Fab</span>
                  <span className="text-xl font-bold text-[#FF6B35]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>OS</span>
                </div>
              </div>

              {/* Center: Module info */}
              <div className="hidden md:flex items-center gap-3">
                {version && (
                  <span className="px-2 py-1 bg-[#FF6B35]/20 text-[#FF6B35] text-xs font-bold rounded">
                    {version}
                  </span>
                )}
                {title && (
                  <span className="text-white font-medium" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {title}
                  </span>
                )}
                {subtitle && (
                  <span className="text-gray-400 text-sm">
                    {subtitle}
                  </span>
                )}
              </div>

              {/* Right: Theme switcher */}
              <div className="flex items-center gap-4">
                <ThemeSwitcher variant="dark" />
              </div>
            </div>
          </div>
        </nav>

        {/* Module content */}
        <main className="fabos-module">
          {children}
        </main>

        {/* FabOS Footer */}
        <footer className="bg-[#0F0F1A] py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Fab</span>
                <span className="text-lg font-bold text-[#FF6B35]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>OS</span>
                <span className="text-gray-500 ml-4 text-sm">© 2026</span>
              </div>
              <div className="flex items-center gap-6 text-gray-400 text-sm">
                <a href="#" className="hover:text-white transition-colors">Käyttöehdot</a>
                <a href="#" className="hover:text-white transition-colors">Tietosuoja</a>
                <a href="#" className="hover:text-white transition-colors">Yhteystiedot</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Legacy theme - return children as-is (they handle their own styling)
  return <>{children}</>;
}

/**
 * FabOS styled card component
 */
export function FabOSCard({ children, className = '', hover = true }) {
  return (
    <div className={`
      bg-white rounded-2xl shadow-md border border-gray-100 p-6
      ${hover ? 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}

/**
 * FabOS primary button
 */
export function FabOSButton({ children, onClick, className = '', variant = 'primary' }) {
  const baseClasses = 'px-6 py-3 rounded-xl font-semibold transition-all';

  const variants = {
    primary: 'bg-gradient-to-r from-[#FF6B35] to-orange-500 text-white hover:shadow-lg hover:shadow-[#FF6B35]/30 hover:-translate-y-0.5',
    secondary: 'bg-[#1A1A2E] text-white hover:bg-[#1A1A2E]/90',
    tertiary: 'border-2 border-[#1A1A2E] text-[#1A1A2E] hover:bg-[#1A1A2E] hover:text-white',
    ghost: 'text-[#FF6B35] hover:bg-[#FF6B35]/10'
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * FabOS price display
 */
export function FabOSPrice({ amount, label, size = 'lg' }) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  };

  return (
    <div className="flex justify-between items-center py-4 bg-gray-50 rounded-xl px-4">
      <span className="font-semibold text-[#1A1A2E]">{label}</span>
      <span className={`font-mono ${sizeClasses[size]} font-bold text-[#FF6B35]`}>
        {typeof amount === 'number' ? `${amount.toFixed(2)} €` : amount}
      </span>
    </div>
  );
}

/**
 * FabOS section header
 */
export function FabOSSectionHeader({ title, subtitle, icon }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        {icon && <span className="text-2xl">{icon}</span>}
        <h2 className="text-2xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {title}
        </h2>
      </div>
      {subtitle && <p className="text-gray-500">{subtitle}</p>}
    </div>
  );
}
