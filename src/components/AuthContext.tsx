import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, Session, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'sc_supabase_url';
const STORAGE_KEY_KEY = 'sc_supabase_anon';

const FALLBACK_URL = 'https://aadrcdajajiqgpufixkt.supabase.co';
const FALLBACK_KEY = 'sb_publishable_a4i82ZX8uVCVN1rEhjV0Eg_E1QeOMnu';

export function safeGetStorage(key: string): string | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

export function safeSetStorage(key: string, val: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem(key, val);
  } catch {
    // ignore
  }
}

const INITIAL_URL = safeGetStorage(STORAGE_KEY_URL) || import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const INITIAL_KEY = safeGetStorage(STORAGE_KEY_KEY) || import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

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

const STORAGE_KEY_AUTH_TOKEN = 'sc_auth_token';

interface AuthContextType {
  session: Session | null;
  authToken: string | null;
  loading: boolean;
  supabase: SupabaseClient;
  updateSupabaseConfig: (url: string, key: string) => void;
  setAuthToken: (token: string | null) => void;
  clearAuthToken: () => void;
}

const AuthContext = createContext<AuthContextType>({ 
  session: null, 
  authToken: safeGetStorage(STORAGE_KEY_AUTH_TOKEN),
  loading: true, 
  supabase: globalSupabase,
  updateSupabaseConfig: () => {},
  setAuthToken: () => {},
  clearAuthToken: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [authToken, setAuthTokenState] = useState<string | null>(() => safeGetStorage(STORAGE_KEY_AUTH_TOKEN));
  const [loading, setLoading] = useState(true);
  const [supabaseInstance, setSupabaseInstance] = useState<SupabaseClient>(globalSupabase);

  const setAuthToken = (token: string | null) => {
    setAuthTokenState(token);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (token) {
          window.localStorage.setItem(STORAGE_KEY_AUTH_TOKEN, token);
        } else {
          window.localStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
        }
      }
    } catch {
      // ignore
    }
  };

  const clearAuthToken = () => {
    setAuthToken(null);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('sc_supabase_service');
      }
    } catch {
      // ignore
    }
  };

  const updateSupabaseConfig = (url: string, key: string) => {
    safeSetStorage(STORAGE_KEY_URL, url);
    safeSetStorage(STORAGE_KEY_KEY, key);
    const next = createSupabaseClient(url, key);
    globalSupabase = next;
    setSupabaseInstance(next);
  };

  useEffect(() => {
    supabaseInstance.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.access_token) {
        setAuthToken(session.access_token);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabaseInstance.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.access_token) {
        setAuthToken(session.access_token);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabaseInstance]);

  return (
    <AuthContext.Provider value={{ session, authToken, loading, supabase: supabaseInstance, updateSupabaseConfig, setAuthToken, clearAuthToken }}>
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
