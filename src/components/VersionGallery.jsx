// ============================================================================
// VERSION GALLERY COMPONENT
// ============================================================================
// Näyttää kaikki moduulin versiot - päämalli ja testiversiot

import React, { useState, useEffect, useContext } from 'react';
import { getVersions, voteVersion, incrementViewCount, generateFingerprint, promoteVersion, deleteVersion } from '../lib/supabase';
import AuthContext from '../contexts/AuthContext';

// ============================================================================
// VERSION CARD
// ============================================================================
function VersionCard({ version, isFabOS, onSelect, onVote, isSelected }) {
  const isStable = version.version_type === 'stable';
  const fingerprint = generateFingerprint();
  const deploymentStatus = version.deployment_status || 'config_only';

  const handleVote = async (e, type) => {
    e.stopPropagation();
    await onVote(version.id, type, fingerprint);
  };

  // Deployment status badge config
  const statusConfig = {
    pending: { icon: '⏳', text: 'Jonossa', className: isFabOS ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-400' },
    generating: { icon: '⚙️', text: 'Generoidaan', className: isFabOS ? 'bg-purple-100 text-purple-700 animate-pulse' : 'bg-purple-500/20 text-purple-400 animate-pulse' },
    deployed: { icon: '🚀', text: 'Deployattu', className: isFabOS ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-400' },
    failed: { icon: '❌', text: 'Epäonnistui', className: isFabOS ? 'bg-red-100 text-red-700' : 'bg-red-500/20 text-red-400' },
    config_only: null
  };

  const statusInfo = statusConfig[deploymentStatus];

  return (
    <div
      onClick={() => onSelect(version)}
      className={`relative rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.02] ${
        isSelected
          ? isFabOS
            ? 'ring-2 ring-[#FF6B35] bg-[#FF6B35]/5'
            : 'ring-2 ring-emerald-500 bg-emerald-500/10'
          : isFabOS
            ? 'bg-white border border-gray-200 hover:border-gray-300'
            : 'bg-slate-800 border border-slate-700 hover:border-slate-600'
      }`}
    >
      {/* Deployment status badge (top left) */}
      {statusInfo && (
        <div className={`absolute -top-2 -left-2 px-2 py-0.5 rounded-full text-xs font-bold ${statusInfo.className}`}>
          {statusInfo.icon} {statusInfo.text}
        </div>
      )}

      {/* Version type badge (top right) */}
      <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold ${
        isStable
          ? 'bg-green-500 text-white'
          : isFabOS
            ? 'bg-amber-100 text-amber-700 border border-amber-200'
            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
      }`}>
        {isStable ? '✓ Päämalli' : '🧪 Testi'}
      </div>

      {/* Header */}
      <div className="mb-3">
        <h3 className={`font-semibold text-sm ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
          {version.name}
        </h3>
        <p className={`text-xs mt-1 ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>
          v{version.version_number}
        </p>
      </div>

      {/* Description */}
      <p className={`text-xs mb-3 line-clamp-2 ${isFabOS ? 'text-gray-600' : 'text-slate-300'}`}>
        {version.description || 'Ei kuvausta'}
      </p>

      {/* Author */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
          isFabOS ? 'bg-gray-200 text-gray-600' : 'bg-slate-700 text-slate-300'
        }`}>
          {(version.author_name || version.creator_fingerprint)?.[0]?.toUpperCase() || '?'}
        </div>
        <span className={`text-xs ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>
          {version.author_name || version.creator_fingerprint || 'Tuntematon'}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Votes */}
          <button
            onClick={(e) => handleVote(e, 'up')}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
              isFabOS
                ? 'hover:bg-gray-100 text-gray-600'
                : 'hover:bg-slate-700 text-slate-400'
            }`}
          >
            <span>👍</span>
            <span>{version.votes_up || 0}</span>
          </button>

          {/* Views */}
          <span className={`text-xs ${isFabOS ? 'text-gray-400' : 'text-slate-500'}`}>
            👁 {version.view_count || 0}
          </span>

          {/* Tests */}
          <span className={`text-xs ${isFabOS ? 'text-gray-400' : 'text-slate-500'}`}>
            🧪 {version.test_count || 0}
          </span>
        </div>

        {/* Date */}
        <span className={`text-[10px] ${isFabOS ? 'text-gray-400' : 'text-slate-500'}`}>
          {new Date(version.created_at).toLocaleDateString('fi-FI')}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// VERSION DETAIL PANEL
// ============================================================================
function VersionDetail({ version, isFabOS, onTest, onClose, isUserAdmin, onPromote, onDelete }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // 'promote' | 'delete' | null

  if (!version) return null;

  const isStable = version.version_type === 'stable';
  const deploymentStatus = version.deployment_status || 'config_only';

  // Deployment status config
  const statusConfig = {
    pending: { icon: '⏳', text: 'Odottaa generointia', description: 'Koodi generoidaan pian automaattisesti', className: isFabOS ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-blue-900/30 border-blue-700 text-blue-300' },
    generating: { icon: '⚙️', text: 'AI generoi koodia', description: 'Koodimuutoksia kirjoitetaan automaattisesti', className: isFabOS ? 'bg-purple-50 border-purple-200 text-purple-700 animate-pulse' : 'bg-purple-900/30 border-purple-700 text-purple-300 animate-pulse' },
    deployed: { icon: '🚀', text: 'Deployattu tuotantoon', description: version.deployed_at ? `Otettu käyttöön ${new Date(version.deployed_at).toLocaleDateString('fi-FI')}` : 'Koodi on tuotannossa', className: isFabOS ? 'bg-green-50 border-green-200 text-green-700' : 'bg-green-900/30 border-green-700 text-green-300' },
    failed: { icon: '❌', text: 'Generointi epäonnistui', description: 'AI ei pystynyt generoimaan koodia', className: isFabOS ? 'bg-red-50 border-red-200 text-red-700' : 'bg-red-900/30 border-red-700 text-red-300' },
    config_only: { icon: '⚙️', text: 'Vain konfiguraatio', description: 'Muutokset tehty JSON-konfiguraatioon', className: isFabOS ? 'bg-gray-50 border-gray-200 text-gray-600' : 'bg-slate-700 border-slate-600 text-slate-400' }
  };

  const statusInfo = statusConfig[deploymentStatus];

  return (
    <div className={`rounded-2xl p-6 ${
      isFabOS ? 'bg-white border border-gray-200' : 'bg-slate-800 border border-slate-700'
    }`}>
      {/* Deployment status banner */}
      {statusInfo && (
        <div className={`mb-4 p-3 rounded-xl border ${statusInfo.className}`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{statusInfo.icon}</span>
            <div>
              <p className="font-medium text-sm">{statusInfo.text}</p>
              <p className="text-xs opacity-75">{statusInfo.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              isStable
                ? 'bg-green-500 text-white'
                : isFabOS
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-amber-500/20 text-amber-400'
            }`}>
              {isStable ? '✓ Päämalli' : '🧪 Testiversio'}
            </span>
            <span className={`text-xs ${isFabOS ? 'text-gray-400' : 'text-slate-500'}`}>
              v{version.version_number}
            </span>
          </div>
          <h2 className={`text-xl font-bold ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
            {version.name}
          </h2>
        </div>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg transition-colors ${
            isFabOS ? 'hover:bg-gray-100 text-gray-400' : 'hover:bg-slate-700 text-slate-400'
          }`}
        >
          ✕
        </button>
      </div>

      {/* Description */}
      <p className={`text-sm mb-4 ${isFabOS ? 'text-gray-600' : 'text-slate-300'}`}>
        {version.description || 'Ei kuvausta saatavilla.'}
      </p>

      {/* Author & Date */}
      <div className={`flex items-center gap-4 mb-4 pb-4 border-b ${
        isFabOS ? 'border-gray-200' : 'border-slate-700'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isFabOS ? 'bg-gray-200 text-gray-600' : 'bg-slate-700 text-slate-300'
          }`}>
            {(version.author_name || version.creator_fingerprint)?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className={`text-sm font-medium ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
              {version.author_name || version.creator_fingerprint || 'Tuntematon'}
            </p>
            <p className={`text-xs ${isFabOS ? 'text-gray-400' : 'text-slate-500'}`}>
              {new Date(version.created_at).toLocaleDateString('fi-FI', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className={`text-center p-3 rounded-xl ${isFabOS ? 'bg-gray-50' : 'bg-slate-900/50'}`}>
          <p className={`text-2xl font-bold ${isFabOS ? 'text-[#FF6B35]' : 'text-emerald-400'}`}>
            {version.votes_up || 0}
          </p>
          <p className={`text-xs ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>Tykkäykset</p>
        </div>
        <div className={`text-center p-3 rounded-xl ${isFabOS ? 'bg-gray-50' : 'bg-slate-900/50'}`}>
          <p className={`text-2xl font-bold ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
            {version.view_count || 0}
          </p>
          <p className={`text-xs ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>Katselut</p>
        </div>
        <div className={`text-center p-3 rounded-xl ${isFabOS ? 'bg-gray-50' : 'bg-slate-900/50'}`}>
          <p className={`text-2xl font-bold ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
            {version.test_count || 0}
          </p>
          <p className={`text-xs ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>Testaukset</p>
        </div>
      </div>

      {/* Config preview */}
      {version.config && (
        <div className={`mb-6 p-4 rounded-xl ${isFabOS ? 'bg-gray-50' : 'bg-slate-900/50'}`}>
          <h4 className={`text-xs font-medium mb-2 ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>
            Konfiguraation ominaisuudet:
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(version.config.features || {}).map(([key, value]) => (
              value && (
                <span
                  key={key}
                  className={`text-xs px-2 py-1 rounded-full ${
                    isFabOS
                      ? 'bg-green-100 text-green-700'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  ✓ {key}
                </span>
              )
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={onTest}
          className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
            isFabOS
              ? 'bg-[#FF6B35] hover:bg-[#e5612f] text-white'
              : 'bg-emerald-500 hover:bg-emerald-400 text-white'
          }`}
        >
          🚀 Testaa tätä versiota
        </button>

        {/* Admin actions */}
        {isUserAdmin && (
          <div className={`pt-3 border-t space-y-2 ${isFabOS ? 'border-gray-200' : 'border-slate-700'}`}>
            <p className={`text-xs font-medium mb-2 ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>
              Ylläpitäjän toiminnot
            </p>

            {/* Promote to stable */}
            {!isStable && (
              <button
                onClick={async () => {
                  setActionLoading('promote');
                  try {
                    await onPromote(version.id);
                  } finally {
                    setActionLoading(null);
                  }
                }}
                disabled={actionLoading === 'promote'}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                  isFabOS
                    ? 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
                    : 'bg-green-900/30 hover:bg-green-900/50 text-green-400 border border-green-700'
                } ${actionLoading === 'promote' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {actionLoading === 'promote' ? '⏳ Ylennetään...' : '⬆️ Aseta päämalliksi'}
              </button>
            )}

            {/* Delete - only for non-stable versions */}
            {!isStable && (!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                  isFabOS
                    ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                    : 'bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-700'
                }`}
              >
                🗑️ Poista versio
              </button>
            ) : (
              <div className={`p-3 rounded-xl border ${
                isFabOS ? 'bg-red-50 border-red-200' : 'bg-red-900/20 border-red-700'
              }`}>
                <p className={`text-sm font-medium mb-3 ${isFabOS ? 'text-red-700' : 'text-red-400'}`}>
                  Haluatko varmasti poistaa version "{version.name}"?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      setActionLoading('delete');
                      try {
                        await onDelete(version.id);
                      } finally {
                        setActionLoading(null);
                        setShowDeleteConfirm(false);
                      }
                    }}
                    disabled={actionLoading === 'delete'}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      isFabOS
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-red-600 hover:bg-red-500 text-white'
                    } ${actionLoading === 'delete' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {actionLoading === 'delete' ? '⏳ Poistetaan...' : 'Kyllä, poista'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      isFabOS
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    Peruuta
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isStable && (
        <p className={`text-xs text-center mt-3 ${isFabOS ? 'text-gray-400' : 'text-slate-500'}`}>
          ⚠️ Tämä on testiversio. Ominaisuudet voivat muuttua.
        </p>
      )}
    </div>
  );
}

// ============================================================================
// MAIN GALLERY COMPONENT
// ============================================================================
export default function VersionGallery({
  moduleId,
  isFabOS = false,
  onSelectVersion,
  onClose,
  currentVersionId
}) {
  // Käytetään useContext suoraan - ei kaadu jos AuthProvider puuttuu
  const authContext = useContext(AuthContext);
  const isAdmin = authContext?.isAdmin || (() => false);
  const user = authContext?.user || null;
  const [versions, setVersions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load versions
  useEffect(() => {
    loadVersions();
  }, [moduleId, filter]);

  const loadVersions = async () => {
    setIsLoading(true);
    try {
      const data = await getVersions(moduleId, filter);
      setVersions(data);
    } catch (error) {
      console.error('Error loading versions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (versionId, voteType, fingerprint) => {
    try {
      await voteVersion(versionId, voteType, fingerprint);
      // Reload versions to update counts
      loadVersions();
    } catch (error) {
      console.error('Vote error:', error);
    }
  };

  const handleSelectVersion = async (version) => {
    setSelectedVersion(version);
    try {
      await incrementViewCount(version.id);
    } catch (error) {
      console.error('View count error:', error);
    }
  };

  const handleTest = () => {
    if (selectedVersion) {
      onSelectVersion?.(selectedVersion);
    }
  };

  const handlePromote = async (versionId) => {
    try {
      await promoteVersion(versionId, user?.id);
      // Päivitä valittu versio ja lataa lista uudelleen
      setSelectedVersion(prev => prev ? { ...prev, version_type: 'stable', promoted_at: new Date().toISOString() } : null);
      loadVersions();
    } catch (error) {
      console.error('Promote error:', error);
      alert('Ylennys epäonnistui: ' + error.message);
    }
  };

  const handleDelete = async (versionId) => {
    try {
      await deleteVersion(versionId);
      // Sulje detail-paneeli ja päivitä lista
      setSelectedVersion(null);
      loadVersions();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Poisto epäonnistui: ' + error.message);
    }
  };

  // Separate stable and experimental versions
  const stableVersions = versions.filter(v => v.version_type === 'stable');
  const experimentalVersions = versions.filter(v => v.version_type === 'experimental');

  return (
    <div className={`flex flex-col h-full ${isFabOS ? 'bg-gray-50' : 'bg-slate-900'}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b ${
        isFabOS ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`text-xl font-bold ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
              📚 Versiogalleria
            </h2>
            <p className={`text-sm ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>
              Putkentaivutus - {versions.length} versiota
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isFabOS ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-slate-700 text-slate-400'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'Kaikki', icon: '📋' },
            { id: 'stable', label: 'Päämallit', icon: '✓' },
            { id: 'experimental', label: 'Testiversiot', icon: '🧪' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f.id
                  ? isFabOS
                    ? 'bg-[#FF6B35] text-white'
                    : 'bg-emerald-500 text-white'
                  : isFabOS
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Version list */}
        <div className={`flex-1 overflow-y-auto p-6 ${selectedVersion ? 'w-1/2' : 'w-full'}`}>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className={`animate-spin w-8 h-8 border-2 rounded-full ${
                isFabOS ? 'border-[#FF6B35] border-t-transparent' : 'border-emerald-500 border-t-transparent'
              }`}></div>
            </div>
          ) : (
            <>
              {/* Stable versions */}
              {(filter === 'all' || filter === 'stable') && stableVersions.length > 0 && (
                <div className="mb-6">
                  <h3 className={`text-sm font-semibold mb-3 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
                    ✓ Päämallit (testattu & hyväksytty)
                  </h3>
                  <div className="grid gap-4">
                    {stableVersions.map(version => (
                      <VersionCard
                        key={version.id}
                        version={version}
                        isFabOS={isFabOS}
                        isSelected={selectedVersion?.id === version.id}
                        onSelect={handleSelectVersion}
                        onVote={handleVote}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Experimental versions */}
              {(filter === 'all' || filter === 'experimental') && experimentalVersions.length > 0 && (
                <div>
                  <h3 className={`text-sm font-semibold mb-3 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
                    🧪 Testiversiot (yhteisön kehittämät)
                  </h3>
                  <div className="grid gap-4">
                    {experimentalVersions.map(version => (
                      <VersionCard
                        key={version.id}
                        version={version}
                        isFabOS={isFabOS}
                        isSelected={selectedVersion?.id === version.id}
                        onSelect={handleSelectVersion}
                        onVote={handleVote}
                      />
                    ))}
                  </div>
                </div>
              )}

              {versions.length === 0 && (
                <div className={`text-center py-12 ${isFabOS ? 'text-gray-500' : 'text-slate-500'}`}>
                  <p className="text-4xl mb-3">📭</p>
                  <p>Ei versioita tässä kategoriassa</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail panel */}
        {selectedVersion && (
          <div className={`w-1/2 p-6 border-l overflow-y-auto ${
            isFabOS ? 'bg-gray-100 border-gray-200' : 'bg-slate-800/50 border-slate-700'
          }`}>
            <VersionDetail
              version={selectedVersion}
              isFabOS={isFabOS}
              onTest={handleTest}
              onClose={() => setSelectedVersion(null)}
              isUserAdmin={isAdmin()}
              onPromote={handlePromote}
              onDelete={handleDelete}
            />
          </div>
        )}
      </div>
    </div>
  );
}
