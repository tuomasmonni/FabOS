// ============================================================================
// MY VERSIONS PAGE - Käyttäjän omat versiot -sivu
// ============================================================================
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, THEMES } from '../../contexts/ThemeContext';
import { getUserVersions, watchVersionStatus, generateFingerprint, deleteVersion, updateVersionName } from '../../lib/supabase';

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
// INLINE EDIT NAME
// ============================================================================
function InlineEditName({ name, versionId, onSave, styles }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === name) {
      setEditing(false);
      setValue(name);
      return;
    }
    setSaving(true);
    try {
      await onSave(versionId, trimmed);
      setEditing(false);
    } catch (e) {
      setValue(name);
      setEditing(false);
    }
    setSaving(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') { setValue(name); setEditing(false); }
        }}
        onBlur={handleSave}
        disabled={saving}
        className={`font-semibold px-2 py-0.5 rounded border text-sm ${styles.title} ${
          saving ? 'opacity-50' : ''
        } bg-transparent border-gray-300 focus:border-[#FF6B35] focus:outline-none`}
        style={{ minWidth: 120 }}
      />
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 group">
      <h4 className={`font-semibold ${styles.title}`}>{name}</h4>
      <button
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-sm"
        title="Muokkaa nime&auml;"
      >
        ✏️
      </button>
    </span>
  );
}

// ============================================================================
// MODULE METADATA
// ============================================================================
const MODULE_META = {
  'pipe-bending': { name: 'Putkentaivutus', icon: '🔧', color: 'emerald', urlId: 'v03' },
  'laser-cutting': { name: 'Laserleikkaus', icon: '✂️', color: 'amber', urlId: 'v01' },
  'grating': { name: 'Ritil\u00e4t', icon: '🔲', color: 'red', urlId: 'v04' },
  'stair': { name: 'Portaat', icon: '🪜', color: 'emerald', urlId: 'v06' }
};

// ============================================================================
// MY VERSIONS PAGE
// ============================================================================
export default function MyVersionsPage({ onClose }) {
  const { user, isAdmin } = useAuth();
  const { theme } = useTheme();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState(null);
  const [expandedTab, setExpandedTab] = useState('all');
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isLegacy = theme === THEMES.LEGACY;
  const userEmail = user?.email;
  const fingerprint = generateFingerprint();

  useEffect(() => {
    if (userEmail || fingerprint) {
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
      const data = await getUserVersions(userEmail, fingerprint);
      setVersions(data || []);
    } catch (error) {
      console.error('Error loading versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (versionId) => {
    setDeleteLoading(true);
    try {
      await deleteVersion(versionId);
      setVersions(prev => prev.filter(v => v.id !== versionId));
      setDeletingId(null);
    } catch (error) {
      console.error('Delete error:', error);
      alert('Poisto epäonnistui: ' + error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRename = async (versionId, newName) => {
    await updateVersionName(versionId, newName);
    setVersions(prev => prev.map(v =>
      v.id === versionId ? { ...v, name: newName } : v
    ));
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

  // Ryhmitä versiot moduuleittain
  const moduleGroups = {};
  versions.forEach(v => {
    const mid = v.module_id || 'unknown';
    if (!moduleGroups[mid]) moduleGroups[mid] = [];
    moduleGroups[mid].push(v);
  });

  // Valitun moduulin versiot
  const moduleVersions = selectedModule ? (moduleGroups[selectedModule] || []) : [];
  const filteredVersions = moduleVersions.filter(v => {
    if (expandedTab === 'active') {
      return v.deployment_status === 'pending' || v.deployment_status === 'generating';
    }
    if (expandedTab === 'completed') {
      return v.deployment_status === 'deployed' || v.deployment_status === 'failed' || v.deployment_status === 'config_only';
    }
    return true;
  });

  const activeCount = moduleVersions.filter(v =>
    v.deployment_status === 'pending' || v.deployment_status === 'generating'
  ).length;

  const totalActiveCount = versions.filter(v =>
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
              {selectedModule
                ? `${MODULE_META[selectedModule]?.name || selectedModule} — ${moduleVersions.length} versiota`
                : 'Hallitse luomiasi versioita ja seuraa niiden tilaa'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedModule && (
              <button
                onClick={() => { setSelectedModule(null); setExpandedTab('all'); }}
                className={`px-4 py-2 rounded-lg transition-colors ${styles.buttonSecondary}`}
              >
                ← Moduulit
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-lg transition-colors ${styles.buttonSecondary}`}
              >
                Sulje
              </button>
            )}
          </div>
        </div>

        {/* Tilastokortit */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className={`rounded-xl border p-4 ${styles.card}`}>
            <p className={`text-2xl font-bold ${styles.title}`}>{versions.length}</p>
            <p className={`text-sm ${styles.textMuted}`}>Yhteens&auml;</p>
          </div>
          <div className={`rounded-xl border p-4 ${styles.card}`}>
            <p className={`text-2xl font-bold ${isLegacy ? 'text-amber-400' : 'text-amber-600'}`}>{totalActiveCount}</p>
            <p className={`text-sm ${styles.textMuted}`}>K&auml;ynniss&auml;</p>
          </div>
          <div className={`rounded-xl border p-4 ${styles.card}`}>
            <p className={`text-2xl font-bold ${isLegacy ? 'text-green-400' : 'text-green-600'}`}>
              {versions.filter(v => v.deployment_status === 'deployed').length}
            </p>
            <p className={`text-sm ${styles.textMuted}`}>Valmiita</p>
          </div>
        </div>

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
        ) : !selectedModule ? (
          /* ============ MODULE CARDS VIEW ============ */
          <div>
            {Object.keys(moduleGroups).length === 0 ? (
              <div className={`rounded-2xl border p-12 text-center ${styles.card}`}>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className={`font-medium mb-1 ${styles.title}`}>Et ole viel&auml; luonut versioita</p>
                <p className={`text-sm ${styles.textMuted}`}>Aloita luomalla ensimm&auml;inen versiosi moduuleissa!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(moduleGroups).map(([moduleId, moduleVersionsList]) => {
                  const meta = MODULE_META[moduleId] || { name: moduleId, icon: '📦', color: 'gray' };
                  const activeInModule = moduleVersionsList.filter(v =>
                    v.deployment_status === 'pending' || v.deployment_status === 'generating'
                  ).length;
                  const deployedInModule = moduleVersionsList.filter(v => v.deployment_status === 'deployed').length;

                  return (
                    <button
                      key={moduleId}
                      onClick={() => setSelectedModule(moduleId)}
                      className={`p-6 rounded-2xl border text-left transition-all hover:shadow-lg hover:scale-[1.02] ${styles.card}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-3xl">{meta.icon}</span>
                        <span className={`text-2xl font-bold ${styles.title}`}>{moduleVersionsList.length}</span>
                      </div>
                      <h3 className={`text-lg font-bold mb-1 ${styles.title}`}>{meta.name}</h3>
                      <div className={`flex items-center gap-3 text-sm ${styles.textMuted}`}>
                        {deployedInModule > 0 && <span>✅ {deployedInModule} valmista</span>}
                        {activeInModule > 0 && <span className="text-amber-600">⏳ {activeInModule} k&auml;ynniss&auml;</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ============ VERSION LIST VIEW (moduulin sisällä) ============ */
          <div className={`rounded-2xl border p-6 ${styles.card}`}>
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              {[
                { key: 'all', label: 'Kaikki', count: moduleVersions.length },
                { key: 'active', label: 'K\u00e4ynniss\u00e4', count: activeCount },
                { key: 'completed', label: 'Valmiit', count: moduleVersions.length - activeCount }
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
            {filteredVersions.length === 0 ? (
              <div className={`text-center py-12 ${styles.textMuted}`}>
                <p className="font-medium mb-1">
                  {expandedTab === 'active'
                    ? 'Ei aktiivisia p\u00e4ivityksi\u00e4'
                    : expandedTab === 'completed'
                      ? 'Ei valmiita p\u00e4ivityksi\u00e4'
                      : 'Ei versioita t\u00e4ss\u00e4 moduulissa'}
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
                          <InlineEditName
                            name={version.name}
                            versionId={version.id}
                            onSave={handleRename}
                            styles={styles}
                          />
                          <span className={`text-xs font-mono px-2 py-0.5 rounded ${styles.versionBadge}`}>
                            {version.version_number}
                          </span>
                        </div>
                        <div className={`text-sm mb-3 ${styles.textMuted}`}>
                          <span>Luotu: {formatDate(version.created_at)}</span>
                          {version.deployed_at && (
                            <span> · Online: {formatDate(version.deployed_at)}</span>
                          )}
                        </div>
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
                            const urlId = MODULE_META[version.module_id]?.urlId || 'v03';
                            const url = new URL(window.location.origin);
                            url.searchParams.set('version', urlId);
                            window.location.href = url.toString();
                          }}
                          className={`text-sm px-4 py-2 rounded-lg font-medium transition-all ${styles.button}`}
                        >
                          Avaa moduuli →
                        </button>
                      )}
                      {(version.deployment_status === 'pending' || version.deployment_status === 'generating') && (
                        <span className={`text-sm ${styles.textMuted}`}>
                          Koodin generointi k&auml;ynniss&auml;...
                        </span>
                      )}
                      {version.deployment_status === 'failed' && (
                        <span className="text-sm text-red-500">
                          Generointi ep&auml;onnistui
                        </span>
                      )}
                      <div className="flex-1" />
                      <div className={`flex items-center gap-4 text-sm ${styles.textMuted}`}>
                        <span>👁 {version.view_count || 0}</span>
                        <span>👍 {version.votes_up || 0}</span>
                        <span>👎 {version.votes_down || 0}</span>
                      </div>
                      {/* Delete button - vain admin, ei pääversioille */}
                      {isAdmin() && version.version_type !== 'stable' && (
                        deletingId !== version.id ? (
                          <button
                            onClick={() => setDeletingId(version.id)}
                            className={`text-sm px-3 py-1.5 rounded-lg transition-all ${
                              isLegacy
                                ? 'text-red-400 hover:bg-red-500/20'
                                : 'text-red-500 hover:bg-red-50'
                            }`}
                            title="Poista versio"
                          >
                            🗑️
                          </button>
                        ) : (
                          <div className={`flex items-center gap-2`}>
                            <span className={`text-xs ${styles.textMuted}`}>Poista?</span>
                            <button
                              onClick={() => handleDelete(version.id)}
                              disabled={deleteLoading}
                              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                                isLegacy
                                  ? 'bg-red-600 hover:bg-red-500 text-white'
                                  : 'bg-red-600 hover:bg-red-700 text-white'
                              } ${deleteLoading ? 'opacity-50' : ''}`}
                            >
                              {deleteLoading ? '...' : 'Kyll\u00e4'}
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className={`text-xs px-3 py-1.5 rounded-lg transition-all ${styles.buttonSecondary}`}
                            >
                              Ei
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
