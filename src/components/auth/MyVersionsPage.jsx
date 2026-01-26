// ============================================================================
// MY VERSIONS PAGE - Käyttäjän omat versiot -sivu
// ============================================================================
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, THEMES } from '../../contexts/ThemeContext';
import { getUserVersions, watchVersionStatus } from '../../lib/supabase';

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
// MY VERSIONS PAGE
// ============================================================================
export default function MyVersionsPage({ onClose }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTab, setExpandedTab] = useState('all');

  const isLegacy = theme === THEMES.LEGACY;
  const userEmail = user?.email;

  useEffect(() => {
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
      }, 10000)
    );

    return () => watchers.forEach(stop => stop?.());
  }, [versions.length]);

  const loadVersions = async () => {
    try {
      const data = await getUserVersions(userEmail);
      setVersions(data || []);
    } catch (error) {
      console.error('Error loading versions:', error);
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
      'laser-cutting': 'Laserleikkaus',
      'grating': 'Ritilät',
      'stair': 'Portaat'
    };
    return modules[moduleId] || moduleId;
  };

  const getVersionUrlId = (moduleId) => {
    const moduleToVersion = {
      'pipe-bending': 'v03',
      'laser-cutting': 'v01',
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

  // Tyylit teeman mukaan
  const styles = isLegacy ? {
    bg: 'bg-slate-900',
    card: 'bg-slate-800 border-slate-700',
    title: 'text-white',
    text: 'text-slate-300',
    textMuted: 'text-slate-500',
    button: 'bg-cyan-500 hover:bg-cyan-600 text-white',
    buttonSecondary: 'bg-slate-700 hover:bg-slate-600 text-slate-300',
    tabActive: 'bg-cyan-500 text-white',
    tabInactive: 'bg-slate-700 text-slate-300 hover:bg-slate-600',
    versionCard: 'bg-slate-700/50 border-slate-600',
    versionBadge: 'bg-cyan-500/20 text-cyan-400'
  } : {
    bg: 'bg-gray-50',
    card: 'bg-white border-gray-200 shadow-sm',
    title: 'text-gray-900',
    text: 'text-gray-700',
    textMuted: 'text-gray-500',
    button: 'bg-[#FF6B35] hover:bg-[#e55a2b] text-white',
    buttonSecondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    tabActive: 'bg-[#FF6B35] text-white',
    tabInactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
    versionCard: 'bg-gray-50 border-gray-200',
    versionBadge: 'bg-[#FF6B35]/10 text-[#FF6B35]'
  };

  return (
    <div className={`min-h-screen ${styles.bg} py-8 px-4`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${styles.title}`}>Omat versiot</h1>
            <p className={`mt-1 ${styles.textMuted}`}>
              Hallitse luomiasi versioita ja seuraa niiden tilaa
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg transition-colors ${styles.buttonSecondary}`}
            >
              Takaisin
            </button>
          )}
        </div>

        {/* Tilastokortit */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className={`rounded-xl border p-4 ${styles.card}`}>
            <p className={`text-2xl font-bold ${styles.title}`}>{versions.length}</p>
            <p className={`text-sm ${styles.textMuted}`}>Yhteensä</p>
          </div>
          <div className={`rounded-xl border p-4 ${styles.card}`}>
            <p className={`text-2xl font-bold ${isLegacy ? 'text-amber-400' : 'text-amber-600'}`}>{activeCount}</p>
            <p className={`text-sm ${styles.textMuted}`}>Käynnissä</p>
          </div>
          <div className={`rounded-xl border p-4 ${styles.card}`}>
            <p className={`text-2xl font-bold ${isLegacy ? 'text-green-400' : 'text-green-600'}`}>
              {versions.filter(v => v.deployment_status === 'deployed').length}
            </p>
            <p className={`text-sm ${styles.textMuted}`}>Valmiita</p>
          </div>
        </div>

        {/* Pääkortti */}
        <div className={`rounded-2xl border p-6 ${styles.card}`}>
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {[
              { key: 'all', label: 'Kaikki', count: versions.length },
              { key: 'active', label: 'Käynnissä', count: activeCount },
              { key: 'completed', label: 'Valmiit', count: versions.length - activeCount }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setExpandedTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  expandedTab === tab.key ? styles.tabActive : styles.tabInactive
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Versiolista */}
          {loading ? (
            <div className={`text-center py-12 ${styles.textMuted}`}>
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Ladataan versioita...
              </div>
            </div>
          ) : filteredVersions.length === 0 ? (
            <div className={`text-center py-12 ${styles.textMuted}`}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="font-medium mb-1">
                {expandedTab === 'active'
                  ? 'Ei aktiivisia päivityksiä'
                  : expandedTab === 'completed'
                    ? 'Ei valmiita päivityksiä'
                    : 'Et ole vielä luonut versioita'}
              </p>
              <p className="text-sm">
                {expandedTab === 'all' && 'Aloita luomalla ensimmäinen versiosi moduuleissa!'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVersions.map(version => (
                <div
                  key={version.id}
                  className={`p-5 rounded-xl border transition-all hover:shadow-md ${styles.versionCard}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className={`font-semibold ${styles.title}`}>
                          {version.name}
                        </h4>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded ${styles.versionBadge}`}>
                          {version.version_number}
                        </span>
                      </div>
                      <p className={`text-sm mb-3 ${styles.textMuted}`}>
                        {getModuleName(version.module_id)} • {formatDate(version.created_at)}
                      </p>
                      {version.description && (
                        <p className={`text-sm ${styles.text}`}>
                          {version.description}
                        </p>
                      )}
                    </div>
                    <DeploymentStatusBadge status={version.deployment_status} isLegacy={isLegacy} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-opacity-20 border-gray-500">
                    {version.module_id && (
                      <button
                        onClick={() => {
                          const versionUrlId = getVersionUrlId(version.module_id);
                          const url = new URL(window.location.origin);
                          url.searchParams.set('version', versionUrlId);
                          window.location.href = url.toString();
                        }}
                        className={`text-sm px-4 py-2 rounded-lg font-medium transition-all ${styles.button}`}
                      >
                        Avaa moduuli →
                      </button>
                    )}
                    {(version.deployment_status === 'pending' || version.deployment_status === 'generating') && (
                      <span className={`text-sm ${styles.textMuted}`}>
                        Koodin generointi käynnissä...
                      </span>
                    )}
                    {version.deployment_status === 'failed' && (
                      <span className="text-sm text-red-500">
                        Generointi epäonnistui
                      </span>
                    )}
                    <div className="flex-1" />
                    <div className={`flex items-center gap-4 text-sm ${styles.textMuted}`}>
                      <span>👁 {version.view_count || 0}</span>
                      <span>👍 {version.votes_up || 0}</span>
                      <span>👎 {version.votes_down || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
