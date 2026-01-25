// ============================================================================
// VERSION GALLERY COMPONENT
// ============================================================================
// Näyttää kaikki moduulin versiot - päämalli ja testiversiot

import React, { useState, useEffect } from 'react';
import { getVersions, voteVersion, incrementViewCount, generateFingerprint } from '../lib/supabase';

// ============================================================================
// VERSION CARD
// ============================================================================
function VersionCard({ version, isFabOS, onSelect, onVote, isSelected }) {
  const isStable = version.version_type === 'stable';
  const fingerprint = generateFingerprint();

  const handleVote = async (e, type) => {
    e.stopPropagation();
    await onVote(version.id, type, fingerprint);
  };

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
      {/* Badge */}
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
function VersionDetail({ version, isFabOS, onTest, onClose }) {
  if (!version) return null;

  const isStable = version.version_type === 'stable';

  return (
    <div className={`rounded-2xl p-6 ${
      isFabOS ? 'bg-white border border-gray-200' : 'bg-slate-800 border border-slate-700'
    }`}>
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
      <div className="flex gap-3">
        <button
          onClick={onTest}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
            isFabOS
              ? 'bg-[#FF6B35] hover:bg-[#e5612f] text-white'
              : 'bg-emerald-500 hover:bg-emerald-400 text-white'
          }`}
        >
          🚀 Testaa tätä versiota
        </button>
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
          <div className={`w-1/2 p-6 border-l ${
            isFabOS ? 'bg-gray-100 border-gray-200' : 'bg-slate-800/50 border-slate-700'
          }`}>
            <VersionDetail
              version={selectedVersion}
              isFabOS={isFabOS}
              onTest={handleTest}
              onClose={() => setSelectedVersion(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
