import React, { useState, useEffect } from 'react';
import ThemeSwitcher from './components/ThemeSwitcher';
import { ProfileDropdown } from './components/auth';

// Sovelluksen versio - tulee package.json:sta Viten kautta
const APP_VERSION = __APP_VERSION__ || '0.12.0';

const publicVersions = [
  {
    id: 'v01',
    name: 'V0.1',
    subtitle: 'Laserleikkeet',
    description: 'Toimiva prototyyppi - Teräslevyjen laserleikkaus verkossa',
    color: 'amber',
    icon: '✂️',
    live: true
  },
  {
    id: 'v02',
    name: 'V0.2',
    subtitle: 'Laserleikkeet & Särmäykset',
    description: 'Laserleikkaus + särmäys yhdessä tilauksessa',
    color: 'blue',
    icon: '📐',
    comingSoon: true,
    features: ['Leikkaus + taivutus samassa', 'Yhdistetty hinnoittelu', '3D-esikatselu']
  },
  {
    id: 'v03',
    name: 'V0.3',
    subtitle: 'Putken Taivutukset',
    description: 'Standardoitu putken taivutus, 3D-mallit, parametrisoitu hinnoittelu',
    color: 'emerald',
    icon: '🔧',
    beta: true
  },
  {
    id: 'v04',
    name: 'V0.4',
    subtitle: 'Ritiläkonfiguraattori',
    description: 'Puristehitsatut ritilät ja porrasaskelmat, vakio tai räätälöity',
    color: 'red',
    icon: '🔲',
    beta: true
  },
  {
    id: 'v04',
    name: 'V0.4',
    subtitle: 'Palkkien Poraukset',
    description: 'Sivupalkkien poraus, tekoäly-analyysi, piirustuksista hintoihin',
    color: 'violet',
    icon: '🏗️',
    comingSoon: true,
    features: ['Lataa DXF/DWG → hinta sekunnissa', 'AI tunnistaa poraukset', 'Suora tilaus tuotantoon']
  },
  {
    id: 'v05',
    name: 'V0.5',
    subtitle: 'Kokoonpano: Poraus + Taivutus',
    description: 'AI suunnittelee kokoonpanon, poraus ja taivutus yhdessä',
    color: 'pink',
    icon: '🤖',
    comingSoon: true,
    features: ['Automaattinen kokoonpanosuunnittelu', 'Poraus + taivutus integroitu', 'Optimoitu valmistusjärjestys']
  },
  {
    id: 'v06',
    name: 'V0.6',
    subtitle: 'Porras Konfiguraattori',
    description: 'Parametrinen porrassuunnittelu, IFC-vienti, 3D-esikatselu',
    color: 'emerald',
    icon: '🪜',
    beta: true
  },
  {
    id: 'v07',
    name: 'V0.7',
    subtitle: 'Ehdota Ominaisuutta',
    description: 'Kerro mitä tarvitset ja muokkaa tulevaisuutta',
    color: 'purple',
    icon: '💡',
    featureSuggestion: true
  },
  {
    id: 'v08',
    name: 'V0.8',
    subtitle: 'Projektinhallinta',
    description: 'Monday.com-tyylinen projektinhallinta tuotannon tehtäville',
    color: 'violet',
    icon: '📋',
    beta: true
  },
  {
    id: 'mastermind',
    name: 'MasterMind',
    subtitle: 'Board-hallinta',
    description: 'Luo omia boardeja, ryhmiä ja tehtäviä - täysin erillinen järjestelmä',
    color: 'purple',
    icon: '🧠',
    beta: true
  }
];

const colorClasses = {
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', accent: 'bg-amber-500' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', accent: 'bg-blue-500' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', accent: 'bg-emerald-500' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', accent: 'bg-red-500' },
  violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-600', accent: 'bg-violet-500' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600', accent: 'bg-pink-500' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', accent: 'bg-purple-500' },
};

const FabOSVersionSelector = ({ onSelect }) => {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [hoveredVersion, setHoveredVersion] = useState(null);
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlVersion = urlParams.get('version');
    const storedVersion = localStorage.getItem('fabos-version');

    if (urlVersion && publicVersions.find(v => v.id === urlVersion)) {
      handleSelect(urlVersion);
    } else if (storedVersion && publicVersions.find(v => v.id === storedVersion)) {
      setSelectedVersion(storedVersion);
    }
  }, []);

  const handleSelect = (versionId) => {
    const version = publicVersions.find(v => v.id === versionId);
    if (version?.comingSoon) return;

    setSelectedVersion(versionId);
    localStorage.setItem('fabos-version', versionId);

    const url = new URL(window.location);
    url.searchParams.set('version', versionId);
    window.history.pushState({}, '', url);

    setShowAnimation(false);
    setTimeout(() => {
      onSelect(versionId);
    }, 300);
  };

  return (
    <div className={`min-h-screen bg-[#F7F7F7] transition-opacity duration-300 ${showAnimation ? 'opacity-100' : 'opacity-0'}`}>
      {/* Navigation */}
      <nav className="bg-[#1A1A2E] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Fab</span>
              <span className="text-2xl font-bold text-[#FF6B35]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>OS</span>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <ThemeSwitcher variant="dark" />
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Käyttöjärjestelmä valmistukselle
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Lataa suunnitelmasi, näe hinta heti. Valitse testattava moduuli.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 bg-[#FF6B35]/10 border border-[#FF6B35]/30 rounded-full px-4 py-2">
            <span className="w-2 h-2 bg-[#FF6B35] rounded-full animate-pulse"></span>
            <span className="text-[#FF6B35] text-sm font-medium">Testiympäristö</span>
          </div>
        </div>

        {/* Module cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {publicVersions.map((version) => {
            const colors = colorClasses[version.color] || colorClasses.blue;
            const isActive = version.live || version.beta || version.featureSuggestion;

            return (
              <button
                key={version.id}
                onClick={() => handleSelect(version.id)}
                onMouseEnter={() => setHoveredVersion(version.id)}
                onMouseLeave={() => setHoveredVersion(null)}
                disabled={version.comingSoon}
                className={`
                  relative group p-6 rounded-2xl text-left transition-all duration-300
                  ${version.comingSoon
                    ? 'bg-white/50 border-2 border-gray-200 cursor-not-allowed opacity-60'
                    : isActive
                      ? `bg-white border-2 ${colors.border} shadow-md hover:shadow-xl hover:-translate-y-1`
                      : 'bg-white border-2 border-gray-100 hover:border-gray-200 hover:shadow-lg hover:-translate-y-0.5'
                  }
                `}
              >
                {/* Badges */}
                {version.comingSoon && (
                  <div className="absolute -top-3 -right-3 bg-gray-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Q2 2025
                  </div>
                )}
                {version.live && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-[#FF6B35] to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    LIVE
                  </div>
                )}
                {version.beta && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-[#4ECDC4] to-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    BETA
                  </div>
                )}
                {version.featureSuggestion && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    EHDOTA
                  </div>
                )}

                {/* Icon */}
                <div className={`
                  w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-4
                  ${isActive ? colors.bg : 'bg-gray-100'}
                  transition-transform duration-300
                  ${!version.comingSoon && hoveredVersion === version.id ? 'scale-110' : ''}
                `}>
                  {version.icon}
                </div>

                {/* Version info */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${isActive ? colors.bg + ' ' + colors.text : 'bg-gray-100 text-gray-500'}`}>
                    {version.name}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-[#1A1A2E] mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {version.subtitle}
                </h3>

                <p className="text-gray-500 text-sm mb-4">
                  {version.description}
                </p>

                {/* Features for coming soon */}
                {version.comingSoon && version.features && (
                  <ul className="space-y-1 mb-4">
                    {version.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}

                {/* CTA */}
                {!version.comingSoon && (
                  <div className={`
                    flex items-center gap-2 text-sm font-medium
                    ${isActive ? colors.text : 'text-gray-400'}
                    group-hover:gap-3 transition-all
                  `}>
                    <span>{version.featureSuggestion ? 'Ehdota' : 'Avaa moduuli'}</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Stats section */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#FF6B35]/30"></div>
            <span className="text-[#FF6B35] text-sm font-medium tracking-wider">ROADMAP 2025</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#FF6B35]/30"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>€2.4M</div>
              <div className="text-gray-500 text-sm">Säästöpotentiaali / asiakas</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#4ECDC4]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>73%</div>
              <div className="text-gray-500 text-sm">Nopeampi tarjousprosessi</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#FF6B35]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>0</div>
              <div className="text-gray-500 text-sm">Manuaalista työtä</div>
            </div>
          </div>

          <p className="mt-6 text-gray-500 text-sm text-center">
            Tekoäly mullistaa terästeollisuuden. Ole mukana alusta asti.
          </p>
        </div>

        {/* Feature suggestion CTA */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-8 mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl shadow-lg">
                💡
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1A1A2E]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Ehdota uutta ominaisuutta
                </h3>
                <p className="text-gray-500 text-sm">
                  Kerro mitä tarvitset - rakennamme sen yhdessä
                </p>
              </div>
            </div>
            <a
              href="mailto:tuomas.monni@lkporras.fi?subject=FabOS%20ominaisuusehdotus"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Lähetä sähköpostia
            </a>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-gray-400 text-sm">
          <p>Valinta tallennetaan selaimeesi. Voit vaihtaa moduulia milloin tahansa.</p>
          <p className="mt-2">
            <span className="text-gray-500">Suora linkki:</span>{' '}
            <code className="bg-gray-200 px-2 py-1 rounded text-[#1A1A2E]">
              ?version=v01
            </code>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0F0F1A] py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Fab</span>
              <span className="text-2xl font-bold text-[#FF6B35]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>OS</span>
              <span className="text-gray-500 ml-4">v{APP_VERSION} • © 2026</span>
            </div>
            <div className="flex items-center gap-8 text-gray-400 text-sm">
              <a href="#" className="hover:text-white transition-colors">Käyttöehdot</a>
              <a href="#" className="hover:text-white transition-colors">Tietosuoja</a>
              <a href="#" className="hover:text-white transition-colors">Yhteystiedot</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FabOSVersionSelector;
