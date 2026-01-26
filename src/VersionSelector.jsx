import React, { useState, useEffect } from 'react';
import ThemeSwitcher from './components/ThemeSwitcher';

// Sovelluksen versio - tulee package.json:sta Viten kautta
const APP_VERSION = __APP_VERSION__ || '0.12.0';

const publicVersions = [
  {
    id: 'v01',
    name: 'V0.1',
    subtitle: 'Laserleikkeet',
    description: 'Toimiva prototyyppi • Teräslevyjen laserleikkaus verkossa',
    color: 'from-cyan-500 to-blue-600',
    icon: '⚡',
    live: true
  },
  {
    id: 'v02',
    name: 'V0.2',
    subtitle: 'Laserleikkeet & Särmäykset',
    description: 'Laserleikkaus + särmäys yhdessä tilauksessa',
    color: 'from-violet-500 to-purple-600',
    icon: '📐',
    comingSoon: true,
    features: ['Leikkaus + taivutus samassa', 'Yhdistetty hinnoittelu', '3D-esikatselu']
  },
  {
    id: 'v03',
    name: 'V0.3',
    subtitle: 'Putken Taivutukset',
    description: 'Standardoitu putken taivutus • 3D-mallit • Parametrisoitu hinnoittelu',
    color: 'from-emerald-500 to-teal-600',
    icon: '🔧',
    beta: true
  },
  {
    id: 'v04',
    name: 'V0.4',
    subtitle: 'Ritiläkonfiguraattori',
    description: 'Puristehitsatut ritilät ja porrasaskelmat • Vakio tai räätälöity',
    color: 'from-lime-500 to-green-600',
    icon: '🔲',
    beta: true
  },
  {
    id: 'v045',
    name: 'V0.45',
    subtitle: 'Palkkien Poraukset',
    description: 'Sivupalkkien poraus • Tekoäly-analyysi • Piirustuksista hintoihin',
    color: 'from-amber-500 to-orange-600',
    icon: '🏗️',
    comingSoon: true,
    features: ['Lataa DXF/DWG → hinta sekunnissa', 'AI tunnistaa poraukset', 'Suora tilaus tuotantoon']
  },
  {
    id: 'v05',
    name: 'V0.5',
    subtitle: 'Kokoonpano: Poraus + Taivutus',
    description: 'AI suunnittelee kokoonpanon • Poraus ja taivutus yhdessä',
    color: 'from-pink-500 to-rose-600',
    icon: '🤖',
    comingSoon: true,
    features: ['Automaattinen kokoonpanosuunnittelu', 'Poraus + taivutus integroitu', 'Optimoitu valmistusjärjestys']
  },
  {
    id: 'v06',
    name: 'V0.6',
    subtitle: 'Porras Konfiguraattori',
    description: 'Parametrinen porrassuunnittelu • IFC-vienti • 3D-esikatselu',
    color: 'from-indigo-500 to-violet-600',
    icon: '🪜',
    beta: true
  },
  {
    id: 'v07',
    name: 'V0.7',
    subtitle: 'Laite',
    description: 'Ehdota uutta ominaisuutta • Kerro mitä tarvitset • Muokkaa tulevaisuutta',
    color: 'from-fuchsia-500 to-purple-600',
    icon: '💡',
    featureSuggestion: true
  }
];

const ownerFeatures = [
  {
    id: 'vote-owner',
    name: 'ÄÄNESTÄ',
    subtitle: 'Hallituksen Kokous',
    description: 'Päätä yrityksen strategisesta suunnasta',
    color: 'from-amber-500 to-yellow-500',
    icon: '👑',
    linkText: 'Siirry hallituksen kokoukseen'
  }
];

const staffFeatures = [
  {
    id: 'vote-staff',
    name: 'ÄÄNESTÄ',
    subtitle: 'Työntekijöiden Ääni',
    description: 'Vaikuta työpaikkasi tulevaisuuteen - etätyö, voitonjako, työviikko',
    color: 'from-cyan-500 to-blue-500',
    icon: '👷',
    linkText: 'Siirry äänestämään'
  }
];

const customerFeatures = [
  {
    id: 'vote-customer',
    name: 'ÄÄNESTÄ',
    subtitle: 'Asiakaspalaute 2.0',
    description: 'Päätä Pertin kohtalo, byrokratian määrä ja muut kriittiset asiat',
    color: 'from-rose-500 to-pink-500',
    icon: '🛒',
    linkText: 'Siirry vaikuttamaan'
  }
];

const allVersions = [...publicVersions, ...ownerFeatures, ...staffFeatures, ...customerFeatures];

const VersionSelector = ({ onSelect }) => {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [hoveredVersion, setHoveredVersion] = useState(null);
  const [showAnimation, setShowAnimation] = useState(true);
  const [ownerSectionOpen, setOwnerSectionOpen] = useState(false);
  const [staffSectionOpen, setStaffSectionOpen] = useState(false);
  const [customerSectionOpen, setCustomerSectionOpen] = useState(false);

  useEffect(() => {
    // Check if version is stored in URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlVersion = urlParams.get('version');
    const storedVersion = localStorage.getItem('fabos-version');

    if (urlVersion && allVersions.find(v => v.id === urlVersion)) {
      handleSelect(urlVersion);
    } else if (storedVersion && allVersions.find(v => v.id === storedVersion)) {
      // Show selector anyway, but highlight previous choice
      setSelectedVersion(storedVersion);
    }
  }, []);

  const handleSelect = (versionId) => {
    const version = allVersions.find(v => v.id === versionId);
    if (version?.comingSoon) return;

    setSelectedVersion(versionId);
    localStorage.setItem('fabos-version', versionId);

    // Update URL without reload
    const url = new URL(window.location);
    url.searchParams.set('version', versionId);
    window.history.pushState({}, '', url);

    // Animate out and select
    setShowAnimation(false);
    setTimeout(() => {
      onSelect(versionId);
    }, 500);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-y-auto transition-opacity duration-500 ${showAnimation ? 'opacity-100' : 'opacity-0'}`}>
      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-cyan-500/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Theme Switcher - fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeSwitcher variant="dark" />
      </div>

      <div className="relative z-10 text-center px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            {/* Scandinavian-style FabOS Logo */}
            <div className="w-20 h-20 relative animate-float">
              <svg viewBox="0 0 80 80" className="w-full h-full">
                {/* Clean hexagon background */}
                <polygon
                  points="40,4 72,22 72,58 40,76 8,58 8,22"
                  fill="url(#fabosGradient)"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="1"
                />
                {/* Minimalist F mark */}
                <path
                  d="M28,24 L52,24 L52,30 L34,30 L34,37 L48,37 L48,43 L34,43 L34,56 L28,56 Z"
                  fill="white"
                />
                {/* Subtle geometric accent */}
                <circle cx="56" cy="52" r="4" fill="rgba(255,255,255,0.6)" />
                {/* Gradient definition */}
                <defs>
                  <linearGradient id="fabosGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold cinzel gradient-text mb-3">
            FabOS
          </h1>
          <p className="text-slate-400 text-lg">Fabrication Operating System</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 rounded-full px-4 py-2">
            <span className="text-amber-400">⚠️</span>
            <span className="text-amber-300 text-sm">Valitse testattava versio</span>
          </div>
        </div>

        {/* Version Cards - Public */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {publicVersions.map((version) => {
            const isActive = version.live || version.beta || version.featureSuggestion;
            return (
            <button
              key={version.id}
              onClick={() => handleSelect(version.id)}
              onMouseEnter={() => setHoveredVersion(version.id)}
              onMouseLeave={() => setHoveredVersion(null)}
              disabled={version.comingSoon}
              className={`
                relative group p-5 rounded-2xl transition-all duration-300 text-left overflow-hidden
                ${version.comingSoon
                  ? 'border-2 border-slate-700 bg-slate-800/30 cursor-not-allowed opacity-60'
                  : isActive
                    ? 'vegas-card bg-slate-800/80 hover:-translate-y-2 hover:scale-[1.02]'
                    : selectedVersion === version.id
                      ? 'border-2 border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
                      : 'border-2 border-slate-700 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800/80 hover:shadow-xl hover:-translate-y-1'
                }
              `}
            >
              {/* Vegas shimmer overlay for active cards */}
              {isActive && !version.comingSoon && (
                <div className="absolute inset-0 vegas-shimmer pointer-events-none opacity-20 rounded-2xl" />
              )}

              {/* Marquee dots for live modules */}
              {isActive && !version.comingSoon && (
                <div className="absolute top-0 left-0 right-0 flex justify-around py-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-yellow-400 marquee-dot"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              )}

              {/* Coming Soon Badge */}
              {version.comingSoon && (
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-purple-500/30">
                  Q2 2025
                </div>
              )}

              {/* Live Badge - Vegas style */}
              {version.live && (
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full vegas-badge z-10">
                  🔥 LIVE
                </div>
              )}

              {/* Beta Badge - Vegas style */}
              {version.beta && (
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full vegas-badge z-10">
                  ⚡ BETA
                </div>
              )}

              {/* Feature Suggestion Badge - Vegas style */}
              {version.featureSuggestion && (
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full vegas-badge z-10">
                  💡 EHDOTA
                </div>
              )}

              {/* Icon */}
              <div className={`
                w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-4 mt-2
                bg-gradient-to-br ${version.color} shadow-lg
                ${isActive && !version.comingSoon ? 'animate-bounce-custom' : ''}
                ${!version.comingSoon && hoveredVersion === version.id ? 'scale-110' : ''}
                transition-transform duration-300
              `}>
                {version.icon}
              </div>

              {/* Version Name */}
              <h3 className={`text-xl font-bold mb-1 ${isActive ? 'text-white' : 'text-white'}`}>{version.name}</h3>
              <h4 className={`text-lg font-semibold mb-2 bg-gradient-to-r ${version.color} bg-clip-text text-transparent`}>
                {version.subtitle}
              </h4>

              {/* Description */}
              <p className="text-slate-400 text-sm">{version.description}</p>

              {/* Feature list for coming soon versions */}
              {version.comingSoon && version.features && (
                <ul className="mt-3 space-y-1">
                  {version.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              )}

              {/* Select indicator */}
              {!version.comingSoon && (
                <div className={`
                  mt-4 flex items-center gap-2 text-sm font-medium
                  ${isActive
                    ? 'text-yellow-400 group-hover:text-yellow-300'
                    : selectedVersion === version.id
                      ? 'text-cyan-400'
                      : 'text-slate-500 group-hover:text-slate-300'
                  }
                `}>
                  {version.featureSuggestion ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Ehdota ominaisuutta</span>
                    </>
                  ) : isActive ? (
                    <>
                      <span className="text-lg">🎰</span>
                      <span>Kokeile nyt!</span>
                    </>
                  ) : selectedVersion === version.id ? (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Valittu aiemmin</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span>Valitse</span>
                    </>
                  )}
                </div>
              )}
            </button>
          )})}
        </div>

        {/* Exclusive Sections Container */}
        <div className="mt-10 max-w-6xl mx-auto grid md:grid-cols-3 gap-4">

          {/* Owner Section */}
          <div>
            <button
              onClick={() => setOwnerSectionOpen(!ownerSectionOpen)}
              className="w-full group"
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-500/30"></div>
                <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-full px-4 py-2 hover:border-amber-400/50 transition-all">
                  <span className="text-amber-400">👑</span>
                  <span className="text-amber-300 text-sm font-semibold tracking-wide">OMISTAJILLE</span>
                  <svg
                    className={`w-4 h-4 text-amber-400 transition-transform duration-300 ${ownerSectionOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-500/30"></div>
              </div>
            </button>

            {/* Owner features - expandable */}
            <div className={`overflow-hidden transition-all duration-500 ${ownerSectionOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              {ownerFeatures.map((feature) => (
                <button
                  key={`owner-${feature.id}`}
                  onClick={() => handleSelect(feature.id)}
                  onMouseEnter={() => setHoveredVersion(`owner-${feature.id}`)}
                  onMouseLeave={() => setHoveredVersion(null)}
                  className="relative w-full group p-5 rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 hover:border-amber-400 hover:bg-amber-500/10 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1 transition-all duration-300 text-left mt-2"
                >
                  {/* Live Badge */}
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                    LIVE
                  </div>

                  <div className="flex items-start gap-4">
                    <div className={`
                      w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0
                      bg-gradient-to-br ${feature.color} shadow-lg shadow-amber-500/20
                      ${hoveredVersion === `owner-${feature.id}` ? 'animate-bounce-custom' : ''}
                    `}>
                      {feature.icon}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{feature.name}</h3>
                      <h4 className={`text-sm font-semibold mb-1 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>
                        {feature.subtitle}
                      </h4>
                      <p className="text-slate-400 text-xs">{feature.description}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs font-medium text-amber-400 group-hover:text-amber-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <span>{feature.linkText}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Staff Section */}
          <div>
            <button
              onClick={() => setStaffSectionOpen(!staffSectionOpen)}
              className="w-full group"
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-500/30"></div>
                <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-full px-4 py-2 hover:border-cyan-400/50 transition-all">
                  <span className="text-cyan-400">👷</span>
                  <span className="text-cyan-300 text-sm font-semibold tracking-wide">HENKILÖKUNTA</span>
                  <svg
                    className={`w-4 h-4 text-cyan-400 transition-transform duration-300 ${staffSectionOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-500/30"></div>
              </div>
            </button>

            {/* Staff features - expandable */}
            <div className={`overflow-hidden transition-all duration-500 ${staffSectionOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              {staffFeatures.map((feature) => (
                <button
                  key={`staff-${feature.id}`}
                  onClick={() => handleSelect(feature.id)}
                  onMouseEnter={() => setHoveredVersion(`staff-${feature.id}`)}
                  onMouseLeave={() => setHoveredVersion(null)}
                  className="relative w-full group p-5 rounded-2xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 hover:border-cyan-400 hover:bg-cyan-500/10 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1 transition-all duration-300 text-left mt-2"
                >
                  {/* Live Badge */}
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                    LIVE
                  </div>

                  <div className="flex items-start gap-4">
                    <div className={`
                      w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0
                      bg-gradient-to-br ${feature.color} shadow-lg shadow-cyan-500/20
                      ${hoveredVersion === `staff-${feature.id}` ? 'animate-bounce-custom' : ''}
                    `}>
                      {feature.icon}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{feature.name}</h3>
                      <h4 className={`text-sm font-semibold mb-1 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>
                        {feature.subtitle}
                      </h4>
                      <p className="text-slate-400 text-xs">{feature.description}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs font-medium text-cyan-400 group-hover:text-cyan-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <span>{feature.linkText}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Customer Section */}
          <div>
            <button
              onClick={() => setCustomerSectionOpen(!customerSectionOpen)}
              className="w-full group"
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-rose-500/30"></div>
                <div className="flex items-center gap-2 bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-500/30 rounded-full px-4 py-2 hover:border-rose-400/50 transition-all">
                  <span className="text-rose-400">🛒</span>
                  <span className="text-rose-300 text-sm font-semibold tracking-wide">ASIAKKAAT</span>
                  <svg
                    className={`w-4 h-4 text-rose-400 transition-transform duration-300 ${customerSectionOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-rose-500/30"></div>
              </div>
            </button>

            {/* Customer features - expandable */}
            <div className={`overflow-hidden transition-all duration-500 ${customerSectionOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              {customerFeatures.map((feature) => (
                <button
                  key={`customer-${feature.id}`}
                  onClick={() => handleSelect(feature.id)}
                  onMouseEnter={() => setHoveredVersion(`customer-${feature.id}`)}
                  onMouseLeave={() => setHoveredVersion(null)}
                  className="relative w-full group p-5 rounded-2xl border-2 border-rose-500/30 bg-gradient-to-br from-rose-500/5 to-pink-500/5 hover:border-rose-400 hover:bg-rose-500/10 hover:shadow-xl hover:shadow-rose-500/10 hover:-translate-y-1 transition-all duration-300 text-left mt-2"
                >
                  {/* Live Badge */}
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                    LIVE
                  </div>

                  <div className="flex items-start gap-4">
                    <div className={`
                      w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0
                      bg-gradient-to-br ${feature.color} shadow-lg shadow-rose-500/20
                      ${hoveredVersion === `customer-${feature.id}` ? 'animate-bounce-custom' : ''}
                    `}>
                      {feature.icon}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{feature.name}</h3>
                      <h4 className={`text-sm font-semibold mb-1 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>
                        {feature.subtitle}
                      </h4>
                      <p className="text-slate-400 text-xs">{feature.description}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs font-medium text-rose-400 group-hover:text-rose-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <span>{feature.linkText}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Roadmap teaser */}
        <div className="mt-12 max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-500/50"></div>
              <span className="text-cyan-400 text-sm font-medium tracking-wider">ROADMAP 2025</span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-500/50"></div>
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">€2.4M</div>
                <div className="text-slate-500 text-xs">Säästöpotentiaali / asiakas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400">73%</div>
                <div className="text-slate-500 text-xs">Nopeampi tarjousprosessi</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-400">0</div>
                <div className="text-slate-500 text-xs">Manuaalista työtä</div>
              </div>
            </div>
            <p className="mt-4 text-slate-400 text-sm text-center">
              Tekoäly mullistaa terästeollisuuden. Ole mukana alusta asti.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 pb-8 text-slate-500 text-sm">
          <p>Valinta tallennetaan selaimeesi • Voit vaihtaa versiota milloin tahansa</p>
          <p className="mt-2">
            <span className="text-slate-600">Jaa linkki:</span>{' '}
            <code className="bg-slate-800 px-2 py-1 rounded text-cyan-400">
              ?version=v01
            </code>
          </p>
          <p className="mt-4 text-slate-600">
            FabOS v{APP_VERSION} • © 2026
          </p>
        </div>
      </div>
    </div>
  );
};

export default VersionSelector;
