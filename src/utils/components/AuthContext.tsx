import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, Session, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'sc_supabase_url';
const STORAGE_KEY_KEY = 'sc_supabase_anon';

const FALLBACK_URL = 'https://aadrcdajajiqgpufixkt.supabase.co';
const FALLBACK_KEY = 'sb_publishable_a4i82ZX8uVCVN1rEhjV0Eg_E1QeOMnu';

const INITIAL_URL = localStorage.getItem(STORAGE_KEY_URL) || import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const INITIAL_KEY = localStorage.getItem(STORAGE_KEY_KEY) || import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

function createSupabaseClient(url: string, key: string) {
  if (url && key) {
    return createClient(url, key);
  }
  // Dummy client
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
      signOut: () => Promise.resolve({ error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
    from: () => ({
      insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      update: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      select: () => ({
        eq: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') }),
        select: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') }),
      }),
      delete: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    })
  } as any;
}

let globalSupabase = createSupabaseClient(INITIAL_URL, INITIAL_KEY);

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  supabase: SupabaseClient;
  updateSupabaseConfig: (url: string, key: string) => void;
}

const AuthContext = createContext<AuthContextType>({ 
  session: null, 
  loading: true, 
  supabase: globalSupabase,
  updateSupabaseConfig: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseInstance, setSupabaseInstance] = useState<SupabaseClient>(globalSupabase);

  const updateSupabaseConfig = (url: string, key: string) => {
    localStorage.setItem(STORAGE_KEY_URL, url);
    localStorage.setItem(STORAGE_KEY_KEY, key);
    const next = createSupabaseClient(url, key);
    globalSupabase = next;
    setSupabaseInstance(next);
  };

  useEffect(() => {
    // Synchronize backend if we have saved config
    const savedUrl = localStorage.getItem(STORAGE_KEY_URL);
    const savedService = localStorage.getItem('sc_supabase_service');
    if (savedUrl && savedService) {
      fetch('/api/update-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: savedUrl, key: savedService })
      }).catch(err => console.error('Failed to auto-sync backend:', err));
    }

    supabaseInstance.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabaseInstance.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabaseInstance]);

  return (
    <AuthContext.Provider value={{ session, loading, supabase: supabaseInstance, updateSupabaseConfig }}>
      {children}
    </AuthContext.Provider>
  );
};

// Proxy to ensure that components importing 'supabase' directly always get the latest instance
export const supabase = new Proxy({} as SupabaseClient, {
  get: (_target, prop: keyof SupabaseClient) => {
    return (globalSupabase as any)[prop];
  }
});

export const useAuth = () => useContext(AuthContext);
