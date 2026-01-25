import React, { useState, useEffect, useCallback } from 'react';

const VotingPage = ({ onBack }) => {
  // Omistajien äänestysaiheet
  const ownerTopics = [
    {
      id: 'values',
      title: 'Arvot',
      subtitle: 'Mikä ohjaa yritystämme?',
      options: [
        { id: 'right', label: 'Oikein', emoji: '✅', color: 'emerald', description: 'Tehdään asiat oikein, vaikka se olisi vaikeampaa' },
        { id: 'wrong', label: 'Väärin', emoji: '❌', color: 'red', description: 'Tehdään asiat nopeasti, kysytään anteeksi myöhemmin' },
      ]
    },
    {
      id: 'speed',
      title: 'Kehitystahti',
      subtitle: 'Kuinka nopeasti edetään?',
      options: [
        { id: 'tortoise', label: 'Kilpikonna', emoji: '🐢', color: 'blue', description: 'Hidas ja varma voittaa' },
        { id: 'rocket', label: 'Raketti', emoji: '🚀', color: 'orange', description: 'Move fast and break things' },
      ]
    },
    {
      id: 'vibe',
      title: 'Fiilis',
      subtitle: 'Millainen tunnelma?',
      options: [
        { id: 'serious', label: 'Vakava', emoji: '🎩', color: 'slate', description: 'Ammattimaisuus edellä' },
        { id: 'chaotic', label: 'Kaaos', emoji: '🎪', color: 'purple', description: 'Luovuus kukoistaa kaaoksessa' },
      ]
    }
  ];

  // Henkilökunnan äänestysaiheet - oikeasti merkitykselliset asiat
  const staffTopics = [
    {
      id: 'remote',
      title: 'Etätyö',
      subtitle: 'Miten työtä tehdään?',
      icon: '🏠',
      impact: 'Vaikuttaa jokaisen arkeen',
      options: [
        {
          id: 'full-remote',
          label: 'Täysi etätyö',
          emoji: '🌍',
          color: 'emerald',
          description: 'Työskentele mistä haluat, milloin haluat. Luottamus edellä.'
        },
        {
          id: 'hybrid',
          label: 'Hybridimalli',
          emoji: '⚖️',
          color: 'blue',
          description: 'Joustavasti kotoa tai toimistolta. Paras molemmista maailmoista.'
        },
      ]
    },
    {
      id: 'profit-sharing',
      title: 'Voitonjako',
      subtitle: 'Miten menestys jaetaan?',
      icon: '💰',
      impact: 'Sitoo meidät yhteiseen tavoitteeseen',
      options: [
        {
          id: 'equal-share',
          label: 'Tasajako',
          emoji: '🤝',
          color: 'emerald',
          description: 'Jokainen saa saman osuuden voitosta. Olemme kaikki samassa veneessä.'
        },
        {
          id: 'performance',
          label: 'Suoritusperusteinen',
          emoji: '📈',
          color: 'orange',
          description: 'Palkitaan huippusuoritukset. Enemmän panosta = enemmän voittoa.'
        },
      ]
    },
    {
      id: 'workweek',
      title: 'Työviikko',
      subtitle: 'Paljonko työtä on liikaa?',
      icon: '⏰',
      impact: 'Work-life balance konkreettisesti',
      options: [
        {
          id: 'four-days',
          label: '4 päivää',
          emoji: '🎯',
          color: 'emerald',
          description: '4 päivää viikossa, sama palkka. Tutkitusti yhtä tuottavaa, enemmän elämää.'
        },
        {
          id: 'flexible',
          label: 'Joustava',
          emoji: '🌊',
          color: 'blue',
          description: 'Tee työt omaan tahtiisi. Joskus enemmän, joskus vähemmän.'
        },
      ]
    }
  ];

  // Asiakkaiden äänestysaiheet - huumoripitoisia mutta oikeita kipupisteitä
  const customerTopics = [
    {
      id: 'project-manager',
      title: 'Projektipäällikkö Pertti',
      subtitle: 'Pertin tulevaisuus?',
      icon: '👔',
      impact: 'Vaikuttaa toimitusaikoihin',
      options: [
        {
          id: 'fire',
          label: 'Potkut',
          emoji: '🚪',
          color: 'red',
          description: '"Pertti ei vastaa puhelimeen ja toimitukset myöhässä TAAS"'
        },
        {
          id: 'keep',
          label: 'Armahdus',
          emoji: '😇',
          color: 'emerald',
          description: 'Annetaan Pertille vielä yksi mahdollisuus... ehkä'
        },
      ]
    },
    {
      id: 'bureaucracy',
      title: 'Byrokratia',
      subtitle: 'Lomakkeiden määrä?',
      icon: '📋',
      impact: 'Vaikuttaa tilausprosessiin',
      options: [
        {
          id: 'more',
          label: '+100% lisää',
          emoji: '📄',
          color: 'orange',
          description: 'Tarvitaan vielä lomake jolla vahvistetaan edellinen lomake'
        },
        {
          id: 'less',
          label: '-50% vähemmän',
          emoji: '🗑️',
          color: 'emerald',
          description: 'Yksi nappi: "Osta". Ei muuta.'
        },
      ]
    },
    {
      id: 'delivery',
      title: 'Toimituslupaukset',
      subtitle: 'Realistisuus vs. Optimismi?',
      icon: '🚚',
      impact: 'Vaikuttaa odotuksiin',
      options: [
        {
          id: 'honest',
          label: 'Rehellinen',
          emoji: '📅',
          color: 'blue',
          description: '"3-4 viikkoa" (oikeasti 3-4 viikkoa)'
        },
        {
          id: 'optimistic',
          label: 'Optimistinen',
          emoji: '🤞',
          color: 'purple',
          description: '"Huomenna" (oikeasti ehkä ensi kuussa)'
        },
      ]
    },
    {
      id: 'support',
      title: 'Asiakaspalvelu',
      subtitle: 'Miten haluatte tuen?',
      icon: '☎️',
      impact: 'Vaikuttaa asiakaskokemukseen',
      options: [
        {
          id: 'ai',
          label: 'Tekoäly 24/7',
          emoji: '🤖',
          color: 'emerald',
          description: 'AI vastaa sekunnissa. Ei jonotusta. Ehkä ymmärtää.'
        },
        {
          id: 'human',
          label: 'Ihminen',
          emoji: '👨‍💼',
          color: 'blue',
          description: 'Oikea ihminen. 45min jonotus. Kahvitauolla klo 14-15.'
        },
      ]
    }
  ];

  const topics = [...ownerTopics, ...staffTopics, ...customerTopics];

  // Lataa äänet localStoragesta (simuloi tietokantaa)
  const loadVotes = useCallback(() => {
    const stored = localStorage.getItem('fabos-votes');
    if (stored) {
      return JSON.parse(stored);
    }
    // Alkuarvot - simuloi että muutkin ovat äänestäneet
    const initial = {};
    topics.forEach(topic => {
      initial[topic.id] = {};
      topic.options.forEach(opt => {
        initial[topic.id][opt.id] = Math.floor(Math.random() * 50) + 10;
      });
    });
    localStorage.setItem('fabos-votes', JSON.stringify(initial));
    return initial;
  }, []);

  const [votes, setVotes] = useState(loadVotes);
  const [userClicks, setUserClicks] = useState({});
  const [clickAnimations, setClickAnimations] = useState([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [showAchievement, setShowAchievement] = useState(null);

  // Simuloi muiden käyttäjien ääniä (reaaliaikaisuuden illuusio)
  useEffect(() => {
    const interval = setInterval(() => {
      setVotes(prev => {
        const updated = { ...prev };
        // Satunnainen äänestys
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        const randomOption = randomTopic.options[Math.floor(Math.random() * randomTopic.options.length)];

        if (!updated[randomTopic.id]) updated[randomTopic.id] = {};
        updated[randomTopic.id][randomOption.id] = (updated[randomTopic.id][randomOption.id] || 0) + 1;

        localStorage.setItem('fabos-votes', JSON.stringify(updated));
        return updated;
      });
    }, 2000 + Math.random() * 3000); // Satunnainen 2-5s välein

    return () => clearInterval(interval);
  }, []);

  // Tarkista saavutukset
  useEffect(() => {
    const newAchievements = [];

    if (totalClicks >= 10 && !achievements.includes('10clicks')) {
      newAchievements.push({ id: '10clicks', title: 'Aloittelija', emoji: '👆', description: '10 klikkausta!' });
    }
    if (totalClicks >= 50 && !achievements.includes('50clicks')) {
      newAchievements.push({ id: '50clicks', title: 'Aktiivinen', emoji: '🔥', description: '50 klikkausta!' });
    }
    if (totalClicks >= 100 && !achievements.includes('100clicks')) {
      newAchievements.push({ id: '100clicks', title: 'Äänestäjä', emoji: '🗳️', description: '100 klikkausta!' });
    }
    if (totalClicks >= 500 && !achievements.includes('500clicks')) {
      newAchievements.push({ id: '500clicks', title: 'Demokratian Sankari', emoji: '🏆', description: '500 klikkausta!' });
    }
    if (streak >= 10 && !achievements.includes('streak10')) {
      newAchievements.push({ id: 'streak10', title: 'Combo!', emoji: '⚡', description: '10 peräkkäistä klikkausta!' });
    }

    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements.map(a => a.id)]);
      setShowAchievement(newAchievements[0]);
      setTimeout(() => setShowAchievement(null), 3000);
    }
  }, [totalClicks, streak, achievements]);

  // Äänestä
  const handleVote = (topicId, optionId, e) => {
    const now = Date.now();

    // Streak-laskuri
    if (now - lastClickTime < 500) {
      setStreak(prev => prev + 1);
    } else {
      setStreak(1);
    }
    setLastClickTime(now);

    // Päivitä äänet
    setVotes(prev => {
      const updated = { ...prev };
      if (!updated[topicId]) updated[topicId] = {};
      updated[topicId][optionId] = (updated[topicId][optionId] || 0) + 1;
      localStorage.setItem('fabos-votes', JSON.stringify(updated));
      return updated;
    });

    // Käyttäjän omat klikkaukset
    setUserClicks(prev => ({
      ...prev,
      [`${topicId}-${optionId}`]: (prev[`${topicId}-${optionId}`] || 0) + 1
    }));

    setTotalClicks(prev => prev + 1);

    // Klikkausanimaatio
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const animId = Date.now() + Math.random();

    setClickAnimations(prev => [...prev, { id: animId, x, y, topicId, optionId }]);
    setTimeout(() => {
      setClickAnimations(prev => prev.filter(a => a.id !== animId));
    }, 1000);
  };

  // Laske prosentit
  const getPercentage = (topicId, optionId) => {
    const topicVotes = votes[topicId] || {};
    const total = Object.values(topicVotes).reduce((sum, v) => sum + v, 0);
    if (total === 0) return 50;
    return Math.round((topicVotes[optionId] || 0) / total * 100);
  };

  // Värikartta
  const colorMap = {
    emerald: { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-400', glow: 'shadow-emerald-500/50' },
    red: { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-400', glow: 'shadow-red-500/50' },
    blue: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-400', glow: 'shadow-blue-500/50' },
    orange: { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-400', glow: 'shadow-orange-500/50' },
    slate: { bg: 'bg-slate-500', border: 'border-slate-500', text: 'text-slate-400', glow: 'shadow-slate-500/50' },
    purple: { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-400', glow: 'shadow-purple-500/50' },
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Achievement popup */}
      {showAchievement && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3">
            <span className="text-3xl">{showAchievement.emoji}</span>
            <div>
              <div className="font-bold">{showAchievement.title}</div>
              <div className="text-sm opacity-80">{showAchievement.description}</div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Takaisin</span>
            </button>
            <div className="h-6 w-px bg-slate-800" />
            <h1 className="text-xl font-bold">Demokraattinen Suunnannäyttäjä</h1>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-black text-cyan-400">{totalClicks}</div>
              <div className="text-xs text-slate-500">Sinun klikkaukset</div>
            </div>
            {streak > 1 && (
              <div className="text-center animate-pulse">
                <div className="text-2xl font-black text-orange-400">{streak}x</div>
                <div className="text-xs text-slate-500">Combo!</div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Intro */}
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-1.5 mb-6">
          <div className="relative">
            <div className="w-2 h-2 bg-cyan-500 rounded-full" />
            <div className="absolute inset-0 w-2 h-2 bg-cyan-500 rounded-full animate-ping" />
          </div>
          <span className="text-cyan-400 text-sm font-medium">Live äänestys</span>
        </div>

        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Sinä päätät yrityksen
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400"> suunnan</span>
        </h2>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Jokainen klikkaus lasketaan. Klikkaa niin monta kertaa kuin haluat - eniten klikkauksia saanut vaihtoehto voittaa!
        </p>
      </div>

      {/* OMISTAJIEN ÄÄNESTYS */}
      <div className="max-w-6xl mx-auto px-6 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5">
            <span className="text-amber-400">👑</span>
            <span className="text-amber-300 text-sm font-semibold">HALLITUS</span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-amber-500/30 to-transparent"></div>
        </div>

        <div className="space-y-8">
          {ownerTopics.map((topic, topicIdx) => (
            <div key={topic.id} className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
              {/* Topic header */}
              <div className="px-6 py-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-lg font-bold text-amber-400">
                    {topicIdx + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{topic.title}</h3>
                    <p className="text-sm text-slate-500">{topic.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="grid md:grid-cols-2 gap-0">
                {topic.options.map((option, optIdx) => {
                  const percentage = getPercentage(topic.id, option.id);
                  const isWinning = percentage > 50;
                  const colors = colorMap[option.color];
                  const myClicks = userClicks[`${topic.id}-${option.id}`] || 0;

                  return (
                    <button
                      key={option.id}
                      onClick={(e) => handleVote(topic.id, option.id, e)}
                      className={`relative p-8 text-left transition-all hover:bg-slate-800/50 active:scale-[0.98] overflow-hidden group
                        ${optIdx === 0 ? 'md:border-r border-b md:border-b-0 border-slate-800' : ''}`}
                    >
                      {/* Click animations */}
                      {clickAnimations
                        .filter(a => a.topicId === topic.id && a.optionId === option.id)
                        .map(anim => (
                          <span
                            key={anim.id}
                            className={`absolute text-2xl pointer-events-none animate-ping ${colors.text}`}
                            style={{ left: anim.x, top: anim.y, transform: 'translate(-50%, -50%)' }}
                          >
                            +1
                          </span>
                        ))}

                      {/* Progress bar background */}
                      <div
                        className={`absolute inset-0 ${colors.bg} opacity-10 transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />

                      {/* Content */}
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className={`text-5xl transition-transform group-hover:scale-110 ${isWinning ? 'animate-bounce' : ''}`}>
                              {option.emoji}
                            </span>
                            <div>
                              <div className="text-2xl font-bold text-white">{option.label}</div>
                              <div className="text-sm text-slate-500">{option.description}</div>
                            </div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-end justify-between">
                          <div>
                            <span className={`text-5xl font-black ${colors.text}`}>{percentage}%</span>
                            <div className="text-sm text-slate-500 mt-1">
                              {votes[topic.id]?.[option.id] || 0} ääntä
                            </div>
                          </div>

                          {myClicks > 0 && (
                            <div className={`px-3 py-1 rounded-full ${colors.bg} bg-opacity-20 ${colors.text} text-sm font-semibold`}>
                              Sinä: {myClicks}
                            </div>
                          )}
                        </div>

                        {/* Winning badge */}
                        {isWinning && (
                          <div className={`absolute top-4 right-4 px-3 py-1 rounded-full ${colors.bg} text-black text-xs font-bold`}>
                            JOHDOSSA
                          </div>
                        )}
                      </div>

                      {/* Hover effect */}
                      <div className={`absolute inset-0 border-2 ${colors.border} opacity-0 group-hover:opacity-100 transition-opacity rounded-none`} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HENKILÖKUNNAN ÄÄNESTYS */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="flex items-center gap-3 mb-6 mt-8">
          <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-1.5">
            <span className="text-cyan-400">👷</span>
            <span className="text-cyan-300 text-sm font-semibold">HENKILÖKUNTA</span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/30 to-transparent"></div>
        </div>

        <div className="mb-8 p-4 bg-gradient-to-r from-cyan-500/5 to-transparent rounded-xl border border-cyan-500/20">
          <p className="text-slate-300 text-sm">
            <span className="text-cyan-400 font-semibold">Nämä päätökset koskettavat jokaista.</span> Äänestä asioista jotka vaikuttavat työarkeesi - ja näe miten muut ajattelevat.
          </p>
        </div>

        <div className="space-y-8">
          {staffTopics.map((topic, topicIdx) => (
          <div key={topic.id} className="bg-slate-900/50 rounded-2xl border border-cyan-500/20 overflow-hidden">
            {/* Topic header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-cyan-500/5 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-2xl">
                    {topic.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{topic.title}</h3>
                    <p className="text-sm text-slate-500">{topic.subtitle}</p>
                  </div>
                </div>
                <div className="hidden md:block px-3 py-1 bg-cyan-500/10 rounded-full">
                  <span className="text-cyan-400 text-xs font-medium">{topic.impact}</span>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="grid md:grid-cols-2 gap-0">
              {topic.options.map((option, optIdx) => {
                const percentage = getPercentage(topic.id, option.id);
                const isWinning = percentage > 50;
                const colors = colorMap[option.color];
                const myClicks = userClicks[`${topic.id}-${option.id}`] || 0;

                return (
                  <button
                    key={option.id}
                    onClick={(e) => handleVote(topic.id, option.id, e)}
                    className={`relative p-8 text-left transition-all hover:bg-slate-800/50 active:scale-[0.98] overflow-hidden group
                      ${optIdx === 0 ? 'md:border-r border-b md:border-b-0 border-slate-800' : ''}`}
                  >
                    {/* Click animations */}
                    {clickAnimations
                      .filter(a => a.topicId === topic.id && a.optionId === option.id)
                      .map(anim => (
                        <span
                          key={anim.id}
                          className={`absolute text-2xl pointer-events-none animate-ping ${colors.text}`}
                          style={{ left: anim.x, top: anim.y, transform: 'translate(-50%, -50%)' }}
                        >
                          +1
                        </span>
                      ))}

                    {/* Progress bar background */}
                    <div
                      className={`absolute inset-0 ${colors.bg} opacity-10 transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />

                    {/* Content */}
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className={`text-5xl transition-transform group-hover:scale-110 ${isWinning ? 'animate-bounce' : ''}`}>
                            {option.emoji}
                          </span>
                          <div>
                            <div className="text-2xl font-bold text-white">{option.label}</div>
                            <div className="text-sm text-slate-500 max-w-xs">{option.description}</div>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-end justify-between">
                        <div>
                          <span className={`text-5xl font-black ${colors.text}`}>{percentage}%</span>
                          <div className="text-sm text-slate-500 mt-1">
                            {votes[topic.id]?.[option.id] || 0} ääntä
                          </div>
                        </div>

                        {myClicks > 0 && (
                          <div className={`px-3 py-1 rounded-full ${colors.bg} bg-opacity-20 ${colors.text} text-sm font-semibold`}>
                            Sinä: {myClicks}
                          </div>
                        )}
                      </div>

                      {/* Winning badge */}
                      {isWinning && (
                        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full ${colors.bg} text-black text-xs font-bold`}>
                          JOHDOSSA
                        </div>
                      )}
                    </div>

                    {/* Hover effect */}
                    <div className={`absolute inset-0 border-2 ${colors.border} opacity-0 group-hover:opacity-100 transition-opacity rounded-none`} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        </div>

        {/* Staff manifesto */}
        <div className="mt-12 p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 text-center">
          <h3 className="text-lg font-bold text-white mb-2">Miksi tämä on tärkeää?</h3>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
            Liian usein työntekijät ovat vain "resursseja" joilla ei ole sananvaltaa omaan työhönsä.
            <span className="text-cyan-400 font-medium"> Me uskomme toisin.</span> Kun ihmiset saavat vaikuttaa,
            he sitoutuvat. Kun he sitoutuvat, syntyy jotain poikkeuksellista.
          </p>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">100%</div>
              <div className="text-slate-500">Läpinäkyvyys</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">1 = 1</div>
              <div className="text-slate-500">Jokainen ääni painaa</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">0</div>
              <div className="text-slate-500">Piilotettuja agendoja</div>
            </div>
          </div>
        </div>
      </div>

      {/* ASIAKKAIDEN ÄÄNESTYS */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="flex items-center gap-3 mb-6 mt-8">
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 rounded-full px-4 py-1.5">
            <span className="text-rose-400">🛒</span>
            <span className="text-rose-300 text-sm font-semibold">ASIAKKAAT</span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-rose-500/30 to-transparent"></div>
        </div>

        <div className="mb-8 p-4 bg-gradient-to-r from-rose-500/5 to-transparent rounded-xl border border-rose-500/20">
          <p className="text-slate-300 text-sm">
            <span className="text-rose-400 font-semibold">Asiakas on aina oikeassa.</span> Vai onko? Äänestä ja päätä mihin suuntaan palvelua kehitetään. Lupaamme lukea tulokset... joskus.
          </p>
        </div>

        <div className="space-y-8">
          {customerTopics.map((topic) => (
          <div key={topic.id} className="bg-slate-900/50 rounded-2xl border border-rose-500/20 overflow-hidden">
            {/* Topic header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-rose-500/5 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-2xl">
                    {topic.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{topic.title}</h3>
                    <p className="text-sm text-slate-500">{topic.subtitle}</p>
                  </div>
                </div>
                <div className="hidden md:block px-3 py-1 bg-rose-500/10 rounded-full">
                  <span className="text-rose-400 text-xs font-medium">{topic.impact}</span>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="grid md:grid-cols-2 gap-0">
              {topic.options.map((option, optIdx) => {
                const percentage = getPercentage(topic.id, option.id);
                const isWinning = percentage > 50;
                const colors = colorMap[option.color];
                const myClicks = userClicks[`${topic.id}-${option.id}`] || 0;

                return (
                  <button
                    key={option.id}
                    onClick={(e) => handleVote(topic.id, option.id, e)}
                    className={`relative p-8 text-left transition-all hover:bg-slate-800/50 active:scale-[0.98] overflow-hidden group
                      ${optIdx === 0 ? 'md:border-r border-b md:border-b-0 border-slate-800' : ''}`}
                  >
                    {/* Click animations */}
                    {clickAnimations
                      .filter(a => a.topicId === topic.id && a.optionId === option.id)
                      .map(anim => (
                        <span
                          key={anim.id}
                          className={`absolute text-2xl pointer-events-none animate-ping ${colors.text}`}
                          style={{ left: anim.x, top: anim.y, transform: 'translate(-50%, -50%)' }}
                        >
                          +1
                        </span>
                      ))}

                    {/* Progress bar background */}
                    <div
                      className={`absolute inset-0 ${colors.bg} opacity-10 transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />

                    {/* Content */}
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className={`text-5xl transition-transform group-hover:scale-110 ${isWinning ? 'animate-bounce' : ''}`}>
                            {option.emoji}
                          </span>
                          <div>
                            <div className="text-2xl font-bold text-white">{option.label}</div>
                            <div className="text-sm text-slate-500 max-w-xs">{option.description}</div>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-end justify-between">
                        <div>
                          <span className={`text-5xl font-black ${colors.text}`}>{percentage}%</span>
                          <div className="text-sm text-slate-500 mt-1">
                            {votes[topic.id]?.[option.id] || 0} ääntä
                          </div>
                        </div>

                        {myClicks > 0 && (
                          <div className={`px-3 py-1 rounded-full ${colors.bg} bg-opacity-20 ${colors.text} text-sm font-semibold`}>
                            Sinä: {myClicks}
                          </div>
                        )}
                      </div>

                      {/* Winning badge */}
                      {isWinning && (
                        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full ${colors.bg} text-black text-xs font-bold`}>
                          JOHDOSSA
                        </div>
                      )}
                    </div>

                    {/* Hover effect */}
                    <div className={`absolute inset-0 border-2 ${colors.border} opacity-0 group-hover:opacity-100 transition-opacity rounded-none`} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        </div>

        {/* Customer disclaimer */}
        <div className="mt-12 p-6 bg-gradient-to-br from-rose-900/20 to-slate-900/50 rounded-2xl border border-rose-500/20 text-center">
          <h3 className="text-lg font-bold text-white mb-2">⚠️ Huomautus</h3>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
            Tämä äänestys on täysin sitova.*
            <span className="text-rose-400 font-medium"> Pertin kohtalo on nyt käsissänne.</span>
          </p>
          <p className="mt-3 text-xs text-slate-600">
            *Ei oikeasti sitova. Mutta luetaan kyllä. Ehkä.
          </p>
        </div>
      </div>

      {/* Bottom sticky bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-400">
              Yhteensä <span className="text-white font-bold">
                {Object.values(votes).reduce((sum, topic) =>
                  sum + Object.values(topic).reduce((s, v) => s + v, 0), 0
                )}
              </span> ääntä
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <div className="text-sm text-slate-500">
              Päivittyy reaaliajassa
            </div>
          </div>

          {achievements.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Saavutukset:</span>
              {achievements.slice(-5).map(achId => {
                const achMap = {
                  '10clicks': '👆',
                  '50clicks': '🔥',
                  '100clicks': '🗳️',
                  '500clicks': '🏆',
                  'streak10': '⚡'
                };
                return (
                  <span key={achId} className="text-xl" title={achId}>
                    {achMap[achId]}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VotingPage;
