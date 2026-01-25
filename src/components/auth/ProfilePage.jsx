// ============================================================================
// PROFILE PAGE - Käyttäjän profiilisivu
// ============================================================================
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, THEMES } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';

export default function ProfilePage({ onClose }) {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [allBadges, setAllBadges] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const isLegacy = theme === THEMES.LEGACY;

  // Hae tilastot ja badget
  useEffect(() => {
    if (user && supabase) {
      fetchStats();
      fetchBadges();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('developer_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!error) {
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchBadges = async () => {
    try {
      // Hae kaikki badget
      const { data: allBadgesData } = await supabase
        .from('badges')
        .select('*')
        .order('points', { ascending: false });

      setAllBadges(allBadgesData || []);

      // Hae käyttäjän ansaitut badget
      const { data: userBadgesData } = await supabase
        .from('user_badges')
        .select('badge_id, awarded_at')
        .eq('user_id', user.id);

      setBadges(userBadgesData || []);
    } catch (err) {
      console.error('Error fetching badges:', err);
    }
  };

  const handleSaveNickname = async () => {
    if (!nickname.trim()) {
      setError('Nimimerkki ei voi olla tyhjä');
      return;
    }

    if (nickname.trim() === profile?.nickname) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    setError('');

    const { error: updateError } = await updateProfile({ nickname: nickname.trim() });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess('Nimimerkki päivitetty!');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    }

    setSaving(false);
  };

  // Tyylit teeman mukaan
  const styles = isLegacy ? {
    bg: 'bg-slate-900',
    card: 'bg-slate-800 border-slate-700',
    title: 'text-white',
    text: 'text-slate-300',
    textMuted: 'text-slate-500',
    input: 'bg-slate-700 border-slate-600 text-white focus:border-cyan-500',
    button: 'bg-cyan-500 hover:bg-cyan-600 text-white',
    buttonSecondary: 'bg-slate-700 hover:bg-slate-600 text-slate-300',
    statBg: 'bg-slate-700/50',
    badgeBg: 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500/30',
    badgeLocked: 'bg-slate-700/30 border-slate-600',
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    divider: 'border-slate-700'
  } : {
    bg: 'bg-gray-50',
    card: 'bg-white border-gray-200 shadow-sm',
    title: 'text-gray-900',
    text: 'text-gray-700',
    textMuted: 'text-gray-500',
    input: 'bg-white border-gray-300 text-gray-900 focus:border-[#FF6B35]',
    button: 'bg-[#FF6B35] hover:bg-[#e55a2b] text-white',
    buttonSecondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    statBg: 'bg-gray-50',
    badgeBg: 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200',
    badgeLocked: 'bg-gray-100 border-gray-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    divider: 'border-gray-200'
  };

  // Muotoile päivämäärä
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fi-FI', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Tarkista onko badge ansaittu
  const isBadgeEarned = (badgeId) => {
    return badges.some(b => b.badge_id === badgeId);
  };

  // Laske kokonaispisteet
  const totalPoints = allBadges
    .filter(b => isBadgeEarned(b.id))
    .reduce((sum, b) => sum + (b.points || 0), 0);

  return (
    <div className={`min-h-screen ${styles.bg} py-8 px-4`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className={`text-3xl font-bold ${styles.title}`}>Profiili</h1>
          {onClose && (
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg transition-colors ${styles.buttonSecondary}`}
            >
              Takaisin
            </button>
          )}
        </div>

        {/* Viestit */}
        {error && (
          <div className={`mb-4 p-3 rounded-lg border ${styles.error}`}>
            {error}
          </div>
        )}
        {success && (
          <div className={`mb-4 p-3 rounded-lg border ${styles.success}`}>
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vasen kolumni - Perustiedot */}
          <div className="lg:col-span-1">
            <div className={`rounded-2xl border p-6 ${styles.card}`}>
              {/* Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold mb-4">
                  {profile?.nickname?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                </div>

                {/* Nimimerkki */}
                {isEditing ? (
                  <div className="w-full space-y-2">
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-center ${styles.input}`}
                      placeholder="Nimimerkki"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveNickname}
                        disabled={saving}
                        className={`flex-1 py-2 rounded-lg font-medium ${styles.button}`}
                      >
                        {saving ? 'Tallennetaan...' : 'Tallenna'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setNickname(profile?.nickname || '');
                          setError('');
                        }}
                        className={`flex-1 py-2 rounded-lg ${styles.buttonSecondary}`}
                      >
                        Peruuta
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <h2 className={`text-xl font-bold ${styles.title}`}>
                      {profile?.nickname || 'Ei nimimerkkiä'}
                    </h2>
                    <button
                      onClick={() => setIsEditing(true)}
                      className={`text-sm mt-1 ${styles.textMuted} hover:underline`}
                    >
                      Muokkaa nimimerkkiä
                    </button>
                  </div>
                )}
              </div>

              {/* Tiedot */}
              <div className={`space-y-3 pt-4 border-t ${styles.divider}`}>
                <div className="flex justify-between">
                  <span className={styles.textMuted}>Sähköposti</span>
                  <span className={`${styles.text} text-sm truncate ml-2`}>{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className={styles.textMuted}>Liittynyt</span>
                  <span className={styles.text}>{formatDate(profile?.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={styles.textMuted}>Pisteet</span>
                  <span className={`font-bold ${styles.title}`}>{totalPoints}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Oikea kolumni - Tilastot ja Badget */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tilastot */}
            <div className={`rounded-2xl border p-6 ${styles.card}`}>
              <h3 className={`text-lg font-bold mb-4 ${styles.title}`}>Tilastot</h3>

              {loadingStats ? (
                <div className={`text-center py-8 ${styles.textMuted}`}>
                  Ladataan tilastoja...
                </div>
              ) : stats ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <StatCard
                    label="Luodut versiot"
                    value={stats.total_versions_created || 0}
                    icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    styles={styles}
                  />
                  <StatCard
                    label="Ylennetyt"
                    value={stats.total_versions_promoted || 0}
                    icon="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    styles={styles}
                  />
                  <StatCard
                    label="Saadut äänet"
                    value={stats.total_votes_received || 0}
                    icon="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                    styles={styles}
                  />
                  <StatCard
                    label="Ylä-äänet"
                    value={stats.total_upvotes_received || 0}
                    icon="M5 15l7-7 7 7"
                    styles={styles}
                    positive
                  />
                  <StatCard
                    label="Ala-äänet"
                    value={stats.total_downvotes_received || 0}
                    icon="M19 9l-7 7-7-7"
                    styles={styles}
                    negative
                  />
                  <StatCard
                    label="Forkit"
                    value={stats.total_forks_of_my_versions || 0}
                    icon="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    styles={styles}
                  />
                </div>
              ) : (
                <div className={`text-center py-8 ${styles.textMuted}`}>
                  Ei vielä tilastoja. Aloita luomalla ensimmäinen versiosi!
                </div>
              )}
            </div>

            {/* Saavutukset */}
            <div className={`rounded-2xl border p-6 ${styles.card}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-bold ${styles.title}`}>Saavutukset</h3>
                <span className={`text-sm ${styles.textMuted}`}>
                  {badges.length} / {allBadges.length} ansaittu
                </span>
              </div>

              {allBadges.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {allBadges.map(badge => {
                    const earned = isBadgeEarned(badge.id);
                    return (
                      <div
                        key={badge.id}
                        className={`p-4 rounded-xl border transition-all ${
                          earned ? styles.badgeBg : styles.badgeLocked
                        } ${!earned && 'opacity-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{badge.icon || '🏆'}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm truncate ${earned ? styles.title : styles.textMuted}`}>
                              {badge.display_name}
                            </p>
                            <p className={`text-xs ${styles.textMuted}`}>
                              {badge.points} pistettä
                            </p>
                          </div>
                          {earned && (
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <p className={`text-xs mt-2 ${styles.textMuted}`}>
                          {badge.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`text-center py-8 ${styles.textMuted}`}>
                  Ladataan saavutuksia...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tilastokortti-komponentti
function StatCard({ label, value, icon, styles, positive, negative }) {
  return (
    <div className={`p-4 rounded-xl ${styles.statBg}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          positive ? 'bg-green-500/20 text-green-500' :
          negative ? 'bg-red-500/20 text-red-500' :
          'bg-cyan-500/20 text-cyan-500'
        }`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
        <div>
          <p className={`text-2xl font-bold ${styles.title}`}>{value}</p>
          <p className={`text-xs ${styles.textMuted}`}>{label}</p>
        </div>
      </div>
    </div>
  );
}
