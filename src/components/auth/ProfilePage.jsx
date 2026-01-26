// ============================================================================
// PROFILE PAGE - Käyttäjän profiilisivu
// ============================================================================
import React, { useState, useEffect } from 'react';
import { useAuth, ROLE_NAMES } from '../../contexts/AuthContext';
import { useTheme, THEMES } from '../../contexts/ThemeContext';
import { supabase, getUserVersions, watchVersionStatus } from '../../lib/supabase';
import RoleBadge from './RoleBadge';

// ============================================================================
// DEPLOYMENT STATUS BADGE
// ============================================================================
function DeploymentStatusBadge({ status, isLegacy }) {
  const statusConfig = {
    config_only: { label: 'Vain config', color: 'gray', icon: '⚙️' },
    pending: { label: 'Odottaa...', color: 'amber', icon: '⏳', animate: true },
    generating: { label: 'Generoidaan', color: 'blue', icon: '🔄', animate: true },
    deployed: { label: 'Valmis', color: 'green', icon: '✅' },
    failed: { label: 'Epäonnistui', color: 'red', icon: '❌' }
  };

  const config = statusConfig[status] || statusConfig.config_only;

  const colorClasses = {
    gray: isLegacy ? 'bg-slate-600/30 text-slate-400 border-slate-500' : 'bg-gray-100 text-gray-600 border-gray-200',
    amber: isLegacy ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-amber-50 text-amber-700 border-amber-200',
    blue: isLegacy ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-blue-50 text-blue-700 border-blue-200',
    green: isLegacy ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-green-50 text-green-700 border-green-200',
    red: isLegacy ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-red-50 text-red-700 border-red-200'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colorClasses[config.color]}`}>
      <span className={config.animate ? 'animate-pulse' : ''}>{config.icon}</span>
      {config.label}
    </span>
  );
}

// ============================================================================
// MY VERSIONS SECTION
// ============================================================================
function MyVersionsSection({ userEmail, styles, isLegacy }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTab, setExpandedTab] = useState('all'); // 'all', 'active', 'completed'

  console.log('[MyVersionsSection] Rendering with userEmail:', userEmail);

  useEffect(() => {
    console.log('[MyVersionsSection] useEffect - userEmail:', userEmail);
    if (userEmail) {
      loadVersions();
    } else {
      setLoading(false);
    }
  }, [userEmail]);

  // Pollaa aktiivisten versioiden statuksia
  useEffect(() => {
    const activeVersions = versions.filter(v =>
      v.deployment_status === 'pending' || v.deployment_status === 'generating'
    );

    const watchers = activeVersions.map(version =>
      watchVersionStatus(version.id, (statusData) => {
        setVersions(prev => prev.map(v =>
          v.id === version.id
            ? { ...v, deployment_status: statusData.deployment_status, deployed_at: statusData.deployed_at }
            : v
        ));
      }, 10000) // Tarkista 10s välein
    );

    return () => watchers.forEach(stop => stop?.());
  }, [versions.length]);

  const loadVersions = async () => {
    console.log('[MyVersionsSection] loadVersions called for:', userEmail);
    try {
      const data = await getUserVersions(userEmail);
      console.log('[MyVersionsSection] Loaded versions:', data?.length || 0, data);
      setVersions(data || []);
    } catch (error) {
      console.error('[MyVersionsSection] Error loading versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fi-FI', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getModuleName = (moduleId) => {
    const modules = {
      'pipe-bending': 'Putkentaivutus',
      'grating': 'Ritilät',
      'stair': 'Portaat'
    };
    return modules[moduleId] || moduleId;
  };

  // Mappia moduuli-ID:stä URL-versioksi
  const getVersionUrlId = (moduleId) => {
    const moduleToVersion = {
      'pipe-bending': 'v03',
      'grating': 'v04',
      'stair': 'v06'
    };
    return moduleToVersion[moduleId] || 'v03';
  };

  // Suodata versiot tabin mukaan
  const filteredVersions = versions.filter(v => {
    if (expandedTab === 'active') {
      return v.deployment_status === 'pending' || v.deployment_status === 'generating';
    }
    if (expandedTab === 'completed') {
      return v.deployment_status === 'deployed' || v.deployment_status === 'failed' || v.deployment_status === 'config_only';
    }
    return true;
  });

  const activeCount = versions.filter(v =>
    v.deployment_status === 'pending' || v.deployment_status === 'generating'
  ).length;

  if (loading) {
    return (
      <div className={`rounded-2xl border p-6 ${styles.card}`}>
        <h3 className={`text-lg font-bold mb-4 ${styles.title}`}>Omat päivitykset</h3>
        <div className={`text-center py-8 ${styles.textMuted}`}>
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Ladataan versioita...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-6 ${styles.card}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-bold ${styles.title}`}>Omat päivitykset</h3>
        {activeCount > 0 && (
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
            isLegacy ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
          }`}>
            {activeCount} aktiivista
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'all', label: 'Kaikki', count: versions.length },
          { key: 'active', label: 'Käynnissä', count: activeCount },
          { key: 'completed', label: 'Valmiit', count: versions.length - activeCount }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setExpandedTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              expandedTab === tab.key
                ? isLegacy
                  ? 'bg-cyan-500 text-white'
                  : 'bg-[#FF6B35] text-white'
                : isLegacy
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {filteredVersions.length === 0 ? (
        <div className={`text-center py-8 ${styles.textMuted}`}>
          {expandedTab === 'active'
            ? 'Ei aktiivisia päivityksiä.'
            : expandedTab === 'completed'
              ? 'Ei valmiita päivityksiä.'
              : 'Et ole vielä luonut päivityksiä. Aloita kehittäminen moduuleissa!'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVersions.map(version => (
            <div
              key={version.id}
              className={`p-4 rounded-xl border transition-all hover:shadow-md ${
                isLegacy ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-medium truncate ${styles.title}`}>
                      {version.name}
                    </h4>
                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                      isLegacy ? 'bg-cyan-500/20 text-cyan-400' : 'bg-[#FF6B35]/10 text-[#FF6B35]'
                    }`}>
                      {version.version_number}
                    </span>
                  </div>
                  <p className={`text-xs mb-2 ${styles.textMuted}`}>
                    {getModuleName(version.module_id)} • {formatDate(version.created_at)}
                  </p>
                  {version.description && (
                    <p className={`text-sm line-clamp-2 ${styles.text}`}>
                      {version.description}
                    </p>
                  )}
                </div>
                <DeploymentStatusBadge status={version.deployment_status} isLegacy={isLegacy} />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-opacity-20 border-gray-500">
                {/* Näytä "Avaa" linkki kaikille versioille joilla on moduuli */}
                {version.module_id && (
                  <button
                    onClick={() => {
                      console.log('[MyVersionsSection] Button clicked for module:', version.module_id);
                      // Navigoi moduuliin päivittämällä URL ja lataamalla sivu
                      const versionUrlId = getVersionUrlId(version.module_id);
                      console.log('[MyVersionsSection] Navigating to version:', versionUrlId);
                      const url = new URL(window.location.origin);
                      url.searchParams.set('version', versionUrlId);
                      // Säilytä teema jos se on valittu
                      const currentTheme = new URLSearchParams(window.location.search).get('theme');
                      if (currentTheme) {
                        url.searchParams.set('theme', currentTheme);
                      }
                      console.log('[MyVersionsSection] Final URL:', url.toString());
                      window.location.href = url.toString();
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                      isLegacy
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-white'
                        : 'bg-[#FF6B35] hover:bg-[#e5612f] text-white'
                    }`}
                  >
                    Avaa moduuli →
                  </button>
                )}
                {/* Status-viestit */}
                {(version.deployment_status === 'pending' || version.deployment_status === 'generating') && (
                  <span className={`text-xs ${styles.textMuted} ml-2`}>
                    (Koodin generointi käynnissä...)
                  </span>
                )}
                {version.deployment_status === 'failed' && (
                  <span className={`text-xs text-red-500 ml-2`}>
                    (Generointi epäonnistui)
                  </span>
                )}
                <div className="flex-1" />
                <span className={`text-xs ${styles.textMuted}`}>
                  👁 {version.view_count || 0} • 👍 {version.votes_up || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {versions.length > 5 && (
        <div className="mt-4 text-center">
          <button className={`text-sm ${isLegacy ? 'text-cyan-400 hover:text-cyan-300' : 'text-[#FF6B35] hover:text-[#e5612f]'}`}>
            Näytä kaikki ({versions.length}) →
          </button>
        </div>
      )}
    </div>
  );
}

// Maat ja ammatit (sama kuin NicknameSetup:ssa)
const COUNTRIES = [
  { code: 'FI', name: 'Suomi' },
  { code: 'SE', name: 'Ruotsi' },
  { code: 'NO', name: 'Norja' },
  { code: 'DK', name: 'Tanska' },
  { code: 'EE', name: 'Viro' },
  { code: 'DE', name: 'Saksa' },
  { code: 'PL', name: 'Puola' },
  { code: 'GB', name: 'Iso-Britannia' },
  { code: 'US', name: 'Yhdysvallat' },
  { code: 'OTHER', name: 'Muu' }
];

const PROFESSIONS = [
  { value: 'engineer', label: 'Insinööri / Suunnittelija' },
  { value: 'production', label: 'Tuotantovastaava' },
  { value: 'sales', label: 'Myynti' },
  { value: 'management', label: 'Johto' },
  { value: 'developer', label: 'Ohjelmistokehittäjä' },
  { value: 'student', label: 'Opiskelija' },
  { value: 'entrepreneur', label: 'Yrittäjä' },
  { value: 'other', label: 'Muu' }
];

export default function ProfilePage({ onClose }) {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [country, setCountry] = useState(profile?.country || '');
  const [profession, setProfession] = useState(profile?.profession || '');
  const [company, setCompany] = useState(profile?.company || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [allBadges, setAllBadges] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const isLegacy = theme === THEMES.LEGACY;

  // Synkronoi profiilin tiedot lomakkeeseen kun profiili latautuu
  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname || '');
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setCountry(profile.country || '');
      setProfession(profile.profession || '');
      setCompany(profile.company || '');
    }
  }, [profile]);

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

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');

    const updates = {
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null,
      country: country || null,
      profession: profession || null,
      company: company.trim() || null
    };

    const { error: updateError } = await updateProfile(updates);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess('Profiilitiedot päivitetty!');
      setIsEditingProfile(false);
      setTimeout(() => setSuccess(''), 3000);
    }

    setSaving(false);
  };

  const handleCancelProfileEdit = () => {
    setIsEditingProfile(false);
    setFirstName(profile?.first_name || '');
    setLastName(profile?.last_name || '');
    setCountry(profile?.country || '');
    setProfession(profile?.profession || '');
    setCompany(profile?.company || '');
    setError('');
  };

  // Helper funktiot
  const getCountryName = (code) => {
    const country = COUNTRIES.find(c => c.code === code);
    return country?.name || code || '-';
  };

  const getProfessionLabel = (value) => {
    const prof = PROFESSIONS.find(p => p.value === value);
    return prof?.label || value || '-';
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

                {/* Rooli-badge */}
                {profile?.role && profile.role !== 'user' && (
                  <div className="mb-2">
                    <RoleBadge role={profile.role} size="md" />
                  </div>
                )}

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

              {/* Perustiedot */}
              <div className={`space-y-3 pt-4 border-t ${styles.divider}`}>
                <div className="flex justify-between">
                  <span className={styles.textMuted}>Sähköposti</span>
                  <span className={`${styles.text} text-sm truncate ml-2`}>{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className={styles.textMuted}>Rooli</span>
                  <span className={styles.text}>
                    {ROLE_NAMES[profile?.role] || ROLE_NAMES.user}
                  </span>
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

            {/* Profiilitiedot-kortti */}
            <div className={`rounded-2xl border p-6 mt-6 ${styles.card}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-bold ${styles.title}`}>Profiilitiedot</h3>
                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className={`text-sm px-3 py-1 rounded-lg ${styles.buttonSecondary}`}
                  >
                    Muokkaa
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <div className="space-y-4">
                  {/* Etunimi ja sukunimi */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${styles.textMuted}`}>
                        Etunimi
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${styles.input}`}
                        placeholder="Etunimi"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${styles.textMuted}`}>
                        Sukunimi
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${styles.input}`}
                        placeholder="Sukunimi"
                      />
                    </div>
                  </div>

                  {/* Maa */}
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${styles.textMuted}`}>
                      Maa
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${styles.input}`}
                    >
                      <option value="">Valitse maa...</option>
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Ammatti */}
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${styles.textMuted}`}>
                      Ammatti
                    </label>
                    <select
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${styles.input}`}
                    >
                      <option value="">Valitse ammatti...</option>
                      {PROFESSIONS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Yritys */}
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${styles.textMuted}`}>
                      Yritys <span className={styles.textMuted}>(valinnainen)</span>
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${styles.input}`}
                      placeholder="Yrityksen nimi"
                    />
                  </div>

                  {/* Toimintopainikkeet */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className={`flex-1 py-2 rounded-lg font-medium ${styles.button}`}
                    >
                      {saving ? 'Tallennetaan...' : 'Tallenna'}
                    </button>
                    <button
                      onClick={handleCancelProfileEdit}
                      className={`flex-1 py-2 rounded-lg ${styles.buttonSecondary}`}
                    >
                      Peruuta
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={styles.textMuted}>Nimi</span>
                    <span className={styles.text}>
                      {profile?.first_name || profile?.last_name
                        ? `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={styles.textMuted}>Maa</span>
                    <span className={styles.text}>{getCountryName(profile?.country)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={styles.textMuted}>Ammatti</span>
                    <span className={styles.text}>{getProfessionLabel(profile?.profession)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={styles.textMuted}>Yritys</span>
                    <span className={styles.text}>{profile?.company || '-'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Oikea kolumni - Tilastot ja Badget */}
          <div className="lg:col-span-2 space-y-6">
            {/* Omat päivitykset */}
            <MyVersionsSection
              userEmail={user?.email}
              styles={styles}
              isLegacy={isLegacy}
            />

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
