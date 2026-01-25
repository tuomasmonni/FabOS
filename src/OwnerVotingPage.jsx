import React, { useState, useEffect, useCallback } from 'react';

// Käytä suhteellista polkua - toimii sekä localhostissa että Vercelissä
const API_URL = '/api';

const OwnerVotingPage = ({ onBack }) => {
  // Omistajien äänestysaiheet
  const ownerTopics = [
    {
      id: 'values',
      title: 'Arvot',
      subtitle: 'Mikä ohjaa yritystämme?',
      icon: '⚖️',
      impact: 'Yrityskulttuurin perusta',
      options: [
        { id: 'right', label: 'Oikein', emoji: '✅', color: 'emerald', description: 'Tehdään asiat oikein, vaikka se olisi vaikeampaa' },
        { id: 'wrong', label: 'Väärin', emoji: '❌', color: 'red', description: 'Tehdään asiat nopeasti, kysytään anteeksi myöhemmin' },
      ]
    },
    {
      id: 'speed',
      title: 'Kehitystahti',
      subtitle: 'Kuinka nopeasti edetään?',
      icon: '🏎️',
      impact: 'Vaikuttaa koko tiimiin',
      options: [
        { id: 'tortoise', label: 'Kilpikonna', emoji: '🐢', color: 'blue', description: 'Hidas ja varma voittaa' },
        { id: 'rocket', label: 'Raketti', emoji: '🚀', color: 'orange', description: 'Move fast and break things' },
      ]
    },
    {
      id: 'vibe',
      title: 'Fiilis',
      subtitle: 'Millainen tunnelma?',
      icon: '🎭',
      impact: 'Työpaikan henki',
      options: [
        { id: 'serious', label: 'Vakava', emoji: '🎩', color: 'slate', description: 'Ammattimaisuus edellä' },
        { id: 'chaotic', label: 'Kaaos', emoji: '🎪', color: 'purple', description: 'Luovuus kukoistaa kaaoksessa' },
      ]
    }
  ];

  const [votes, setVotes] = useState({});
  const [userClicks, setUserClicks] = useState({});
  const [clickAnimations, setClickAnimations] = useState([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [showAchievement, setShowAchievement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hae äänet palvelimelta
  const fetchVotes = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/votes?category=owner`);
      if (response.ok) {
        const data = await response.json();
        setVotes(data);
      }
    } catch (error) {
      console.error('Failed to fetch votes:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hae äänet aluksi ja pollaa säännöllisesti
  useEffect(() => {
    fetchVotes();
    const interval = setInterval(fetchVotes, 3000); // Päivitä 3s välein
    return () => clearInterval(interval);
  }, [fetchVotes]);

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
      newAchievements.push({ id: '100clicks', title: 'Hallituksen jäsen', emoji: '👑', description: '100 klikkausta!' });
    }
    if (streak >= 10 && !achievements.includes('streak10')) {
      newAchievements.push({ id: 'streak10', title: 'Combo!', emoji: '⚡', description: '10 peräkkäistä!' });
    }
    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements.map(a => a.id)]);
      setShowAchievement(newAchievements[0]);
      setTimeout(() => setShowAchievement(null), 3000);
    }
  }, [totalClicks, streak, achievements]);

  const handleVote = async (topicId, optionId, e) => {
    const now = Date.now();
    if (now - lastClickTime < 500) {
      setStreak(prev => prev + 1);
    } else {
      setStreak(1);
    }
    setLastClickTime(now);

    // Optimistinen päivitys UI:ssa
    setVotes(prev => {
      const updated = { ...prev };
      if (!updated[topicId]) updated[topicId] = {};
      updated[topicId][optionId] = (updated[topicId][optionId] || 0) + 1;
      return updated;
    });

    setUserClicks(prev => ({
      ...prev,
      [`${topicId}-${optionId}`]: (prev[`${topicId}-${optionId}`] || 0) + 1
    }));

    setTotalClicks(prev => prev + 1);

    // Lähetä palvelimelle
    try {
      const response = await fetch(`${API_URL}/votes?category=owner&topicId=${topicId}&optionId=${optionId}`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        setVotes(data.votes);
      }
    } catch (error) {
      console.error('Failed to submit vote:', error);
    }

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

  const getPercentage = (topicId, optionId) => {
    const topicVotes = votes[topicId] || {};
    const total = Object.values(topicVotes).reduce((sum, v) => sum + v, 0);
    if (total === 0) return 50;
    return Math.round((topicVotes[optionId] || 0) / total * 100);
  };

  const colorMap = {
    emerald: { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-400' },
    red: { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-400' },
    blue: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-400' },
    orange: { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-400' },
    slate: { bg: 'bg-slate-500', border: 'border-slate-500', text: 'text-slate-400' },
    purple: { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-400' },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Ladataan ääniä...</p>
        </div>
      </div>
    );
  }

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
      <header className="border-b border-amber-500/30 px-6 py-4 bg-gradient-to-r from-amber-500/5 to-transparent">
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
            <div className="flex items-center gap-2">
              <span className="text-2xl">👑</span>
              <h1 className="text-xl font-bold text-amber-400">Hallituksen Kokous</h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-black text-amber-400">{totalClicks}</div>
              <div className="text-xs text-slate-500">Sinun äänet</div>
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
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5 mb-6">
          <div className="relative">
            <div className="w-2 h-2 bg-amber-500 rounded-full" />
            <div className="absolute inset-0 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
          </div>
          <span className="text-amber-400 text-sm font-medium">Live äänestys - Oikeat luvut!</span>
        </div>

        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Strategiset
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400"> päätökset</span>
        </h2>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Omistajat päättävät yrityksen suunnasta. Jokainen klikkaus on ääni - klikkaa niin monta kertaa kuin haluat!
        </p>
      </div>

      {/* Voting topics */}
      <div className="max-w-6xl mx-auto px-6 pb-32">
        <div className="space-y-8">
          {ownerTopics.map((topic) => (
            <div key={topic.id} className="bg-slate-900/50 rounded-2xl border border-amber-500/20 overflow-hidden">
              {/* Topic header */}
              <div className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-amber-500/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl">
                      {topic.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{topic.title}</h3>
                      <p className="text-sm text-slate-500">{topic.subtitle}</p>
                    </div>
                  </div>
                  <div className="hidden md:block px-3 py-1 bg-amber-500/10 rounded-full">
                    <span className="text-amber-400 text-xs font-medium">{topic.impact}</span>
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

                        {isWinning && (
                          <div className={`absolute top-4 right-4 px-3 py-1 rounded-full ${colors.bg} text-black text-xs font-bold`}>
                            JOHDOSSA
                          </div>
                        )}
                      </div>

                      <div className={`absolute inset-0 border-2 ${colors.border} opacity-0 group-hover:opacity-100 transition-opacity rounded-none`} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-12 p-6 bg-gradient-to-br from-amber-900/20 to-slate-900/50 rounded-2xl border border-amber-500/20 text-center">
          <h3 className="text-lg font-bold text-white mb-2">Hallituksen valta</h3>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
            Omistajien äänestykset ohjaavat yrityksen strategista suuntaa.
            <span className="text-amber-400 font-medium"> Nämä päätökset vaikuttavat kaikkeen.</span>
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-amber-500/30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-400">
              Yhteensä <span className="text-amber-400 font-bold">
                {Object.values(votes).reduce((sum, topic) =>
                  sum + Object.values(topic).reduce((s, v) => s + v, 0), 0
                )}
              </span> ääntä
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <div className="text-xs text-emerald-400 flex items-center gap-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Synkronoitu palvelimen kanssa
            </div>
          </div>

          {achievements.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Saavutukset:</span>
              {achievements.map(achId => {
                const achMap = { '10clicks': '👆', '50clicks': '🔥', '100clicks': '👑', 'streak10': '⚡' };
                return <span key={achId} className="text-xl">{achMap[achId]}</span>;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerVotingPage;
