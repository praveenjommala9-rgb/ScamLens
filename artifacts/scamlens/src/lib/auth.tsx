import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { setAuthTokenGetter } from '@workspace/api-client-react';

type AuthValue = {
  client: SupabaseClient;
  session: Session | null;
  ready: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children, url, keyValue }: { children: ReactNode; url: string; keyValue: string }) {
  const client = useMemo(() => createClient(url, keyValue, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  }), [url, keyValue]);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    setAuthTokenGetter(async () => {
      const { data } = await client.auth.getSession();
      return data.session?.access_token ?? null;
    });
    client.auth.getSession().then(({ data }) => {
      if (mounted) { setSession(data.session); setReady(true); }
    });
    const { data: listener } = client.auth.onAuthStateChange((_event, next) => {
      if (mounted) { setSession(next); setReady(true); }
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
      setAuthTokenGetter(null);
    };
  }, [client]);

  const value = useMemo<AuthValue>(() => ({
    client, session, ready, signOut: async () => { await client.auth.signOut(); },
  }), [client, session, ready]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('Authentication is not available yet.');
  return value;
}
