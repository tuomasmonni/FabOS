// ============================================================================
// ADMIN DASHBOARD - Käyttäjähallintasivu
// ============================================================================
import React, { useState, useEffect } from 'react';
import { useAuth, ROLES, ROLE_NAMES, ROLE_LEVELS } from '../../contexts/AuthContext';
import { useTheme, THEMES } from '../../contexts/ThemeContext';
import RoleBadge from '../auth/RoleBadge';

export default function AdminDashboard({ onClose }) {
  const { user, canManageRoles, isAdmin } = useAuth();
  const { theme } = useTheme();
  const isLegacy = theme === THEMES.LEGACY;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(null);

  // Hae Supabase-asetukset
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Tyylit teeman mukaan
  const styles = isLegacy ? {
    bg: 'bg-slate-900',
    card: 'bg-slate-800 border-slate-700',
    text: 'text-white',
    textMuted: 'text-slate-400',
    input: 'bg-slate-700 border-slate-600 text-white placeholder-slate-400',
    table: 'bg-slate-800',
    tableHeader: 'bg-slate-700',
    tableRow: 'border-slate-700 hover:bg-slate-700/50',
    button: 'bg-cyan-500 hover:bg-cyan-600 text-white',
    buttonSecondary: 'bg-slate-700 hover:bg-slate-600 text-slate-300',
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30'
  } : {
    bg: 'bg-gray-50',
    card: 'bg-white border-gray-200 shadow-sm',
    text: 'text-gray-900',
    textMuted: 'text-gray-500',
    input: 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
    table: 'bg-white',
    tableHeader: 'bg-gray-50',
    tableRow: 'border-gray-200 hover:bg-gray-50',
    button: 'bg-[#FF6B35] hover:bg-[#e55a2b] text-white',
    buttonSecondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    success: 'bg-green-50 text-green-700 border-green-200',
    error: 'bg-red-50 text-red-700 border-red-200'
  };

  // Hae käyttäjät
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      setError('Supabase ei ole konfiguroitu');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${supabaseUrl}/rest/v1/user_profiles?select=id,nickname,email,role,role_level,first_name,last_name,created_at,user_number&order=user_number.asc`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setUsers(data || []);
    } catch (err) {
      setError(`Käyttäjien haku epäonnistui: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Päivitä käyttäjän rooli
  const updateUserRole = async (userId, newRole) => {
    if (!canManageRoles()) {
      setError('Sinulla ei ole oikeuksia muuttaa rooleja');
      return;
    }

    setSaving(userId);
    setError(null);

    try {
      // Hae autentikaatiotiedot
      const { supabase } = await import('../../lib/supabase');
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token || supabaseAnonKey;

      const response = await fetch(
        `${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${accessToken}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ role: newRole })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      // Päivitä lokaali tila
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, role: newRole, role_level: ROLE_LEVELS[newRole] } : u
      ));

      setSuccess(`Käyttäjän rooli päivitetty: ${ROLE_NAMES[newRole]}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`Roolin päivitys epäonnistui: ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  // Suodata käyttäjät hakusanalla
  const filteredUsers = users.filter(u =>
    u.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Roolit dropdowniin (kaikki paitsi guest)
  const availableRoles = Object.values(ROLES).filter(role =>
    role !== ROLES.GUEST
  );

  // Muotoile päivämäärä
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fi-FI', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
  };

  // Tarkista onko admin
  if (!isAdmin || !isAdmin()) {
    return (
      <div className={`min-h-screen ${styles.bg} flex items-center justify-center p-4`}>
        <div className={`p-8 rounded-2xl border text-center ${styles.card}`}>
          <div className="text-5xl mb-4">🔒</div>
          <h2 className={`text-xl font-bold mb-2 ${styles.text}`}>Ei oikeuksia</h2>
          <p className={`mb-4 ${styles.textMuted}`}>
            Tämä sivu on vain ylläpitäjille.
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium ${styles.button}`}
            >
              Takaisin
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${styles.bg} p-4 sm:p-6`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${styles.text}`}>Hallintapaneeli</h1>
            <p className={`${styles.textMuted}`}>Käyttäjien ja roolien hallinta</p>
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

        {/* Haku */}
        <div className={`mb-6 p-4 rounded-xl border ${styles.card}`}>
          <div className="flex items-center gap-3">
            <svg className={`w-5 h-5 ${styles.textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Etsi käyttäjää nimellä tai sähköpostilla..."
              className={`flex-1 px-3 py-2 rounded-lg border ${styles.input}`}
            />
          </div>
        </div>

        {/* Tilastot */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-xl border ${styles.card}`}>
            <p className={`text-2xl font-bold ${styles.text}`}>{users.length}</p>
            <p className={`text-sm ${styles.textMuted}`}>Käyttäjiä yhteensä</p>
          </div>
          <div className={`p-4 rounded-xl border ${styles.card}`}>
            <p className={`text-2xl font-bold ${styles.text}`}>
              {users.filter(u => u.role === 'admin' || u.role === 'owner' || u.role === 'super_admin').length}
            </p>
            <p className={`text-sm ${styles.textMuted}`}>Ylläpitäjiä</p>
          </div>
          <div className={`p-4 rounded-xl border ${styles.card}`}>
            <p className={`text-2xl font-bold ${styles.text}`}>
              {users.filter(u => u.role === 'beta_tester').length}
            </p>
            <p className={`text-sm ${styles.textMuted}`}>Beta-testaajia</p>
          </div>
          <div className={`p-4 rounded-xl border ${styles.card}`}>
            <p className={`text-2xl font-bold ${styles.text}`}>
              {users.filter(u => u.role === 'developer').length}
            </p>
            <p className={`text-sm ${styles.textMuted}`}>Kehittäjiä</p>
          </div>
        </div>

        {/* Käyttäjätaulukko */}
        <div className={`rounded-xl border overflow-hidden ${styles.card}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={styles.tableHeader}>
                <tr>
                  <th className={`text-left p-4 font-medium ${styles.text} w-16`}>#</th>
                  <th className={`text-left p-4 font-medium ${styles.text}`}>Käyttäjä</th>
                  <th className={`text-left p-4 font-medium ${styles.text} hidden sm:table-cell`}>Sähköposti</th>
                  <th className={`text-left p-4 font-medium ${styles.text}`}>Rooli</th>
                  <th className={`text-left p-4 font-medium ${styles.text} hidden md:table-cell`}>Liittynyt</th>
                  {canManageRoles() && (
                    <th className={`text-left p-4 font-medium ${styles.text}`}>Toiminnot</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className={`p-8 text-center ${styles.textMuted}`}>
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Ladataan käyttäjiä...
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={`p-8 text-center ${styles.textMuted}`}>
                      {searchQuery ? 'Ei hakutuloksia' : 'Ei käyttäjiä'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u.id} className={`border-t ${styles.tableRow}`}>
                      <td className={`p-4 ${styles.text}`}>
                        <span className={`font-mono font-bold ${isLegacy ? 'text-cyan-400' : 'text-[#FF6B35]'}`}>
                          #{u.user_number || '-'}
                        </span>
                      </td>
                      <td className={`p-4 ${styles.text}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                            {u.nickname?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium">{u.nickname || 'Ei nimimerkkiä'}</p>
                            {(u.first_name || u.last_name) && (
                              <p className={`text-sm ${styles.textMuted}`}>
                                {[u.first_name, u.last_name].filter(Boolean).join(' ')}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={`p-4 hidden sm:table-cell ${styles.textMuted}`}>
                        <span className="text-sm">{u.email}</span>
                      </td>
                      <td className="p-4">
                        <RoleBadge role={u.role} size="sm" />
                        {u.role === 'user' && (
                          <span className={`text-sm ${styles.textMuted}`}>Käyttäjä</span>
                        )}
                      </td>
                      <td className={`p-4 hidden md:table-cell ${styles.textMuted}`}>
                        {formatDate(u.created_at)}
                      </td>
                      {canManageRoles() && (
                        <td className="p-4">
                          {u.id === user?.id ? (
                            <span className={`text-sm ${styles.textMuted}`}>Sinä</span>
                          ) : (
                            <select
                              value={u.role || 'user'}
                              onChange={(e) => updateUserRole(u.id, e.target.value)}
                              disabled={saving === u.id}
                              className={`px-2 py-1 rounded-lg border text-sm ${styles.input} ${
                                saving === u.id ? 'opacity-50 cursor-wait' : ''
                              }`}
                            >
                              {availableRoles.map(role => (
                                <option key={role} value={role}>
                                  {ROLE_NAMES[role]}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Roolitiedot */}
        <div className={`mt-6 p-4 rounded-xl border ${styles.card}`}>
          <h3 className={`font-bold mb-3 ${styles.text}`}>Roolien kuvaukset</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(ROLE_NAMES).filter(([key]) => key !== 'guest').map(([role, name]) => (
              <div key={role} className="flex items-center gap-2">
                <RoleBadge role={role} size="xs" showLabel={false} />
                <span className={styles.text}>{name}</span>
                <span className={`text-xs ${styles.textMuted}`}>
                  (taso {ROLE_LEVELS[role]})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
