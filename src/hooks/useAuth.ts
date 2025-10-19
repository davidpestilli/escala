import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface User {
  id: string;
  email: string;
  email_confirmed_at?: string;
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há uma sessão ativa
    const getInitialSession = async () => {
      try {
        const response = await supabase.auth.getSession();
        const session = response?.data?.session;
        setUser(session?.user ?? null);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Escutar mudanças na autenticação
    try {
      const subscription = supabase.auth.onAuthStateChange(async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => {
        if (subscription?.data?.subscription?.unsubscribe) {
          subscription.data.subscription.unsubscribe();
        }
      };
    } catch (error) {
      setLoading(false);
    }
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (response.error) {
        return { error: response.error };
      }

      if (response.data?.user) {
        setUser(response.data.user);
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const response = await supabase.auth.signUp({
        email,
        password,
      });

      return { error: response.error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      // Silenciar erro
    }
  };

  const value = {
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };

  return React.createElement(
    AuthContext.Provider,
    { value: value },
    children
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};