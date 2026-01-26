// ============================================================================
// AUTH CONTEXT - Käyttäjän autentikaatio ja profiilinhallinta
// ============================================================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================================
// ROOLIVAKIOT JA -TYYPIT
// ============================================================================

// Roolien nimet (käytetään koodissa)
export const ROLES = {
  GUEST: 'guest',
  USER: 'user',
  BETA_TESTER: 'beta_tester',
  DEVELOPER: 'developer',
  STAFF: 'staff',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
  OWNER: 'owner',
  SUPER_ADMIN: 'super_admin'
};

// Roolien numeeriset tasot hierarkiavertailuja varten
export const ROLE_LEVELS = {
  guest: 0,
  user: 1,
  beta_tester: 2,
  developer: 3,
  staff: 4,
  moderator: 5,
  admin: 6,
  owner: 7,
  super_admin: 8
};

// Roolien suomenkieliset nimet
export const ROLE_NAMES = {
  guest: 'Vieras',
  user: 'Käyttäjä',
  beta_tester: 'Beta-testaaja',
  developer: 'Kehittäjä',
  staff: 'Henkilökunta',
  moderator: 'Moderaattori',
  admin: 'Ylläpitäjä',
  owner: 'Omistaja',
  super_admin: 'Pääkäyttäjä'
};

// Roolien värit (Tailwind-luokat)
export const ROLE_COLORS = {
  guest: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },
  user: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  beta_tester: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  developer: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  staff: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  moderator: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  admin: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  owner: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
  super_admin: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' }
};

// Roolien ikonit
export const ROLE_ICONS = {
  guest: '👤',
  user: '👤',
  beta_tester: '🧪',
  developer: '💻',
  staff: '👔',
  moderator: '🛡️',
  admin: '⚙️',
  owner: '👑',
  super_admin: '🔐'
};

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  useEffect(() => {
    // Tarkista nykyinen sessio
    checkSession();

    // Kuuntele auth-muutoksia
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.email);
          setUser(session?.user ?? null);

          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
          }
        }
      );

      return () => subscription?.unsubscribe();
    }
  }, []);

  // Tarkista onko käyttäjä kirjautunut
  const checkSession = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Hae käyttäjän profiili - käytetään suoraa REST API kutsua välttääksemme schema cache ongelmat
  const fetchProfile = async (userId) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) return null;

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}&select=*`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`
          }
        }
      );

      if (!response.ok) {
        console.error('Profile fetch error:', response.status);
        return null;
      }

      const dataArray = await response.json();
      const data = dataArray && dataArray.length > 0 ? dataArray[0] : null;

      setProfile(data);

      // Jos profiilia ei ole, näytä nimimerkin asetus
      if (!data) {
        setShowNicknameModal(true);
      }

      return data;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  };

  // Magic Link -kirjautuminen
  const signInWithMagicLink = async (email) => {
    if (!supabase) {
      return { error: { message: 'Supabase ei ole konfiguroitu. Sovellus toimii demo-tilassa.' } };
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      return { error };
    } catch (error) {
      return { error };
    }
  };

  // Sähköposti + salasana -kirjautuminen
  const signInWithPassword = async (email, password) => {
    if (!supabase) {
      return { error: { message: 'Supabase ei ole konfiguroitu. Sovellus toimii demo-tilassa.' } };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      return { data, error };
    } catch (error) {
      return { error };
    }
  };

  // Rekisteröidy sähköpostilla ja salasanalla
  const signUp = async (email, password) => {
    if (!supabase) {
      return { error: { message: 'Supabase ei ole konfiguroitu. Sovellus toimii demo-tilassa.' } };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      return { data, error };
    } catch (error) {
      return { error };
    }
  };

  // Kirjaudu ulos
  const signOut = async () => {
    if (!supabase) return;

    try {
      // Käytetään scope: 'local' välttääksemme AbortError-ongelmia
      // ja varmistetaan että vain nykyinen selain kirjautuu ulos
      await supabase.auth.signOut({ scope: 'local' });
      setUser(null);
      setProfile(null);
    } catch (error) {
      // Ohitetaan AbortError, joka on yleinen Supabase SDK:n ongelma
      if (error.name !== 'AbortError') {
        console.error('Sign out error:', error);
      }
      // Varmistetaan silti että tila nollataan
      setUser(null);
      setProfile(null);
    }
  };

  // Luo profiili nimimerkillä ja lisätiedoilla - käytetään suoraa REST API kutsua
  const createProfile = async (nickname, additionalData = {}) => {
    if (!user) {
      return { error: { message: 'Kirjautuminen vaaditaan' } };
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { error: { message: 'Supabase ei ole konfiguroitu' } };
    }

    try {
      // Hae käyttäjän access token RLS-policyja varten
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token || supabaseAnonKey;

      // Tarkista nimimerkin saatavuus REST API:lla
      const checkResponse = await fetch(
        `${supabaseUrl}/rest/v1/user_profiles?nickname=ilike.${encodeURIComponent(nickname)}`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (checkResponse.ok) {
        const existing = await checkResponse.json();
        if (existing && existing.length > 0) {
          return { error: { message: 'Nimimerkki on jo käytössä' } };
        }
      }

      // Luo profiili kaikilla kentillä
      const profileData = {
        id: user.id,
        nickname: nickname.trim(),
        email: user.email,
        first_name: additionalData.first_name || null,
        last_name: additionalData.last_name || null,
        country: additionalData.country || null,
        profession: additionalData.profession || null,
        company: additionalData.company || null
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Profile creation REST error:', response.status, errorData);
        return { error: { message: errorData.message || `HTTP ${response.status}` } };
      }

      const data = await response.json();
      const createdProfile = Array.isArray(data) ? data[0] : data;

      setProfile(createdProfile);
      setShowNicknameModal(false);
      return { data: createdProfile };
    } catch (error) {
      console.error('Profile creation error:', error);
      return { error: { message: 'Profiilin luonti epäonnistui' } };
    }
  };

  // Päivitä profiili - käytetään suoraa REST API kutsua välttääksemme schema cache ongelmat
  const updateProfile = async (updates) => {
    if (!user) {
      return { error: { message: 'Kirjautuminen vaaditaan' } };
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { error: { message: 'Supabase ei ole konfiguroitu' } };
    }

    try {
      // Hae käyttäjän access token RLS-policyja varten
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token || supabaseAnonKey;

      // Käytetään suoraa REST API kutsua ohittaen SDK:n schema cache
      const response = await fetch(
        `${supabaseUrl}/rest/v1/user_profiles?id=eq.${user.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${accessToken}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(updates)
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Profile update REST error:', response.status, errorData);
        return { error: { message: errorData.message || `HTTP ${response.status}` } };
      }

      const data = await response.json();
      const updatedProfile = Array.isArray(data) ? data[0] : data;

      if (updatedProfile) {
        setProfile(updatedProfile);
      }

      return { data: updatedProfile };
    } catch (error) {
      console.error('Profile update error:', error);
      return { error: { message: 'Profiilin päivitys epäonnistui' } };
    }
  };

  // Tarkista nimimerkin saatavuus - käytetään suoraa REST API kutsua
  const checkNicknameAvailable = async (nickname) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) return true;

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/user_profiles?nickname=ilike.${encodeURIComponent(nickname)}&select=id`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`
          }
        }
      );

      if (!response.ok) return true;

      const data = await response.json();
      return !data || data.length === 0;
    } catch (error) {
      // Jos virhe, oletetaan että on saatavilla
      return true;
    }
  };

  // Modaalien ja sivujen hallinta
  const openLoginModal = () => setShowLoginModal(true);
  const closeLoginModal = () => setShowLoginModal(false);
  const openNicknameModal = () => setShowNicknameModal(true);
  const closeNicknameModal = () => setShowNicknameModal(false);
  const openProfilePage = () => setShowProfilePage(true);
  const closeProfilePage = () => setShowProfilePage(false);
  const openAdminDashboard = () => setShowAdminDashboard(true);
  const closeAdminDashboard = () => setShowAdminDashboard(false);

  // ============================================================================
  // ROOLITARKISTUSFUNKTIOT
  // ============================================================================

  // Hae käyttäjän nykyinen rooli (palauttaa 'guest' jos ei kirjautunut)
  const getUserRole = () => {
    if (!user || !profile) return ROLES.GUEST;
    return profile.role || ROLES.USER;
  };

  // Hae käyttäjän roolitaso (0-8)
  const getUserRoleLevel = () => {
    const role = getUserRole();
    return ROLE_LEVELS[role] ?? 0;
  };

  // Tarkista onko käyttäjällä tietty rooli
  const hasRole = (role) => {
    return getUserRole() === role;
  };

  // Tarkista onko käyttäjällä vähintään tietty roolitaso
  const hasMinRole = (minRole) => {
    const userLevel = getUserRoleLevel();
    const requiredLevel = ROLE_LEVELS[minRole] ?? 0;
    return userLevel >= requiredLevel;
  };

  // Alias hasMinRole-funktiolle - intuitiivisempi nimi
  const isAtLeast = (role) => hasMinRole(role);

  // Apufunktiot yleisimpiin tarkistuksiin
  const canAccessBeta = () => hasMinRole(ROLES.BETA_TESTER);
  const canDevelop = () => hasMinRole(ROLES.DEVELOPER);
  const isStaff = () => hasMinRole(ROLES.STAFF);
  const canModerate = () => hasMinRole(ROLES.MODERATOR);
  const isAdmin = () => hasMinRole(ROLES.ADMIN);
  const canManageRoles = () => hasRole(ROLES.SUPER_ADMIN);

  const value = {
    // Tila
    user,
    profile,
    loading,

    // Booleanit
    isAuthenticated: !!user,
    needsNickname: !!user && !profile,
    isDemo: !supabase,

    // Auth-funktiot
    signInWithMagicLink,
    signInWithPassword,
    signUp,
    signOut,

    // Profiili-funktiot
    createProfile,
    updateProfile,
    checkNicknameAvailable,
    refreshProfile: () => user && fetchProfile(user.id),

    // Modaalit ja sivut
    showLoginModal,
    showNicknameModal,
    showProfilePage,
    showAdminDashboard,
    openLoginModal,
    closeLoginModal,
    openNicknameModal,
    closeNicknameModal,
    openProfilePage,
    closeProfilePage,
    openAdminDashboard,
    closeAdminDashboard,

    // Roolitarkistusfunktiot
    getUserRole,
    getUserRoleLevel,
    hasRole,
    hasMinRole,
    isAtLeast,
    canAccessBeta,
    canDevelop,
    isStaff,
    canModerate,
    isAdmin,
    canManageRoles
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
