import React, { useState, useEffect } from 'react';

// ==================== MODERN INTRO ====================
export const EpicIntro = ({ onComplete }) => {
  const [visible, setVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    setTimeout(() => setShowContent(true), 600);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#0a0a0f] cursor-pointer"
      onClick={onComplete}
    >
      {/* Subtle gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className={`text-center px-8 max-w-3xl transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Logo mark */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 shadow-lg shadow-cyan-500/25">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
        </div>

        {/* Main title */}
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight">
          Levy<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">verkko</span>kauppa
        </h1>

        {/* Tagline */}
        <p className={`text-xl md:text-2xl text-slate-400 mb-12 transition-all duration-700 delay-300 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          Teräslevyjen tilaus verkossa. Yksinkertaisesti.
        </p>

        {/* Features */}
        <div className={`flex flex-wrap justify-center gap-6 mb-12 transition-all duration-700 delay-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-2 text-slate-500">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Ilmainen</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
            <span>AI-avustaja</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            <span>Reaaliaikainen hinta</span>
          </div>
        </div>

        {/* CTA */}
        <div className={`transition-all duration-700 delay-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <button
            onClick={(e) => { e.stopPropagation(); onComplete(); }}
            className="group px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-slate-100 transition-all hover:shadow-lg hover:shadow-white/20"
          >
            Aloita suunnittelu
            <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>

        {/* Click hint */}
        <p className={`mt-16 text-sm text-slate-600 transition-all duration-700 delay-1000 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
          Klikkaa missä tahansa jatkaaksesi
        </p>
      </div>
    </div>
  );
};

// ==================== BATTLE BANNER ====================
export const BattleBanner = ({ battle, onClose }) => {
  const battles = [
    {
      title: "⚔️ TAISTELU #1: Excel vs. Äly ⚔️",
      hero: { name: "AI-Avustaja", emoji: "🤖", quote: '"Tee 200x300 levy, 4 reikää kulmiin"' },
      villain: { name: "Excel-helvetti", emoji: "📊", quote: '"=IF(AND(B2>0,C2>0),PI()*D2^2/4,"VIRHE")"' },
      wisdom: "AI ei koskaan kysy 'haluatko tallentaa muutokset?'"
    },
    {
      title: "🛡️ TAISTELU #2: Vapaus vs. Lisenssi 🛡️",
      hero: { name: "Selainpohjainen", emoji: "🆓", quote: "Avaa selain. Piirrä. Valmis." },
      villain: { name: "3000€/vuosi", emoji: "💰", quote: '"Lisenssisi on vanhentunut."' },
      wisdom: "Paras CAD-ohjelma on se, jonka voit avata heti."
    },
    {
      title: "🔥 TAISTELU #3: Nopeus vs. Byrokratia 🔥",
      hero: { name: "30 sekuntia", emoji: "⚡", quote: "Piirrä → Hinta → Tilaa" },
      villain: { name: "2 viikkoa", emoji: "🐌", quote: '"Lähetä tarjouspyyntö, odotellaan..."' },
      wisdom: "Aika on rahaa. Me säästämme molempia."
    }
  ];

  const b = battles[battle];
  const [showWinner, setShowWinner] = useState(false);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWinner(true);
      setParticles([...Array(30)].map((_, i) => ({ id: i, left: Math.random() * 100, delay: Math.random() * 2, emoji: ['🎉', '⭐', '✨', '💫', '🏆', '🔥'][i % 6] })));
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.9)' }}>
      {particles.map(p => (
        <div key={p.id} className="particle text-2xl" style={{ left: `${p.left}%`, top: '-50px', animationDelay: `${p.delay}s` }}>{p.emoji}</div>
      ))}

      <div className="max-w-4xl w-full epic-border rounded-2xl p-8 steel-gradient">
        <h2 className="cinzel text-3xl md:text-4xl text-center text-white mb-8 animate-fire">{b.title}</h2>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className={`text-center p-6 rounded-xl ${showWinner ? 'bg-emerald-900/50 ring-4 ring-emerald-400' : 'bg-slate-800/50'}`}>
            <div className={`text-6xl mb-4 ${showWinner ? 'animate-victory' : ''}`}>{b.hero.emoji}</div>
            <h3 className="text-xl font-bold text-emerald-400 mb-2">{b.hero.name}</h3>
            <p className="text-gray-300 text-sm italic">{b.hero.quote}</p>
            {showWinner && <div className="mt-4 text-4xl animate-bounce">🏆</div>}
          </div>

          <div className="flex items-center justify-center">
            <div className="text-6xl animate-shake">⚡</div>
          </div>

          <div className={`text-center p-6 rounded-xl ${showWinner ? 'bg-red-900/30 opacity-50' : 'bg-slate-800/50'}`}>
            <div className={`text-6xl mb-4 ${showWinner ? '' : 'animate-shake'}`}>{b.villain.emoji}</div>
            <h3 className="text-xl font-bold text-red-400 mb-2">{b.villain.name}</h3>
            <p className="text-gray-300 text-sm italic">{b.villain.quote}</p>
            {showWinner && <div className="mt-4 text-4xl">💀</div>}
          </div>
        </div>

        {showWinner && (
          <div className="text-center animate-epic">
            <p className="text-2xl text-cyan-400 font-bold mb-6">"{b.wisdom}"</p>
            <button onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-white font-bold hover:scale-105 transition-transform">
              JATKA VALLOITUSTA →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== HUMOR BANNER ====================
export const HumorBanner = () => {
  const [idx, setIdx] = useState(0);
  const banners = [
    { emoji: "🔥", text: "HUOM: Tämä ohjelma EI vaadi 47-sivuista lisenssisopimusta", color: "from-orange-600 to-red-600" },
    { emoji: "🤖", text: "AI-avustaja ei tuomitse, vaikka piirtäisit kolmion \"suorakulmiolla\"", color: "from-purple-600 to-indigo-600" },
    { emoji: "💪", text: "Jokainen piirtämäsi muoto vahvistaa suomalaista terästeollisuutta*", color: "from-cyan-600 to-blue-600" },
    { emoji: "☕", text: "Kehitetty kahvilla. Paljon kahvilla. Liikaa kahvia.", color: "from-amber-600 to-orange-600" },
    { emoji: "🦊", text: "Kettu sanoo: \"Miksi maksaa CAD-ohjelmasta kun voi olla ilmaista?\"", color: "from-emerald-600 to-teal-600" },
    { emoji: "⚡", text: "VARO: Sivuvaikutuksena voi esiintyä äkillistä tuottavuutta", color: "from-yellow-500 to-amber-500" },
    { emoji: "🎯", text: "99% tarkkuus. 1% 'no se oli tarkoituskin sellaiseksi'", color: "from-pink-600 to-rose-600" },
  ];

  useEffect(() => {
    const interval = setInterval(() => setIdx(i => (i + 1) % banners.length), 8000);
    return () => clearInterval(interval);
  }, []);

  const b = banners[idx];
  return (
    <div className={`bg-gradient-to-r ${b.color} py-2 px-4 text-center text-white text-sm font-medium`}>
      <div className="flex items-center justify-center gap-2 animate-pulse">
        <span className="text-lg">{b.emoji}</span>
        <span>{b.text}</span>
        <span className="text-lg">{b.emoji}</span>
      </div>
    </div>
  );
};

// ==================== FEEDBACK MODAL ====================
export const FeedbackModal = ({ isOpen, onClose }) => {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [category, setCategory] = useState('');

  const categories = [
    { id: 'love', emoji: '😍', text: 'Rakastan tätä!' },
    { id: 'feature', emoji: '💡', text: 'Ominaisuusidea' },
    { id: 'bug', emoji: '🐛', text: 'Löysin bugin' },
    { id: 'confused', emoji: '🤔', text: 'En ymmärrä' },
    { id: 'money', emoji: '💰', text: 'Ottaisin rahalla!' },
  ];

  const handleSubmit = () => {
    console.log({ feedback, rating, email, category });
    setSubmitted(true);
    setTimeout(() => { onClose(); setSubmitted(false); setFeedback(''); setRating(0); setEmail(''); setCategory(''); }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="max-w-lg w-full epic-border rounded-2xl p-6 steel-gradient">
        {!submitted ? (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-2">📬</div>
              <h2 className="cinzel text-2xl text-white">LÄHETÄ PALAUTETTA</h2>
              <p className="text-gray-400 text-sm mt-2">Sinun äänesi muokkaa tulevaisuutta!</p>
            </div>

            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-2">Minkälainen palaute?</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setCategory(cat.id)}
                    className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${category === cat.id ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}>
                    <span>{cat.emoji}</span><span>{cat.text}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-2">Kuinka paljon tähtiä? ⭐</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(star => (
                  <button key={star} onClick={() => setRating(star)}
                    className={`text-3xl transition-transform hover:scale-125 ${rating >= star ? 'animate-bounce' : ''}`}>
                    {rating >= star ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-2">Kerro lisää</label>
              <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)}
                placeholder="Ominaisuusideoita? Bugeja? Ruusuja vai risuja?"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none" rows={4} />
            </div>

            <div className="mb-6">
              <label className="text-sm text-gray-400 block mb-2">Sähköposti (jos haluat vastauksen)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="nimi@esimerkki.fi"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500" />
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 px-4 py-3 bg-slate-700 rounded-lg text-gray-300 hover:bg-slate-600">Peruuta</button>
              <button onClick={handleSubmit} className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg text-white font-bold hover:scale-105 transition-transform">🚀 Lähetä!</button>
            </div>

            <p className="text-center text-xs text-gray-500 mt-4">Palautteet menevät suoraan kehittäjätiimille. Kiitos! 💜</p>
          </>
        ) : (
          <div className="text-center py-8 animate-epic">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl text-white font-bold mb-2">KIITOS!</h3>
            <p className="text-gray-400">Palautteesi on vastaanotettu!</p>
            <p className="text-cyan-400 mt-4 animate-bounce">Olet sankari! 🦸</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== ACHIEVEMENT TOAST ====================
export const AchievementToast = ({ achievement, onClose }) => {
  useEffect(() => {
    if (achievement) {
      const t = setTimeout(onClose, 4000);
      return () => clearTimeout(t);
    }
  }, [achievement, onClose]);

  if (!achievement) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-epic">
      <div className="bg-gradient-to-r from-yellow-600 to-amber-500 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4">
        <div className="text-4xl animate-bounce">{achievement.emoji}</div>
        <div>
          <div className="text-xs text-yellow-200 uppercase font-bold">Saavutus avattu!</div>
          <div className="text-lg text-white font-bold">{achievement.title}</div>
        </div>
      </div>
    </div>
  );
};

// ==================== FLOATING ACTIONS ====================
export const FloatingActions = ({ onFeedback, onBattle, battleCount }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-3">
      {expanded && (
        <>
          <button onClick={onFeedback} className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform animate-epic" title="Anna palautetta">
            <span className="text-2xl">💬</span>
          </button>
          {battleCount < 3 && (
            <button onClick={onBattle} className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform animate-epic animate-shake" title="Katso taistelu!">
              <span className="text-2xl">⚔️</span>
            </button>
          )}
        </>
      )}
      <button onClick={() => setExpanded(!expanded)}
        className={`w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all ${expanded ? 'rotate-45' : ''}`}>
        <span className="text-2xl">{expanded ? '✕' : '🎮'}</span>
      </button>
    </div>
  );
};

// ==================== INVESTOR BANNER ====================
export const InvestorBanner = ({ onContact }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentStat, setCurrentStat] = useState(0);

  const stats = [
    { value: "50x", label: "Tavoiteltu tuotto 5v", highlight: true },
    { value: "€5.2B", label: "Kohdemarkkinan koko" },
    { value: "0", label: "Kilpailijoita Suomessa" },
    { value: "∞", label: "Skaalautuvuus" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Floating CTA - Sleek but attention-grabbing */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="fixed bottom-6 right-6 z-50 group"
        >
          <div className="relative flex items-center gap-3 bg-black border border-emerald-500/50 rounded-full pl-5 pr-2 py-2 shadow-2xl shadow-emerald-500/20 hover:border-emerald-400 transition-all hover:shadow-emerald-500/30">
            {/* Live indicator */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <div className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              </div>
              <span className="text-emerald-400 font-semibold text-sm">LIVE</span>
            </div>

            <div className="h-4 w-px bg-slate-700" />

            <span className="text-white font-medium text-sm">Sijoituskierros auki</span>

            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center group-hover:bg-emerald-400 transition-colors">
              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </button>
      )}

      {/* Full Modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm overflow-y-auto">
          <div className="relative max-w-4xl w-full my-8">
            {/* Close */}
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute -top-2 -right-2 md:top-4 md:right-4 w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white z-10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Card */}
            <div className="bg-[#0c0c0f] rounded-2xl overflow-hidden border border-slate-800">

              {/* Hero Section */}
              <div className="relative p-8 md:p-12 overflow-hidden">
                {/* Background elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />

                <div className="relative">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1.5 mb-6">
                    <div className="relative">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      <div className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                    </div>
                    <span className="text-emerald-400 text-sm font-medium">Pre-seed kierros nyt auki</span>
                  </div>

                  {/* Main headline */}
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                    AI mullistaa<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400">
                      teollisuuden tilausketjun
                    </span>
                  </h1>

                  <p className="text-xl text-slate-400 mb-8 max-w-2xl">
                    Olemme rakentamassa Suomen ensimmäistä AI-pohjaista teollisuuden verkkokauppaa.
                    <span className="text-white font-semibold"> Tämä on mahdollisuus päästä mukaan alusta asti.</span>
                  </p>

                  {/* Key stat */}
                  <div className="inline-flex items-baseline gap-3 bg-slate-900/50 rounded-2xl px-6 py-4 border border-slate-800">
                    <span className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                      {stats[currentStat].value}
                    </span>
                    <span className="text-slate-400 text-lg">{stats[currentStat].label}</span>
                  </div>
                </div>
              </div>

              {/* Why Now Section */}
              <div className="px-8 md:px-12 py-8 border-t border-slate-800/50">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Miksi juuri nyt?</h2>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="group">
                    <div className="text-3xl mb-3">⚡</div>
                    <h3 className="text-lg font-semibold text-white mb-2">AI-vallankumous</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Generatiivinen AI mahdollistaa nyt sen, mikä oli mahdotonta 2 vuotta sitten.
                      <span className="text-emerald-400 font-medium"> Me olemme eturintamassa.</span>
                    </p>
                  </div>

                  <div className="group">
                    <div className="text-3xl mb-3">🎯</div>
                    <h3 className="text-lg font-semibold text-white mb-2">Tyhjä markkina</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      5,2 miljardin euron metalliteollisuus ilman yhtään modernia verkkopalvelua.
                      <span className="text-emerald-400 font-medium"> Puhdas blue ocean.</span>
                    </p>
                  </div>

                  <div className="group">
                    <div className="text-3xl mb-3">🚀</div>
                    <h3 className="text-lg font-semibold text-white mb-2">First-mover</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Ensimmäinen toimija luo standardin. Verkostovaikutus rakentaa
                      <span className="text-emerald-400 font-medium"> ylittämättömän kilpailuedun.</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* The Opportunity */}
              <div className="px-8 md:px-12 py-8 bg-gradient-to-b from-transparent to-emerald-950/20 border-t border-slate-800/50">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Tuottopotentiaali</h2>

                <div className="bg-black/50 rounded-xl p-6 border border-slate-800 mb-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    <div>
                      <div className="text-3xl md:text-4xl font-black text-white mb-1">50x</div>
                      <div className="text-xs text-slate-500">Tavoiteltu tuotto (5v)</div>
                    </div>
                    <div>
                      <div className="text-3xl md:text-4xl font-black text-white mb-1">€100M+</div>
                      <div className="text-xs text-slate-500">ARR tavoite 2029</div>
                    </div>
                    <div>
                      <div className="text-3xl md:text-4xl font-black text-white mb-1">85%</div>
                      <div className="text-xs text-slate-500">Bruttokate (SaaS)</div>
                    </div>
                    <div>
                      <div className="text-3xl md:text-4xl font-black text-white mb-1">EU</div>
                      <div className="text-xs text-slate-500">Laajennusmarkkina</div>
                    </div>
                  </div>
                </div>

                <p className="text-slate-400 text-sm text-center">
                  Vertaa: Euroopan johtava teollisuuden marketplace <span className="text-white">Xometry</span> arvostettu
                  <span className="text-emerald-400 font-semibold"> $800M</span> – ja se on vasta USA:ssa.
                </p>
              </div>

              {/* Social Proof */}
              <div className="px-8 md:px-12 py-8 border-t border-slate-800/50">
                <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">MVP</div>
                    <div className="text-xs text-slate-500">Toimiva tuote</div>
                  </div>
                  <div className="h-8 w-px bg-slate-800" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">AI</div>
                    <div className="text-xs text-slate-500">Integroitu avustaja</div>
                  </div>
                  <div className="h-8 w-px bg-slate-800" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">24/7</div>
                    <div className="text-xs text-slate-500">Automaattinen hinnoittelu</div>
                  </div>
                  <div className="h-8 w-px bg-slate-800" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">100%</div>
                    <div className="text-xs text-slate-500">Suomalainen</div>
                  </div>
                </div>
              </div>

              {/* CTA Section */}
              <div className="px-8 md:px-12 py-10 bg-gradient-to-t from-emerald-950/30 to-transparent border-t border-slate-800/50">
                <div className="text-center max-w-xl mx-auto">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    Haluatko olla mukana?
                  </h2>
                  <p className="text-slate-400 mb-8">
                    Etsimme strategisia sijoittajia jotka ymmärtävät teollisuuden ja AI:n potentiaalin.
                    Paikkoja on rajoitetusti.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                      onClick={onContact}
                      className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-bold text-black text-lg hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-lg shadow-emerald-500/25"
                    >
                      <span className="flex items-center justify-center gap-2">
                        Varaa keskusteluaika
                        <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </span>
                    </button>

                    <a
                      href="mailto:sijoittajat@fabos.fi?subject=Pitch%20deck%20pyynt%C3%B6"
                      className="w-full sm:w-auto px-6 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-colors border border-slate-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Pyydä pitch deck
                    </a>
                  </div>

                  <p className="mt-8 text-xs text-slate-600">
                    Sijoittaminen startup-yrityksiin sisältää riskejä. Historiallinen tuotto ei ole tae tulevasta.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
