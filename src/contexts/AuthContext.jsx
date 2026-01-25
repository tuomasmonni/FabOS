// ============================================================================
// AUTH CONTEXT - Käyttäjän autentikaatio ja profiilinhallinta
// ============================================================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);

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

  // Hae käyttäjän profiili
  const fetchProfile = async (userId) => {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = not found, se on ok uusille käyttäjille
        console.error('Profile fetch error:', error);
      }

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
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Luo profiili nimimerkillä
  const createProfile = async (nickname) => {
    if (!supabase || !user) {
      return { error: { message: 'Kirjautuminen vaaditaan' } };
    }

    try {
      // Tarkista nimimerkin saatavuus
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .ilike('nickname', nickname)
        .single();

      if (existing) {
        return { error: { message: 'Nimimerkki on jo käytössä' } };
      }

      // Luo profiili
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          nickname: nickname.trim(),
          email: user.email
        })
        .select()
        .single();

      if (error) {
        return { error };
      }

      setProfile(data);
      setShowNicknameModal(false);
      return { data };
    } catch (error) {
      return { error };
    }
  };

  // Päivitä profiili
  const updateProfile = async (updates) => {
    if (!supabase || !user) {
      return { error: { message: 'Kirjautuminen vaaditaan' } };
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return { error };
      }

      setProfile(data);
      return { data };
    } catch (error) {
      return { error };
    }
  };

  // Tarkista nimimerkin saatavuus
  const checkNicknameAvailable = async (nickname) => {
    if (!supabase) return true;

    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('id')
        .ilike('nickname', nickname)
        .single();

      return !data;
    } catch (error) {
      // Jos virhe, oletetaan että on saatavilla (PGRST116 = not found)
      return true;
    }
  };

  // Modaalien hallinta
  const openLoginModal = () => setShowLoginModal(true);
  const closeLoginModal = () => setShowLoginModal(false);
  const openNicknameModal = () => setShowNicknameModal(true);
  const closeNicknameModal = () => setShowNicknameModal(false);

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

    // Modaalit
    showLoginModal,
    showNicknameModal,
    openLoginModal,
    closeLoginModal,
    openNicknameModal,
    closeNicknameModal
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
