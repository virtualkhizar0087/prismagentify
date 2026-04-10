import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import supabase from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set/clear axios auth header
  function setAxiosToken(token) {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }

  async function fetchProfile() {
    try {
      const { data } = await axios.get('/api/user/profile');
      if (data.success) setProfile(data.profile);
    } catch {
      // profile fetch failed — not critical
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setAxiosToken(session.access_token);
        fetchProfile();
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        setAxiosToken(session.access_token);
        fetchProfile();
      } else {
        setUser(null);
        setProfile(null);
        setAxiosToken(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app` },
    });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function refreshProfile() {
    await fetchProfile();
  }

  const planLimits = { free: 3, starter: 5, pro: -1, enterprise: -1 };
  const plan = profile?.plan || 'free';
  const limit = planLimits[plan] ?? 3;
  const usageToday = profile?.analyses_today || 0;
  const totalUsage = profile?.total_analyses || 0;
  const usageDisplay = plan === 'free'
    ? `${totalUsage}/3 lifetime`
    : limit === -1 ? `${usageToday} today` : `${usageToday}/${limit} today`;

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      plan, usageDisplay,
      signUp, signIn, signInWithGoogle, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
